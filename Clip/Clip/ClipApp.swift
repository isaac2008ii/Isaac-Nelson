import SwiftUI
import SwiftData

@main
struct ClipApp: App {
    @State private var router = Router()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(router)
        }
        .modelContainer(ClipStore.shared)
    }
}
