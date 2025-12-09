# Interactive 3D Moodboard 
An immersive, gesture-controlled 3D moodboard that transforms Pinterest boards into a floating visual environment you can navigate with hand gestures. Images are scraped via a local Python service and rendered in a WebGL scene, while hand gestures are tracked in real time using MediaPipe for intuitive navigation. Built as an experimental tool for creative exploration, interaction design and generative inspiration.

https://github.com/user-attachments/assets/96f2dd05-bc79-4364-89a9-9e4e963437e4

## ᯓ★ Features
- Paste a Pinterest board URL and scrape images via a local FastAPI service.
- 3D scene built with Three.js that morphs between a globe and flat board layout (Space to toggle).
- Gesture controls powered by MediaPipe Hands: pinch to zoom, wrist movement to spin, index finger to pan/aim the camera, with an on-screen finger cursor.
- Mouse/trackpad fallback: drag to spin/tilt, right-click drag to pan, scroll to zoom, trackpad swipe to pan when zoomed.
- Minimal loading UI with a starfield spinner while images download.

## ᯓ★ Project Goals
- Explore spatial UI for image browsing.
- Experiment with gesture-based interaction using real-time hand tracking.
- Build a full-stack creative tool combining WebGL + ML + scraping.
- Create an alternative to flat moodboard tools like Milanote or Pinterest.

## ᯓ★ Stack & Dependencies
**Frontend**
- Vite + React 19
- TypeScript
- Three.js 0.181
- Zustand (gesture state)
- Tailwind CSS
- MediaPipe `@mediapipe/tasks-vision`

**Backend**
- FastAPI
- Uvicorn
- `pinterest-dl`

**Runtime**
- Node 18+
- Python 3.11+
- Optional Docker for scraper

## ᯓ★ Setup
1) Install JS deps
```bash
npm install
```
2) Run the Pinterest scraper (separate terminal)
```bash
cd pinterest_scraper
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
3) Start the frontend
```bash
npm run dev
```
Visit the Vite dev URL (defaults to http://localhost:5173). The frontend expects the scraper at http://localhost:8000.

### ⋆ Docker option for the scraper 
```bash
cd pinterest_scraper
docker build -t moodboard-scraper .
docker run -p 8000:8000 moodboard-scraper
```

## ᯓ★ Gesture & Keyboard Controls
- Pinch (thumb/index) to zoom. Move hand to pan camera when zoomed.
- Wrist motion (wave) spins the globe/board; index finger position drives the on-screen cursor.
- Space toggles globe ↔ board layout.
- Mouse: left-drag to spin/tilt, right-drag to pan, scroll to zoom, horizontal scroll to pan when zoomed.

## ᯓ★ Known Limitations
- Pinterest scraping depends on board visibility and may fail on private boards or boards with multiple sections.
- Mobile gesture tracking is experimental.
- No persistent database (sessions are temporary).

## ᯓ★ Roadmap
- Drag & drop image uploads
- Enhance gesture tracking accuracy and usability. 
- Cloud deployment for scraper API
- Multi-board moodboard saving
- Image selection + annotation inside the globe

## ᯓ★ Sources / Credits
- Authentic Sans Condensed 60 font from the [Authentic-Sans repository](https://github.com/Laureha/Authentic-Sans).
- Pinterest scraping via [`pinterest-dl`](https://github.com/sean1832/pinterest-dl).
- Hand tracking via [`@mediapipe/tasks-vision`](https://developers.google.com/mediapipe/solutions/vision/hand_landmarker).

## License
[MIT](LICENSE.txt)
