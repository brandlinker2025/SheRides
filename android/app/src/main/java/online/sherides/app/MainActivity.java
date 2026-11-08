package online.sherides.app;

import android.Manifest;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Matrix;
import android.media.ExifInterface;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.MediaStore;
import android.webkit.GeolocationPermissions;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.List;

/**
 * Thin release shell. The community itself stays on https://sherides.online.
 * No API keys are compiled into this app.
 *
 * v1.1.0 adds what the website needs inside the app:
 *   - photo / document upload (profile, posts, NID, selfie)
 *   - location (ride booking, live rider tracking, SOS)
 *   - camera + microphone (voice notes, selfie capture)
 *   - tel:, mailto:, sms:, WhatsApp links open the right phone app
 * v1.2.0: photo fields offer "Camera" as well as files/gallery. Camera photos
 *   are resized (max 2560 px, JPEG) and auto-rotated so they stay under the
 *   website's 10 MB upload limit.
 * Permissions are only granted to pages on sherides.online.
 */
public class MainActivity extends Activity {
    static final String START_URL = "https://sherides.online/";

    private static final int REQ_FILE = 1001;
    private static final int REQ_LOCATION = 1002;
    private static final int REQ_MEDIA = 1003;
    private static final int REQ_CAMERA_FOR_FILE = 1004;
    private static final int MAX_PHOTO_PX = 2560;

    private WebView webView;

    private ValueCallback<Uri[]> fileCallback;
    private WebChromeClient.FileChooserParams pendingFileParams;
    private File cameraFile;

    private GeolocationPermissions.Callback pendingGeoCallback;
    private String pendingGeoOrigin;

    private PermissionRequest pendingMediaRequest;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setGeolocationEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true); // needed to read picked photos (content:// URIs)

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (isSite(uri)) {
                    return false;
                }
                openExternally(uri);
                return true;
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            // <input type="file"> — camera, gallery or files
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback,
                                             FileChooserParams params) {
                if (fileCallback != null) {
                    fileCallback.onReceiveValue(null);
                }
                fileCallback = callback;
                pendingFileParams = params;
                if (acceptsImages(params) && !hasPermission(Manifest.permission.CAMERA)) {
                    // Ask for camera first; if refused we still open the gallery/files.
                    requestPermissions(new String[]{Manifest.permission.CAMERA}, REQ_CAMERA_FOR_FILE);
                    return true;
                }
                return launchFileChooser();
            }

            // navigator.geolocation — ride booking, live tracking, SOS
            @Override
            public void onGeolocationPermissionsShowPrompt(String origin,
                                                           GeolocationPermissions.Callback callback) {
                if (!isSite(Uri.parse(origin))) {
                    callback.invoke(origin, false, false);
                    return;
                }
                if (hasPermission(Manifest.permission.ACCESS_FINE_LOCATION)
                        || hasPermission(Manifest.permission.ACCESS_COARSE_LOCATION)) {
                    callback.invoke(origin, true, false);
                    return;
                }
                pendingGeoOrigin = origin;
                pendingGeoCallback = callback;
                requestPermissions(new String[]{
                        Manifest.permission.ACCESS_FINE_LOCATION,
                        Manifest.permission.ACCESS_COARSE_LOCATION
                }, REQ_LOCATION);
            }

            // getUserMedia — microphone (voice notes) and camera
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(() -> handleMediaRequest(request));
            }
        });

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState);
        } else {
            webView.loadUrl(START_URL);
        }
    }

    private void handleMediaRequest(PermissionRequest request) {
        if (!isSite(request.getOrigin())) {
            request.deny();
            return;
        }
        List<String> needed = new ArrayList<>();
        for (String res : request.getResources()) {
            if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(res)
                    && !hasPermission(Manifest.permission.RECORD_AUDIO)) {
                needed.add(Manifest.permission.RECORD_AUDIO);
            }
            if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(res)
                    && !hasPermission(Manifest.permission.CAMERA)) {
                needed.add(Manifest.permission.CAMERA);
            }
        }
        if (needed.isEmpty()) {
            grantAllowed(request);
            return;
        }
        if (pendingMediaRequest != null) {
            pendingMediaRequest.deny();
        }
        pendingMediaRequest = request;
        requestPermissions(needed.toArray(new String[0]), REQ_MEDIA);
    }

    /** Grant only the resources whose Android permission the user allowed. */
    private void grantAllowed(PermissionRequest request) {
        List<String> ok = new ArrayList<>();
        for (String res : request.getResources()) {
            if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(res)
                    && hasPermission(Manifest.permission.RECORD_AUDIO)) {
                ok.add(res);
            } else if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(res)
                    && hasPermission(Manifest.permission.CAMERA)) {
                ok.add(res);
            }
        }
        if (ok.isEmpty()) {
            request.deny();
        } else {
            request.grant(ok.toArray(new String[0]));
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(requestCode, permissions, results);
        if (requestCode == REQ_LOCATION && pendingGeoCallback != null) {
            boolean granted = hasPermission(Manifest.permission.ACCESS_FINE_LOCATION)
                    || hasPermission(Manifest.permission.ACCESS_COARSE_LOCATION);
            pendingGeoCallback.invoke(pendingGeoOrigin, granted, false);
            pendingGeoCallback = null;
            pendingGeoOrigin = null;
        } else if (requestCode == REQ_CAMERA_FOR_FILE) {
            if (fileCallback != null && !launchFileChooser()) {
                fileCallback.onReceiveValue(null);
                fileCallback = null;
            }
        } else if (requestCode == REQ_MEDIA && pendingMediaRequest != null) {
            grantAllowed(pendingMediaRequest);
            pendingMediaRequest = null;
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != REQ_FILE || fileCallback == null) {
            return;
        }
        final ValueCallback<Uri[]> callback = fileCallback;
        fileCallback = null;
        pendingFileParams = null;
        final File shot = cameraFile;
        cameraFile = null;

        if (resultCode != RESULT_OK) {
            deleteQuietly(shot);
            callback.onReceiveValue(null); // cancelled; the page can pick again
            return;
        }

        Uri[] picked = null;
        if (data != null) {
            ClipData clip = data.getClipData();
            if (clip != null && clip.getItemCount() > 0 && clip.getItemAt(0).getUri() != null) {
                int n = clip.getItemCount();
                picked = new Uri[n];
                for (int i = 0; i < n; i++) {
                    picked[i] = clip.getItemAt(i).getUri();
                }
            } else if (data.getData() != null) {
                picked = new Uri[]{data.getData()};
            }
        }
        if (picked != null) {
            deleteQuietly(shot);
            callback.onReceiveValue(picked);
            return;
        }

        // No picked file → the photo came from the camera.
        if (shot == null || !shot.exists() || shot.length() == 0) {
            deleteQuietly(shot);
            callback.onReceiveValue(null);
            return;
        }
        new Thread(() -> {
            shrinkAndRotate(shot);
            final Uri uri = CaptureProvider.uriFor(shot);
            runOnUiThread(() -> callback.onReceiveValue(new Uri[]{uri}));
        }).start();
    }

    /** Opens camera + gallery/files (or camera only when the page asks for capture). */
    private boolean launchFileChooser() {
        WebChromeClient.FileChooserParams params = pendingFileParams;
        if (params == null) {
            return false;
        }
        Intent camera = acceptsImages(params) && hasPermission(Manifest.permission.CAMERA)
                ? buildCameraIntent(params) : null;
        try {
            if (camera != null && params.isCaptureEnabled()) {
                startActivityForResult(camera, REQ_FILE);
                return true;
            }
            Intent picker = params.createIntent();
            if (params.getMode() == WebChromeClient.FileChooserParams.MODE_OPEN_MULTIPLE) {
                picker.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
            }
            Intent chooser = Intent.createChooser(picker, "Choose a photo or file");
            if (camera != null) {
                chooser.putExtra(Intent.EXTRA_INITIAL_INTENTS, new Intent[]{camera});
            }
            startActivityForResult(chooser, REQ_FILE);
            return true;
        } catch (ActivityNotFoundException | SecurityException e) {
            deleteQuietly(cameraFile);
            cameraFile = null;
            return false;
        }
    }

    private Intent buildCameraIntent(WebChromeClient.FileChooserParams params) {
        Intent camera = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
        if (camera.resolveActivity(getPackageManager()) == null) {
            return null;
        }
        File dir = CaptureProvider.captureDir(this);
        File[] old = dir.listFiles();
        if (old != null) {
            for (File f : old) {
                deleteQuietly(f); // keep only the current photo on the phone
            }
        }
        cameraFile = new File(dir, "photo-" + System.currentTimeMillis() + ".jpg");
        Uri out = CaptureProvider.uriFor(cameraFile);
        camera.putExtra(MediaStore.EXTRA_OUTPUT, out);
        camera.setClipData(ClipData.newRawUri("photo", out));
        camera.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);
        if (prefersFrontCamera(params)) {
            // Unofficial hints; most camera apps open the selfie camera with these.
            camera.putExtra("android.intent.extras.CAMERA_FACING", 1);
            camera.putExtra("android.intent.extras.LENS_FACING_FRONT", 1);
            camera.putExtra("android.intent.extra.USE_FRONT_CAMERA", true);
        }
        return camera;
    }

    private static boolean acceptsImages(WebChromeClient.FileChooserParams params) {
        String[] types = params.getAcceptTypes();
        if (types == null || types.length == 0) {
            return true;
        }
        for (String raw : types) {
            if (raw == null) {
                continue;
            }
            for (String t : raw.split(",")) {
                String type = t.trim().toLowerCase();
                if (type.isEmpty() || type.equals("*/*") || type.startsWith("image/")
                        || type.equals(".jpg") || type.equals(".jpeg") || type.equals(".png")) {
                    return true;
                }
            }
        }
        return false;
    }

    /** capture="user" → selfie camera. getFilenameHint() is empty, so read the page's intent. */
    private static boolean prefersFrontCamera(WebChromeClient.FileChooserParams params) {
        // WebView only exposes capture as a boolean; selfie fields on SheRides use capture="user",
        // and ID-card fields have no capture attribute, so capture-enabled ⇒ selfie.
        return params.isCaptureEnabled();
    }

    /** Downscale to MAX_PHOTO_PX, apply EXIF rotation, save as JPEG (≈0.5–2 MB). */
    private void shrinkAndRotate(File file) {
        try {
            BitmapFactory.Options bounds = new BitmapFactory.Options();
            bounds.inJustDecodeBounds = true;
            BitmapFactory.decodeFile(file.getAbsolutePath(), bounds);
            if (bounds.outWidth <= 0 || bounds.outHeight <= 0) {
                return;
            }
            int sample = 1;
            while (Math.max(bounds.outWidth, bounds.outHeight) / (sample * 2) >= MAX_PHOTO_PX) {
                sample *= 2;
            }
            BitmapFactory.Options opts = new BitmapFactory.Options();
            opts.inSampleSize = sample;
            Bitmap bmp = BitmapFactory.decodeFile(file.getAbsolutePath(), opts);
            if (bmp == null) {
                return;
            }

            float scale = Math.min(1f, (float) MAX_PHOTO_PX / Math.max(bmp.getWidth(), bmp.getHeight()));
            Matrix m = new Matrix();
            if (scale < 1f) {
                m.postScale(scale, scale);
            }
            int degrees = exifDegrees(file);
            if (degrees != 0) {
                m.postRotate(degrees);
            }
            Bitmap out = m.isIdentity() ? bmp
                    : Bitmap.createBitmap(bmp, 0, 0, bmp.getWidth(), bmp.getHeight(), m, true);

            File tmp = new File(file.getParentFile(), file.getName() + ".tmp");
            try (OutputStream os = new FileOutputStream(tmp)) {
                out.compress(Bitmap.CompressFormat.JPEG, 85, os);
            }
            if (out != bmp) {
                out.recycle();
            }
            bmp.recycle();
            if (!tmp.renameTo(file)) {
                deleteQuietly(tmp);
            }
        } catch (Exception | OutOfMemoryError ignored) {
            // Keep the original photo if anything goes wrong.
        }
    }

    private static int exifDegrees(File file) {
        try (InputStream in = new java.io.FileInputStream(file)) {
            int o = new ExifInterface(in).getAttributeInt(
                    ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL);
            if (o == ExifInterface.ORIENTATION_ROTATE_90) return 90;
            if (o == ExifInterface.ORIENTATION_ROTATE_180) return 180;
            if (o == ExifInterface.ORIENTATION_ROTATE_270) return 270;
        } catch (Exception ignored) {
            // no EXIF
        }
        return 0;
    }

    private static void deleteQuietly(File f) {
        if (f != null && f.exists()) {
            //noinspection ResultOfMethodCallIgnored
            f.delete();
        }
    }

    private boolean hasPermission(String permission) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            return true;
        }
        return checkSelfPermission(permission) == PackageManager.PERMISSION_GRANTED;
    }

    /** https → browser; tel/mailto/sms/whatsapp → the matching phone app. */
    private void openExternally(Uri uri) {
        if (uri == null || uri.getScheme() == null) {
            return;
        }
        String scheme = uri.getScheme();
        if ("https".equals(scheme) || "tel".equals(scheme) || "mailto".equals(scheme)
                || "sms".equals(scheme) || "whatsapp".equals(scheme)) {
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, uri));
            } catch (ActivityNotFoundException ignored) {
                // No app on this phone can open it; stay in SheRides.
            }
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        webView.saveState(outState);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
            return;
        }
        super.onBackPressed();
    }

    private static boolean isSite(Uri uri) {
        if (uri == null || !"https".equals(uri.getScheme())) {
            return false;
        }
        String host = uri.getHost();
        return "sherides.online".equals(host) || (host != null && host.endsWith(".sherides.online"));
    }
}
