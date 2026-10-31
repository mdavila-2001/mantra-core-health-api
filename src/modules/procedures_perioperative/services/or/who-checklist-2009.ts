/**
 * Ítems de la Lista OMS de verificación de la seguridad de la cirugía (OMS,
 * 2009): Entrada 7, Pausa 7, Salida 5 (CONTRATO-F2-F5 §F4.1). Se siembran desde
 * la API en `surgical_safety_items` (`checklist_version = '2009'`) si faltan.
 */
export const WHO_CHECKLIST_VERSION = '2009';

export const WHO_CHECKLIST_ITEMS: readonly {
  phase: 'SIGN_IN' | 'TIME_OUT' | 'SIGN_OUT';
  code: string;
  prompt: string;
}[] = [
  {
    phase: 'SIGN_IN',
    code: 'SI_IDENTITY',
    prompt:
      'El paciente confirmó identidad, sitio, procedimiento y consentimiento',
  },
  {
    phase: 'SIGN_IN',
    code: 'SI_SITE_MARKED',
    prompt: 'Sitio marcado o no aplica',
  },
  {
    phase: 'SIGN_IN',
    code: 'SI_ANESTHESIA_CHECK',
    prompt: 'Control de seguridad de la anestesia completo',
  },
  {
    phase: 'SIGN_IN',
    code: 'SI_PULSE_OXIMETER',
    prompt: 'Pulsioxímetro colocado y funcionando',
  },
  { phase: 'SIGN_IN', code: 'SI_ALLERGY', prompt: '¿Alergias conocidas?' },
  {
    phase: 'SIGN_IN',
    code: 'SI_AIRWAY',
    prompt: '¿Vía aérea difícil o riesgo de aspiración?',
  },
  {
    phase: 'SIGN_IN',
    code: 'SI_BLOOD_LOSS',
    prompt: '¿Riesgo de hemorragia > 500 ml (7 ml/kg en niños)?',
  },
  {
    phase: 'TIME_OUT',
    code: 'TO_TEAM_INTRO',
    prompt: 'Todos los miembros del equipo se presentaron por nombre y función',
  },
  {
    phase: 'TIME_OUT',
    code: 'TO_CONFIRM',
    prompt: 'Confirmación de paciente, sitio y procedimiento',
  },
  {
    phase: 'TIME_OUT',
    code: 'TO_ANTIBIOTIC',
    prompt: 'Profilaxis antibiótica en los últimos 60 minutos',
  },
  {
    phase: 'TIME_OUT',
    code: 'TO_SURGEON_EVENTS',
    prompt: 'Cirujano: pasos críticos, duración y pérdida de sangre previstas',
  },
  {
    phase: 'TIME_OUT',
    code: 'TO_ANESTHESIA_CONCERNS',
    prompt: 'Anestesia: problemas específicos del paciente',
  },
  {
    phase: 'TIME_OUT',
    code: 'TO_NURSING_STERILITY',
    prompt: 'Enfermería: esterilidad confirmada y equipos en condiciones',
  },
  {
    phase: 'TIME_OUT',
    code: 'TO_IMAGING',
    prompt: 'Imágenes diagnósticas esenciales visibles',
  },
  {
    phase: 'SIGN_OUT',
    code: 'SO_PROCEDURE_NAME',
    prompt: 'Nombre del procedimiento registrado',
  },
  {
    phase: 'SIGN_OUT',
    code: 'SO_COUNTS',
    prompt: 'Recuento de instrumentos, gasas y agujas correcto',
  },
  {
    phase: 'SIGN_OUT',
    code: 'SO_SPECIMEN',
    prompt: 'Etiquetado de las muestras',
  },
  {
    phase: 'SIGN_OUT',
    code: 'SO_EQUIPMENT',
    prompt: 'Problemas con el instrumental o los equipos',
  },
  {
    phase: 'SIGN_OUT',
    code: 'SO_RECOVERY',
    prompt:
      'Aspectos críticos de la recuperación y el tratamiento del paciente',
  },
];
