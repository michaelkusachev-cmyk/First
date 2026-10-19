#!/bin/sh
# Забирает свежие файлы сайта из GitHub на хостинг SpaceWeb.
# Запускается по крону на хостинге (Панель → Планировщик заданий), например каждый день в 07:30.
# Видео не трогает: они меняются редко и заливаются вручную.
B=https://raw.githubusercontent.com/michaelkusachev-cmyk/First/claude/clever-mayer-jmzc87
D=/home/h/hockeydrea/travelaborator_ru
for f in index.html privacy.html 404.html assets/styles.css assets/app.js assets/deals.json; do
  curl -fsS "$B/$f" -o "$D/$f.new" && [ -s "$D/$f.new" ] && mv "$D/$f.new" "$D/$f"
  rm -f "$D/$f.new"
done
