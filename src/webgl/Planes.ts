import * as THREE from "three";
import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";
import { useGestureStore } from "../store/gestureStore";

export const LAYOUT_RADIUS = 6;
const MAX_TEXTURES = 16; 

// ------------------------------------------------------
// TYPES
// ------------------------------------------------------
interface PlanesOptions {
  scene: THREE.Object3D;
  sizes: { width: number; height: number };
  images: string[];
}

export default class Planes {
  scene: THREE.Object3D;
  sizes: { width: number; height: number };

  images: string[];
  textures: THREE.Texture[] = [];
  textureGroups: THREE.Texture[][] = [];

  meshes: THREE.InstancedMesh[] = [];
  materials: THREE.ShaderMaterial[] = [];
  forcedBoard = false;

  uniforms: {
    uTime: THREE.IUniform<number>;
    uZoomFactor: THREE.IUniform<number>;
    uTextures: THREE.IUniform<THREE.Texture[]>;
    uTextureCount: THREE.IUniform<number>;
    uSwirlStrength: THREE.IUniform<number>;
  } = {
    uTime: { value: 0 },
    uZoomFactor: { value: 0 },
    uTextures: { value: [] },
    uTextureCount: { value: 1 },
    uSwirlStrength: { value: 0 },
  };

  count = 0;

  spherePositions: THREE.Vector3[] = [];
  planePositions: THREE.Vector3[] = [];
  dummy = new THREE.Object3D();

  constructor(options: PlanesOptions) {
    this.images = Array.from(new Set(options.images));
    this.scene = options.scene;
    this.sizes = options.sizes;
    this.count = Math.max(this.images.length, 1); 

    this.generateLayouts();
    this.loadTextures().then(() => {
      this.createPlanes();
    });
  }

  setForcedBoard(enabled: boolean) {
    this.forcedBoard = enabled;
  }

  // ------------------------------------------------------
  // LOAD PINTEREST IMAGES AS TEXTURES
  // ------------------------------------------------------
  async loadTextures() {
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = "anonymous";

    const placeholder = this.createPlaceholderTexture();

    const images = this.images.length > 0 ? this.images : ["placeholder"];

    const groups: string[][] = [];
    for (let i = 0; i < images.length; i += MAX_TEXTURES) {
      groups.push(images.slice(i, i + MAX_TEXTURES));
    }

    const loadOne = (url: string) =>
      new Promise<THREE.Texture>((resolve) => {
        if (url === "placeholder") {
          resolve(placeholder.clone());
          return;
        }

        const isRemote = /^https?:\/\//i.test(url);
        const proxied = `/api/image-proxy?url=${encodeURIComponent(url)}`;

        const onFail = () => resolve(placeholder.clone());

        if (isRemote) {
          loader.load(
            url,
            (texture) => resolve(texture),
            undefined,
            () => {
              loader.load(proxied, (texture) => resolve(texture), undefined, onFail);
            }
          );
        } else {
          loader.load(url, (texture) => resolve(texture), undefined, onFail);
        }
      });

    const textureGroups: THREE.Texture[][] = [];
    for (const group of groups) {
      const textures = await Promise.all(group.map((url) => loadOne(url)));
      while (textures.length < MAX_TEXTURES) {
        textures.push(placeholder.clone());
      }
      textureGroups.push(textures);
    }

    this.textureGroups = textureGroups;
    this.textures = textureGroups.flat();
  }


  // ------------------------------------------------------
  // PRECOMPUTE SPHERE + CLOUD POSITIONS
  // ------------------------------------------------------
  generateLayouts() {
    for (let i = 0; i < this.count; i++) {
      const phi = Math.acos(-1 + (2 * i) / this.count);
      const theta = Math.sqrt(this.count * Math.PI) * phi;

      const spherePos = new THREE.Vector3().setFromSphericalCoords(
        LAYOUT_RADIUS,
        phi,
        theta
      );
      this.spherePositions.push(spherePos);

      // grid/board layout for zoomed-in view
      const cols = Math.ceil(Math.sqrt(this.count));
      const rows = Math.ceil(this.count / cols);
      const spacingX = 1.6;
      const spacingY = 1.9;
      const col = i % cols;
      const row = Math.floor(i / cols);
      const offsetX = (col - (cols - 1) / 2) * spacingX;
      const verticalShift = spacingY * 0.6; 
      const offsetY = ((rows - 1) / 2 - row) * spacingY - verticalShift;

      // add depth and randomness 
      const depthJitter = (Math.random() - 0.5) * 3.0;
      const depthLayer = (row - rows / 2) * 0.25;
      this.planePositions.push(new THREE.Vector3(offsetX, offsetY, depthJitter + depthLayer));
    }
  }

  // ------------------------------------------------------
  // CREATE INSTANCED PLANES WITH TEXTURES
  // ------------------------------------------------------
  createPlanes() {
    const groups = this.textureGroups.length ? this.textureGroups : [ [] ];
    let globalIndex = 0;

    for (const textures of groups) {
      const groupCount = Math.min(MAX_TEXTURES, Math.max(1, Math.min(textures.length, this.count - globalIndex)));
      if (groupCount <= 0) break;

      const geometry = new THREE.PlaneGeometry(1.2, 1.6);

      const uniforms = {
        uTime: { value: 0 },
        uZoomFactor: { value: 0 },
        uTextures: { value: textures },
        uTextureCount: { value: groupCount },
        uSwirlStrength: { value: 0 },
      };

      const material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader,
        fragmentShader,
        transparent: true,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.InstancedMesh(geometry, material, groupCount);

      const sphereAttr = new Float32Array(groupCount * 3);
      const planeAttr = new Float32Array(groupCount * 3);
      const texIndexAttr = new Float32Array(groupCount);

      for (let i = 0; i < groupCount; i++) {
        const idx = globalIndex + i;
        sphereAttr.set(this.spherePositions[idx].toArray(), i * 3);
        planeAttr.set(this.planePositions[idx].toArray(), i * 3);

        texIndexAttr[i] = i;

        this.dummy.position.copy(this.spherePositions[idx]);
        this.dummy.lookAt(0, 0, 0);
        this.dummy.rotateZ(Math.random() * Math.PI * 2);
        this.dummy.updateMatrix();
        mesh.setMatrixAt(i, this.dummy.matrix);
      }

      mesh.instanceMatrix.needsUpdate = true;

      geometry.setAttribute("spherePos", new THREE.InstancedBufferAttribute(sphereAttr, 3));
      geometry.setAttribute("planePos", new THREE.InstancedBufferAttribute(planeAttr, 3));
      geometry.setAttribute("texIndex", new THREE.InstancedBufferAttribute(texIndexAttr, 1));

      this.scene.add(mesh);
      this.meshes.push(mesh);
      this.materials.push(material);

      globalIndex += groupCount;
    }
  }

  // ------------------------------------------------------
  // ANIMATE + APPLY ZOOM TRANSITION
  // ------------------------------------------------------

  render(delta: number) {
    for (const material of this.materials) {
      material.uniforms.uTime.value += delta;

      const { zoom } = useGestureStore.getState();
      const target = this.forcedBoard ? 1 : THREE.MathUtils.clamp(zoom * 3.5, 0, 1);

      material.uniforms.uZoomFactor.value = THREE.MathUtils.lerp(
        material.uniforms.uZoomFactor.value,
        target,
        0.12
      );
    }
  }


  dispose() {
    this.meshes.forEach((mesh) => {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
    });
    this.materials.forEach((mat) => mat.dispose());
    this.textures.forEach((t) => t.dispose());
  }

  private createPlaceholderTexture() {
    const data = new Uint8Array([255, 255, 255, 255]);
    const texture = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
    texture.needsUpdate = true;
    return texture;
  }
}
