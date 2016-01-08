package org.scratchjr.android;

import org.json.JSONArray;
import org.json.JSONException;

/**
 * General utility class with static utility methods.
 * 
 * @author markroth8
 */
public class ScratchJrUtil {
    /** Utility class private constructor so nobody creates an instance of this class */
    private ScratchJrUtil() {
    }

    /**
     * Convert the given JSONArray to an array of Strings.
     */
    public static String[] jsonArrayToStringArray(JSONArray values) 
        throws JSONException
    {
        String[] result = new String[values.length()];
        for (int i = 0; i < values.length(); i++) {
            result[i] = values.getString(i);
        }
        return result;
    }
}