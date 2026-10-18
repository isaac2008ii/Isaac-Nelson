import Foundation
#if canImport(FoundationModels)
import FoundationModels
#endif

/// Turns rough writing or voice dictation into a list of shots.
/// Uses Apple Intelligence on-device when the iPhone supports it, otherwise a sentence splitter.
enum ShotListMaker {
    static var usesAI: Bool {
        #if canImport(FoundationModels)
        if #available(iOS 26.0, *) {
            return SystemLanguageModel.default.isAvailable
        }
        #endif
        return false
    }

    static func makeShots(from text: String) async -> [String] {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return [] }
        #if canImport(FoundationModels)
        if #available(iOS 26.0, *), SystemLanguageModel.default.isAvailable {
            if let shots = try? await AIShotWriter.shots(from: trimmed), !shots.isEmpty {
                return shots
            }
        }
        #endif
        return split(trimmed)
    }

    /// Splits on lines, bullets, sentences and spoken cues like "next shot" or "then".
    static func split(_ text: String) -> [String] {
        let cues = "\\b(?:next shot|new shot|and then|then|after that)\\b[,:]?"
        let marked = text.replacingOccurrences(of: cues, with: "\n", options: [.regularExpression, .caseInsensitive])

        var pieces: [String] = []
        for line in marked.components(separatedBy: .newlines) {
            let line = line.replacingOccurrences(of: "^\\s*(?:[-•*]|\\d+[.)])\\s*", with: "", options: .regularExpression)
            line.enumerateSubstrings(in: line.startIndex..., options: .bySentences) { sentence, _, _, _ in
                if let sentence { pieces.append(sentence) }
            }
        }
        return pieces.map(clean).filter { $0.count > 1 }
    }

    static func clean(_ text: String) -> String {
        var shot = text.trimmingCharacters(in: .whitespacesAndNewlines.union(CharacterSet(charactersIn: ",.;:-")))
        if let first = shot.first, first.isLowercase {
            shot = first.uppercased() + shot.dropFirst()
        }
        return shot
    }
}

#if canImport(FoundationModels)
@available(iOS 26.0, *)
@Generable
struct GeneratedShotList {
    @Guide(description: "The shots to film, in order. Each one is a short, concrete line, like 'Close-up: pouring the coffee' or 'Wide shot walking into the gym'.")
    var shots: [String]
}

@available(iOS 26.0, *)
enum AIShotWriter {
    static func shots(from text: String) async throws -> [String] {
        let session = LanguageModelSession(instructions: """
            You turn a content creator's rough notes or voice dictation for a short-form vertical video \
            (Instagram Reels or TikTok) into a shot list. Keep every idea they mention, in their order. \
            Split run-on thoughts into separate shots and drop filler words. Write each shot as a short, \
            specific description of what to film. Do not invent shots they didn't describe. No numbering.
            """)
        let response = try await session.respond(to: text, generating: GeneratedShotList.self)
        return response.content.shots.map(ShotListMaker.clean).filter { !$0.isEmpty }
    }
}
#endif
