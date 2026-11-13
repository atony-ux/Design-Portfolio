// Re-encode a video for the web: H.264, no audio, scaled to fit a max size, at a set bitrate,
// with the moov atom up front (fast start), so it can autoplay muted and loop without a heavy download.
// Uses macOS's own AVFoundation (no ffmpeg needed).
//   swiftc -O tools/webvideo.swift -o /tmp/webvideo
//   /tmp/webvideo <in.mp4> <out.mp4> <max-side-px> <kbps>
import AVFoundation
import Foundation

let args = CommandLine.arguments
guard args.count == 5, let maxSide = Double(args[3]), let kbps = Int(args[4]) else {
    print("usage: webvideo <in> <out> <max-side-px> <kbps>"); exit(2)
}
let inURL = URL(fileURLWithPath: args[1]), outURL = URL(fileURLWithPath: args[2])
try? FileManager.default.removeItem(at: outURL)

let asset = AVURLAsset(url: inURL)
let sema = DispatchSemaphore(value: 0)
var failed = false

Task {
    do {
        guard let track = try await asset.loadTracks(withMediaType: .video).first else { print("no video track"); failed = true; sema.signal(); return }
        let natural = try await track.load(.naturalSize)
        let transform = try await track.load(.preferredTransform)
        let shown = natural.applying(transform)
        let w0 = abs(shown.width), h0 = abs(shown.height)
        let scale = min(1, maxSide / max(w0, h0))
        // even numbers for H.264
        let w = Int((w0 * scale / 2).rounded()) * 2, h = Int((h0 * scale / 2).rounded()) * 2
        let fps = try await track.load(.nominalFrameRate)

        let reader = try AVAssetReader(asset: asset)
        // decode at the source size; the writer below scales to w x h (aspect kept)
        let out = AVAssetReaderTrackOutput(track: track, outputSettings: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA])
        out.alwaysCopiesSampleData = false
        reader.add(out)
        _ = fps

        let writer = try AVAssetWriter(outputURL: outURL, fileType: .mp4)
        writer.shouldOptimizeForNetworkUse = true
        // w x h are the DISPLAYED size; for a rotated source, encode in its own orientation
        let rotated = abs(transform.b) == 1 && abs(transform.c) == 1
        let input = AVAssetWriterInput(mediaType: .video, outputSettings: [
            AVVideoCodecKey: AVVideoCodecType.h264,
            AVVideoWidthKey: rotated ? h : w, AVVideoHeightKey: rotated ? w : h,
            AVVideoScalingModeKey: AVVideoScalingModeResizeAspect,
            AVVideoCompressionPropertiesKey: [
                AVVideoAverageBitRateKey: kbps * 1000,
                AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
                AVVideoMaxKeyFrameIntervalKey: 60,
            ],
        ])
        input.expectsMediaDataInRealTime = false
        input.transform = transform
        writer.add(input)
        guard reader.startReading() else { print("reader failed:", reader.error as Any); failed = true; sema.signal(); return }
        writer.startWriting(); writer.startSession(atSourceTime: .zero)
        let q = DispatchQueue(label: "enc")
        input.requestMediaDataWhenReady(on: q) {
            _ = reader   // keep the reader alive: released early, its output stops working
            while input.isReadyForMoreMediaData {
                if let buf = out.copyNextSampleBuffer() { input.append(buf) }
                else {
                    input.markAsFinished()
                    writer.finishWriting {
                        if writer.status != .completed { print("write failed:", writer.error as Any); failed = true }
                        else { print("ok \(w)x\(h) @ \(kbps)kbps") }
                        sema.signal()
                    }
                    return
                }
            }
        }
    } catch { print("error:", error); failed = true; sema.signal() }
}
sema.wait()
exit(failed ? 1 : 0)
