/**
 * Ampliación del catálogo con estándares internacionales (2026-10-24).
 *
 * Dos cosas, las dos escritas sobre las fichas que ya arma el generador:
 *
 * - `MEJORAS`: campos que se suman a una ficha existente, por código de ficha.
 *   Cada mejora sube `version` (sin eso la siembra no reconcilia una plantilla
 *   ya sembrada: `ClinicalFormsSeedService.reconcileVersion`), agrega códigos
 *   **nuevos** —nunca cambia el tipo ni las opciones de uno existente, porque
 *   habría capturas guardadas con el valor viejo— y deja su nota de
 *   procedencia, que se suma a la de la ficha.
 * - `ESPECIFICAS_INTL`: fichas específicas nuevas, en el mismo formato que
 *   `especificas-*.mjs`.
 *
 * Toda opción nueva sale de una fuente citada en la ayuda del campo
 * (`description`). El registro de pasadas, fuentes descartadas y licencias está
 * en `docs/seed-research/clinical-forms.md`.
 */
import { alergias, b, control, i, s, seccion, si, t, una } from './lib.mjs';
import { escala, factores } from './openehr/escalas.mjs';
import { citaDak, dak, DESCARGO_OMS } from './who-dak/dak.mjs';

const CKM = (x) => `openEHR-EHR-OBSERVATION.${x}`;
const FECHA = '2026-10-24';

/** Inserta `nuevos` antes del campo `code`, con su sección. */
function antes(campos, code, nuevos) {
  const k = campos.findIndex((c) => c.code === code);
  if (k < 0) throw new Error(`No existe el campo ${code} para insertar antes`);
  const section = campos[k].section;
  const conSeccion = nuevos.flat().map((c) => ({ section, ...c }));
  return [...campos.slice(0, k), ...conSeccion, ...campos.slice(k)];
}

/** Inserta `nuevos` después del campo `code` (y de sus hijos condicionales). */
function despues(campos, code, nuevos) {
  let k = campos.findIndex((c) => c.code === code);
  if (k < 0)
    throw new Error(`No existe el campo ${code} para insertar después`);
  const section = campos[k].section;
  const hijos = new Set([code]);
  while (k + 1 < campos.length && hijos.has(campos[k + 1].showWhen?.field)) {
    hijos.add(campos[k + 1].code);
    k += 1;
  }
  const conSeccion = nuevos.flat().map((c) => ({ section, ...c }));
  return [...campos.slice(0, k + 1), ...conSeccion, ...campos.slice(k + 1)];
}

/* -- Escalas (pasada 1: CKM de openEHR) ---------------------------------- */

const APGAR_ITEMS = [
  ['at0009', 'respiracion'],
  ['at0005', 'frecuencia_cardiaca'],
  ['at0013', 'tono'],
  ['at0017', 'reflejos'],
  ['at0021', 'color'],
];
const APGAR_FUENTE =
  'puntaje de Apgar (Apgar V. Curr Res Anesth Analg. 1953;32:260-7)';
const apgar = (minuto) =>
  APGAR_ITEMS.map(([at, sufijo]) =>
    escala(CKM('apgar.v2'), at, `apgar_${minuto}min_${sufijo}`, {
      nombre: `Apgar ${minuto === 1 ? 'al minuto' : 'a los 5 minutos'} — ${
        {
          respiracion: 'esfuerzo respiratorio',
          frecuencia_cardiaca: 'frecuencia cardíaca',
          tono: 'tono muscular',
          reflejos: 'reflejos e irritabilidad',
          color: 'color de la piel',
        }[sufijo]
      }`,
      fuente: APGAR_FUENTE,
    }),
  );

const HAS_BLED = factores(
  CKM('has_bled.v0'),
  [
    'at0004',
    'at0005',
    'at0006',
    'at0007',
    'at0008',
    'at0009',
    'at0010',
    'at0011',
    'at0012',
  ],
  'has_bled_factores',
  {
    nombre: 'HAS-BLED: factores presentes',
    fuente:
      'escala HAS-BLED (Pisters R et al. Chest. 2010;138(5):1093-100; Lip GY et al. J Am Coll Cardiol. 2011;57(2):173-80)',
    traduccion: {
      at0004: 'Hipertensión',
      at0005: 'Función renal alterada',
      at0006: 'Función hepática alterada',
      at0007: 'Accidente cerebrovascular previo',
      at0008: 'Antecedente de sangrado o predisposición al sangrado',
      at0009: 'INR lábil',
      at0010: 'Edad avanzada',
      at0011: 'Fármacos concomitantes',
      at0012: 'Alcohol',
    },
    criterio: {
      at0004: 'presión sistólica > 160 mmHg',
      at0005: 'diálisis crónica, trasplante renal o creatinina ≥ 200 µmol/L',
      at0006:
        'hepatopatía crónica (p. ej. cirrosis) o bilirrubina > 2 veces el límite superior con AST/ALT/FA > 3 veces el límite superior',
      at0009: 'inestable, alto o poco tiempo en rango terapéutico',
      at0010: 'más de 65 años',
      at0011: 'antiagregantes, antiinflamatorios no esteroideos',
      at0012: '8 o más unidades por semana',
    },
    ninguno: 'Ninguno',
    extra:
      'Cada factor suma 1 punto (0 a 9). La guía ESC 2024 desaconseja usar el puntaje para negar la anticoagulación: sirve para corregir los factores modificables.',
  },
);

const CHILD_PUGH_FUENTE =
  'clasificación de Child-Pugh (Child CG, Turcotte JG. 1964; Pugh RN et al. Br J Surg. 1973;60:646-9)';
const CHILD_PUGH = [
  escala(CKM('child_pugh_score.v0'), 'at0004', 'child_pugh_bilirrubina', {
    nombre: 'Child-Pugh — bilirrubina total (µmol/L)',
    fuente: CHILD_PUGH_FUENTE,
    traduccion: {
      at0005: 'menor de 34 µmol/L',
      at0006: 'de 34 a 50 µmol/L',
      at0007: 'mayor de 50 µmol/L',
    },
    extra:
      'Conversión de unidades: 1 mg/dL de bilirrubina = 17,1 µmol/L (34 µmol/L ≈ 2 mg/dL; 50 µmol/L ≈ 3 mg/dL).',
  }),
  escala(CKM('child_pugh_score.v0'), 'at0008', 'child_pugh_albumina', {
    nombre: 'Child-Pugh — albúmina sérica (g/L)',
    fuente: CHILD_PUGH_FUENTE,
    traduccion: {
      at0009: 'mayor de 35 g/L',
      at0010: 'de 28 a 35 g/L',
      at0011: 'menor de 28 g/L',
    },
    extra: 'Conversión de unidades: 35 g/L = 3,5 g/dL; 28 g/L = 2,8 g/dL.',
  }),
  escala(CKM('child_pugh_score.v0'), 'at0012', 'child_pugh_inr', {
    nombre: 'Child-Pugh — INR',
    fuente: CHILD_PUGH_FUENTE,
    traduccion: {
      at0013: 'menor de 1,7',
      at0014: 'de 1,7 a 2,3',
      at0015: 'mayor de 2,3',
    },
  }),
  escala(CKM('child_pugh_score.v0'), 'at0016', 'child_pugh_ascitis', {
    nombre: 'Child-Pugh — ascitis',
    fuente: CHILD_PUGH_FUENTE,
    traduccion: {
      at0017: 'Ausente',
      at0018: 'Leve',
      at0019: 'Moderada a grave',
    },
  }),
  escala(CKM('child_pugh_score.v0'), 'at0020', 'child_pugh_encefalopatia', {
    nombre: 'Child-Pugh — encefalopatía hepática',
    fuente: CHILD_PUGH_FUENTE,
    traduccion: {
      at0021: 'Ausente',
      at0022: 'Grado I a II o controlada con medicación',
      at0023: 'Grado III a IV o refractaria',
    },
    extra:
      'La suma de los cinco ítems (5 a 15) da la clase: A 5–6, B 7–9, C 10–15.',
  }),
];

const SOFA_FUENTE =
  'escala SOFA (Vincent JL et al. Intensive Care Med. 1996;22:707-10)';
const SOFA = [
  [
    'at0004',
    'sofa_respiratorio',
    'SOFA — respiratorio (PaO₂/FiO₂)',
    {
      at0005: 'PaO₂/FiO₂ ≥ 400 mmHg',
      at0006: 'PaO₂/FiO₂ 300 a 399 mmHg',
      at0007: 'PaO₂/FiO₂ < 300 mmHg',
      at0008: 'Con ventilación mecánica y PaO₂/FiO₂ 100 a 199 mmHg',
      at0009: 'Con ventilación mecánica y PaO₂/FiO₂ < 100 mmHg',
    },
  ],
  [
    'at0010',
    'sofa_cardiovascular',
    'SOFA — cardiovascular',
    {
      at0011: 'PAM ≥ 70 mmHg',
      at0012: 'PAM < 70 mmHg',
      at0013: 'Dopamina ≤ 5 µg/kg/min o dobutamina a cualquier dosis',
      at0014:
        'Dopamina > 5 µg/kg/min, o noradrenalina o adrenalina ≤ 0,1 µg/kg/min',
      at0015: 'Noradrenalina o adrenalina > 0,1 µg/kg/min',
    },
  ],
  [
    'at0016',
    'sofa_neurologico',
    'SOFA — sistema nervioso (Glasgow)',
    {
      at0017: 'Glasgow 15',
      at0018: 'Glasgow 13 a 14',
      at0019: 'Glasgow 10 a 12',
      at0020: 'Glasgow 6 a 9',
      at0021: 'Glasgow < 6',
    },
  ],
  [
    'at0022',
    'sofa_renal',
    'SOFA — renal (creatinina o diuresis)',
    {
      at0023: 'Creatinina < 1,2 mg/dL',
      at0024: 'Creatinina 1,2 a 1,9 mg/dL',
      at0025: 'Creatinina 2,0 a 3,4 mg/dL',
      at0026: 'Creatinina 3,5 a 4,9 mg/dL o diuresis < 500 mL/24 h',
      at0027: 'Creatinina ≥ 5,0 mg/dL o diuresis < 200 mL/24 h',
    },
  ],
  [
    'at0028',
    'sofa_hepatico',
    'SOFA — hepático (bilirrubina)',
    {
      at0029: 'Bilirrubina < 1,2 mg/dL',
      at0030: 'Bilirrubina 1,2 a 1,9 mg/dL',
      at0031: 'Bilirrubina 2,0 a 5,9 mg/dL',
      at0032: 'Bilirrubina 6,0 a 11,9 mg/dL',
      at0033: 'Bilirrubina ≥ 12,0 mg/dL',
    },
  ],
  [
    'at0034',
    'sofa_coagulacion',
    'SOFA — coagulación (plaquetas)',
    {
      at0035: 'Plaquetas ≥ 150 000/µL',
      at0036: 'Plaquetas < 150 000/µL',
      at0037: 'Plaquetas < 100 000/µL',
      at0038: 'Plaquetas < 50 000/µL',
      at0039: 'Plaquetas < 20 000/µL',
    },
  ],
].map(([at, code, nombre, traduccion]) =>
  escala(CKM('sofa_score.v0'), at, code, {
    nombre,
    fuente: SOFA_FUENTE,
    traduccion,
    ...(code === 'sofa_cardiovascular'
      ? {
          extra:
            'El arquetipo omite el criterio de dopamina > 15 µg/kg/min del puntaje 4 de la publicación original.',
        }
      : {}),
  }),
);

const BISHOP_FUENTE =
  'puntaje de Bishop (Bishop EH. Obstet Gynecol. 1964;24:266-8)';
const BISHOP = [
  [
    'at0009',
    'bishop_dilatacion',
    'Bishop — dilatación',
    {
      at0010: 'Cerrado',
      at0011: '1 a 2 cm',
      at0012: '3 a 4 cm',
      at0013: '5 cm o más',
    },
  ],
  [
    'at0014',
    'bishop_borramiento',
    'Bishop — borramiento',
    {
      at0015: '0 a 30 %',
      at0016: '40 a 50 %',
      at0017: '60 a 70 %',
      at0018: '80 % o más',
    },
  ],
  [
    'at0004',
    'bishop_estacion',
    'Bishop — altura de la presentación (estación)',
    {
      at0005: '−3',
      at0006: '−2',
      at0007: '−1 o 0',
      at0008: '+1 o +2',
    },
  ],
  [
    'at0019',
    'bishop_consistencia',
    'Bishop — consistencia del cuello',
    {
      at0020: 'Firme',
      at0021: 'Intermedia',
      at0022: 'Blanda',
    },
  ],
  [
    'at0023',
    'bishop_posicion',
    'Bishop — posición del cuello',
    {
      at0024: 'Posterior',
      at0025: 'Media',
      at0026: 'Anterior',
    },
  ],
].map(([at, code, nombre, traduccion]) =>
  escala(CKM('bishop_score.v0'), at, code, {
    nombre,
    fuente: BISHOP_FUENTE,
    traduccion,
    ...(code === 'bishop_estacion'
      ? {
          // El arquetipo (en desarrollo) asigna 0 a «−2» y 1 a «−3»: está
          // invertido respecto de la tabla publicada (−3 = 0, −2 = 1).
          orden: ['at0005', 'at0006', 'at0007', 'at0008'],
          ordinales: { at0005: 0, at0006: 1 },
          extra:
            'Puntaje de la estación corregido respecto del arquetipo, que trae invertidos −3 y −2.',
        }
      : {}),
    ...(code === 'bishop_dilatacion'
      ? {
          extra:
            'Para valorar la maduración cervical antes de una inducción; la suma va de 0 a 13.',
        }
      : {}),
  }),
);

const RCRI = factores(
  CKM('revised_cardiac_risk_index.v1'),
  ['at0022', 'at0007', 'at0010', 'at0013', 'at0016', 'at0004'],
  'rcri_factores',
  {
    nombre: 'Índice de riesgo cardíaco revisado (Lee): factores presentes',
    fuente:
      'índice de riesgo cardíaco revisado (Lee TH et al. Circulation. 1999;100(10):1043-9)',
    traduccion: {
      at0022: 'Cirugía de alto riesgo',
      at0007: 'Cardiopatía isquémica',
      at0010: 'Insuficiencia cardíaca',
      at0013: 'Enfermedad cerebrovascular',
      at0016: 'Diabetes en tratamiento con insulina',
      at0004: 'Creatinina preoperatoria elevada',
    },
    criterio: {
      at0022: 'intraperitoneal, intratorácica o vascular suprainguinal',
      at0007:
        'infarto previo, prueba de esfuerzo positiva, angina actual, uso de nitratos u onda Q en el ECG',
      at0013: 'ACV o accidente isquémico transitorio previo',
      at0004: '≥ 2 mg/dL (≥ 177 µmol/L)',
    },
    ninguno: 'Ninguno',
    extra:
      'Riesgo de complicación cardíaca mayor según Lee et al.: 0 factores 0,4 %; 1 factor 0,9 %; 2 factores 6,6 %; 3 o más ≥ 11 %.',
  },
);

const CHARLSON_ID = CKM('charlson_comorbidity_index.v2');
const CHARLSON_FUENTE =
  'índice de comorbilidad de Charlson (Charlson ME et al. J Chronic Dis. 1987;40(5):373-83)';
const CHARLSON = [
  escala(CHARLSON_ID, 'at0061', 'charlson_grupo_etario', {
    nombre: 'Charlson — grupo etario',
    fuente: CHARLSON_FUENTE,
    // La traducción del CKM dice «≥ años»: falta el 80 del original inglés.
    corregir: { at0066: '≥ 80 años' },
  }),
  factores(
    CHARLSON_ID,
    [
      'at0012',
      'at0009',
      'at0006',
      'at0015',
      'at0018',
      'at0021',
      'at0024',
      'at0030',
      'at0036',
      'at0039',
      'at0047',
      'at0050',
      'at0060',
    ],
    'charlson_comorbilidades',
    {
      nombre: 'Charlson — comorbilidades presentes',
      fuente: CHARLSON_FUENTE,
      ninguno: 'Ninguna de estas',
    },
  ),
  escala(CHARLSON_ID, 'at0027', 'charlson_hepatopatia', {
    nombre: 'Charlson — enfermedad hepática',
    fuente: CHARLSON_FUENTE,
    extra:
      'Leve: hepatitis crónica o cirrosis sin hipertensión portal. Moderada a grave: cirrosis con hipertensión portal, con o sin sangrado variceal. (Definición traducida de la descripción inglesa del arquetipo: la traducción al castellano del CKM dice «ni hepatitis crónica», que invierte el criterio.)',
  }),
  escala(CHARLSON_ID, 'at0033', 'charlson_diabetes', {
    nombre: 'Charlson — diabetes mellitus',
    fuente: CHARLSON_FUENTE,
  }),
  escala(CHARLSON_ID, 'at0045', 'charlson_tumor_solido', {
    nombre: 'Charlson — tumor sólido',
    fuente: CHARLSON_FUENTE,
  }),
  i('charlson_total', 'Charlson — puntaje total', {
    ayuda: 'Suma de los puntos de cada ítem, incluido el grupo etario.',
  }),
];

const WAGNER = [
  escala(CKM('diabetic_wound_wagner.v0'), 'at0008', 'dm_pie_wagner', {
    nombre: 'Úlcera de pie diabético — grado de Wagner',
    fuente: 'clasificación de Wagner (Wagner FW. Foot Ankle. 1981;2:64-122)',
    // El CKM sólo trae el número de grado como texto; la definición de cada
    // grado es la descripción del mismo valor en su traducción es-AR.
    corregir: {
      at0009: 'Piel intacta en pacientes en riesgo',
      at0010: 'Úlceras superficiales con tejido subcutáneo expuesto',
      at0011: 'Tendones y estructuras profundas expuestas',
      at0012:
        'Úlceras extendidas a los tejidos profundos, asociadas a absceso de tejidos blandos u osteomielitis',
      at0013: 'Úlceras que incluyen al pie con gangrena parcial',
      at0014: 'Úlceras del pie con tejido gangrenoso más extendido',
    },
    extra:
      'Las definiciones son las descripciones de la traducción es-AR del CKM, con la ortografía corregida (subcutáneo, osteomielitis, pie).',
  }),
];

const KARNOFSKY = escala(
  CKM('karnofsky_performance_status_scale.v1'),
  'at0004',
  'karnofsky',
  {
    nombre: 'Estado funcional de Karnofsky',
    fuente: 'escala de Karnofsky (Karnofsky DA, Burchenal JH. 1949)',
    traduccion: {
      at0015: 'Normal; sin quejas; sin evidencia de enfermedad',
      at0014:
        'Capaz de realizar su actividad normal; signos o síntomas menores de enfermedad',
      at0013:
        'Actividad normal con esfuerzo; algunos signos o síntomas de enfermedad',
      at0012:
        'Se vale por sí mismo; incapaz de realizar su actividad normal o trabajo activo',
      at0011:
        'Requiere asistencia ocasional, pero puede atender la mayoría de sus necesidades',
      at0010: 'Requiere asistencia considerable y atención médica frecuente',
      at0009: 'Incapacitado; requiere cuidados y asistencia especiales',
      at0008:
        'Gravemente incapacitado; está indicada la internación aunque la muerte no es inminente',
      at0007:
        'Muy enfermo; internación necesaria; tratamiento de soporte activo necesario',
      at0006: 'Moribundo; procesos fatales que progresan rápidamente',
      at0005: 'Fallecido',
    },
  },
);

const NIHSS_FUENTE =
  'NIH Stroke Scale (National Institute of Neurological Disorders and Stroke, dominio público)';
const MOTOR_BRAZO = (a) => ({
  [a[0]]: 'Sin caída; mantiene 90° (o 45°) los 10 segundos completos',
  [a[1]]:
    'Caída; mantiene 90° (o 45°) pero cae antes de los 10 segundos, sin tocar la cama u otro apoyo',
  [a[2]]:
    'Algún esfuerzo contra la gravedad; no alcanza o no mantiene 90° (o 45°) y cae a la cama, con algún esfuerzo contra la gravedad',
  [a[3]]: 'Sin esfuerzo contra la gravedad; el miembro cae',
  [a[4]]: 'Sin movimiento',
  [a[5]]: 'No evaluable: amputación o anquilosis',
});
const MOTOR_PIERNA = (a) => ({
  [a[0]]: 'Sin caída; mantiene 30° los 5 segundos completos',
  [a[1]]: 'Caída; cae al final de los 5 segundos sin tocar la cama',
  [a[2]]:
    'Algún esfuerzo contra la gravedad; cae a la cama antes de los 5 segundos, con algún esfuerzo contra la gravedad',
  [a[3]]: 'Sin esfuerzo contra la gravedad; cae a la cama de inmediato',
  [a[4]]: 'Sin movimiento',
  [a[5]]: 'No evaluable: amputación o anquilosis',
});
const NIHSS = [
  [
    'at0004',
    'nihss_1a_conciencia',
    '1a. Nivel de conciencia',
    {
      at0005: 'Alerta; responde con viveza',
      at0006:
        'No alerta, pero despierta con estímulos menores para obedecer, responder o reaccionar',
      at0007:
        'No alerta; requiere estímulos repetidos para atender, u obnubilado y requiere estímulos fuertes o dolorosos para moverse',
      at0008:
        'Responde sólo con reflejos motores o autonómicos, o sin respuesta, flácido y arrefléxico',
    },
  ],
  [
    'at0009',
    'nihss_1b_preguntas',
    '1b. Preguntas (mes y edad)',
    {
      at0010: 'Responde ambas preguntas correctamente',
      at0011: 'Responde una pregunta correctamente',
      at0012: 'No responde ninguna correctamente',
    },
  ],
  [
    'at0013',
    'nihss_1c_ordenes',
    '1c. Órdenes (abrir y cerrar ojos, apretar la mano)',
    {
      at0014: 'Realiza ambas tareas correctamente',
      at0015: 'Realiza una tarea correctamente',
      at0016: 'No realiza ninguna correctamente',
    },
  ],
  [
    'at0017',
    'nihss_2_mirada',
    '2. Mirada conjugada',
    {
      at0018: 'Normal',
      at0019:
        'Parálisis parcial de la mirada en uno o ambos ojos, sin desviación forzada ni paresia total',
      at0020:
        'Desviación forzada o paresia total de la mirada que no se vence con la maniobra oculocefálica',
    },
  ],
  [
    'at0021',
    'nihss_3_campo_visual',
    '3. Campo visual',
    {
      at0022: 'Sin pérdida visual',
      at0023: 'Hemianopsia parcial',
      at0024: 'Hemianopsia completa',
      at0025: 'Hemianopsia bilateral (ceguera, incluida la cortical)',
    },
  ],
  [
    'at0026',
    'nihss_4_paralisis_facial',
    '4. Parálisis facial',
    {
      at0027: 'Movimientos normales y simétricos',
      at0028: 'Paresia menor (surco nasogeniano borrado, asimetría al sonreír)',
      at0029:
        'Paresia parcial (parálisis total o casi total de la parte inferior de la cara)',
      at0030:
        'Parálisis completa de uno o ambos lados (sin movimiento en la parte superior e inferior de la cara)',
    },
  ],
  [
    'at0031',
    'nihss_5a_brazo_izquierdo',
    '5a. Motor — brazo izquierdo',
    MOTOR_BRAZO(['at0032', 'at0033', 'at0034', 'at0124', 'at0035', 'at0036']),
  ],
  [
    'at0038',
    'nihss_5b_brazo_derecho',
    '5b. Motor — brazo derecho',
    MOTOR_BRAZO(['at0039', 'at0040', 'at0041', 'at0042', 'at0043', 'at0044']),
  ],
  [
    'at0046',
    'nihss_6a_pierna_izquierda',
    '6a. Motor — pierna izquierda',
    MOTOR_PIERNA(['at0047', 'at0048', 'at0049', 'at0050', 'at0051', 'at0052']),
  ],
  [
    'at0141',
    'nihss_6b_pierna_derecha',
    '6b. Motor — pierna derecha',
    MOTOR_PIERNA(['at0054', 'at0055', 'at0056', 'at0057', 'at0058', 'at0059']),
  ],
  [
    'at0061',
    'nihss_7_ataxia',
    '7. Ataxia de miembros',
    {
      at0062: 'Ausente',
      at0063: 'Presente en un miembro',
      at0064: 'Presente en dos miembros',
      at0065:
        'No evaluable: amputación o anquilosis (explicar en observaciones)',
    },
  ],
  [
    'at0067',
    'nihss_8_sensibilidad',
    '8. Sensibilidad',
    {
      at0068: 'Normal; sin pérdida sensitiva',
      at0069:
        'Pérdida leve a moderada: siente el pinchazo menos agudo o romo del lado afectado, o no siente el dolor superficial pero sí que lo tocan',
      at0070:
        'Pérdida grave o total: no se da cuenta de que lo tocan en la cara, el brazo y la pierna',
    },
  ],
  [
    'at0071',
    'nihss_9_lenguaje',
    '9. Lenguaje',
    {
      at0072: 'Sin afasia; normal',
      at0073:
        'Afasia leve a moderada: pérdida evidente de fluidez o comprensión, sin limitación importante de las ideas expresadas',
      at0074:
        'Afasia grave: comunicación fragmentaria; el examinador no puede identificar el material presentado por la respuesta del paciente',
      at0075:
        'Mutismo o afasia global; sin lenguaje útil ni comprensión auditiva',
    },
  ],
  [
    'at0076',
    'nihss_10_disartria',
    '10. Disartria',
    {
      at0077: 'Normal',
      at0078:
        'Leve a moderada: arrastra algunas palabras y, en el peor caso, se le entiende con alguna dificultad',
      at0079:
        'Grave: el habla es ininteligible, sin relación o desproporcionada con una disfasia, o mutismo/anartria',
      at0080: 'No evaluable: intubado u otra barrera física',
    },
  ],
  [
    'at0082',
    'nihss_11_extincion',
    '11. Extinción e inatención (negligencia)',
    {
      at0083: 'Sin alteración',
      at0084:
        'Inatención visual, táctil, auditiva, espacial o personal, o extinción a la estimulación bilateral simultánea en una modalidad sensorial',
      at0085:
        'Hemiinatención profunda o extinción en más de una modalidad; no reconoce su propia mano o se orienta sólo hacia un lado del espacio',
    },
  ],
].map(([at, code, nombre, traduccion]) =>
  escala(CKM('nihss.v0'), at, code, {
    nombre,
    fuente: NIHSS_FUENTE,
    traduccion,
    ...(code === 'nihss_1a_conciencia'
      ? {
          extra:
            'El texto del valor 2 está truncado en el arquetipo; se completó con la redacción de la escala del NINDS («para moverse»). Los ítems «NE» no suman al total.',
        }
      : {}),
  }),
);

const MAYO_FUENTE =
  'puntaje de Mayo para colitis ulcerosa (Schroeder KW et al. N Engl J Med. 1987;317:1625-9)';
const MAYO = [
  [
    'at0009',
    'mayo_frecuencia_deposiciones',
    'Mayo — frecuencia de deposiciones',
    {
      at0010: 'Número normal de deposiciones',
      at0011: '1 a 2 deposiciones más de lo normal',
      at0012: '3 a 4 deposiciones más de lo normal',
      at0013: '5 o más deposiciones más de lo normal',
    },
  ],
  [
    'at0014',
    'mayo_sangrado_rectal',
    'Mayo — sangrado rectal (el más intenso del día)',
    {
      at0015: 'Sin sangre visible',
      at0016: 'Hilos de sangre con las heces, menos de la mitad de las veces',
      at0017: 'Sangre evidente con las heces la mayoría de las veces',
      at0018: 'Sólo sangre',
    },
  ],
  [
    'at0019',
    'mayo_endoscopia',
    'Mayo — hallazgo endoscópico',
    {
      at0020: 'Normal o enfermedad inactiva',
      at0021:
        'Enfermedad leve (eritema, patrón vascular disminuido, friabilidad leve)',
      at0022:
        'Enfermedad moderada (eritema marcado, patrón vascular ausente, friabilidad, erosiones)',
      at0023: 'Enfermedad grave (sangrado espontáneo, ulceración)',
    },
  ],
  [
    'at0024',
    'mayo_evaluacion_global',
    'Mayo — evaluación global del médico',
    {
      at0025: 'Normal o enfermedad inactiva',
      at0026: 'Enfermedad leve',
      at0027: 'Enfermedad moderada',
      at0028: 'Enfermedad grave',
    },
  ],
].map(([at, code, nombre, traduccion]) =>
  escala(CKM('mayo_score.v1'), at, code, {
    nombre,
    fuente: MAYO_FUENTE,
    traduccion,
    ...(code === 'mayo_endoscopia'
      ? {
          extra:
            'Sólo si hay endoscopia reciente; sin ella se informa el Mayo parcial (tres ítems).',
        }
      : {}),
  }),
);

const NOTA_CKM = (escalas) =>
  `Ampliación internacional (${FECHA}): ${escalas} desde el CKM internacional de openEHR (https://github.com/openEHR/CKM-mirror, instantánea en tools/clinical-forms/openehr/ckm-snapshot.json; arquetipos CC BY-SA 4.0, sin vínculos SNOMED CT). Cada campo nuevo cita la publicación original en su ayuda; las traducciones propias están marcadas.`;

export const MEJORAS = {
  PEDIA_RECIEN_NACIDO: {
    version: 2,
    nota: NOTA_CKM(
      'ítems del puntaje de Apgar al minuto y a los 5 minutos (traducción al castellano del CKM)',
    ),
    aplicar: (c) => antes(antes(c, 'apgar_1', apgar(1)), 'apgar_5', apgar(5)),
  },
  CARDIO_CTRL_FA: {
    version: 2,
    nota: NOTA_CKM('factores de la escala HAS-BLED'),
    aplicar: (c) => antes(c, 'has_bled_puntaje', [HAS_BLED]),
  },
  GASTRO_CTRL_HEPATOPATIA: {
    version: 2,
    nota: NOTA_CKM('los cinco ítems de la clasificación de Child-Pugh'),
    aplicar: (c) => antes(c, 'child_pugh', CHILD_PUGH),
  },
  UCI_CTRL_SEPSIS: {
    version: 2,
    nota: NOTA_CKM('los seis componentes de la escala SOFA'),
    aplicar: (c) => antes(c, 'sofa', SOFA),
  },
  OBST_TRABAJO_DE_PARTO: {
    version: 2,
    nota: NOTA_CKM(
      'los cinco ítems del puntaje de Bishop (con la estación corregida respecto del arquetipo)',
    ),
    aplicar: (c) => despues(c, 'descenso', BISHOP),
  },
  ANEST_VALORACION_PREANESTESICA: {
    version: 3,
    nota: NOTA_CKM('factores del índice de riesgo cardíaco revisado de Lee'),
    aplicar: (c) => antes(c, 'clasificacion_asa', [RCRI]),
  },
  MEDINT_CTRL_MULTIMORBILIDAD: {
    version: 2,
    nota: NOTA_CKM(
      'índice de comorbilidad de Charlson (traducción al castellano del CKM, con una corrección documentada)',
    ),
    aplicar: (c) => despues(c, 'condiciones_cronicas', CHARLSON),
  },
  ENDO_CTRL_DM2: {
    version: 2,
    nota: NOTA_CKM(
      'grado de Wagner de la úlcera de pie diabético (traducción es-AR del CKM)',
    ),
    aplicar: (c) =>
      despues(c, 'dm_pie', si('dm_pie', 'Úlcera o lesión presente', WAGNER)),
  },
  ONCO_CTRL_PALIATIVOS: {
    version: 2,
    nota: NOTA_CKM('escala de Karnofsky'),
    aplicar: (c) => despues(c, 'ecog', [KARNOFSKY]),
  },
  EMERG_ACV: {
    version: 2,
    nota: NOTA_CKM(
      'los 15 ítems de la NIH Stroke Scale (traducción propia, no la versión certificada en castellano)',
    ),
    aplicar: (c) => antes(c, 'nihss', NIHSS),
  },
};

/* -- Fichas específicas nuevas ------------------------------------------- */

export const ESPECIFICAS_INTL = [
  {
    code: 'GASTRO_CTRL_COLITIS_ULCEROSA',
    carpeta: 'gastroenterologia',
    nombre: 'Control de colitis ulcerosa (puntaje de Mayo)',
    fuente: 'CKM_MAYO',
    fecha: FECHA,
    nota: 'Estructura de control crónico del catálogo (NT 022) y los cuatro ítems del puntaje de Mayo del arquetipo openEHR-EHR-OBSERVATION.mayo_score.v1 (traducción propia del inglés, no oficial). Puntaje total 0 a 12; el parcial, sin endoscopia, 0 a 9.',
    campos: () =>
      control({
        condicion: 'colitis ulcerosa',
        evaluacion: [
          ...MAYO,
          i('mayo_total', 'Mayo — puntaje total (0 a 12, o parcial 0 a 9)'),
          b(
            'cu_manifestaciones_extraintestinales',
            'Manifestaciones extraintestinales',
          ),
          ...si('cu_manifestaciones_extraintestinales', true, [
            una(
              'cu_extraintestinales_cual',
              '¿Cuál?',
              ['Articular', 'Cutánea', 'Ocular', 'Hepatobiliar'],
              { otro: true, req: true },
            ),
          ]),
        ],
      }),
  },
];

/* -- Pasada 2: Digital Adaptation Kits de la OMS ------------------------- */

/**
 * Suma opciones al final de una lista existente (antes de «Ninguno»), sin
 * quitar ni renombrar ninguna: las capturas guardadas siguen siendo válidas.
 */
function sumarOpciones(campos, code, nuevas, ayuda) {
  return campos.map((c) => {
    if (c.code !== code) return c;
    if (c.options === undefined) throw new Error(`${code} no es de lista`);
    const repetidas = nuevas.filter((o) => c.options.includes(o));
    if (repetidas.length > 0)
      throw new Error(`${code}: opciones ya presentes ${repetidas}`);
    const k = c.options.findIndex((o) => /^Ningun[oa]$/.test(o));
    const options =
      k < 0
        ? [...c.options, ...nuevas]
        : [...c.options.slice(0, k), ...nuevas, ...c.options.slice(k)];
    return {
      ...c,
      options,
      description: [c.description, ayuda].filter(Boolean).join(' '),
    };
  });
}

const NOTA_DAK = (que, dak) =>
  `Ampliación internacional (${FECHA}): ${que} desde la ${citaDak(dak)}; instantánea en tools/clinical-forms/who-dak/dak-snapshot.json. Traducción propia del inglés, no oficial. ${DESCARGO_OMS}`;

/* Puerperio: DAK de atención posnatal (PNC). */
const PUERPERIO_PELIGRO = [
  dak('PNC', 'PNC.B4a.DE.1', 'puerperio_signos_de_peligro', {
    nombre: 'Signos de peligro de la mujer',
    traduccion: {
      'PNC.B4a.DE.2': 'Sin signos de peligro',
      'PNC.B4a.DE.3': 'Sangrado vaginal anormal',
      'PNC.B4a.DE.4': 'Cianosis central',
      'PNC.B4a.DE.5': 'Convulsiones',
      'PNC.B4a.DE.6': 'Fiebre (37,5 °C o más)',
      'PNC.B4a.DE.7': 'Cefalea intensa',
      'PNC.B4a.DE.8': 'Dolor intenso (no abdominal)',
      'PNC.B4a.DE.9': 'Vómitos intensos',
      'PNC.B4a.DE.10': 'Dolor abdominal intenso',
      'PNC.B4a.DE.11': 'Inconsciente',
      'PNC.B4a.DE.12': 'Alteraciones visuales',
    },
  }),
  dak('PNC', 'PNC.B3a.DE.35', 'puerperio_molestias', {
    nombre: 'Molestias referidas en las últimas 24 horas',
    traduccion: {
      'PNC.B3a.DE.36': 'Ninguna',
      'PNC.B3a.DE.37': 'Entuertos (cólicos uterinos)',
      'PNC.B3a.DE.38': 'Cefalea',
      'PNC.B3a.DE.39': 'Cansancio',
      'PNC.B3a.DE.40': 'Dolor de espalda',
      'PNC.B3a.DE.41': 'Dolor perineal',
      'PNC.B3a.DE.42': 'Incontinencia urinaria',
      'PNC.B3a.DE.43': 'Incontinencia fecal',
      'PNC.B3a.DE.44': 'Náuseas',
      'PNC.B3a.DE.45': 'Vómitos',
      'PNC.B3a.DE.46': 'Sangrado vaginal excesivo',
      'PNC.B3a.DE.47': 'Secreciones fétidas',
      'PNC.B3a.DE.48': 'Edema de piernas',
      'PNC.B3a.DE.49': 'Dolor a la palpación en las piernas',
      'PNC.B3a.DE.50': 'Enrojecimiento de las piernas',
      'PNC.B3a.DE.51': 'Diarrea',
      'PNC.B3a.DE.52': 'Estreñimiento',
      'PNC.B3a.DE.53': 'Síntomas gripales',
      'PNC.B3a.DE.54': 'Fiebre',
      'PNC.B3a.DE.55': 'Mareos',
      'PNC.B3a.DE.56': 'Tos',
      'PNC.B3a.DE.57': 'Falta de aire',
      'PNC.B3a.DE.58': 'Dolor torácico',
    },
  }),
  dak('PNC', 'PNC.B4a.DE.27', 'puerperio_preeclampsia_grave', {
    nombre: 'Síntomas de preeclampsia grave',
    traduccion: {
      'PNC.B4a.DE.28': 'Sin síntomas de preeclampsia grave',
      'PNC.B4a.DE.29': 'Cefalea intensa',
      'PNC.B4a.DE.30': 'Alteraciones visuales',
      'PNC.B4a.DE.31': 'Dolor epigástrico',
      'PNC.B4a.DE.32': 'Mareos',
      'PNC.B4a.DE.33': 'Vómitos',
    },
  }),
];

const PUERPERIO_UTERO = [
  dak('PNC', 'PNC.B4a.DE.90', 'puerperio_tono_uterino', {
    nombre: 'Tono del fondo uterino',
    traduccion: {
      'PNC.B4a.DE.91': 'Contraído',
      'PNC.B4a.DE.92': 'Flácido',
      'PNC.B4a.DE.93': 'No evaluable',
    },
  }),
  dak('PNC', 'PNC.B4a.DE.94', 'puerperio_altura_uterina', {
    nombre: 'Altura del fondo uterino',
    traduccion: {
      'PNC.B4a.DE.95': '1 a 2 cm por encima del ombligo',
      'PNC.B4a.DE.96': '1 a 2 cm por debajo del ombligo',
      'PNC.B4a.DE.97': 'A mitad de camino entre el ombligo y la sínfisis',
      'PNC.B4a.DE.98': 'Intrapélvico',
    },
  }),
  ...si('tipo_parto', 'Vaginal', [
    dak('PNC', 'PNC.B4a.DE.113', 'puerperio_examen_perineal', {
      nombre: 'Examen perineal',
      traduccion: {
        'PNC.B4a.DE.114': 'Sin heridas',
        'PNC.B4a.DE.115': 'Heridas limpias y secas',
        'PNC.B4a.DE.116': 'Cerradas con puntos',
        'PNC.B4a.DE.117': 'Cerradas sin puntos',
        'PNC.B4a.DE.118': 'Dehiscencia',
        'PNC.B4a.DE.119': 'Hematoma',
        'PNC.B4a.DE.120': 'Enrojecimiento',
        'PNC.B4a.DE.121': 'Tumefacción',
        'PNC.B4a.DE.122': 'Calor local',
        'PNC.B4a.DE.123': 'Secreción fétida o purulenta',
        'PNC.B4a.DE.124': 'Secreción serosa',
      },
    }),
  ]),
  ...si('tipo_parto', 'Cesárea', [
    dak('PNC', 'PNC.B4a.DE.144', 'puerperio_herida_cesarea', {
      nombre: 'Examen de la herida de la cesárea',
      traduccion: {
        'PNC.B4a.DE.145': 'Examen de la herida no realizado',
        'PNC.B4a.DE.146': 'Limpia y seca',
        'PNC.B4a.DE.147': 'Cerrada con puntos',
        'PNC.B4a.DE.148': 'Cerrada sin puntos',
        'PNC.B4a.DE.149': 'Dehiscente',
        'PNC.B4a.DE.150': 'Hematoma',
        'PNC.B4a.DE.151': 'Enrojecimiento',
        'PNC.B4a.DE.152': 'Tumefacción',
        'PNC.B4a.DE.153': 'Calor local',
        'PNC.B4a.DE.154': 'Secreción fétida o purulenta',
        'PNC.B4a.DE.155': 'Secreción serosa',
      },
    }),
  ]),
];

const PUERPERIO_MAMAS = [
  dak('PNC', 'PNC.B3a.DE.23', 'puerperio_problemas_mamas', {
    nombre: 'Problemas de lactancia o de las mamas',
    traduccion: {
      'PNC.B3a.DE.24': 'Ninguno',
      'PNC.B3a.DE.25': 'Dolor mamario',
      'PNC.B3a.DE.26': 'Congestión mamaria',
      'PNC.B3a.DE.27': 'Pezones doloridos',
      'PNC.B3a.DE.28': 'Infección del pezón',
      'PNC.B3a.DE.29': 'Mastitis o absceso',
      'PNC.B3a.DE.30': 'Poca producción de leche',
      'PNC.B3a.DE.31': 'Problemas de posición',
      'PNC.B3a.DE.32': 'Problemas de agarre',
      'PNC.B3a.DE.33': 'Reflujo o regurgitación',
    },
  }),
];

const PUERPERIO_ANIMO = [
  dak('PNC', 'PNC.B3a.DE.1', 'puerperio_tamizaje_depresion_ansiedad', {
    nombre: 'Indagación clínica de depresión y ansiedad posnatal',
    traduccion: {
      'PNC.B3a.DE.2': 'No realizada',
      'PNC.B3a.DE.3': 'Positiva (hay signos)',
      'PNC.B3a.DE.4': 'Negativa (no hay signos)',
      'PNC.B3a.DE.5': 'No se pudo determinar',
    },
  }),
];

const PUERPERIO_METODO = si(
  'anticoncepcion_posparto',
  ['Elegida e iniciada', 'Elegida, pendiente'],
  [
    dak('PNC', 'PNC.B3a.DE.147', 'puerperio_metodo_anticonceptivo', {
      nombre: 'Método anticonceptivo posparto elegido',
      traduccion: {
        'PNC.B3a.DE.148': 'DIU de cobre',
        'PNC.B3a.DE.149': 'DIU de levonorgestrel',
        'PNC.B3a.DE.150': 'Implante de etonogestrel (una varilla)',
        'PNC.B3a.DE.151': 'Implante de levonorgestrel (dos varillas)',
        'PNC.B3a.DE.152': 'DMPA intramuscular',
        'PNC.B3a.DE.153': 'DMPA subcutáneo',
        'PNC.B3a.DE.154': 'Enantato de noretisterona (NET-EN)',
        'PNC.B3a.DE.155': 'Píldora de progestágeno solo',
        'PNC.B3a.DE.156': 'Anticonceptivo oral combinado',
        'PNC.B3a.DE.157': 'Parche anticonceptivo combinado',
        'PNC.B3a.DE.158': 'Anillo vaginal combinado',
        'PNC.B3a.DE.159': 'Anillo vaginal de progesterona',
        'PNC.B3a.DE.160': 'Método de la amenorrea de la lactancia (MELA)',
        'PNC.B3a.DE.161': 'Preservativo masculino',
        'PNC.B3a.DE.162': 'Preservativo femenino',
        'PNC.B3a.DE.163': 'Vasectomía',
        'PNC.B3a.DE.164': 'Ligadura tubaria',
        'PNC.B3a.DE.165': 'No se entregó método',
      },
    }),
  ],
);

/* Recién nacido: DAK de atención posnatal (PNC), examen del neonato. */
const RN_EXAMEN = [
  dak('PNC', 'PNC.B4b.DE.48', 'rn_temperatura_al_tacto', {
    nombre: 'Temperatura al tacto',
    traduccion: {
      'PNC.B4b.DE.49': 'Normal',
      'PNC.B4b.DE.50': 'Frío',
      'PNC.B4b.DE.51':
        'Muy caliente (sobrecalentado: rubicundo, sudoroso o pelo húmedo)',
    },
  }),
  dak('PNC', 'PNC.B4b.DE.25', 'rn_piel', {
    nombre: 'Piel',
    traduccion: {
      'PNC.B4b.DE.26': 'Normal',
      'PNC.B4b.DE.27': 'Palidez',
      'PNC.B4b.DE.28': 'Cianosis',
      'PNC.B4b.DE.29':
        'Signos de infección cutánea (pústulas, ampollas, tumefacción, enrojecimiento o induración)',
    },
  }),
  dak('PNC', 'PNC.B4b.DE.31', 'rn_ictericia_localizacion', {
    nombre: 'Ictericia: hasta dónde llega',
    traduccion: {
      'PNC.B4b.DE.32': 'Cara',
      'PNC.B4b.DE.33': 'Tórax',
      'PNC.B4b.DE.34': 'Abdomen',
      'PNC.B4b.DE.35': 'Piernas',
      'PNC.B4b.DE.36': 'Brazos',
      'PNC.B4b.DE.37': 'Palmas',
      'PNC.B4b.DE.38': 'Plantas',
    },
    extra: 'Sólo si hay ictericia.',
  }),
  dak('PNC', 'PNC.B4b.DE.80', 'rn_fontanelas', {
    nombre: 'Fontanelas',
    traduccion: {
      'PNC.B4b.DE.81': 'Normales',
      'PNC.B4b.DE.82': 'Abombadas o tensas',
      'PNC.B4b.DE.83': 'Deprimidas',
    },
  }),
  dak('PNC', 'PNC.B4b.DE.88', 'rn_ojos', {
    nombre: 'Ojos',
    traduccion: {
      'PNC.B4b.DE.89': 'Normales',
      'PNC.B4b.DE.90': 'Tumefactos y con secreción purulenta',
      'PNC.B4b.DE.91': 'Opacidades',
      'PNC.B4b.DE.92': 'Escleras amarillas',
      'PNC.B4b.DE.93': 'Enrojecimiento',
      'PNC.B4b.DE.94': 'Reflejo rojo normal',
      'PNC.B4b.DE.95': 'Reflejo rojo anormal',
    },
  }),
  dak('PNC', 'PNC.B4b.DE.121', 'rn_cordon_umbilical', {
    nombre: 'Cordón umbilical',
    traduccion: {
      'PNC.B4b.DE.122': 'Normal (tres vasos, limpio y seco)',
      'PNC.B4b.DE.123': 'Ombligo o piel periumbilical enrojecidos o tumefactos',
      'PNC.B4b.DE.124': 'Secreción purulenta',
      'PNC.B4b.DE.125': 'Sangrado',
    },
  }),
  dak('PNC', 'PNC.B4b.DE.52', 'rn_malformaciones', {
    nombre: 'Malformaciones',
    traduccion: {
      'PNC.B4b.DE.53': 'Ninguna evidente',
      'PNC.B4b.DE.54': 'Pie bot',
      'PNC.B4b.DE.55': 'Labio leporino',
      'PNC.B4b.DE.56': 'Paladar hendido',
      'PNC.B4b.DE.57': 'Aspecto inusual que genera preocupación',
      'PNC.B4b.DE.58':
        'Tejido expuesto en cabeza, abdomen, espalda, periné o genitales',
    },
  }),
  dak('PNC', 'PNC.B4b.DE.128', 'rn_genitales', {
    nombre: 'Genitales',
    traduccion: {
      'PNC.B4b.DE.129': 'Aspecto habitual',
      'PNC.B4b.DE.132': 'Sangrado vaginal',
      'PNC.B4b.DE.133': 'Labios fusionados',
      'PNC.B4b.DE.134': 'Testículos no descendidos',
      'PNC.B4b.DE.137': 'Hipospadias',
      'PNC.B4b.DE.138': 'Hidrocele',
      'PNC.B4b.DE.139': 'Hernia inguinal',
      'PNC.B4b.DE.140': 'Genitales ambiguos',
    },
  }),
  dak('PNC', 'PNC.B4b.DE.142', 'rn_ano', {
    nombre: 'Ano',
    traduccion: {
      'PNC.B4b.DE.143': 'Normal (permeable)',
      'PNC.B4b.DE.144': 'Ano imperforado',
      'PNC.B4b.DE.145': 'Aspecto anormal',
    },
  }),
  dak('PNC', 'PNC.B4b.DE.152', 'rn_espalda_columna', {
    nombre: 'Espalda y columna',
    traduccion: {
      'PNC.B4b.DE.153': 'Normales',
      'PNC.B4b.DE.154': 'Hoyuelos o fositas',
      'PNC.B4b.DE.155': 'Apéndices cutáneos',
      'PNC.B4b.DE.156': 'Mechones de pelo',
      'PNC.B4b.DE.157': 'Anencefalia',
      'PNC.B4b.DE.158': 'Encefalocele',
      'PNC.B4b.DE.159': 'Espina bífida',
    },
  }),
];

const RN_CUIDADOS = [
  dak('PNC', 'PNC.B3b.DE.45', 'rn_alimentacion_actual', {
    nombre: 'Alimentación actual',
    traduccion: {
      'PNC.B3b.DE.46': 'Lactancia exclusiva a demanda',
      'PNC.B3b.DE.47': 'Lactancia exclusiva con horario',
      'PNC.B3b.DE.48': 'Mixta (fórmula y leche materna)',
      'PNC.B3b.DE.49': 'Fórmula',
    },
  }),
  dak('PNC', 'PNC.B3b.DE.87', 'rn_posicion_para_dormir', {
    nombre: 'Posición en la que suele dormir',
    traduccion: {
      'PNC.B3b.DE.88': 'Boca arriba',
      'PNC.B3b.DE.89': 'De costado',
      'PNC.B3b.DE.90': 'Boca abajo',
      'PNC.B3b.DE.91': 'No se sabe',
    },
  }),
];

const RN_VITAMINA_K = [
  dak('PNC', 'PNC.B3b.DE.24', 'rn_vitamina_k', {
    nombre: 'Vitamina K al nacer',
    traduccion: {
      'PNC.B3b.DE.25': 'Sí',
      'PNC.B3b.DE.26': 'No',
      'PNC.B3b.DE.27': 'No se sabe',
    },
  }),
];

/** Signos de peligro del neonato de la DAK PNC que la lista original no tenía. */
const RN_PELIGRO_DAK = [
  'Respiración ruidosa (quejido, estridor)',
  'Cianosis central',
  'Respiración lenta, boqueo o apnea',
  'Aleteo nasal',
  'Distensión abdominal',
  'Sólo se mueve al estimularlo o no se mueve',
  'Secreción purulenta del muñón umbilical',
  'Sangrado del muñón umbilical',
];

/* VIH: DAK de VIH (2023), visita de atención y tratamiento. */
const VIH_ADHERENCIA = si(
  'adherencia',
  ['Olvida dosis algunas veces', 'Abandonó el tratamiento'],
  [
    dak('HIV', 'HIV.D.DE197', 'vih_motivos_mala_adherencia', {
      nombre: 'Motivos del problema de adherencia',
      traduccion: {
        'HIV.D.DE198': 'Se olvidó',
        'HIV.D.DE199': 'Toxicidad o efectos adversos',
        'HIV.D.DE200': 'Falta de tiempo',
        'HIV.D.DE201': 'Cambio de rutina',
        'HIV.D.DE202': 'Costo del traslado',
        'HIV.D.DE203': 'Distancia al establecimiento',
        'HIV.D.DE204': 'Perdió o se le acabaron las pastillas',
        'HIV.D.DE205': 'Desabastecimiento',
        'HIV.D.DE206': 'Estaba demasiado enfermo',
        'HIV.D.DE207': 'Cantidad de pastillas',
        'HIV.D.DE208': 'Se sentía bien',
        'HIV.D.DE209': 'Depresión',
        'HIV.D.DE210': 'Consumo de alcohol',
        'HIV.D.DE211': 'Consumo de otras sustancias',
        'HIV.D.DE212': 'Estigma o temor a que se sepa el diagnóstico',
        'HIV.D.DE213': 'Falta de alimentos',
        'HIV.D.DE214': 'Mal sabor',
      },
    }),
  ],
);

const VIH_TOXICIDAD = si('efectos_adversos', true, [
  dak('HIV', 'HIV.D.DE466', 'vih_toxicidad_limitante', {
    nombre: 'Tipo de toxicidad que limita el tratamiento',
    traduccion: {
      'HIV.D.DE467':
        'Gastrointestinal (náuseas, diarrea, dolor abdominal, vómitos)',
      'HIV.D.DE468': 'Cutánea (exantema, hipersensibilidad)',
      'HIV.D.DE469': 'Neuropatía periférica',
      'HIV.D.DE470':
        'Sistema nervioso central (mareo, ansiedad, pesadillas, depresión)',
      'HIV.D.DE471': 'Aumento de peso',
      'HIV.D.DE472': 'Disfunción hepática (ictericia)',
      'HIV.D.DE473': 'Hematológica (anemia, neutropenia)',
      'HIV.D.DE474': 'Cansancio',
      'HIV.D.DE475': 'Cefalea',
      'HIV.D.DE476': 'Ósea (fracturas, osteopenia)',
      'HIV.D.DE477':
        'Metabólica (cambios de la grasa corporal, hiperglucemia, dislipidemia)',
      'HIV.D.DE478': 'Renal (nefrolitiasis, insuficiencia renal)',
      'HIV.D.DE479': 'Reacción adversa inesperada',
    },
  }),
]);

const VIH_CARGA = [
  dak('HIV', 'HIV.D.DE391', 'vih_motivo_carga_viral', {
    nombre: 'Motivo de la carga viral',
    traduccion: {
      'HIV.D.DE392': 'Control de rutina',
      'HIV.D.DE393': 'Control dirigido (sospecha clínica)',
      'HIV.D.DE394': 'Primera carga viral',
      'HIV.D.DE395': 'Control después de la consejería reforzada de adherencia',
    },
  }),
  dak('HIV', 'HIV.D.DE225', 'vih_fracaso_tratamiento', {
    nombre: 'Fracaso del tratamiento antirretroviral',
    traduccion: {
      'HIV.D.DE226': 'Fracaso clínico',
      'HIV.D.DE227': 'Fracaso inmunológico',
      'HIV.D.DE228': 'Fracaso virológico',
    },
    extra: 'Dejar en blanco si no hay fracaso.',
  }),
];

const VIH_TAMIZAJES = [
  dak('HIV', 'HIV.D.DE17', 'vih_signos_enfermedad_grave', {
    nombre: 'Signos de enfermedad grave',
    traduccion: {
      'HIV.D.DE18': 'Fiebre de 39 °C o más',
      'HIV.D.DE19': 'Taquicardia',
      'HIV.D.DE20': 'Taquipnea',
      'HIV.D.DE21': 'No puede caminar sin ayuda',
      'HIV.D.DE22': 'Letargo',
      'HIV.D.DE23': 'Inconsciencia',
      'HIV.D.DE24': 'Convulsiones',
      'HIV.D.DE25': 'No puede beber (niño)',
      'HIV.D.DE26': 'No puede mamar (lactante o niño)',
      'HIV.D.DE27': 'Vómitos repetidos',
      'HIV.D.DE28': 'Cefalea',
    },
    extra: 'Cualquiera de estos signos indica triaje o referencia de urgencia.',
  }),
  dak('HIV', 'HIV.D.DE973', 'vih_sintomas_tb', {
    nombre: 'Síntomas de tuberculosis (tamizaje)',
    multiple: true,
    traduccion: {
      'HIV.D.DE974': 'Tos actual',
      'HIV.D.DE975': 'Tos de 2 semanas o más',
      'HIV.D.DE976': 'Fiebre de 39 °C o más',
      'HIV.D.DE977': 'Pérdida de peso (referida)',
      'HIV.D.DE978': 'Sudoración nocturna',
      'HIV.D.DE979': 'Poca ganancia de peso (niño)',
      'HIV.D.DE980': 'Juega menos (niño)',
      'HIV.D.DE981': 'Dolor torácico',
      'HIV.D.DE982': 'Hemoptisis',
      'HIV.D.DE983': 'Letargo',
      'HIV.D.DE984': 'Ninguno',
    },
    extra:
      'La DAK lo marca como respuesta única; se ofrece como varias porque los síntomas pueden coexistir.',
  }),
  dak('HIV', 'HIV.D.DE986', 'vih_resultado_tamizaje_tb', {
    nombre: 'Resultado del tamizaje de tuberculosis',
    traduccion: {
      'HIV.D.DE987': 'Positivo',
      'HIV.D.DE988': 'Negativo',
      'HIV.D.DE989': 'No concluyente',
    },
  }),
  dak('HIV', 'HIV.D.DE162', 'vih_hbsag', {
    nombre: 'HBsAg (hepatitis B)',
    traduccion: {
      'HIV.D.DE163': 'Positivo',
      'HIV.D.DE164': 'Negativo',
      'HIV.D.DE165': 'Indeterminado',
    },
  }),
  dak('HIV', 'HIV.D.DE170', 'vih_vhc', {
    nombre: 'Prueba de hepatitis C',
    traduccion: {
      'HIV.D.DE171': 'Positiva',
      'HIV.D.DE172': 'Negativa',
      'HIV.D.DE173': 'Indeterminada',
    },
  }),
];

/* Planificación familiar: DAK de planificación familiar (FP). */
const FP_MOTIVO = [
  dak('FP', 'FP.DE.0059', 'fp_motivo_visita', {
    nombre: 'Motivo de la visita',
    traduccion: {
      'FP.DE.0060': 'Dejar la anticoncepción',
      'FP.DE.0061': 'Consejería en anticoncepción',
      'FP.DE.0062': 'Iniciar anticoncepción',
      'FP.DE.0063': 'Continuar con el método actual',
      'FP.DE.0064': 'Anticoncepción de emergencia',
      'FP.DE.0065': 'Problemas o dudas con el método',
      'FP.DE.0066': 'Retiro del implante',
      'FP.DE.0067': 'Retiro del DIU',
      'FP.DE.0068': 'Cambio de método',
    },
  }),
  dak('FP', 'FP.DE.0074', 'fp_intencion_embarazo', {
    nombre: '¿Desea un embarazo en el próximo año?',
    traduccion: {
      'FP.DE.0075': 'Sí, quiero quedar embarazada',
      'FP.DE.0076': 'Me da lo mismo',
      'FP.DE.0077': 'No, no quiero quedar embarazada',
      'FP.DE.0078': 'No está segura',
    },
  }),
  ...si('fp_motivo_visita', 'Dejar la anticoncepción', [
    dak('FP', 'FP.DE.0069', 'fp_motivo_dejar_metodo', {
      nombre: 'Motivo para dejar el método',
      traduccion: {
        'FP.DE.0070': 'Efectos adversos',
        'FP.DE.0071': 'Desea un embarazo',
        'FP.DE.0072': 'Falla del método (embarazo no buscado)',
      },
    }),
  ]),
  ...si('fp_motivo_visita', 'Problemas o dudas con el método', [
    dak('FP', 'FP.DE.0216', 'fp_problemas_metodo', {
      nombre: 'Problemas con el método',
      traduccion: {
        'FP.DE.0217': 'Sangrado abundante o prolongado',
        'FP.DE.0218': 'Sangrado irregular',
        'FP.DE.0219': 'Amenorrea',
        'FP.DE.0220': 'Sangrado vaginal inexplicado',
        'FP.DE.0221': 'Cólicos y dolor',
        'FP.DE.0222': 'Posible anemia',
        'FP.DE.0223': 'La pareja siente los hilos del DIU',
        'FP.DE.0224': 'Dolor intenso en el bajo vientre',
        'FP.DE.0225': 'Sospecha de perforación',
        'FP.DE.0226': 'Expulsión parcial del DIU',
        'FP.DE.0227': 'Expulsión completa del DIU',
        'FP.DE.0228': 'No se encuentran los hilos del DIU',
        'FP.DE.0229': 'Acné',
        'FP.DE.0230': 'Cefaleas comunes',
        'FP.DE.0231': 'Sensibilidad mamaria',
        'FP.DE.0232': 'Cambio de peso',
        'FP.DE.0233': 'Náuseas o mareos',
        'FP.DE.0234': 'Cardiopatía isquémica',
        'FP.DE.0235': 'Migraña',
        'FP.DE.0236': 'Olvido de píldoras',
        'FP.DE.0237': 'Inyección atrasada',
        'FP.DE.0238': 'Cambios de ánimo o del deseo sexual',
        'FP.DE.0239': 'Sospecha de embarazo',
        'FP.DE.0240': 'Problemas con el parche',
        'FP.DE.0241': 'Problemas con el anillo vaginal',
        'FP.DE.0242': 'Cambio en el momento de la menstruación',
        'FP.DE.0243': 'Sangrado o coágulos',
        'FP.DE.0244': 'Dolor que dura meses',
        'FP.DE.0245': 'Infección en el sitio de inserción o incisión',
        'FP.DE.0246': 'Absceso',
        'FP.DE.0247': 'Dificultad para usar el preservativo',
        'FP.DE.0248': 'Irritación genital',
        'FP.DE.0249': 'Preservativo mal usado, roto o deslizado',
        'FP.DE.0250': 'Dificultad para convencer a la pareja',
        'FP.DE.0251': 'El preservativo hace ruido',
        'FP.DE.0252': 'Trombosis venosa profunda',
        'FP.DE.0253': 'Embarazo ectópico',
        'FP.DE.0254': 'Infarto de miocardio',
        'FP.DE.0255': 'Enfermedad hepática',
        'FP.DE.0256': 'Enfermedad inflamatoria pélvica',
        'FP.DE.0257': 'Embolia pulmonar',
        'FP.DE.0258': 'Embarazo ectópico roto',
        'FP.DE.0259': 'Alergia grave al látex',
        'FP.DE.0260': 'Accidente cerebrovascular',
        'FP.DE.0261': 'Síndrome de shock tóxico',
      },
    }),
  ]),
];

/* Prenatal: DAK de atención prenatal (ANC), verificación rápida. */
const ANC_PELIGRO = [
  dak('ANC', 'ANC.B5.DE48', 'anc_signos_de_peligro', {
    nombre: 'Signos de peligro (verificación rápida al llegar)',
    traduccion: {
      'ANC.B5.DE49': 'Sin signos de peligro',
      'ANC.B5.DE50': 'Sangrado vaginal',
      'ANC.B5.DE51': 'Cianosis central',
      'ANC.B5.DE52': 'Convulsiones',
      'ANC.B5.DE53': 'Fiebre',
      'ANC.B5.DE54': 'Parto inminente',
      'ANC.B5.DE55': 'Trabajo de parto',
      'ANC.B5.DE56': 'Aspecto de estar muy enferma',
      'ANC.B5.DE57': 'Cefalea intensa',
      'ANC.B5.DE58': 'Dolor intenso (no abdominal)',
      'ANC.B5.DE59': 'Vómitos intensos',
      'ANC.B5.DE60': 'Dolor abdominal intenso',
      'ANC.B5.DE61': 'Inconsciente',
      'ANC.B5.DE62': 'Alteraciones visuales',
    },
    extra:
      'Se verifica antes de cada contacto: cualquier signo de peligro indica atención o referencia de urgencia.',
  }),
];

Object.assign(MEJORAS, {
  GINOBS_CTRL_PUERPERIO: {
    version: 2,
    nota: NOTA_DAK(
      'signos de peligro, molestias, examen uterino y perineal o de la herida de cesárea, problemas de lactancia, indagación de depresión posnatal y método anticonceptivo posparto',
      'PNC',
    ),
    aplicar: (c) =>
      despues(
        despues(
          despues(
            despues(
              despues(c, 'dias_posparto', PUERPERIO_PELIGRO),
              'involucion_uterina',
              PUERPERIO_UTERO,
            ),
            'lactancia',
            PUERPERIO_MAMAS,
          ),
          'animo_puerperio',
          PUERPERIO_ANIMO,
        ),
        'anticoncepcion_posparto',
        PUERPERIO_METODO,
      ),
  },
  INFECTO_CTRL_VIH: {
    version: 2,
    nota: NOTA_DAK(
      'motivos de mala adherencia, toxicidad limitante, motivo de la carga viral, fracaso terapéutico, signos de enfermedad grave, tamizaje de tuberculosis y hepatitis B y C',
      'HIV',
    ),
    aplicar: (c) =>
      despues(
        despues(
          despues(
            despues(c, 'adherencia', VIH_ADHERENCIA),
            'efectos_adversos',
            VIH_TOXICIDAD,
          ),
          'carga_viral',
          VIH_CARGA,
        ),
        'vih_sintomas',
        VIH_TAMIZAJES,
      ),
  },
  MEDFAM_CTRL_PLANIFICACION: {
    version: 2,
    nota: NOTA_DAK(
      'motivo de la visita, intención de embarazo, motivo para dejar el método y problemas con el método',
      'FP',
    ),
    aplicar: (c) => despues(c, 'tipo_de_evaluacion', FP_MOTIVO),
  },
  GINOBS_CONTROL_PRENATAL: {
    version: 3,
    nota: NOTA_DAK('signos de peligro de la verificación rápida', 'ANC'),
    aplicar: (c) => antes(c, 'signos_de_alarma_obstetricos', ANC_PELIGRO),
  },
});

/* El recién nacido ya tenía mejora de la pasada 1 (Apgar): se encadena. */
{
  const pasada1 = MEJORAS.PEDIA_RECIEN_NACIDO;
  MEJORAS.PEDIA_RECIEN_NACIDO = {
    version: 2,
    nota: `${pasada1.nota} ${NOTA_DAK(
      'examen físico del neonato, alimentación, posición para dormir, vitamina K y signos de peligro que faltaban',
      'PNC',
    )}`,
    aplicar: (c) =>
      sumarOpciones(
        despues(
          despues(
            despues(pasada1.aplicar(c), 'perimetro_cefalico_cm', RN_EXAMEN),
            'lactancia_primera_hora',
            RN_CUIDADOS,
          ),
          'vacunas_rn',
          RN_VITAMINA_K,
        ),
        'signos_peligro_rn',
        RN_PELIGRO_DAK,
        `Ampliada (${FECHA}) con los signos de peligro del elemento PNC.B4b.DE.1 de la ${citaDak('PNC')}; traducción propia, no oficial. ${DESCARGO_OMS}`,
      ),
  };
}

ESPECIFICAS_INTL.push({
  code: 'INFECTO_CTRL_ITS',
  carpeta: 'infectologia',
  nombre: 'Infecciones de transmisión sexual: evaluación y control',
  fuente: 'OMS_DAK_HIV',
  fecha: FECHA,
  nota: `Estructura de cuadro agudo del catálogo (NT 022). Factores de riesgo de la DAK de planificación familiar y ITS (FP.DE.0183) y síndrome, pruebas y resultados de la DAK de VIH de la OMS (HIV.D.DE778, DE789, DE802, DE808). Traducción propia del inglés, no oficial. ${DESCARGO_OMS}`,
  campos: () =>
    control({
      condicion: 'infección de transmisión sexual',
      modo: 'agudo',
      evaluacion: [
        dak('FP', 'FP.DE.0183', 'its_factores_de_riesgo', {
          nombre: 'Factores de riesgo de ITS',
          traduccion: {
            'FP.DE.0184': 'Mujer adolescente',
            'FP.DE.0185': 'Vive con VIH',
            'FP.DE.0186': 'Cambia con frecuencia de pareja sexual',
            'FP.DE.0187': 'Varias parejas sexuales',
            'FP.DE.0188': 'Trabajo sexual',
            'FP.DE.0189': 'Cliente de trabajo sexual',
            'FP.DE.0190': 'Separado de su pareja habitual por largos periodos',
            'FP.DE.0191':
              'Relaciones sin preservativo con una pareja que tiene una ITS',
            'FP.DE.0192': 'ITS en el último año',
            'FP.DE.0193':
              'Perforaciones de la piel con agujas no estériles (tatuajes, piercing, inyecciones)',
            'FP.DE.0194': 'Pareja con conductas de riesgo',
          },
        }),
        dak('HIV', 'HIV.D.DE778', 'its_sindrome', {
          nombre: 'Síndrome o ITS diagnosticada',
          req: true,
          traduccion: {
            'HIV.D.DE779': 'Síndrome de secreción uretral',
            'HIV.D.DE780': 'Síndrome de flujo vaginal',
            'HIV.D.DE781': 'Dolor abdominal bajo',
            'HIV.D.DE782': 'Síndrome de úlcera genital',
            'HIV.D.DE783': 'Secreción anorrectal',
            'HIV.D.DE784': 'Muestra enviada a estudio',
          },
        }),
        dak('HIV', 'HIV.D.DE789', 'its_pruebas', {
          nombre: 'ITS estudiadas',
          traduccion: {
            'HIV.D.DE790': 'Neisseria gonorrhoeae',
            'HIV.D.DE791': 'Chlamydia trachomatis',
            'HIV.D.DE792': 'Trichomonas vaginalis',
            'HIV.D.DE793': 'Sífilis (Treponema pallidum)',
            'HIV.D.DE794': 'Virus del herpes simple (VHS-1, VHS-2)',
            'HIV.D.DE795': 'Mycoplasma genitalium',
            'HIV.D.DE796': 'Mpox',
            'HIV.D.DE797': 'Hepatitis B',
            'HIV.D.DE798': 'Hepatitis C',
          },
        }),
        ...si('its_pruebas', 'Sífilis (Treponema pallidum)', [
          dak('HIV', 'HIV.D.DE802', 'its_resultado_sifilis', {
            nombre: 'Resultado de la prueba de sífilis',
            traduccion: {
              'HIV.D.DE803': 'Positivo',
              'HIV.D.DE804': 'Negativo',
              'HIV.D.DE805': 'No concluyente',
            },
          }),
        ]),
        ...si('its_pruebas', 'Neisseria gonorrhoeae', [
          dak('HIV', 'HIV.D.DE808', 'its_resultado_gonorrea', {
            nombre: 'Resultado de la prueba de gonorrea',
            traduccion: {
              'HIV.D.DE809': 'Positivo',
              'HIV.D.DE810': 'Negativo',
              'HIV.D.DE811': 'No concluyente',
            },
          }),
        ]),
      ],
    }),
});

/* -- Pasada 3: DAK de inmunizaciones de la OMS --------------------------- */

const IMMZ = 'IMMZ';

ESPECIFICAS_INTL.push({
  code: 'ENFER_CTRL_VACUNACION',
  carpeta: 'enfermeria',
  nombre: 'Vacunación: registro de la dosis y de eventos adversos (ESAVI)',
  fuente: 'OMS_DAK_IMMZ',
  fecha: FECHA,
  nota: `Estructura de evaluación puntual del catálogo (NT 022) y elementos de datos de la actividad «Administer vaccine» (IMMZ.D) de la DAK de inmunizaciones de la OMS. No fija esquemas ni edades de vacunación: el calendario es el del programa nacional. Traducción propia del inglés, no oficial. ${DESCARGO_OMS}`,
  campos: () =>
    control({
      condicion: 'vacunación',
      modo: 'evaluacion',
      evaluacion: [
        dak(IMMZ, 'IMMZ.D.DE.126', 'immz_enfermedad_prevenida', {
          nombre: 'Enfermedad que previene la vacuna aplicada',
          req: true,
          traduccion: {
            'IMMZ.D.DE.127': 'Fiebre tifoidea',
            'IMMZ.D.DE.128': 'Influenza',
            'IMMZ.D.DE.129': 'Sarampión',
            'IMMZ.D.DE.133': 'Tos ferina',
            'IMMZ.D.DE.135': 'Parotiditis',
            'IMMZ.D.DE.136': 'Varicela',
            'IMMZ.D.DE.137': 'Hepatitis A',
            'IMMZ.D.DE.139': 'Tuberculosis',
            'IMMZ.D.DE.140': 'Hepatitis B',
            'IMMZ.D.DE.141': 'Haemophilus influenzae tipo b',
            'IMMZ.D.DE.142': 'Tétanos',
            'IMMZ.D.DE.143': 'Rotavirus',
            'IMMZ.D.DE.144': 'Virus del papiloma humano',
            'IMMZ.D.DE.175': 'Encefalitis japonesa',
            'IMMZ.D.DE.146': 'Poliomielitis',
            'IMMZ.D.DE.176': 'Difteria',
            'IMMZ.D.DE.177': 'Enfermedad neumocócica',
            'IMMZ.D.DE.178': 'Rubéola',
            'IMMZ.D.DE.179': 'Dengue',
            'IMMZ.D.DE.180': 'Rabia',
            'IMMZ.D.DE.181': 'Enfermedad meningocócica',
            'IMMZ.D.DE.182': 'Cólera',
            'IMMZ.D.DE.183': 'Encefalitis transmitida por garrapatas',
            'IMMZ.D.DE.184': 'Fiebre amarilla',
            'IMMZ.D.DE.148': 'COVID-19',
          },
        }),
        dak(IMMZ, 'IMMZ.D.DE.258', 'immz_tipo_de_dosis', {
          nombre: 'Tipo de dosis',
          traduccion: {
            'IMMZ.D.DE.259': 'Serie primaria',
            'IMMZ.D.DE.260': 'Dosis cero (fuera de la serie habitual)',
            'IMMZ.D.DE.261': 'Dosis suplementaria',
            'IMMZ.D.DE.262': 'Refuerzo',
          },
        }),
        i('immz_numero_de_dosis', 'Número de dosis', {
          ayuda: `Elemento IMMZ.D.DE.124 «Dose number» de la ${citaDak(IMMZ)}.`,
        }),
        s('immz_lote', 'Lote de la vacuna', {
          ayuda: `Elemento IMMZ.D.DE.24 «Vaccine batch number» de la ${citaDak(IMMZ)}.`,
        }),
        dak(IMMZ, 'IMMZ.D.DE.161', 'immz_contraindicaciones', {
          nombre: 'Posibles contraindicaciones o precauciones presentes',
          traduccion: {
            'IMMZ.D.DE.162': 'Embarazo actual',
            'IMMZ.D.DE.163': 'Inmunocomprometido',
            'IMMZ.D.DE.200': 'Gravemente inmunocomprometido',
            'IMMZ.D.DE.164': 'Tratamiento inmunosupresor actual o reciente',
            'IMMZ.D.DE.165': 'Gravemente inmunosuprimido',
            'IMMZ.D.DE.187': 'Síndrome de inmunodeficiencia',
            'IMMZ.D.DE.166': 'Antecedente de anafilaxia',
            'IMMZ.D.DE.167': 'Reacción alérgica grave',
            'IMMZ.D.DE.168': 'Infección por VIH sintomática',
            'IMMZ.D.DE.169': 'Planea embarazarse en el próximo mes',
            'IMMZ.D.DE.170': 'Recibe hemoderivados',
            'IMMZ.D.DE.188': 'Enfermedad aguda grave',
            'IMMZ.D.DE.190': 'Tuberculosis activa',
            'IMMZ.D.DE.191': 'Lactancia',
            'IMMZ.D.DE.192': 'Espina bífida',
            'IMMZ.D.DE.193': 'Extrofia vesical',
            'IMMZ.D.DE.194': 'Gastroenteritis aguda',
            'IMMZ.D.DE.195': 'Fiebre moderada a alta',
            'IMMZ.D.DE.196': 'Antecedente de invaginación intestinal',
            'IMMZ.D.DE.197': 'Inmunocompetencia alterada',
            'IMMZ.D.DE.198': 'Hipersensibilidad a componentes de la vacuna',
            'IMMZ.D.DE.199': 'Toma antibióticos',
          },
          extra:
            'Cuál de estas condiciones contraindica cada vacuna lo define la ficha técnica y la norma del programa nacional.',
        }),
        dak(IMMZ, 'IMMZ.D.DE.1', 'immz_estado', {
          nombre: 'Estado de la vacunación',
          req: true,
          traduccion: {
            'IMMZ.D.DE.2': 'Aplicada',
            'IMMZ.D.DE.3': 'Registrada por error',
            'IMMZ.D.DE.4': 'No aplicada',
          },
        }),
        ...si('immz_estado', 'No aplicada', [
          dak(IMMZ, 'IMMZ.D.DE.5', 'immz_motivo_no_aplicada', {
            nombre: 'Motivo por el que no se aplicó',
            req: true,
            traduccion: {
              'IMMZ.D.DE.6': 'Inmunidad comprobada',
              'IMMZ.D.DE.7': 'Precaución médica',
              'IMMZ.D.DE.8': 'Falta de la vacuna',
              'IMMZ.D.DE.9': 'Objeción de la persona o su tutor',
              'IMMZ.D.DE.10': 'Rechazo del cuidador',
              'IMMZ.D.DE.11': 'Motivo no especificado',
              'IMMZ.D.DE.12': 'Alergia a la vacuna o a un componente',
              'IMMZ.D.DE.13': 'Inmunocomprometido',
              'IMMZ.D.DE.14': 'Enfermedad o condición crónica',
              'IMMZ.D.DE.15': 'Enfermedad aguda',
              'IMMZ.D.DE.16': 'Ya tuvo la enfermedad',
              'IMMZ.D.DE.17': 'Otros motivos',
            },
          }),
        ]),
        b(
          'immz_esavi',
          'Evento supuestamente atribuible a la vacunación (ESAVI)',
          {
            ayuda: `Elementos IMMZ.D.DE.95, DE.107 y DE.115 de la ${citaDak(IMMZ)}.`,
          },
        ),
        ...si('immz_esavi', true, [
          dak(IMMZ, 'IMMZ.D.DE.95', 'immz_esavi_manifestacion', {
            nombre: 'Manifestación del evento',
            req: true,
            traduccion: {
              'IMMZ.D.DE.96': 'Reacción local grave',
              'IMMZ.D.DE.98': 'Convulsiones',
              'IMMZ.D.DE.99': 'Absceso',
              'IMMZ.D.DE.100': 'Sepsis',
              'IMMZ.D.DE.101': 'Encefalopatía',
              'IMMZ.D.DE.102': 'Síndrome de shock tóxico',
              'IMMZ.D.DE.103': 'Anafilaxia',
              'IMMZ.D.DE.104': 'Fiebre',
            },
          }),
          dak(IMMZ, 'IMMZ.D.DE.107', 'immz_esavi_gravedad', {
            nombre: 'Gravedad del evento',
            traduccion: {
              'IMMZ.D.DE.174': 'No grave',
              'IMMZ.D.DE.108': 'Muerte',
              'IMMZ.D.DE.109': 'Puso en riesgo la vida',
              'IMMZ.D.DE.110': 'Discapacidad',
              'IMMZ.D.DE.111': 'Hospitalización',
              'IMMZ.D.DE.112': 'Anomalía congénita',
            },
          }),
          dak(IMMZ, 'IMMZ.D.DE.115', 'immz_esavi_desenlace', {
            nombre: 'Desenlace del evento',
            traduccion: {
              'IMMZ.D.DE.116': 'Falleció',
              'IMMZ.D.DE.117': 'Recuperado',
              'IMMZ.D.DE.118': 'Recuperado con secuelas',
              'IMMZ.D.DE.119': 'En recuperación',
              'IMMZ.D.DE.120': 'No recuperado',
              'IMMZ.D.DE.121': 'Desconocido',
            },
          }),
        ]),
      ],
    }),
});

/* -- Pasada 4: HL7 FHIR International Patient Summary --------------------- */

const IPS =
  'HL7 FHIR International Patient Summary (IPS), perfil Composition (uv-ips); https://github.com/HL7/fhir-ips, commit df27097; licencia FHIR de HL7 (CC0)';
const ips = (seccion) => `Sección «${seccion}» del ${IPS}.`;

const EPICRISIS_IPS = seccion('Resumen para la continuidad (IPS)', [
  alergias('alergias_ips_detalle').map((c) =>
    c.code === 'tiene_alergias'
      ? { ...c, description: ips('Allergies and Intolerances (obligatoria)') }
      : c,
  ),
  b('vacunas_en_internacion', 'Se aplicaron vacunas durante la internación', {
    ayuda: ips('Immunizations'),
  }),
  ...si('vacunas_en_internacion', true, [
    t('vacunas_en_internacion_cuales', '¿Cuáles, con fecha y lote?', {
      req: true,
    }),
  ]),
  b('dispositivos_medicos', 'Porta o se le colocó un dispositivo médico', {
    ayuda: `${ips('Medical Devices')} Por ejemplo: marcapasos, prótesis, catéter, sonda.`,
  }),
  ...si('dispositivos_medicos', true, [
    t('dispositivos_medicos_cuales', '¿Cuál y desde cuándo?', { req: true }),
  ]),
  b('embarazo_en_curso', 'Cursa un embarazo', {
    ayuda: `${ips('History of Pregnancy')} El value set de estado de embarazo del IPS es SNOMED CT y no se usa.`,
  }),
  t('estado_funcional_al_egreso', 'Estado funcional al egreso', {
    ayuda: `${ips('Functional Status')} Autonomía, movilidad, necesidad de ayuda o de cuidador.`,
  }),
  b('directivas_anticipadas', 'Tiene directivas anticipadas', {
    ayuda: ips('Advance Directives'),
  }),
  ...si('directivas_anticipadas', true, [
    t('directivas_anticipadas_detalle', '¿Cuáles y dónde constan?', {
      req: true,
    }),
  ]),
  t('alertas_clinicas', 'Alertas para quien continúe la atención', {
    ayuda: `${ips('Alerts')} Riesgos o condiciones que el próximo profesional tiene que saber.`,
  }),
]);

MEJORAS.TRANSV_EPICRISIS = {
  version: 3,
  nota: `Ampliación internacional (${FECHA}): secciones del International Patient Summary de HL7 que la epicrisis no tenía (alergias, inmunizaciones, dispositivos, embarazo, estado funcional, directivas anticipadas y alertas). Sólo la estructura de secciones: no se usan los value sets SNOMED CT del IPS.`,
  aplicar: (c) => antes(c, 'condicion_al_egreso', EPICRISIS_IPS),
};
