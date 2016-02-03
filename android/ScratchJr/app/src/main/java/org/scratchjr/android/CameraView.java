package org.scratchjr.android;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Bitmap.CompressFormat;
import android.graphics.Matrix;
import android.graphics.RectF;
import android.hardware.Camera;
import android.hardware.Camera.CameraInfo;
import android.hardware.Camera.Parameters;
import android.hardware.Camera.PictureCallback;
import android.hardware.Camera.Size;
import android.hardware.SensorManager;
import android.util.Log;
import android.view.Display;
import android.view.MotionEvent;
import android.view.OrientationEventListener;
import android.view.Surface;
import android.view.SurfaceHolder;
import android.view.SurfaceView;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.widget.LinearLayout;
import android.widget.ScrollView;

/**
 * Creates a camera view that hovers at a particular location and has a mask.
 * 
 * We use a ScrollView because the camera will rescale (squish) the preview to whatever size the
 * SurfaceView is and we want to keep the aspect ratio. So the ScrollView is of the desired
 * size and then we add a SurfaceView to it with the camera preview.
 * 
 * @author markroth8
 */
public class CameraView
    extends ScrollView
{
    private static final String LOG_TAG = "ScratchJr.CameraView";
    
    private CameraPreviewView _cameraPreview;
    private Camera _camera;
    private final RectF _rect;
    private boolean _currentFacingFront;
    private int _cameraId;
    private CameraOrientationListener _orientationListener;
    private float _scale;

    public CameraView(Context context, RectF rect, float scale, boolean facingFront) {
        super(context);
        _currentFacingFront = facingFront;
        _rect = rect;
        _scale = scale;
        
        _camera = safeOpenCamera(facingFront);
        if (_camera != null) {
            _cameraPreview = new CameraPreviewView(context);
            Size previewSize = _camera.getParameters().getPreviewSize();
    
            float previewWidth = _rect.width();
            float previewHeight = previewSize.height * rect.width() / previewSize.width;
            float centerScrollY = (previewHeight - rect.height()) / 2; 
            float centerScrollX = 0.0f;
            if (previewHeight < rect.height()) {
                previewHeight = rect.height();
                previewWidth = previewSize.width * rect.height() / previewSize.height;
                centerScrollX = (previewWidth - rect.width()) / 2; 
                centerScrollY = 0.0f;
            }
            LinearLayout linearLayout = new LinearLayout(context);
            ViewGroup.LayoutParams layoutParams = new ViewGroup.LayoutParams((int) previewWidth, (int) previewHeight);
            addView(linearLayout, layoutParams);
            
            linearLayout.addView(_cameraPreview, layoutParams);
            final float cx = centerScrollX;
            final float cy = centerScrollY;
            post(new Runnable() {
                @Override
                public void run() {
                    scrollTo((int) cx, (int) cy);
                }
            });
        }
        
        _orientationListener = new CameraOrientationListener(context, SensorManager.SENSOR_DELAY_NORMAL);
        enableOrientationListener();
    }
    
    @Override
    public boolean onTouchEvent(MotionEvent ev) {
        // Disabling scrolling in this ScrollView
        return false;
    }
    
    public void captureStillImage(PictureCallback pictureCallback, Runnable failed) {
        if (_camera != null) {
            final Parameters params = _camera.getParameters();
            params.setRotation(0);

            // Set picture size to the maximum supported resolution.
            List<Size> supportedPictureSizes = params.getSupportedPictureSizes();
            int maxHeight = 0;
            for (Size size : supportedPictureSizes) {
                if (size.height > maxHeight) {
                    params.setPictureSize(size.width, size.height);
                    maxHeight = size.height;
                }
            }
            
            _camera.setParameters(params);
            _camera.takePicture(null, null, pictureCallback);
        } else {
            failed.run();
        }
    }

    private Camera safeOpenCamera(boolean facingFront) {
        Camera result = null;
        try {
            _cameraId = findFirstCameraId(facingFront);
            if (_cameraId != -1) {
                result = Camera.open(_cameraId);
            }
        } catch (RuntimeException e) {
            Log.e(LOG_TAG, "Failed to open camera", e);
        }
        return result;
    }

    private int findFirstCameraId(boolean facingFront) {
        int result = -1;
        int facingTarget = facingFront ? Camera.CameraInfo.CAMERA_FACING_FRONT : Camera.CameraInfo.CAMERA_FACING_BACK;
        int count = Camera.getNumberOfCameras();
        CameraInfo cameraInfo = new CameraInfo();
        for (int i = 0; i < count; i++) {
            Camera.getCameraInfo(i, cameraInfo);
            if (cameraInfo.facing == facingTarget) {
                result = i;
                break;
            }
        }
        if (result == -1) {
            Log.w(LOG_TAG, "No " + (facingFront ? "front" : "back") + " -facing camera detected on this device.");
        }
        return result;
    }

    public boolean setCameraFacing(boolean facingFront) {
        boolean result;
        if (_currentFacingFront != facingFront) {
            // switch cameras
            int id = findFirstCameraId(facingFront);
            if (id == -1) {
                result = false;
            } else {
                result = true;
                _currentFacingFront = facingFront;
                if (_camera != null) {
                    disableOrientationListener();
                    _camera.release();
                    _camera = null;
                }
                _camera = safeOpenCamera(facingFront);
                _cameraPreview.startPreview();
                enableOrientationListener();
            }
        } else {
            result = true;
        }
        return result;
    }
    
    public RectF getRect() {
        return _rect;
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
        byte[] jpegData = bos.toByteArray();
        return jpegData;
    }
    
    /**
     * Crop and resize the given image to the dimensions of the rectangle for this camera view.
     *
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
        CameraInfo cameraInfo = new CameraInfo();
        Camera.getCameraInfo(_cameraId, cameraInfo);
        int rotation = findDisplayRotation(getContext(), cameraInfo.facing);
        if (rotation == 180) {
            m.preScale(-1.0f, -1.0f);
        }
        m.postScale(scale / _scale, scale / _scale);
        Bitmap newBitmap = Bitmap.createBitmap(image, offsetX, offsetY, imageWidth - offsetX * 2, imageHeight - offsetY * 2, m, true);
        return newBitmap;
    }

    private void enableOrientationListener() {
        synchronized(_orientationListener) {
            if (_orientationListener.canDetectOrientation()) {
                _orientationListener.setCameraInfo(_camera, _cameraId);
                _orientationListener.enable();
            }
        }
    }
    
    private void disableOrientationListener() {
        synchronized(_orientationListener) {
            if (_orientationListener != null) {
                _orientationListener.disable();
                _orientationListener.clearCameraInfo();
            }
        }
    }
    
    private static Display findDisplay(Context context) {
        WindowManager windowManager = (WindowManager) context.getSystemService(Context.WINDOW_SERVICE);
        return windowManager.getDefaultDisplay();
    }
    
    private static int findDisplayRotation(Context context, int facing) {
        Display display = findDisplay(context);
        int r = display.getRotation();
        int rotation = (r == Surface.ROTATION_180) ? 180 : 0;
        if (facing == CameraInfo.CAMERA_FACING_FRONT) {
            rotation = (rotation + 360) % 360;
        }
        return rotation;
    }

    private class CameraPreviewView
        extends SurfaceView
        implements SurfaceHolder.Callback
    {
        private final SurfaceHolder _holder;

        public CameraPreviewView(Context context) {
            super(context);
            _holder = getHolder();
            _holder.addCallback(CameraPreviewView.this);
        }

        @Override
        public void surfaceCreated(SurfaceHolder holder) {
            try {
                if (_camera != null) {
                    _camera.setPreviewDisplay(holder);
                    _camera.startPreview();
                }
            } catch (IOException e) {
                Log.e(LOG_TAG, "Error creating surface", e);
            }
        }

        @Override
        public void surfaceChanged(SurfaceHolder holder, int format, int width, int height) {
            if (_holder.getSurface() != null) {
                if (_camera != null) {
                    try {
                        _camera.stopPreview();
                    } catch (Exception e) {
                        Log.e(LOG_TAG, "Error releasing camera", e);
                    }
                    
                    startPreview();
                }
            }
        }

        @Override
        public void surfaceDestroyed(SurfaceHolder holder) {
            if (_camera != null) {
                Log.i(LOG_TAG, "Releasing camera");
                disableOrientationListener();
                _camera.release();
                _camera = null;
            }
        }

        public void startPreview() {
            if (_camera != null) {
                try {
                    _camera.setPreviewDisplay(_holder);
                    Size previewSize = _camera.getParameters().getPreviewSize();
                    Log.i(LOG_TAG, "Preview size: " + previewSize.width + " x " + previewSize.height);
                    _camera.startPreview();
                } catch (IOException e) {
                    Log.e(LOG_TAG, "Error in starting preview", e);
                } catch (RuntimeException e) {
                    Log.e(LOG_TAG, "Error in starting preview", e);
                }
            }
        }
    }
    
    /**
     * An {@link OrientationEventListener} which updates the camera preview
     * based on the device's orientation.
     * @author khu
     *
     */
    private static class CameraOrientationListener extends OrientationEventListener {
        private Camera _observedCamera;
        private int _observedCameraId;
        private Display _display;
        private int _previousRotation = -1;
        private Context _context;
        
        public CameraOrientationListener(Context context) {
            super(context);
            _context = context;
            _display = findDisplay(context);
        }

        public CameraOrientationListener(Context context, int rate) {
            super(context, rate);
            _context = context;
            _display = findDisplay(context);
        }
        
        public synchronized void setCameraInfo(Camera camera, int cameraId) {
            _observedCamera = camera;
            _observedCameraId = cameraId;
        }
        
        public synchronized void clearCameraInfo() {
            _observedCamera = null;
            _observedCameraId = -1;
        }

        @Override
        public synchronized void onOrientationChanged(int orientation) {
            if (orientation == ORIENTATION_UNKNOWN || _observedCamera == null 
                    || _observedCameraId == -1) 
            {
                return;
            }
            
            CameraInfo cameraInfo = new CameraInfo();
            Camera.getCameraInfo(_observedCameraId, cameraInfo);
            int rotation = findDisplayRotation(_context, cameraInfo.facing);
            
            if (rotation != _previousRotation) {
                // Update the preview
                _observedCamera.setDisplayOrientation(rotation);
                _previousRotation = rotation;
            }
        }
    }
}
