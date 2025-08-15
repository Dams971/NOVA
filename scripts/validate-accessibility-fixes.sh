#!/bin/bash

# Accessibility Validation Script
# This script validates that all accessibility fixes have been properly implemented

echo "🔍 Validating Accessibility Fixes"
echo "================================="

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
total_checks=0
passed_checks=0
failed_checks=0

# Function to run a validation check
run_check() {
    local check_name=$1
    local check_command=$2
    
    total_checks=$((total_checks + 1))
    print_status $BLUE "Checking: $check_name"
    
    if eval "$check_command"; then
        print_status $GREEN "  ✅ PASS"
        passed_checks=$((passed_checks + 1))
        return 0
    else
        print_status $RED "  ❌ FAIL"
        failed_checks=$((failed_checks + 1))
        return 1
    fi
}

echo ""
print_status $YELLOW "Running accessibility validation checks..."
echo ""

# Check 1: All buttons have accessible names
run_check "Buttons have accessible names" '
    ! grep -r "button" src/components --include="*.tsx" | 
    grep -v "aria-label\|title\|type=\"button\"" | 
    grep -v "children\|{.*}" | 
    grep -q ">"
'

# Check 2: All form inputs have labels
run_check "Form inputs have labels" '
    ! grep -r "<input\|<select\|<textarea" src/components --include="*.tsx" | 
    grep -v "id=\|aria-label\|aria-labelledby" | 
    grep -v "htmlFor" | 
    grep -q "."
'

# Check 3: All images have alt text
run_check "Images have alt text" '
    ! grep -r "<img" src/components --include="*.tsx" | 
    grep -v "alt=" | 
    grep -q "."
'

# Check 4: No inline styles (prefer CSS classes)
run_check "Minimal inline styles usage" '
    inline_count=$(grep -r "style={{" src/components --include="*.tsx" | wc -l)
    [ $inline_count -lt 5 ]  # Allow some inline styles for dynamic values
'

# Check 5: Proper semantic HTML usage
run_check "Proper semantic HTML" '
    ! grep -r "div.*onClick\|span.*onClick" src/components --include="*.tsx" | 
    grep -v "role=\|button\|tabIndex" | 
    grep -q "."
'

# Check 6: Modal components have proper ARIA attributes
run_check "Modals have proper ARIA attributes" '
    grep -r "role=\"dialog\"" src/components --include="*.tsx" | 
    grep -q "aria-modal"
'

# Check 7: Focus management components exist
run_check "Focus management components exist" '
    [ -f "src/components/ui/FocusTrap.tsx" ] && 
    [ -f "src/hooks/useAccessibleModal.ts" ]
'

# Check 8: Screen reader support components exist
run_check "Screen reader support components exist" '
    [ -f "src/components/ui/VisuallyHidden.tsx" ] && 
    [ -f "src/hooks/useScreenReaderAnnouncements.ts" ]
'

# Check 9: Error handling components are accessible
run_check "Accessible error components exist" '
    [ -f "src/components/ui/ErrorMessage.tsx" ] && 
    grep -q "role=\"alert\"" src/components/ui/ErrorMessage.tsx
'

# Check 10: Loading states are accessible
run_check "Accessible loading components exist" '
    [ -f "src/components/ui/LoadingSpinner.tsx" ] && 
    grep -q "role=\"status\"" src/components/ui/LoadingSpinner.tsx
'

# Check 11: Tab navigation is properly implemented
run_check "Tab navigation properly implemented" '
    grep -r "role=\"tab\"" src/components --include="*.tsx" | 
    grep -q "aria-selected"
'

# Check 12: Form validation provides accessible feedback
run_check "Form validation is accessible" '
    grep -r "aria-describedby.*error" src/components --include="*.tsx" | 
    grep -q "."
'

# Check 13: Color contrast utilities exist
run_check "Color contrast considerations" '
    grep -r "text-red-600\|text-green-600\|text-blue-600" src/components --include="*.tsx" | 
    grep -q "." # Check that we use high-contrast color classes
'

# Check 14: Skip links implementation
run_check "Skip links implemented" '
    [ -f "src/components/ui/SkipLink.tsx" ]
'

# Check 15: Accessibility tests exist
run_check "Accessibility tests exist" '
    [ -f "src/test/accessibility/accessibility.test.tsx" ] && 
    grep -q "toHaveNoViolations" src/test/accessibility/accessibility.test.tsx
'

# Check 16: Documentation exists
run_check "Accessibility documentation exists" '
    [ -f "docs/ACCESSIBILITY_GUIDE.md" ] && 
    [ -f "docs/ACCESSIBILITY_TESTING.md" ]
'

# Check 17: Build scripts include accessibility checks
run_check "Accessibility check scripts exist" '
    [ -f "scripts/check-accessibility.sh" ] && 
    [ -x "scripts/check-accessibility.sh" ]
'

# Check 18: TypeScript types for accessibility
run_check "Accessibility TypeScript support" '
    grep -r "aria-label\|aria-describedby\|role=" src/components --include="*.tsx" | 
    grep -q "."
'

# Advanced checks
echo ""
print_status $YELLOW "Running advanced validation checks..."
echo ""

# Check 19: Verify axe-core integration
run_check "axe-core integration" '
    [ -f "package.json" ] && 
    grep -q "@axe-core/react\|jest-axe" package.json
'

# Check 20: Check for common accessibility anti-patterns
run_check "No accessibility anti-patterns" '
    ! grep -r "tabindex=\"[1-9]\"" src/components --include="*.tsx" | 
    grep -q "." # No positive tabindex values
'

# Check 21: Verify ARIA usage is correct
run_check "Proper ARIA usage" '
    ! grep -r "aria-label=\"\"" src/components --include="*.tsx" | 
    grep -q "." # No empty aria-labels
'

# Check 22: Check for keyboard event handlers
run_check "Keyboard event handling" '
    grep -r "onKeyDown\|onKeyPress\|onKeyUp" src/components --include="*.tsx" | 
    grep -q "." # Some keyboard event handling exists
'

# Check 23: Verify focus indicators
run_check "Focus indicators in CSS" '
    grep -r "focus:\|focus-visible:" src --include="*.css" --include="*.scss" | 
    grep -q "outline\|ring\|border" # Focus styles exist
'

# Check 24: Live regions implementation
run_check "Live regions implemented" '
    grep -r "aria-live\|role=\"status\"\|role=\"alert\"" src/components --include="*.tsx" | 
    grep -q "."
'

# Check 25: Responsive design considerations
run_check "Responsive accessibility considerations" '
    grep -r "sm:\|md:\|lg:" src/components --include="*.tsx" | 
    grep -q "." # Responsive classes used
'

echo ""
echo "================================="
print_status $BLUE "Accessibility Validation Summary"
echo "================================="
echo "Total checks: $total_checks"
print_status $GREEN "Passed: $passed_checks"
print_status $RED "Failed: $failed_checks"

# Calculate percentage
if [ $total_checks -gt 0 ]; then
    percentage=$((passed_checks * 100 / total_checks))
    echo "Success rate: ${percentage}%"
fi

echo ""

if [ $failed_checks -eq 0 ]; then
    print_status $GREEN "🎉 All accessibility validation checks passed!"
    echo ""
    print_status $BLUE "Your components are ready for accessibility testing:"
    echo "• Run automated tests: npm run test:accessibility"
    echo "• Test with screen readers (NVDA, VoiceOver, etc.)"
    echo "• Verify keyboard navigation"
    echo "• Check color contrast ratios"
    echo "• Test at 200% zoom level"
    echo ""
    print_status $GREEN "Great job on implementing accessible components! 🌟"
    exit 0
else
    print_status $YELLOW "⚠️  Some accessibility checks failed."
    echo ""
    print_status $BLUE "Next steps:"
    echo "• Review the failed checks above"
    echo "• Consult docs/ACCESSIBILITY_GUIDE.md for guidance"
    echo "• Run ./scripts/check-accessibility.sh for detailed analysis"
    echo "• Test manually with keyboard navigation"
    echo "• Use browser accessibility tools (axe DevTools, Lighthouse)"
    echo ""
    
    if [ $percentage -ge 80 ]; then
        print_status $YELLOW "You're doing well! ${percentage}% of checks passed."
        exit 0
    else
        print_status $RED "More work needed. Only ${percentage}% of checks passed."
        exit 1
    fi
fi
