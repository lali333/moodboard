import { create } from "zustand";

interface ImageState {
  images: string[];
  setImages: (imgs: string[]) => void;
}

export const useImageStore = create<ImageState>((set) => ({
  images: [],
  setImages: (imgs) => set({ images: Array.from(new Set(imgs)) }),
}));
