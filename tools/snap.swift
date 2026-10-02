// Render a local HTML file to a PNG at an exact viewport size, 2x for crispness.
// usage: swift snap.swift <in.html> <out.png> <width> <height>
import Cocoa
import WebKit

let a = CommandLine.arguments
guard a.count >= 5 else { fputs("usage: snap.swift in.html out.png w h\n", stderr); exit(2) }
let inURL  = URL(fileURLWithPath: a[1])
let outURL = URL(fileURLWithPath: a[2])
let W = Double(a[3])!, H = Double(a[4])!

let app = NSApplication.shared
app.setActivationPolicy(.accessory)

let cfg = WKWebViewConfiguration()
let web = WKWebView(frame: NSRect(x: 0, y: 0, width: W, height: H), configuration: cfg)
web.setValue(false, forKey: "drawsBackground")

final class Nav: NSObject, WKNavigationDelegate {
    var loaded = false
    func webView(_ w: WKWebView, didFinish n: WKNavigation!) { loaded = true }
    func webView(_ w: WKWebView, didFail n: WKNavigation!, withError e: Error) {
        fputs("load failed: \(e)\n", stderr); exit(1)
    }
}
let nav = Nav()
web.navigationDelegate = nav
web.loadFileURL(inURL, allowingReadAccessTo: inURL.deletingLastPathComponent())

// wait for load
let loadDeadline = Date().addingTimeInterval(25)
while !nav.loaded && Date() < loadDeadline {
    RunLoop.current.run(mode: .default, before: Date().addingTimeInterval(0.05))
}
guard nav.loaded else { fputs("timed out loading\n", stderr); exit(1) }

// let webfonts + images settle
let settle = Date().addingTimeInterval(3.5)
while Date() < settle {
    RunLoop.current.run(mode: .default, before: Date().addingTimeInterval(0.05))
}

let snapCfg = WKSnapshotConfiguration()
snapCfg.rect = NSRect(x: 0, y: 0, width: W, height: H)
snapCfg.snapshotWidth = NSNumber(value: W)   // display is retina; this lands ~2x

var finished = false
web.takeSnapshot(with: snapCfg) { image, err in
    defer { finished = true }
    guard let image = image else { fputs("snapshot failed: \(String(describing: err))\n", stderr); exit(1) }
    guard let tiff = image.tiffRepresentation,
          let rep = NSBitmapImageRep(data: tiff),
          let png = rep.representation(using: .png, properties: [:]) else {
        fputs("encode failed\n", stderr); exit(1)
    }
    do { try png.write(to: outURL); print("wrote \(outURL.path) (\(rep.pixelsWide)x\(rep.pixelsHigh))") }
    catch { fputs("write failed: \(error)\n", stderr); exit(1) }
}
let snapDeadline = Date().addingTimeInterval(20)
while !finished && Date() < snapDeadline {
    RunLoop.current.run(mode: .default, before: Date().addingTimeInterval(0.05))
}
exit(finished ? 0 : 1)
