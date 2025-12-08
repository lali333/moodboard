import { useState } from "react";

interface Props {
  onLoaded: (images: string[]) => void;
  onLoadingChange?: (loading: boolean) => void;
  onSubmit: () => void;
}

export default function UrlInputScreen({
  onLoaded,
  onLoadingChange,
  onSubmit, 
}: Props) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!url.trim()) {
      setError("Please paste a Pinterest board URL");
      return;
    }

    try {
      onSubmit();                
      onLoadingChange?.(true);  
      setLoading(true);

      const res = await fetch("http://localhost:8000/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Failed to scrape board");
        return;
      }

      if (!data.images || !Array.isArray(data.images) || data.images.length === 0) {
        setError("No images returned from scraper");
        return;
      }

      onLoaded(data.images); 
    } catch (err) {
      console.error(err);
      setError("Network error talking to scraper");
    } finally {
      setLoading(false);
      onLoadingChange?.(false);
    }
  }

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center gap-6 text-black px-4">
      <h1 className="text-3xl font-bold text-center">
        Paste your Pinterest board URL
      </h1>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xl"
      >
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.pinterest.com"
          className="flex-1 px-3 py-2 border-2 border-dashed border-black text-black w-full bg-white"
        />

        <button
          type="submit"
          disabled={loading}
          className="px-2 py-1 rounded-2xl bg-white text-black font-semibold border border-black focus:outline-none focus:ring-2 focus:ring-pink-200 focus:ring-offset-2 active:ring-2 active:ring-pink-200 disabled:opacity-50"
        >
          {loading ? "Loading…" : "Submit"}
        </button>
      </form>

      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
    </div>
  );
}
