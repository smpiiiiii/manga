# ユウトエピソードのフォントサイズ一括修正スクリプト
$files = Get-ChildItem -Path "." -Filter "yuuto_ep*.html"
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    # CSSベースの吹き出しサイズアップ
    $content = $content -replace 'font-size: 8\.5px', 'font-size: 10px'
    $content = $content -replace 'font-size: 7\.5px', 'font-size: 9px'
    # インラインの吹き出しサイズアップ
    $content = $content -replace 'font-size:7\.5px', 'font-size:9px'
    $content = $content -replace 'font-size:7px', 'font-size:8.5px'
    # 顔にかぶるbottom:35%の吹き出しを端に移動
    $content = $content -replace 'bottom:35%', 'bottom:4px'
    # レスポンシブのサイズもアップ
    $content = $content -replace '\.b \{ font-size: 7\.5px', '.b { font-size: 9px'
    [System.IO.File]::WriteAllText($file.FullName, $content)
    Write-Host "Updated: $($file.Name)"
}
Write-Host "Done!"
