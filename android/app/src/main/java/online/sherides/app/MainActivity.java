package online.sherides.app;

import android.Manifest;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.webkit.GeolocationPermissions;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

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
 * Permissions are only granted to pages on sherides.online.
 */
public class MainActivity extends Activity {
    static final String START_URL = "https://sherides.online/";

    private static final int REQ_FILE = 1001;
    private static final int REQ_LOCATION = 1002;
    private static final int REQ_MEDIA = 1003;

    private WebView webView;

    private ValueCallback<Uri[]> fileCallback;

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
            // <input type="file"> — photo / document picker
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback,
                                             FileChooserParams params) {
                if (fileCallback != null) {
                    fileCallback.onReceiveValue(null);
                }
                fileCallback = callback;
                try {
                    Intent intent = params.createIntent();
                    if (params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE) {
                        intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
                    }
                    startActivityForResult(intent, REQ_FILE);
                    return true;
                } catch (ActivityNotFoundException e) {
                    fileCallback = null;
                    return false;
                }
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
        Uri[] result = null;
        if (resultCode == RESULT_OK && data != null) {
            if (data.getClipData() != null) {
                int n = data.getClipData().getItemCount();
                result = new Uri[n];
                for (int i = 0; i < n; i++) {
                    result[i] = data.getClipData().getItemAt(i).getUri();
                }
            } else if (data.getData() != null) {
                result = new Uri[]{data.getData()};
            }
        }
        fileCallback.onReceiveValue(result); // null = cancelled; lets the page pick again
        fileCallback = null;
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
