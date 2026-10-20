<?php
// Принимает заявку с формы сайта и присылает её в Telegram через бота @TravelLaboratory_bot,
// а если до Telegram не достучаться — письмом на почту.
// Токен бота, chat_id и почта лежат ВНЕ public_html — в ../tg-config.php (образец: tg-config.example.php).
// Ответ — JSON {"ok": true|false}; если не ушло никуда, сайт сам откроет Telegram, как раньше.

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
date_default_timezone_set('Asia/Novosibirsk');

function reply($ok, $status = 200, $error = null) {
    http_response_code($status);
    echo json_encode($error === null ? ['ok' => $ok] : ['ok' => $ok, 'error' => $error], JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') reply(false, 405);

$cfgFile = __DIR__ . '/../tg-config.php';
$cfg = is_file($cfgFile) ? (require $cfgFile) : [];

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

// 1. Telegram
$errors = [];
if (!empty($cfg['token']) && !empty($cfg['chat_id'])) {
    $api = $cfg['api'] ?? 'https://api.telegram.org';
    $url = $api . '/bot' . $cfg['token'] . '/sendMessage';
    $post = http_build_query(['chat_id' => $cfg['chat_id'], 'text' => $text, 'disable_web_page_preview' => 'true']);
    $res = false; $err = '';
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $post, CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 4, CURLOPT_TIMEOUT => 8]);
        $res = curl_exec($ch);
        if ($res === false) $err = 'curl: ' . curl_error($ch);
        curl_close($ch);
    } else {
        $ctx = stream_context_create(['http' => ['method' => 'POST', 'timeout' => 8, 'ignore_errors' => true,
            'header' => "Content-Type: application/x-www-form-urlencoded\r\n", 'content' => $post]]);
        $res = @file_get_contents($url, false, $ctx);
        if ($res === false) $err = 'fopen: ' . (error_get_last()['message'] ?? 'no connection');
    }
    $data = $res ? json_decode($res, true) : null;
    if (!empty($data['ok'])) reply(true);
    // Текст ошибки без токена — чтобы было видно, что не так с настройкой или связью
    $errors[] = 'telegram: ' . ($res === false ? str_replace($cfg['token'], '***', $err) : ($data['description'] ?? 'bad response'));
} else {
    $errors[] = 'telegram: not configured';
}

// 2. Запасной путь — письмо
$to = $cfg['email'] ?? 'travel.laboratory@mail.ru';
$subject = '=?UTF-8?B?' . base64_encode('Заявка с сайта: ' . $name) . '?=';
$headers = "From: Travel.laboratory <noreply@travelaboratory.ru>\r\n"
         . "MIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit";
$from = $cfg['from'] ?? 'noreply@travelaboratory.ru';   // ящик должен существовать в «Хостинг → Почта», иначе Mail.ru отбросит письмо
$headers = str_replace('noreply@travelaboratory.ru', $from, $headers);
if (function_exists('mail') && @mail($to, $subject, $text, $headers, '-f' . $from)) reply(true, 200, implode('; ', $errors) . '; sent by email');
$errors[] = 'email: not sent';
reply(false, 502, implode('; ', $errors));
