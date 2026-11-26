"""Новая сборка сайта sibhl.ru/padel из текущей — одной командой.

Берёт сборку, на которую ссылается padel-sibhl/index.html, применяет правки,
сохраняет под новым именем (index-R<ДДmesГГ><буква>.js — JS кэшируется
браузерами на год, поэтому имя всегда новое), переключает index.html и
дописывает строку в журнал padel-sibhl/README.md.

Каждый OLD должен встречаться в сборке ровно один раз — иначе ничего не пишется.

Примеры:
  # заменить текст
  python tools/padel-build/new_build.py --log "Главная: новый подзаголовок" \
      --replace "старый текст" "новый текст"

  # добавить фото игрока в словарь PHO (файл img/<slug>.jpg уже лежит)
  python tools/padel-build/new_build.py --log "Фото игрока: Иван Иванов" \
      --pho "Иван Иванов" ivanov

  # много правок из JSON: [["old","new"], ...]
  python tools/padel-build/new_build.py --log "..." --replace-file edits.json

  # только показать, что изменится
  python tools/padel-build/new_build.py ... --dry-run
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import string
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SITE = ROOT / "padel-sibhl"
ASSETS = SITE / "assets"
INDEX = SITE / "index.html"
README = SITE / "README.md"
MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
NSK = dt.timezone(dt.timedelta(hours=7))  # Новосибирск


def read(p: Path) -> str:
    return p.read_bytes().decode("utf-8")


def write(p: Path, s: str) -> None:
    p.write_bytes(s.encode("utf-8"))  # как есть, без CRLF и BOM


def current_build() -> str:
    m = re.search(r"/padel/assets/(index-R[^\"']+\.js)", read(INDEX))
    if not m:
        sys.exit("не нашёл ссылку на index-R*.js в index.html")
    return m.group(1)


def next_name() -> str:
    d = dt.datetime.now(NSK)
    base = f"index-R{d.day:02d}{MONTHS[d.month - 1]}{d.year % 100:02d}"
    for suffix in [""] + list(string.ascii_lowercase[1:]):
        name = f"{base}{suffix}.js"
        if not (ASSETS / name).exists():
            return name
    sys.exit("закончились буквы для сегодняшней даты")


def pho_edit(js: str, name: str, slug: str) -> tuple[str, str]:
    m = re.search(r"PHO=\{[^}]*\}", js)
    if not m:
        sys.exit("не нашёл словарь PHO в сборке")
    old = m.group(0)
    if f'"{name}":' in old:
        # заменить путь у уже существующего игрока
        new = re.sub(rf'"{re.escape(name)}":`[^`]*`', f'"{name}":`/padel/img/{slug}.jpg`', old)
    else:
        new = old[:-1] + f',"{name}":`/padel/img/{slug}.jpg`' + "}"
    return old, new


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--log", required=True, help="текст строки журнала (без даты и имени сборки)")
    ap.add_argument("--replace", nargs=2, action="append", default=[], metavar=("OLD", "NEW"))
    ap.add_argument("--replace-file", type=Path, help='JSON: [["old","new"], ...]')
    ap.add_argument("--pho", nargs=2, action="append", default=[], metavar=("ИМЯ", "SLUG"),
                    help="добавить/обновить фото игрока: --pho 'Иван Иванов' ivanov")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()

    cur = current_build()
    js = read(ASSETS / cur)
    edits: list[tuple[str, str]] = [tuple(x) for x in a.replace]  # type: ignore[misc]
    if a.replace_file:
        edits += [tuple(x) for x in json.loads(a.replace_file.read_text(encoding="utf-8"))]  # type: ignore[misc]

    for name, slug in a.pho:
        if not (SITE / "img" / f"{slug}.jpg").exists():
            sys.exit(f"нет файла padel-sibhl/img/{slug}.jpg")
        if f"`{name}`" not in js:
            sys.exit(f"игрок «{name}» не найден в составах — проверь написание")
        old, new = pho_edit(js, name, slug)
        js = js.replace(old, new)

    for old, new in edits:
        n = js.count(old)
        if n != 1:
            sys.exit(f"ожидалось 1 вхождение, найдено {n}: {old[:80]!r}")
        js = js.replace(old, new)

    if js == read(ASSETS / cur):
        sys.exit("правок нет — сборка не изменилась")

    new_name = next_name()
    today = dt.datetime.now(NSK).strftime("%d.%m.%Y")
    line = f"- {today} — {a.log}. Сборка `assets/{new_name}`."
    print(f"{cur} -> {new_name}\n{line}")
    if a.dry_run:
        return 0

    write(ASSETS / new_name, js)
    write(INDEX, read(INDEX).replace(cur, new_name))
    md = read(README)
    marker = "\n\n## Фото игроков"
    md = md.replace(marker, f"\n{line}{marker}", 1) if marker in md else md.rstrip("\n") + f"\n{line}\n"
    write(README, md)
    return 0


if __name__ == "__main__":
    sys.exit(main())
