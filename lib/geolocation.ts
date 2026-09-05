export function requestRiderLocation() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return reject(new Error("Location is not supported on this device."));
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 30000,
    });
  });
}

export function isLocationPermissionDenied(error: unknown) {
  return Boolean(
    error && typeof error === "object" && "code" in error && Number((error as { code?: number }).code) === 1
  );
}

export function locationErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "code" in error) {
    const code = Number((error as { code?: number }).code);
    if (code === 1) {
      return "Tap Allow when your browser asks for Location, then tap Enable Location or Send SOS again.";
    }
    if (code === 2) return "Your device could not determine its location. Turn on Location/GPS and try again.";
    if (code === 3) return "Location request timed out. Check Location/GPS and try again.";
  }
  return "Live location could not be read. Check Location/GPS and try again.";
}
