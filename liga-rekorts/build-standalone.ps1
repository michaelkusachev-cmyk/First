# Собирает автономные HTML (стили, скрипты и ракетка вшиты в каждую страницу) в папку Лига_РеКортс_HTML\
# и архивы Лига_РеКортс_HTML.zip (автономные страницы) и Лига_РеКортс_сайт.zip (обычный сайт для хостинга).
# Запуск после любых правок сайта:  powershell -ExecutionPolicy Bypass -File build-standalone.ps1
# Файл сохранён в UTF-8 с BOM (иначе Windows PowerShell 5.1 ломает кириллицу).
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$out  = Join-Path $root 'Лига_РеКортс_HTML'
$enc  = New-Object System.Text.UTF8Encoding($false)
function Read-Text($p) { [IO.File]::ReadAllText($p, [Text.Encoding]::UTF8).Replace("`r`n", "`n").TrimEnd() }

New-Item -ItemType Directory -Force $out | Out-Null
$racket = 'data:image/png;base64,' + [Convert]::ToBase64String([IO.File]::ReadAllBytes("$root\img\racket.png"))
$pages = Get-ChildItem $root -Filter *.html
foreach ($f in $pages) {
  $t = Read-Text $f.FullName
  # <link rel="stylesheet" href="assets/x.css">  →  <style>…</style>
  $t = [regex]::Replace($t, '<link rel="stylesheet" href="assets/([\w\-]+\.css)">', {
    param($m) "<style>`n" + (Read-Text "$root\assets\$($m.Groups[1].Value)") + "`n</style>" })
  # <script src="assets/x.js"></script>  →  <script>…</script>
  $t = [regex]::Replace($t, '<script src="assets/([\w\-]+\.js)"></script>', {
    param($m) "<script>`n" + (Read-Text "$root\assets\$($m.Groups[1].Value)") + "`n</script>" })
  $t = $t.Replace('src="img/racket.png"', "src=""$racket""")
  if ($t -match 'assets/[\w\-]+\.(css|js)"') { throw "$($f.Name): остались внешние ссылки на assets" }
  [IO.File]::WriteAllText((Join-Path $out $f.Name), $t + "`n", $enc)
  $f.Name
}
# архивы
$site = Join-Path ([IO.Path]::GetTempPath()) ('rekorts-site-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Force "$site\assets", "$site\img" | Out-Null
$pages | Copy-Item -Destination $site
Copy-Item "$root\assets\*" "$site\assets\"
Copy-Item "$root\img\racket.png", "$root\img\poster.jpg" "$site\img\"
Compress-Archive -Path "$site\*" -DestinationPath "$root\Лига_РеКортс_сайт.zip" -Force
Compress-Archive -Path "$out\*" -DestinationPath "$root\Лига_РеКортс_HTML.zip" -Force
Remove-Item $site -Recurse -Force
'Готово: Лига_РеКортс_HTML\, Лига_РеКортс_HTML.zip, Лига_РеКортс_сайт.zip'
