const storageKey = "ripats.access-device-key";

export function accessDeviceKey() {
  const existing = window.localStorage.getItem(storageKey);
  if (existing) return existing;
  const key = crypto.randomUUID();
  window.localStorage.setItem(storageKey, key);
  return key;
}
