import SwiftUI

/// A saved link. Tapping it opens it (Instagram links open in the Instagram app).
struct LinkRow: View {
    let link: String
    @Environment(\.openURL) private var openURL

    var body: some View {
        Button {
            if let url = URL(string: link) { openURL(url) }
        } label: {
            HStack(spacing: 12) {
                Image(systemName: LinkParser.symbol(for: link))
                    .font(.title3)
                    .frame(width: 28)
                VStack(alignment: .leading, spacing: 2) {
                    Text(LinkParser.kind(for: link))
                        .foregroundStyle(.primary)
                    Text(link)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
                Spacer()
                Image(systemName: "arrow.up.forward.app")
                    .foregroundStyle(.secondary)
            }
        }
    }
}
