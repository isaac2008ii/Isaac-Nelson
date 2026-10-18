import Foundation
import SwiftData

/// A link or idea dropped into the inbox, waiting to become a video.
@Model
final class InboxItem {
    var id: UUID = UUID()
    var link: String = ""
    var note: String = ""
    var createdAt: Date = Date()

    init(link: String = "", note: String = "") {
        self.link = link
        self.note = note
        self.createdAt = .now
    }
}

enum VideoStatus: String, CaseIterable, Identifiable {
    case idea, filming, editing, posted

    var id: String { rawValue }
    var label: String { rawValue.capitalized }

    var symbol: String {
        switch self {
        case .idea: "lightbulb"
        case .filming: "video"
        case .editing: "scissors"
        case .posted: "checkmark.circle"
        }
    }
}

/// A video card: the linked audio/inspo, a shot list and notes.
@Model
final class Video {
    var id: UUID = UUID()
    var title: String = ""
    var link: String = ""
    var notes: String = ""
    var statusRaw: String = VideoStatus.idea.rawValue
    /// The pinned video is the one the widget shows.
    var isPinned: Bool = false
    var createdAt: Date = Date()

    @Relationship(deleteRule: .cascade, inverse: \Shot.video)
    var shots: [Shot] = []

    init(title: String = "", link: String = "", notes: String = "") {
        self.title = title
        self.link = link
        self.notes = notes
        self.createdAt = .now
    }

    var status: VideoStatus {
        get { VideoStatus(rawValue: statusRaw) ?? .idea }
        set { statusRaw = newValue.rawValue }
    }

    var displayTitle: String { title.isEmpty ? "Untitled video" : title }
    var orderedShots: [Shot] { shots.sorted { $0.order < $1.order } }
    var shotsLeft: Int { shots.filter { !$0.isDone }.count }
}

@Model
final class Shot {
    var id: UUID = UUID()
    var text: String = ""
    var isDone: Bool = false
    var order: Int = 0
    var video: Video?

    init(text: String, order: Int) {
        self.text = text
        self.order = order
    }
}
