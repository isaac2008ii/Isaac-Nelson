import SwiftUI
import WidgetKit

struct VideoSnapshot {
    let id: UUID
    let title: String
    let status: VideoStatus
    let shotsLeft: Int
    let totalShots: Int
    let nextShot: String?

    static let sample = VideoSnapshot(
        id: UUID(), title: "Morning coffee routine", status: .filming,
        shotsLeft: 4, totalShots: 7, nextShot: "Close-up: pouring the latte"
    )
}

struct CurrentVideoEntry: TimelineEntry {
    let date: Date
    let video: VideoSnapshot?
}

struct CurrentVideoProvider: TimelineProvider {
    func placeholder(in context: Context) -> CurrentVideoEntry {
        CurrentVideoEntry(date: .now, video: .sample)
    }

    func getSnapshot(in context: Context, completion: @escaping (CurrentVideoEntry) -> Void) {
        let video = loadPinnedVideo()
        completion(CurrentVideoEntry(date: .now, video: video ?? (context.isPreview ? .sample : nil)))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<CurrentVideoEntry>) -> Void) {
        // The app reloads the widget whenever something changes, so no scheduled refresh is needed.
        completion(Timeline(entries: [CurrentVideoEntry(date: .now, video: loadPinnedVideo())], policy: .never))
    }

    private func loadPinnedVideo() -> VideoSnapshot? {
        guard let saved = WidgetSnapshotStore.read() else { return nil }
        return VideoSnapshot(
            id: saved.id,
            title: saved.title,
            status: VideoStatus(rawValue: saved.statusRaw) ?? .idea,
            shotsLeft: saved.shotsLeft,
            totalShots: saved.totalShots,
            nextShot: saved.nextShot
        )
    }
}

struct CurrentVideoWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "CurrentVideo", provider: CurrentVideoProvider()) { entry in
            CurrentVideoWidgetView(entry: entry)
                .containerBackground(.background, for: .widget)
        }
        .configurationDisplayName("Current Video")
        .description("Your starred video and how many shots are left. The medium size adds a Paste Link button.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct CurrentVideoWidgetView: View {
    let entry: CurrentVideoEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        if family == .systemMedium {
            HStack(spacing: 14) {
                Link(destination: videoURL) { info }
                Link(destination: Route.paste.url) { PasteTile() }
                    .frame(width: 110)
            }
        } else {
            info.widgetURL(videoURL)
        }
    }

    private var videoURL: URL {
        entry.video.map { Route.video($0.id).url } ?? URL(string: "clip://")!
    }

    @ViewBuilder private var info: some View {
        if let video = entry.video {
            VStack(alignment: .leading, spacing: 4) {
                Label(video.status.label, systemImage: video.status.symbol)
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(.secondary)
                Text(video.title)
                    .font(.headline)
                    .lineLimit(family == .systemMedium ? 2 : 3)
                Spacer(minLength: 0)
                shotsSummary(video)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        } else {
            VStack(alignment: .leading, spacing: 4) {
                Image(systemName: "star")
                    .font(.title2)
                    .foregroundStyle(.tint)
                Spacer(minLength: 0)
                Text(ClipStore.isShared ? "No video starred" : "Finish setup")
                    .font(.headline)
                Text(ClipStore.isShared ? "Star a video in Clip to see it here." : "Turn on App Groups in Xcode so the widget can see Clip.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        }
    }

    @ViewBuilder private func shotsSummary(_ video: VideoSnapshot) -> some View {
        if video.totalShots == 0 {
            Text("No shots yet")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        } else if video.shotsLeft == 0 {
            Label("All shots done", systemImage: "checkmark.circle.fill")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.green)
        } else {
            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Text("\(video.shotsLeft)")
                    .font(.system(size: 34, weight: .bold, design: .rounded))
                    .contentTransition(.numericText())
                Text(video.shotsLeft == 1 ? "shot left" : "shots left")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            if family == .systemMedium, let next = video.nextShot {
                Text("Next: \(next)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
        }
    }
}

#Preview(as: .systemSmall) {
    CurrentVideoWidget()
} timeline: {
    CurrentVideoEntry(date: .now, video: .sample)
    CurrentVideoEntry(date: .now, video: nil)
}

#Preview(as: .systemMedium) {
    CurrentVideoWidget()
} timeline: {
    CurrentVideoEntry(date: .now, video: .sample)
}
