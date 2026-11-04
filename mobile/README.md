# Mobile app setup

## API connection

The Android emulator can reach a backend running on the development computer at
`http://10.0.2.2:3000/api`. The app uses this as its development fallback.

For a physical Android phone, `localhost` and `10.0.2.2` are not the computer's
LAN address. Configure `REACT_APP_API_URL` to a backend address reachable from
the phone, for example `http://192.168.1.20:3000/api` on the same trusted Wi-Fi
network. For production, use the backend's HTTPS URL.

Keep the backend bound to an interface reachable by the phone, allow the
development port through the local firewall, and do not expose an unauthenticated
development server to the public internet.

## Commands

```sh
cd mobile
npm ci
npm run type-check
npm run lint
```

The API URL is compiled into the app bundle. Rebuild/restart Metro after changing
the environment value.

## Session limitation

The current mobile client keeps the access token in memory. A process restart
requires signing in again; persistent secure token storage is not yet implemented.
