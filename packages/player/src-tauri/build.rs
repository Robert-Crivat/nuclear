fn main() {
    tauri_build::try_build(
        tauri_build::Attributes::new().plugin(
            "nuclear-android",
            tauri_build::InlinedPlugin::new()
                .commands(&[
                    "updateMediaSession",
                    "stopMediaSession",
                    "setSystemBarColors",
                    "installApk",
                    "setBrowseTree",
                    "registerListener",
                    "removeListener",
                ])
                .default_permission(tauri_build::DefaultPermissionRule::AllowAllCommands),
        ),
    )
    .expect("failed to run tauri-build");
}
