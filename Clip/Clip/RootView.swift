import SwiftUI
import SwiftData
import UIKit

struct RootView: View {
    @Environment(Router.self) private var router
    @Environment(\.modelContext) private var context
    @Environment(\.scenePhase) private var scenePhase

    var body: some View {
        @Bindable var router = router
        TabView(selection: $router.tab) {
            InboxView()
                .tabItem { Label("Inbox", systemImage: "tray") }
                .tag(Router.Tab.inbox)
            VideosView()
                .tabItem { Label("Videos", systemImage: "film.stack") }
                .tag(Router.Tab.videos)
        }
        .overlay(alignment: .top) { toast }
        .onOpenURL(perform: handle)
        .onChange(of: scenePhase) { _, phase in
            // Text edits aren't saved on every keystroke; flush them so the widget stays current.
            if phase != .active { context.saveAndRefresh() }
        }
    }

    @ViewBuilder private var toast: some View {
        if let message = router.toast {
            Text(message)
                .font(.subheadline.weight(.semibold))
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .background(.regularMaterial, in: Capsule())
                .shadow(radius: 6, y: 2)
                .padding(.top, 8)
                .transition(.move(edge: .top).combined(with: .opacity))
                .task(id: message) {
                    try? await Task.sleep(for: .seconds(2))
                    withAnimation { router.toast = nil }
                }
        }
    }

    private func handle(_ url: URL) {
        guard let route = Route(url: url) else { return }
        switch route {
        case .paste:
            router.tab = .inbox
            // Widgets can't read the clipboard, so the Paste widget opens the app and we read it here.
            let pasted = UIPasteboard.general.string ?? UIPasteboard.general.url?.absoluteString ?? ""
            switch Actions.saveLink(from: pasted, in: context) {
            case .saved(let item):
                router.justSaved = item
            case .duplicate:
                withAnimation { router.toast = "Already in your inbox" }
            case .noLink:
                withAnimation { router.toast = "No link on your clipboard" }
            }
        case .video(let id):
            let descriptor = FetchDescriptor<Video>(predicate: #Predicate<Video> { $0.id == id })
            if let video = try? context.fetch(descriptor).first {
                router.show(video)
            }
        }
    }
}
