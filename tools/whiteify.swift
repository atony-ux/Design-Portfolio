import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

// Recolour the blue line-art mascot for use on a SOLID BLUE ground:
//   dark/blue linework -> white (keep alpha)
//   white filled interiors -> fully transparent, so the blue ground shows
// Result: clean white line art instead of a white blob on blue.
let args = CommandLine.arguments
guard args.count >= 3,
      let src = CGImageSourceCreateWithURL(URL(fileURLWithPath: args[1]) as CFURL, nil),
      let img = CGImageSourceCreateImageAtIndex(src, 0, nil) else { fatalError("cannot read input") }

let w = img.width, h = img.height
var buf = [UInt8](repeating: 0, count: w * h * 4)
let cs = CGColorSpaceCreateDeviceRGB()
guard let ctx = CGContext(data: &buf, width: w, height: h, bitsPerComponent: 8,
                          bytesPerRow: w * 4, space: cs,
                          bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { fatalError("ctx") }
ctx.draw(img, in: CGRect(x: 0, y: 0, width: w, height: h))

for i in stride(from: 0, to: buf.count, by: 4) {
    let a = Double(buf[i+3])
    if a < 8 { buf[i]=0; buf[i+1]=0; buf[i+2]=0; buf[i+3]=0; continue }
    // un-premultiply to judge the real colour
    let r = Double(buf[i])   / a
    let g = Double(buf[i+1]) / a
    let b = Double(buf[i+2]) / a
    let lum = 0.2126*r + 0.7152*g + 0.0722*b      // 0..1
    if lum > 0.62 {
        buf[i]=0; buf[i+1]=0; buf[i+2]=0; buf[i+3]=0   // drop the light fill
    } else {
        let al = UInt8(a)
        buf[i]=al; buf[i+1]=al; buf[i+2]=al; buf[i+3]=al  // white, premultiplied
    }
}
guard let out = ctx.makeImage() else { fatalError("out") }
let dst = URL(fileURLWithPath: args[2])
guard let w2 = CGImageDestinationCreateWithURL(dst as CFURL, UTType.png.identifier as CFString, 1, nil) else { fatalError("dest") }
CGImageDestinationAddImage(w2, out, nil)
if !CGImageDestinationFinalize(w2) { fatalError("finalize") }
print("wrote \(dst.path) (\(w)x\(h))")
