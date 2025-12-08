import { useState } from "react";

interface Props {
  onLoaded: (images: string[]) => void;
}

export default function ImageUploadScreen({ onLoaded }: Props) {
  const [preview, setPreview] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    const urls: string[] = [];
    for (const file of fileList) {
      urls.push(URL.createObjectURL(file));
    }

    const unique = Array.from(new Set(urls));

    setPreview(unique);
    onLoaded(unique);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    addFiles(e.target.files);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center gap-4 text-white bg-black">
      <h1 className="text-3xl font-bold">Upload your moodboard images</h1>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`w-full max-w-xl border-2 border-dashed rounded-lg p-6 text-center transition ${
          isDragging ? "border-white bg-white/10" : "border-neutral-600 bg-neutral-900"
        }`}
      >
        <p className="mb-3">Drag & drop images here, or choose files</p>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          className="text-white"
        />
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4 max-h-60 overflow-y-auto">
        {preview.map((src, i) => (
          <img key={i} src={src} className="w-24 h-24 object-cover rounded" />
        ))}
      </div>
    </div>
  );
}
