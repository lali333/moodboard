import { useEffect, useRef } from "react";
import Canvas from "../webgl/Canvas";

interface Props {
  images: string[];
}

export default function Canvas3D({ images }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const canvasInstance = new Canvas({
      element: containerRef.current,
      images,
    });

    return () => {
      canvasInstance.dispose();
    };
  }, [images]);

  return <div className="w-full h-full" ref={containerRef} />;
}
