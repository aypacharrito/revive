# REVIVE QA Matrix (Windows 10/11)

Status definitions: **automated** = command-line tests passing in the current container; **manual pending** = must be tested in a real Windows install; **future** = not implemented.

| Scenario | Expected | Status |
| --- | --- | --- |
| Import valid game executable | Adds without modifying original | Automated + Windows manual pending |
| Scan folder with installer and game | Skips uninstaller/updater binaries | Automated |
| Launch legitimate installation | Starts in game working directory | Windows manual pending |
| Playtime accounting | Tracks approximate minutes on child exit | Windows manual pending |
| Native window frame | Windows caption/min/max controls present | Windows manual pending |
| Side nav, transitions, search | No errors; keyboard reachable | Windows manual pending |
| Custom cover import | Accept PNG/JPEG/WebP with signature check | Code implemented; manual pending |
| Save snapshot and restore | Nested save files restored; path traversal rejected | Automated |
| Cloud upload/restore | HTTPS WebDAV, snapshot before overwrite | Loopback test automated; real provider pending |
| Verified download | Enforced hash, cleanup mismatch, safe filename | Automated |
| Cancellation | Ends active transfer and cleans temp file | Manual pending |
| AI game diagnostics | Small static report, secret server-side | Manual provider setup pending |
| AI source review | Owner picks folder and confirms before sending | Text collection tests automated; provider setup pending |
| LAN adapter scan | Reports possible virtual interface without claiming connectivity | Automated |
| Blur two-PC game | Same-router LAN joins reliably | Future |
| Sunset Overdrive PC co-op | Not represented as functional | Automated profile assertion |
| Disabled external navigation | No arbitrary browser/window spawning from untrusted source | Code implemented; Windows manual pending |
| Download progress with slow connection | Smooth 150ms interval updates | Code implemented; manual pending |
| Keyboard & reduced motion | Ctrl+K, Escape, Alt+Left; animation preference | Code implemented; Windows manual pending |
| Compile Windows installer | `.exe` produced by CI runner | Pending GitHub push and workflow |

## Tests

`cd desktop && npm test`

The repository does not include a Windows Electron binary in the ZIP, and a headless Chromium visual smoke test could not be completed in the current environment due to administrator navigation restrictions. Building and screenshot testing should be done through Windows or GitHub Actions.
