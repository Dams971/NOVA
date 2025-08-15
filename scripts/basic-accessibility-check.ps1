# Basic Accessibility Check for Windows PowerShell

Write-Host "Checking Accessibility Fixes..." -ForegroundColor Blue

$checks = 0
$passed = 0

# Check if key accessibility files exist
Write-Host "Checking accessibility component files..."

$checks++
if (Test-Path "src/components/ui/VisuallyHidden.tsx") {
    Write-Host "PASS: VisuallyHidden component exists" -ForegroundColor Green
    $passed++
} else {
    Write-Host "FAIL: VisuallyHidden component missing" -ForegroundColor Red
}

$checks++
if (Test-Path "src/components/ui/FocusTrap.tsx") {
    Write-Host "PASS: FocusTrap component exists" -ForegroundColor Green
    $passed++
} else {
    Write-Host "FAIL: FocusTrap component missing" -ForegroundColor Red
}

$checks++
if (Test-Path "src/components/ui/ErrorMessage.tsx") {
    Write-Host "PASS: ErrorMessage component exists" -ForegroundColor Green
    $passed++
} else {
    Write-Host "FAIL: ErrorMessage component missing" -ForegroundColor Red
}

$checks++
if (Test-Path "src/hooks/useAccessibleModal.ts") {
    Write-Host "PASS: useAccessibleModal hook exists" -ForegroundColor Green
    $passed++
} else {
    Write-Host "FAIL: useAccessibleModal hook missing" -ForegroundColor Red
}

$checks++
if (Test-Path "docs/ACCESSIBILITY_GUIDE.md") {
    Write-Host "PASS: Accessibility guide exists" -ForegroundColor Green
    $passed++
} else {
    Write-Host "FAIL: Accessibility guide missing" -ForegroundColor Red
}

# Check for aria-label usage
Write-Host "Checking ARIA attributes..."
$checks++
$ariaLabels = Select-String -Path "src/components/manager/*.tsx" -Pattern "aria-label" -ErrorAction SilentlyContinue
if ($ariaLabels -and $ariaLabels.Count -gt 0) {
    Write-Host "PASS: ARIA labels found in components" -ForegroundColor Green
    $passed++
} else {
    Write-Host "FAIL: No ARIA labels found" -ForegroundColor Red
}

# Check for button type attributes
$checks++
$buttonTypes = Select-String -Path "src/components/manager/*.tsx" -Pattern 'type="button"' -ErrorAction SilentlyContinue
if ($buttonTypes -and $buttonTypes.Count -gt 0) {
    Write-Host "PASS: Button type attributes found" -ForegroundColor Green
    $passed++
} else {
    Write-Host "FAIL: No button type attributes found" -ForegroundColor Red
}

# Check for htmlFor attributes
$checks++
$htmlFor = Select-String -Path "src/components/manager/*.tsx" -Pattern "htmlFor" -ErrorAction SilentlyContinue
if ($htmlFor -and $htmlFor.Count -gt 0) {
    Write-Host "PASS: Form labels with htmlFor found" -ForegroundColor Green
    $passed++
} else {
    Write-Host "FAIL: No form labels with htmlFor found" -ForegroundColor Red
}

Write-Host ""
Write-Host "================================="
Write-Host "Summary: $passed out of $checks checks passed" -ForegroundColor Blue

$percentage = [math]::Round(($passed * 100) / $checks)
Write-Host "Success rate: $percentage%" -ForegroundColor Blue

if ($passed -eq $checks) {
    Write-Host "All accessibility checks passed!" -ForegroundColor Green
    Write-Host "Your components are ready for testing!" -ForegroundColor Green
} elseif ($percentage -ge 80) {
    Write-Host "Most checks passed! Good progress on accessibility." -ForegroundColor Yellow
} else {
    Write-Host "Some checks failed. Review the output above." -ForegroundColor Yellow
}
