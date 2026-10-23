package com.nuclearplayer

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.Build
import android.os.Bundle
import android.support.v4.media.MediaBrowserCompat
import android.support.v4.media.MediaDescriptionCompat
import android.support.v4.media.MediaMetadataCompat
import android.support.v4.media.session.MediaSessionCompat
import android.support.v4.media.session.PlaybackStateCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import androidx.media.MediaBrowserServiceCompat
import androidx.media.app.NotificationCompat.MediaStyle
import androidx.media.session.MediaButtonReceiver
import java.net.URL
import java.util.concurrent.Executors

data class MediaState(
  val title: String,
  val artist: String,
  val album: String?,
  val artworkUrl: String?,
  val isPlaying: Boolean,
  val positionMs: Long,
  val durationMs: Long,
)

data class BrowseItem(
  val mediaId: String,
  val title: String,
  val subtitle: String?,
  val isPlayable: Boolean,
)

class MediaPlaybackService : MediaBrowserServiceCompat() {
  companion object {
    private const val CHANNEL_ID = "playback"
    private const val NOTIFICATION_ID = 1

    @Volatile
    var running = false
      private set

    var onAction: ((String, Long?, String?) -> Unit)? = null

    const val ROOT_ID = "root"

    @Volatile
    private var browseTree: Map<String, List<BrowseItem>> = emptyMap()

    fun updateBrowseTree(tree: Map<String, List<BrowseItem>>) {
      browseTree = tree
      instance?.let { service -> tree.keys.forEach { service.notifyChildrenChanged(it) } }
    }

    private var instance: MediaPlaybackService? = null
    private var pendingState: MediaState? = null

    fun update(context: Context, state: MediaState) {
      val service = instance
      if (service != null) {
        service.apply(state)
        return
      }
      pendingState = state
      val intent = Intent(context, MediaPlaybackService::class.java)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        context.startForegroundService(intent)
      } else {
        context.startService(intent)
      }
    }

    fun stop(context: Context) {
      pendingState = null
      context.stopService(Intent(context, MediaPlaybackService::class.java))
    }
  }

  private lateinit var session: MediaSessionCompat
  private val artworkLoader = Executors.newSingleThreadExecutor()
  private var artworkUrl: String? = null
  private var artwork: Bitmap? = null
  private var state: MediaState? = null

  override fun onCreate() {
    super.onCreate()
    createChannel()
    session = MediaSessionCompat(this, "Nuclear").apply {
      setCallback(object : MediaSessionCompat.Callback() {
        override fun onPlay() = dispatch("play")
        override fun onPause() = dispatch("pause")
        override fun onSkipToNext() = dispatch("next")
        override fun onSkipToPrevious() = dispatch("previous")
        override fun onStop() = dispatch("pause")
        override fun onSeekTo(pos: Long) = dispatch("seek", pos)
        override fun onPlayFromMediaId(mediaId: String?, extras: Bundle?) {
          if (mediaId != null) {
            dispatch("playMediaId", mediaId = mediaId)
          }
        }
      })
      setSessionActivity(launchIntent())
      isActive = true
    }
    sessionToken = session.sessionToken
    instance = this
    running = true
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    MediaButtonReceiver.handleIntent(session, intent)
    val current = pendingState ?: state
    pendingState = null
    if (current != null) {
      apply(current)
    } else {
      startInForeground(buildNotification(null))
    }
    return START_NOT_STICKY
  }

  override fun onTaskRemoved(rootIntent: Intent?) {
    stopSelf()
    super.onTaskRemoved(rootIntent)
  }

  override fun onDestroy() {
    instance = null
    running = false
    session.isActive = false
    session.release()
    artworkLoader.shutdownNow()
    super.onDestroy()
  }

  override fun onGetRoot(clientPackageName: String, clientUid: Int, rootHints: Bundle?) =
    BrowserRoot(ROOT_ID, null)

  override fun onLoadChildren(
    parentId: String,
    result: Result<MutableList<MediaBrowserCompat.MediaItem>>
  ) {
    val items = browseTree[parentId].orEmpty().map { item ->
      val description = MediaDescriptionCompat.Builder()
        .setMediaId(item.mediaId)
        .setTitle(item.title)
        .setSubtitle(item.subtitle)
        .build()
      MediaBrowserCompat.MediaItem(
        description,
        if (item.isPlayable) MediaBrowserCompat.MediaItem.FLAG_PLAYABLE
        else MediaBrowserCompat.MediaItem.FLAG_BROWSABLE
      )
    }
    result.sendResult(items.toMutableList())
  }

  private fun dispatch(action: String, position: Long? = null, mediaId: String? = null) {
    onAction?.invoke(action, position, mediaId)
  }

  private fun apply(newState: MediaState) {
    state = newState
    session.setMetadata(
      MediaMetadataCompat.Builder()
        .putString(MediaMetadataCompat.METADATA_KEY_TITLE, newState.title)
        .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, newState.artist)
        .putString(MediaMetadataCompat.METADATA_KEY_ALBUM, newState.album)
        .putLong(MediaMetadataCompat.METADATA_KEY_DURATION, newState.durationMs)
        .putBitmap(MediaMetadataCompat.METADATA_KEY_ALBUM_ART, artworkFor(newState.artworkUrl))
        .build()
    )
    session.setPlaybackState(
      PlaybackStateCompat.Builder()
        .setActions(
          PlaybackStateCompat.ACTION_PLAY or
            PlaybackStateCompat.ACTION_PAUSE or
            PlaybackStateCompat.ACTION_PLAY_PAUSE or
            PlaybackStateCompat.ACTION_SKIP_TO_NEXT or
            PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS or
            PlaybackStateCompat.ACTION_SEEK_TO
        )
        .setState(
          if (newState.isPlaying) PlaybackStateCompat.STATE_PLAYING else PlaybackStateCompat.STATE_PAUSED,
          newState.positionMs,
          if (newState.isPlaying) 1f else 0f
        )
        .build()
    )
    startInForeground(buildNotification(newState))
  }

  private fun artworkFor(url: String?): Bitmap? {
    if (url == artworkUrl) {
      return artwork
    }
    artworkUrl = url
    artwork = null
    if (url != null) {
      artworkLoader.execute {
        val bitmap = runCatching {
          URL(url).openStream().use { BitmapFactory.decodeStream(it) }
        }.getOrNull()
        if (bitmap != null && url == artworkUrl) {
          artwork = bitmap
          state?.let { current -> android.os.Handler(mainLooper).post { apply(current) } }
        }
      }
    }
    return null
  }

  private fun startInForeground(notification: Notification) {
    ServiceCompat.startForeground(
      this,
      NOTIFICATION_ID,
      notification,
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK else 0
    )
  }

  private fun launchIntent(): PendingIntent {
    val intent = packageManager.getLaunchIntentForPackage(packageName)
      ?: Intent(this, MainActivity::class.java)
    intent.flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
    return PendingIntent.getActivity(this, 0, intent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
  }

  private fun action(icon: Int, title: String, action: Long) =
    NotificationCompat.Action(icon, title, MediaButtonReceiver.buildMediaButtonPendingIntent(this, action))

  private fun buildNotification(current: MediaState?): Notification {
    val isPlaying = current?.isPlaying == true
    return NotificationCompat.Builder(this, CHANNEL_ID)
      .setSmallIcon(R.drawable.ic_notification)
      .setContentTitle(current?.title ?: getString(R.string.app_name))
      .setContentText(current?.artist)
      .setSubText(current?.album)
      .setLargeIcon(artwork)
      .setContentIntent(launchIntent())
      .setDeleteIntent(MediaButtonReceiver.buildMediaButtonPendingIntent(this, PlaybackStateCompat.ACTION_STOP))
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setOnlyAlertOnce(true)
      .setOngoing(isPlaying)
      .addAction(action(android.R.drawable.ic_media_previous, "Previous", PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS))
      .addAction(
        if (isPlaying) action(android.R.drawable.ic_media_pause, "Pause", PlaybackStateCompat.ACTION_PAUSE)
        else action(android.R.drawable.ic_media_play, "Play", PlaybackStateCompat.ACTION_PLAY)
      )
      .addAction(action(android.R.drawable.ic_media_next, "Next", PlaybackStateCompat.ACTION_SKIP_TO_NEXT))
      .setStyle(MediaStyle().setMediaSession(session.sessionToken).setShowActionsInCompactView(0, 1, 2))
      .build()
  }

  private fun createChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return
    }
    val channel = NotificationChannel(CHANNEL_ID, "Playback", NotificationManager.IMPORTANCE_LOW)
    channel.setShowBadge(false)
    getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
  }
}
