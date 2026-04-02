# bottom:35%を修正するスクリプト
$files = Get-ChildItem -Path "." -Filter "yuuto_ep*.html"
foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName)
    $before = $content.Length
    $content = $content.Replace('bottom:35%', 'bottom:4px')
    $after = $content.Length
    if ($before -ne $after) {
        [System.IO.File]::WriteAllText($file.FullName, $content)
        Write-Host "Fixed bottom:35% in $($file.Name) (changed $($before - $after) chars)"
    } else {
        # 実際に含まれているか確認
        $idx = $content.IndexOf('bottom:35')
        if ($idx -ge 0) {
            $snippet = $content.Substring([Math]::Max(0,$idx-5), 20)
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($snippet)
            Write-Host "Found at $idx in $($file.Name): [$snippet] bytes: $($bytes -join ',')"
        } else {
            Write-Host "No bottom:35% in $($file.Name)"
        }
    }
}
