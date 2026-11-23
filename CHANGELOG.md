# Changelog

All notable changes to RajWorthman are recorded here.

## [0.0.2] — 2026-11-23 · Sprint 2

The driver app is now a proper mobile app, and fleet owners can join.

### Added
- **Launch animation**: a RajWorthman truck drives the logo along a highway to the centre of the screen (tap to skip).
- **Steering-wheel app icon** and deeper navy and orange colours across the app.
- **Mobile app design**: phone-first screens with a bottom tab bar, large touch targets, bottom sheets and a highway-themed login.
- **New sign-up**: Driver or Fleet Owner, then language, permissions, mobile number + OTP, then name and date of birth. Drivers also choose "driver" or "driver with vehicle" and the vehicles they can drive.
- **11 languages**: English, Hindi, Telugu, Tamil, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi and Odia. The app switches as soon as one is chosen, and it is saved to the account.
- **Mobile number + OTP login**. Test mode: the OTP is `1234` for every number (`OTP_TEST_MODE`) until an SMS provider is connected.
- **Permissions screen** (Android): location, camera, files, gallery, phone and messages.
- **Driver home checklist**: the remaining steps (address, licence, documents, vehicle, experience, emergency contact), then "Send for verification". Includes an online/offline switch.
- **Re-upload requests**: the admin can accept or ask for any single document again with a reason. The driver sees it on the home screen and in alerts.
- **Fleet owners**: sign-up, a fleet of vehicles with photos (and optional RC), sending for verification, and **Find drivers nearby** on a free OpenStreetMap map. Phone numbers are shown only for verified drivers.
- **Admin panel**: a sidebar with live counts (all registered, profile incomplete, profile completed, waiting RC approval, asked to re-upload, approved, rejected), **Register a driver**, and fleet owner review.

### Changed
- Email + password sign-up for drivers was replaced by mobile number + OTP. The admin still logs in with email + password.
- New drivers start as "Profile incomplete" and reach the admin queue only after sending their profile for verification.

### Database
- Two new migrations (`20261123115900_sprint2_enums`, `20261123120000_sprint2_phone_fleet`). They only add tables and columns, so no existing data is changed.

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
- The demo runs at `http://187.77.178.120:8080` (port 8080, because the VPS already hosts another site on 80/443) without HTTPS. HTTPS needs a full domain name (e.g. `client-demo.example.com`) pointing to the server.
- The APK is a debug build, for testing only. It is not signed for Play Store release.
- iOS builds need a Mac with Xcode.
- Trip History, Earnings and Support pages are placeholders.
- There is no screen yet for uploading vehicle documents.
- Forgot-password emails need SMTP settings.
