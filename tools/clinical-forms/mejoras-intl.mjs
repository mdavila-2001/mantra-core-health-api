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
import { b, control, i, si, una } from './lib.mjs';
import { escala, factores } from './openehr/escalas.mjs';

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
