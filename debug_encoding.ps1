# エンコーディングを確認して修正
$file = "yuuto_ep1.html"
$bytes = [System.IO.File]::ReadAllBytes($file)
Write-Host "First 3 bytes: $($bytes[0]),$($bytes[1]),$($bytes[2])"
Write-Host "File size: $($bytes.Length)"

# BOM付きかどうか確認
if ($bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
    Write-Host "UTF-8 BOM detected"
}

# 'bottom:35%' のバイト列を検索
$searchBytes = [System.Text.Encoding]::UTF8.GetBytes('bottom:35%')
Write-Host "Search bytes: $($searchBytes -join ',')"

$text = [System.Text.Encoding]::UTF8.GetString($bytes)
$idx = $text.IndexOf('bottom:35')
Write-Host "Index of 'bottom:35': $idx"

if ($idx -ge 0) {
    # 周辺の文字とそのバイトを確認
    $snippet = $text.Substring($idx, 15)
    $snippetBytes = [System.Text.Encoding]::UTF8.GetBytes($snippet)
    Write-Host "Snippet: [$snippet]"
    Write-Host "Snippet bytes: $($snippetBytes -join ',')"
    
    # 13文字目（%の位置）を確認
    $charAtPercent = $text[$idx + 9]
    Write-Host "Char at percent position: [$charAtPercent] code=$([int]$charAtPercent)"
}
