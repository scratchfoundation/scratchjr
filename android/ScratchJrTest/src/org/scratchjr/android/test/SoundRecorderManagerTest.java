/*
 ScratchJr © Massachusetts Institute of Technology and Tufts University - 2014, All Rights Reserved.
 */

package org.scratchjr.android.test;

import org.scratchjr.android.ScratchJrActivity;
import org.scratchjr.android.SoundManager;
import org.scratchjr.android.SoundRecorderManager;

import android.test.ActivityInstrumentationTestCase2;

/**
 * Tests the SoundRecorderManager class
 * 
 * @author markroth8
 */
public class SoundRecorderManagerTest
    extends ActivityInstrumentationTestCase2<ScratchJrActivity>
{
    private ScratchJrActivity _activity;
    private SoundRecorderManager _soundRecorderManager;

    public SoundRecorderManagerTest() {
        super(ScratchJrActivity.class);
    }

    @Override
    protected void setUp()
        throws Exception
    {
        super.setUp();

        setActivityInitialTouchMode(false);
        _activity = getActivity();
        _soundRecorderManager = _activity.getSoundRecorderManager();
    }

    @Override
    protected void tearDown()
        throws Exception
    {
        super.tearDown();
    }
    
    public void testHasMicrophone()
        throws Exception
    {
        assertTrue(_soundRecorderManager.hasMicrophone());
    }

    public void testGetVolume()
        throws Exception
    {
        // Can't test much in emulation - microphone is normally dead silent. Just make sure it doesn't throw an exception.
        for (int i = 0; i < 50; i++) {
            _soundRecorderManager.getVolume();
        }
    }

    public void testRecordAndPlay()
        throws Exception
    {
        // Note this isn't really testing much of anything - on the emulator, no audio is recorded, so this just tests
        // that the mechanics of the API are working and not throwing exceptions.
        for (int i = 0; i < 2; i++) {
            assertNotNull(_soundRecorderManager.startRecord());
            Thread.sleep(500);
            assertTrue(_soundRecorderManager.stopRecord());
            for (int replay = 0; replay < 2; replay++) {
                assertTrue(_soundRecorderManager.startPlay() > 0.5);
                Thread.sleep(500);
                _soundRecorderManager.stopPlay();
            }
        }
        _soundRecorderManager.recordClose(false);
    }
}
