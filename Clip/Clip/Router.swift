import SwiftUI

/// App-wide navigation state, so widget deep links can jump to the right place.
@Observable
final class Router {
    enum Tab: Hashable { case inbox, videos }

    var tab: Tab = .inbox
    var videoPath: [Video] = []
    /// Set when a link was just saved, so the inbox opens it for a quick note.
    var justSaved: InboxItem?
    var toast: String?

    func show(_ video: Video) {
        tab = .videos
        videoPath = [video]
    }
}
