package com.nuclearplayer

import android.content.Context
import android.util.Log
import com.yausername.youtubedl_android.YoutubeDL
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.util.concurrent.CompletableFuture
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.ExecutionException
import java.util.concurrent.atomic.AtomicLong

class YtdlpWorkerUnavailable(message: String, cause: Throwable? = null) :
  Exception(message, cause)

class YtdlpError(message: String) : Exception(message)

object YtdlpWorker {
  private const val TAG = "YtdlpWorker"
  private val pending = ConcurrentHashMap<Long, CompletableFuture<JSONObject>>()
  private val nextId = AtomicLong()
  private var process: Process? = null

  fun execute(context: Context, args: List<String>): String {
    val id = nextId.incrementAndGet()
    val result = CompletableFuture<JSONObject>()
    pending[id] = result
    try {
      send(context, JSONObject().put("id", id).put("args", JSONArray(args)))
      val response = try {
        result.get()
      } catch (error: ExecutionException) {
        throw YtdlpWorkerUnavailable("yt-dlp worker stopped", error.cause)
      }
      val code = response.getInt("code")
      val out = response.getString("out")
      if (code != 0 && out.isBlank()) {
        throw YtdlpError(response.getString("err").ifBlank { "yt-dlp exited with code $code" })
      }
      return out
    } finally {
      pending.remove(id)
    }
  }

  @Synchronized
  fun warmUp(context: Context) {
    if (process?.isAlive != true) {
      start(context)
    }
  }

  @Synchronized
  fun stop() {
    process?.destroy()
    process = null
  }

  @Synchronized
  private fun send(context: Context, request: JSONObject) {
    try {
      val running = process?.takeIf { it.isAlive } ?: start(context)
      running.outputStream.write("$request\n".toByteArray())
      running.outputStream.flush()
    } catch (error: Exception) {
      throw YtdlpWorkerUnavailable("Could not start the yt-dlp worker", error)
    }
  }

  private fun start(context: Context): Process {
    YoutubeDL.getInstance().init(context)
    val pythonHome = libraryField<String>("ENV_PYTHONHOME")
    val script = context.assets.open("ytdlp_worker.py").bufferedReader().use { it.readText() }
    val builder = ProcessBuilder(
      libraryField<File>("pythonPath").absolutePath,
      "-u",
      "-c",
      script,
      libraryField<File>("ytdlpPath").absolutePath,
    )
    builder.environment().apply {
      put("LD_LIBRARY_PATH", libraryField("ENV_LD_LIBRARY_PATH"))
      put("SSL_CERT_FILE", libraryField("ENV_SSL_CERT_FILE"))
      put("PATH", "${System.getenv("PATH")}:${libraryField<File>("binDir").absolutePath}")
      put("PYTHONHOME", pythonHome)
      put("HOME", pythonHome)
      put("TMPDIR", libraryField("TMPDIR"))
    }
    val started = builder.start()
    process = started
    Thread { readResponses(started) }.start()
    Thread { started.errorStream.bufferedReader().forEachLine { Log.w(TAG, it) } }.start()
    return started
  }

  private fun readResponses(running: Process) {
    running.inputStream.bufferedReader().forEachLine { line ->
      val response = JSONObject(line)
      if (response.has("id")) {
        pending[response.getLong("id")]?.complete(response)
      }
    }
    synchronized(this) {
      if (process === running || process == null) {
        process = null
        val error = IllegalStateException("yt-dlp worker exited")
        pending.values.forEach { it.completeExceptionally(error) }
      }
    }
  }

  @Suppress("UNCHECKED_CAST")
  private fun <T> libraryField(name: String): T =
    YoutubeDL::class.java.getDeclaredField(name).apply { isAccessible = true }.get(null) as T
}
