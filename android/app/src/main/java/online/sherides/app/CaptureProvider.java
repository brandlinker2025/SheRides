package online.sherides.app;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.provider.OpenableColumns;

import java.io.File;
import java.io.FileNotFoundException;

/**
 * Tiny private file provider for camera photos (no AndroidX needed).
 * The camera app gets a one-time write grant to a single file in
 * cache/captures/, and the WebView reads it back to upload.
 * Not exported: only apps we explicitly grant a URI to can touch it.
 */
public class CaptureProvider extends ContentProvider {
    static final String AUTHORITY = "online.sherides.app.captures";
    private static final String DIR = "captures";

    static File captureDir(Context context) {
        File dir = new File(context.getCacheDir(), DIR);
        if (!dir.exists()) {
            dir.mkdirs();
        }
        return dir;
    }

    static Uri uriFor(File file) {
        return new Uri.Builder().scheme("content").authority(AUTHORITY)
                .appendPath(file.getName()).build();
    }

    private File fileFor(Uri uri) throws FileNotFoundException {
        Context context = getContext();
        String name = uri.getLastPathSegment();
        // Only plain file names inside captures/ — no paths, no "..".
        if (context == null || name == null || !name.matches("[A-Za-z0-9_.-]+") || name.contains("..")) {
            throw new FileNotFoundException("Invalid capture uri");
        }
        return new File(captureDir(context), name);
    }

    @Override
    public boolean onCreate() {
        return true;
    }

    @Override
    public ParcelFileDescriptor openFile(Uri uri, String mode) throws FileNotFoundException {
        File file = fileFor(uri);
        int flags = mode.contains("w")
                ? ParcelFileDescriptor.MODE_READ_WRITE | ParcelFileDescriptor.MODE_CREATE
                        | (mode.contains("t") ? ParcelFileDescriptor.MODE_TRUNCATE : 0)
                : ParcelFileDescriptor.MODE_READ_ONLY;
        return ParcelFileDescriptor.open(file, flags);
    }

    @Override
    public String getType(Uri uri) {
        return "image/jpeg";
    }

    @Override
    public Cursor query(Uri uri, String[] projection, String selection, String[] selectionArgs, String sortOrder) {
        File file;
        try {
            file = fileFor(uri);
        } catch (FileNotFoundException e) {
            return null;
        }
        String[] cols = {OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE};
        MatrixCursor cursor = new MatrixCursor(cols, 1);
        cursor.addRow(new Object[]{file.getName(), file.length()});
        return cursor;
    }

    @Override
    public Uri insert(Uri uri, ContentValues values) {
        return null;
    }

    @Override
    public int delete(Uri uri, String selection, String[] selectionArgs) {
        return 0;
    }

    @Override
    public int update(Uri uri, ContentValues values, String selection, String[] selectionArgs) {
        return 0;
    }
}
