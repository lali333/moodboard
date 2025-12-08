import * as THREE from "three";
import Planes, { LAYOUT_RADIUS } from "./Planes";
import { useGestureStore } from "../store/gestureStore";

interface CanvasOptions {
  element: HTMLElement;
  images: string[];
}

export default class Canvas {
  globeGroup!: THREE.Group;
  element: HTMLElement;
  canvas!: HTMLCanvasElement;
  scene!: THREE.Scene;
  camera!: THREE.PerspectiveCamera;
  renderer!: THREE.WebGLRenderer;
  clock!: THREE.Clock;
  planes!: Planes;
  animationId: number | null = null;
  sizes!: { width: number; height: number };
  baseDistance = 10;
  mouseRotY = 0;
  mouseRotX = 0;
  mousePanX = 0;
  mousePanY = 0;
  mouseZoom = 0;
  isDragging = false;
  dragMode: "rotate" | "pan" = "rotate";
  lastX = 0;
  lastY = 0;
  spinVelX = 0;
  spinVelY = 0;
  spinDamping = 0.9;

  mouseDragX = 0;
  mouseDragY = 0;
  forcedBoard = false;


  constructor(opts: CanvasOptions) {
    this.element = opts.element;

    const canvas = document.createElement("canvas");
    this.canvas = canvas;
    this.element.appendChild(canvas);

    const width = this.element.clientWidth || window.innerWidth;
    const height = this.element.clientHeight || window.innerHeight;
    this.sizes = { width, height };

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#f0efea");

    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 200);
    this.baseDistance = this.computeCameraDistance();
    this.camera.position.z = this.baseDistance;
    this.scene.add(this.camera);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));

    this.clock = new THREE.Clock();

    this.globeGroup = new THREE.Group();
    this.scene.add(this.globeGroup);

    this.planes = new Planes({
      scene: this.globeGroup,
      sizes: this.sizes,
      images: opts.images,
    });


    this.onResize = this.onResize.bind(this);
    window.addEventListener("resize", this.onResize);
    this.addMouseListeners();
    this.addKeyListeners();

    this.render = this.render.bind(this);
    this.animationId = requestAnimationFrame(this.render);
  }

  render() {
    const delta = this.clock.getDelta();

    const { zoom, handPresent, panX, panY, spinX, spinY } =
      useGestureStore.getState();

    // ----------------------------
    // CAMERA ZOOM (PINCH + WHEEL)
    // ----------------------------
    const zoomFactor = THREE.MathUtils.clamp(zoom, 0, 1);
    const forcedZoom = this.forcedBoard ? 1 : 0;
    const mouseZoomIn = Math.max(this.mouseZoom, 0);
    const mouseZoomOut = Math.max(-this.mouseZoom, 0);
    const combinedZoom = THREE.MathUtils.clamp(
      zoomFactor + mouseZoomIn * 0.2 + forcedZoom,
      0,
      1
    );

    let targetZ: number;
    if (this.forcedBoard) {
      const boardBase = LAYOUT_RADIUS * 1.8;
      const boardDepth = LAYOUT_RADIUS * 1.2;
      const depthIn = Math.max(0, -this.mouseZoom);
      targetZ = boardBase + boardDepth * Math.pow(depthIn + 1, 1.3);
    } else {
      const nearDistance = this.baseDistance * Math.exp(-mouseZoomIn * 0.2);
      const farDistance = mouseZoomOut * (this.baseDistance * 0.4);
      targetZ = Math.max(this.baseDistance * 0.05, nearDistance) + farDistance;
    }

    this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, targetZ, 0.12);

    // ----------------------------
    // PHYSICAL GLOBE SPIN 
    // ----------------------------
    const HAND_FORCE = 6.0;
    const MOUSE_FORCE = 0.004;

    this.spinVelY += spinY * HAND_FORCE * delta;
    this.spinVelX += spinX * HAND_FORCE * delta;

    if (this.isDragging && this.dragMode === "rotate") {
      this.spinVelY += this.mouseDragX * MOUSE_FORCE;
      this.spinVelX += this.mouseDragY * MOUSE_FORCE;
      this.mouseDragX = 0;
      this.mouseDragY = 0;
    }

    this.globeGroup.rotation.y += this.spinVelY;
    this.globeGroup.rotation.x += this.spinVelX;

    this.globeGroup.rotation.x = THREE.MathUtils.clamp(
      this.globeGroup.rotation.x,
      -Math.PI / 2,
      Math.PI / 2
    );

    this.spinVelY *= this.spinDamping;
    this.spinVelX *= this.spinDamping;


    // ----------------------------
    // CAMERA PAN WHEN ZOOMED
    // ----------------------------
    const panScale = LAYOUT_RADIUS * 0.8 * combinedZoom;

    const targetX = THREE.MathUtils.clamp(
      panX * panScale + this.mousePanX,
      -LAYOUT_RADIUS,
      LAYOUT_RADIUS
    );

    const targetY = THREE.MathUtils.clamp(
      -panY * panScale + this.mousePanY,
      -LAYOUT_RADIUS,
      LAYOUT_RADIUS
    );

    this.camera.position.x = THREE.MathUtils.lerp(
      this.camera.position.x,
      targetX,
      0.1
    );

    this.camera.position.y = THREE.MathUtils.lerp(
      this.camera.position.y,
      targetY,
      0.1
    );

    // ----------------------------
    // RENDER
    // ----------------------------
    this.planes.render(delta);
    this.renderer.render(this.scene, this.camera);
    this.animationId = requestAnimationFrame(this.render);
  }



  onResize() {
    const width = this.element.clientWidth || window.innerWidth;
    const height = this.element.clientHeight || window.innerHeight;
    this.sizes = { width, height };

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.baseDistance = this.computeCameraDistance();
    this.camera.position.z = this.baseDistance;
    this.renderer.setSize(width, height);
  }

  private computeCameraDistance() {
    const margin = 2; 
    const radius = LAYOUT_RADIUS + margin;
    const fovRad = THREE.MathUtils.degToRad(this.camera.fov);
    const aspect = this.camera.aspect || 1;

    // sphere fit
    const distForSphereH = radius / Math.tan(fovRad / 2);
    const distForSphereW = radius / (Math.tan(fovRad / 2) * aspect);

    // board fit 
    const boardHalf = LAYOUT_RADIUS + margin;
    const distForBoardH = boardHalf / Math.tan(fovRad / 2);
    const distForBoardW = boardHalf / (Math.tan(fovRad / 2) * aspect);

    return Math.max(distForSphereH, distForSphereW, distForBoardH, distForBoardW);
  }

  private addMouseListeners() {
    this.element.addEventListener("mousedown", this.onMouseDown);
    window.addEventListener("mousemove", this.onMouseMove);
    window.addEventListener("mouseup", this.onMouseUp);
    this.element.addEventListener("wheel", this.onWheel, { passive: false });
  }

  private addKeyListeners() {
    window.addEventListener("keydown", this.onKeyDown);
  }

  private onMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    this.isDragging = true;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    this.dragMode = e.button === 0 ? "rotate" : "pan";
  };

  private onMouseMove = (e: MouseEvent) => {
    if (!this.isDragging) return;

    const dx = e.clientX - this.lastX;
    const dy = e.clientY - this.lastY;
    this.lastX = e.clientX;
    this.lastY = e.clientY;

    if (this.dragMode === "rotate") {
      this.mouseDragX = dx; // horizontal spin
      this.mouseDragY = dy; // vertical tilt 
    } else {
      const panScale = 0.01;
      this.mousePanX = THREE.MathUtils.clamp(
        this.mousePanX + dx * panScale,
        -LAYOUT_RADIUS,
        LAYOUT_RADIUS
      );
      this.mousePanY = THREE.MathUtils.clamp(
        this.mousePanY - dy * panScale,
        -LAYOUT_RADIUS,
        LAYOUT_RADIUS
      );
    }

  };

  private onMouseUp = () => {
    this.isDragging = false;
    this.mouseDragX = 0;
    this.mouseDragY = 0;
  };

  private onKeyDown = (e: KeyboardEvent) => {
    const isSpace = e.code === "Space" || e.key === " " || e.key === "Spacebar" || e.keyCode === 32;
    if (isSpace) {
      e.preventDefault();
      this.forcedBoard = !this.forcedBoard;
      this.mouseZoom = this.forcedBoard ? 0 : this.mouseZoom;
      this.planes.setForcedBoard(this.forcedBoard);
      this.planes.setMorphTarget(this.forcedBoard ? 1 : 0);
    }
  };


  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const zoomDelta = -e.deltaY * 0.001; // scroll up = zoom in / down = out
    // allow extended range so scrolling can continue indefinitely
    this.mouseZoom = THREE.MathUtils.clamp(this.mouseZoom + zoomDelta, -100, 5);

    // horizontal trackpad swipe to pan board when zoomed
    const panDelta = e.deltaX * 0.005;
    this.mousePanX = THREE.MathUtils.clamp(
      this.mousePanX + panDelta,
      -LAYOUT_RADIUS,
      LAYOUT_RADIUS
    );
  };

  dispose() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }

    if (this.canvas && this.canvas.parentNode === this.element) {
      this.element.removeChild(this.canvas);
    }

    window.removeEventListener("resize", this.onResize);
    this.element.removeEventListener("mousedown", this.onMouseDown);
    window.removeEventListener("mousemove", this.onMouseMove);
    window.removeEventListener("mouseup", this.onMouseUp);
    this.element.removeEventListener("wheel", this.onWheel);
    window.removeEventListener("keydown", this.onKeyDown);
    this.renderer.dispose();
    this.planes.dispose();
  }
}
