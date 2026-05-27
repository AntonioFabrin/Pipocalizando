$ErrorActionPreference = 'Stop'

$port = 3333
if ($env:PORT) {
  $port = [int]$env:PORT
}

$processIds = netstat -ano -p tcp |
  Select-String ":$port\s+.*LISTENING\s+(\d+)" |
  ForEach-Object { $_.Matches[0].Groups[1].Value } |
  Select-Object -Unique

foreach ($processId in $processIds) {
  if (-not $processId -or $processId -eq $PID) {
    continue
  }

  Write-Host "Liberando porta ${port}: encerrando processo ${processId}."
  Stop-Process -Id $processId -Force -ErrorAction Stop
}
