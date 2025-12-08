import { create } from "zustand";

export interface GestureValues {
  zoom: number;
  rotation: number;
  handPresent: boolean;
  panX: number;
  panY: number;
  cursorX: number;
  cursorY: number;
  swirl: number;
  spinX: number;
  spinY: number;
}

export interface GestureState extends GestureValues {
  setGesture: (v: GestureValues) => void;
}

export const useGestureStore = create<GestureState>((set) => ({
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

  setGesture: (v) =>
    set({
      zoom: v.zoom,
      rotation: v.rotation,
      handPresent: v.handPresent,
      panX: v.panX,
      panY: v.panY,
      cursorX: v.cursorX,
      cursorY: v.cursorY,
      swirl: v.swirl,
      spinX: v.spinX,
      spinY: v.spinY,
    }),
}));
