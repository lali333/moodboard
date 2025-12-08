import os
import time
import uuid
import glob
from typing import List, Tuple

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, HttpUrl

from pinterest_dl import PinterestDL

# -----------------------------
# Config
# -----------------------------
BASE_DIR = os.path.dirname(__file__)
STORAGE_ROOT = os.path.join(BASE_DIR, "storage")
MAX_SESSION_AGE_SECONDS = 60 * 10  

os.makedirs(STORAGE_ROOT, exist_ok=True)

# -----------------------------
# Models
# -----------------------------
class ScrapeRequest(BaseModel):
  url: HttpUrl
  num: int | None = 40
  min_width: int | None = 512
  min_height: int | None = 512


class ScrapeResponse(BaseModel):
  images: List[str]


# -----------------------------
# Cleanup helper
# -----------------------------
def cleanup_old_sessions() -> None:
  now = time.time()
  try:
    for name in os.listdir(STORAGE_ROOT):
      session_path = os.path.join(STORAGE_ROOT, name)
      if not os.path.isdir(session_path):
        continue

      age = now - os.path.getmtime(session_path)
      if age > MAX_SESSION_AGE_SECONDS:
        # Delete old session folder
        import shutil
        shutil.rmtree(session_path, ignore_errors=True)
  except FileNotFoundError:
    pass


def find_images_in_folder(folder: str) -> List[str]:
  exts = ("*.jpg", "*.jpeg", "*.png", "*.webp", "*.gif")
  paths: List[str] = []
  for pattern in exts:
    paths.extend(glob.glob(os.path.join(folder, pattern)))
  return paths


# -----------------------------
# FastAPI app
# -----------------------------
app = FastAPI()

app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"], 
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=STORAGE_ROOT), name="static")
app.mount("/images", StaticFiles(directory=STORAGE_ROOT), name="images")


@app.post("/scrape", response_model=ScrapeResponse)
async def scrape_board(payload: ScrapeRequest, request: Request) -> ScrapeResponse:
  cleanup_old_sessions()

  # New session folder
  session_id = uuid.uuid4().hex
  session_dir = os.path.join(STORAGE_ROOT, session_id)
  os.makedirs(session_dir, exist_ok=True)

  try:
    # Scrape media using API mode
    dl = PinterestDL.with_api(
      timeout=5,
      verbose=False,
      ensure_alt=False,
    )

    medias = dl.scrape(
      url=str(payload.url),
      num=payload.num or 40,
      min_resolution=(
        payload.min_width or 0,
        payload.min_height or 0,
      ),
    )

    if not medias:
      raise HTTPException(status_code=400, detail="No media found on this board")

    # Download media into session folder
    PinterestDL.download_media(
      media=medias,
      output_dir=session_dir,
      download_streams=False, 
    )

    # Find downloaded image files
    image_paths = find_images_in_folder(session_dir)
    if not image_paths:
      raise HTTPException(status_code=500, detail="No images were downloaded")

    # Build public URLs for frontend
    base_url = str(request.base_url).rstrip("/")
    images: List[str] = []
    for path in image_paths:
      rel = os.path.relpath(path, STORAGE_ROOT)
      rel = rel.replace(os.sep, "/")
      images.append(f"{base_url}/images/{rel}")

    return ScrapeResponse(images=images)

  except HTTPException:
    raise
  except Exception as e:
    # Debugging 
    raise HTTPException(status_code=500, detail=f"Scrape failed: {e}")
