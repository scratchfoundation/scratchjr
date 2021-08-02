package org.scratchjr.android;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import android.annotation.SuppressLint;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Bitmap.CompressFormat;
import android.graphics.ImageFormat;
import android.graphics.Matrix;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.YuvImage;
import android.hardware.display.DisplayManager;
import android.media.Image;
import android.util.Log;
import android.view.Display;
import android.view.Surface;
import android.view.WindowManager;
import android.widget.RelativeLayout;

import androidx.appcompat.app.AppCompatActivity;
import androidx.camera.core.CameraInfoUnavailableException;
import androidx.camera.core.CameraSelector;
import androidx.camera.core.ExperimentalUseCaseGroup;
import androidx.camera.core.ImageCapture;
import androidx.camera.core.Preview;
import androidx.camera.lifecycle.ProcessCameraProvider;
import androidx.camera.view.PreviewView;
import androidx.core.content.ContextCompat;

import com.google.common.util.concurrent.ListenableFuture;

@SuppressLint("ViewConstructor")
public class CameraView extends RelativeLayout {
    private static final String LOG_TAG = "ScratchJr.CameraxView";

    private final RectF _rect;
    private boolean _currentFacingFront;
    private final float _scale;

    private final AppCompatActivity _activity;
    private ProcessCameraProvider _cameraProvider;
    private final PreviewView _viewFinder;
    private Preview _preview;
    private ImageCapture _imageCapture;
    private final ExecutorService _cameraExecutor;
    private final DisplayManager _displayManager;
    private int _displayId;

    public CameraView(AppCompatActivity context, RectF rect, float scale, boolean facingFront) {
        super(context);
        _activity = context;
        _currentFacingFront = facingFront;
        _rect = rect;
        _scale = scale;

        _viewFinder = new PreviewView(context);

        _displayManager = (DisplayManager) context.getSystemService(Context.DISPLAY_SERVICE);

        RelativeLayout.LayoutParams layoutParams = new RelativeLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT);
        addView(_viewFinder, layoutParams);
        post(() -> {
            _displayId = _viewFinder.getDisplay().getDisplayId();
            setupCamera();
        });

        _cameraExecutor = Executors.newSingleThreadExecutor();
    }

    @Override
    protected void onAttachedToWindow() {
        super.onAttachedToWindow();
        _displayManager.registerDisplayListener(displayListener, null);
    }

    @Override
    protected void onDetachedFromWindow() {
        super.onDetachedFromWindow();
        _displayManager.unregisterDisplayListener(displayListener);
    }

    private final DisplayManager.DisplayListener displayListener = new DisplayManager.DisplayListener() {
        @Override
        public void onDisplayAdded(int displayId) {
        }

        @Override
        public void onDisplayRemoved(int displayId) {
        }

        // The androidx.camera.core.Preview.setTargetRotation declaration is opt-in
        // and its usage should be marked with @androidx.camera.core.ExperimentalUseCaseGroup
        @ExperimentalUseCaseGroup
        @Override
        public void onDisplayChanged(int displayId) {
            if (displayId == _displayId) {
                int rotation = _viewFinder.getDisplay().getRotation();
                if (_imageCapture != null) {
                    _imageCapture.setTargetRotation(rotation);
                }
                if (_preview != null) {
                    _preview.setTargetRotation(rotation);
                }
            }
        }
    };

    private void setupCamera() {
        ListenableFuture<ProcessCameraProvider> cameraProviderFuture = ProcessCameraProvider.getInstance(_activity);
        cameraProviderFuture.addListener(() -> {
            try {
                _cameraProvider = cameraProviderFuture.get();

                bindCameraUseCases();
            } catch (ExecutionException | InterruptedException e) {
                e.printStackTrace();
            }
        }, ContextCompat.getMainExecutor(_activity));
    }

    private void bindCameraUseCases() {
        int rotation = _viewFinder.getDisplay().getRotation();
        Log.d(LOG_TAG, "rotation: " + rotation);
        _imageCapture = new ImageCapture.Builder()
            .setTargetRotation(rotation)
            .build();

        _preview = new Preview.Builder()
            .setTargetRotation(rotation)
            .build();

        _cameraProvider.unbindAll();

        int lensFacing = CameraSelector.LENS_FACING_FRONT;
        if (!_currentFacingFront) {
            lensFacing = CameraSelector.LENS_FACING_BACK;
        }

        CameraSelector selector = new CameraSelector.Builder()
            .requireLensFacing(lensFacing)
            .build();

        _cameraProvider.bindToLifecycle(
            _activity,
            selector,
            _preview,
            _imageCapture
        );

        _preview.setSurfaceProvider(_viewFinder.getSurfaceProvider());
    }

    public void captureStillImage(ImageCapture.OnImageCapturedCallback callback) {
        _imageCapture.takePicture(_cameraExecutor, callback);
    }

    public boolean setCameraFacing(boolean facingFront) {
        if (_currentFacingFront != facingFront) {
            if (facingFront && !hasFrontCamera()) {
                return false;
            }
            if (!facingFront && !hasBackCamera()) {
                return false;
            }
            _currentFacingFront = facingFront;
            post(this::bindCameraUseCases);
        }
        return true;
    }

    private boolean hasBackCamera() {
        try {
            return _cameraProvider.hasCamera(CameraSelector.DEFAULT_BACK_CAMERA);
        } catch (CameraInfoUnavailableException e) {
            e.printStackTrace();
        }
        return false;
    }

    private boolean hasFrontCamera() {
        try {
            return _cameraProvider.hasCamera(CameraSelector.DEFAULT_FRONT_CAMERA);
        } catch (CameraInfoUnavailableException e) {
            e.printStackTrace();
        }
        return false;
    }

    /**
     * Take the given bitmap image from the camera and transform it to the correct
     * aspect ratio, size, and rotation.
     *
     * @return jpeg-encoded data of the transformed image.
     */
    public byte[] getTransformedImage(Bitmap originalImage, int exifRotation) {
        Bitmap cropped = cropResizeAndRotate(originalImage, exifRotation);
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        cropped.compress(CompressFormat.JPEG, 90, bos);
        try {
            bos.close();
        } catch (IOException e) {
            // will not happen - this is a ByteArrayOutputStream
            Log.e(LOG_TAG, "IOException while closing byte array stream", e);
        }
        return bos.toByteArray();
    }

    /**
     * Crop and resize the given image to the dimensions of the rectangle for this camera view.
     * <p>
     * If the image was front-facing, also mirror horizontally.
     */
    private Bitmap cropResizeAndRotate(Bitmap image, int exifRotation) {
        int imageWidth = image.getWidth();
        int imageHeight = image.getHeight();
        float rectWidth = _rect.width();
        float rectHeight = _rect.height();

        float newHeight = rectWidth * imageHeight / imageWidth;
        float scale = rectWidth / imageWidth;
        int offsetX = 0;
        int offsetY = (int) ((newHeight - rectHeight) / 2 * imageHeight / newHeight);
        if (newHeight < rectHeight) {
            float newWidth = rectHeight * imageWidth / imageHeight;
            scale = rectHeight / imageHeight;
            offsetY = 0;
            offsetX = (int) ((newWidth - rectWidth) / 2 * imageWidth / newWidth);
        }

        Matrix m = new Matrix();
        // Adjust the image to undo rotation done by JPEG generator
        m.postRotate(-1.0f * exifRotation);
        if (_currentFacingFront) {
            // flip bitmap horizontally since front-facing camera is mirrored
            m.preScale(-1.0f, 1.0f);
        }
        int rotation = CameraView.findDisplayRotation(getContext(), _currentFacingFront);
        if (rotation == 180) {
            m.preScale(-1.0f, -1.0f);
        }
        m.postScale(scale / _scale, scale / _scale);
        return Bitmap.createBitmap(image, offsetX, offsetY, imageWidth - offsetX * 2, imageHeight - offsetY * 2, m, true);
    }

    // Image → JPEG
    public byte[] imageToByteArray(Image image) {
        byte[] data = null;
        if (image.getFormat() == ImageFormat.JPEG) {
            Image.Plane[] planes = image.getPlanes();
            ByteBuffer buffer = planes[0].getBuffer();
            data = new byte[buffer.capacity()];
            buffer.get(data);
            return data;
        } else if (image.getFormat() == ImageFormat.YUV_420_888) {
            data = NV21toJPEG(YUV_420_888toNV21(image),
                image.getWidth(), image.getHeight());
        }
        return data;
    }

    // YUV_420_888 → NV21
    private byte[] YUV_420_888toNV21(Image image) {
        byte[] nv21;
        ByteBuffer yBuffer = image.getPlanes()[0].getBuffer();
        ByteBuffer uBuffer = image.getPlanes()[1].getBuffer();
        ByteBuffer vBuffer = image.getPlanes()[2].getBuffer();
        int ySize = yBuffer.remaining();
        int uSize = uBuffer.remaining();
        int vSize = vBuffer.remaining();
        nv21 = new byte[ySize + uSize + vSize];
        yBuffer.get(nv21, 0, ySize);
        vBuffer.get(nv21, ySize, vSize);
        uBuffer.get(nv21, ySize + vSize, uSize);
        return nv21;
    }

    // NV21 → JPEG
    private byte[] NV21toJPEG(byte[] nv21, int width, int height) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        YuvImage yuv = new YuvImage(nv21, ImageFormat.NV21, width, height, null);
        yuv.compressToJpeg(new Rect(0, 0, width, height), 100, out);
        return out.toByteArray();
    }

    private static int findDisplayRotation(Context context, boolean facingFront) {
        WindowManager windowManager = (WindowManager) context.getSystemService(Context.WINDOW_SERVICE);
        Display display = windowManager.getDefaultDisplay();
        int r = display.getRotation();
        int rotation = (r == Surface.ROTATION_180) ? 180 : 0;
        if (facingFront) {
            rotation = (rotation + 360) % 360;
        }
        return rotation;
    }

}
