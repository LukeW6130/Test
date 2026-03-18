# Sky Glide 3D

A tiny browser game where you fly a stylized 3D plane over unique procedural terrain.

## I don't have the repo yet — how do I run it?

1. Install **Git** and **Python 3**.
2. Clone the repository.
3. Start a local static server in the project folder.
4. Open the game in your browser.

Example commands:

```bash
git clone <REPO_URL>
cd Test
python3 -m http.server 8000
```

Then open: <http://localhost:8000>

> Open the game through `http://localhost:8000` rather than `file://...`; the ES module import for Three.js is intended to be served from a local web server.

> If your folder name is different, use `cd <your-folder-name>` instead of `cd Test`.

## Controls

- **W / S**: pitch up/down (elevator)
- **A / D**: roll left/right (ailerons)
- **Q / E**: yaw left/right (rudder)
- **Shift**: afterburner burst for fighter-jet-style acceleration
- Turns are coordinated by your bank angle for a more realistic feel
