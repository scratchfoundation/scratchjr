/*
 ScratchJr © Massachusetts Institute of Technology and Tufts University - 2014, All Rights Reserved.
 */

package org.scratchjr.android.test;

import java.util.Arrays;

import org.json.JSONArray;
import org.json.JSONException;
import org.scratchjr.android.ScratchJrUtil;

import junit.framework.Assert;
import junit.framework.TestCase;

/**
 * Unit tests for ScratchJrUtil
 * 
 * @author markroth8
 */
public class ScratchJrUtilTest
    extends TestCase
{

    public void testJsonArrayToStringArray() 
        throws Exception
    {
        JSONArray emptyJsonArray = new JSONArray();
        String[] result = ScratchJrUtil.jsonArrayToStringArray(emptyJsonArray);
        Assert.assertTrue(Arrays.toString(result), Arrays.equals(new String[] {}, result));
        
        JSONArray singleElementJsonArray = new JSONArray();
        singleElementJsonArray.put("item 1");
        String[] expected = new String[] { "item 1" };
        result = ScratchJrUtil.jsonArrayToStringArray(singleElementJsonArray);
        Assert.assertTrue(Arrays.toString(result), Arrays.equals(expected, result));
        
        JSONArray multiElementJsonArray = new JSONArray();
        multiElementJsonArray.put("item 1");
        multiElementJsonArray.put("item 2");
        multiElementJsonArray.put("item 3");
        expected = new String[] { "item 1", "item 2", "item 3" };
        result = ScratchJrUtil.jsonArrayToStringArray(multiElementJsonArray);
        Assert.assertTrue(Arrays.toString(result), Arrays.equals(expected, result));
    }

}
