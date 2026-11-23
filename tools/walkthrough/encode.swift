// Frames (JPEG/PNG, sorted by name) -> H.264 MP4 via AVFoundation (no ffmpeg).
//   swiftc -O tools/walkthrough/encode.swift -o /tmp/encode
//   /tmp/encode <frames-dir> <out.mp4> <fps> <width> <height> <kbps>
import AVFoundation
import AppKit
let a = CommandLine.arguments
guard a.count == 7, let fps = Int32(a[3]), let W = Int(a[4]), let H = Int(a[5]), let kbps = Int(a[6]) else { print("usage"); exit(2) }
let files = try! FileManager.default.contentsOfDirectory(atPath: a[1]).filter { $0.hasSuffix(".jpg") || $0.hasSuffix(".png") }.sorted()
let out = URL(fileURLWithPath: a[2]); try? FileManager.default.removeItem(at: out)
let w = try! AVAssetWriter(outputURL: out, fileType: .mp4)
w.shouldOptimizeForNetworkUse = true
let input = AVAssetWriterInput(mediaType: .video, outputSettings: [
  AVVideoCodecKey: AVVideoCodecType.h264, AVVideoWidthKey: W, AVVideoHeightKey: H,
  AVVideoCompressionPropertiesKey: [AVVideoAverageBitRateKey: kbps * 1000, AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
    AVVideoMaxKeyFrameIntervalKey: Int(fps) * 2]])
input.expectsMediaDataInRealTime = false
let ad = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: [
  kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32ARGB, kCVPixelBufferWidthKey as String: W, kCVPixelBufferHeightKey as String: H])
w.add(input); w.startWriting(); w.startSession(atSourceTime: .zero)
for (i, f) in files.enumerated() {
  autoreleasepool {
    let img = NSImage(contentsOfFile: a[1] + "/" + f)!
    var rect = CGRect(x: 0, y: 0, width: W, height: H)
    let cg = img.cgImage(forProposedRect: &rect, context: nil, hints: nil)!
    var pb: CVPixelBuffer?; CVPixelBufferPoolCreatePixelBuffer(nil, ad.pixelBufferPool!, &pb)
    CVPixelBufferLockBaseAddress(pb!, [])
    let ctx = CGContext(data: CVPixelBufferGetBaseAddress(pb!), width: W, height: H, bitsPerComponent: 8, bytesPerRow: CVPixelBufferGetBytesPerRow(pb!),
      space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue)!
    ctx.interpolationQuality = .high; ctx.draw(cg, in: CGRect(x: 0, y: 0, width: W, height: H))
    CVPixelBufferUnlockBaseAddress(pb!, [])
    while !input.isReadyForMoreMediaData { usleep(2000) }
    ad.append(pb!, withPresentationTime: CMTime(value: CMTimeValue(i), timescale: fps))
  }
}
input.markAsFinished()
let s = DispatchSemaphore(value: 0); w.finishWriting { s.signal() }; s.wait()
print(w.status == .completed ? "ok \(files.count) frames" : "failed \(String(describing: w.error))")
