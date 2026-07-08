$envFile = Join-Path $PSScriptRoot ".env.local"
# Everything the app needs at runtime on Vercel. Local-only vars
# (FLEET_DIR, VERCEL_OIDC_TOKEN, NEON_* tooling) are intentionally excluded.
$keys = @(
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    "CLERK_SECRET_KEY",
    "ANTHROPIC_API_KEY",
    "EBAY_APP_ID",
    "EBAY_CERT_ID",
    "BALLDONTLIE_API_KEY",
    "BLOB_READ_WRITE_TOKEN",
    "DATABASE_URL",
    "DATABASE_URL_UNPOOLED",
    "POSTGRES_URL",
    "POSTGRES_PRISMA_URL",
    "POSTGRES_URL_NON_POOLING",
    "PRICE_REFRESH_SECRET"
)
$environments = @("production", "preview", "development")

$envVars = @{}
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^([A-Z_]+)=(.+)$') {
        $envVars[$Matches[1]] = $Matches[2].Trim('"')
    }
}

$failures = 0
foreach ($key in $keys) {
    $val = $envVars[$key]
    if ([string]::IsNullOrWhiteSpace($val)) {
        Write-Host "SKIP $key - not found in .env.local" -ForegroundColor Yellow
        continue
    }
    foreach ($environment in $environments) {
        # --value avoids the interactive branch prompt that silently killed
        # stdin-piped adds; --force updates vars that already exist.
        $out = vercel env add $key $environment --value $val --yes --force 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "ok    $key ($environment)" -ForegroundColor Green
        } else {
            $failures++
            Write-Host "FAIL  $key ($environment)" -ForegroundColor Red
            # Last line of CLI output is the reason; values are never echoed.
            $out | Select-Object -Last 1 | Write-Host -ForegroundColor DarkYellow
        }
    }
}

if ($failures -eq 0) {
    Write-Host "All keys pushed to production + preview + development." -ForegroundColor White
} else {
    Write-Host "$failures push(es) FAILED - see above." -ForegroundColor Red
}
