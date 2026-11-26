"""Приводит фото игрока к единому стилю сайта sibhl.ru/padel.

Что делает:
  1. убирает фон (rembg, локально, без отправки фото куда-либо);
  2. ставит одинаковый серо-голубой фон с мягким радиальным градиентом;
  3. кадрирует квадрат по лицу: лицо по центру, одинаковый масштаб
     (на сайте фото показывается кружком 40 px, object-cover);
  4. слегка выравнивает яркость/контраст человека;
  5. сохраняет JPEG 240x240 в padel-sibhl/img/<slug>.jpg.

Запуск:
  python padel_photo.py <исходное фото> <slug> [--out DIR] [--size 240]
Пример:
  python padel_photo.py C:/photos/ivanov.heic ivanov
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageFilter, ImageOps

try:  # фото с iPhone (.heic)
    from pillow_heif import register_heif_opener

    register_heif_opener()
except ImportError:
    pass

# --- Стиль -----------------------------------------------------------------
BG_CENTER = (196, 204, 216)  # центр фона
BG_EDGE = (166, 176, 192)    # края фона
HEAD_SHARE = 0.62            # высота головы (макушка..подбородок) / сторона квадрата
MAX_HEAD_SHARE = 0.80        # крупнее этого не приближать, даже если исходник тесный
TOP_MARGIN = 0.10            # отступ над макушкой (доля стороны)
REMBG_MODEL = "u2net_human_seg"

HERE = Path(__file__).resolve().parent
DEFAULT_OUT = HERE.parent.parent / "padel-sibhl" / "img"


def load(path: Path) -> Image.Image:
    img = Image.open(path)
    img = ImageOps.exif_transpose(img)
    return img.convert("RGB")


def _cascade() -> "cv2.CascadeClassifier":
    """OpenCV не открывает пути с кириллицей — читаем XML через строку."""
    xml = (Path(cv2.data.haarcascades) / "haarcascade_frontalface_default.xml").read_text(encoding="utf-8")
    fs = cv2.FileStorage(xml, cv2.FILE_STORAGE_READ | cv2.FILE_STORAGE_MEMORY)
    casc = cv2.CascadeClassifier()
    if not casc.read(fs.getFirstTopLevelNode()):
        raise RuntimeError("не удалось загрузить детектор лиц")
    return casc


def detect_face(img: Image.Image) -> tuple[int, int, int, int] | None:
    """Самое крупное лицо анфас: (x, y, w, h) в координатах img."""
    scale = 800 / max(img.size) if max(img.size) > 800 else 1.0
    small = img.resize((round(img.width * scale), round(img.height * scale)))
    gray = cv2.cvtColor(np.asarray(small), cv2.COLOR_RGB2GRAY)
    gray = cv2.equalizeHist(gray)
    casc = _cascade()
    min_side = max(24, int(min(small.size) * 0.08))
    faces = casc.detectMultiScale(gray, scaleFactor=1.08, minNeighbors=6, minSize=(min_side, min_side))
    if len(faces) == 0:
        return None
    x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
    return tuple(int(round(v / scale)) for v in (x, y, w, h))  # type: ignore[return-value]


def face_from_mask(alpha: np.ndarray) -> tuple[int, int, int, int]:
    """Запасной вариант, если лицо не найдено: верх силуэта = макушка."""
    ys, xs = np.nonzero(alpha > 128)
    top = ys.min()
    head_rows = alpha[top: top + max(1, (ys.max() - top) // 4)] > 128
    cols = np.nonzero(head_rows.any(axis=0))[0]
    w = int((cols.max() - cols.min()) * 0.8)
    cx = int((cols.max() + cols.min()) / 2)
    return cx - w // 2, int(top + w * 0.35), w, w


def remove_bg(img: Image.Image) -> Image.Image:
    from rembg import new_session, remove

    session = new_session(REMBG_MODEL)
    cut = remove(img, session=session, post_process_mask=True)
    return cut.convert("RGBA")


def background(size: int) -> Image.Image:
    yy, xx = np.mgrid[0:size, 0:size].astype(np.float32)
    c = (size - 1) / 2
    r = np.sqrt((xx - c) ** 2 + (yy - c * 0.85) ** 2) / (size * 0.75)
    r = np.clip(r, 0, 1)[..., None]
    col = np.array(BG_CENTER, np.float32) * (1 - r) + np.array(BG_EDGE, np.float32) * r
    return Image.fromarray(col.astype(np.uint8), "RGB")


def tone(person: Image.Image) -> Image.Image:
    """Мягкое выравнивание яркости/контраста только по пикселям человека."""
    rgb = np.asarray(person.convert("RGB")).astype(np.float32)
    a = np.asarray(person.getchannel("A")) > 128
    if a.sum() < 100:
        return person
    lum = rgb[a].mean(axis=1)
    lo, hi = np.percentile(lum, 1), np.percentile(lum, 99)
    if hi - lo < 10:
        return person
    k = 0.5  # сила коррекции: 0 — без изменений, 1 — полный автоконтраст
    stretched = (rgb - lo) * (255.0 / (hi - lo))
    out = rgb * (1 - k) + stretched * k
    out = np.clip(out, 0, 255).astype(np.uint8)
    res = Image.fromarray(out, "RGB").convert("RGBA")
    res.putalpha(person.getchannel("A"))
    return res


def process(src: Path, size: int = 240) -> tuple[Image.Image, bool]:
    img = load(src)
    face = detect_face(img)
    cut = tone(remove_bg(img))
    found = face is not None
    if face is None:
        face = face_from_mask(np.asarray(cut.getchannel("A")))
    x, y, w, h = face
    cx = x + w / 2
    alpha = np.asarray(cut.getchannel("A"))

    # Макушка: верх силуэта над лицом (с волосами/кепкой).
    x0, x1 = max(0, int(x + w * 0.2)), min(alpha.shape[1], int(x + w * 0.8))
    rows = np.nonzero((alpha[: max(1, int(y + h / 2)), x0:x1] > 128).any(axis=1))[0]
    head_top = float(rows.min()) if len(rows) else y - h * 0.45
    head_top = max(head_top, y - h * 0.9)  # руки/ракетка над головой — не считаем
    chin = y + h * 1.08
    head_h = chin - head_top

    side = head_h / HEAD_SHARE
    # Не выходить за низ и бока исходника, иначе тело «обрывается»
    # посреди кадра — лучше чуть крупнее план.
    side = min(side, (img.height - head_top) / (1 - TOP_MARGIN), 2 * cx, 2 * (img.width - cx))
    side = max(side, head_h / MAX_HEAD_SHARE)
    left = cx - side / 2
    top = head_top - side * TOP_MARGIN

    # кадр может выходить за край исходника — там будет просто фон
    work = 1024
    k = work / side
    person = cut.resize((max(1, round(cut.width * k)), max(1, round(cut.height * k))), Image.LANCZOS)
    bg = background(work).convert("RGBA")
    bg.alpha_composite(person, (round(-left * k), round(-top * k)))
    out = bg.convert("RGB").resize((size, size), Image.LANCZOS)
    out = out.filter(ImageFilter.UnsharpMask(radius=0.8, percent=60, threshold=2))
    return out, found


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("src", type=Path)
    ap.add_argument("slug", help="имя файла без расширения, латиницей: ivanov")
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT)
    ap.add_argument("--size", type=int, default=240)
    args = ap.parse_args()

    out, found = process(args.src, args.size)
    args.out.mkdir(parents=True, exist_ok=True)
    dst = args.out / f"{args.slug}.jpg"
    out.save(dst, "JPEG", quality=88, optimize=True, progressive=True)
    print(f"{dst}  {dst.stat().st_size} bytes  face={'yes' if found else 'NOT FOUND (по силуэту)'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
