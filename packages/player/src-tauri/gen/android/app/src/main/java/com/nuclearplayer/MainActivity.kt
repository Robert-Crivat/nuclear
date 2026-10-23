package com.nuclearplayer

import android.graphics.Canvas
import android.graphics.Color
import android.graphics.ColorFilter
import android.graphics.Paint
import android.graphics.PixelFormat
import android.graphics.drawable.Drawable
import android.os.Bundle
import android.view.View
import android.webkit.WebView
import androidx.activity.OnBackPressedCallback
import androidx.activity.enableEdgeToEdge
import androidx.core.graphics.ColorUtils
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import java.lang.ref.WeakReference

private class SystemBarsBackground : Drawable() {
  val topPaint = Paint()
  val bottomPaint = Paint()
  var topInset = 0
  var bottomInset = 0

  override fun draw(canvas: Canvas) {
    val width = bounds.width().toFloat()
    val height = bounds.height().toFloat()
    canvas.drawRect(0f, 0f, width, topInset.toFloat(), topPaint)
    canvas.drawRect(0f, height - bottomInset, width, height, bottomPaint)
  }

  override fun setAlpha(alpha: Int) {}

  override fun setColorFilter(colorFilter: ColorFilter?) {}

  @Deprecated("Deprecated in Java")
  override fun getOpacity() = PixelFormat.OPAQUE
}

class MainActivity : TauriActivity() {
  companion object {
    private var current = WeakReference<MainActivity>(null)
    private var topColor = Color.BLACK
    private var bottomColor = Color.BLACK

    fun setSystemBarColors(top: Int, bottom: Int) {
      topColor = top
      bottomColor = bottom
      current.get()?.applySystemBarColors()
    }
  }

  private var webView: WebView? = null
  private val systemBarsBackground = SystemBarsBackground()

  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
    val decor = window.decorView
    decor.background = systemBarsBackground
    ViewCompat.setOnApplyWindowInsetsListener(decor) { _, insets ->
      val bars = insets.getInsets(
        WindowInsetsCompat.Type.systemBars() or
          WindowInsetsCompat.Type.displayCutout() or
          WindowInsetsCompat.Type.ime()
      )
      findViewById<View>(android.R.id.content)
        .setPadding(bars.left, bars.top, bars.right, bars.bottom)
      systemBarsBackground.topInset = bars.top
      systemBarsBackground.bottomInset = bars.bottom
      decor.invalidate()
      WindowInsetsCompat.CONSUMED
    }
    current = WeakReference(this)
    applySystemBarColors()
  }

  private fun applySystemBarColors() {
    systemBarsBackground.topPaint.color = topColor
    systemBarsBackground.bottomPaint.color = bottomColor
    window.decorView.invalidate()
    WindowCompat.getInsetsController(window, window.decorView).apply {
      isAppearanceLightStatusBars = ColorUtils.calculateLuminance(topColor) > 0.5
      isAppearanceLightNavigationBars = ColorUtils.calculateLuminance(bottomColor) > 0.5
    }
  }

  override fun onWebViewCreate(webView: WebView) {
    this.webView = webView
    onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
      override fun handleOnBackPressed() {
        webView.evaluateJavascript("window.__nuclearHandleBack?.() === true") { handled ->
          when {
            handled == "true" -> Unit
            webView.canGoBack() -> webView.goBack()
            else -> moveTaskToBack(true)
          }
        }
      }
    })
  }

  override fun onPause() {
    super.onPause()
    if (MediaPlaybackService.running) {
      webView?.onResume()
    }
  }
}
