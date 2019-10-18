package org.scratchjr.android;

import java.io.File;
import java.io.IOException;
import java.io.RandomAccessFile;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.ShortBuffer;
import java.nio.channels.FileChannel;
import java.util.Locale;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import android.content.pm.PackageManager;
import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaRecorder;
import android.os.Build;
import android.util.Log;

/**
 * Manages sound recording for ScratchJr.
 * 
 * @author markroth8
 */
public class SoundRecorderManager {
    private static final String LOG_TAG = "SoundRecorderManager";

    // Recording parameters
    private static final int SAMPLE_RATE_IN_HZ_DEVICE = 22050;
    private static final int SAMPLE_RATE_IN_HZ_EMULATOR = 8000; // Emulator only supports 8Khz
    private static final int CHANNEL_CONFIG = AudioFormat.CHANNEL_IN_MONO;
    private static final int AUDIO_FORMAT = AudioFormat.ENCODING_PCM_16BIT;

    /** Reference to the activity */
    private ScratchJrActivity _application;
    
    /** True if there is a microphone present on this device, false if not. */
    private final boolean _hasMicrophone;
    
    /** Android AudioRecorder */
    private AudioRecord _audioRecorder = null;

    /** True if running in emulator (and only 8000 Hz supported) or false if not */
    private final boolean _runningInEmulator = Build.PRODUCT.startsWith("sdk");
    
    /** Sample rate chosen based on whether running in emulation */
    private final int _sampleRateHz = _runningInEmulator ? SAMPLE_RATE_IN_HZ_EMULATOR : SAMPLE_RATE_IN_HZ_DEVICE;
    
    /** Minimum buffer size, based on sample rate */
    private final int _minBufferSize = Math.max(640, AudioRecord.getMinBufferSize(_sampleRateHz, CHANNEL_CONFIG, AUDIO_FORMAT));

    /** Current file being recorded to */
    private File _soundFile;
    
    /** RandomAccessFile for the file being recorded to */
    private RandomAccessFile _soundRandomAccessFile;
    
    /** Channel pointing to the file to be written to */
    private FileChannel _soundFileChannel;
    
    /** Buffer into which to read data */
    private final ByteBuffer _audioBuffer = ByteBuffer.allocateDirect(_minBufferSize).order(ByteOrder.LITTLE_ENDIAN);

    /** Short view into audio buffer */
    private final ShortBuffer _audioBufferShort = _audioBuffer.asShortBuffer();
    
    /** Thread that is recording audio */
    private final ExecutorService _audioRecordExecutor = Executors.newSingleThreadExecutor();
    
    /** Future of the audio thread in progress */
    private Future<Void> _audioWriterTask;
    
    /** Buffer for WAV header */
    private final ByteBuffer _wavHeaderBuffer = ByteBuffer.allocate(44).order(ByteOrder.LITTLE_ENDIAN);

    /** Id of sound currently playing */
    private Integer _soundPlayingId;
    
    /** Current volume level detected during recording, with slow decay */
    private volatile double _slowDecayVolumeLevel = 0.0;


    public SoundRecorderManager(ScratchJrActivity application) {
        Log.i(LOG_TAG, Build.PRODUCT + " Using audio sample rate " + _sampleRateHz + " Hz");
        _application = application;
        _hasMicrophone = _application.getPackageManager().hasSystemFeature(
            PackageManager.FEATURE_MICROPHONE);
        if (!_hasMicrophone) {
            Log.i(LOG_TAG, "No microphone detected. Sound recording will be disabled.");
        }
    }
   
    public boolean hasMicrophone() {
        return _hasMicrophone;
    }
    
    /** Called when application starts / resumes */
    public synchronized void open() {
    }
    
    /** Called when application sleeps */
    public synchronized void close() {
        releaseAudioRecorder();
        stopPlayingSound();
    }
    
    /**
     * Returns the sound name or null if error.
     */
    public synchronized String startRecord() {
        if (!_hasMicrophone) return null;
        
        String result;

        releaseAudioRecorder();
        stopPlayingSound();
        
        _audioRecorder = new AudioRecord(MediaRecorder.AudioSource.MIC, _sampleRateHz,
            CHANNEL_CONFIG, AUDIO_FORMAT, _minBufferSize * 16);
        
        // Mimic filename from iOS: time in seconds since 1970 as a double. Name is the md5 of the time.
        String now = String.format(Locale.US, "%f", System.currentTimeMillis() / 1000.0);
        String filename = String.format("SND%s.wav", _application.getIOManager().md5(now));
        _soundFile = new File(_application.getFilesDir(), filename);
        File parentDir = _soundFile.getParentFile();
        if (!parentDir.exists()) {
            parentDir.mkdirs();
        }
        Log.i(LOG_TAG, "Saving audio to file '" + _soundFile.getPath() + "'");
        
        try {
            _soundRandomAccessFile = new RandomAccessFile(_soundFile, "rw");
            _soundFileChannel = _soundRandomAccessFile.getChannel();
            
            writeWAVHeader(_soundFileChannel, _sampleRateHz);
            
            _audioRecorder.startRecording();
            _audioWriterTask = _audioRecordExecutor.submit(new Runnable() {
                public void run() {
                    String filename = _soundFile.getPath();
                    long totalBytesWritten = 0;
                    try {
                        AudioRecord ar = _audioRecorder;
                        RandomAccessFile raf = _soundRandomAccessFile;
                        ByteBuffer buffer = _audioBuffer;
                        ShortBuffer shortBuffer = _audioBufferShort; // Little-endian buffer
                        FileChannel c = _soundFileChannel;
                        while (true) {
                            // Read from buffer
                            buffer.rewind().limit(buffer.capacity());
                            int len = ar.read(buffer, _minBufferSize);
                            if ((len == -1) || ((len == 0) && (ar.getRecordingState() == AudioRecord.RECORDSTATE_STOPPED))) {
                                break;
                            }
                            if (len == AudioRecord.ERROR_BAD_VALUE) {
                                Log.e(LOG_TAG, "AudioRecord.read() returned BAD_VALUE");
                                break;
                            }
                            if (len == AudioRecord.ERROR_INVALID_OPERATION) {
                                Log.e(LOG_TAG, "AudioRecord.read() returned INVALID_OPERATION");
                                break;
                            }
                            
                            // Write to file
                            buffer.rewind().limit(len);
                            c.write(buffer);
                            
                            // Get current volume level (max of all samples taken this period)
                            shortBuffer.rewind();
                            int max = 0;
                            while (shortBuffer.hasRemaining()) {
                                int s = Math.abs(shortBuffer.get());
                                if (s > max) {
                                    max = s;
                                }
                            }
                            _slowDecayVolumeLevel = Math.max(1.0 * max / Short.MAX_VALUE, _slowDecayVolumeLevel * 0.85);
                            
                            totalBytesWritten += len;
                        }
                        updateWAVHeader(raf, _soundFileChannel, totalBytesWritten);
                        c.close();
                    } catch (IOException e) {
                        Log.e(LOG_TAG, "Error writing wav file '" + filename + "'", e);
                    }
                }
            }, null);
            result = filename;
        } catch (IOException e) {
            Log.e(LOG_TAG, "Error opening wav file '" + _soundFile.getPath() + "'", e);
            result = null;
        }

        return result;
    }

    private void writeWAVHeader(FileChannel fileChannel, int sampleRateHz)
        throws IOException
    {
        ByteBuffer b = _wavHeaderBuffer;
        b.rewind().limit(b.capacity());
        b.put("RIFF".getBytes());
        long totalDataLen = 0; // Placeholder until all audio is recorded
        b.putInt((int) totalDataLen);
        b.put("WAVE".getBytes());
        b.put("fmt ".getBytes());
        b.putInt(16); // size of fmt chunk
        b.putShort((short) 1); // format = 1 (PCM)
        short channels = (short) 1;
        b.putShort(channels);
        b.putInt(sampleRateHz);
        short bitsPerSample = 16;
        short bytesPerSample = (short) (bitsPerSample / 8);
        b.putInt(sampleRateHz * channels * bytesPerSample);
        b.putShort((short) (channels * bytesPerSample));
        b.putShort(bitsPerSample);
        b.put("data".getBytes());
        b.putInt(0); // Placeholder until all audio is recorded
        b.limit(b.position()).rewind();
        fileChannel.write(b);
    }

    private void updateWAVHeader(RandomAccessFile randomAccessFile, FileChannel fileChannel, long totalBytesWritten) 
        throws IOException 
    {
        ByteBuffer b = _wavHeaderBuffer;
        
        // Write totalDataLen
        randomAccessFile.seek(4);
        b.limit(8).position(4).mark();
        b.putInt((int) (totalBytesWritten + 36));
        b.reset();
        fileChannel.write(b);
        
        // Write data chunk size
        randomAccessFile.seek(40);
        b.limit(44).position(40).mark();
        b.putInt((int) (totalBytesWritten));
        b.reset();
        fileChannel.write(b);
    }

    public synchronized boolean stopRecord()
        throws IllegalStateException
    {
        if (!_hasMicrophone) return false;
        
        boolean result;

        if (_audioRecorder == null) {
            Log.e(LOG_TAG, "Attempt to stop recording when no recording is taking place");
            result = false;
        } else {
            _audioRecorder.stop();
            try {
                _audioWriterTask.get(5, TimeUnit.SECONDS);
                result = true;
                Log.i(LOG_TAG, "Stopped recording. File is " + _soundFile.length() + " bytes");
            } catch (InterruptedException e) {
                Log.e(LOG_TAG, "Interrupted while waiting for audio writer to complete", e);
                result = false;
            } catch (ExecutionException e) {
                Log.e(LOG_TAG, "Execution exception while waiting for audio writer to complete", e);
                result = false;
            } catch (TimeoutException e) {
                Log.e(LOG_TAG, "Timeout while waiting for audio writer to complete", e);
                result = false;
            } finally {
                releaseAudioRecorder();
            }
        }
        
        return result;
    }
    
    /**
     * @return The number of seconds for the sound to play
     */
    public synchronized double startPlay()
        throws IllegalStateException
    {
        if (_soundFile == null) {
            throw new IllegalArgumentException("No sound available.");
        }
        stopPlayingSound();
        SoundManager soundManager = _application.getSoundManager();
        _soundPlayingId = soundManager.playSound(_soundFile.getPath());
        Log.i(LOG_TAG, "Sound id: " + _soundPlayingId);
        return soundManager.soundDuration(_soundPlayingId) / 1000.0;
    }
    
    public synchronized void stopPlay() {
        stopPlayingSound();
    }
    
    public synchronized void recordClose(boolean keep) {
        stopPlayingSound();
        if (!keep) {
            if (_soundFile != null) {
                _soundFile.delete();
            }
        }
        _soundFile = null;
    }

    /**
     * Return the volume level, from 0.0 to 1.0
     */
    public double getVolume() {
        if (!_hasMicrophone) return 0.0;
        return _slowDecayVolumeLevel;
    }

    private void releaseAudioRecorder() {
        if (_audioRecorder != null) {
            _audioRecorder.release();
            _audioRecorder = null;
        }
    }

    private void stopPlayingSound() {
        SoundManager soundManager = _application.getSoundManager();
        if (_soundPlayingId != null) {
            soundManager.stopSound(_soundPlayingId);
            _soundPlayingId = null;
        }
    }

}
