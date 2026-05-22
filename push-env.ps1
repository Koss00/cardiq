$envFile = Join-Path $PSScriptRoot ".env.local"
$keys = @("ANTHROPIC_API_KEY", "EBAY_APP_ID", "EBAY_CERT_ID", "BALLDONTLIE_API_KEY")

$envVars = @{}
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^([A-Z_]+)=(.+)$') {
        $envVars[$Matches[1]] = $Matches[2].Trim('"')
    }
}

foreach ($key in $keys) {
    $val = $envVars[$key]
    if ([string]::IsNullOrWhiteSpace($val)) {
        Write-Host "SKIP $key - not found" -ForegroundColor Yellow
        continue
    }
    Write-Host "Adding $key..." -ForegroundColor Cyan
    $val | vercel env add $key production --yes 2>&1 | Out-Null
    $val | vercel env add $key development --yes 2>&1 | Out-Null
    Write-Host "Done: $key" -ForegroundColor Green
}

Write-Host "All keys pushed." -ForegroundColor White
