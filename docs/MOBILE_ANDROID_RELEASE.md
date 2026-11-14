# Android mobile release procedure

This document describes the current React Native Android client in `mobile/`.
It does not certify that an APK has been built, installed on a physical device,
or accepted for public release.

## Local development

1. Install the Node version declared by the mobile CI workflow and Java 17.
2. Run `npm ci` from `mobile/`.
3. Copy `.env.example` to an untracked `.env` and set `API_URL`.
4. For the Android emulator, the default host alias is `10.0.2.2`. For a
   physical Android phone, set `API_URL` to a backend address reachable from
   that phone on the same network, or to the HTTPS test/production API.
5. Run `npm run type-check`, `npm run lint`, then
   `cd android && ./gradlew assembleDebug`.

The debug APK is for development and controlled device testing only.

## Release signing

Never commit a keystore, signing password, private key, or signing properties.
Do not use Android's shared/default debug key to sign a release APK or AAB.

The release Gradle configuration requires these protected environment variables:

- `SINA_ANDROID_RELEASE_STORE_FILE`: path to the owner-managed keystore on the build runner.
- `SINA_ANDROID_RELEASE_STORE_PASSWORD`: keystore password.
- `SINA_ANDROID_RELEASE_KEY_ALIAS`: release key alias.
- `SINA_ANDROID_RELEASE_KEY_PASSWORD`: release key password.

Keep the keystore file outside the repository and inject the four values through
a protected local environment or a secret store in the release pipeline. Never
put signing values in `.env`, app configuration, source code, or a client bundle.

With signing configured, build using:

```sh
cd mobile/android
./gradlew assembleRelease
# or:
./gradlew bundleRelease
```

Without all required signing values and an existing keystore file, the release
tasks must fail before producing a distributable release artifact. Debug builds
remain independent of release signing.

## Release acceptance still required

- Confirm the owner-controlled release keystore is backed up securely.
- Build and install the signed release artifact on a physical Android device.
- Verify API connectivity, login/session restore/logout, project and job flows.
- Verify Persian and English text, RTL behavior, keyboard handling, small screens,
  accessibility labels, and Android back/navigation behavior.
- Verify the release artifact's package ID, version, signing certificate, and
  production API endpoint.
- Run the deployment and provider acceptance gates documented in
  `docs/release/INITIAL-RELEASE-GATE.md`.

A successful debug CI job is not a release-signing check and does not replace
physical-device acceptance testing.
