/*
 ScratchJr © Massachusetts Institute of Technology and Tufts University - 2014, All Rights Reserved.
 */

package org.scratchjr.android.test;

import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.FutureTask;

import junit.framework.Assert;

import org.scratchjr.android.ScratchJrActivity;

import android.test.ActivityInstrumentationTestCase2;
import android.view.KeyEvent;
import android.webkit.WebView;

/**
 * Main test entry point for Scratchjr Activity testing.
 * 
 * @author markroth8
 */
public class ScratchJrActivityTest
    extends ActivityInstrumentationTestCase2<ScratchJrActivity>
{
    private static final String URL_EDITOR_PAGE = "file:///android_asset/HTML5/editor.html";
    private static final String EDITOR_HTML = "editor.html";
    private static final String URL_HOME_PAGE = "file:///android_asset/HTML5/home.html";
    private static final String HOME_HTML = "home.html";
    private static final String URL_SPLASH_PAGE = "file:///android_asset/HTML5/index.html";
    private static final int WAIT_PAGE_TIMEOUT = 5000;
    private ScratchJrActivity _activity;
    private WebView _webView;
    
    public ScratchJrActivityTest() {
        super(ScratchJrActivity.class);
    }
    
    @Override
    protected void setUp() throws Exception
    {
        super.setUp();
        
        setActivityInitialTouchMode(false);
        _activity = getActivity();
        _webView = (WebView) _activity.findViewById(org.scratchjr.android.R.id.webview);
        Assert.assertNotNull(_webView);
    }
    
    /**
     * Tests that the splash screen is shown for at least one second and then the main title screen is shown.
     */
    public void testSplashScreen() 
        throws Exception
    {
        Assert.assertEquals(URL_SPLASH_PAGE, getCurrentURL());
        waitForHomePage(); // Will throw an exception if it takes too long
        Assert.assertEquals(URL_HOME_PAGE, getCurrentURL());
    }
    
    /**
     * Tests that the back button works as expected
     */
    public void testBackButtonFromHome()
        throws Exception
    {
        waitForHomePage();
        Assert.assertTrue(!_activity.isFinishing());
        sendKeys(KeyEvent.KEYCODE_BACK);
        Assert.assertTrue(_activity.isFinishing());
    }
    
    /**
     * Tests that the back button works as expected
     */
    public void testBackButtonFromEditor()
        throws Exception
    {
        waitForHomePage();
        
        _activity.createNewProject();
        waitForLeavePage(URL_HOME_PAGE);
        String editorUrl = getCurrentURL(); 
        Assert.assertTrue(editorUrl.contains(EDITOR_HTML));
        waitForEditorPageReady();
        Assert.assertTrue(!_activity.isFinishing());
        sendKeys(KeyEvent.KEYCODE_BACK);
        Assert.assertTrue(!_activity.isFinishing());
        waitForLeavePage(editorUrl);
        String homeUrl = getCurrentURL(); 
        Assert.assertTrue(homeUrl.contains(HOME_HTML));
    }

    /**
     * Returns the URL of the current page in the web view
     * @throws ExecutionException 
     * @throws InterruptedException 
     */
    private String getCurrentURL()
        throws InterruptedException, ExecutionException
    {
        GetWebViewUrlTask queryUrlTask = new GetWebViewUrlTask();
        _activity.runOnUiThread(queryUrlTask);
        return queryUrlTask.get();
    }
    
    private void waitForHomePage()
        throws Exception
    {
        waitForSplashDone();
        Assert.assertEquals(URL_SPLASH_PAGE, getCurrentURL());
        _activity.goHome();
        // Now, wait for all the resources to load
        long timeout = System.currentTimeMillis() + WAIT_PAGE_TIMEOUT;
        long time = System.currentTimeMillis();
        while (!_activity.isAppInitialized() && ((time = System.currentTimeMillis()) < timeout)) {
            Thread.sleep(100);
        }
        if (time >= timeout) {
            Assert.fail("Took too long to wait for app to initialize.");
        }
    }
    
    private void waitForEditorPageReady()
        throws Exception
    {
        // Now, wait for all the resources to load
        long timeout = System.currentTimeMillis() + WAIT_PAGE_TIMEOUT;
        long time = System.currentTimeMillis();
        while (!_activity.isEditorInitialized() && ((time = System.currentTimeMillis()) < timeout)) {
            Thread.sleep(100);
        }
        if (time >= timeout) {
            Assert.fail("Took too long to wait for editor to initialize.");
        }
    }
    
    private void waitForSplashDone()
        throws Exception
    {
        long timeout = System.currentTimeMillis() + WAIT_PAGE_TIMEOUT;
        long time = System.currentTimeMillis();
        while (!_activity.isSplashDone() && ((time = System.currentTimeMillis()) < timeout)) {
            Thread.sleep(100);
        }
        if (time >= timeout) {
            Assert.fail("Took too long to wait for splash screen to be done.");
        }
    }
    
    /**
     * Wait for the projects page to disappear.
     * 
     * If it takes longer than 10 seconds to disappear, throw an exception.
     */
    private void waitForLeavePage(String page)
        throws Exception
    {
        long timeout = System.currentTimeMillis() + WAIT_PAGE_TIMEOUT;
        String url = null;
        long lastTime = System.currentTimeMillis();
        while (lastTime < timeout) {
            url = getCurrentURL();
            if (!page.equals(url)) {
                break;
            }
            Thread.sleep(100);
            lastTime = System.currentTimeMillis();
        }
        Assert.assertTrue("Took too long to advance from '" + page + "'", lastTime < timeout);
    }
    
    /**
     * Task that runs on the UI Thread and retrieves the current url of the web view.
     */
    private class GetWebViewUrlTask
        extends FutureTask<String>
    {
        public GetWebViewUrlTask() {
            super(new Callable<String>() {
                public String call()
                    throws Exception
                {
                    return _webView.getUrl();
                }
            });
        }
    };
    
}
