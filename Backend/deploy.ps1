# =============================================================================
# Deploy and migrate - Supabase HSE App (run from Backend folder)
# =============================================================================
# Steps: link -> db push -> deploy hse-api -> (optional) create user-photo bucket
# Usage:  .\deploy.ps1
# With bucket: $env:SUPABASE_SERVICE_ROLE_KEY="..."; .\deploy.ps1 -CreateBucket
# =============================================================================

param(
    [switch]$CreateBucket,
    [switch]$SkipLink
)

$ErrorActionPreference = "Stop"
$ProjectRef = "rtxleteymcqmtzrozckh"
$SupabaseUrl = "https://${ProjectRef}.supabase.co"

# Ensure we are in Backend folder (must contain supabase folder)
$BackendDir = $PSScriptRoot
if (-not (Test-Path "$BackendDir\supabase")) {
    Write-Host "Error: Run this script from the Backend folder (must contain supabase)." -ForegroundColor Red
    exit 1
}
Set-Location $BackendDir

# Check Supabase CLI
try {
    $null = supabase --version
} catch {
    Write-Host "Error: Supabase CLI not installed. See: https://supabase.com/docs/guides/cli" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== 1) Link project ===" -ForegroundColor Cyan
Write-Host "Links this folder to the cloud project so db push and deploy target the right project.`n"
if (-not $SkipLink) {
    supabase link --project-ref $ProjectRef
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} else {
    Write-Host "Skipping link (SkipLink)." -ForegroundColor Yellow
}

Write-Host "`n=== 2) Database migration (db push) ===" -ForegroundColor Cyan
Write-Host "Applies migrations to the cloud database (tables, indexes, RLS).`n"
supabase db push
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`n=== 3) Deploy Edge Function (hse-api) ===" -ForegroundColor Cyan
Write-Host "Uploads hse-api to the cloud as the app API.`n"
supabase functions deploy hse-api
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if ($CreateBucket) {
    Write-Host "`n=== 4) Create user-photo bucket ===" -ForegroundColor Cyan
    Write-Host "Creates user-photo bucket in Storage for profile pictures.`n"
    if (-not $env:SUPABASE_URL) { $env:SUPABASE_URL = $SupabaseUrl }
    if (-not $env:SUPABASE_SERVICE_ROLE_KEY) {
        Write-Host "Warning: SUPABASE_SERVICE_ROLE_KEY not set. Skipping bucket creation." -ForegroundColor Yellow
        Write-Host "To create later, set the variable then run:" -ForegroundColor Yellow
        Write-Host '  $env:SUPABASE_SERVICE_ROLE_KEY="<key from Dashboard -> API>"' -ForegroundColor Gray
        Write-Host "  .\deploy.ps1 -CreateBucket" -ForegroundColor Gray
    } else {
        node supabase/scripts/create-user-photos-bucket.mjs
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    }
} else {
    Write-Host "`n--- Optional: create user-photo bucket ---" -ForegroundColor Gray
    Write-Host "To create bucket, set SUPABASE_SERVICE_ROLE_KEY then run:" -ForegroundColor Gray
    Write-Host "  `$env:SUPABASE_SERVICE_ROLE_KEY=`"<key from Dashboard -> API>`"" -ForegroundColor Gray
    Write-Host "  .\deploy.ps1 -CreateBucket`n" -ForegroundColor Gray
}

Write-Host "`n=== Deploy finished successfully ===" -ForegroundColor Green
Write-Host "To set function secrets: supabase secrets set HSE_API_SECRET=... HSE_ANON_KEY=...`n" -ForegroundColor Gray
