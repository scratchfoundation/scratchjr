package org.scratchjr.android;

import java.util.Arrays;
import java.util.Locale;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Context;
import android.database.Cursor;
import android.database.SQLException;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteDatabase.CursorFactory;
import android.database.sqlite.SQLiteException;
import android.database.sqlite.SQLiteOpenHelper;
import android.util.Log;

/**
 * Manages the database connection for Scratch Jr
 * 
 * @author markroth8
 */
public class DatabaseManager {
    private static final String LOG_TAG = "ScratchJr.DBManager";
    private static final String DB_NAME = "ScratchJr";
    private static final int DB_VERSION = 1;

    private boolean _open = false;
    private Context _applicationContext;
    private DatabaseHelper _databaseHelper;
    private SQLiteDatabase _database;

    public DatabaseManager(Context applicationContext) {
        _applicationContext = applicationContext;
    }

    /**
     * Open the database, creating it if it does not yet exist.
     * 
     * @throws SQLException
     *             if the database could be neither opened or created
     */
    public void open()
        throws SQLException
    {
        _databaseHelper = new DatabaseHelper(_applicationContext, DB_NAME, null, DB_VERSION);
        _database = _databaseHelper.getWritableDatabase();

        // Migrations
        try {
            _database.execSQL(_applicationContext.getString(R.string.sql_add_gift));
        } catch (SQLException e) {
            // isgift field already exists
        }

        _open = true;
    }

    public void close() {
        _databaseHelper.close();
        _open = false;
    }

    public boolean isOpen() {
        return _open;
    }

    public void clearTables()
        throws DatabaseException
    {
        exec("DELETE FROM PROJECTS");
        exec("DELETE FROM USERSHAPES");
        exec("DELETE FROM USERBKGS");
    }

    private static class DatabaseHelper
        extends SQLiteOpenHelper
    {
        private Context _context;

        public DatabaseHelper(Context context, String name, CursorFactory factory, int version) {
            super(context, name, factory, version);
            _context = context;
        }

        @Override
        public void onCreate(SQLiteDatabase db) {
            db.execSQL(_context.getString(R.string.sql_create_projects));
            Log.i(LOG_TAG, "Created table projects");

            db.execSQL(_context.getString(R.string.sql_create_usershapes));
            Log.i(LOG_TAG, "Created table usershapes");

            db.execSQL(_context.getString(R.string.sql_create_userbkgs));
            Log.i(LOG_TAG, "Created table userbkgs");

            db.execSQL(_context.getString(R.string.sql_add_gift));
            Log.i(LOG_TAG, "Created project gift field");
        }

        @Override
        public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
            Log.w(LOG_TAG, "Upgrading database from version " + oldVersion + " to " + newVersion +
                    ", which currently does nothing.");
        }
    }

    /**
     * Execute a statement on the database and return "success" if successful or the error message if not.
     * 
     * @param stmt
     *            The statement to execute.
     * @return "success" if the statement was executed successfully, or the error message if not.
     * @throws DatabaseException
     *             If there was an error in accessing the database.
     */
    public String exec(String stmt)
        throws DatabaseException
    {
        Log.d(LOG_TAG, "exec '" + stmt + "'");
        String result;
        try {
            _database.execSQL(stmt);
            result = "success";
        } catch (SQLException e) {
            Log.e(LOG_TAG, "Error while executing statement '" + stmt + "'", e);
            result = e.getMessage();
        }
        return result;
    }

    /**
     * Perform a query on the database and return the results as a JSON-encoded array.
     * 
     * @param statement
     *            The SQL statement to query
     * @param values
     *            Ordered list of arguments to substitute
     * @return A JSONArray that contains the results of the query. Each element of the array is a JSON object with the keys as
     *         column names and the values as column values (Strings).
     * @throws JSONException
     *             If there was an error encoding or decoding JSON
     * @throws DatabaseException
     *             If there was an error in accessing the database.
     */
    public JSONArray query(String statement, String[] values)
        throws JSONException, DatabaseException
    {
        Log.d(LOG_TAG, "query '" + statement + "', " + Arrays.toString(values));
        Cursor cursor;
        try {
            cursor = _database.rawQuery(statement, values);
        } catch (IllegalStateException e) {
            // The database is inaccessible - we tried to query in the background
            throw new DatabaseException("Query '" + statement + "' failed to run.");
        }
        if (cursor == null) {
            throw new DatabaseException("Query '" + statement + "' returned null cursor.");
        }
        JSONArray resultArr = new JSONArray();
        if (cursor.moveToFirst()) {
            do {
                resultArr.put(getRowDataAsJsonObject(cursor));
            } while (cursor.moveToNext());
        }
        return resultArr;
    }

    /**
     * Execute a statement on the database and return the id of the last inserted row.
     * 
     * @param stmt
     *            The SQL statement to execute
     * @param values
     *            Ordered list of arguments to substitute
     * @return A string containing the id of the inserted row.
     * @throws DatabaseException
     *             If there was an error in accessing the database.
     */
    public String stmt(String stmt, String[] values)
        throws DatabaseException
    {
        Log.d(LOG_TAG, "stmt '" + stmt + "', " + Arrays.toString(values));
        try {
            _database.execSQL(stmt, values);
        } catch (IllegalStateException e) {
            // The database is inaccessible - we tried to run a statement in the background
            throw new DatabaseException("Query '" + stmt + "' failed to run.");
        }

        // get last inserted row id
        Cursor cursor = _database.rawQuery("SELECT last_insert_rowid()", null);
        if (cursor == null) {
            throw new DatabaseException("Query '" + stmt + "' returned null cursor.");
        }
        cursor.moveToFirst();
        long id = cursor.getLong(0);
        cursor.close();
        return Long.toString(id);
    }

    private JSONObject getRowDataAsJsonObject(Cursor cursor)
        throws SQLiteException, JSONException
    {
        JSONObject result = new JSONObject();
        int count = cursor.getColumnCount();
        for (int i = 0; i < count; i++) {
            if (!cursor.isNull(i)) {
                String columnName = cursor.getColumnName(i).toLowerCase(Locale.ENGLISH);
                String value = cursor.getString(i);
                result.put(columnName, value);
            }
        }
        return result;
    }
}