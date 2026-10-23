use log::{debug, error, info};
use std::time::{Duration, Instant};
use tauri::{command, AppHandle, Emitter};
use tokio::sync::Mutex;

const UPDATE_CHECK_INTERVAL: Duration = Duration::from_secs(3600);
const DOWNLOAD_EVENT: &str = "ytdlp:download";

static LAST_UPDATE_CHECK: Mutex<Option<Instant>> = Mutex::const_new(None);

#[command]
#[specta::specta]
pub async fn ytdlp_ensure_installed(app_handle: AppHandle) -> Result<bool, String> {
    let mut last_check = LAST_UPDATE_CHECK.lock().await;
    if last_check.is_some_and(|checked_at| checked_at.elapsed() < UPDATE_CHECK_INTERVAL) {
        debug!("[yt-dlp] Update checked recently, skipping");
        return Ok(true);
    }

    match crate::android::ytdlp_update(&app_handle).await {
        Ok(true) => {
            info!("[yt-dlp] Updated bundled yt-dlp");
            let payload = serde_json::json!({ "kind": "update", "status": "finished" });
            if let Err(err) = app_handle.emit(DOWNLOAD_EVENT, payload) {
                error!("[yt-dlp] Failed to emit download event: {}", err);
            }
        }
        Ok(false) => debug!("[yt-dlp] Already up to date"),
        Err(err) => error!("[yt-dlp] Update check failed: {}", err),
    }
    *last_check = Some(Instant::now());

    Ok(true)
}
