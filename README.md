# PlayGround

<!-- omgithub:readme:start -->
## 🚀 Build, play, and remix with OMGithub

**Created using [OMGithub.com](https://go.ondev.store/).**

[![OMGithub](https://img.shields.io/badge/OMGithub-Open%20project-orange?style=for-the-badge)](https://go.ondev.store/jay8877728/PlayGround)
[![GitHub](https://img.shields.io/badge/GitHub-Source-181717?logo=github&style=for-the-badge)](https://github.com/jay8877728/PlayGround)

- 🎮 [Open the project](https://go.ondev.store/jay8877728/PlayGround).
- ✨ [Remix this project](https://go.ondev.store/jay8877728/PlayGround?remix=1).
- 💻 [Explore the source](https://github.com/jay8877728/PlayGround).
- 🛠️ [Check build runs](https://github.com/jay8877728/PlayGround/actions).
- 🐛 [Report an issue](https://github.com/jay8877728/PlayGround/issues).
- 👤 [Explore the creator's projects](https://go.ondev.store/jay8877728).
- 🌍 [Create with OMGithub](https://go.ondev.store/).
<!-- omgithub:readme:end -->

## City Brawl

A mobile-friendly 3D city fighting game prototype. Serve the static game client with any HTTP server; its multiplayer server is a separate process.

```bash
npm install
npm run server
# In another terminal, serve this directory (for example):
python3 -m http.server 3002 --bind 0.0.0.0
```

Open `http://localhost:3002`. The WebSocket server listens on port `3001` (override with `GAME_PORT`) and exposes `GET /health`. The client uses `ws://<host>:3001` or `wss://<host>:3001` as appropriate. For remote online play, deploy the WebSocket server behind a publicly reachable TLS-enabled reverse proxy and set `window.GAME_SERVER_URL` before loading the client.

The prototype implements real-time room state, authoritative attack damage, private room codes, matchmaking, 1v1/2v2/5v5 teams, and rounds. Persistent accounts, competitive ranking, anti-cheat, and production matchmaking infrastructure are not included.
