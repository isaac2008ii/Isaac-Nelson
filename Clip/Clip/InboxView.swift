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
                InboxItemSheet(item: item, justSaved: selectedIsNew) {
                    selected = nil
                    // Let the sheet finish closing before the item is deleted.
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) { makeVideo(item) }
                }
            }
            .onAppear(perform: openJustSaved)
            .onChange(of: router.justSaved?.id) { openJustSaved() }
        }
    }

    private func addDraft() {
        if let item = Actions.addIdea(draft, in: context), !item.link.isEmpty, item.note.isEmpty {
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

    private func makeVideo(_ item: InboxItem) {
        let video = Actions.promote(item, in: context)
        router.show(video)
    }
}

private struct InboxRow: View {
    let item: InboxItem

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: item.link.isEmpty ? "lightbulb" : LinkParser.symbol(for: item.link))
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
}

/// Opens right after pasting, with the keyboard up so you can dictate a quick note.
struct InboxItemSheet: View {
    @Bindable var item: InboxItem
    var justSaved: Bool
    var onMakeVideo: () -> Void

    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var context
    @FocusState private var noteFocused: Bool

    var body: some View {
        NavigationStack {
            Form {
                if !item.link.isEmpty {
                    Section { LinkRow(link: item.link) }
                }
                Section {
                    TextField(item.link.isEmpty ? "Your idea" : "Add a note, like \"use for the gym video\"",
                              text: $item.note, axis: .vertical)
                        .focused($noteFocused)
                        .lineLimit(2...8)
                } header: {
                    Text(item.link.isEmpty ? "Idea" : "Note")
                } footer: {
                    Text("Tap the mic on the keyboard to dictate.")
                }
                Section {
                    Button(action: onMakeVideo) {
                        Label("Make video", systemImage: "film")
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
            .task {
                guard justSaved else { return }
                try? await Task.sleep(for: .milliseconds(450))
                noteFocused = true
            }
            .onDisappear { context.saveAndRefresh() }
        }
        .presentationDetents([.medium, .large])
    }
}
