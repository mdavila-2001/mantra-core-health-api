/** Fases del check-list de cirugía segura de la OMS. */
export type OmsPhase = 'SIGN_IN' | 'TIME_OUT' | 'SIGN_OUT';

/** Versión del check-list sembrada (OMS 2009). */
export const OMS_CHECKLIST_VERSION = '2009';

/** Un ítem del check-list. */
export interface OmsItem {
  /** Código estable del ítem dentro de la versión. */
  readonly code: string;
  /** Fase a la que pertenece. */
  readonly phase: OmsPhase;
  /** Texto de la pregunta. */
  readonly prompt: string;
}

/**
 * Ítems del check-list de seguridad de la cirugía de la OMS (2009): Entrada 7, Pausa 7 y
 * Salida 5. Se siembran en `surgical_safety_items` al crear el primer check-list, porque el
 * paquete de semillas del modelo no los trae completos (CONTRATO-F2-F5 §F4.1). Todos son
 * obligatorios: «no corresponde» es una respuesta válida, no una omisión.
 */
export const OMS_2009_ITEMS: readonly OmsItem[] = [
  {
    code: 'SI_01',
    phase: 'SIGN_IN',
    prompt:
      '¿El paciente ha confirmado su identidad, el sitio quirúrgico, el procedimiento y su consentimiento?',
  },
  {
    code: 'SI_02',
    phase: 'SIGN_IN',
    prompt: '¿Se ha marcado el sitio quirúrgico?',
  },
  {
    code: 'SI_03',
    phase: 'SIGN_IN',
    prompt: '¿Se ha completado el control de la seguridad de la anestesia?',
  },
  {
    code: 'SI_04',
    phase: 'SIGN_IN',
    prompt: '¿Se ha colocado el pulsioxímetro al paciente y funciona?',
  },
  {
    code: 'SI_05',
    phase: 'SIGN_IN',
    prompt: '¿Tiene el paciente alergias conocidas?',
  },
  {
    code: 'SI_06',
    phase: 'SIGN_IN',
    prompt: '¿Tiene el paciente vía aérea difícil o riesgo de aspiración?',
  },
  {
    code: 'SI_07',
    phase: 'SIGN_IN',
    prompt: '¿Hay riesgo de hemorragia mayor de 500 ml (7 ml/kg en niños)?',
  },
  {
    code: 'TO_01',
    phase: 'TIME_OUT',
    prompt:
      '¿Todos los miembros del equipo se han presentado por su nombre y función?',
  },
  {
    code: 'TO_02',
    phase: 'TIME_OUT',
    prompt:
      '¿Se han confirmado la identidad del paciente, el sitio quirúrgico y el procedimiento?',
  },
  {
    code: 'TO_03',
    phase: 'TIME_OUT',
    prompt:
      '¿Se ha administrado profilaxis antibiótica en los últimos 60 minutos?',
  },
  {
    code: 'TO_04',
    phase: 'TIME_OUT',
    prompt:
      'Cirujano: ¿pasos críticos o imprevistos, duración de la operación y pérdida de sangre prevista?',
  },
  {
    code: 'TO_05',
    phase: 'TIME_OUT',
    prompt: 'Anestesia: ¿hay preocupaciones específicas del paciente?',
  },
  {
    code: 'TO_06',
    phase: 'TIME_OUT',
    prompt:
      'Enfermería: ¿se ha confirmado la esterilidad y hay dudas con el instrumental o los equipos?',
  },
  {
    code: 'TO_07',
    phase: 'TIME_OUT',
    prompt: '¿Pueden visualizarse las imágenes diagnósticas esenciales?',
  },
  {
    code: 'SO_01',
    phase: 'SIGN_OUT',
    prompt: '¿Se ha confirmado el nombre del procedimiento realizado?',
  },
  {
    code: 'SO_02',
    phase: 'SIGN_OUT',
    prompt: '¿Son correctos los recuentos de instrumentos, gasas y agujas?',
  },
  {
    code: 'SO_03',
    phase: 'SIGN_OUT',
    prompt: '¿Se han etiquetado las muestras (lectura en voz alta)?',
  },
  {
    code: 'SO_04',
    phase: 'SIGN_OUT',
    prompt: '¿Hay problemas con el instrumental o los equipos que resolver?',
  },
  {
    code: 'SO_05',
    phase: 'SIGN_OUT',
    prompt:
      'Cirujano, anestesista y enfermería: ¿cuáles son los aspectos principales de la recuperación y el tratamiento?',
  },
];
