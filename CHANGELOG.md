# Changelog

All notable changes to RajWorthman are recorded here.

## [0.0.1] — 2026-11-23 · Sprint 1

First client preview build. Formerly "TravelLine".

### Added
- **RajWorthman branding**: new logo on all entry screens, app icon, splash screen, favicon and page title.
- **Android and iOS apps** built from the same code as the website (Capacitor). Android APK: `RajWorthman-v0.0.1.apk`.
- Local file storage for photos and documents (`POST /api/uploads`), used when Cloudinary is not configured.
- Mobile support: notch / safe-area padding, camera permission for document photos.
- **Public home page** (`/`) about RajWorthman's business and personal transport services, with driver sign-up and a **Download for Android** button served from the live server (`/downloads/RajWorthman-latest.apk`).
- **VPS deployment kit** (`deploy/`): PostgreSQL setup commands, full schema SQL, Nginx config, PM2, HTTPS and backups.

### Fixed
- Security: drivers could mark their own vehicle as verified; vehicle and registration fields are now whitelisted.
- Adding a vehicle during sign-up always failed.
- The success page appeared even when submission failed, and steps 1–2 moved on after failed saves. Errors are now shown and the user can retry.
- Users were logged out at random (refresh tokens were thrown away, and duplicate tokens were issued).
- On phones, the side menu stayed open over every page.
- Wizard steps opened scrolled to the bottom.
- Admin pages ran off the side of the screen on phones.
- Dashboard always showed "Address" and "Driving Licence" as not done.
- Top bar showed "Driver" instead of the driver's name after sign-up.
- Backend and frontend builds failed on TypeScript errors.
- The backend opened a separate database connection pool per controller.
- Behind a reverse proxy, rate limits applied to all users at once; the real client IP is now used in production.

### Known limitations
- The APK connects to a server on the office Wi-Fi (`192.168.0.112:3001`). It only works on that network until the backend is hosted online.
- The APK is a debug build, for testing only. It is not signed for Play Store release.
- iOS builds need a Mac with Xcode.
- Trip History, Earnings and Support pages are placeholders.
- There is no screen yet for uploading vehicle documents.
- Forgot-password emails need SMTP settings.
