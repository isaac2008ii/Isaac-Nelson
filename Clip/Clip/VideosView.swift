import SwiftUI
import SwiftData

struct VideosView: View {
    @Environment(Router.self) private var router
    @Environment(\.modelContext) private var context
    @Query(sort: \Video.createdAt, order: .reverse) private var videos: [Video]

    @State private var showingWriter = false

    var body: some View {
        @Bindable var router = router
        NavigationStack(path: $router.videoPath) {
            List {
                if let current = videos.first(where: \.isPinned) {
                    Section("On your widget") { row(current) }
                }
                ForEach(VideoStatus.allCases) { status in
                    let group = videos.filter { $0.status == status && !$0.isPinned }
                    if !group.isEmpty {
                        Section(status.label) {
                            ForEach(group) { row($0) }
                        }
                    }
                }
            }
            .overlay {
                if videos.isEmpty {
                    ContentUnavailableView {
                        Label("No videos yet", systemImage: "film.stack")
                    } description: {
                        Text("Tap + to start one, or swipe right on an inbox item.")
                    }
                }
            }
            .navigationTitle("Videos")
            .navigationDestination(for: Video.self) { VideoDetailView(video: $0) }
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Menu {
                        Button { router.show(Actions.newVideo(in: context)) } label: {
                            Label("Blank video", systemImage: "square.and.pencil")
                        }
                        Button { showingWriter = true } label: {
                            Label("Write it out → shot list", systemImage: "wand.and.stars")
                        }
                    } label: {
                        Image(systemName: "plus")
                    } primaryAction: {
                        router.show(Actions.newVideo(in: context))
                    }
                }
            }
            .sheet(isPresented: $showingWriter) {
                ShotWriterSheet { shots in
                    let video = Actions.newVideo(shots: shots, in: context)
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) { router.show(video) }
                }
            }
        }
    }

    private func row(_ video: Video) -> some View {
        NavigationLink(value: video) {
            VideoRow(video: video)
        }
        .swipeActions(edge: .leading) {
            Button {
                Actions.setPinned(video, !video.isPinned, in: context)
            } label: {
                Label(video.isPinned ? "Unpin" : "Pin to widget", systemImage: video.isPinned ? "star.slash" : "star")
            }
            .tint(.yellow)
        }
        .swipeActions(edge: .trailing) {
            Button(role: .destructive) {
                Actions.delete(video, in: context)
            } label: { Label("Delete", systemImage: "trash") }
        }
    }
}

private struct VideoRow: View {
    let video: Video

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 3) {
                HStack(spacing: 6) {
                    if video.isPinned {
                        Image(systemName: "star.fill").foregroundStyle(.yellow).font(.caption)
                    }
                    Text(video.displayTitle)
                        .foregroundStyle(video.title.isEmpty ? .secondary : .primary)
                        .lineLimit(2)
                }
                Text(progress)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            if !video.link.isEmpty {
                Image(systemName: LinkParser.symbol(for: video.link))
                    .foregroundStyle(.secondary)
            }
        }
    }

    private var progress: String {
        let total = video.shots.count
        if total == 0 { return "No shots yet" }
        let left = video.shotsLeft
        return left == 0 ? "All \(total) shots done" : "\(left) of \(total) shots left"
    }
}
