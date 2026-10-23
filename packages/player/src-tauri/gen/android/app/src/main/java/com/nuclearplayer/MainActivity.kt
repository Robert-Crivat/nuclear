package com.nuclearplayer

import android.graphics.Canvas
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

private class SystemBarsBackground(private val view: View) : Drawable() {
  val topPaint = Paint()
  val bottomPaint = Paint()

  override fun draw(canvas: Canvas) {
    val width = bounds.width().toFloat()
    val height = bounds.height().toFloat()
    canvas.drawRect(0f, 0f, width, view.paddingTop.toFloat(), topPaint)
    canvas.drawRect(0f, height - view.paddingBottom, width, height, bottomPaint)
  }

  override fun setAlpha(alpha: Int) {}

  override fun setColorFilter(colorFilter: ColorFilter?) {}

  @Deprecated("Deprecated in Java")
  override fun getOpacity() = PixelFormat.OPAQUE
}

class MainActivity : TauriActivity() {
  private var webView: WebView? = null
  private lateinit var content: View
  private lateinit var systemBarsBackground: SystemBarsBackground

  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
    content = findViewById(android.R.id.content)
    systemBarsBackground = SystemBarsBackground(content)
    content.background = systemBarsBackground
    ViewCompat.setOnApplyWindowInsetsListener(content) { view, insets ->
      val bars = insets.getInsets(
        WindowInsetsCompat.Type.systemBars() or
          WindowInsetsCompat.Type.displayCutout() or
          WindowInsetsCompat.Type.ime()
      )
      view.setPadding(bars.left, bars.top, bars.right, bars.bottom)
      WindowInsetsCompat.CONSUMED
    }
  }

  fun setSystemBarColors(top: Int, bottom: Int) {
    systemBarsBackground.topPaint.color = top
    systemBarsBackground.bottomPaint.color = bottom
    content.invalidate()
    WindowCompat.getInsetsController(window, window.decorView).apply {
      isAppearanceLightStatusBars = ColorUtils.calculateLuminance(top) > 0.5
      isAppearanceLightNavigationBars = ColorUtils.calculateLuminance(bottom) > 0.5
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
