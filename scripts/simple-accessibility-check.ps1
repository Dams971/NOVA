# Simple Accessibility Check for Windows PowerShell

Write-Host "Checking Accessibility Fixes..." -ForegroundColor Blue

$checks = 0
$passed = 0

# Check if key accessibility files exist
Write-Host "Checking accessibility component files..."

$checks++
if (Test-Path "src/components/ui/VisuallyHidden.tsx") {
    Write-Host "✓ VisuallyHidden component exists" -ForegroundColor Green
    $passed++
} else {
    Write-Host "✗ VisuallyHidden component missing" -ForegroundColor Red
}

$checks++
if (Test-Path "src/components/ui/FocusTrap.tsx") {
    Write-Host "✓ FocusTrap component exists" -ForegroundColor Green
    $passed++
} else {
    Write-Host "✗ FocusTrap component missing" -ForegroundColor Red
}

$checks++
if (Test-Path "src/components/ui/ErrorMessage.tsx") {
    Write-Host "✓ ErrorMessage component exists" -ForegroundColor Green
    $passed++
} else {
    Write-Host "✗ ErrorMessage component missing" -ForegroundColor Red
}

$checks++
if (Test-Path "src/hooks/useAccessibleModal.ts") {
    Write-Host "✓ useAccessibleModal hook exists" -ForegroundColor Green
    $passed++
} else {
    Write-Host "✗ useAccessibleModal hook missing" -ForegroundColor Red
}

$checks++
if (Test-Path "docs/ACCESSIBILITY_GUIDE.md") {
    Write-Host "✓ Accessibility guide exists" -ForegroundColor Green
    $passed++
} else {
    Write-Host "✗ Accessibility guide missing" -ForegroundColor Red
}

# Check for aria-label usage
Write-Host "Checking ARIA attributes..."
$checks++
try {
    $ariaLabels = Select-String -Path "src/components/manager/*.tsx" -Pattern "aria-label" -ErrorAction SilentlyContinue
    if ($ariaLabels.Count -gt 0) {
        Write-Host "✓ ARIA labels found in components ($($ariaLabels.Count) instances)" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "✗ No ARIA labels found" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Error checking ARIA labels" -ForegroundColor Red
}

# Check for button type attributes
$checks++
try {
    $buttonTypes = Select-String -Path "src/components/manager/*.tsx" -Pattern 'type="button"' -ErrorAction SilentlyContinue
    if ($buttonTypes.Count -gt 0) {
        Write-Host "✓ Button type attributes found ($($buttonTypes.Count) instances)" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "✗ No button type attributes found" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Error checking button types" -ForegroundColor Red
}

# Check for htmlFor attributes
$checks++
try {
    $htmlFor = Select-String -Path "src/components/manager/*.tsx" -Pattern "htmlFor" -ErrorAction SilentlyContinue
    if ($htmlFor.Count -gt 0) {
        Write-Host "✓ Form labels with htmlFor found ($($htmlFor.Count) instances)" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "✗ No form labels with htmlFor found" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Error checking htmlFor attributes" -ForegroundColor Red
}

Write-Host ""
Write-Host "================================="
Write-Host "Summary: $passed/$checks checks passed" -ForegroundColor Blue

$percentage = [math]::Round(($passed * 100) / $checks)
Write-Host "Success rate: $percentage%" -ForegroundColor Blue

if ($passed -eq $checks) {
    Write-Host "All accessibility checks passed!" -ForegroundColor Green
    Write-Host "Your components are ready for testing!" -ForegroundColor Green
    exit 0
} elseif ($percentage -ge 80) {
    Write-Host "Most checks passed! Good progress on accessibility." -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "Some checks failed. Review the output above." -ForegroundColor Yellow
    exit 1
}
