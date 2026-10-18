import Foundation

/// Deep links the widgets use to open the app: clip://paste and clip://video/<id>.
enum Route: Equatable {
    case paste
    case video(UUID)

    static let scheme = "clip"

    var url: URL {
        switch self {
        case .paste: URL(string: "clip://paste")!
        case .video(let id): URL(string: "clip://video/\(id.uuidString)")!
        }
    }

    init?(url: URL) {
        guard url.scheme == Route.scheme else { return nil }
        switch url.host {
        case "paste":
            self = .paste
        case "video":
            guard let id = UUID(uuidString: url.lastPathComponent) else { return nil }
            self = .video(id)
        default:
            return nil
        }
    }
}
