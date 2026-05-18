import { useEffect, useRef, useState } from "react";

interface DeviceOrientationState {
  tiltX: number; // -1 to 1, where -1 is left tilt, 1 is right tilt
  isSupported: boolean;
  permissionGranted: boolean;
}

const TILT_THRESHOLD = 5; // Minimum tilt angle in degrees to register movement
const MAX_TILT = 30; // Maximum tilt angle for full speed
const SMOOTHING_FACTOR = 0.3; // Lower = smoother but more lag

export function useDeviceOrientation(enabled: boolean) {
  const [state, setState] = useState<DeviceOrientationState>({
    tiltX: 0,
    isSupported: false,
    permissionGranted: false,
  });

  const smoothedTiltRef = useRef(0);
  const lastGammaRef = useRef(0);

  useEffect(() => {
    // Check if DeviceOrientation API is supported
    const isSupported = "DeviceOrientationEvent" in window;

    if (!isSupported || !enabled) {
      setState((prev) => ({ ...prev, isSupported }));
      return;
    }

    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.gamma === null) return;

      // gamma is the left-to-right tilt in degrees (-90 to 90)
      // Positive gamma = tilted right, Negative gamma = tilted left
      let gamma = event.gamma;

      // Handle device orientation (portrait vs landscape)
      if (event.beta !== null && Math.abs(event.beta) > 90) {
        // Device is upside down, invert gamma
        gamma = -gamma;
      }

      // Apply dead zone threshold
      let normalizedTilt = 0;
      if (Math.abs(gamma) > TILT_THRESHOLD) {
        // Map gamma to -1 to 1 range with sensitivity curve
        const adjustedGamma = gamma - Math.sign(gamma) * TILT_THRESHOLD;
        normalizedTilt = Math.max(
          -1,
          Math.min(1, adjustedGamma / (MAX_TILT - TILT_THRESHOLD)),
        );

        // Apply easing curve for more natural feel
        normalizedTilt =
          Math.sign(normalizedTilt) * Math.abs(normalizedTilt) ** 0.8;
      }

      // Smooth the tilt value to reduce jitter
      smoothedTiltRef.current =
        smoothedTiltRef.current * (1 - SMOOTHING_FACTOR) +
        normalizedTilt * SMOOTHING_FACTOR;

      lastGammaRef.current = gamma;

      setState((prev) => ({
        ...prev,
        tiltX: smoothedTiltRef.current,
        permissionGranted: true,
      }));
    };

    // Request permission for iOS 13+
    const requestPermission = async () => {
      if (
        typeof (DeviceOrientationEvent as any).requestPermission === "function"
      ) {
        try {
          const permission = await (
            DeviceOrientationEvent as any
          ).requestPermission();
          if (permission === "granted") {
            window.addEventListener("deviceorientation", handleOrientation);
            setState((prev) => ({
              ...prev,
              isSupported: true,
              permissionGranted: true,
            }));
          }
        } catch (error) {
          console.error(
            "Error requesting device orientation permission:",
            error,
          );
        }
      } else {
        // Non-iOS devices or older iOS versions
        window.addEventListener("deviceorientation", handleOrientation);
        setState((prev) => ({
          ...prev,
          isSupported: true,
          permissionGranted: true,
        }));
      }
    };

    requestPermission();

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, [enabled]);

  return state;
}

export function isMobileDevice(): boolean {
  // Check user agent for mobile devices
  const userAgent =
    navigator.userAgent || navigator.vendor || (window as any).opera;

  return (
    /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
      userAgent.toLowerCase(),
    ) ||
    // Also check for touch support and small screen
    ("ontouchstart" in window && window.innerWidth < 1024)
  );
}
