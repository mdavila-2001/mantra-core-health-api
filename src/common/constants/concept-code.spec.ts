import { CONCEPTS } from './concepts';
import { conceptCode } from './concept-code';

describe('conceptCode', () => {
  it('traduce ids conocidos, marca los desconocidos y respeta la ausencia', () => {
    expect(conceptCode(CONCEPTS.RUN_PASSED)).toBe('RUN_PASSED');
    expect(conceptCode(CONCEPTS.QA_ENV_STAGING)).toBe('ENV_STAGING');
    expect(conceptCode('00000000-0000-0000-0000-000000000000')).toBe('UNKNOWN');
    expect(conceptCode(null)).toBeNull();
  });
});
