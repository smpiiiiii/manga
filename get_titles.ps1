Get-ChildItem *.html | Where-Object { $_.Name -ne 'gallery.html' -and $_.Name -ne 'index.html' } | ForEach-Object {
    $content = Get-Content $_.FullName -Raw -Encoding UTF8
    if ($content -match '<title>(.*?)</title>') {
        Write-Output ('{0}: {1}' -f $_.Name, $matches[1])
    }
}
