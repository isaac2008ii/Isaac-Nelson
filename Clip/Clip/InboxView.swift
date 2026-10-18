import SwiftUI
import SwiftData

struct InboxView: View {
    @Environment(Router.self) private var router
    @Environment(\.modelContext) private var context
    @Query(sort: \InboxItem.createdAt, order: .reverse) private var items: [InboxItem]

    @State private var draft = ""
    @State private var selected: InboxItem?
    @State private var selectedIsNew = false
    @FocusState private var composerFocused: Bool

    var body: some View {
        NavigationStack {
            List {
                Section {
                    HStack {
                        TextField("Type or dictate an idea", text: $draft)
                            .focused($composerFocused)
                            .submitLabel(.done)
                            .onSubmit(addDraft)
                        PasteButton(payloadType: String.self) { strings in
                            DispatchQueue.main.async { paste(strings.first ?? "") }
                        }
                        .labelStyle(.titleAndIcon)
                        .buttonBorderShape(.capsule)
                    }
                } footer: {
                    Text("Copy a link in Instagram (Share → Copy link), then tap Paste.")
                }

                section("Unsorted", items: items.filter { $0.purpose == nil })
                ForEach(InboxPurpose.allCases) { purpose in
                    section(purpose.sectionTitle, items: items.filter { $0.purpose == purpose })
                }
            }
            .overlay {
                if items.isEmpty && !composerFocused {
                    ContentUnavailableView(
                        "Inbox is empty",
                        systemImage: "tray",
                        description: Text("Save Instagram audios and ideas here. Turn them into videos when you're ready.")
                    )
                    .allowsHitTesting(false)
                }
            }
            .navigationTitle("Inbox")
            .sheet(item: $selected) { item in
                InboxItemSheet(
                    item: item,
                    justSaved: selectedIsNew,
                    onSort: { sort(item, as: $0) },
                    onAddToVideo: { attach(item, to: $0) },
                    onMakeVideo: { finish { makeVideo(item) } }
                )
            }
            .onAppear(perform: openJustSaved)
            .onChange(of: router.justSaved?.id) { openJustSaved() }
        }
    }

    @ViewBuilder
    private func section(_ title: String, items: [InboxItem]) -> some View {
        if !items.isEmpty {
            Section(title) {
                ForEach(items) { item in
                    Button {
                        open(item, isNew: false)
                    } label: {
                        InboxRow(item: item)
                    }
                    .swipeActions(edge: .leading) {
                        Button { makeVideo(item) } label: { Label("Make video", systemImage: "film") }
                            .tint(.blue)
                    }
                    .swipeActions(edge: .trailing) {
                        Button(role: .destructive) {
                            context.delete(item)
                            context.saveAndRefresh()
                        } label: { Label("Delete", systemImage: "trash") }
                    }
                    .contextMenu {
                        ForEach(InboxPurpose.allCases) { purpose in
                            Button { sort(item, as: purpose) } label: {
                                Label("Move to \(purpose.sectionTitle)", systemImage: purpose.symbol)
                            }
                        }
                    }
                }
            }
        }
    }

    private func addDraft() {
        if let item = Actions.addIdea(draft, in: context), !item.link.isEmpty {
            open(item, isNew: true)
        }
        draft = ""
    }

    private func paste(_ text: String) {
        switch Actions.saveLink(from: text, in: context) {
        case .saved(let item): open(item, isNew: true)
        case .duplicate: withAnimation { router.toast = "Already in your inbox" }
        case .noLink:
            // Not a link: keep it as a written idea.
            Actions.addIdea(text, in: context)
        }
    }

    private func open(_ item: InboxItem, isNew: Bool) {
        selectedIsNew = isNew
        selected = item
    }

    private func openJustSaved() {
        guard let item = router.justSaved else { return }
        router.justSaved = nil
        open(item, isNew: true)
    }

    private func sort(_ item: InboxItem, as purpose: InboxPurpose) {
        item.purpose = purpose
        context.saveAndRefresh()
        selected = nil
        withAnimation { router.toast = "Saved to \(purpose.sectionTitle)" }
    }

    private func attach(_ item: InboxItem, to video: Video) {
        let title = video.displayTitle
        finish {
            Actions.attach(item, to: video, in: context)
            withAnimation { router.toast = "Added to \(title)" }
        }
    }

    /// Closes the sheet, then runs `action` once it's gone (the item may be deleted, which the open sheet can't survive).
    private func finish(_ action: @escaping () -> Void) {
        selected = nil
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.4, execute: action)
    }

    private func makeVideo(_ item: InboxItem) {
        let video = Actions.promote(item, in: context)
        router.show(video)
    }
}

private struct InboxRow: View {
    let item: InboxItem

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: symbol)
                .font(.title3)
                .foregroundStyle(.tint)
                .frame(width: 28)
            VStack(alignment: .leading, spacing: 3) {
                if item.link.isEmpty {
                    Text(item.note).foregroundStyle(.primary).lineLimit(3)
                } else {
                    Text(LinkParser.kind(for: item.link)).foregroundStyle(.primary)
                    if !item.note.isEmpty {
                        Text(item.note).font(.subheadline).foregroundStyle(.secondary).lineLimit(2)
                    }
                }
                Text(item.createdAt, format: .relative(presentation: .named))
                    .font(.caption)
                    .foregroundStyle(.tertiary)
            }
        }
        .padding(.vertical, 2)
    }

    private var symbol: String {
        if let purpose = item.purpose { return purpose.symbol }
        return item.link.isEmpty ? "lightbulb" : LinkParser.symbol(for: item.link)
    }
}

/// Opens after pasting to ask what the link is for, with an optional note you can dictate.
struct InboxItemSheet: View {
    @Bindable var item: InboxItem
    var justSaved: Bool
    var onSort: (InboxPurpose) -> Void
    var onAddToVideo: (Video) -> Void
    var onMakeVideo: () -> Void

    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var context

    var body: some View {
        NavigationStack {
            Form {
                if !item.link.isEmpty {
                    Section { LinkRow(link: item.link) }
                }

                Section {
                    TextField(item.link.isEmpty ? "Your idea" : "Add a note, like \"use for the gym video\"",
                              text: $item.note, axis: .vertical)
                        .lineLimit(1...8)
                } header: {
                    Text(item.link.isEmpty ? "Idea" : "Note (optional)")
                } footer: {
                    Text("Tap the mic on the keyboard to dictate.")
                }

                Section("What's this for?") {
                    if !item.link.isEmpty {
                        ForEach(InboxPurpose.allCases) { purpose in
                            Button { onSort(purpose) } label: {
                                choice(purpose.label, symbol: purpose.symbol, checked: item.purpose == purpose)
                            }
                        }
                    }
                    NavigationLink {
                        VideoPicker(onPick: onAddToVideo)
                    } label: {
                        choice("Add to a video", symbol: "film.stack", checked: false)
                    }
                    Button(action: onMakeVideo) {
                        choice("Start a new video", symbol: "plus.rectangle.on.rectangle", checked: false)
                    }
                }
            }
            .navigationTitle(justSaved ? "Saved ✓" : (item.link.isEmpty ? "Idea" : "Saved link"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
            .onDisappear { context.saveAndRefresh() }
        }
    }

    private func choice(_ title: String, symbol: String, checked: Bool) -> some View {
        HStack(spacing: 12) {
            Image(systemName: symbol)
                .font(.title3)
                .foregroundStyle(.tint)
                .frame(width: 28)
            Text(title)
                .font(.body.weight(.medium))
                .foregroundStyle(.primary)
            Spacer()
            if checked {
                Image(systemName: "checkmark").foregroundStyle(.tint)
            }
        }
        .padding(.vertical, 6)
    }
}

/// Pick which video a link belongs to.
private struct VideoPicker: View {
    var onPick: (Video) -> Void

    @Query(sort: \Video.createdAt, order: .reverse) private var videos: [Video]

    var body: some View {
        let active = videos.filter { $0.status != .posted }
            .sorted { $0.isPinned && !$1.isPinned }
        List(active) { video in
            Button { onPick(video) } label: {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(video.displayTitle).foregroundStyle(.primary)
                        Label(video.status.label, systemImage: video.status.symbol)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                    if video.isPinned {
                        Image(systemName: "star.fill").foregroundStyle(.yellow)
                    }
                }
            }
        }
        .overlay {
            if active.isEmpty {
                ContentUnavailableView("No videos yet", systemImage: "film.stack",
                                       description: Text("Go back and choose Start a new video."))
            }
        }
        .navigationTitle("Add to a video")
        .navigationBarTitleDisplayMode(.inline)
    }
}
