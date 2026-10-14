#!/usr/bin/env python3
"""Горящие билеты из Новосибирска для раздела «Горящие предложения».

Берёт цены Aviasales через официальный API Travelpayouts, оставляет
зарубежные направления до 20 000 ₽ с вылетом в ближайшие недели и
записывает assets/deals.json — сайт читает этот файл сам.

Нужен ключ API: переменная окружения TRAVELPAYOUTS_TOKEN.
Запуск: TRAVELPAYOUTS_TOKEN=... python3 scripts/update_deals.py
"""
import datetime as dt
import json
import os
import sys
import urllib.parse
import urllib.request

ORIGIN = 'OVB'          # Новосибирск
MAX_PRICE = 20000       # ₽, билет в одну сторону
DAYS_AHEAD = 45         # «горящие» — вылет в ближайшие полтора месяца
LIMIT = 6               # сколько строк показывать на сайте
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'deals.json')
CITIES_URL = 'https://api.travelpayouts.com/data/ru/cities.json'
PRICES_URL = 'https://api.travelpayouts.com/aviasales/v3/prices_for_dates'


def get_json(url, params=None):
    if params:
        url += '?' + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={'Accept-Encoding': 'identity', 'User-Agent': 'travel-laboratory-site'})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def load_cities():
    return {c['code']: c for c in get_json(CITIES_URL)}


def fetch_prices(token):
    """Самые дешёвые билеты в одну сторону из Новосибирска по всем направлениям."""
    data = get_json(PRICES_URL, {
        'origin': ORIGIN, 'currency': 'rub', 'one_way': 'true',
        'sorting': 'price', 'limit': 1000, 'token': token,
    })
    if not data.get('success', True):
        raise SystemExit('API ответил ошибкой: %s' % data)
    return data.get('data', [])


def pick_deals(tickets, cities, today):
    best = {}
    for t in tickets:
        dest = t.get('destination')
        city = cities.get(dest)
        price = t.get('price') or t.get('value')
        depart = (t.get('departure_at') or t.get('depart_date') or '')[:10]
        if not (city and price and depart):
            continue
        if city.get('country_code') == 'RU' or price > MAX_PRICE:
            continue
        try:
            day = dt.date.fromisoformat(depart)
        except ValueError:
            continue
        if not (today <= day <= today + dt.timedelta(days=DAYS_AHEAD)):
            continue
        if dest not in best or price < best[dest]['price']:
            best[dest] = {
                'city': city['name'],
                'country': city.get('country_code'),
                'iata': dest,
                'date': depart,
                'price': int(price),
                'transfers': t.get('transfers'),
            }
    return sorted(best.values(), key=lambda d: d['price'])[:LIMIT]


def main():
    token = os.environ.get('TRAVELPAYOUTS_TOKEN')
    if not token:
        sys.exit('Нет TRAVELPAYOUTS_TOKEN — получите ключ в кабинете Travelpayouts.')
    today = dt.date.today()
    deals = pick_deals(fetch_prices(token), load_cities(), today)
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump({'updated': today.isoformat(), 'origin': 'Новосибирск', 'deals': deals}, f, ensure_ascii=False, indent=1)
    print('Найдено %d предложений' % len(deals))
    for d in deals:
        print(' ', d['date'], d['city'], d['price'], '₽')


if __name__ == '__main__':
    main()
