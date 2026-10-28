import {
  NPS_DIMENSION,
  SAFETY_DIMENSION,
  SURVEY_DIMENSIONS,
  dimensionOfQuestionText,
  dimensionOfSystemQuestion,
  isSafetyAlertOption,
  normalizeSurveyText,
} from './survey-dimensions';
import {
  SYSTEM_BASE_SURVEYS,
  SYSTEM_SURVEY_KINDS,
} from './surveys.base-definitions';

/**
 * Los enunciados y las dimensiones salen de `SYSTEM_BASE_SURVEYS`: estas pruebas
 * no repiten ningún texto, comparan contra esa definición. El contenido literal
 * de la encuesta base lo cubre `surveys-system-templates.service.spec.ts`.
 */
describe('survey-dimensions', () => {
  it('las dimensiones son las de la definición base, en el orden de la consulta', () => {
    expect([...SURVEY_DIMENSIONS]).toEqual(
      SYSTEM_BASE_SURVEYS.CONSULTATION.questions.map((q) => q.dimension),
    );
    // Todas las dimensiones del servicio están entre las de la consulta.
    for (const q of SYSTEM_BASE_SURVEYS.SERVICE.questions) {
      expect(SURVEY_DIMENSIONS).toContain(q.dimension);
    }
  });

  it('cada pregunta base se reconoce por su enunciado con la dimensión que declara', () => {
    for (const kind of SYSTEM_SURVEY_KINDS) {
      for (const q of SYSTEM_BASE_SURVEYS[kind].questions) {
        expect(dimensionOfQuestionText(q.text)).toBe(q.dimension);
        expect(dimensionOfSystemQuestion(kind, q.position, q.text)).toBe(
          q.dimension,
        );
      }
    }
  });

  it('en una plantilla de sistema manda la posición de la definición, con el texto guardado como guarda', () => {
    const nps = SYSTEM_BASE_SURVEYS.CONSULTATION.questions.find(
      (q) => q.dimension === NPS_DIMENSION,
    )!;
    // Mismo enunciado con otra ancla de escala: sigue siendo la misma pregunta.
    expect(
      dimensionOfSystemQuestion(
        'CONSULTATION',
        nps.position,
        `${nps.text.replace(/\s*\(0 =.*\)$/, '')} (0 = Nada, 10 = Todo)`,
      ),
    ).toBe(NPS_DIMENSION);
    // Una versión histórica con otro texto en esa posición no hereda la dimensión.
    expect(
      dimensionOfSystemQuestion('CONSULTATION', nps.position, '¿Le gustó?'),
    ).toBeNull();
  });

  it('tolera mayúsculas, tildes, espacios y un cambio en el ancla de la escala', () => {
    const global = SYSTEM_BASE_SURVEYS.CONSULTATION.questions.find(
      (q) => q.dimension === 'satisfaccion_global',
    )!;
    const noisy = `  ${global.text.toUpperCase().replace(/\(.*\)$/, '(1 = Pésima, 5 = Perfecta)')}  `;
    expect(dimensionOfQuestionText(noisy)).toBe('satisfaccion_global');
  });

  it('una pregunta propia no tiene dimensión', () => {
    expect(dimensionOfQuestionText('¿Le gustó la sala de espera?')).toBeNull();
    expect(dimensionOfQuestionText('')).toBeNull();
  });

  it('normaliza sin quitar paréntesis que no son anclas de escala', () => {
    expect(normalizeSurveyText('¿Dolor? (por ejemplo: leve)')).toBe(
      '¿dolor? (por ejemplo: leve)',
    );
    expect(normalizeSurveyText('Nivel (1 = poco, 5 = mucho)')).toBe('nivel');
  });

  it('cuenta como alerta sólo la opción que pide contacto, la de la definición base', () => {
    const options = SYSTEM_BASE_SURVEYS.CONSULTATION.questions.find(
      (q) => q.dimension === SAFETY_DIMENSION,
    )!.options!;
    expect(isSafetyAlertOption(options[1])).toBe(true);
    expect(isSafetyAlertOption(options[0])).toBe(false);
    expect(isSafetyAlertOption(options[2])).toBe(false);
    expect(isSafetyAlertOption(options[1].toLowerCase())).toBe(true);
  });
});
