#!/usr/bin/env python3
"""Выбирает горящие билеты для сайта из карточек aviasales.ru/hottickets/ovb.

Правила: 2 билета за рубеж и 1 по России, каждый до 20 000 ₽, вылет не раньше
сегодняшнего дня. Порядок — как на странице Aviasales (сверху самые «горячие»).
Чтобы направления чередовались, страны (а для России — города), которые были
на сайте в последние дни, по возможности пропускаются.

Пишет assets/deals.json и обновляет запасные строки в index.html между
метками <!-- deals:start --> и <!-- deals:end -->.

Запуск: python3 scripts/pick_hot.py /tmp/hot.json
"""
import datetime as dt
import json
import os
import re
import sys
import urllib.parse
import urllib.request

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
DEALS = os.path.join(ROOT, 'assets', 'deals.json')
INDEX = os.path.join(ROOT, 'index.html')
AIRPORTS_URL = 'https://api.travelpayouts.com/data/ru/airports.json'
MAX_PRICE = 20000
ABROAD, RUSSIA = 2, 1
HISTORY_DAYS = 2          # сколько прошлых дней учитывать для чередования
MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля',
          'августа', 'сентября', 'октября', 'ноября', 'декабря']
TG = 'https://t.me/TraveLaboratory'


def countries():
    with urllib.request.urlopen(AIRPORTS_URL, timeout=60) as r:
        return {a['code']: a.get('country_code') for a in json.load(r)}


def money(n):
    return '{:,}'.format(n).replace(',', ' ') + ' ₽'


def human(iso):
    d = dt.date.fromisoformat(iso)
    return '%d %s' % (d.day, MONTHS[d.month - 1])


def choose(cards, history, today):
    recent = set()
    for day in history[-HISTORY_DAYS:]:
        recent.update(day.get('keys', []))
    ok = [c for c in cards if c['price'] <= MAX_PRICE and dt.date.fromisoformat(c['date']) >= today]

    def key(c):  # за рубежом чередуем страны, по России — города
        return c['country'] if c['country'] != 'RU' else 'RU:' + c['city']

    def take(pool, n):
        picked, used = [], set()
        for strict in (True, False):  # сначала без недавних, потом — что есть
            for c in pool:
                k = key(c)
                if len(picked) == n:
                    break
                if c in picked or k in used or (strict and k in recent):
                    continue
                picked.append(c)
                used.add(k)
        return picked

    abroad = take([c for c in ok if c['country'] and c['country'] != 'RU'], ABROAD)
    russia = take([c for c in ok if c['country'] == 'RU'], RUSSIA)
    return abroad + russia, [key(c) for c in abroad + russia]


def static_rows(deals):
    rows = []
    for i, d in enumerate(deals):
        route = 'Новосибирск → ' + d['city']
        msg = 'Здравствуйте! Хочу забронировать горящий билет %s, %s, %s.' % (route, human(d['date']), money(d['price']))
        note = 'Вылет ' + human(d['date']) + (' · ' + d['airline'] if d.get('airline') else '') + (' · прямой рейс' if d.get('transfers') == 0 else '')
        old = '<s>%s</s> ' % money(d['old_price']) if (d.get('old_price') or 0) > d['price'] else ''
        rows.append(
            '<div class="deal-row" data-date="%s"><span class="type">Горящий билет</span><span class="t">%s</span>'
            '<span class="note">%s</span><span class="pr">%s%s</span>'
            '<a class="btn%s" href="%s?text=%s" target="_blank" rel="noopener">Забронировать</a></div>'
            % (d['date'], route, note, old, money(d['price']), ' solid' if i == 0 else '', TG, urllib.parse.quote(msg)))
    return '\n'.join(rows)


def main():
    cards = json.load(open(sys.argv[1], encoding='utf-8'))
    today = dt.date.today()
    cc = countries()
    for c in cards:
        c['country'] = cc.get(c['iata'])
    prev = json.load(open(DEALS, encoding='utf-8')) if os.path.exists(DEALS) else {}
    history = [h for h in prev.get('history', []) if h.get('date') != today.isoformat()]
    picked, keys = choose(cards, history, today)
    if not picked:
        sys.exit('Подходящих билетов не нашлось — сайт не трогаю.')
    history.append({'date': today.isoformat(), 'keys': keys})
    deals = [{k: c.get(k) for k in ('city', 'country', 'iata', 'date', 'price', 'old_price', 'airline', 'transfers')} for c in picked]
    with open(DEALS, 'w', encoding='utf-8') as f:
        json.dump({'updated': today.isoformat(), 'origin': 'Новосибирск', 'source': 'aviasales.ru/hottickets/ovb',
                   'deals': deals, 'history': history[-7:]}, f, ensure_ascii=False, indent=1)
    html = open(INDEX, encoding='utf-8').read()
    html, n = re.subn(r'(<!-- deals:start -->\n).*?(\n<!-- deals:end -->)', lambda m: m.group(1) + static_rows(deals) + m.group(2), html, flags=re.S)
    if n != 1:
        sys.exit('В index.html нет меток deals:start / deals:end')
    open(INDEX, 'w', encoding='utf-8').write(html)
    for d in deals:
        print(d['date'], d['city'], d['country'], money(d['price']))


if __name__ == '__main__':
    main()
