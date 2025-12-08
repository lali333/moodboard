import { useEffect, useState, useRef } from "react";
import { HandGestureController } from "./hand/HandGestureController";
import { useGestureStore } from "./store/gestureStore";

import UrlInputScreen from "./components/UrlInputScreen";
import Moodboard3D from "./components/Moodboard3D";
import FingerCursor from "./components/FingerCursor";
import StarLoader from "./components/StarLoader";

function App() {
  const [loaded, setLoaded] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [isScraping, setIsScraping] = useState(false);
  const [cameraRequested, setCameraRequested] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraDenied, setCameraDenied] = useState(false);
  

  const setGesture = useGestureStore.getState().setGesture;
  const controllerRef = useRef<HandGestureController | null>(null);

  // only start camera AFTER user allows it
  useEffect(() => {
    if (!cameraEnabled) return;

    const controller = new HandGestureController((gesture) => {
      setGesture(gesture);
    });

    controllerRef.current = controller;

    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, [cameraEnabled, setGesture]);

  return (
    <div className="w-screen h-screen overflow-hidden">
      <FingerCursor />

      {!cameraRequested && !loaded && (
        <UrlInputScreen
          onSubmit={() => {
            setCameraRequested(true); 
          }}
          onLoadingChange={setIsScraping}
          onLoaded={(imgs) => {
            setImages(imgs);
            setLoaded(true);
            setIsScraping(false);
          }}
        />
      )}

      {cameraRequested && !cameraEnabled && (
        <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-black text-white">
          <p className="mb-6 text-lg">Enable camera for gesture control?</p>

          <div className="flex gap-6">
            <button
              onClick={() => setCameraEnabled(true)}
              className="px-6 py-2 bg-white text-black rounded"
            >
              Enable
            </button>

            <button
              onClick={() => {
                setCameraEnabled(false);
                setCameraRequested(false);
                setCameraDenied(true); 
                setIsScraping((prev) => prev);
              }}
              className="px-6 py-2 border border-white rounded"
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {(cameraEnabled || cameraDenied) && !loaded && isScraping && <StarLoader />}

      {loaded && (cameraEnabled || cameraDenied) && <Moodboard3D images={images} />}
    </div>
  );
}

export default App;
