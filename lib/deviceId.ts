/**
 * Device ID Management
 * Provides stateless authentication via UUID stored in localStorage
 */

export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') {
    throw new Error('getOrCreateDeviceId can only be called on the client side');
  }

  let deviceId = localStorage.getItem('mission_match_device_id');

  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('mission_match_device_id', deviceId);
  }

  return deviceId;
}

export function getDeviceId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem('mission_match_device_id');
}

export function clearDeviceId(): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem('mission_match_device_id');
}
