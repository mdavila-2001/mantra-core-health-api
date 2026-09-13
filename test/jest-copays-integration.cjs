const integration = require('./jest-integration.json');

module.exports = {
  ...integration,
  testMatch: ['<rootDir>/test/integration/patient-coverage-copays.int-spec.ts'],
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
};
