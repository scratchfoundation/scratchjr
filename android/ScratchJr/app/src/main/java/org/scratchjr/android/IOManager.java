package org.scratchjr.android;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HashMap;
import java.util.Map;

import org.json.JSONArray;
import org.json.JSONException;

import android.content.Context;
import android.util.Base64;
import android.util.Log;

/**
 * Manages file storage for ScratchJr.
 * 
 * Also interfaces with the DatabaseManager to clean assets.
 * 
 * @author markroth8
 */
public class IOManager {
    private static final String LOG_TAG = "ScratchJr.IOManager";
    private static final char[] HEX_ARRAY = "0123456789abcdef".toCharArray();

    private final ScratchJrActivity _application;
    private final DatabaseManager _databaseManager;

    /** Cache of key to base64-encoded media value */
    private final Map<String, String> _mediaStrings = new HashMap<String, String>();

    public IOManager(ScratchJrActivity application) {
        _application = application;
        _databaseManager = application.getDatabaseManager();
    }

    /**
     * Clean any assets that are not referenced in the database
     * 
     * @param fileType The extension of the type of file to clean
     */
    public void cleanAssets(String fileType)
        throws IOException
    {
        String suffix = "." + fileType;
        Log.i(LOG_TAG, "Cleaning files of type '" + fileType + "'");
        File dir = _application.getFilesDir();
        for (File file : dir.listFiles()) {
            String filename = file.getName();
            if (filename.endsWith(suffix)) {
                try {
                    String statement = "SELECT ID FROM PROJECTS WHERE JSON LIKE ?";
                    String[] values = new String[] { "%" + filename + "%" };
                    JSONArray rows = _databaseManager.query(statement, values);
                    if (rows.length() > 0) continue;
                    
                    statement = "SELECT ID FROM USERSHAPES WHERE MD5 = ?";
                    values = new String[] { filename };
                    rows = _databaseManager.query(statement, values);
                    if (rows.length() > 0) continue;
                    
                    statement = "SELECT ID FROM USERBKGS WHERE MD5 = ?";
                    rows = _databaseManager.query(statement, values);
                    if (rows.length() > 0) continue;
                    
                    Log.i(LOG_TAG, "Deleting because not found anywhere: '" + filename + "'");
                    file.delete();
                } catch (JSONException e) {
                    // log and continue searching
                    Log.e(LOG_TAG, "While searching for resources to delete", e);
                } catch (DatabaseException e) {
                    // log and continue searching
                    Log.e(LOG_TAG, "While searching for resources to delete", e);
                }
            }
        }
    }
    
    /** Sets the file with the given name to the given contents */
    public String setFile(String filename, String base64ContentStr)
        throws IOException
    {
        byte[] content = Base64.decode(base64ContentStr, Base64.NO_WRAP);
        FileOutputStream out = _application.openFileOutput(filename, Context.MODE_PRIVATE);
        try {
            out.write(content);
        } finally {
            out.close();
        }
        return filename;
    }

    /** Gets a base64-encoded view of the contents of the given file */
    public String getFile(String filename)
        throws IOException
    {
        String result;
        InputStream in = _application.openFileInput(filename);
        try {
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            int len;
            byte[] buffer = new byte[1024];
            while ((len = in.read(buffer)) != -1) {
                bos.write(buffer, 0, len);
            }
            bos.close();
            byte[] data = bos.toByteArray();
            result = Base64.encodeToString(data, Base64.NO_WRAP);
        } finally {
            in.close();
        }
        return result;
    }
    
    /**
     * Returns the media data associated with the given filename and return the result base64-encoded.
     */
    public String getMedia(String filename)
        throws IOException
    {
        String result;
        InputStream in = _application.openFileInput(filename);
        try {
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            int len;
            byte[] buffer = new byte[1024];
            while ((len = in.read(buffer)) != -1) {
                bos.write(buffer, 0, len);
            }
            bos.close();
            byte[] data = bos.toByteArray();
            result = Base64.encodeToString(data, Base64.NO_WRAP);
        } finally {
            in.close();
        }
        return result;
    }

    /**
     * Allows incremental loading of large resources
     */
    public String getMediaData(String key, int offset, int length) {
        return _mediaStrings.get(key).substring(offset, offset + length);
    }

    public int getMediaLen(String file, String key)
        throws IOException
    {
        String value = getMedia(file);
        _mediaStrings.put(key, value);
        return value.length();
    }

    public void getMediaDone(String filename) {
        _mediaStrings.remove(filename);
    }

    /**
     * Store the given content in a file whose filename is constructed using the md5 sum of the base64 content string
     * followed by the given extension, and return the filename.
     * 
     * @param base64ContentStr Base64-encoded content to store in the file
     * @param extension The extension of the filename to store to
     * @return The filename of the file that was saved.
     * @throws IOException If there was an error saving the file.
     */
    public String setMedia(String base64ContentStr, String extension)
        throws IOException
    {
        String md5Sum = md5(base64ContentStr);
        String filename = md5Sum + "." + extension;
        byte[] content = Base64.decode(base64ContentStr, Base64.NO_WRAP);
        FileOutputStream out = _application.openFileOutput(filename, Context.MODE_PRIVATE);
        try {
            out.write(content);
        } finally {
            out.close();
        }
        return filename;
    }

    /**
     * Writes the given base64-encoded content to a filename with the name key.ext.
     */
    public String setMediaName(String base64ContentStr, String key, String ext)
        throws IOException
    {
        String md5 = key + "." + ext;
        return writeFile(md5, base64ContentStr);
    }

    /**
     * Decodes the given base64-encoded data and writes it to the file with the given filename
     * in the application's persistent store.
     */
    public String writeFile(String filename, String base64ContentStr)
        throws IOException
    {
        byte[] content = Base64.decode(base64ContentStr, Base64.NO_WRAP);
        FileOutputStream out = _application.openFileOutput(filename, Context.MODE_PRIVATE);
        try {
            out.write(content);
        } finally {
            out.close();
        }
        return filename;
    }

    /**
     * Returns the MD5 sum of the provided content.
     * 
     * @param content The content to sum
     * @return A string representation of the MD5 sum
     */
    public String md5(String content) {
        MessageDigest digester;
        try {
            digester = MessageDigest.getInstance("MD5");
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
        digester.update(content.getBytes());
        byte[] digest = digester.digest();
        return bytesToHexString(digest);
    }

    /**
     * Removes (deletes) a file with a given file name.
     *
     * @param filename The file to remove
     * @return True if the file was successfully removed; else false
     * @throws IOException If there was an error removing the file
     */
    public boolean remove(String filename)
    	throws IOException
    {
    	return _application.deleteFile(filename);
    }

    /**
     * Borrowed from http://stackoverflow.com/questions/9655181/convert-from-byte-array-to-hex-string-in-java
     */
    public static String bytesToHexString(byte[] bytes) {
        char[] hexChars = new char[bytes.length * 2];
        for (int j = 0; j < bytes.length; j++) {
            int v = bytes[j] & 0xFF;
            hexChars[j * 2] = HEX_ARRAY[v >>> 4];
            hexChars[j * 2 + 1] = HEX_ARRAY[v & 0x0F];
        }
        return new String(hexChars);
    }
}
