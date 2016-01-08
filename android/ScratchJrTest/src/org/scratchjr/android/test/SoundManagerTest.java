/*
 ScratchJr © Massachusetts Institute of Technology and Tufts University - 2014, All Rights Reserved.
 */

package org.scratchjr.android.test;

import org.scratchjr.android.ScratchJrActivity;
import org.scratchjr.android.SoundManager;

import android.test.ActivityInstrumentationTestCase2;

/**
 * Tests the SoundManager class
 * 
 * @author markroth8
 */
public class SoundManagerTest
    extends ActivityInstrumentationTestCase2<ScratchJrActivity>
{
    private ScratchJrActivity _activity;
    private SoundManager _soundManager;

    public SoundManagerTest() {
        super(ScratchJrActivity.class);
    }

    @Override
    protected void setUp()
        throws Exception
    {
        super.setUp();

        setActivityInitialTouchMode(false);
        _activity = getActivity();
        _soundManager = _activity.getSoundManager();
    }

    @Override
    protected void tearDown()
        throws Exception
    {
        super.tearDown();
    }
    
    public void testPlaySoundEffect()
        throws Exception
    {
        String[] soundFiles = _activity.getAssets().list("HTML5/sounds");
        assertTrue(soundFiles.length > 0);
        for (String name : soundFiles) {
            _soundManager.playSoundEffect(name);
        }
        Thread.sleep(100);
        for (String name : soundFiles) {
            _soundManager.playSoundEffect(name);
        }
    }
    
    public void testPlaySound()
        throws Exception
    {
        int id = _soundManager.playSound("pop.mp3");
        assertTrue("" + id, id >= 0);
        assertTrue(_soundManager.isPlaying(id));
        int duration = _soundManager.soundDuration(id);
        assertTrue("" + duration, duration > 0);
        while (_soundManager.isPlaying(id)) {
            Thread.sleep(100);
        }
        int id2 = _soundManager.playSound("pop.mp3");
        assertTrue(id + " vs " + id2, id2 != id);
        Thread.sleep(10);
        _soundManager.stopSound(id2);
        assertFalse(_soundManager.isPlaying(id2));
    }
}
