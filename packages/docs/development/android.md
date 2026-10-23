# Android

The Android app is built from the same code as the desktop app. Tauri compiles the Rust backend for Android and runs the React frontend in the system WebView. The Android Studio project lives in `packages/player/src-tauri/gen/android`.

## Building

You need JDK 17, the Android SDK and the Android NDK, plus the Rust Android targets:

```bash
rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android
export ANDROID_HOME=$HOME/Library/Android/sdk
export NDK_HOME=$ANDROID_HOME/ndk/<version>
```

Then, from the repository root:

```bash
pnpm tauri android dev                                         # Run on a device or emulator
pnpm tauri android build --apk --target aarch64                # Release APK for 64-bit ARM
pnpm tauri android build --apk --target aarch64 --target armv7 --target x86_64  # Universal APK
```

Release builds are signed when `packages/player/src-tauri/gen/android/keystore.properties` exists:

```properties
storeFile=/absolute/path/to/keystore.jks
password=<keystore and key password>
keyAlias=<key alias>
```

The file is git-ignored. The release workflow writes it from the `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD` and `ANDROID_KEY_ALIAS` secrets.

## How it differs from desktop

### yt-dlp

Desktop downloads a standalone yt-dlp binary. Android can't run it, so the app bundles [youtubedl-android](https://github.com/yausername/youtubedl-android), which ships Python and yt-dlp. The `ytdlp_*` commands keep the same contract: `src/ytdlp.rs` passes the same arguments to `NuclearPlugin.ytdlpExecute` in Kotlin instead of spawning a process. `ytdlp_ensure_installed` updates the bundled yt-dlp to the latest nightly at most once an hour (`src/ytdlp_setup_android.rs`).

youtubedl-android also bundles QuickJS so yt-dlp can solve YouTube's JavaScript challenges. On a phone that takes several minutes for every new track. `ytdlpExecute` passes `--no-js-runtimes`, so yt-dlp uses the YouTube clients that don't need a JavaScript runtime and extracts a stream in a few seconds. That is also what happens on desktop when Deno isn't installed.

### Background playback

`MediaPlaybackService` is a foreground service with a `MediaSession`. It shows the playback notification, the lock screen controls, and receives media buttons from headsets and Bluetooth devices. The frontend publishes the current track and playback state through `services/mobileMediaSession.ts` and receives the system's play, pause, next, previous and seek requests as `mediaAction` plugin events.

While the service runs, `MainActivity` keeps the WebView resumed when the app goes to the background, otherwise the WebView would pause the audio.

### Layout

On Android, `routes/__root.tsx` renders a mobile layout: the sidebars become drawers opened from the top bar, and the player bar shows only the previous, play and next buttons. The queue drawer shows the full controls. Desktop-only settings (window frame, title bar, updates, Discord) are hidden.

The system back button closes the open dialog or drawer first, then goes back in history, then sends the app to the background instead of closing it. The status and navigation bar colors follow the top bar and the player bar.

### Networking

HTTPS requests from Rust use the Mozilla root certificates bundled with `webpki-root-certs`, because the platform verifier that `reqwest` uses by default needs a JNI context on Android. All Rust HTTP clients are created with `net::http_client_builder()`.

### Not available on Android

- The in-app updater. Android installs updates through the APK or a store.
- Discord Rich Presence.
- Window controls and the custom title bar.
