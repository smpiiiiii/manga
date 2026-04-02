# bottom:35%修正スクリプト - バイトレベルで置換
$files = Get-ChildItem -Path "." -Filter "yuuto_ep*.html"
foreach ($file in $files) {
    $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
    $text = [System.Text.Encoding]::UTF8.GetString($bytes)
    $count = 0
    while ($text.Contains('bottom:35%')) {
        $text = $text.Replace('bottom:35%', 'bottom:4px')
        $count++
    }
    if ($count -gt 0) {
        [System.IO.File]::WriteAllBytes($file.FullName, [System.Text.Encoding]::UTF8.GetBytes($text))
        Write-Host "Fixed $count occurrences in $($file.Name)"
    } else {
        Write-Host "No changes needed in $($file.Name)"
    }
}
Write-Host "Done!"
