// Test setup for property-based testing with fast-check
import fc from 'fast-check';

// Configure fast-check for consistent test runs
fc.configureGlobal({
  numRuns: 100, // Minimum 100 iterations per property test as specified
  seed: 42, // Fixed seed for reproducible tests in CI
  verbose: true
});

// Global test utilities
global.fc = fc;