import Foundation

enum LinkParser {
    /// The first URL found in a piece of text (Instagram's "Copy link" sometimes adds extra text).
    static func firstURL(in text: String) -> URL? {
        guard let detector = try? NSDataDetector(types: NSTextCheckingResult.CheckingType.link.rawValue) else {
            return nil
        }
        let range = NSRange(text.startIndex..., in: text)
        return detector.firstMatch(in: text, options: [], range: range)?.url
    }

    static func kind(for link: String) -> String {
        guard let url = URL(string: link) else { return "Link" }
        let host = url.host ?? ""
        let path = url.path.lowercased()
        guard host.contains("instagram.com") else { return host.isEmpty ? "Link" : host }
        if path.contains("/audio/") { return "Instagram audio" }
        if path.hasPrefix("/reel") { return "Instagram reel" }
        if path.hasPrefix("/p/") { return "Instagram post" }
        return "Instagram"
    }

    static func symbol(for link: String) -> String {
        let path = URL(string: link)?.path.lowercased() ?? ""
        if path.contains("/audio/") { return "music.note" }
        if path.hasPrefix("/reel") { return "play.rectangle" }
        if path.hasPrefix("/p/") { return "photo" }
        return "link"
    }
}
