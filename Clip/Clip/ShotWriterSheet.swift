import SwiftUI

/// Write or dictate freely, then Clip breaks it into a shot list you can review before adding.
struct ShotWriterSheet: View {
    var initialText: String = ""
    var onAdd: ([String]) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var text = ""
    @State private var drafts: [DraftShot] = []
    @State private var reviewing = false
    @State private var working = false
    @FocusState private var editorFocused: Bool

    private struct DraftShot: Identifiable {
        let id = UUID()
        var text: String
    }

    var body: some View {
        NavigationStack {
            Group {
                if reviewing { review } else { writer }
            }
            .navigationTitle(reviewing ? "\(drafts.count) shots" : "Write it out")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    if reviewing {
                        Button("Back") { reviewing = false }
                    } else {
                        Button("Cancel") { dismiss() }
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    if reviewing {
                        Button("Add") {
                            onAdd(drafts.map(\.text))
                            dismiss()
                        }
                        .disabled(drafts.isEmpty)
                    } else {
                        Button("Make shots") { Task { await makeShots() } }
                            .disabled(working || text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                    }
                }
            }
            .overlay {
                if working {
                    ProgressView("Making your shot list…")
                        .padding(24)
                        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
                }
            }
        }
        .interactiveDismissDisabled(!text.isEmpty)
        .onAppear { if text.isEmpty { text = initialText } }
    }

    private var writer: some View {
        TextEditor(text: $text)
            .focused($editorFocused)
            .padding(.horizontal, 12)
            .overlay(alignment: .topLeading) {
                if text.isEmpty {
                    Text("Tap the mic on the keyboard and talk through the video: \"Start with me walking into the café, then a close-up of the latte art, then me taking a sip…\"")
                        .foregroundStyle(.tertiary)
                        .padding(.horizontal, 17)
                        .padding(.vertical, 8)
                        .allowsHitTesting(false)
                }
            }
            .task {
                try? await Task.sleep(for: .milliseconds(450))
                editorFocused = true
            }
    }

    private var review: some View {
        List {
            Section {
                ForEach($drafts) { $draft in
                    TextField("Shot", text: $draft.text, axis: .vertical)
                }
                .onDelete { drafts.remove(atOffsets: $0) }
                .onMove { drafts.move(fromOffsets: $0, toOffset: $1) }
            } footer: {
                Text(ShotListMaker.usesAI
                     ? "Made on your iPhone with Apple Intelligence. Edit, reorder or swipe to delete before adding."
                     : "Split from your sentences. Edit, reorder or swipe to delete before adding.")
            }
        }
    }

    private func makeShots() async {
        editorFocused = false
        working = true
        let shots = await ShotListMaker.makeShots(from: text)
        working = false
        drafts = shots.map { DraftShot(text: $0) }
        reviewing = true
    }
}
