import Foundation
import SwiftData
import WidgetKit

extension ModelContext {
    /// Saves now (the widget reads from disk) and asks the widgets to redraw.
    func saveAndRefresh() {
        try? save()
        WidgetCenter.shared.reloadAllTimelines()
    }
}

enum Actions {
    enum SaveResult {
        case saved(InboxItem)
        case duplicate(InboxItem)
        case noLink
    }

    /// Saves the first link found in `text` to the inbox.
    static func saveLink(from text: String, in context: ModelContext) -> SaveResult {
        guard let url = LinkParser.firstURL(in: text) else { return .noLink }
        let link = url.absoluteString
        let existing = try? context.fetch(FetchDescriptor<InboxItem>(predicate: #Predicate<InboxItem> { $0.link == link }))
        if let item = existing?.first { return .duplicate(item) }
        let item = InboxItem(link: link)
        context.insert(item)
        context.saveAndRefresh()
        return .saved(item)
    }

    /// Saves a typed or dictated idea. If it contains a link, the link is saved with the rest as the note.
    @discardableResult
    static func addIdea(_ text: String, in context: ModelContext) -> InboxItem? {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return nil }
        let item: InboxItem
        if let url = LinkParser.firstURL(in: trimmed) {
            let note = trimmed.replacingOccurrences(of: url.absoluteString, with: "")
                .trimmingCharacters(in: .whitespacesAndNewlines)
            item = InboxItem(link: url.absoluteString, note: note)
        } else {
            item = InboxItem(note: trimmed)
        }
        context.insert(item)
        context.saveAndRefresh()
        return item
    }

    /// Turns an inbox item into a video card.
    static func promote(_ item: InboxItem, in context: ModelContext) -> Video {
        let note = item.note.trimmingCharacters(in: .whitespacesAndNewlines)
        // Short notes make a good title; long ones are better kept as notes to turn into shots.
        let isShort = note.count <= 60 && !note.contains("\n")
        let video = Video(title: isShort ? note : "", link: item.link, notes: isShort ? "" : note)
        context.insert(video)
        context.delete(item)
        pinIfNothingPinned(video, in: context)
        context.saveAndRefresh()
        return video
    }

    static func newVideo(shots: [String] = [], in context: ModelContext) -> Video {
        let video = Video()
        context.insert(video)
        addShots(shots, to: video, in: context)
        pinIfNothingPinned(video, in: context)
        context.saveAndRefresh()
        return video
    }

    /// Only one video is pinned at a time: it's the one the widget shows.
    static func setPinned(_ video: Video, _ pinned: Bool, in context: ModelContext) {
        if pinned {
            let others = (try? context.fetch(FetchDescriptor<Video>(predicate: #Predicate<Video> { $0.isPinned == true }))) ?? []
            for other in others { other.isPinned = false }
        }
        video.isPinned = pinned
        context.saveAndRefresh()
    }

    static func addShots(_ texts: [String], to video: Video, in context: ModelContext) {
        var next = (video.shots.map(\.order).max() ?? -1) + 1
        for text in texts {
            let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !trimmed.isEmpty else { continue }
            let shot = Shot(text: trimmed, order: next)
            context.insert(shot)
            video.shots.append(shot)
            next += 1
        }
        context.saveAndRefresh()
    }

    static func delete(_ shot: Shot, from video: Video, in context: ModelContext) {
        video.shots.removeAll { $0.id == shot.id }
        context.delete(shot)
        context.saveAndRefresh()
    }

    static func delete(_ video: Video, in context: ModelContext) {
        context.delete(video)
        context.saveAndRefresh()
    }

    private static func pinIfNothingPinned(_ video: Video, in context: ModelContext) {
        let pinned = (try? context.fetchCount(FetchDescriptor<Video>(predicate: #Predicate<Video> { $0.isPinned == true }))) ?? 0
        if pinned == 0 { video.isPinned = true }
    }
}
