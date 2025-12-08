import { useEffect, useRef } from "react";
import { useGestureStore } from "../store/gestureStore";

export default function FingerCursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = useGestureStore.subscribe((state) => {
      if (!ref.current) return;

      const x = (state.cursorX * 0.5 + 0.5) * window.innerWidth;
      const y = (state.cursorY * 0.5 + 0.5) * window.innerHeight;

      ref.current.style.transform = `translate(${x}px, ${y}px)`;
      ref.current.style.opacity = state.handPresent ? "1" : "0";
    });

    return () => unsub();
  }, []);

  return (
    <div
      ref={ref}
      className="fixed top-0 left-0 w-4 h-4 pointer-events-none rounded-full
                 bg-white blur-sm shadow-[0_0_25px_rgba(255,255,255,0.9)]
                 transition-opacity duration-150 z-50"
    />
  );
}
