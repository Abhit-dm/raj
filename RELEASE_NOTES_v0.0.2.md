# RajWorthman v0.0.2: Sprint 2 preview

*Drive | Manage | Grow*

This update turns the driver app into a real mobile app and adds fleet owners.

## What's new

**Look and feel**
- When the app opens, a RajWorthman truck brings the logo along the highway to the centre of the screen.
- New steering-wheel app icon, deeper navy and orange colours, and a highway-themed login screen.
- Phone-style screens with a bottom tab bar (Home, Documents, Alerts, Profile), like the delivery and ride apps drivers already use.

**Signing up (about a minute)**
1. Choose **Sign up as Driver** or **Sign up as Fleet Owner**.
2. Choose a language: English, हिन्दी, తెలుగు, தமிழ், ಕನ್ನಡ, മലയാളം, मराठी, বাংলা, ગુજરાતી, ਪੰਜਾਬੀ or ଓଡ଼ିଆ. The app switches straight away.
3. Allow location, camera, files, gallery, phone and messages.
4. Enter the mobile number, then the OTP. **For this preview the OTP is always 1234.**
5. Enter first name, last name and date of birth.
6. Drivers then choose **Driver** or **Driver with vehicle**, and every vehicle they can drive (car, van, bus, lorry, truck, trailer, tanker, crane, tractor and more).

**Drivers**
- The home screen lists what is still missing: address, licence, documents, vehicle (if they have one), experience and emergency contact. After that, they tap **Send for verification**.
- Documents can be photographed or picked from the gallery or files.
- If the team rejects a document, the driver sees the reason and uploads it again.
- An **Online / Offline** switch controls whether nearby fleet owners can see the driver.

**Fleet owners**
- Add vehicles with photos (and an optional RC photo), then send the fleet for verification.
- **Find drivers nearby** on a map, filtered by vehicle type and distance. Verified drivers have a **Call** button.

**Your team (admin panel)**
- The sidebar shows counts for each stage: all registered, profile incomplete, profile completed, waiting RC approval, asked to re-upload, approved and rejected.
- Accept each document, or ask for it again with a reason. Accept, reject, or ask the driver to add their documents again.
- **Register a driver** directly. The driver then logs in with that mobile number.
- Review fleet owners and their vehicle photos.

## How to try it
- **Android:** open **http://187.77.178.120:8080** on the phone, tap **Download for Android** and install. If the old version is installed, this update installs over it.
- **Admin panel:** http://187.77.178.120:8080/admin/login (login details shared separately).

## Please note
- **OTP is in test mode (1234)** until an SMS provider is connected. This must be switched off before real drivers use the app.
- The demo still runs on a temporary address without HTTPS.
- The maps use free OpenStreetMap tiles, which suit a demo. A busy live app will need a paid map provider.
- Translations were prepared by our team. A native speaker should review each language before launch.
- Before a Play Store release, the "messages" (SMS) permission has to be replaced with Google's SMS Retriever, because Play only allows SMS access for approved apps.
