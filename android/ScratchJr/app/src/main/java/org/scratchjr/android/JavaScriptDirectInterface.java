package org.scratchjr.android;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Iterator;
import java.util.Locale;
import java.util.UUID;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.annotation.SuppressLint;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.RectF;
import android.hardware.Camera;
import android.media.Image;
import android.net.Uri;
import android.text.Html;
import android.util.Base64;
import android.util.Log;
import android.view.inputmethod.InputMethodManager;
import android.webkit.JavascriptInterface;
import android.widget.ImageView;
import android.widget.RelativeLayout;

import androidx.annotation.NonNull;
import androidx.camera.core.ImageCapture;
import androidx.camera.core.ImageCaptureException;
import androidx.camera.core.ImageProxy;

/**
 * The methods in this inner class are exposed directly to JavaScript in the HTML5 pages
 * as AndroidInterface.
 *
 * @author markroth8
 */
public class JavaScriptDirectInterface {
    private static final String LOG_TAG = "ScratchJr.JSDirect";

    /** Activity hosting the webview running the JavaScript */
    private final ScratchJrActivity _activity;

    /** Current camera view, if active */
    private CameraView _cameraView;

    /** Current camera mask, if active */
    private ImageView _cameraMask;

    /**
     * @param scratchJrActivity
     */
    JavaScriptDirectInterface(ScratchJrActivity scratchJrActivity) {
        _activity = scratchJrActivity;
    }

    @JavascriptInterface
    public void log(String message) {
        Log.i(LOG_TAG, message);
    }

    @JavascriptInterface
    public void notifySplashDone() {
        Log.i(LOG_TAG, "Splash screen done loading");
        _activity.setSplashDone(true);
    }

    @JavascriptInterface
    public void notifyDoneLoading() {
        Log.i(LOG_TAG, "Application is done loading");
        _activity.setAppInitialized(true);
    }

    @JavascriptInterface
    public void notifyEditorDoneLoading() {
        Log.i(LOG_TAG, "Editor is done loading");
        _activity.setEditorInitialized(true);
    }

    //////////////////////////////////////////////////////////////////////
    // audio_*

    @JavascriptInterface
    public void audio_sndfx(String file) {
        SoundManager soundManager = _activity.getSoundManager();
        soundManager.playSoundEffect(file);
    }

    @JavascriptInterface
    public void audio_sndfxwithvolume(String file, float volume) {
        SoundManager soundManager = _activity.getSoundManager();
        soundManager.playSoundEffectWithVolume(file, volume);
    }

    @JavascriptInterface
    public int audio_play(String file, float volume) {
        SoundManager soundManager = _activity.getSoundManager();
        return soundManager.playSound(file);
    }

    @JavascriptInterface
    public boolean audio_isplaying(int soundId) {
        SoundManager soundManager = _activity.getSoundManager();
        return soundManager.isPlaying(soundId);
    }

    @JavascriptInterface
    public void audio_stop(int soundId) {
        SoundManager soundManager = _activity.getSoundManager();
        soundManager.stopSound(soundId);
    }

    //////////////////////////////////////////////////////////////////////
    // database_*

    @JavascriptInterface
    public String database_query(String json) {
        String result;
        try {
            JSONObject obj = new JSONObject(json);
            String stmt = obj.getString("stmt");
            JSONArray valuesJSONArray = obj.getJSONArray("values");
            String[] values = ScratchJrUtil.jsonArrayToStringArray(valuesJSONArray);
            DatabaseManager databaseManager = _activity.getDatabaseManager();
            result = databaseManager.query(stmt, values).toString();
        } catch (JSONException e) {
            result = "JSON error: " + e.getMessage();
        } catch (DatabaseException e) {
            result = "SQL error: " + e.getMessage();
        }
        return result;
    }

    @JavascriptInterface
    public String database_stmt(String json) {
        String result;
        try {
            JSONObject obj = new JSONObject(json);
            String stmt = obj.getString("stmt");
            JSONArray valuesJSONArray = obj.getJSONArray("values");
            String[] values = ScratchJrUtil.jsonArrayToStringArray(valuesJSONArray);
            DatabaseManager databaseManager = _activity.getDatabaseManager();
            result = databaseManager.stmt(stmt, values).toString();
        } catch (JSONException e) {
            result = "JSON error: " + e.getMessage();
        } catch (DatabaseException e) {
            result = "SQL error: " + e.getMessage();
        }
        return result;
    }

    //////////////////////////////////////////////////////////////////////
    // io_*

    @JavascriptInterface
    public String io_getmd5(String str) {
        IOManager ioManager = _activity.getIOManager();
        return ioManager.md5(str);
    }

    @JavascriptInterface
    public String io_getsettings() {
        String homeDirectory = "";
        String choice = "";
        String soundPermission = (_activity.micPermissionResult == PackageManager.PERMISSION_GRANTED) ? "YES" : "NO";
        String cameraPermission = (_activity.cameraPermissionResult == PackageManager.PERMISSION_GRANTED) ? "YES" : "NO";
        return homeDirectory + "," + choice + "," + soundPermission + "," + cameraPermission;
    }

    @JavascriptInterface
    public void io_cleanassets(String fileType) {
        IOManager ioManager = _activity.getIOManager();
        try {
            ioManager.cleanAssets(fileType);
        } catch (IOException e) {
            Log.e(LOG_TAG, "Could not clean assets", e);
        }
    }

    @JavascriptInterface
    public String io_setfile(String filename, String base64ContentStr) {
        String result;
        IOManager ioManager = _activity.getIOManager();
        try {
            result = ioManager.setFile(filename, base64ContentStr);
        } catch (IOException e) {
            Log.e(LOG_TAG, "Could not set file '" + filename + "'", e);
            result = "-1";
        }
        return result;
    }

    @JavascriptInterface
    public String io_getfile(String filename) {
        String result;
        IOManager ioManager = _activity.getIOManager();
        try {
            result = ioManager.getFile(filename);
        } catch (IOException e) {
            Log.e(LOG_TAG, "Could not get file '" + filename + "'", e);
            result = "";
        }
        return result;
    }

    @JavascriptInterface
    public String io_setmedia(String base64ContentStr, String extension) {
        String result;
        IOManager ioManager = _activity.getIOManager();
        try {
            result = ioManager.setMedia(base64ContentStr, extension);
        } catch (IOException e) {
            Log.e(LOG_TAG, "Could not set media of type '" + extension + "'", e);
            result = "-1";
        }
        return result;
    }

    @JavascriptInterface
    public String io_setmedianame(String contents, String key, String ext) {
        String result;
        IOManager ioManager = _activity.getIOManager();
        try {
            result = ioManager.setMediaName(contents, key, ext);
        } catch (IOException e) {
            Log.e(LOG_TAG, "Could not set media name of key '" + key + "' ext '" + ext + "'", e);
            result = "-1";
        }
        return result;
    }

    @JavascriptInterface
    public String io_getmedia(String filename) {
        String result;
        IOManager ioManager = _activity.getIOManager();
        try {
            result = ioManager.getMedia(filename);
        } catch (IOException e) {
            Log.e(LOG_TAG, "Could not get media with filename '" + filename + "'", e);
            result = "-1";
        }
        return result;
    }

    @JavascriptInterface
    public String io_getmediadata(String filename, int offset, int length) {
        IOManager ioManager = _activity.getIOManager();
        return ioManager.getMediaData(filename, offset, length);
    }

    @JavascriptInterface
    public int io_getmedialen(String file, String key) {
        int result;
        IOManager ioManager = _activity.getIOManager();
        try {
            result = ioManager.getMediaLen(file, key);
        } catch (IOException e) {
            Log.e(LOG_TAG, "Could not get media len for file '" + file + "' key '" + key + "'", e);
            result = 0;
        }
        return result;
    }

    @JavascriptInterface
    public String io_getmediadone(String filename) {
        IOManager ioManager = _activity.getIOManager();
        ioManager.getMediaDone(filename);
        return "1";
    }

    @JavascriptInterface
    public String io_remove(String filename) {
    	String result;
    	IOManager ioManager = _activity.getIOManager();

    	Log.d(LOG_TAG, "Trying to remove filename '" + filename + "'");

    	try {
    		result = ioManager.remove(filename) ? "1" : "-1";
    	} catch (IOException e) {
    		Log.e(LOG_TAG, "Could not remove file '" + filename + "'", e);
    		result = "-1";
    	}
    	return result;
    }

    //////////////////////////////////////////////////////////////////////
    // recordsound_*

    @JavascriptInterface
    public String recordsound_recordstart() {
        SoundRecorderManager soundRecorderManager = _activity.getSoundRecorderManager();
        String soundFile = soundRecorderManager.startRecord();
        return (soundFile == null) ? "-1" : soundFile;
    }

    @JavascriptInterface
    public String recordsound_recordstop() {
        SoundRecorderManager soundRecorderManager = _activity.getSoundRecorderManager();
        try {
            return soundRecorderManager.stopRecord() ? "1" : "-1";
        } catch (Throwable t) {
            Log.e(LOG_TAG, "Error stopping recording", t);
            return "-1";
        }
    }

    @JavascriptInterface
    public double recordsound_volume() {
        SoundRecorderManager soundRecorderManager = _activity.getSoundRecorderManager();
        return soundRecorderManager.getVolume();
    }

    @JavascriptInterface
    public String recordsound_startplay() {
        SoundRecorderManager soundRecorderManager = _activity.getSoundRecorderManager();
        try {
            return Double.toString(soundRecorderManager.startPlay());
        } catch (IllegalStateException e) {
            Log.e(LOG_TAG, "Error starting play", e);
            return "ERROR: " + e.getMessage();
        }
    }

    @JavascriptInterface
    public String recordsound_stopplay() {
        SoundRecorderManager soundRecorderManager = _activity.getSoundRecorderManager();
        try {
            soundRecorderManager.stopPlay();
            return "1";
        } catch (IllegalStateException e) {
            Log.e(LOG_TAG, "Error stopping play", e);
            return "-1";
        }
    }

    @JavascriptInterface
    public String recordsound_recordclose(String keep) {
        boolean keepBoolean = !keep.toLowerCase(Locale.US).equals("no");
        SoundRecorderManager soundRecorderManager = _activity.getSoundRecorderManager();
        soundRecorderManager.recordClose(keepBoolean);
        return keepBoolean ? "1" : "-1";
    }

    //////////////////////////////////////////////////////////////////////
    // scratchjr_*

    @JavascriptInterface
    public String scratchjr_cameracheck() {
        return _activity.getPackageManager().hasSystemFeature(PackageManager.FEATURE_CAMERA_ANY) ? "1" : "0";
    }

    @JavascriptInterface
    public boolean scratchjr_has_multiple_cameras() {
        return Camera.getNumberOfCameras() > 1;
    }

    @JavascriptInterface
    public String scratchjr_startfeed(String str) {
        try {
            JSONObject obj = new JSONObject(str);
            String imageDataStr = obj.getString("image");
            if (!imageDataStr.startsWith("data:image/png")) {
                Log.e(LOG_TAG, "Expecting data URL for image data but got '" + imageDataStr + "'");
                return "-1";
            }
            String base64ImageData = imageDataStr.substring(imageDataStr.indexOf(";base64,") + 8);
            byte[] imageContent = Base64.decode(base64ImageData, Base64.NO_WRAP);

            float x = (float) obj.getDouble("x");
            float y = (float) obj.getDouble("y");
            float width = (float) obj.getDouble("width");
            float height = (float) obj.getDouble("height");
            RectF r = new RectF(x, y, x + width, y + height);

            float mx = (float) obj.getDouble("mx");
            float my = (float) obj.getDouble("my");
            float mw = (float) obj.getDouble("mw");
            float mh = (float) obj.getDouble("mh");
            RectF r2 = new RectF(mx, my, mx + mw, my + mh);

            float scale = (float) obj.getDouble("scale");
            float devicePixelRatio = (float) obj.getDouble("devicePixelRatio");
            openFeed(r, scale, devicePixelRatio, imageContent, r2);
        } catch (JSONException e) {
            Log.e(LOG_TAG, "Could not decode json: '" + str + "'", e);
            return "-1";
        }
        return "1";
    }

    @JavascriptInterface
    public String scratchjr_stopfeed() {
        closeFeed();
        return "1";
    }

    @JavascriptInterface
    public String scratchjr_choosecamera(String facing) {
        String result = "-1";
        if (_cameraView != null) {
            if (_cameraView.setCameraFacing(facing.equals("front"))) {
                result = "1";
            } else {
                result = "-1";
            }
        }
        return result;
    }

    @JavascriptInterface
    public void scratchjr_captureimage(final String onCameraCaptureComplete) {
        _cameraView.captureStillImage(new ImageCapture.OnImageCapturedCallback() {
            @Override
            public void onCaptureSuccess(@NonNull ImageProxy imageProxy) {
                @SuppressLint("UnsafeOptInUsageError")
                Image image = imageProxy.getImage();
                if (image != null) {
                    byte[] jpegData = _cameraView.imageToByteArray(image);
                    sendBase64Image(onCameraCaptureComplete, jpegData);
                }
                imageProxy.close();
            }

            @Override
            public void onError(@NonNull ImageCaptureException exception) {
                Log.e(LOG_TAG, "Could not capture picture");
                reportImageError(onCameraCaptureComplete);
            }
        });
    }

    @JavascriptInterface
    public String scratchjr_getgettingstartedvideopath() {
        File cacheDir = _activity.getCacheDir();
        File videoFile = new File(cacheDir, "intro.mp4");
        if (!videoFile.exists()) {
            copyVideoToCacheDir();
        }
        if (!videoFile.exists()) {
            Log.w(LOG_TAG, "Video file does not exist after copying: '" + videoFile.getPath() + "'");
        }
        return videoFile.getPath();
    }

    @JavascriptInterface
    public String scratchjr_stopserver() {
        // On Android, we don't use an HTTP server - everything gets invoked directly.
        return "1";
    }

    @JavascriptInterface
    public void scratchjr_setsoftkeyboardscrolllocation(int topYPx, int bottomYPx) {
        _activity.setSoftKeyboardScrollLocation(topYPx, bottomYPx);
    }

    /**
     * Pop up the soft keyboard if this is not a hardware-keyboard device.
     */
    @JavascriptInterface
    public void scratchjr_forceShowKeyboard() {
        InputMethodManager mgr = (InputMethodManager) _activity.getSystemService(Context.INPUT_METHOD_SERVICE);
        mgr.showSoftInput(_activity.getCurrentFocus(), InputMethodManager.SHOW_IMPLICIT);
    }

    /**
     * Hide the soft keyboard if this is not a hardware-keyboard device.
     */
    @JavascriptInterface
    public void scratchjr_forceHideKeyboard() {
        InputMethodManager mgr = (InputMethodManager) _activity.getSystemService(Context.INPUT_METHOD_SERVICE);
        mgr.hideSoftInputFromWindow(_activity.getCurrentFocus().getWindowToken(), 0);
    }

    private void sendBase64Image(String onCameraCaptureComplete, byte[] jpegData) {
        Bitmap bitmap = BitmapFactory.decodeByteArray(jpegData, 0, jpegData.length);
        Log.i(LOG_TAG, "Picture size: " + bitmap.getWidth() + " x " + bitmap.getHeight());
        int exifRotation = CameraExif.getOrientation(jpegData);
        Log.i(LOG_TAG, "Picture rotation: " + exifRotation);
        byte[] translatedJpegData = _cameraView.getTransformedImage(bitmap, exifRotation);
        String base64Data = Base64.encodeToString(translatedJpegData, Base64.NO_WRAP);
        closeFeed();
        _activity.runJavaScript(onCameraCaptureComplete + "('" + base64Data + "');");
    }

    private void reportImageError(String onCameraCaptureComplete) {
        _activity.runJavaScript(onCameraCaptureComplete + "('error getting a still');");
    }

    private void openFeed(final RectF rect, final float scale, final float devicePixelRatio, final byte[] maskImageData,
        final RectF maskRect)
    {
        _activity.runOnUiThread(new Runnable() {
            public void run() {
                _activity.translateAndScaleRectToContainerCoords(rect, devicePixelRatio);
                _activity.translateAndScaleRectToContainerCoords(maskRect, devicePixelRatio);
                scaleRectFromCenter(rect, scale);
                scaleRectFromCenter(maskRect, scale);
                RelativeLayout container = _activity.getContainer();

                _cameraView = new CameraView(_activity, rect, scale * devicePixelRatio, true); // always start with front-facing camera
                container.addView(_cameraView, new RelativeLayout.LayoutParams((int) (rect.width()), (int) (rect.height())));
                _cameraView.setX(rect.left);
                _cameraView.setY(rect.top);

                _cameraMask = new ImageView(_activity);
                Bitmap bitmap = BitmapFactory.decodeByteArray(maskImageData, 0, maskImageData.length);
                _cameraMask.setImageBitmap(bitmap);
                container.addView(_cameraMask, new RelativeLayout.LayoutParams((int) (maskRect.width()), (int) (maskRect.height())));
                _cameraMask.setX(maskRect.left);
                _cameraMask.setY(maskRect.top);
            }
        });
    }

    private void scaleRectFromCenter(RectF rect, float scale) {
        float deltaWidth = rect.width() * scale - rect.width();
        float deltaHeight = rect.height() * scale - rect.height();
        rect.left -= deltaWidth / 2;
        rect.top -= deltaHeight / 2;
        rect.right += deltaWidth / 2;
        rect.bottom += deltaHeight / 2;
    }

    private void closeFeed() {
        _activity.runOnUiThread(new Runnable() {
            public void run() {
                RelativeLayout container = _activity.getContainer();
                if (_cameraView != null) {
                    container.removeView(_cameraView);
                    _cameraView = null;
                }
                if (_cameraMask != null) {
                    container.removeView(_cameraMask);
                    _cameraMask = null;
                }
            }
        });
    }

    private void copyVideoToCacheDir() {
        InputStream in = null;
        OutputStream out = null;
        try {
            File cacheDir = _activity.getCacheDir();
            File videoFile = new File(cacheDir, "intro.mp4");
            byte[] buffer = new byte[1024];
            int len;
            in = _activity.getAssets().open("HTML5/assets/lobby/intro.mp4");
            out = new FileOutputStream(videoFile);
            while ((len = in.read(buffer)) != -1) {
                out.write(buffer, 0, len);
            }
        } catch (IOException e) {
            Log.e(LOG_TAG, "Could not copy video to cache dir", e);
        } finally {
            if (in != null) {
                try {
                    in.close();
                } catch (IOException e) {
                    Log.e(LOG_TAG, "Could not close input stream while copying video file", e);
                }
            }
            if (out != null) {
                try {
                    out.close();
                } catch (IOException e) {
                    Log.e(LOG_TAG, "Could not close output stream while copying video file", e);
                }
            }
        }
    }

    //////////////////////////////////////////////////////////////////////
    // Sharing

    @JavascriptInterface
    public String deviceName() {
        return android.os.Build.MODEL;
    }

    @JavascriptInterface
    public String createZipForProject(String projectData, String metadataJson, String name) {
        // clean up old zip files
        _activity.getIOManager().cleanZips();
        // create a temp folder
        File tempFolder = new File(_activity.getCacheDir() + File.separator + UUID.randomUUID().toString());
        File projectFolder = new File(tempFolder.getPath() + File.separator + "project");
        projectFolder.mkdirs();
        // save data.json
        // Log.d(LOG_TAG, "writing data.json");
        File dataFile = new File(projectFolder.getAbsolutePath() + File.separator + "data.json");
        try {
            FileOutputStream outputStream = new FileOutputStream(dataFile);
            outputStream.write(projectData.getBytes());
            outputStream.close();
        } catch (IOException e) {
            e.printStackTrace();
            return "error";
        }
        // Log.d(LOG_TAG, "writing data.json done");
        // copy assets to target folder
        JSONObject metadata;
        try {
            metadata = new JSONObject(metadataJson);
        } catch (JSONException e) {
            e.printStackTrace();
            return "error";
        }
        // Log.d(LOG_TAG, "copying assets");
        Iterator<String> keys = metadata.keys();
        while (keys.hasNext()) {
            String key = keys.next();
            File folder = new File(projectFolder.getAbsolutePath() + File.separator + key);
            if (!folder.exists()) {
                folder.mkdir();
            }
            JSONArray files = metadata.optJSONArray(key);
            if (files == null) {
                continue;
            }
            for (int i = 0; i < files.length(); i++) {
                String file = files.optString(i);
                if (file != null) {
                    File targetFile = new File(folder.getAbsolutePath() + File.separator + file);
                    try {
                        this.copyAssetTo(file, targetFile);
                    } catch (IOException e) {
                        Log.e(LOG_TAG, "Asset for " + file + " copy failed.");
                        e.printStackTrace();
                    }
                }
            }
        }
        // create zip file
        String extension = ScratchJrUtil.getExtension();
        String fullName = name + extension;
        ScratchJrUtil.zipProject(
            projectFolder.getAbsolutePath(),
            _activity.getCacheDir() + File.separator + fullName
        );
        // remove the temp folder
        ScratchJrUtil.removeFile(tempFolder);
        return fullName;
    }

    private void copyAssetTo(String file, File targetFile) throws IOException {
        File srcFile = new File(_activity.getFilesDir() + File.separator + file);
        if (srcFile.exists()) {
            ScratchJrUtil.copyFile(srcFile, targetFile);
        } else {
            InputStream inputStream = _activity.getAssets().open("HTML5/svglibrary/" + file);
            ScratchJrUtil.copyFile(inputStream, targetFile);
        }
    }

    @JavascriptInterface
    public void registerLibraryAssets(int version, String assets) {
        _activity.assetLibraryVersion = version;
        _activity.registerLibraryAssets(assets.split(","));
    }

    @JavascriptInterface
    public void duplicateAsset(String path, String fileName) {
        Log.d(LOG_TAG, "duplicate asset " + path);
        File toFile = new File(_activity.getFilesDir() + File.separator + fileName);
        if (!toFile.exists()) {
            try {
                if (path.startsWith("./")) {
                    path = path.substring(2);
                }
                InputStream inputStream = _activity.getAssets().open("HTML5/" + path);
                ScratchJrUtil.copyFile(inputStream, toFile);
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }

    @JavascriptInterface
    public void sendSjrUsingShareDialog(String fileName, String emailSubject,
                                        String emailBody, int shareType) {
        // Write a temporary file with the project data passed in from JS
        String mimetype = ScratchJrUtil.getMimeType();
        File file = new File(_activity.getCacheDir() + File.separator + fileName);
        Log.d(LOG_TAG, file.getAbsolutePath());
        final Intent it = new Intent(Intent.ACTION_SEND);
        it.setType(mimetype);
        it.putExtra(android.content.Intent.EXTRA_EMAIL, new String[] {});
        it.putExtra(android.content.Intent.EXTRA_SUBJECT, fileName);
        it.putExtra(android.content.Intent.EXTRA_TEXT, Html.fromHtml(emailBody));

        // The stream data is a reference to the temporary file provided by our contentprovider
        it.putExtra(Intent.EXTRA_STREAM,
                Uri.parse("content://" + ShareContentProvider.AUTHORITY + "/"
                        + fileName));
        Intent shareIntent = Intent.createChooser(it, null);

        _activity.startActivity(shareIntent);
    }

    // Analytics
    @JavascriptInterface
    public void analyticsEvent(String category, String action, String label) {
        _activity.logAnalyticsEvent(category, action, label);
    }

    @JavascriptInterface
    public void setAnalyticsPlacePref(String place) {
        if (place != null) {
            _activity.setAnalyticsPlacePref(place);
        }
    }

    /**
     * Record a user property
     * @param key like "school"
     * @param propertyString like "Central High"
     */
    @JavascriptInterface
    public void setAnalyticsPref(String key, String propertyString) {
        if (key != null) {
            _activity.setAnalyticsPref(key, propertyString);
        }
    }
}
