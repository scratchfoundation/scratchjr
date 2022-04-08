package org.scratchjr.android;

import android.Manifest;
import android.animation.ObjectAnimator;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ContentResolver;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.content.pm.PackageManager;
import android.graphics.Rect;
import android.graphics.RectF;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import android.util.Log;
import android.view.KeyEvent;
import android.view.View;
import android.view.View.OnSystemUiVisibilityChangeListener;
import android.view.ViewTreeObserver.OnGlobalLayoutListener;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.ConsoleMessage;
import android.webkit.CookieManager;
import android.webkit.CookieSyncManager;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.RelativeLayout;

import com.google.firebase.analytics.FirebaseAnalytics;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Vector;

/**
 * Main activity for Scratch Jr., consisting of a full-screen landscape WebView.
 *
 * This activity creates an embedded WebView, which runs the HTML5 app containing the majority of the source code.
 *
 * Special thanks to Benesse Corp. for providing access to their Android port, which helped inspire some of the source code here.
 *
 * @author markroth8
 */
public class ScratchJrActivity
    extends AppCompatActivity
{
    /** Milliseconds to pan when showing the soft keyboard */
    private static final int SOFT_KEYBOARD_PAN_MS = 250;

    /** Log tag for Scratch Jr. app */
    private static final String LOG_TAG = "ScratchJr";

    /** Bundle key in which the current url is stored */
    private static final String BUNDLE_KEY_URL = "url";

    /** The url of the index page */
    private static final String INDEX_PAGE_URL = "file:///android_asset/HTML5/index.html";

    /** Container containing the web view */
    private RelativeLayout _container;

    /** Web browser containing the Scratch Jr. HTML5 webapp */
    private WebView _webView;

    /** Maintains connection to database */
    private DatabaseManager _databaseManager;

    /** Performs file IO */
    private IOManager _ioManager;

    /** Manages sounds */
    private SoundManager _soundManager;

    /** Manages recording of new sounds */
    private SoundRecorderManager _soundRecorderManager;

    /** Set to true when the app is initialized. This is used for unit testing. */
    private boolean _appInitialized = false;

    /** Set to true when the editor is initialized. This is used for unit testing. */
    private boolean _editorInitialized = false;

    /** Set to true when the splash screen is done loading. This is used for unit testing. */
    private boolean _splashDone = false;

    /** Y starting and ending coordinate for soft keyboard scroll position */
    private int _softKeyboardScrollPosY0;
    private int _softKeyboardScrollPosY1;

    /** Handler for posting delayed updates */
    private final Handler _handler = new Handler();

    /** Run-time Permissions */
    private final int SCRATCHJR_CAMERA_MIC_PERMISSION = 1;
    public int cameraPermissionResult = PackageManager.PERMISSION_DENIED;
    public int micPermissionResult = PackageManager.PERMISSION_DENIED;
    public int readExtPermissionResult = PackageManager.PERMISSION_DENIED;

    /* Firebase analytics tracking */
    private FirebaseAnalytics _FirebaseAnalytics;

    /**
     * Project uri that need to be imported.
     */
    private ArrayList<Uri> projectUris = new ArrayList<>();

    /**
     * This set will contain all the library assets.
     * We are using set here so that we can find the asset
     * whether in library in O(1) time.
     */
    private final HashSet<String> assetList = new HashSet<>(200);

    public int assetLibraryVersion = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);

        _databaseManager = new DatabaseManager(this);
        _ioManager = new IOManager(this);
        _soundManager = new SoundManager(this);
        _soundRecorderManager = new SoundRecorderManager(this);
        setContentView(R.layout.activity_scratch_jr);
        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);
        _container = (RelativeLayout) findViewById(R.id.container);
        _webView = (WebView) findViewById(R.id.webview);
        _webView.setBackgroundColor(0x00000000);
        _webView.clearCache(true);
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.KITKAT) {
            Log.i(LOG_TAG, "Setting non-immersive full screen");
            getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                WindowManager.LayoutParams.FLAG_FULLSCREEN);
        } else {
            setImmersiveMode();
        }
        configureWebView();
        registerSoftKeyboardPanner();
        /* URL to load once ready */
        String urlToLoad;
        if ((savedInstanceState != null) && savedInstanceState.containsKey(BUNDLE_KEY_URL)) {
            Log.i(LOG_TAG, "Restoring bundle state...");
            urlToLoad = savedInstanceState.getString(BUNDLE_KEY_URL);
            if (urlToLoad == null) {
                urlToLoad = INDEX_PAGE_URL;
            }
        } else {
            urlToLoad = INDEX_PAGE_URL;
        }
        _webView.loadUrl(urlToLoad);

        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.setAcceptFileSchemeCookies(true);

        Intent it = getIntent();
        if (it != null && it.getData() != null) {
            receiveProject(it.getData());
        }

        _FirebaseAnalytics = FirebaseAnalytics.getInstance(this);

        // When System UI bar is displayed, wait one second and then re-assert immersive mode.
        getWindow().getDecorView().setOnSystemUiVisibilityChangeListener(new OnSystemUiVisibilityChangeListener() {
            @Override
            public void onSystemUiVisibilityChange(int visibility) {
                _handler.postDelayed(new Runnable() {
                    public void run() {
                        runOnUiThread(new Runnable() {
                            public void run() {
                                setImmersiveMode();
                            }
                        });
                    }
                }, 1000);
            }
        });
        requestPermissions();
    }

     /*
    Ask for all permissions when ScratchJr is first launched so that we are not asking a 5-7 year old to give permission
     */
    public void requestPermissions() {
        cameraPermissionResult = ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA);
        micPermissionResult = ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO);
        readExtPermissionResult = ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE);

        if (cameraPermissionResult == PackageManager.PERMISSION_GRANTED
            && micPermissionResult == PackageManager.PERMISSION_GRANTED
            && readExtPermissionResult == PackageManager.PERMISSION_GRANTED) {
            return;
        }

        Vector<String> tmp = new Vector<String>(3);
        if (cameraPermissionResult != PackageManager.PERMISSION_GRANTED) {
            tmp.add(Manifest.permission.CAMERA);
        }
        if (micPermissionResult != PackageManager.PERMISSION_GRANTED) {
            tmp.add(Manifest.permission.RECORD_AUDIO);
        }
        if (readExtPermissionResult != PackageManager.PERMISSION_GRANTED) {
            tmp.add(Manifest.permission.READ_EXTERNAL_STORAGE);
        }
        Object[] tmpArray = tmp.toArray();
        String[] desiredPermissions = Arrays.copyOf(tmpArray, tmpArray.length, String[].class);

        ActivityCompat.requestPermissions(this,
                desiredPermissions,
                SCRATCHJR_CAMERA_MIC_PERMISSION);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode,
                                           String permissions[], int[] grantResults) {
        if (requestCode == SCRATCHJR_CAMERA_MIC_PERMISSION) {
            int permissionId = 0;
            for (String permission : permissions) {
                if (permission.equals(Manifest.permission.CAMERA)) {
                    cameraPermissionResult = grantResults[permissionId];
                }
                if (permission.equals(Manifest.permission.RECORD_AUDIO)) {
                    micPermissionResult = grantResults[permissionId];
                }
                if (permission.equals(Manifest.permission.READ_EXTERNAL_STORAGE)) {
                    readExtPermissionResult = grantResults[permissionId];
                }
                permissionId++;
            }
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT && hasFocus) {
            setImmersiveMode();
        }
    }

    @Override
    public boolean onKeyDown(int keyCode, @NonNull KeyEvent event) {
        if (event.getAction() == KeyEvent.ACTION_DOWN) {
            switch (keyCode) {
            case KeyEvent.KEYCODE_BACK:
                // Check the WebView to see if we're on the editor page.
                // If so, call the JavaScript to save the current project
                // and return to the lobby.
                final String url = _webView.getUrl();
                if (url != null) {
                    Log.i(LOG_TAG, url);
                    if (url.contains("home.html")) {
                        runJavaScript("Lobby.goHome()");
                    } else if (url.contains("gettingstarted.html")) {
                        runJavaScript("closeme()");
                    } else if (url.contains("index.html")) {
                        finish();
                    } else if (url.contains("editor.html")) {
                        runJavaScript("ScratchJr.goBack()");
                    } else if (_webView.canGoBack()) {
                        _webView.goBack();
                    }
                }
                return true;
            }
        }
        return super.onKeyDown(keyCode, event);
    }

    @Override
    protected void onResume() {
        super.onResume();
        _databaseManager.open();
        _soundManager.open();
        _soundRecorderManager.open();
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                _webView.onResume();
                CookieSyncManager.getInstance().startSync();
            }
        });
        runJavaScript("if (typeof(ScratchJr) !== 'undefined') ScratchJr.onResume();");
    }

    @Override
    protected void onPause() {
        super.onPause();
        runJavaScript("if (typeof(ScratchJr) !== 'undefined') ScratchJr.onPause();");
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                _webView.onPause();
                CookieSyncManager.getInstance().stopSync();
            }
        });
        _databaseManager.close();
        _soundManager.close();
        _soundRecorderManager.close();
    }

    @Override
    protected void onSaveInstanceState(@NonNull Bundle outState) {
        super.onSaveInstanceState(outState);
        outState.putString(BUNDLE_KEY_URL, _webView.getUrl());
    }

    @Override
    protected void onNewIntent(Intent it) {
        super.onNewIntent(it);
        if (it != null && it.getData() != null) {
            receiveProject(it.getData());
        }
    }

    private void receiveProject(final Uri projectUri) {
        if (!isSplashDone()) {
            projectUris.add(projectUri);
            return;
        }
        importProject(projectUri);
    }

    private void importProject(final Uri projectUri) {
        String PROJECT_EXTENSION = getApplicationContext().getString(R.string.share_extension_filter);
        String scheme = projectUri.getScheme();
        Log.i(LOG_TAG, "receiveProject(scheme): " + scheme);
        Log.i(LOG_TAG, "receiveProject(path): " + projectUri.getPath());

        // if scheme isn't file or content, skip import
        if (scheme == null || !(scheme.equals(ContentResolver.SCHEME_FILE) || scheme.equals(ContentResolver.SCHEME_CONTENT))) {
            return;
        }
        // if scheme is file, then skip if filename doesn't have scratchjr project extension
        if (scheme.equals(ContentResolver.SCHEME_FILE) && !projectUri.getPath().matches(PROJECT_EXTENSION)) {
            return;
        }
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    _ioManager.receiveProject(ScratchJrActivity.this, projectUri);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        });
    }

    public RelativeLayout getContainer() {
        return _container;
    }

    public DatabaseManager getDatabaseManager() {
        return _databaseManager;
    }

    public IOManager getIOManager() {
        return _ioManager;
    }

    public SoundManager getSoundManager() {
        return _soundManager;
    }

    public SoundRecorderManager getSoundRecorderManager() {
        return _soundRecorderManager;
    }

    private void setImmersiveMode() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            Log.i(LOG_TAG, "Setting immersive mode");
            int immersiveStickyFlag = 0;
            try {
                immersiveStickyFlag = View.class.getField("SYSTEM_UI_FLAG_IMMERSIVE_STICKY").getInt(null);
            } catch (IllegalAccessException | IllegalArgumentException | NoSuchFieldException e) {
                Log.e(LOG_TAG, "Reflection fail", e);
            }
            _webView.setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                  | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                  | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                  | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                  | View.SYSTEM_UI_FLAG_FULLSCREEN
                  | immersiveStickyFlag);
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void configureWebView() {
        WebSettings webSettings = _webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setBuiltInZoomControls(false);
        webSettings.setDisplayZoomControls(false);
        webSettings.setLoadWithOverviewMode(false);
        webSettings.setUseWideViewPort(false);
        if (BuildConfig.DEBUG) {
            WebView.setWebContentsDebuggingEnabled(true);
        }

        // Enable cookie persistence
        CookieManager.setAcceptFileSchemeCookies(true);
        CookieManager cookieManager = CookieManager.getInstance();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            cookieManager.setAcceptThirdPartyCookies(_webView, true);
        } else {
            cookieManager.setAcceptCookie(true);
        }
        CookieSyncManager.createInstance(this);

        /* Object exposed to the JavaScript that makes it easy to bridge JavaScript and Java */
        JavaScriptDirectInterface javaScriptDirectInterface = new JavaScriptDirectInterface(this);
        _webView.addJavascriptInterface(javaScriptDirectInterface, "AndroidInterface");
        _webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                Log.e(LOG_TAG, description);
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                // Filter out Internet links and open those with the Android browser
                if (url != null && (url.startsWith("http://") || url.startsWith("https://"))) {
                    view.getContext().startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
                    return true;
                }
                return false; // Allow WebView to load url
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                // Sync cookies
                CookieSyncManager.getInstance().sync();

                // Track page load
                String[] parts = url.split("/");
                String page = parts[parts.length - 1].split("\\?")[0];
                _FirebaseAnalytics.setCurrentScreen((Activity) view.getContext(), page, null);
            }
        });
        _webView.requestFocus(View.FOCUS_DOWN);
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowFileAccessFromFileURLs(true);
        webSettings.setAllowUniversalAccessFromFileURLs(true);
        webSettings.setAllowContentAccess(true);

        // Configure the web chrome client to consume console.log
        // calls from JavaScript.
        Log.i(LOG_TAG, "Configurating webChromeClient");
        _webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(@NonNull ConsoleMessage cm) {
                Log.e(LOG_TAG, "JavaScript log, " + cm.sourceId() + ":" + cm.lineNumber() + ", " + cm.message());
                return true;
            }
        });
    }

    public void createNewProject() {
        runJavaScript("Home.createNewProject()");
    }

    /**
     * Returns true when all resources are loaded and the app is initialized.
     */
    public boolean isAppInitialized() {
        return _appInitialized;
    }

    public void setAppInitialized(boolean initialized) {
        _appInitialized = initialized;
    }

    public boolean isEditorInitialized() {
        return _editorInitialized;
    }

    public void setEditorInitialized(boolean initialized) {
        _editorInitialized = initialized;
    }

    public boolean isSplashDone() {
        return _splashDone;
    }

    public void setSplashDone(boolean done) {
        _splashDone = done;
        while (projectUris.size() > 0) {
            Uri uri = projectUris.remove(0);
            importProject(uri);
        }
    }

    /**
     * Click the "Home" button on the title screen (for unit testing).
     */
    public void goHome() {
        runJavaScript("gohome()");
    }

    /**
     * Run the given JavaScript in the web view.
     */
    public void runJavaScript(final String js) {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                _webView.loadUrl("javascript:" + js);
            }
        });
    }

    /**
     * log a Firebase analytics event for the app
     * @param category
     * @param action
     * @param label
     */
    public void logAnalyticsEvent(String category, String action, String label) {
        Bundle params = new Bundle();
        params.putString(FirebaseAnalytics.Param.ITEM_CATEGORY, category);
        params.putString(FirebaseAnalytics.Param.ITEM_NAME, label);
        _FirebaseAnalytics.logEvent(action, params);
    }

    /**
     * Record the preferred place for the user: home, school, other, noanswer
     * @param place
     */
    public void setAnalyticsPlacePref(String place) {
        _FirebaseAnalytics.setUserProperty("place_preference", place);
    }

    /**
     * Record a user property
     * @param key like "school"
     * @param value like "Central High"
     */
    public void setAnalyticsPref(String key, String value) {
        _FirebaseAnalytics.setUserProperty(key, value);
    }

    public void translateAndScaleRectToContainerCoords(RectF rect, float devicePixelRatio) {
        float wx = _webView.getX();
        float wy = _webView.getY();
        rect.set(wx + rect.left * devicePixelRatio, wy + rect.top * devicePixelRatio,
            wx + rect.right * devicePixelRatio, wy + rect.bottom * devicePixelRatio);
    }

    public void setSoftKeyboardScrollLocation(int topYPx, int bottomYPx) {
        _softKeyboardScrollPosY0 = topYPx;
        _softKeyboardScrollPosY1 = bottomYPx;
    }

    /**
     * Height of the status bar at the top of the screen
     * We should always know the status bar height even if
     * the status bar is not visible at all.
     * See https://stackoverflow.com/a/14213035
     */
    private int getStatusBarHeight() {
        int result = 0;
        int resourceId = getResources().getIdentifier(
            "status_bar_height",
            "dimen",
            "android"
        );
        if (resourceId > 0) {
            result = getResources().getDimensionPixelSize(resourceId);
        }
        return result;
    }

    /**
     * Android does not properly pan to the text fields in full screen mode, so
     * here we introduce some custom logic to pan when the soft keyboard appears.
     *
     * The technique used here was inspired by http://stackoverflow.com/questions/7417123/
     * android-how-to-adjust-layout-in-full-screen-mode-when-softkeyboard-is-visible
     */
    private void registerSoftKeyboardPanner() {
        _container.getViewTreeObserver().addOnGlobalLayoutListener(
            new OnGlobalLayoutListener() {
                private int _priorVisibleHeight;
                private ObjectAnimator _currentAnimator;

                @Override
                public void onGlobalLayout() {
                    Rect r = new Rect();
                    _container.getWindowVisibleDisplayFrame(r);
                    int currentVisibleHeight = r.bottom - r.top;

                    // Determine if visible height changed
                    if (currentVisibleHeight != _priorVisibleHeight) {
                        // Determine if keyboard visibility changed
                        int screenHeight = _container.getRootView().getHeight();
                        int coveredHeight = screenHeight - currentVisibleHeight;
                        if((currentVisibleHeight < _priorVisibleHeight) && (coveredHeight > (screenHeight / 4))) {
                            // Keyboard probably just became visible

                            // Get the current focus elements top & bottom using a ratio to convert the values
                            // to the native scale.
                            int elTop = _softKeyboardScrollPosY0;
                            int elBottom = _softKeyboardScrollPosY1;

                            // Determine the amount of the focus element covered by the keyboard
                            int elPixelsCovered = elBottom - currentVisibleHeight;

                            // If any amount is covered
                            if (elPixelsCovered > 0) {
                                // Pan by the amount of coverage
                                int panUpPixels = elPixelsCovered;

                                // Prevent panning so much the top of the element becomes hidden
                                panUpPixels = panUpPixels > elTop ? elTop : panUpPixels;

                                // Prevent panning more than the keyboard height (which produces an empty gap in the screen)
                                int statusBarHeight = getStatusBarHeight();
                                panUpPixels = panUpPixels > (coveredHeight - statusBarHeight) ?
                                    (coveredHeight - statusBarHeight) : panUpPixels;

                                // Pan up
                                cancelAnimator();
                                ObjectAnimator animator = ObjectAnimator.ofFloat(_container, "y", _container.getY(), -panUpPixels).
                                    setDuration(SOFT_KEYBOARD_PAN_MS);
                                animator.start();
                                _currentAnimator = animator;
                            }
                            else {
                                cancelAnimator();
                                ObjectAnimator animator = ObjectAnimator.ofFloat(_container, "y", _container.getY(),
                                    getStatusBarHeight()).setDuration(SOFT_KEYBOARD_PAN_MS);
                                animator.start();
                                _currentAnimator = animator;
                            }
                        } else if (currentVisibleHeight > _priorVisibleHeight + getStatusBarHeight()) {
                            // The status bar will be hidden ONE second after the keyboard is shown,
                            // on some devices like SM-T280, the `currentVisibleHeight` will increase
                            // by the status bar height, we don't want it to infect the keyboard.
                            // -- Yueyu Zhao
                            // Keyboard probably just became hidden

                            // Reset pan
                            cancelAnimator();
                            ObjectAnimator animator = ObjectAnimator.ofFloat(_container, "y", _container.getY(), 0).
                                setDuration(SOFT_KEYBOARD_PAN_MS);
                            animator.start();
                            _currentAnimator = animator;
                            setImmersiveMode();
                            runJavaScript("if (typeof(ScratchJr) !== 'undefined') ScratchJr.editDone();");
                        }

                        // Save usable height for the next comparison
                        _priorVisibleHeight = currentVisibleHeight;
                    }
                }

                private void cancelAnimator() {
                    ObjectAnimator animator = _currentAnimator;
                    if (animator != null) {
                        if (animator.isStarted()) {
                            animator.cancel();
                        }
                        _currentAnimator = null;
                    }
                }
            });
    }

    /**
     * We record all library assets names when app starts,
     * so that we can know whether an asset should be marked
     * as a user created one when importing.
     * @param assets library asset md5
     */
    public void registerLibraryAssets(String[] assets) {
        int length = assets.length;
        for (int i = 0; i < length; i++) {
            assetList.add(assets[i]);
        }
    }

    public boolean libraryHasAsset(String md5) {
        return assetList.contains(md5);
    }
}
