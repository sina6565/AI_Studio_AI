# SINA AI STUDIO — Mobile

The mobile client uses React Native 0.88 and the official React Native Community Android template.

## Android development

Requirements: Node.js 22.13.0 or newer (CI uses 22.22.2), JDK 17, and the Android SDK/NDK versions declared in `android/build.gradle`. Do not use Node 22.7.0.

```sh
cd mobile
npm install
npm start
```

In a second terminal:

```sh
cd mobile
npm run android
# Or build only the debug APK:
npm run android:debug
```

The debug manifest permits cleartext HTTP for local development endpoints. Release builds disable cleartext traffic. The Android package ID is `com.sinastudioai`.

## API configuration

The Android emulator reaches a backend on the development host through `http://10.0.2.2:3000/api`. For a physical phone, set `REACT_APP_API_URL` to a backend address reachable on the same network. Use HTTPS for production. Never bundle provider secrets or private credentials into the mobile app.

## Signing

No keystore is committed. Debug builds use the Android Gradle Plugin's local developer debug key. Release APK/AAB tasks require an owner-managed keystore and all four protected variables: `SINA_ANDROID_RELEASE_STORE_FILE`, `SINA_ANDROID_RELEASE_STORE_PASSWORD`, `SINA_ANDROID_RELEASE_KEY_ALIAS`, and `SINA_ANDROID_RELEASE_KEY_PASSWORD`.

## Verification status

This commit adds the native scaffold; it does not prove an APK build, installation, physical-device test, API compatibility, or RTL acceptance. Verify the Mobile CI run and complete device QA before release.
