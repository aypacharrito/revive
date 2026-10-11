# REVIVE — Multiplayer Revival Engineering Plan

## Two different problems, never conflated

1. **Cloud game streaming:** The game runs on one host PC while video/audio are transmitted to a friend. [Sunshine](https://docs.lizardbyte.dev/projects/sunshine/latest/) and [Moonlight](https://github.com/moonlight-stream/moonlight-docs/wiki/Setup-Guide) can stream games with low latency. Streaming a single-player game does not add a second in-game character or independent multiplayer simulation.
2. **Actual multiplayer:** The game executable and networking stack must support a shared simulation, or an independent compatible multiplayer implementation needs to be engineered. Lobby/chat software doesn't substitute for netcode or multiplayer game logic.

## Game compatibility matrix

| Game | Native PC multiplayer | Best initial avenue | Stage | Evidence |
| --- | --- | --- | --- | --- |
| Blur (2010) | LAN exists | Check a compatible virtual LAN/community service, coordinate identical game versions, test session discovery and join | Research / manual tests required | [Community](https://www.nexusmods.com/blur/mods/4) |
| Sunset Overdrive (PC) | Multiplayer omitted from PC release | Reverse engineering or authorized PC multiplayer port research; no quick network adapter solution | Research only | [Steam discussion](https://steamcommunity.com/app/847370/discussions/0/3104564981107805084/) |
| Sunset Overdrive (Xbox) | Chaos Squad 2–8 | Use original supported Xbox multiplayer where available; it does not transfer to PC | Historical native capability | [Xbox](https://www.xbox.com/en-us/games/store/Sunset-Overdrive/BRZHFR5XBLQS) |
| Unknown game | Unverified | Investigate launch version, networking, mods, LAN protocol, community and legal ownership | No compatibility guarantee | Per-game research |

## Blur integration acceptance tests

- Obtain two lawful PC installations and document version hashes and launch paths.
- Verify a local LAN match can be hosted and joined on two Windows machines on the same router. Measure packet loss, ping and disconnect behavior.
- If local LAN works, test a chosen virtual LAN that supports the required traffic; document Windows firewall consent and network adapter configuration. Note some virtual networks don't forward LAN broadcast traffic automatically.
- Test geographically separated PCs with direct and relay scenarios. Require explicit consent before privileged configuration.
- Only then implement one-click adapter wizard in REVIVE, supported OS version detection, documented rollback, and error reporting.

## Sunset Overdrive acceptance criteria

- Verify an independently tested, legal PC co-op implementation exists *before* announcing support.
- If none exists, label multiplayer **unsupported**. Adding a matchmaker cannot restore cut game logic.
- Optional streaming/sharing can be clearly labeled 'Remote play/spectate' but not 'eight-player cooperative campaign'.

## Proposed later networking backend

- User identities: OAuth/passkeys with per-friend invitations; no owner tokens distributed.
- Signaling: low-data WebSocket presence and lobbies. Use persistent store for presence metadata; don't put match traffic through Vercel Functions.
- Gameplay: native LAN/game-specific networking or permitted protocol adapter. Consider P2P/NAT and dedicated relays based on observed connectivity.
- Network QoS instrumentation: report median RTT, p95 RTT, jitter, loss, reconnect. Do not claim 'Steam latency' without measurement.
- Security: rate limits, opt-in peer discovery, anti-abuse controls, private session IDs, signed adapters, integrity checks, consent for network drivers.

## Public reference code

- [Valve GameNetworkingSockets](https://github.com/ValveSoftware/GameNetworkingSockets): transport primitives. Does **not** magically connect an offline legacy game to the Steam relay/authentication system.
- [Epic Online Services lobbies/sessions](https://dev.epicgames.com/docs/epic-online-services/multiplayer/lobbies-and-sessions/lobbies-and-sessions-introduction): SDK integration requires game support and account provisioning.
- [Microsoft's 2014 Chaos Squad gameplay video](https://news.xbox.com/en-us/2014/06/10/events-sunset-overdrive-preview-e3/): authoritative historical gameplay mode reference.
