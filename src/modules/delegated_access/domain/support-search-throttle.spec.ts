import {
  DEFAULT_IP_SEARCH_LIMITS,
  DEFAULT_SEARCH_LIMITS,
  evaluateSearchRate,
  ipSearchLimitsFromEnv,
  searchLimitsFromEnv,
  slidingEstimate,
} from './support-search-throttle';
import { checkExactPatientSearch, isRealDate } from './support-patient-rules';

describe('evaluateSearchRate', () => {
  const limits = { perMinute: 20, perDay: 200 };

  it('admite una búsqueda con poco volumen y sin alarma', () => {
    expect(evaluateSearchRate({ lastMinute: 2, lastDay: 10 }, limits)).toEqual({
      allowed: true,
      anomalous: false,
    });
  });

  it('niega al superar el tope por minuto', () => {
    expect(evaluateSearchRate({ lastMinute: 20, lastDay: 30 }, limits)).toEqual(
      { allowed: false, exceeded: 'MINUTE', anomalous: true },
    );
  });

  it('niega al superar el tope por día aunque el minuto esté tranquilo', () => {
    expect(evaluateSearchRate({ lastMinute: 0, lastDay: 200 }, limits)).toEqual(
      { allowed: false, exceeded: 'DAY', anomalous: true },
    );
  });

  it('marca anomalía cerca del tope sin negar todavía', () => {
    const verdict = evaluateSearchRate({ lastMinute: 16, lastDay: 40 }, limits);
    expect(verdict.allowed).toBe(true);
    expect(verdict.anomalous).toBe(true);
  });
});

describe('searchLimitsFromEnv', () => {
  it('sin variables usa los topes por defecto', () => {
    expect(searchLimitsFromEnv({})).toEqual(DEFAULT_SEARCH_LIMITS);
  });

  it('toma los configurados', () => {
    expect(
      searchLimitsFromEnv({
        SUPPORT_PATIENT_SEARCH_PER_MINUTE: '5',
        SUPPORT_PATIENT_SEARCH_PER_DAY: '50',
      }),
    ).toEqual({ perMinute: 5, perDay: 50 });
  });

  it('un valor inválido, cero o negativo no abre el tope', () => {
    expect(
      searchLimitsFromEnv({
        SUPPORT_PATIENT_SEARCH_PER_MINUTE: '0',
        SUPPORT_PATIENT_SEARCH_PER_DAY: 'mucho',
      }),
    ).toEqual(DEFAULT_SEARCH_LIMITS);
  });
});

describe('fecha de nacimiento real en la búsqueda exacta', () => {
  it.each(['9999-99-99', '2020-02-31', '1850-01-01', '2999-01-01', 'hoy'])(
    '%s no es una fecha admisible',
    (value) => {
      expect(isRealDate(value)).toBe(false);
      expect(
        checkExactPatientSearch({
          fullName: 'Juan Pérez',
          birthDate: value,
        }).allowed,
      ).toBe(false);
    },
  );

  it('una fecha real con nombre completo es una búsqueda exacta', () => {
    expect(isRealDate('1984-05-17')).toBe(true);
    expect(
      checkExactPatientSearch({
        fullName: 'Juan Pérez',
        birthDate: '1984-05-17',
      }).mode,
    ).toBe('FULL_NAME_BIRTH_DATE');
  });
});

describe('ipSearchLimitsFromEnv (N4)', () => {
  it('sin variables usa los topes por IP por defecto (más holgados que los de la persona)', () => {
    const limits = ipSearchLimitsFromEnv({});
    expect(limits).toEqual(DEFAULT_IP_SEARCH_LIMITS);
    expect(limits.perMinute).toBeGreaterThan(DEFAULT_SEARCH_LIMITS.perMinute);
    expect(limits.perDay).toBeGreaterThan(DEFAULT_SEARCH_LIMITS.perDay);
  });

  it('toma los configurados y un valor inválido no abre el tope', () => {
    expect(
      ipSearchLimitsFromEnv({
        SUPPORT_PATIENT_SEARCH_IP_PER_MINUTE: '7',
        SUPPORT_PATIENT_SEARCH_IP_PER_DAY: '-3',
      }),
    ).toEqual({ perMinute: 7, perDay: DEFAULT_IP_SEARCH_LIMITS.perDay });
  });
});

describe('slidingEstimate (N4)', () => {
  it('al inicio de una ventana lo de la anterior pesa casi entero', () => {
    expect(slidingEstimate(1, 20, 0.01)).toBe(20);
  });

  it('a mitad de ventana pesa la mitad', () => {
    expect(slidingEstimate(5, 20, 0.5)).toBe(15);
  });

  it('al final de la ventana la anterior ya no pesa', () => {
    expect(slidingEstimate(5, 20, 1)).toBe(5);
  });

  it('sin ventana anterior es solo la actual', () => {
    expect(slidingEstimate(7, 0, 0.2)).toBe(7);
  });
});
