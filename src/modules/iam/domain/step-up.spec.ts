import {
  DEFAULT_STEP_UP_MAX_AGE_MINUTES,
  DEFAULT_STEP_UP_TTL_MINUTES,
  MAX_STEP_UP_MAX_AGE_MINUTES,
  ageMinutesOf,
  clampMaxAgeMinutes,
  isStepUpFresh,
  parseStepUpStamp,
  stepUpKey,
  stepUpTtlMinutes,
} from './step-up';

describe('step-up (dominio puro)', () => {
  describe('stepUpKey', () => {
    it('ata el sello a la sesión con el prefijo del contrato', () => {
      expect(stepUpKey('sid-1')).toBe('stepup:sid-1');
    });
  });

  describe('stepUpTtlMinutes (SUPPORT_STEP_UP_TTL_MIN)', () => {
    it('sin variable vale 60', () => {
      expect(stepUpTtlMinutes({})).toBe(DEFAULT_STEP_UP_TTL_MINUTES);
      expect(DEFAULT_STEP_UP_TTL_MINUTES).toBe(60);
    });
    it('acepta un entero positivo', () => {
      expect(stepUpTtlMinutes({ SUPPORT_STEP_UP_TTL_MIN: '15' })).toBe(15);
    });
    it.each(['', '0', '-5', 'abc', '1.5', 'NaN', '99999', ' '])(
      'un valor inválido (%j) deja el de por defecto, nunca abre un control',
      (raw) => {
        expect(stepUpTtlMinutes({ SUPPORT_STEP_UP_TTL_MIN: raw })).toBe(60);
      },
    );
  });

  describe('parseStepUpStamp', () => {
    it('lee los milisegundos guardados', () => {
      expect(parseStepUpStamp('1761830400000')).toBe(1761830400000);
    });
    it.each([null, undefined, '', 'x', '-1', '0', 'Infinity', '12abc'])(
      'un valor ilegible (%j) no es un sello',
      (raw) => {
        expect(parseStepUpStamp(raw as string | null)).toBeNull();
      },
    );
  });

  describe('ageMinutesOf', () => {
    it('devuelve la edad en minutos (fraccionaria)', () => {
      expect(ageMinutesOf(1_000_000, 1_000_000 + 90_000)).toBe(1.5);
    });
    it('un sello del futuro (reloj desfasado) cuenta como recién hecho, no como negativo', () => {
      expect(ageMinutesOf(2_000_000, 1_000_000)).toBe(0);
    });
  });

  describe('isStepUpFresh / clampMaxAgeMinutes', () => {
    it('sin sello no es fresco', () => {
      expect(isStepUpFresh(null, 10)).toBe(false);
    });
    it('es fresco hasta el límite inclusive y deja de serlo después', () => {
      expect(isStepUpFresh(10, 10)).toBe(true);
      expect(isStepUpFresh(10.01, 10)).toBe(false);
      expect(isStepUpFresh(0, 10)).toBe(true);
    });
    it('el límite por defecto es 10 y el máximo 60', () => {
      expect(DEFAULT_STEP_UP_MAX_AGE_MINUTES).toBe(10);
      expect(MAX_STEP_UP_MAX_AGE_MINUTES).toBe(60);
      expect(clampMaxAgeMinutes(undefined)).toBe(10);
      expect(clampMaxAgeMinutes(0)).toBe(1);
      expect(clampMaxAgeMinutes(500)).toBe(60);
      expect(clampMaxAgeMinutes(7.8)).toBe(7);
      expect(clampMaxAgeMinutes(Number.NaN)).toBe(10);
    });
  });
});
