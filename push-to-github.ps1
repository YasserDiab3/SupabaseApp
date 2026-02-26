# رفع المشروع إلى GitHub مباشرة
# الطريقة 1: ضع رابط المستودع في GITHUB_REPO_URL.txt ثم شغّل: .\push-to-github.ps1
# الطريقة 2: شغّل: .\push-to-github.ps1 -Username اسمك -RepoName SupabaseApp

param(
    [string]$Username,
    [string]$RepoName = "SupabaseApp",
    [string]$Url
)

Set-Location $PSScriptRoot

$repoUrl = $null
if ($Url -match '^https?://github\.com/[^/]+/[^/]+') {
    $repoUrl = $Url.TrimEnd('/').TrimEnd('.git') + '.git'
}
if (-not $repoUrl -and (Test-Path "GITHUB_REPO_URL.txt")) {
    $content = Get-Content "GITHUB_REPO_URL.txt" -Raw
    $urlLine = ($content -split "`n")[0].Trim()
    if ($urlLine -match '^https?://github\.com/[^/]+/[^/]+') {
        $repoUrl = $urlLine.TrimEnd('/').TrimEnd('.git') + '.git'
    }
}
if (-not $repoUrl -and $Username) {
    $repoUrl = "https://github.com/$Username/$RepoName.git"
}

if (-not $repoUrl) {
    Write-Host "ضع رابط المستودع في GITHUB_REPO_URL.txt أو شغّل: .\push-to-github.ps1 -Username YOUR_USER -RepoName REPO_NAME" -ForegroundColor Red
    exit 1
}

if (git remote get-url origin 2>$null) { git remote remove origin }
git remote add origin $repoUrl
Write-Host "تم الربط بـ: $repoUrl" -ForegroundColor Green
Write-Host "جاري الرفع..." -ForegroundColor Yellow
git push -u origin main
if ($LASTEXITCODE -eq 0) { Write-Host "تم الرفع بنجاح." -ForegroundColor Green }
