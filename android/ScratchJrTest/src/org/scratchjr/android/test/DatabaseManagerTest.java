/*
 ScratchJr © Massachusetts Institute of Technology and Tufts University - 2014, All Rights Reserved.
 */

package org.scratchjr.android.test;

import java.util.concurrent.Callable;
import java.util.concurrent.FutureTask;

import junit.framework.Assert;

import org.json.JSONArray;
import org.json.JSONObject;
import org.scratchjr.android.DatabaseManager;
import org.scratchjr.android.ScratchJrActivity;

import android.test.ActivityInstrumentationTestCase2;
import android.webkit.WebView;

/**
 * Tests the DatabaseManager class
 * 
 * @author markroth8
 */
public class DatabaseManagerTest
    extends ActivityInstrumentationTestCase2<ScratchJrActivity>
{
    private ScratchJrActivity _activity;
    private DatabaseManager _databaseManager;

    public DatabaseManagerTest() {
        super(ScratchJrActivity.class);
    }

    @Override
    protected void setUp()
        throws Exception
    {
        super.setUp();

        setActivityInitialTouchMode(false);
        _activity = getActivity();
        _databaseManager = _activity.getDatabaseManager();
        _databaseManager.clearTables();
    }

    @Override
    protected void tearDown()
        throws Exception
    {
        super.tearDown();
    }

    public void testProjectsTable()
        throws Exception
    {
        String[] columns = new String[] { "MTIME", "ALTMD5", "POS", "NAME", "JSON", "THUMBNAIL", "OWNER", "GALLERY", "DELETED",
            "VERSION" };
        String[] values = new String[] { "2014-05-26", "0123456789abcdef", "pos_value", "name_value", "json_value",
            "thumbnail_value", "owner_value", "gallery_value", "false", "1" };
        testTable("PROJECTS", columns, values);
    }

    public void testUserShapesTable()
        throws Exception
    {
        String[] columns = new String[] { "MD5", "ALTMD5", "WIDTH", "HEIGHT", "EXT", "NAME", "OWNER", "SCALE", "VERSION" };
        String[] values = new String[] { "123456789abcdef0", "23456789abcdef01", "1024", "768", "ext_value", "name_value",
            "owner_value2", "scale_value", "1" };
        testTable("USERSHAPES", columns, values);
    }

    public void testUserBkgsTable()
        throws Exception
    {
        String[] columns = new String[] { "MD5", "ALTMD5", "WIDTH", "HEIGHT", "EXT", "OWNER", "VERSION" };
        String[] values = new String[] { "3456789abcdef012", "456789abcdef0123", "1920", "1080", "ext_value2", "owner_value3", "1" };
        testTable("USERBKGS", columns, values);
    }

    /**
     * Tests the functionality of exec, the expected structure of the database tables and the functionality of query for the given
     * table.
     */
    private void testTable(String tableName, String[] columns, String[] values)
        throws Exception
    {
        Assert.assertNotNull(_databaseManager);
        Assert.assertTrue(_databaseManager.isOpen());

        StringBuilder columnsStr = new StringBuilder();
        boolean first = true;
        for (String columnName : columns) {
            if (!first) {
                columnsStr.append(", ");
            }
            columnsStr.append(columnName);
            first = false;
        }

        StringBuilder valuesStr = new StringBuilder();
        StringBuilder questionStr = new StringBuilder();
        first = true;
        for (String value : values) {
            if (!first) {
                valuesStr.append(", ");
                questionStr.append(", ");
            }
            valuesStr.append("'").append(value).append("'");
            questionStr.append("?");
            first = false;
        }
        
        JSONArray results = _databaseManager.query("SELECT " + columnsStr + " FROM " + tableName, new String[] {});
        Assert.assertEquals(results.toString(), 0, results.length());

        String idStr = _databaseManager.stmt("INSERT INTO " + tableName + " (" + columnsStr + ") VALUES (" + questionStr + ")", values);
        Assert.assertTrue(Integer.parseInt(idStr) > 0);
        
        JSONArray rows = _databaseManager.query("SELECT " + columnsStr + " FROM " + tableName, new String[] {});
        Assert.assertEquals(1, rows.length());
        JSONObject row = rows.getJSONObject(0);

        for (int i = 0; i < columns.length; i++) {
            String column = columns[i];
            String expectedValue = values[i];
            String actualValue = row.getString(column.toLowerCase());
            Assert.assertEquals(expectedValue, actualValue);
        }
        
        // Now, use exec to delete it
        _databaseManager.exec("DELETE FROM " + tableName + " WHERE ID = " + idStr);
        results = _databaseManager.query("SELECT " + columnsStr + " FROM " + tableName, new String[] {});
        Assert.assertEquals(results.toString(), 0, results.length());
    }
}
