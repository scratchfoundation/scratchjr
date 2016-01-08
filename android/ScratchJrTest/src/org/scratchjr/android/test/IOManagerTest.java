package org.scratchjr.android.test;

import java.io.IOException;

import junit.framework.Assert;

import org.scratchjr.android.IOManager;
import org.scratchjr.android.ScratchJrActivity;

import android.test.ActivityInstrumentationTestCase2;
import android.util.Base64;

/**
 * Unit tests for IOManager
 *
 * @author markroth8
 */
public class IOManagerTest
    extends ActivityInstrumentationTestCase2<ScratchJrActivity>
{
    private ScratchJrActivity _activity;
    private IOManager _ioManager;

    public IOManagerTest() {
        super(ScratchJrActivity.class);
    }

    @Override
    protected void setUp()
        throws Exception
    {
        super.setUp();

        setActivityInitialTouchMode(false);
        _activity = getActivity();
        _ioManager = _activity.getIOManager();
    }

    @Override
    protected void tearDown()
        throws Exception
    {
        super.tearDown();
    }

    public void testBytesToHexString() {
        byte[] data = new byte[] {};
        String expectedValue = "";
        Assert.assertEquals(expectedValue, IOManager.bytesToHexString(data));
        
        data = new byte[] { (byte)0x10, (byte)0x70, (byte)0x80, (byte)0x85, (byte)0xFF };
        expectedValue = "10708085ff";
        Assert.assertEquals(expectedValue, IOManager.bytesToHexString(data));
    }
    
    public void testMD5() {
        Assert.assertEquals("bae941e0d1cdf42b75d6d0ef6bd7d25a", _ioManager.md5("testContent"));
    }

    public void testGetSetCleanMedia()
        throws Exception
    {
        byte[] testContent = "testContent".getBytes();
        String testContentBase64 = Base64.encodeToString(testContent, Base64.NO_WRAP);
        String testContentMD5 = _ioManager.md5(testContentBase64);
        
        String filename = "testfile";
        try {
            _ioManager.getMedia(filename);
            Assert.fail("Should have thrown IOException");
        } catch (IOException e) {
            // pass
        }
        
        _ioManager.setMedia(testContentBase64, "bin");
        
        String result = _ioManager.getMedia(testContentMD5 + ".bin");
        Assert.assertEquals(testContentBase64, result);
        
        _ioManager.cleanAssets("bar");
        result = _ioManager.getMedia(testContentMD5 + ".bin");
        Assert.assertEquals(testContentBase64, result);
        
        _ioManager.cleanAssets("bin");
        try {
            _ioManager.getMedia(testContentMD5 + ".bin");
            Assert.fail("Should have thrown IOException");
        } catch (IOException e) {
            // pass
        }
        
        _ioManager.setMediaName(testContentBase64, filename, "bin");
        result = _ioManager.getMedia(filename + ".bin");
        Assert.assertEquals(testContentBase64, result);
        
        String key = "1";
        Assert.assertEquals(testContentBase64.length(), _ioManager.getMediaLen(filename + ".bin", key));
        Assert.assertEquals(testContentBase64.substring(0, 4), _ioManager.getMediaData(key, 0, 4));
        Assert.assertEquals(testContentBase64.substring(4, 8), _ioManager.getMediaData(key, 4, 4));
        _ioManager.getMediaDone(key);
    }

    public void testRemove()
    	throws Exception
    {
        byte[] testContent = "testContent".getBytes();
        String testContentBase64 = Base64.encodeToString(testContent, Base64.NO_WRAP);

        String testFilename = "testfile";
        _ioManager.setFile(testFilename, testContentBase64);

        Assert.assertEquals(testContentBase64, _ioManager.getFile(testFilename));
        Assert.assertTrue(_ioManager.remove(testFilename));
        Assert.assertFalse(_ioManager.remove(testFilename));

        try {
            _ioManager.getFile(testFilename);
            Assert.fail("Should have thrown IOException");
        } catch (IOException e) {
            // pass
        }
    }
}
