export default function StarLoader() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
      <div className="star-loader-grid">
        <img src="/star1.svg" className="star star-1" />
        <img src="/star2.svg" className="star star-2" />
        <img src="/star3.svg" className="star star-3" />
      </div>
    </div>
  );
}
