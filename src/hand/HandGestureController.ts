import {
  HandLandmarker,
  FilesetResolver
} from "@mediapipe/tasks-vision";

type GestureCallback = (gesture: {
  zoom: number,
  rotation: number,
  handPresent: boolean,
  panX: number,
  panY: number,
  cursorX: number,
  cursorY: number,
  swirl: number,
  spinX: number,
  spinY: number,
}) => void;

export class HandGestureController {
  private video: HTMLVideoElement;
  private landmarker: HandLandmarker | null = null;
  private callback: GestureCallback;
  private rafId: number | null = null;
  private stream: MediaStream | null = null;
  private destroyed = false;
  private lastWrist: { x: number; y: number } | null = null;

  constructor(callback: GestureCallback) {
    this.callback = callback;
    this.video = document.createElement("video");
    this.video.autoplay = true;

    this.init();
  }

  async init() {
    if (this.destroyed) return;

    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    this.landmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task"
      },
      runningMode: "VIDEO",
      numHands: 1
    });

    if (this.destroyed) return;

    await this.initCamera();
    this.startLoop();
  }

  async initCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480 }
    });
    this.stream = stream;
    this.video.srcObject = this.stream;

    await this.video.play();
  }

  startLoop() {
    const process = () => {
      if (this.destroyed) return;

      if (this.landmarker && this.video.readyState >= 2) {
        const result = this.landmarker.detectForVideo(
          this.video,
          performance.now()
        );

        if (result.landmarks && result.landmarks.length > 0) {
          const hand = result.landmarks[0];

          // zoom amount = distance between index + thumb
          const thumb = hand[4];
          const index = hand[8];
          const middle = hand[12];
          const wrist = hand[0];

          const dx = thumb.x - index.x;
          const dy = thumb.y - index.y;
          const pinchDistance = Math.sqrt(dx * dx + dy * dy);

          // only treat as zoom when fingers are close 
          const zoomNorm = pinchDistance < 0.08
            ? Math.max(0, Math.min(1, (0.12 - pinchDistance) * 20))
            : 0;

          // wrist rotation relative to index finger (for spin)
          const rotateVal = index.x - wrist.x;

          // pan / cursor from index tip position centered around 0
          const cursorX = (index.x - 0.5) * 2;
          const cursorY = (index.y - 0.5) * 2;

          // swirl detection: two-finger (index + middle) orientation relative to wrist
          const idxMidDx = index.x - middle.x;
          const idxMidDy = index.y - middle.y;
          const idxMidDist = Math.sqrt(idxMidDx * idxMidDx + idxMidDy * idxMidDy);

          let swirl = 0;
          if (idxMidDist > 0.05) {
            const v1x = index.x - wrist.x;
            const v1y = index.y - wrist.y;
            const v2x = middle.x - wrist.x;
            const v2y = middle.y - wrist.y;
            const cross = v1x * v2y - v1y * v2x; 
            swirl = Math.max(-1, Math.min(1, cross * 10));
          }

          // spin based on wrist movement (wave)
          let spinX = 0;
          let spinY = 0;

          if (this.lastWrist) {
            const moveX = wrist.x - this.lastWrist.x;
            const moveY = wrist.y - this.lastWrist.y;

            const clamp = (v: number, min: number, max: number) =>
              Math.max(min, Math.min(max, v));

            spinX = clamp(-moveY * 6.0, -1, 1);
            spinY = clamp(moveX * 6.0, -1, 1);
          }

          this.lastWrist = { x: wrist.x, y: wrist.y };

          this.callback({
            zoom: zoomNorm,
            rotation: rotateVal,
            handPresent: true,
            panX: cursorX,
            panY: cursorY,
            cursorX,
            cursorY,
            swirl: 0,
            spinX,
            spinY,
          });
        } else {
          this.lastWrist = null;
          this.callback({
            zoom: 0,
            rotation: 0,
            handPresent: false,
            panX: 0,
            panY: 0,
            cursorX: 0,
            cursorY: 0,
            swirl: 0,
            spinX: 0,
            spinY: 0,
          });
        }
      }

      this.rafId = requestAnimationFrame(process);
    };

    this.rafId = requestAnimationFrame(process);
  }

  destroy() {
    this.destroyed = true;

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }

    if (this.landmarker) {
      void this.landmarker.close();
      this.landmarker = null;
    }
  }
}
