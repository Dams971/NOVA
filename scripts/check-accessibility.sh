#!/bin/bash

# Accessibility Checker Script
# This script checks for common accessibility issues in React components

echo "🔍 Checking Accessibility Issues"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Initialize counters
total_files=0
files_with_issues=0
total_issues=0

# Function to check a single file for accessibility issues
check_file() {
    local file=$1
    local issues=0
    
    print_status $BLUE "Checking $file..."
    
    # Check for buttons without accessible names
    if grep -n "button" "$file" | grep -v "aria-label\|title\|type=\"button\"" | grep -q .; then
        print_status $YELLOW "  ⚠️  Found buttons that may need accessibility attributes"
        issues=$((issues + 1))
    fi
    
    # Check for form elements without labels
    if grep -n "<input\|<select\|<textarea" "$file" | grep -v "id=\|aria-label\|aria-labelledby" | grep -q .; then
        print_status $YELLOW "  ⚠️  Found form elements that may need labels or aria attributes"
        issues=$((issues + 1))
    fi
    
    # Check for images without alt text
    if grep -n "<img" "$file" | grep -v "alt=" | grep -q .; then
        print_status $YELLOW "  ⚠️  Found images without alt text"
        issues=$((issues + 1))
    fi
    
    # Check for inline styles (should use CSS classes)
    if grep -n "style={{" "$file" | grep -q .; then
        print_status $YELLOW "  ⚠️  Found inline styles (consider using CSS classes)"
        issues=$((issues + 1))
    fi
    
    # Check for missing semantic HTML
    if grep -n "div.*onClick\|span.*onClick" "$file" | grep -v "role=" | grep -q .; then
        print_status $YELLOW "  ⚠️  Found clickable divs/spans without proper roles"
        issues=$((issues + 1))
    fi
    
    # Check for missing focus management
    if grep -n "Modal\|Dialog\|Popup" "$file" | grep -q . && ! grep -n "focus\|tabIndex\|autoFocus" "$file" | grep -q .; then
        print_status $YELLOW "  ⚠️  Modal/Dialog components should manage focus"
        issues=$((issues + 1))
    fi
    
    if [ $issues -eq 0 ]; then
        print_status $GREEN "  ✅ No accessibility issues found"
    else
        files_with_issues=$((files_with_issues + 1))
        total_issues=$((total_issues + issues))
    fi
    
    return $issues
}

# Check all React component files
echo ""
print_status $YELLOW "Scanning React components..."
echo ""

# Find all .tsx and .jsx files in components directory
component_files=$(find src/components -name "*.tsx" -o -name "*.jsx" 2>/dev/null)

if [ -z "$component_files" ]; then
    print_status $RED "No React component files found in src/components"
    exit 1
fi

for file in $component_files; do
    if [ -f "$file" ]; then
        total_files=$((total_files + 1))
        check_file "$file"
        echo ""
    fi
done

# Summary
echo "================================"
print_status $BLUE "Accessibility Check Summary"
echo "================================"
echo "Total files checked: $total_files"
print_status $GREEN "Files without issues: $((total_files - files_with_issues))"
print_status $YELLOW "Files with potential issues: $files_with_issues"
print_status $RED "Total potential issues: $total_issues"

if [ $files_with_issues -eq 0 ]; then
    print_status $GREEN "🎉 All components passed basic accessibility checks!"
    echo ""
    print_status $BLUE "Recommendations for further testing:"
    echo "• Test with screen readers (NVDA, JAWS, VoiceOver)"
    echo "• Test keyboard navigation (Tab, Enter, Escape, Arrow keys)"
    echo "• Test color contrast ratios"
    echo "• Test with browser accessibility tools"
    echo "• Run automated accessibility tests (axe-core, Lighthouse)"
    exit 0
else
    print_status $YELLOW "⚠️  Some components may have accessibility issues."
    echo ""
    print_status $BLUE "Common fixes:"
    echo "• Add aria-label or title attributes to buttons with only icons"
    echo "• Associate form inputs with labels using htmlFor/id"
    echo "• Add alt text to images"
    echo "• Use semantic HTML elements (button, nav, main, etc.)"
    echo "• Ensure proper focus management in modals"
    echo "• Test with keyboard navigation"
    echo ""
    print_status $BLUE "Running automated accessibility tests..."
    if npm run test -- --run "src/test/accessibility/accessibility.test.tsx" --reporter=verbose; then
        print_status $GREEN "✅ Automated accessibility tests passed"
    else
        print_status $RED "❌ Automated accessibility tests failed"
    fi

    echo ""
    print_status $BLUE "Tools for detailed analysis:"
    echo "• axe DevTools browser extension"
    echo "• Lighthouse accessibility audit"
    echo "• WAVE Web Accessibility Evaluation Tool"
    echo "• Screen reader testing"
    exit 1
fi
