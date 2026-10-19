#!/bin/sh
# Забирает свежие файлы сайта из GitHub на хостинг SpaceWeb.
# Запускается по крону на хостинге (Панель → Crontab), раз в сутки.
# Видео качает только новые — те, на которые ссылается страница, а на хостинге их ещё нет.
# Поэтому заменённое видео кладётся в репозиторий под новым именем (например, asia-v2.mp4).
B=https://raw.githubusercontent.com/michaelkusachev-cmyk/First/claude/clever-mayer-jmzc87
D=/home/h/hockeydrea/travelaborator_ru/public_html

get() {
  curl -fsS "$B/$1" -o "$D/$1.new" && [ -s "$D/$1.new" ] && mv "$D/$1.new" "$D/$1"
  rm -f "$D/$1.new"
}

# Сначала видео — чтобы новая страница не ссылалась на файлы, которых ещё нет
mkdir -p "$D/assets/video"
V=$(curl -fsS "$B/index.html" | grep -o 'assets/video/[A-Za-z0-9_-]*\.\(mp4\|jpg\)' | sort -u) || exit 1
for f in $V; do
  case "$f" in *.mp4) set -- "$f" "${f%.mp4}.webm" ;; *) set -- "$f" ;; esac
  for v; do
    [ -s "$D/$v" ] || get "$v"
    # Свежезалитый файл GitHub иногда отдаёт не сразу — тогда страницу не трогаем до следующего запуска
    [ -s "$D/$v" ] || exit 1
  done
done

for f in index.html privacy.html 404.html assets/styles.css assets/app.js assets/deals.json assets/favicon.svg assets/og.png; do
  get "$f"
done
