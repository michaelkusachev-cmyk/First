<?php
// Принимает заявку с формы сайта и присылает её в Telegram через бота @TravelLaboratory_bot.
// Токен бота и chat_id получателя лежат ВНЕ public_html — в ../tg-config.php (образец: tg-config.example.php).
// Ответ — JSON {"ok": true|false}; при ошибке сайт сам откроет Telegram, как раньше.

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
date_default_timezone_set('Asia/Novosibirsk');

function reply($ok, $status = 200) {
    http_response_code($status);
    echo json_encode(['ok' => $ok]);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') reply(false, 405);

$cfgFile = __DIR__ . '/../tg-config.php';
if (!is_file($cfgFile)) reply(false, 503);
$cfg = require $cfgFile;
if (empty($cfg['token']) || empty($cfg['chat_id'])) reply(false, 503);

// Ловушка для ботов: это поле скрыто от людей, его заполняют только спам-роботы
if (!empty($_POST['website'])) reply(true);

function field($key, $max) {
    $v = trim((string)($_POST[$key] ?? ''));
    $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v);
    return mb_substr($v, 0, $max);
}
$name = field('name', 100);
$contact = field('contact', 100);
$trip = field('trip', 2000);
if ($name === '' || $contact === '' || ($_POST['agree'] ?? '') !== '1') reply(false, 400);

// Не больше 5 заявок в час с одного адреса
$ip = $_SERVER['REMOTE_ADDR'] ?? '';
$stamp = sys_get_temp_dir() . '/tl-lead-' . md5($ip);
$recent = array_filter(array_map('intval', is_file($stamp) ? file($stamp) : []), function ($t) { return $t > time() - 3600; });
if (count($recent) >= 5) reply(false, 429);
$recent[] = time();
@file_put_contents($stamp, implode("\n", $recent));

$text = "Заявка с сайта travelaboratory.ru\n\n"
      . "Имя: $name\n"
      . "Контакт: $contact\n"
      . ($trip !== '' ? "Поездка: $trip\n" : '')
      . "\n" . date('d.m.Y H:i') . ' (Новосибирск)';

$api = $cfg['api'] ?? 'https://api.telegram.org';
$ctx = stream_context_create(['http' => [
    'method' => 'POST',
    'header' => "Content-Type: application/x-www-form-urlencoded\r\n",
    'content' => http_build_query(['chat_id' => $cfg['chat_id'], 'text' => $text, 'disable_web_page_preview' => 'true']),
    'timeout' => 10,
    'ignore_errors' => true,
]]);
$res = @file_get_contents($api . '/bot' . $cfg['token'] . '/sendMessage', false, $ctx);
$data = $res ? json_decode($res, true) : null;
reply(!empty($data['ok']), !empty($data['ok']) ? 200 : 502);
