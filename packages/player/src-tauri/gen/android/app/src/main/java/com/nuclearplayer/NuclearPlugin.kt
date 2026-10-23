package com.nuclearplayer

import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.webkit.WebView
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import com.yausername.youtubedl_android.YoutubeDL
import com.yausername.youtubedl_android.YoutubeDLRequest
import androidx.core.content.FileProvider
import java.io.File
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
class BrowseItemArgs {
  var mediaId: String = ""
  var title: String = ""
  var subtitle: String? = null
  var isPlayable: Boolean = false
}

@InvokeArg
class BrowseTreeArgs {
  var tree: Map<String, List<BrowseItemArgs>> = emptyMap()
}

@InvokeArg
class InstallApkArgs {
  var path: String = ""
}

@InvokeArg
class SystemBarColorsArgs {
  var top: String = "#000000"
  var bottom: String = "#000000"
  var side: String = "#000000"
}

@TauriPlugin
class NuclearPlugin(private val activity: Activity) : Plugin(activity) {
  private val executor = Executors.newCachedThreadPool()
  private val mainHandler = Handler(Looper.getMainLooper())

  override fun load(webView: WebView) {
    executor.execute {
      try {
        YtdlpWorker.warmUp(activity.applicationContext)
      } catch (error: Exception) {
        Log.w("NuclearPlugin", "Could not start the yt-dlp worker", error)
      }
    }
    MediaPlaybackService.onAction = { action, positionMs, mediaId ->
      val payload = JSObject().put("action", action)
      if (positionMs != null) {
        payload.put("positionMs", positionMs)
      }
      if (mediaId != null) {
        payload.put("mediaId", mediaId)
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
      val context = activity.applicationContext
      val stdout = try {
        YtdlpWorker.execute(context, listOf("--no-js-runtimes", "--no-cache-dir") + args)
      } catch (error: YtdlpWorkerUnavailable) {
        Log.w("NuclearPlugin", "yt-dlp worker unavailable, running yt-dlp directly", error)
        YoutubeDL.getInstance().init(context)
        val request = YoutubeDLRequest(emptyList<String>())
          .addCommands(listOf("--no-js-runtimes") + args)
        YoutubeDL.getInstance().execute(request).out
      }
      JSObject().put("stdout", stdout)
    }
  }

  @Command
  fun ytdlpUpdate(invoke: Invoke) {
    runInBackground(invoke) {
      YoutubeDL.getInstance().init(activity.applicationContext)
      val status = YoutubeDL.getInstance()
        .updateYoutubeDL(activity.applicationContext, YoutubeDL.UpdateChannel.NIGHTLY)
      val updated = status == YoutubeDL.UpdateStatus.DONE
      if (updated) {
        YtdlpWorker.stop()
      }
      JSObject().put("updated", updated)
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
      MainActivity.setSystemBarColors(
        Color.parseColor(args.top),
        Color.parseColor(args.bottom),
        Color.parseColor(args.side)
      )
    }
  }

  @Command
  fun installApk(invoke: Invoke) {
    val path = invoke.parseArgs(InstallApkArgs::class.java).path
    runOnMain(invoke) {
      val context = activity.applicationContext
      val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", File(path))
      val intent = Intent(Intent.ACTION_VIEW)
        .setDataAndType(uri, "application/vnd.android.package-archive")
        .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
    }
  }

  @Command
  fun setBrowseTree(invoke: Invoke) {
    val tree = invoke.parseArgs(BrowseTreeArgs::class.java).tree
    runOnMain(invoke) {
      MediaPlaybackService.updateBrowseTree(
        tree.mapValues { (_, items) ->
          items.map { BrowseItem(it.mediaId, it.title, it.subtitle, it.isPlayable) }
        }
      )
    }
  }
}
