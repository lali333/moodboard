import React from "react";
import Canvas3D from "./Canvas3D";
import { useGestureStore } from "../store/gestureStore";

interface Props {
  images: string[];
}

export default function Moodboard3D({ images }: Props) {
  const { cursorX, cursorY, handPresent } = useGestureStore();
  const cursorStyle: React.CSSProperties = {
    opacity: handPresent ? 0.9 : 0,
    transform: `translate(${50 + cursorX * 50}%, ${50 + cursorY * 50}%) translate(-50%, -50%)`,
  };

  return (
    <div className="w-full h-full relative">
      <Canvas3D images={images} />
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute w-4 h-4 rounded-full bg-white/80 shadow-[0_0_12px_rgba(255,255,255,0.9)] transition-opacity duration-200"
          style={cursorStyle}
        />
      </div>
    </div>
  );
}
