# Accessibility Validation Script for Windows PowerShell
# This script validates that all accessibility fixes have been properly implemented

Write-Host "🔍 Validating Accessibility Fixes" -ForegroundColor Blue
Write-Host "================================="

$totalChecks = 0
$passedChecks = 0
$failedChecks = 0

function Run-Check {
    param(
        [string]$CheckName,
        [scriptblock]$CheckCommand
    )
    
    $global:totalChecks++
    Write-Host "Checking: $CheckName" -ForegroundColor Blue
    
    try {
        $result = & $CheckCommand
        if ($result) {
            Write-Host "  ✅ PASS" -ForegroundColor Green
            $global:passedChecks++
            return $true
        } else {
            Write-Host "  ❌ FAIL" -ForegroundColor Red
            $global:failedChecks++
            return $false
        }
    } catch {
        Write-Host "  ❌ FAIL (Error: $($_.Exception.Message))" -ForegroundColor Red
        $global:failedChecks++
        return $false
    }
}

Write-Host ""
Write-Host "Running accessibility validation checks..." -ForegroundColor Yellow
Write-Host ""

# Check 1: All buttons have accessible names
Run-Check "Buttons have accessible names" {
    $buttonIssues = Select-String -Path "src/components/*.tsx" -Pattern "button" -Recurse | 
                   Where-Object { $_.Line -notmatch "aria-label|title|type=`"button`"|children|\{.*\}" -and $_.Line -match ">" }
    return $buttonIssues.Count -eq 0
}

# Check 2: All form inputs have labels
Run-Check "Form inputs have labels" {
    $inputIssues = Select-String -Path "src/components/*.tsx" -Pattern "<input|<select|<textarea" -Recurse | 
                  Where-Object { $_.Line -notmatch "id=|aria-label|aria-labelledby|htmlFor" }
    return $inputIssues.Count -eq 0
}

# Check 3: Focus management components exist
Run-Check "Focus management components exist" {
    return (Test-Path "src/components/ui/FocusTrap.tsx") -and (Test-Path "src/hooks/useAccessibleModal.ts")
}

# Check 4: Screen reader support components exist
Run-Check "Screen reader support components exist" {
    return (Test-Path "src/components/ui/VisuallyHidden.tsx") -and (Test-Path "src/hooks/useScreenReaderAnnouncements.ts")
}

# Check 5: Accessible error components exist
Run-Check "Accessible error components exist" {
    $errorComponent = Test-Path "src/components/ui/ErrorMessage.tsx"
    if ($errorComponent) {
        $hasAlert = Select-String -Path "src/components/ui/ErrorMessage.tsx" -Pattern "role.*alert"
        return $hasAlert.Count -gt 0
    }
    return $false
}

# Check 6: Accessible loading components exist
Run-Check "Accessible loading components exist" {
    $loadingComponent = Test-Path "src/components/ui/LoadingSpinner.tsx"
    if ($loadingComponent) {
        $hasStatus = Select-String -Path "src/components/ui/LoadingSpinner.tsx" -Pattern "role.*status"
        return $hasStatus.Count -gt 0
    }
    return $false
}

# Check 7: Documentation exists
Run-Check "Accessibility documentation exists" {
    return (Test-Path "docs/ACCESSIBILITY_GUIDE.md") -and (Test-Path "docs/ACCESSIBILITY_TESTING.md")
}

# Check 8: Accessibility tests exist
Run-Check "Accessibility tests exist" {
    $testFile = Test-Path "src/test/accessibility/accessibility.test.tsx"
    if ($testFile) {
        $hasAxe = Select-String -Path "src/test/accessibility/accessibility.test.tsx" -Pattern "toHaveNoViolations"
        return $hasAxe.Count -gt 0
    }
    return $false
}

# Check 9: TypeScript types for accessibility
Run-Check "Accessibility TypeScript support" {
    $ariaUsage = Select-String -Path "src/components/*.tsx" -Pattern "aria-label|aria-describedby|role=" -Recurse
    return $ariaUsage.Count -gt 0
}

# Check 10: No accessibility anti-patterns
Run-Check "No accessibility anti-patterns" {
    $positiveTabindex = Select-String -Path "src/components/*.tsx" -Pattern 'tabindex="[1-9]"' -Recurse
    return $positiveTabindex.Count -eq 0
}

Write-Host ""
Write-Host "================================="
Write-Host "Accessibility Validation Summary" -ForegroundColor Blue
Write-Host "================================="
Write-Host "Total checks: $totalChecks"
Write-Host "Passed: $passedChecks" -ForegroundColor Green
Write-Host "Failed: $failedChecks" -ForegroundColor Red

if ($totalChecks -gt 0) {
    $percentage = [math]::Round(($passedChecks * 100) / $totalChecks)
    Write-Host "Success rate: $percentage%"
}

Write-Host ""

if ($failedChecks -eq 0) {
    Write-Host "All accessibility validation checks passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your components are ready for accessibility testing:" -ForegroundColor Blue
    Write-Host "- Run automated tests: npm run test:accessibility"
    Write-Host "- Test with screen readers like NVDA or VoiceOver"
    Write-Host "- Verify keyboard navigation"
    Write-Host "- Check color contrast ratios"
    Write-Host "- Test at 200% zoom level"
    Write-Host ""
    Write-Host "Great job on implementing accessible components!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "Some accessibility checks failed." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Blue
    Write-Host "- Review the failed checks above"
    Write-Host "- Consult docs/ACCESSIBILITY_GUIDE.md for guidance"
    Write-Host "- Test manually with keyboard navigation"
    Write-Host "- Use browser accessibility tools like axe DevTools"
    Write-Host ""

    if ($percentage -ge 80) {
        Write-Host "You are doing well! $percentage% of checks passed." -ForegroundColor Yellow
        exit 0
    } else {
        Write-Host "More work needed. Only $percentage% of checks passed." -ForegroundColor Red
        exit 1
    }
}
