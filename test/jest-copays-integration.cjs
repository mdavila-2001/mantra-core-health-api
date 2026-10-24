const integration = require('./jest-integration.json');

module.exports = {
  ...integration,
  // El crawler necesita fuentes y fixtures; dist/src duplica el build generado.
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['<rootDir>/test/integration/patient-coverage-copays.int-spec.ts'],
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
};
