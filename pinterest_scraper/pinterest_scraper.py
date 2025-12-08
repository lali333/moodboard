from typing import List
from pinterest_dl import PinterestDL


class PinterestScrapeError(Exception):
    pass


def get_board_images(board_url: str) -> List[str]:

    try:
        scraper = PinterestDL.with_api(
            timeout=5,
            verbose=False,
            ensure_alt=False,
        )

        medias = scraper.scrape(
            url=board_url,
            num=200,
            min_resolution=None,
        )

        if not medias:
            raise PinterestScrapeError("No media scraped from board")

        urls = []
        for media in medias:
            data = media.to_dict()

            img = (
                data.get("image_url")
                or data.get("image")
                or data.get("src")
            )

            if not img:
                if isinstance(data.get("urls"), dict):
                    img = data["urls"].get("orig") or data["urls"].get("full")

            if img:
                urls.append(img)

        if not urls:
            raise PinterestScrapeError("Found media, but no usable image URLs")

        seen = set()
        clean = []
        for u in urls:
            if u not in seen:
                seen.add(u)
                clean.append(u)

        return clean

    except Exception as e:
        raise PinterestScrapeError(str(e))
