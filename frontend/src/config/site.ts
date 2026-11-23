// Public-site settings. Update these for each release / when contact details are confirmed.
export const APP_VERSION = '0.0.2';

// Where the Android app is downloaded from on the live server.
// Default: served by the backend (or Nginx) from the /downloads folder on the VPS.
export const APK_URL: string = import.meta.env.VITE_APK_URL || '/downloads/RajWorthman-latest.apk';
export const APK_SIZE_LABEL = '7.2 MB';

// Leave empty to hide a contact line on the home page.
export const CONTACT = {
  phone: import.meta.env.VITE_CONTACT_PHONE || '',
  email: import.meta.env.VITE_CONTACT_EMAIL || '',
  address: import.meta.env.VITE_CONTACT_ADDRESS || '',
};
