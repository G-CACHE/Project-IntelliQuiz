/**
 * Device ID Management
 * 
 * Manages a persistent, browser-based UUID for identifying devices across sessions.
 * This "sticky session" approach allows participants to reconnect seamlessly even if
 * their IP address changes (network switch, mobile network, etc.).
 */

const DEVICE_ID_KEY = 'intelliquiz_device_id';

/**
 * Generates a new UUID v4
 * Uses the modern crypto.randomUUID() if available, falls back to manual generation
 */
function generateUUID(): string {
  // Use crypto.randomUUID() if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Gets or creates the device ID for this browser.
 * 
 * First call: Generates a new UUID and stores it in localStorage
 * Subsequent calls: Returns the same UUID from localStorage
 * 
 * @returns The browser's unique identifier
 */
export function getOrCreateDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);

  if (!deviceId) {
    deviceId = generateUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
    console.log('[DeviceID] Generated new device ID:', deviceId);
  }

  return deviceId;
}

/**
 * Gets the current device ID without creating one
 * 
 * @returns The device ID if it exists, null otherwise
 */
export function getDeviceId(): string | null {
  return localStorage.getItem(DEVICE_ID_KEY);
}

/**
 * Clears the device ID (useful for testing or logout scenarios)
 * After this, getOrCreateDeviceId() will generate a new one
 */
export function clearDeviceId(): void {
  localStorage.removeItem(DEVICE_ID_KEY);
  console.log('[DeviceID] Device ID cleared');
}

/**
 * Checks if a device ID is already registered
 */
export function hasDeviceId(): boolean {
  return localStorage.getItem(DEVICE_ID_KEY) !== null;
}
