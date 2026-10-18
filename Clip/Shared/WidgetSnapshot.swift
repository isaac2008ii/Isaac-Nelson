import Foundation

/// A tiny summary of the starred video that the app hands to the widget.
/// The widget reads only this, never the database, so it stays fast and reliable.
struct WidgetSnapshot: Codable {
    var id: UUID
    var title: String
    var statusRaw: String
    var shotsLeft: Int
    var totalShots: Int
    var nextShot: String?
}

enum WidgetSnapshotStore {
    private static let key = "pinnedVideo"
    private static var defaults: UserDefaults? { UserDefaults(suiteName: ClipStore.appGroupID) }

    static func write(_ snapshot: WidgetSnapshot?) {
        if let snapshot, let data = try? JSONEncoder().encode(snapshot) {
            defaults?.set(data, forKey: key)
        } else {
            defaults?.removeObject(forKey: key)
        }
    }

    static func read() -> WidgetSnapshot? {
        guard let data = defaults?.data(forKey: key) else { return nil }
        return try? JSONDecoder().decode(WidgetSnapshot.self, from: data)
    }
}
