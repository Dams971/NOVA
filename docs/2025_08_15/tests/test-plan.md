# NOVA RDV - Test Plan for Error Handler and API Fixes

## Document Information

- **Date**: 2025-08-15
- **Version**: 1.0
- **Author**: Claude Testing Specialist
- **Project**: NOVA RDV
- **Scope**: Error Handler Utility and API Route Testing

## Executive Summary

This test plan covers comprehensive testing for the NOVA RDV fixes implemented in the error handling utilities and API routes. The testing strategy ensures 95%+ code coverage, type safety, and French language support while maintaining high performance standards.

## Test Scope

### Components Under Test

1. **Error Handler Utility** (`src/lib/utils/error-handler.ts`)
   - Type-safe error message extraction
   - Error categorization and routing
   - Standardized error response creation
   - Comprehensive logging functionality

2. **Appointments Create API** (`src/app/api/appointments/create/route.ts`)
   - Appointment creation workflow
   - Input validation and sanitization
   - Business logic validation (working hours, scheduling conflicts)
   - Error handling and response formatting

3. **Sign-in OTP API** (`src/app/api/auth/sign-in-otp/route.ts`)
   - OTP authentication flow
   - Email validation and user existence checks
   - Error categorization and proper HTTP status codes
   - Integration with external services

## Test Strategy

### Testing Levels

#### 1. Unit Testing
- **Target Coverage**: 95%+
- **Framework**: Vitest with jsdom
- **Focus**: Individual function behavior, edge cases, error paths
- **Files**:
  - `src/lib/utils/__tests__/error-handler.test.ts`

#### 2. Integration Testing
- **Target Coverage**: 90%+
- **Framework**: Vitest with mocked dependencies
- **Focus**: API endpoint behavior, request/response handling
- **Files**:
  - `src/app/api/appointments/__tests__/create.test.ts`
  - `src/app/api/auth/__tests__/sign-in-otp.test.ts`

#### 3. Performance Testing
- **Target**: Sub-second response times
- **Focus**: Concurrent request handling, memory usage
- **Integrated**: Within unit and integration tests

### Test Categories

#### Functional Testing
- **Happy Path Scenarios**: All valid inputs and expected workflows
- **Error Path Scenarios**: Invalid inputs, system failures, edge cases
- **Business Logic**: Working hours, appointment conflicts, user validation
- **Data Validation**: Input sanitization, format validation, required fields

#### Non-Functional Testing
- **Performance**: Response times, memory usage, concurrent handling
- **Security**: Input validation, error message sanitization
- **Accessibility**: French language support, special characters
- **Maintainability**: Type safety, code clarity, error traceability

#### Specialized Testing
- **French Language Support**: Accented characters, French error messages
- **Algerian Context**: Phone number validation, timezone handling
- **Healthcare Compliance**: Data sanitization, privacy protection

## Test Environment

### Setup Requirements
```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run specific test suites
npm run test:api
npm run test:run

# Run with coverage
npm test -- --coverage
```

### Environment Configuration
- **Node.js**: 18+
- **Test Framework**: Vitest 3.2.4+
- **Environment**: jsdom for DOM simulation
- **Mocking**: vi.mock for service dependencies
- **Time**: Fake timers for predictable testing

### Test Data
- **Valid Algerian Phone Numbers**: +213[567]XXXXXXXX format
- **French Names**: Names with accents and special characters
- **Email Formats**: Various valid and invalid email patterns
- **Appointment Times**: Algeria timezone (UTC+1) considerations

## Test Cases Overview

### Error Handler Utility Tests

#### Core Functions (25 test cases)
- `getErrorMessage()`: 9 test cases covering Error objects, strings, objects, null/undefined
- `isErrorWithMessage()`: 4 test cases for type guards
- `isErrorWithCode()`: 4 test cases for code detection
- `isDatabaseError()`: 4 test cases for database error identification
- `getErrorCode()`: 4 test cases for code extraction

#### Error Processing (20 test cases)
- `createErrorResponse()`: 5 test cases for response formatting
- `createAppError()`: 4 test cases for AppError creation
- `errorContains()`: 5 test cases for pattern matching
- `logError()`: 6 test cases for structured logging

#### Specialized Handlers (15 test cases)
- `handleDatabaseError()`: 6 test cases for database-specific errors
- `handleAuthError()`: 5 test cases for authentication errors
- `handleValidationError()`: 4 test cases for validation errors

#### Integration & Edge Cases (20 test cases)
- `handleError()`: 7 test cases for comprehensive error routing
- Type Safety: 4 test cases for TypeScript compliance
- French Language: 3 test cases for localization
- Performance: 3 test cases for memory and speed
- Edge Cases: 3 test cases for extreme scenarios

**Total Error Handler Tests**: 80 test cases

### Appointments Create API Tests

#### Successful Creation (15 test cases)
- Valid appointment creation with all fields
- Appointment without email
- French patient names and reasons
- Local time formatting
- Email confirmation handling

#### Validation Errors (20 test cases)
- Missing required fields
- Invalid phone number formats (8 scenarios)
- Invalid email formats
- Past appointment times
- Invalid time ranges

#### Working Hours Validation (10 test cases)
- Before/after working hours
- Lunch break restrictions
- Valid hour acceptance
- Algeria timezone handling

#### Data Handling (10 test cases)
- Input sanitization and trimming
- Null/undefined field handling
- Special characters in names
- Duration validation

#### Error Scenarios (10 test cases)
- Malformed JSON
- Empty request body
- Database error simulation
- Service failure handling

#### Edge Cases & Performance (15 test cases)
- Long patient names
- Special characters
- Minimal/maximum durations
- Concurrent requests
- French language scenarios

**Total Appointments Tests**: 80 test cases

### Sign-in OTP API Tests

#### Successful Authentication (15 test cases)
- Existing user OTP request
- New user creation
- French email addresses
- Custom notification emails
- Default parameter handling

#### Validation Errors (15 test cases)
- Missing/null/invalid email
- Invalid email formats (8 scenarios)
- Valid email format acceptance

#### User Management (10 test cases)
- Existing vs non-existing users
- shouldCreateUser flag handling
- User existence validation

#### Service Error Handling (15 test cases)
- Invalid email auth errors
- Rate limiting
- User not found
- Unauthorized access
- Generic auth errors

#### Integration & Resilience (10 test cases)
- Email service failures
- Error logging
- Malformed requests
- Service initialization errors

#### Edge Cases & Security (15 test cases)
- Long email addresses
- Special characters
- Whitespace handling
- Case sensitivity
- Algerian domains

**Total OTP Tests**: 80 test cases

## Test Execution

### Continuous Integration
```yaml
# Test execution in CI/CD
test-unit:
  script: npm run test:run src/lib/utils
  coverage: 95%

test-integration:
  script: npm run test:run src/app/api
  coverage: 90%

test-performance:
  script: npm test -- --run --reporter=json
  threshold: 1000ms per test
```

### Local Development
```bash
# Watch mode for development
npm test

# Run specific test file
npm test error-handler.test.ts

# Run with debugging
DEBUG_TESTS=true npm test

# Generate coverage report
npm test -- --coverage --reporter=html
```

### Test Quality Gates

#### Coverage Requirements
- **Line Coverage**: Minimum 95% for utilities, 90% for APIs
- **Branch Coverage**: Minimum 90% for all components
- **Function Coverage**: 100% for all exported functions

#### Performance Requirements
- **Unit Tests**: < 100ms per test
- **Integration Tests**: < 1000ms per test
- **Total Suite**: < 30 seconds

#### Quality Metrics
- **Test Reliability**: 0% flaky tests
- **Maintainability**: Clear test names, minimal duplication
- **Documentation**: Comprehensive test descriptions

## Risk Assessment

### High Risk Areas
1. **Time Zone Handling**: Algeria UTC+1 calculations
2. **Phone Validation**: Algerian mobile number formats
3. **Error Propagation**: Sensitive information leakage
4. **Service Integration**: External dependency failures

### Mitigation Strategies
1. **Comprehensive Edge Case Testing**: Cover all boundary conditions
2. **Mock Strategy**: Isolate external dependencies
3. **Error Sanitization**: Verify no sensitive data in error responses
4. **Performance Monitoring**: Track test execution times

## Success Criteria

### Test Completion Criteria
- ✅ All 240 test cases passing
- ✅ Coverage thresholds met (95% utilities, 90% APIs)
- ✅ Performance benchmarks achieved
- ✅ French language scenarios validated
- ✅ Security considerations addressed

### Acceptance Criteria
- All error paths properly handled
- Type safety maintained throughout
- French language support verified
- Algerian business rules enforced
- Performance requirements met

## Maintenance and Updates

### Test Maintenance Schedule
- **Weekly**: Review test execution times and coverage
- **Monthly**: Update test data and scenarios
- **Quarterly**: Review and update test strategy

### Documentation Updates
- Update test plan for new features
- Maintain test case documentation
- Keep performance benchmarks current

### Continuous Improvement
- Analyze test failures for patterns
- Optimize slow-running tests
- Expand coverage for edge cases
- Enhance French language testing

---

**Test Plan Status**: ✅ Complete
**Implementation Date**: 2025-08-15
**Next Review**: 2025-09-15