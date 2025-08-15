# Check for Inline Styles in React Components

Write-Host "Checking for inline styles in React components..." -ForegroundColor Blue

$totalFiles = 0
$filesWithInlineStyles = 0
$totalInlineStyles = 0

# Get all TSX files in components directory
$tsxFiles = Get-ChildItem -Path "src/components" -Filter "*.tsx" -Recurse

foreach ($file in $tsxFiles) {
    $totalFiles++
    Write-Host "Checking: $($file.Name)" -ForegroundColor Gray
    
    # Search for style= patterns
    $inlineStyles = Select-String -Path $file.FullName -Pattern "style\s*=\s*\{" -AllMatches
    
    if ($inlineStyles) {
        $filesWithInlineStyles++
        $totalInlineStyles += $inlineStyles.Count
        
        Write-Host "  FOUND: $($inlineStyles.Count) inline style(s)" -ForegroundColor Red
        
        foreach ($match in $inlineStyles) {
            Write-Host "    Line $($match.LineNumber): $($match.Line.Trim())" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  CLEAN: No inline styles found" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "================================="
Write-Host "Inline Styles Check Summary" -ForegroundColor Blue
Write-Host "================================="
Write-Host "Total files checked: $totalFiles"
Write-Host "Files with inline styles: $filesWithInlineStyles" -ForegroundColor $(if ($filesWithInlineStyles -eq 0) { "Green" } else { "Red" })
Write-Host "Total inline styles found: $totalInlineStyles" -ForegroundColor $(if ($totalInlineStyles -eq 0) { "Green" } else { "Red" })

if ($totalInlineStyles -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS: No inline styles found!" -ForegroundColor Green
    Write-Host "All components are using CSS classes instead of inline styles." -ForegroundColor Green
    exit 0
} else {
    Write-Host ""
    Write-Host "WARNING: $totalInlineStyles inline style(s) found in $filesWithInlineStyles file(s)" -ForegroundColor Yellow
    Write-Host "Consider moving these styles to CSS classes for better performance and maintainability." -ForegroundColor Yellow
    exit 1
}
