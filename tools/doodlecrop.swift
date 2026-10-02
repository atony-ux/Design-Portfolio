import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

// Cut one scribble out of a Free_Scribble_Textures sheet as an ALPHA-ONLY mask.
//   swift doodlecrop.swift <sheet.png> <x0> <y0> <x1> <y1> <out.png> [maxdim] [hex]
// The box is a rough one, in the coordinates of the sheet shown at 2000px wide
// (scale 2.925 by default). The tool trims to the actual ink inside it, pads a
// little, caps the long side at maxdim, and writes the ink in one flat colour
// (hex, default 101010) on transparency.
// The colour is baked in rather than applied with a CSS mask on purpose: masks
// are blocked on file:// pages, so masked doodles vanish when the site is
// opened straight from disk.
let a = CommandLine.arguments
guard a.count >= 7,
      let src = CGImageSourceCreateWithURL(URL(fileURLWithPath: a[1]) as CFURL, nil),
      let img = CGImageSourceCreateImageAtIndex(src, 0, nil) else { fatalError("usage / cannot read") }
let k = 2.925
let hex = a.count > 8 ? a[8] : "101010"
let rgb = Int(hex, radix: 16)!
let cr = Double((rgb >> 16) & 255), cg = Double((rgb >> 8) & 255), cb = Double(rgb & 255)
let maxDim = a.count > 7 ? Int(a[7])! : 520
let r = CGRect(x: Double(a[2])! * k, y: Double(a[3])! * k,
               width: (Double(a[4])! - Double(a[2])!) * k, height: (Double(a[5])! - Double(a[3])!) * k).integral
guard let crop = img.cropping(to: r) else { fatalError("crop") }

let w = crop.width, h = crop.height
var buf = [UInt8](repeating: 0, count: w * h * 4)
let cs = CGColorSpaceCreateDeviceRGB()
let info = CGImageAlphaInfo.premultipliedLast.rawValue
guard let ctx = CGContext(data: &buf, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4,
                          space: cs, bitmapInfo: info) else { fatalError("ctx") }
ctx.draw(crop, in: CGRect(x: 0, y: 0, width: w, height: h))
// ink bbox (buffer rows run top-down)
var minX = w, minY = h, maxX = -1, maxY = -1
for y in 0..<h { for x in 0..<w {
    let al = buf[(y * w + x) * 4 + 3]
    if al > 24 { minX = min(minX, x); maxX = max(maxX, x); minY = min(minY, y); maxY = max(maxY, y) }
    let i = (y * w + x) * 4, f = Double(al) / 255   // flat colour, alpha kept (premultiplied)
    buf[i] = UInt8(cr * f); buf[i+1] = UInt8(cg * f); buf[i+2] = UInt8(cb * f)
} }
guard maxX >= 0 else { fatalError("no ink in box") }
let pad = 8
minX = max(0, minX - pad); minY = max(0, minY - pad); maxX = min(w - 1, maxX + pad); maxY = min(h - 1, maxY + pad)
guard let ink = ctx.makeImage()?.cropping(to: CGRect(x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1))
      else { fatalError("trim") }
let s = min(1.0, Double(maxDim) / Double(max(ink.width, ink.height)))
let ow = max(1, Int((Double(ink.width) * s).rounded())), oh = max(1, Int((Double(ink.height) * s).rounded()))
guard let octx = CGContext(data: nil, width: ow, height: oh, bitsPerComponent: 8, bytesPerRow: ow * 4,
                           space: cs, bitmapInfo: info) else { fatalError("octx") }
octx.interpolationQuality = .high
octx.draw(ink, in: CGRect(x: 0, y: 0, width: ow, height: oh))
guard let out = octx.makeImage(),
      let d = CGImageDestinationCreateWithURL(URL(fileURLWithPath: a[6]) as CFURL, UTType.png.identifier as CFString, 1, nil)
      else { fatalError("out") }
CGImageDestinationAddImage(d, out, nil)
if !CGImageDestinationFinalize(d) { fatalError("finalize") }
print("\((a[6] as NSString).lastPathComponent) \(ow)x\(oh)")
