#!/bin/bash

# Patient Management Test Suite Runner
# This script runs all tests related to patient management functionality

echo "🧪 Running Patient Management Test Suite"
echo "========================================"

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

# Function to run tests and capture results
run_test_suite() {
    local test_pattern=$1
    local suite_name=$2
    
    print_status $BLUE "Running $suite_name..."
    
    if npm run test -- --run "$test_pattern" --reporter=verbose; then
        print_status $GREEN "✅ $suite_name passed"
        return 0
    else
        print_status $RED "❌ $suite_name failed"
        return 1
    fi
}

# Initialize counters
total_suites=0
passed_suites=0
failed_suites=0

echo ""
print_status $YELLOW "Starting test execution..."
echo ""

# Test Suite 1: Patient Service Tests
total_suites=$((total_suites + 1))
if run_test_suite "src/test/services/patient-service.test.ts" "Patient Service Tests"; then
    passed_suites=$((passed_suites + 1))
else
    failed_suites=$((failed_suites + 1))
fi

echo ""

# Test Suite 2: Patient Search Service Tests
total_suites=$((total_suites + 1))
if run_test_suite "src/test/services/patient-search-service.test.ts" "Patient Search Service Tests"; then
    passed_suites=$((passed_suites + 1))
else
    failed_suites=$((failed_suites + 1))
fi

echo ""

# Test Suite 3: Patient Management Component Tests
total_suites=$((total_suites + 1))
if run_test_suite "src/test/components/manager/PatientManagement.test.tsx" "Patient Management Component Tests"; then
    passed_suites=$((passed_suites + 1))
else
    failed_suites=$((failed_suites + 1))
fi

echo ""

# Test Suite 4: Patient Form Component Tests
total_suites=$((total_suites + 1))
if run_test_suite "src/test/components/manager/PatientForm.test.tsx" "Patient Form Component Tests"; then
    passed_suites=$((passed_suites + 1))
else
    failed_suites=$((failed_suites + 1))
fi

echo ""

# Test Suite 5: Integration Tests
total_suites=$((total_suites + 1))
if run_test_suite "src/test/integration/patient-management.test.ts" "Patient Management Integration Tests"; then
    passed_suites=$((passed_suites + 1))
else
    failed_suites=$((failed_suites + 1))
fi

echo ""
echo "========================================"
print_status $BLUE "Test Suite Summary"
echo "========================================"
echo "Total test suites: $total_suites"
print_status $GREEN "Passed: $passed_suites"
print_status $RED "Failed: $failed_suites"

if [ $failed_suites -eq 0 ]; then
    print_status $GREEN "🎉 All patient management tests passed!"
    echo ""
    print_status $YELLOW "Running coverage report..."
    npm run test:coverage -- --run "src/test/**/*patient*.test.*"
    exit 0
else
    print_status $RED "💥 Some tests failed. Please check the output above."
    exit 1
fi
