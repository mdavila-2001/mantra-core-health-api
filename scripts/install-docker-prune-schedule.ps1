# =========================================================================
# Mantra Core Technologies - ALOVIDA Health Ecosystem
# Instala una tarea programada de Windows que corre scripts/docker-prune.sh
# todos los dias, sin depender de que alguien recuerde usar `yarn docker:up`
# o `yarn docker:api:refresh`. Es el respaldo para cuando alguien levanta el
# stack con `docker compose up`/`build` a secas.
#
# Idempotente: si la tarea ya existe, la reemplaza en vez de duplicarla.
# Correrlo de nuevo (por ejemplo tras mover el repo de carpeta) es seguro.
#
# Uso (una sola vez por maquina Windows):
#   powershell -File scripts\install-docker-prune-schedule.ps1
#
# Para Linux/macOS ver scripts/install-docker-prune-schedule.sh (cron).
# =========================================================================

$ErrorActionPreference = "Stop"

$taskName = "ALOVIDA-mantra-redesa-docker-prune"
$repoRoot = Split-Path -Parent $PSScriptRoot
$scriptPath = Join-Path $repoRoot "scripts\docker-prune.sh"

$bashCandidates = @(
  "C:\Program Files\Git\bin\bash.exe",
  "C:\Program Files\Git\usr\bin\bash.exe"
)
$bashExe = $bashCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $bashExe) {
  throw "No se encontro bash.exe de Git for Windows. Instalalo (incluye Docker Desktop) o ajusta este script."
}

if (-not (Test-Path $scriptPath)) {
  throw "No se encontro $scriptPath"
}

Write-Host "Instalando tarea programada '$taskName'..."
Write-Host "  Script: $scriptPath"
Write-Host "  Bash:   $bashExe"

$action = New-ScheduledTaskAction -Execute $bashExe -Argument "`"$scriptPath`"" -WorkingDirectory $repoRoot
$trigger = New-ScheduledTaskTrigger -Daily -At 9am
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 10)

Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings `
  -Description "Purga diaria de cache de build de Docker vieja para mantra-core-health-api (scripts/docker-prune.sh). No-op si no hay nada que purgar." `
  | Out-Null

Write-Host "Listo. La tarea corre todos los dias a las 9am, incluso si nadie usa 'yarn docker:up'."
Write-Host "Para desinstalarla: Unregister-ScheduledTask -TaskName '$taskName'"
Write-Host "Para correrla ahora mismo: Start-ScheduledTask -TaskName '$taskName'"
