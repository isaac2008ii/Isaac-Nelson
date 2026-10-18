# Clip — make videos without the mess

Clip is an iPhone app that works like a to-do list for making videos.

- **Inbox:** copy a link in Instagram (Share → Copy link) and tap **Paste**, in the app or on the widget. Clip asks **"What's this for?"**:
  - **Audio to use** or **Video idea / inspo** files it under **Audios** or **Ideas & inspo** in your inbox.
  - **Add to a video** attaches it to one of your video cards.
  - **Start a new video** turns it into a video card right away.
  - There's an optional note field you can dictate into. If you close without picking, the link waits under **Unsorted**. You can also type or dictate plain ideas.
- **Videos:** swipe right on an inbox item to **Make video**. Each video card has a title, its Instagram audio and inspo links (tap one to open Instagram), a status (Idea → Filming → Editing → Posted), a shot list you check off, and notes.
- **Write it out → shot list:** type or dictate everything you're picturing, as messy as you like. Clip breaks it into separate shots you can edit before adding.
  - On iPhones with Apple Intelligence (iPhone 15 Pro or newer, iOS 26+), it uses Apple's on-device AI. It's free, private, and nothing leaves your phone.
  - On other iPhones, it splits on sentences, new lines, and words like "then" and "next shot".
  - The **Add a shot** field works the same way: dictate several sentences and each one becomes its own shot.
- **Widgets:**
  - **Current Video** (small or medium): your ⭐ starred video and how many shots are left. The medium size has a big **Paste link** button too.
  - **Paste Link** (small, or on the Lock Screen): one tap saves the Instagram link on your clipboard to your inbox.

Everything is stored only on your phone.

## Install it on your iPhone

You need a Mac with **Xcode 26** (free from the Mac App Store) and your iPhone's USB cable. Xcode 16 also works, but the AI shot-list feature needs Xcode 26.

1. Download this repo on your Mac (green **Code** button → Download ZIP, or `git clone`).
2. Open `Clip/Clip.xcodeproj` in Xcode.
3. In Xcode, go to **Settings → Accounts** and sign in with your Apple ID.
4. Click the blue **Clip** project in the left sidebar. Then, for **each** of the two targets (**Clip** and **ClipWidgetExtension**):
   - Open **Signing & Capabilities**.
   - Set **Team** to your name (Personal Team).
5. Plug in your iPhone, unlock it, and tap **Trust**. On the iPhone, turn on **Settings → Privacy & Security → Developer Mode** (it restarts).
6. At the top of Xcode, pick your iPhone as the run destination and press **▶ Run**.
7. The first time only, go to **Settings → General → VPN & Device Management** on the iPhone, tap your Apple ID, and choose **Trust**.

### Make pasting instant

The first time you paste from the widget, iOS asks "Allow Paste?". To stop it asking, go to **Settings → Apps → Clip → Paste from Other Apps → Allow**.

> Widgets can't read the clipboard themselves (an iOS rule), so the Paste button opens Clip, which saves the link right away.

### Add the widgets

Long-press your home screen → **Edit → Add Widget** → search **Clip**.

### Free Apple ID vs. paid developer account

With a free Apple ID, apps you install from Xcode stop opening after **7 days**. When that happens, plug in and press ▶ Run again; your data stays. A $99/year Apple Developer account removes that limit.

### If Xcode shows a signing error

Bundle IDs have to be unique across all Apple accounts. If Xcode says `com.isaacnelson.clip` is taken:

1. Change the start of the **Bundle Identifier** on both targets, for example to `com.yourname2.clip` and `com.yourname2.clip.widget`.
2. Under **App Groups**, replace `group.com.isaacnelson.clip` with the same new name on both targets, for example `group.com.yourname2.clip`.
3. Put that same group name in `Shared/ClipStore.swift` (`appGroupID`).

The App Group lets the widget see your videos. If it's not set up, the app still works but the widget will say "No video starred".

## Project layout

| Folder | What's in it |
| --- | --- |
| `Clip/` | The app: inbox, videos, shot list, "write it out" sheet |
| `ClipWidget/` | The home screen and Lock Screen widgets |
| `Shared/` | Data models and helpers used by both |
| `Config/` | Info.plists and entitlements (URL scheme `clip://`, App Group) |
