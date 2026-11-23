// Save frames of a video as PNGs at given times (seconds), exact frames.
//   swiftc -O tools/frames.swift -o /tmp/frames
//   /tmp/frames <video> <out-prefix> <t,t,...>     -> <out-prefix>-0.png, -1.png, ...
import AVFoundation
import AppKit
let a = CommandLine.arguments
guard a.count == 4 else { print("usage: frames <video> <out-prefix> <t,t,...>"); exit(2) }
let gen = AVAssetImageGenerator(asset: AVURLAsset(url: URL(fileURLWithPath: a[1])))
gen.appliesPreferredTrackTransform = true
gen.requestedTimeToleranceBefore = .zero; gen.requestedTimeToleranceAfter = .zero
for (i, t) in a[3].split(separator: ",").enumerated() {
  let img = try! gen.copyCGImage(at: CMTime(seconds: Double(t)!, preferredTimescale: 600), actualTime: nil)
  let rep = NSBitmapImageRep(cgImage: img)
  try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: "\(a[2])-\(i).png"))
}
