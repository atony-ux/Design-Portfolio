// Lift the main subject out of a photo (Apple Vision's "lift subject", macOS 14+)
// and save it as a PNG with a transparent background, cropped to the subject.
//   swiftc -O tools/cutout.swift -o /tmp/cutout
//   /tmp/cutout <in.jpg> <out.png>
// Used for the hit box photo in Studio (assets/graphics/play/hit-box*).
import Foundation
import Vision
import CoreImage
import CoreImage.CIFilterBuiltins

let a = CommandLine.arguments
guard a.count == 3, let input = CIImage(contentsOf: URL(fileURLWithPath: a[1])) else {
    print("usage: cutout <in> <out.png>"); exit(2)
}
let req = VNGenerateForegroundInstanceMaskRequest()
let handler = VNImageRequestHandler(ciImage: input)
do {
    try handler.perform([req])
    guard let obs = req.results?.first else { print("no subject found"); exit(1) }
    let buf = try obs.generateMaskedImage(ofInstances: obs.allInstances, from: handler, croppedToInstancesExtent: true)
    let img = CIImage(cvPixelBuffer: buf)
    let ctx = CIContext()
    try ctx.writePNGRepresentation(of: img, to: URL(fileURLWithPath: a[2]), format: .RGBA8,
                                   colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!)
    print("ok \(Int(img.extent.width))x\(Int(img.extent.height))")
} catch { print("error:", error); exit(1) }
