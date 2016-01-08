package org.scratchjr.android;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.database.Cursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;

import java.io.File;
import java.io.FileNotFoundException;

// Special thanks to stephendnicholas.com for a reference implementation
public class ShareContentProvider extends ContentProvider {
    public static final String AUTHORITY = BuildConfig.APPLICATION_ID + ".ShareContentProvider";
    public ShareContentProvider() {
    }

    @Override
    public String getType(Uri uri) {
        if (BuildConfig.APPLICATION_ID.equals("org.pbskids.scratchjr")) {
            return "application/x-pbskids-scratchjr-project";
        }
        return "application/x-scratchjr-project";
    }

    @Override
    public boolean onCreate() {
        return true;
    }

    @Override
    public ParcelFileDescriptor openFile(Uri uri, String mode)
        throws FileNotFoundException {
            // Provide a read-only file descriptor for the shared file
            String fileLocation = getContext().getCacheDir() + File.separator
                    + uri.getLastPathSegment();
            ParcelFileDescriptor pfd = ParcelFileDescriptor.open(new File(
                    fileLocation), ParcelFileDescriptor.MODE_READ_ONLY);
            return pfd;
    }

    // Unimplemented methods since we're only providing a file reference
    @Override
    public Uri insert(Uri uri, ContentValues values) {
        return null;
    }

    @Override
    public int delete(Uri uri, String selection, String[] selectionArgs) {
        return -1;
    }

    @Override
    public Cursor query(Uri uri, String[] projection, String selection,
                        String[] selectionArgs, String sortOrder) {
        return null;
    }

    @Override
    public int update(Uri uri, ContentValues values, String selection,
                      String[] selectionArgs) {
        return -1;
    }
}
