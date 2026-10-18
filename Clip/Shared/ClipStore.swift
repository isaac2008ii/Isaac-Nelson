import Foundation
import SwiftData

enum ClipStore {
    /// Shared with the widget so it can read your pinned video.
    /// If you change this, also change it in Config/Clip.entitlements and Config/ClipWidget.entitlements.
    static let appGroupID = "group.com.isaacnelson.clip"

    static let schema = Schema([InboxItem.self, Video.self, Shot.self])

    static let shared: ModelContainer = makeContainer()

    private static func makeContainer() -> ModelContainer {
        // Prefer the App Group store; fall back to a private store if the group isn't provisioned
        // (the app still works, the widget just won't see your data).
        if FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroupID) != nil {
            let config = ModelConfiguration(schema: schema, groupContainer: .identifier(appGroupID))
            if let container = try? ModelContainer(for: schema, configurations: config) {
                return container
            }
        }
        do {
            return try ModelContainer(for: schema, configurations: ModelConfiguration(schema: schema))
        } catch {
            fatalError("Could not open Clip's data store: \(error)")
        }
    }
}
