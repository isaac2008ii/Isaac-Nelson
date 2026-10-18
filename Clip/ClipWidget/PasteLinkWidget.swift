import SwiftUI
import WidgetKit

/// The big, obvious paste button used by both widgets.
struct PasteTile: View {
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: "doc.on.clipboard.fill")
                .font(.system(size: 30, weight: .semibold))
            Text("Paste link")
                .font(.subheadline.weight(.semibold))
        }
        .foregroundStyle(.white)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.blue.gradient, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
}

struct PasteEntry: TimelineEntry {
    let date: Date
}

struct PasteProvider: TimelineProvider {
    func placeholder(in context: Context) -> PasteEntry { PasteEntry(date: .now) }

    func getSnapshot(in context: Context, completion: @escaping (PasteEntry) -> Void) {
        completion(PasteEntry(date: .now))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<PasteEntry>) -> Void) {
        completion(Timeline(entries: [PasteEntry(date: .now)], policy: .never))
    }
}

struct PasteLinkWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "PasteLink", provider: PasteProvider()) { _ in
            PasteLinkWidgetView()
        }
        .configurationDisplayName("Paste Link")
        .description("Copy a link in Instagram, then tap to save it to your Clip inbox.")
        .supportedFamilies([.systemSmall, .accessoryCircular])
    }
}

struct PasteLinkWidgetView: View {
    @Environment(\.widgetFamily) private var family

    var body: some View {
        Group {
            if family == .accessoryCircular {
                ZStack {
                    AccessoryWidgetBackground()
                    Image(systemName: "doc.on.clipboard")
                        .font(.title2)
                }
                .containerBackground(.clear, for: .widget)
            } else {
                VStack(spacing: 10) {
                    Image(systemName: "doc.on.clipboard.fill")
                        .font(.system(size: 44, weight: .semibold))
                    Text("Paste link")
                        .font(.headline)
                }
                .foregroundStyle(.white)
                .containerBackground(Color.blue.gradient, for: .widget)
            }
        }
        .widgetURL(Route.paste.url)
    }
}

#Preview(as: .systemSmall) {
    PasteLinkWidget()
} timeline: {
    PasteEntry(date: .now)
}
