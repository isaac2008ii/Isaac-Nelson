import SwiftUI
import SwiftData

struct VideoDetailView: View {
    @Bindable var video: Video

    @Environment(\.modelContext) private var context
    @Environment(Router.self) private var router
    @FocusState private var focus: Field?
    @State private var newShot = ""
    @State private var linkDraft = ""
    @State private var writerText: String?
    @State private var editMode: EditMode = .inactive

    private enum Field: Hashable { case title, newShot, notes, link }

    var body: some View {
        List {
            Section {
                TextField("Video title", text: $video.title, axis: .vertical)
                    .font(.title2.weight(.bold))
                    .focused($focus, equals: .title)
                Picker("Status", selection: statusBinding) {
                    ForEach(VideoStatus.allCases) { Text($0.label).tag($0) }
                }
                .pickerStyle(.segmented)
                Toggle(isOn: pinBinding) {
                    Label("Show on widget", systemImage: "star")
                }
            }

            Section("Audio / inspo") {
                if video.link.isEmpty {
                    HStack {
                        TextField("Instagram link", text: $linkDraft)
                            .focused($focus, equals: .link)
                            .keyboardType(.URL)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .onSubmit { setLink(linkDraft) }
                        PasteButton(payloadType: String.self) { strings in
                            DispatchQueue.main.async { setLink(strings.first ?? "") }
                        }
                        .labelStyle(.iconOnly)
                        .buttonBorderShape(.capsule)
                    }
                } else {
                    LinkRow(link: video.link)
                        .swipeActions {
                            Button(role: .destructive) {
                                video.link = ""
                                context.saveAndRefresh()
                            } label: { Label("Remove", systemImage: "trash") }
                        }
                }
            }

            Section {
                ForEach(video.orderedShots) { shot in
                    ShotRow(shot: shot) { context.saveAndRefresh() }
                }
                .onMove(perform: moveShots)
                .onDelete(perform: deleteShots)

                TextField("Add a shot", text: $newShot, axis: .vertical)
                    .focused($focus, equals: .newShot)
                    .submitLabel(.return)
                    .onChange(of: newShot) { _, value in
                        // Return (or saying "new line") adds the shot and keeps the keyboard up for the next one.
                        if value.contains("\n") { addTypedShots() }
                    }

                Button {
                    writerText = ""
                } label: {
                    Label("Write it out → shot list", systemImage: "wand.and.stars")
                }
            } header: {
                HStack {
                    Text("Shot list")
                    Spacer()
                    if !video.shots.isEmpty {
                        Text("\(video.shotsLeft) left")
                    }
                }
            } footer: {
                Text("Tap the mic on the keyboard to dictate. Say a few shots at once — each sentence becomes its own shot.")
            }

            Section("Notes") {
                TextField("Script, captions, hooks…", text: $video.notes, axis: .vertical)
                    .focused($focus, equals: .notes)
                    .lineLimit(3...)
                if !video.notes.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                    Button {
                        writerText = video.notes
                    } label: {
                        Label("Turn notes into shots", systemImage: "wand.and.stars")
                    }
                }
            }
        }
        .environment(\.editMode, $editMode)
        .navigationTitle(video.displayTitle)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                if editMode.isEditing {
                    Button("Done") { withAnimation { editMode = .inactive } }
                } else {
                    Menu {
                        Button {
                            focus = nil
                            withAnimation { editMode = .active }
                        } label: {
                            Label("Reorder shots", systemImage: "arrow.up.arrow.down")
                        }
                        Button(role: .destructive) {
                            router.videoPath.removeAll()
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) { Actions.delete(video, in: context) }
                        } label: {
                            Label("Delete video", systemImage: "trash")
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }
            }
            ToolbarItemGroup(placement: .keyboard) {
                Spacer()
                Button("Done") { focus = nil }
            }
        }
        .sheet(isPresented: writerBinding) {
            ShotWriterSheet(initialText: writerText ?? "") { shots in
                Actions.addShots(shots, to: video, in: context)
            }
        }
        .onAppear {
            if video.title.isEmpty && video.shots.isEmpty && video.notes.isEmpty { focus = .title }
        }
        .onDisappear { context.saveAndRefresh() }
    }

    private var statusBinding: Binding<VideoStatus> {
        Binding(get: { video.status }, set: { video.status = $0; context.saveAndRefresh() })
    }

    private var pinBinding: Binding<Bool> {
        Binding(get: { video.isPinned }, set: { Actions.setPinned(video, $0, in: context) })
    }

    private var writerBinding: Binding<Bool> {
        Binding(get: { writerText != nil }, set: { if !$0 { writerText = nil } })
    }

    private func setLink(_ text: String) {
        guard let url = LinkParser.firstURL(in: text) else { return }
        video.link = url.absoluteString
        linkDraft = ""
        context.saveAndRefresh()
    }

    private func addTypedShots() {
        let text = newShot.replacingOccurrences(of: "\n", with: " ")
        newShot = ""
        Actions.addShots(ShotListMaker.split(text), to: video, in: context)
        focus = .newShot
    }

    private func moveShots(from source: IndexSet, to destination: Int) {
        var shots = video.orderedShots
        shots.move(fromOffsets: source, toOffset: destination)
        for (index, shot) in shots.enumerated() { shot.order = index }
        context.saveAndRefresh()
    }

    private func deleteShots(at offsets: IndexSet) {
        let shots = video.orderedShots
        for index in offsets { Actions.delete(shots[index], from: video, in: context) }
    }
}

private struct ShotRow: View {
    @Bindable var shot: Shot
    var onChange: () -> Void

    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: 10) {
            Button {
                withAnimation { shot.isDone.toggle() }
                onChange()
            } label: {
                Image(systemName: shot.isDone ? "checkmark.circle.fill" : "circle")
                    .font(.title3)
                    .foregroundStyle(shot.isDone ? Color.accentColor : Color.secondary)
            }
            .buttonStyle(.borderless)

            TextField("Shot", text: $shot.text, axis: .vertical)
                .strikethrough(shot.isDone)
                .foregroundStyle(shot.isDone ? .secondary : .primary)
        }
    }
}
