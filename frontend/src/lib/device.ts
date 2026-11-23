/* Device permissions and location for the Android app (native plugin) and the website (browser APIs). */
import { Capacitor, registerPlugin } from '@capacitor/core';

export type PermKey = 'location' | 'camera' | 'files' | 'gallery' | 'phone' | 'sms';
export type PermResult = Record<PermKey, boolean>;
export const PERM_KEYS: PermKey[] = ['location', 'camera', 'files', 'gallery', 'phone', 'sms'];

type NativeState = 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale' | 'limited';
type NativeAlias = 'location' | 'camera' | 'media' | 'storage' | 'phone' | 'sms';

/* Implemented in android/.../AppPermissionsPlugin.java */
const AppPermissions = registerPlugin<{
  checkPermissions(): Promise<Record<NativeAlias, NativeState>>;
  requestPermissions(opts: { permissions: NativeAlias[] }): Promise<Record<NativeAlias, NativeState>>;
}>('AppPermissions');

export const isAndroidApp = () => Capacitor.getPlatform() === 'android';

const fromNative = (s: Record<NativeAlias, NativeState>): PermResult => {
  const ok = (a: NativeAlias) => s[a] === 'granted' || s[a] === 'limited';
  // Android 13+ uses "media" (photos), older versions use "storage"
  const files = ok('media') || ok('storage');
  return { location: ok('location'), camera: ok('camera'), files, gallery: files, phone: ok('phone'), sms: ok('sms') };
};

export const checkPermissions = async (): Promise<PermResult | null> => {
  if (!isAndroidApp()) return null;
  try { return fromNative(await AppPermissions.checkPermissions()); } catch { return null; }
};

export const requestAllPermissions = async (): Promise<PermResult> => {
  if (isAndroidApp()) {
    try {
      return fromNative(await AppPermissions.requestPermissions({ permissions: ['location', 'camera', 'media', 'storage', 'phone', 'sms'] }));
    } catch { /* fall through to browser prompts */ }
  }
  // Browser / iOS web view: only location and camera have prompts; files, gallery, phone and SMS need none.
  const location = await getPosition().then(() => true, () => false);
  let camera = false;
  try {
    const stream = await navigator.mediaDevices?.getUserMedia({ video: true });
    stream?.getTracks().forEach((tr) => tr.stop());
    camera = !!stream;
  } catch { camera = false; }
  return { location, camera, files: true, gallery: true, phone: true, sms: true };
};

export const getPosition = (timeout = 12000) =>
  new Promise<{ lat: number; lng: number }>((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('Location not available')); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (e) => reject(e),
      { enableHighAccuracy: true, timeout, maximumAge: 60_000 },
    );
  });

/* Send the driver's / owner's location at most once every 5 minutes */
export const shareLocationThrottled = async (send: (lat: number, lng: number) => Promise<unknown>) => {
  const KEY = 'rw-loc-sent';
  const last = Number(sessionStorage.getItem(KEY) || 0);
  const pos = await getPosition();
  if (Date.now() - last > 5 * 60_000) {
    await send(pos.lat, pos.lng);
    sessionStorage.setItem(KEY, String(Date.now()));
  }
  return pos;
};
