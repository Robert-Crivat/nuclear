package com.nuclearplayer

import android.app.Activity
import android.graphics.Color
import android.os.Handler
import android.os.Looper
import android.webkit.WebView
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import com.yausername.youtubedl_android.YoutubeDL
import com.yausername.youtubedl_android.YoutubeDLRequest
import java.util.concurrent.Executors

@InvokeArg
class YtdlpExecuteArgs {
  var args: List<String> = emptyList()
}

@InvokeArg
class MediaSessionArgs {
  var title: String = ""
  var artist: String = ""
  var album: String? = null
  var artworkUrl: String? = null
  var isPlaying: Boolean = false
  var positionMs: Long = 0
  var durationMs: Long = 0
}

@InvokeArg
class SystemBarColorsArgs {
  var top: String = "#000000"
  var bottom: String = "#000000"
}

@TauriPlugin
class NuclearPlugin(private val activity: Activity) : Plugin(activity) {
  private val executor = Executors.newCachedThreadPool()
  private val mainHandler = Handler(Looper.getMainLooper())

  override fun load(webView: WebView) {
    MediaPlaybackService.onAction = { action, positionMs ->
      val payload = JSObject().put("action", action)
      if (positionMs != null) {
        payload.put("positionMs", positionMs)
      }
      trigger("mediaAction", payload)
    }
  }

  private fun runInBackground(invoke: Invoke, task: () -> JSObject) {
    executor.execute {
      try {
        invoke.resolve(task())
      } catch (error: Throwable) {
        invoke.reject(error.message ?: error.toString())
      }
    }
  }

  private fun runOnMain(invoke: Invoke, task: () -> Unit) {
    mainHandler.post {
      try {
        task()
        invoke.resolve()
      } catch (error: Throwable) {
        invoke.reject(error.message ?: error.toString())
      }
    }
  }

  @Command
  fun ytdlpExecute(invoke: Invoke) {
    val args = invoke.parseArgs(YtdlpExecuteArgs::class.java).args
    runInBackground(invoke) {
      YoutubeDL.getInstance().init(activity.applicationContext)
      val request = YoutubeDLRequest(emptyList<String>())
        .addCommands(listOf("--no-js-runtimes") + args)
      val response = YoutubeDL.getInstance().execute(request)
      JSObject().put("stdout", response.out)
    }
  }

  @Command
  fun ytdlpUpdate(invoke: Invoke) {
    runInBackground(invoke) {
      YoutubeDL.getInstance().init(activity.applicationContext)
      val status = YoutubeDL.getInstance()
        .updateYoutubeDL(activity.applicationContext, YoutubeDL.UpdateChannel.NIGHTLY)
      JSObject().put("updated", status == YoutubeDL.UpdateStatus.DONE)
    }
  }

  @Command
  fun updateMediaSession(invoke: Invoke) {
    val args = invoke.parseArgs(MediaSessionArgs::class.java)
    runOnMain(invoke) {
      MediaPlaybackService.update(
        activity.applicationContext,
        MediaState(
          title = args.title,
          artist = args.artist,
          album = args.album,
          artworkUrl = args.artworkUrl,
          isPlaying = args.isPlaying,
          positionMs = args.positionMs,
          durationMs = args.durationMs,
        )
      )
    }
  }

  @Command
  fun stopMediaSession(invoke: Invoke) {
    runOnMain(invoke) {
      MediaPlaybackService.stop(activity.applicationContext)
    }
  }

  @Command
  fun setSystemBarColors(invoke: Invoke) {
    val args = invoke.parseArgs(SystemBarColorsArgs::class.java)
    runOnMain(invoke) {
      (activity as? MainActivity)?.setSystemBarColors(
        Color.parseColor(args.top),
        Color.parseColor(args.bottom)
      )
    }
  }
}
