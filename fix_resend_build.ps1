$path = "app/api/send-locatario-invitation/route.ts"

if (!(Test-Path $path)) {
  Write-Error "No se encontró $path. Ejecuta este script desde la raíz del proyecto pumay-control-app."
  exit 1
}

$content = Get-Content -Raw -Path $path

# 1) Reemplazar instanciación peligrosa en nivel módulo.
$patterns = @(
  'const resend = new Resend\(process\.env\.RESEND_API_KEY\);',
  'const resend = new Resend\(process\.env\.RESEND_API_KEY \|\| ""\);',
  'const resend = new Resend\(process\.env\.RESEND_API_KEY ?? ""\);'
)

$found = $false

foreach ($pattern in $patterns) {
  if ($content -match $pattern) {
    $found = $true
    $content = [regex]::Replace($content, $pattern, @'
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("Falta RESEND_API_KEY en las variables de entorno.");
  }

  return new Resend(apiKey);
}
'@, 1)
    break
  }
}

if (!$found -and $content -notmatch "function getResendClient\(\)") {
  Write-Host "No encontré una instancia directa de Resend. Insertaré getResendClient después del import de Resend." -ForegroundColor Yellow

  if ($content -match 'import\s+\{\s*Resend\s*\}\s+from\s+["'']resend["''];') {
    $content = [regex]::Replace($content, '(import\s+\{\s*Resend\s*\}\s+from\s+["'']resend["''];)', @'
$1

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("Falta RESEND_API_KEY en las variables de entorno.");
  }

  return new Resend(apiKey);
}
'@, 1)
  } else {
    Write-Error "No encontré import de Resend. Revisa manualmente app/api/send-locatario-invitation/route.ts."
    exit 1
  }
}

# 2) Si el POST usa resend.emails.send, asegurar que cree cliente dentro del POST.
if ($content -match 'resend\.emails\.send' -and $content -notmatch 'const resend = getResendClient\(\);') {
  $content = [regex]::Replace(
    $content,
    '(export\s+async\s+function\s+POST\s*\([^)]*\)\s*\{\s*try\s*\{)',
    "`$1`r`n    const resend = getResendClient();",
    1
  )
}

# 3) Evitar ruptura si ya existía getResendClient pero aún no se usa.
if ($content -match 'function getResendClient\(\)' -and $content -match 'resend\.emails\.send' -and $content -notmatch 'const resend = getResendClient\(\);') {
  $content = [regex]::Replace(
    $content,
    '(export\s+async\s+function\s+POST\s*\([^)]*\)\s*\{\s*try\s*\{)',
    "`$1`r`n    const resend = getResendClient();",
    1
  )
}

Set-Content -Path $path -Value $content -Encoding UTF8

Write-Host "Fix Resend aplicado correctamente en $path" -ForegroundColor Green
Write-Host ""
Write-Host "Ahora ejecuta:" -ForegroundColor Cyan
Write-Host "npm run build" -ForegroundColor Cyan
