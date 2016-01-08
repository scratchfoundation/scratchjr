package org.scratchjr.android;

import java.io.File;
import java.io.FileDescriptor;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import android.content.res.AssetFileDescriptor;
import android.content.res.AssetManager;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.SoundPool;
import android.util.Log;
import android.util.SparseArray;

/**
 * Manages sound playing for ScratchJr.
 * 
 * @author markroth8
 */
public class SoundManager {
    private static final String LOG_TAG = "ScratchJr.SoundManager";

    /** Reference to the activity */
    private ScratchJrActivity _application;

    /** Pool of pre-loaded sound effects */
    private SoundPool _soundEffectPool;

    /** Maps filename to sound id in the sound effect pool */
    private Map<String, Integer> _soundEffectMap = new HashMap<String, Integer>();

    /** Active sounds playing currently  */
    private SparseArray<MediaPlayer> _activeSoundMap = new SparseArray<MediaPlayer>();
    
    /** Running count of active sounds, so each one has a unique id */
    private int _activeSoundCount = 0;

    /** Set of assets in the HTML5 directory (cached for performance) */
    private final Set<String> _html5AssetList;

    public SoundManager(ScratchJrActivity application) {
        _application = application;
        Set<String> assetList;
        try {
            assetList = new HashSet<String>(listHTML5Assets(application));
        } catch (IOException e) {
            Log.e(LOG_TAG, "Could not retrieve list of assets from application", e);
            assetList = Collections.emptySet();
        }
        _html5AssetList = assetList;
        loadSoundEffects();
    }

    /**
     * Play the sound at the given path, interrupting any current sound.
     */
    public synchronized void playSoundEffect(String name) {
        playSoundEffectWithVolume(name, 1.0f);
    }

    /**
     * Play the sound at the given path, with the given volume, interrupting any current sound.
     */
    public synchronized void playSoundEffectWithVolume(String name, float volume) {
        if (_soundEffectPool == null) {
            Log.e(LOG_TAG, "Sound effect pool is closed. Cannot play '" + name + "' right now.");
        } else {
            Integer soundId = _soundEffectMap.get(name);
            if (soundId == null) {
                Log.e(LOG_TAG, "Could not find sound effect '" + name + "'");
            } else {
                _soundEffectPool.play(soundId, volume, volume, 0, 0, 1.0f);
            }
        }
    }

    /**
     * Play the given sound and return an id that can be used to stop the sound later.
     * 
     * @param file Path to sound to play. If relative, sound will come from assets HTML5/ directory, else sound
     *     comes from an absolute path.
     * @return An id which can be used to stop the sound later.
     */
    public synchronized int playSound(String file) {
        if (file.equals("pop.mp3")) {
            // We special-case pop.mp3 because it is easier to get it to play as a sound effect than a sound resource
            playSoundEffect(file);
            return -1;
        }
        final int result = _activeSoundCount++;
        MediaPlayer player = new MediaPlayer();
        _activeSoundMap.put(result, player);
        try {
            // If file starts with / it is an absolute path and use it.
            // Otherwise, path is relative, and find path relative to assets HTML5 directory.
            FileDescriptor fd;
            long startOffset;
            long length;
            final Runnable closeTask;
            if (file.startsWith("/")) {
                final FileInputStream fis = new FileInputStream(file);
                fd = fis.getFD();
                startOffset = 0;
                length = new File(file).length();
                final String finalFile = file;
                closeTask = new Runnable() {
                    public void run() {
                        try {
                            fis.close();
                        } catch (IOException e) {
                            Log.e(LOG_TAG, "Could not close file '" + finalFile + "'", e);
                        }
                    }
                };
            } else if (_html5AssetList.contains(file)) {
                final String path = "HTML5/" + file;
                final AssetFileDescriptor afd = _application.getAssets().openFd(path);
                fd = afd.getFileDescriptor();
                startOffset = afd.getStartOffset();
                length = afd.getLength();
                closeTask = new Runnable() {
                    public void run() {
                        try {
                            afd.close();
                        } catch (IOException e) {
                            Log.e(LOG_TAG, "Could not close asset '" + path + "'", e);
                        }
                    }
                };
            } else {
                final File soundFile = new File(_application.getFilesDir(), file);
                final FileInputStream in = new FileInputStream(soundFile);
                fd = in.getFD();
                startOffset = 0;
                length = soundFile.length();
                closeTask = new Runnable() {
                    public void run() {
                        try {
                            in.close();
                        } catch (IOException e) {
                            Log.e(LOG_TAG, "Could not close asset '" + soundFile + "'", e);
                        }
                    }
                };
            }
            player.setDataSource(fd, startOffset, length);
            player.prepare();
            player.setOnCompletionListener(new MediaPlayer.OnCompletionListener() {
                public void onCompletion(MediaPlayer mp) {
                    synchronized (SoundManager.this) {
                        mp.release();
                        _activeSoundMap.remove(result);
                        closeTask.run();
                    }
                }
            });
            player.start();
        } catch (IllegalArgumentException e) {
            Log.e(LOG_TAG, "Could not play sound '" + file + "'", e);
        } catch (IllegalStateException e) {
            Log.e(LOG_TAG, "Could not play sound '" + file + "'", e);
        } catch (IOException e) {
            Log.e(LOG_TAG, "Could not play sound '" + file + "'", e);
        }
        return result;
    }

    /**
     * Returns true if the sound for the given id is playing, or false if not.
     */
    public synchronized boolean isPlaying(int soundId) {
        boolean result = false;
        MediaPlayer player = _activeSoundMap.get(soundId);
        if (player != null) {
            try {
                result = player.isPlaying();
            } catch (IllegalStateException e) {
                result = false;
            }
        }
        return result;
    }

    /**
     * Returns the number of milliseconds long the given sound is, in duration.
     * 
     * @throws IllegalArgumentException If there was no sound with the provided sound id.
     */
    public synchronized int soundDuration(int soundId)
        throws IllegalArgumentException
    {
        int result;
        MediaPlayer player = _activeSoundMap.get(soundId);
        if (player != null) {
            result = player.getDuration();
        } else {
            throw new IllegalArgumentException("No sound found for id '" + soundId + "'");
        }
        return result;
    }

    /**
     * Stop the sound with the given id.
     * 
     * @param id The id of the sound to stop. If already stopped, does nothing.
     */
    public synchronized void stopSound(int soundId) {
        MediaPlayer player = _activeSoundMap.get(soundId);
        if (player != null) {
            player.stop();
        }
    }

    /**
     * Load all sound effects
     */
    public synchronized void open() {
        loadSoundEffects();
    }

    /**
     * Release all resources
     */
    public synchronized void close() {
        releaseSoundEffects();
    }

    /**
     * Release the media player if it already exists.
     */
    private void releaseSoundEffects() {
        if (_soundEffectPool != null) {
            _soundEffectPool.release();
            _soundEffectPool = null;
            _soundEffectMap.clear();
        }
        _activeSoundMap.clear();
    }

    private void loadSoundEffects() {
        if (_soundEffectPool == null) {
            _soundEffectPool = new SoundPool(11, AudioManager.STREAM_MUSIC, 0);

            // Load all sound effects into memory
            AssetManager assetManager = _application.getAssets();
            try {
                String[] soundEffects = assetManager.list("HTML5/sounds");
                loadSoundEffects(assetManager, "HTML5/sounds/", soundEffects);
                loadSoundEffects(assetManager, "HTML5/", "pop.mp3");
            } catch (IOException e) {
                Log.e(LOG_TAG, "Could not list sound assets", e);
            }
        }
    }
    
    private void loadSoundEffects(AssetManager assetManager, String basePath, String... soundEffects) 
        throws IOException
    {
        for (String filename : soundEffects) {
            AssetFileDescriptor fd = assetManager.openFd(basePath + filename);
            int soundId = _soundEffectPool.load(fd, 1);
            _soundEffectMap.put(filename, soundId);
        }
    }

    private List<String> listHTML5Assets(ScratchJrActivity application) 
        throws IOException
    {
        ArrayList<String> result = new ArrayList<String>();
        result.addAll(Arrays.asList(application.getAssets().list("HTML5")));
        for (String path : application.getAssets().list("HTML5/samples")) {
            result.add("samples/" + path);
        }
        return result;
    }
}
