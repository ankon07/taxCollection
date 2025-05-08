# ZKP Tax System Backend Tests

This directory contains test files for the ZKP Tax System backend. These tests ensure that the backend API endpoints are working correctly and that the integration between the frontend, backend, and blockchain is properly configured.

## Test Files

- `userRoutes.test.js`: Tests for user authentication and profile management endpoints
- `taxRoutes.test.js`: Tests for tax calculation and payment endpoints
- `zkpRoutes.test.js`: Tests for Zero-Knowledge Proof generation and verification endpoints
- `blockchainRoutes.test.js`: Tests for blockchain interaction endpoints
- `integration.test.js`: Tests for integration between frontend, backend, and blockchain
- `runTests.js`: Script to run all tests sequentially

## Running Tests

You can run the tests using the following npm scripts:

```bash
# Run all tests
npm test

# Run tests in watch mode (automatically re-run when files change)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests sequentially using the custom runner
npm run test:run
```

## Test Coverage

The tests cover the following aspects of the system:

1. **API Endpoints**: Verify that all API endpoints are working correctly and returning the expected responses.
2. **Authentication**: Test user registration, login, and authentication middleware.
3. **Zero-Knowledge Proofs**: Test ZKP generation, verification, and storage.
4. **Blockchain Integration**: Test interaction with blockchain contracts.
5. **Frontend-Backend Integration**: Verify that the frontend can communicate with the backend.
6. **Backend-Blockchain Integration**: Verify that the backend can communicate with the blockchain.

## Test Environment

The tests use an in-memory MongoDB database for testing, so no actual database is affected. The blockchain interactions are mocked to avoid the need for a running blockchain node during testing.

## Adding New Tests

When adding new tests, follow these guidelines:

1. Create a new test file in the `tests` directory with a `.test.js` extension.
2. Import the necessary modules and set up the test environment.
3. Use Jest's `describe` and `it` functions to organize your tests.
4. Clean up any resources created during testing in the `afterEach` or `afterAll` hooks.
5. Add your new test file to the `runTests.js` script if needed.

## Troubleshooting

If you encounter issues running the tests:

1. Make sure MongoDB is installed and running.
2. Check that all dependencies are installed (`npm install`).
3. Verify that the environment variables are set correctly.
4. Check for any syntax errors in your test files.
5. Try running a single test file to isolate the issue: `npx jest path/to/test/file.js`.
