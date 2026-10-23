use serde::{Deserialize, Serialize};
use tauri::plugin::{Builder, PluginHandle, TauriPlugin};
use tauri::{AppHandle, Manager, Wry};

const PLUGIN_NAME: &str = "nuclear-android";

struct NuclearAndroid(PluginHandle<Wry>);

#[derive(Serialize)]
struct YtdlpExecuteArgs {
    args: Vec<String>,
}

#[derive(Deserialize)]
struct YtdlpExecuteResponse {
    stdout: String,
}

#[derive(Deserialize)]
struct YtdlpUpdateResponse {
    updated: bool,
}

pub fn init() -> TauriPlugin<Wry> {
    Builder::new(PLUGIN_NAME)
        .setup(|app, api| {
            let handle = api.register_android_plugin("com.nuclearplayer", "NuclearPlugin")?;
            app.manage(NuclearAndroid(handle));
            Ok(())
        })
        .build()
}

fn plugin_handle(app_handle: &AppHandle) -> PluginHandle<Wry> {
    app_handle.state::<NuclearAndroid>().0.clone()
}

pub async fn ytdlp_execute(app_handle: &AppHandle, args: Vec<String>) -> Result<String, String> {
    let response: YtdlpExecuteResponse = plugin_handle(app_handle)
        .run_mobile_plugin_async("ytdlpExecute", YtdlpExecuteArgs { args })
        .await
        .map_err(|error| error.to_string())?;
    Ok(response.stdout)
}

pub async fn ytdlp_update(app_handle: &AppHandle) -> Result<bool, String> {
    let response: YtdlpUpdateResponse = plugin_handle(app_handle)
        .run_mobile_plugin_async("ytdlpUpdate", ())
        .await
        .map_err(|error| error.to_string())?;
    Ok(response.updated)
}
