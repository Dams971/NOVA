# Quick Accessibility Check for Windows PowerShell

Write-Host "Checking Accessibility Fixes..." -ForegroundColor Blue

$checks = 0
$passed = 0

# Check if key accessibility files exist
$files = @(
    "src/components/ui/VisuallyHidden.tsx";
    "src/components/ui/FocusTrap.tsx";
    "src/components/ui/ErrorMessage.tsx";
    "src/components/ui/LoadingSpinner.tsx";
    "src/hooks/useAccessibleModal.ts";
    "src/hooks/useScreenReaderAnnouncements.ts";
    "docs/ACCESSIBILITY_GUIDE.md";
    "docs/ACCESSIBILITY_TESTING.md"
)

foreach ($file in $files) {
    $checks++
    if (Test-Path $file) {
        Write-Host "✓ $file exists" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "✗ $file missing" -ForegroundColor Red
    }
}

# Check for aria-label usage
$checks++
$ariaLabels = Select-String -Path "src/components/*.tsx" -Pattern "aria-label" -Recurse
if ($ariaLabels.Count -gt 0) {
    Write-Host "✓ ARIA labels found in components" -ForegroundColor Green
    $passed++
} else {
    Write-Host "✗ No ARIA labels found" -ForegroundColor Red
}

# Check for button type attributes
$checks++
$buttonTypes = Select-String -Path "src/components/*.tsx" -Pattern 'type="button"' -Recurse
if ($buttonTypes.Count -gt 0) {
    Write-Host "✓ Button type attributes found" -ForegroundColor Green
    $passed++
} else {
    Write-Host "✗ No button type attributes found" -ForegroundColor Red
}

# Check for htmlFor attributes
$checks++
$htmlFor = Select-String -Path "src/components/*.tsx" -Pattern "htmlFor" -Recurse
if ($htmlFor.Count -gt 0) {
    Write-Host "✓ Form labels with htmlFor found" -ForegroundColor Green
    $passed++
} else {
    Write-Host "✗ No form labels with htmlFor found" -ForegroundColor Red
}

Write-Host ""
Write-Host "Summary: $passed/$checks checks passed" -ForegroundColor Blue

if ($passed -eq $checks) {
    Write-Host "All accessibility checks passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "Some checks failed. Review the output above." -ForegroundColor Yellow
    exit 1
}
