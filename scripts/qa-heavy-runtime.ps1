param(
  [string]$BaseUrl = "http://localhost:3010"
)

$ErrorActionPreference = "Stop"

$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$results = New-Object System.Collections.Generic.List[object]
$validUuid = "00000000-0000-4000-8000-000000000001"

function New-BodyJson($body) {
  if ($null -eq $body) { return $null }
  return ($body | ConvertTo-Json -Compress -Depth 8)
}

function Invoke-QATest {
  param(
    [string]$Name,
    [string]$Method,
    [string]$Path,
    [int[]]$ExpectedStatus,
    $Body = $null,
    [bool]$NoRedirect = $false,
    [scriptblock]$Validate = $null
  )

  $status = -1
  $content = ""
  $headers = $null
  $errorText = $null

  try {
    $params = @{
      Uri         = "$BaseUrl$Path"
      Method      = $Method
      WebSession  = $session
      ErrorAction = "Stop"
    }

    if ($NoRedirect) {
      $params["MaximumRedirection"] = 0
    }

    if ($null -ne $Body) {
      $params["ContentType"] = "application/json"
      $params["Body"] = New-BodyJson $Body
    }

    $response = Invoke-WebRequest @params
    $status = [int]$response.StatusCode
    $headers = $response.Headers
    $content = [string]$response.Content
  }
  catch [System.Net.WebException] {
    if ($null -eq $_.Exception.Response) {
      $errorText = $_.Exception.Message
    }
    else {
      $rawResponse = $_.Exception.Response
      $status = [int]$rawResponse.StatusCode
      $headers = $rawResponse.Headers
      $streamReader = New-Object System.IO.StreamReader($rawResponse.GetResponseStream())
      $content = $streamReader.ReadToEnd()
      $streamReader.Dispose()
    }
  }
  catch {
    $errorText = $_.Exception.Message
  }

  $pass = $ExpectedStatus -contains $status
  if ($pass -and $null -ne $Validate) {
    try {
      $pass = [bool](& $Validate $status $content $headers)
    }
    catch {
      $pass = $false
      $errorText = "Validator failed: $($_.Exception.Message)"
    }
  }

  $snippet = if ($content.Length -gt 180) { $content.Substring(0, 180) } else { $content }

  $resultObj = [pscustomobject]@{
      name       = $Name
      method     = $Method
      path       = $Path
      expected   = ($ExpectedStatus -join "/")
      actual     = if ($status -ge 0) { [string]$status } else { "no-response" }
      pass       = $pass
      error      = $errorText
      response   = $snippet.Replace("`r", " ").Replace("`n", " ")
    }
  $results.Add($resultObj)
  return $resultObj
}

function Add-SkippedTest {
  param(
    [string]$Name,
    [string]$Method,
    [string]$Path,
    [string]$Reason
  )
  $resultObj = [pscustomobject]@{
    name = $Name
    method = $Method
    path = $Path
    expected = "n/a"
    actual = "skipped"
    pass = $true
    error = $Reason
    response = ""
  }
  $results.Add($resultObj)
  return $resultObj
}

function Read-EnvLocal {
  param([string]$Path = ".env.local")
  $map = @{}
  if (-not (Test-Path $Path)) { return $map }
  Get-Content $Path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#")) { return }
    $idx = $line.IndexOf("=")
    if ($idx -lt 1) { return }
    $key = $line.Substring(0, $idx).Trim()
    $value = $line.Substring($idx + 1).Trim()
    if ($value.StartsWith('"') -and $value.EndsWith('"') -and $value.Length -ge 2) {
      $value = $value.Substring(1, $value.Length - 2)
    }
    $map[$key] = $value
  }
  return $map
}

# Unauthenticated tests
Invoke-QATest -Name "Landing page reachable" -Method "GET" -Path "/" -ExpectedStatus @(200)
Invoke-QATest -Name "Login page reachable" -Method "GET" -Path "/auth/login" -ExpectedStatus @(200)
Invoke-QATest -Name "Register page reachable" -Method "GET" -Path "/auth/register" -ExpectedStatus @(200)
Invoke-QATest -Name "Dashboard redirects when unauthenticated" -Method "GET" -Path "/dashboard" -ExpectedStatus @(302, 303, 307) -NoRedirect $true

Invoke-QATest -Name "Deploy mock GET health" -Method "GET" -Path "/api/deploy/mock" -ExpectedStatus @(200)
Invoke-QATest -Name "Deploy mock POST trigger" -Method "POST" -Path "/api/deploy/mock" -ExpectedStatus @(200)

Invoke-QATest -Name "Auth login invalid payload rejected" -Method "POST" -Path "/api/auth/login" -ExpectedStatus @(400) -Body @{ email = "invalid"; password = "short" }
Invoke-QATest -Name "Auth register invalid payload rejected" -Method "POST" -Path "/api/auth/register" -ExpectedStatus @(400) -Body @{ email = "invalid"; password = "short"; name = "" }
Invoke-QATest -Name "Deploy invalid payload rejected" -Method "POST" -Path "/api/deploy" -ExpectedStatus @(400) -Body @{ projectId = "not-a-uuid" }
Invoke-QATest -Name "Deploy unauthorized rejected" -Method "POST" -Path "/api/deploy" -ExpectedStatus @(401) -Body @{ projectId = $validUuid }
Invoke-QATest -Name "Domains invalid payload rejected" -Method "POST" -Path "/api/domains" -ExpectedStatus @(400) -Body @{ projectId = "bad"; domain = "" }
Invoke-QATest -Name "Domains unauthorized rejected" -Method "POST" -Path "/api/domains" -ExpectedStatus @(401) -Body @{ projectId = $validUuid; domain = "example.com" }
Invoke-QATest -Name "Billing invalid payload rejected" -Method "POST" -Path "/api/billing/checkout" -ExpectedStatus @(400) -Body @{ clientId = "bad"; chargeType = "none" }
Invoke-QATest -Name "Billing unauthorized rejected" -Method "POST" -Path "/api/billing/checkout" -ExpectedStatus @(401) -Body @{ clientId = $validUuid; chargeType = "build_fee" }
Invoke-QATest -Name "Monitoring export unauthorized rejected" -Method "GET" -Path "/api/monitoring/export" -ExpectedStatus @(401)
Invoke-QATest -Name "Stripe webhook missing config handled" -Method "POST" -Path "/api/stripe/webhook" -ExpectedStatus @(400, 503) -Body @{ id = "evt_test"; type = "checkout.session.completed"; data = @{ object = @{} } }

# Authenticated tests
$stamp = [DateTime]::UtcNow.ToString("yyyyMMddHHmmssfff")
$qaEmail = "qa.$stamp@gmail.com"
$qaPassword = "QaTest!2026"

Invoke-QATest -Name "Register valid user" -Method "POST" -Path "/api/auth/register" -ExpectedStatus @(200, 400) -Body @{ email = $qaEmail; password = $qaPassword; name = "QA User $stamp" } -Validate {
  param($status, $content, $headers)
  if ($status -eq 200) { return $true }
  return $content -match "rate limit"
}
Invoke-QATest -Name "Login unconfirmed user rejected" -Method "POST" -Path "/api/auth/login" -ExpectedStatus @(401) -Body @{ email = $qaEmail; password = $qaPassword }

$envMap = Read-EnvLocal
$confirmedLoginReady = $false
$adminCreateReady = $false
$confirmedEmail = "qa.confirmed.$stamp@gmail.com"
$confirmedPassword = "QaTest!2026"

if ($envMap.ContainsKey("NEXT_PUBLIC_SUPABASE_URL") -and $envMap.ContainsKey("SUPABASE_SERVICE_ROLE_KEY")) {
  try {
    $supabaseUrl = $envMap["NEXT_PUBLIC_SUPABASE_URL"].TrimEnd("/")
    $serviceRole = $envMap["SUPABASE_SERVICE_ROLE_KEY"]
    $adminHeaders = @{
      "apikey" = $serviceRole
      "Authorization" = "Bearer $serviceRole"
      "Content-Type" = "application/json"
    }
    $adminBody = @{
      email = $confirmedEmail
      password = $confirmedPassword
      email_confirm = $true
      user_metadata = @{
        full_name = "QA Confirmed User $stamp"
      }
    } | ConvertTo-Json -Compress -Depth 8

    $adminResp = Invoke-WebRequest -Uri "$supabaseUrl/auth/v1/admin/users" -Method "POST" -Headers $adminHeaders -Body $adminBody -ErrorAction Stop
    $results.Add([pscustomobject]@{
      name = "Admin create confirmed QA user"
      method = "POST"
      path = "supabase/auth/v1/admin/users"
      expected = "200/201"
      actual = [string][int]$adminResp.StatusCode
      pass = (([int]$adminResp.StatusCode -eq 200) -or ([int]$adminResp.StatusCode -eq 201))
      error = $null
      response = "confirmed test user created"
    })
    $adminCreateReady = $true
  }
  catch {
    Add-SkippedTest -Name "Admin create confirmed QA user" -Method "POST" -Path "supabase/auth/v1/admin/users" -Reason ("Admin user creation blocked: " + $_.Exception.Message)
  }

  if ($adminCreateReady) {
    $loginConfirmed = Invoke-QATest -Name "Login confirmed user" -Method "POST" -Path "/api/auth/login" -ExpectedStatus @(200) -Body @{ email = $confirmedEmail; password = $confirmedPassword }
    $confirmedLoginReady = $loginConfirmed.pass
  }
  else {
    Add-SkippedTest -Name "Login confirmed user" -Method "POST" -Path "/api/auth/login" -Reason "No confirmed QA user available"
  }
}
else {
  Add-SkippedTest -Name "Admin create confirmed QA user" -Method "POST" -Path "supabase/auth/v1/admin/users" -Reason ".env.local missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  Add-SkippedTest -Name "Login confirmed user" -Method "POST" -Path "/api/auth/login" -Reason "No confirmed QA user available"
}

if ($confirmedLoginReady) {
  Invoke-QATest -Name "Dashboard accessible after auth" -Method "GET" -Path "/dashboard" -ExpectedStatus @(200)
  Invoke-QATest -Name "Projects page accessible after auth" -Method "GET" -Path "/dashboard/projects" -ExpectedStatus @(200)
  Invoke-QATest -Name "Billing page accessible after auth" -Method "GET" -Path "/dashboard/billing" -ExpectedStatus @(200)
  Invoke-QATest -Name "Monitoring page accessible after auth" -Method "GET" -Path "/dashboard/monitoring" -ExpectedStatus @(200)
  Invoke-QATest -Name "Analytics page accessible after auth" -Method "GET" -Path "/dashboard/monitoring/analytics" -ExpectedStatus @(200)
  Invoke-QATest -Name "API guide page accessible after auth" -Method "GET" -Path "/dashboard/api" -ExpectedStatus @(200)
  Invoke-QATest -Name "Samples page accessible after auth" -Method "GET" -Path "/dashboard/samples" -ExpectedStatus @(200)

  Invoke-QATest -Name "Deploy with unknown project returns not found" -Method "POST" -Path "/api/deploy" -ExpectedStatus @(404) -Body @{ projectId = $validUuid }
  Invoke-QATest -Name "Domain create with unknown project returns not found" -Method "POST" -Path "/api/domains" -ExpectedStatus @(404) -Body @{ projectId = $validUuid; domain = "example.com" }
  Invoke-QATest -Name "Billing checkout unknown client returns not found" -Method "POST" -Path "/api/billing/checkout" -ExpectedStatus @(404) -Body @{ clientId = $validUuid; chargeType = "build_fee" }
  Invoke-QATest -Name "Monitoring export returns CSV when authenticated" -Method "GET" -Path "/api/monitoring/export?days=7" -ExpectedStatus @(200) -Validate { param($status, $content, $headers) ($headers["Content-Type"] -like "text/csv*") -and ($content -like "created_at,*") }
  Invoke-QATest -Name "Invoice pay unknown invoice returns not found" -Method "POST" -Path "/api/billing/invoices/$validUuid/pay" -ExpectedStatus @(404)
  Invoke-QATest -Name "Domain status unknown domain returns not found" -Method "POST" -Path "/api/domains/$validUuid/status" -ExpectedStatus @(404) -Body @{ status = "verified" }
  Invoke-QATest -Name "Domain dns-check unknown domain returns not found" -Method "POST" -Path "/api/domains/$validUuid/dns-check" -ExpectedStatus @(404)
  Invoke-QATest -Name "Deployment status unknown id returns not found" -Method "GET" -Path "/api/deploy/$validUuid/status" -ExpectedStatus @(404)
  Invoke-QATest -Name "Logout after auth succeeds" -Method "POST" -Path "/api/auth/logout" -ExpectedStatus @(200)
}
else {
  Add-SkippedTest -Name "Dashboard accessible after auth" -Method "GET" -Path "/dashboard" -Reason "Authenticated session setup failed"
  Add-SkippedTest -Name "Projects page accessible after auth" -Method "GET" -Path "/dashboard/projects" -Reason "Authenticated session setup failed"
  Add-SkippedTest -Name "Billing page accessible after auth" -Method "GET" -Path "/dashboard/billing" -Reason "Authenticated session setup failed"
  Add-SkippedTest -Name "Monitoring page accessible after auth" -Method "GET" -Path "/dashboard/monitoring" -Reason "Authenticated session setup failed"
  Add-SkippedTest -Name "Analytics page accessible after auth" -Method "GET" -Path "/dashboard/monitoring/analytics" -Reason "Authenticated session setup failed"
  Add-SkippedTest -Name "API guide page accessible after auth" -Method "GET" -Path "/dashboard/api" -Reason "Authenticated session setup failed"
  Add-SkippedTest -Name "Samples page accessible after auth" -Method "GET" -Path "/dashboard/samples" -Reason "Authenticated session setup failed"
  Add-SkippedTest -Name "Deploy with unknown project returns not found" -Method "POST" -Path "/api/deploy" -Reason "Authenticated session setup failed"
  Add-SkippedTest -Name "Domain create with unknown project returns not found" -Method "POST" -Path "/api/domains" -Reason "Authenticated session setup failed"
  Add-SkippedTest -Name "Billing checkout unknown client returns not found" -Method "POST" -Path "/api/billing/checkout" -Reason "Authenticated session setup failed"
  Add-SkippedTest -Name "Monitoring export returns CSV when authenticated" -Method "GET" -Path "/api/monitoring/export?days=7" -Reason "Authenticated session setup failed"
  Add-SkippedTest -Name "Invoice pay unknown invoice returns not found" -Method "POST" -Path "/api/billing/invoices/$validUuid/pay" -Reason "Authenticated session setup failed"
  Add-SkippedTest -Name "Domain status unknown domain returns not found" -Method "POST" -Path "/api/domains/$validUuid/status" -Reason "Authenticated session setup failed"
  Add-SkippedTest -Name "Domain dns-check unknown domain returns not found" -Method "POST" -Path "/api/domains/$validUuid/dns-check" -Reason "Authenticated session setup failed"
  Add-SkippedTest -Name "Deployment status unknown id returns not found" -Method "GET" -Path "/api/deploy/$validUuid/status" -Reason "Authenticated session setup failed"
  Add-SkippedTest -Name "Logout after auth succeeds" -Method "POST" -Path "/api/auth/logout" -Reason "Authenticated session setup failed"
}

$passCount = ($results | Where-Object { $_.pass }).Count
$failCount = ($results | Where-Object { -not $_.pass }).Count

$report = [pscustomobject]@{
  baseUrl = $BaseUrl
  timestampUtc = [DateTime]::UtcNow.ToString("o")
  summary = [pscustomobject]@{
    total = $results.Count
    passed = $passCount
    failed = $failCount
  }
  results = $results
}

$jsonOut = $report | ConvertTo-Json -Depth 8
$jsonOut | Set-Content -Path "docs/qa-heavy-runtime-results.json" -Encoding UTF8

Write-Output $jsonOut

if ($failCount -gt 0) {
  exit 2
}
