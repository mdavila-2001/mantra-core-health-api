import { dimensionOfQuestionText } from './survey-dimensions';
import { SYSTEM_BASE_SURVEYS } from './surveys.base-definitions';
import {
  ANSWER_TYPE_CODES,
  ANSWER_TYPES_REQUIRING_OPTIONS,
} from './surveys.concepts';
import {
  CATALOG_SERVICE_KINDS,
  STANDARD_SURVEY_CATALOG,
  findStandardSurvey,
  standardSurveyForKind,
  type StandardSurveySource,
} from './surveys-standard.catalog';

/** Dimensiones que el núcleo común copia de la encuesta base. */
const CORE_DIMENSIONS = [
  'tiempo_espera',
  'trato_respetuoso',
  'claridad_explicacion',
  'seguridad_percibida',
  'satisfaccion_global',
  'recomendacion_nps',
  'comentario_abierto',
];

describe('STANDARD_SURVEY_CATALOG', () => {
  it('los códigos son únicos, en mayúsculas y con la forma STD_<KIND>_V<n>', () => {
    const codes = STANDARD_SURVEY_CATALOG.map((s) => s.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const survey of STANDARD_SURVEY_CATALOG) {
      expect(survey.code).toMatch(/^STD_[A-Z_]+_V\d+$/);
      expect(survey.code).toBe(
        `STD_${survey.serviceKinds[0]}_V${survey.code.split('_V').pop()}`,
      );
    }
  });

  it('cubre cada tipo de servicio exactamente una vez, salvo la consulta', () => {
    const kinds = STANDARD_SURVEY_CATALOG.flatMap((s) => s.serviceKinds);
    expect([...kinds].sort()).toEqual([...CATALOG_SERVICE_KINDS].sort());
    expect(kinds).not.toContain('CONSULTATION');
    for (const kind of CATALOG_SERVICE_KINDS) {
      expect(standardSurveyForKind(kind)?.serviceKinds).toContain(kind);
    }
    expect(standardSurveyForKind('CONSULTATION')).toBeUndefined();
  });

  it('cada plantilla tiene título, consigna y entre 6 y 12 preguntas', () => {
    for (const survey of STANDARD_SURVEY_CATALOG) {
      expect(survey.title.trim().length).toBeGreaterThan(0);
      expect(survey.description.trim().length).toBeGreaterThan(0);
      expect(survey.questions.length).toBeGreaterThanOrEqual(6);
      expect(survey.questions.length).toBeLessThanOrEqual(12);
    }
  });

  it('cada fuente tiene instrumento, licencia y url https', () => {
    const check = (source: StandardSurveySource): void => {
      expect(source.instrument.trim().length).toBeGreaterThan(0);
      expect(source.license.trim().length).toBeGreaterThan(0);
      expect(() => new URL(source.url)).not.toThrow();
      expect(new URL(source.url).protocol).toBe('https:');
    };
    for (const survey of STANDARD_SURVEY_CATALOG) {
      check(survey.source);
      survey.additionalSources.forEach(check);
    }
  });

  it('ninguna fuente es propietaria (Press Ganey, Picker, PSQ-18 RAND)', () => {
    const all = STANDARD_SURVEY_CATALOG.flatMap((s) => [
      s.source,
      ...s.additionalSources,
    ]);
    for (const source of all) {
      expect(source.instrument).not.toMatch(/press ganey|picker|psq/i);
    }
  });

  describe.each(STANDARD_SURVEY_CATALOG.map((s) => [s.code, s] as const))(
    '%s',
    (_code, survey) => {
      it.each(survey.questions.map((q, i) => [i + 1, q] as const))(
        'la pregunta %i es válida para su tipo',
        (_position, q) => {
          expect(ANSWER_TYPE_CODES).toContain(q.answerType);
          // Mismos límites que AddQuestionDto.
          expect(q.text.trim().length).toBeGreaterThan(0);
          expect(q.text.length).toBeLessThanOrEqual(500);
          expect(q.required).toBe(false);
          expect(q.dimension).toMatch(/^[a-z_]+$/);

          if (ANSWER_TYPES_REQUIRING_OPTIONS.includes(q.answerType)) {
            expect(q.options).toBeDefined();
            const options = q.options ?? [];
            expect(options.length).toBeGreaterThanOrEqual(2);
            expect(options.length).toBeLessThanOrEqual(20);
            expect(new Set(options).size).toBe(options.length);
            for (const option of options) {
              expect(option.trim().length).toBeGreaterThan(0);
              expect(option.length).toBeLessThanOrEqual(200);
            }
          } else {
            expect(q.options).toBeUndefined();
          }

          if (q.answerType === 'SCALE') {
            expect(Number.isInteger(q.scaleMin)).toBe(true);
            expect(Number.isInteger(q.scaleMax)).toBe(true);
            expect(q.scaleMin).toBeGreaterThanOrEqual(0);
            expect(q.scaleMax).toBeLessThanOrEqual(100);
            expect(q.scaleMax).toBeGreaterThan(q.scaleMin ?? 0);
          } else {
            expect(q.scaleMin).toBeUndefined();
            expect(q.scaleMax).toBeUndefined();
          }
        },
      );

      it('no repite enunciados', () => {
        const texts = survey.questions.map((q) => q.text);
        expect(new Set(texts).size).toBe(texts.length);
      });

      it('incluye el núcleo común, literal de la encuesta base', () => {
        const dims = survey.questions.map((q) => q.dimension);
        for (const dimension of CORE_DIMENSIONS) {
          expect(dims).toContain(dimension);
        }
        // El resumen reconoce la dimensión del núcleo por el enunciado: si la
        // base cambia de redacción, esto falla y hay que sacar una _V2.
        for (const q of survey.questions) {
          if (CORE_DIMENSIONS.includes(q.dimension)) {
            expect(dimensionOfQuestionText(q.text)).toBe(q.dimension);
          }
        }
      });

      it('la satisfacción global es 1-5 y la recomendación 0-10', () => {
        const overall = survey.questions.find(
          (q) => q.dimension === 'satisfaccion_global',
        );
        const nps = survey.questions.find(
          (q) => q.dimension === 'recomendacion_nps',
        );
        expect([overall?.scaleMin, overall?.scaleMax]).toEqual([1, 5]);
        expect([nps?.scaleMin, nps?.scaleMax]).toEqual([0, 10]);
      });

      it('la pregunta de seguridad conserva la opción de alerta de la base', () => {
        const safety = survey.questions.find(
          (q) => q.dimension === 'seguridad_percibida',
        );
        expect(safety?.options).toEqual(
          SYSTEM_BASE_SURVEYS.SERVICE.questions.find(
            (q) => q.dimension === 'seguridad_percibida',
          )?.options,
        );
      });
    },
  );

  it('título y consigna caben en los límites de CreateTemplateDto', () => {
    for (const survey of STANDARD_SURVEY_CATALOG) {
      expect(survey.title.length).toBeLessThanOrEqual(200);
      expect(survey.description.length).toBeLessThanOrEqual(2000);
    }
  });
});

describe('findStandardSurvey', () => {
  it('encuentra cada código, sin distinguir mayúsculas ni espacios', () => {
    for (const survey of STANDARD_SURVEY_CATALOG) {
      expect(findStandardSurvey(survey.code)).toBe(survey);
      expect(findStandardSurvey(` ${survey.code.toLowerCase()} `)).toBe(survey);
    }
  });

  it('devuelve undefined para un código desconocido', () => {
    expect(findStandardSurvey('STD_NOPE_V1')).toBeUndefined();
    expect(findStandardSurvey('')).toBeUndefined();
  });
});
