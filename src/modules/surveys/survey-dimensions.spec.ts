import {
  SURVEY_DIMENSIONS,
  dimensionOfQuestionText,
  isSafetyAlertOption,
  normalizeSurveyText,
} from './survey-dimensions';

describe('survey-dimensions', () => {
  it('reconoce las nueve preguntas base de la consulta, en orden', () => {
    const consulta = [
      '¿Qué tan fácil le resultó tener esta consulta, desde pedir la cita hasta que comenzó la atención? (1 = Muy difícil, 5 = Muy fácil)',
      'Desde la hora acordada, ¿cuánto tiempo esperó hasta que comenzó su consulta? Incluya la espera en sala o en la videollamada.',
      'En esta consulta, ¿con qué frecuencia el profesional le escuchó con atención? (1 = Nunca, 5 = Siempre)',
      'En esta consulta, ¿con qué frecuencia el profesional le explicó las cosas de una forma que usted pudo entender? (1 = Nunca, 5 = Siempre)',
      'En esta consulta, ¿con qué frecuencia el profesional le trató con cortesía y respeto? (1 = Nunca, 5 = Siempre)',
      'Durante esta consulta, ¿tuvo algún problema de seguridad o de trato que quiera reportar? (por ejemplo: falta de respeto, falta de privacidad, un posible error o una indicación que le pareció insegura)',
      'En general, ¿cómo calificaría su experiencia con esta consulta? (1 = Muy mala, 5 = Excelente)',
      '¿Qué tan probable es que usted recomiende a este profesional a un familiar o a un amigo que necesite una atención parecida? (0 = Nada probable, 10 = Totalmente probable)',
      'Si lo desea, cuéntenos qué podríamos hacer mejor.',
    ];
    expect(consulta.map(dimensionOfQuestionText)).toEqual([
      ...SURVEY_DIMENSIONS,
    ]);
  });

  it('reconoce las preguntas base del servicio con las mismas dimensiones', () => {
    expect(
      dimensionOfQuestionText(
        'En general, ¿cómo calificaría su experiencia con este servicio? (1 = Muy mala, 5 = Excelente)',
      ),
    ).toBe('satisfaccion_global');
    expect(
      dimensionOfQuestionText(
        'Desde la hora acordada (o desde que llegó, si no tenía hora), ¿cuánto esperó hasta que le atendieron?',
      ),
    ).toBe('tiempo_espera');
  });

  it('tolera mayúsculas, tildes, espacios y un cambio en el ancla de la escala', () => {
    expect(
      dimensionOfQuestionText(
        '  EN GENERAL, ¿CÓMO CALIFICARÍA SU EXPERIENCIA  CON ESTA CONSULTA? (1 = Pésima, 5 = Perfecta)',
      ),
    ).toBe('satisfaccion_global');
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

  it('cuenta como alerta sólo la opción que pide contacto', () => {
    expect(
      isSafetyAlertOption(
        'Sí, y deseo que ALOVIDA me contacte para dar seguimiento',
      ),
    ).toBe(true);
    expect(isSafetyAlertOption('si, y deseo que alovida me contacte')).toBe(
      true,
    );
    expect(isSafetyAlertOption('Sí, pero no deseo que me contacten')).toBe(
      false,
    );
    expect(isSafetyAlertOption('No, no tuve ningún problema')).toBe(false);
  });
});
