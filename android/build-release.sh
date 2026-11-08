#!/bin/sh
# Builds the release SheRides shell APK. Signing material is never written here.
set -eu

ROOT="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
APP="$ROOT/android/app/src/main"
SDK="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-$HOME/android-sdk}}"
BT="$SDK/build-tools/35.0.0"
PLATFORM="$SDK/platforms/android-35/android.jar"
KEYSTORE="${SHERIDES_KEYSTORE:-/cursor/stores/bot/private/sherides-android/sherides-release.jks}"
PASSWORD_FILE="${SHERIDES_KEYSTORE_PASSWORD_FILE:-/cursor/stores/bot/private/sherides-android/keystore.password}"
WORK="$ROOT/android/build"
OUT="$ROOT/public/sherides.apk"

if [ ! -f "$KEYSTORE" ] || [ ! -f "$PASSWORD_FILE" ]; then
  echo "Signing keystore is missing from private storage." >&2
  exit 1
fi
if [ ! -f "$PLATFORM" ] || [ ! -x "$BT/aapt2" ]; then
  echo "Android SDK platform android-35 or build-tools 35.0.0 is missing." >&2
  exit 1
fi

rm -rf "$WORK"
mkdir -p "$WORK/compiled" "$WORK/gen"

cp "$ROOT/public/icons/icon-192.png" "$APP/res/mipmap-xxxhdpi/ic_launcher.png"

"$BT/aapt2" compile --dir "$APP/res" -o "$WORK/compiled.zip"
"$BT/aapt2" link \
  -o "$WORK/unsigned.apk" \
  -I "$PLATFORM" \
  --manifest "$APP/AndroidManifest.xml" \
  --java "$WORK/gen" \
  -R "$WORK/compiled.zip" \
  --auto-add-overlay

javac --release 17 -classpath "$PLATFORM" -d "$WORK/classes" \
  "$APP/java/online/sherides/app/MainActivity.java" \
  "$WORK/gen/online/sherides/app/R.java"
"$BT/d8" --min-api 24 --output "$WORK" "$WORK/classes/online/sherides/app/"*.class
mkdir -p "$WORK/aligned"
( cd "$WORK" && zip -q -j unsigned.apk classes.dex )
"$BT/zipalign" -p -f 4 "$WORK/unsigned.apk" "$WORK/aligned.apk"
# Passwords stay on stdin. They are not printed and are not stored in this repo.
PASSWORD="$(sed -n '1p' "$PASSWORD_FILE")"
printf '%s\n%s\n' "$PASSWORD" "$PASSWORD" | "$BT/apksigner" sign \
  --ks "$KEYSTORE" \
  --ks-key-alias sherides \
  --ks-pass stdin \
  --key-pass stdin \
  --out "$OUT" \
  "$WORK/aligned.apk"
unset PASSWORD
"$BT/apksigner" verify --verbose "$OUT" >/dev/null
echo "apk=$OUT"
echo "sha256=$(sha256sum "$OUT" | awk '{print $1}')"
