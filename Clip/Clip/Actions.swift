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
            item = InboxItem(note: trimmed, purpose: .idea)
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

    /// "Add to a video": attaches the link (and note) to an existing video and clears it from the inbox.
    static func attach(_ item: InboxItem, to video: Video, in context: ModelContext) {
        if !item.link.isEmpty { addLink(item.link, to: video) }
        let note = item.note.trimmingCharacters(in: .whitespacesAndNewlines)
        if !note.isEmpty {
            video.notes = video.notes.isEmpty ? note : video.notes + "\n" + note
        }
        context.delete(item)
        context.saveAndRefresh()
    }

    static func addLink(_ link: String, to video: Video) {
        guard !video.allLinks.contains(link) else { return }
        if video.link.isEmpty {
            video.link = link
        } else {
            video.extraLinks.append(link)
        }
    }

    static func removeLink(_ link: String, from video: Video, in context: ModelContext) {
        if video.link == link {
            video.link = video.extraLinks.isEmpty ? "" : video.extraLinks.removeFirst()
        } else {
            video.extraLinks.removeAll { $0 == link }
        }
        context.saveAndRefresh()
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
        video.isPinned = pinned
        if pinned {
            // Filter in memory: a predicate fetch can miss changes that haven't been saved yet.
            let all = (try? context.fetch(FetchDescriptor<Video>())) ?? []
            for other in all where other.id != video.id && other.isPinned {
                other.isPinned = false
            }
        }
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
