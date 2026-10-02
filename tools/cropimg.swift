import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

// Crop a region out of a photo, scale it to an exact size, flatten any
// transparency onto white, and save a small JPEG.
//   swift cropimg.swift <in> <out.jpg> <x> <y> <w> <h> <outW> <outH> [quality 0-1]
// x/y/w/h are source pixels (top-left origin) and are clamped to the image.
// Used for the energy drink tier list (assets/graphics/drinks).
let a = CommandLine.arguments
guard a.count >= 9,
      let src = CGImageSourceCreateWithURL(URL(fileURLWithPath: a[1]) as CFURL, nil),
      let img = CGImageSourceCreateImageAtIndex(src, 0, nil) else { fatalError("usage / cannot read") }
var x = Double(a[3])!, y = Double(a[4])!, w = Double(a[5])!, h = Double(a[6])!
x = max(0, min(x, Double(img.width) - 1)); y = max(0, min(y, Double(img.height) - 1))
w = min(w, Double(img.width) - x); h = min(h, Double(img.height) - y)
guard let crop = img.cropping(to: CGRect(x: x, y: y, width: w, height: h).integral) else { fatalError("crop") }
let ow = Int(a[7])!, oh = Int(a[8])!
let q = a.count > 9 ? Double(a[9])! : 0.82
guard let ctx = CGContext(data: nil, width: ow, height: oh, bitsPerComponent: 8, bytesPerRow: ow * 4,
                          space: CGColorSpaceCreateDeviceRGB(),
                          bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { fatalError("ctx") }
ctx.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1))
ctx.fill(CGRect(x: 0, y: 0, width: ow, height: oh))
ctx.interpolationQuality = .high
ctx.draw(crop, in: CGRect(x: 0, y: 0, width: ow, height: oh))
guard let out = ctx.makeImage(),
      let d = CGImageDestinationCreateWithURL(URL(fileURLWithPath: a[2]) as CFURL, UTType.jpeg.identifier as CFString, 1, nil)
      else { fatalError("out") }
CGImageDestinationAddImage(d, out, [kCGImageDestinationLossyCompressionQuality: q] as CFDictionary)
if !CGImageDestinationFinalize(d) { fatalError("finalize") }
print("\((a[2] as NSString).lastPathComponent) \(ow)x\(oh) from \(Int(w))x\(Int(h))")
