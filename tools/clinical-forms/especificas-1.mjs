/**
 * Fichas específicas por condición — clínicas (1 de 3): cardiología,
 * endocrinología, neumología, gastroenterología, nefrología y neurología.
 *
 * Cada especialidad tiene una ficha **base** (la consulta inicial, en su
 * carpeta) y estas fichas **específicas**: el control estándar de cada
 * enfermedad o condición frecuente, con lo que su guía de referencia pide
 * registrar en cada visita.
 */
import {
  b,
  control,
  d,
  f,
  i,
  s,
  si,
  socrates,
  t,
  una,
  varias,
} from './lib.mjs';
import {
  ACV,
  ASMA,
  CEFALEA,
  CHAGAS,
  CONVULSION,
  DM2,
  HTA,
  IC,
  MMRC,
  NEUMONIA,
  TBC,
} from './sindromes.mjs';

const PA = () => [
  i('presion_arterial_sistolica', 'Presión arterial sistólica (mmHg)', {
    req: true,
  }),
  i('presion_arterial_diastolica', 'Presión arterial diastólica (mmHg)', {
    req: true,
  }),
  i('frecuencia_cardiaca', 'Frecuencia cardíaca (lpm)'),
];
const PESO = () => [
  d('peso_kg', 'Peso (kg)'),
  d('perimetro_abdominal_cm', 'Perímetro abdominal (cm)'),
];
const ESTILO_DE_VIDA = [
  'Dieta con menos sal',
  'Actividad física',
  'Dejar de fumar',
  'Reducir el alcohol',
  'Adherencia a la medicación',
  'Signos de alarma',
];

export const ESPECIFICAS_1 = [
  /* ---- Cardiología ---- */
  {
    code: 'CARDIO_CTRL_HTA',
    carpeta: 'cardiologia',
    nombre: 'Control de hipertensión arterial',
    fuente: 'OMS_HEARTS',
    nota: 'Estructura de la visita de control del módulo de hipertensión de HEARTS: cifras, adherencia, daño de órgano blanco y meta < 140/90 (< 130/80 en alto riesgo).',
    campos: () =>
      control({
        condicion: 'hipertensión arterial',
        evaluacion: [
          ...PA(),
          ...PESO(),
          ...HTA().filter((c) => c.code !== 'hta_adherencia'),
        ],
        complicaciones: [
          varias('hta_dano_organo', 'Daño de órgano blanco conocido', [
            'Hipertrofia ventricular izquierda',
            'Enfermedad renal crónica',
            'Retinopatía',
            'ACV previo',
            'Cardiopatía isquémica',
            'Ninguno',
          ]),
          d('creatinina', 'Última creatinina (mg/dL)'),
          b('ecg_hecho', 'ECG en el último año'),
        ],
        metas: [
          'PA < 140/90 mmHg',
          'PA < 130/80 mmHg (alto riesgo)',
          'No fuma',
          'IMC < 25',
        ],
        educacion: ESTILO_DE_VIDA,
      }),
  },
  {
    code: 'CARDIO_CTRL_IC',
    carpeta: 'cardiologia',
    nombre: 'Control de insuficiencia cardíaca',
    fuente: 'MINSA_NT022',
    nota: 'Estructura de la historia clínica de la NT 022; contenido de la visita de seguimiento: clase funcional NYHA, signos de congestión (criterios de Framingham), peso seco y fracción de eyección.',
    campos: () =>
      control({
        condicion: 'insuficiencia cardíaca',
        evaluacion: [
          ...IC(),
          d('peso_hoy', 'Peso de hoy (kg)', { req: true }),
          ...PA(),
          i('fevi', 'Última fracción de eyección (%)'),
          una('fevi_tipo', 'Tipo según fracción de eyección', [
            'Reducida (≤ 40 %)',
            'Levemente reducida (41–49 %)',
            'Preservada (≥ 50 %)',
            'Sin ecocardiograma',
          ]),
        ],
        complicaciones: [
          i(
            'internaciones_ic_anio',
            'Internaciones por insuficiencia cardíaca en el último año',
          ),
          d('potasio', 'Último potasio (mEq/L)'),
          d('creatinina', 'Última creatinina (mg/dL)'),
        ],
        metas: [
          'Sin congestión',
          'Peso estable',
          'Recibe los cuatro pilares de tratamiento si la FE está reducida',
        ],
        educacion: [
          'Pesarse todos los días',
          'Restricción de sal y líquidos',
          'Signos de alarma',
          'Adherencia a la medicación',
        ],
      }),
  },
  {
    code: 'CARDIO_CTRL_FA',
    carpeta: 'cardiologia',
    nombre: 'Control de fibrilación auricular y anticoagulación',
    fuente: 'MINSA_NT022',
    nota: 'Estructura de la NT 022; riesgo embólico por CHA₂DS₂-VASc y de sangrado por HAS-BLED (puntajes publicados de uso libre).',
    campos: () =>
      control({
        condicion: 'fibrilación auricular',
        evaluacion: [
          una('fa_tipo', 'Tipo', ['Paroxística', 'Persistente', 'Permanente'], {
            req: true,
          }),
          una('fa_estrategia', 'Estrategia', [
            'Control de frecuencia',
            'Control de ritmo',
          ]),
          i('frecuencia_cardiaca', 'Frecuencia cardíaca (lpm)', { req: true }),
          varias('chads_vasc', 'CHA₂DS₂-VASc: factores presentes', [
            'Insuficiencia cardíaca',
            'Hipertensión',
            'Edad ≥ 75 (2)',
            'Diabetes',
            'ACV o embolia previa (2)',
            'Enfermedad vascular',
            'Edad 65–74',
            'Sexo femenino',
          ]),
          i('chads_vasc_puntaje', 'CHA₂DS₂-VASc — puntaje', { req: true }),
          i('has_bled_puntaje', 'HAS-BLED — puntaje'),
          una('anticoagulante', 'Anticoagulación', [
            'Warfarina o acenocumarol',
            'Anticoagulante directo',
            'Sin anticoagulación',
          ]),
          ...si('anticoagulante', 'Warfarina o acenocumarol', [
            d('inr', 'Último INR', { req: true }),
          ]),
        ],
        complicaciones: [
          b('sangrado', 'Sangrado desde el último control'),
          ...si('sangrado', true, [
            s('sangrado_donde', '¿Dónde y de qué gravedad?', { req: true }),
          ]),
        ],
        metas: [
          'Frecuencia en reposo < 110 lpm',
          'INR entre 2 y 3 (si usa warfarina)',
          'Anticoagulado si CHA₂DS₂-VASc lo indica',
        ],
        educacion: [
          'Signos de sangrado',
          'Interacciones con otros fármacos',
          'Controles de INR',
        ],
      }),
  },
  {
    code: 'CARDIO_CTRL_ISQUEMICA',
    carpeta: 'cardiologia',
    nombre: 'Control de cardiopatía isquémica (después de un infarto o angina)',
    fuente: 'OMS_HEARTS',
    nota: 'Prevención secundaria según HEARTS: angina residual, metas de PA y LDL, antiagregación y estatina.',
    campos: () =>
      control({
        condicion: 'cardiopatía isquémica',
        evaluacion: [
          b('angina', 'Angina desde el último control'),
          ...socrates('angina', 'angina', true, { sitio: false }),
          una('angina_ccs', 'Clase de angina (CCS)', [
            'I — sólo con esfuerzo intenso',
            'II — limitación leve',
            'III — limitación marcada',
            'IV — con mínima actividad o en reposo',
          ]),
          ...PA(),
          d('ldl', 'Último LDL (mg/dL)'),
          varias('prevencion_secundaria', 'Recibe', [
            'Aspirina u otro antiagregante',
            'Estatina',
            'Betabloqueante',
            'IECA o ARA II',
          ]),
          una('rehabilitacion_cardiaca', 'Rehabilitación cardíaca', [
            'Completa',
            'En curso',
            'No la hizo',
          ]),
        ],
        metas: ['Sin angina', 'PA < 130/80 mmHg', 'LDL < 55 mg/dL', 'No fuma'],
        educacion: ESTILO_DE_VIDA,
      }),
  },
  {
    code: 'CARDIO_CTRL_CHAGAS',
    carpeta: 'cardiologia',
    nombre: 'Control de cardiopatía chagásica',
    fuente: 'OMS_CHAGAS',
    nota: 'Seguimiento de la enfermedad de Chagas crónica con compromiso cardíaco: serología, tratamiento antiparasitario, ECG y Holter.',
    campos: () =>
      control({
        condicion: 'enfermedad de Chagas',
        evaluacion: [
          ...CHAGAS(),
          s(
            'ecg_chagas',
            'ECG — hallazgo (bloqueo de rama derecha, hemibloqueo, extrasístoles)',
          ),
          s('holter', 'Holter — hallazgo'),
          i('fevi_chagas', 'Fracción de eyección (%)'),
          varias('sintomas_chagas', 'Síntomas', [
            'Palpitaciones',
            'Síncope',
            'Disnea',
            'Disfagia',
            'Constipación crónica',
            'Ninguno',
          ]),
        ],
        educacion: [
          'Control de vinchucas en la vivienda',
          'Tamizaje de familiares',
          'Tamizaje en embarazo',
        ],
      }),
  },

  /* ---- Endocrinología ---- */
  {
    code: 'ENDO_CTRL_DM2',
    carpeta: 'endocrinologia',
    nombre: 'Control de diabetes mellitus tipo 2',
    fuente: 'OMS_HEARTS_D',
    nota: 'Visita de control de HEARTS-D: glucemia y HbA1c, hipoglucemias, pie, ojo y riñón, y factores de riesgo cardiovascular.',
    campos: () =>
      control({
        condicion: 'diabetes tipo 2',
        evaluacion: [...DM2(), ...PA(), ...PESO()],
        complicaciones: [
          una('fondo_de_ojo', 'Fondo de ojo en el último año', [
            'Normal',
            'Retinopatía',
            'No realizado',
          ]),
          d('albuminuria', 'Relación albúmina/creatinina en orina (mg/g)'),
          d('tfg', 'Filtrado glomerular estimado (mL/min/1,73 m²)'),
          varias('dm_complicaciones', 'Complicaciones conocidas', [
            'Neuropatía',
            'Pie diabético',
            'Retinopatía',
            'Nefropatía',
            'Cardiopatía isquémica',
            'Ninguna',
          ]),
        ],
        metas: [
          'HbA1c < 7 %',
          'PA < 130/80 mmHg',
          'LDL < 100 mg/dL',
          'Pies sin lesiones',
        ],
        educacion: [
          'Alimentación',
          'Actividad física',
          'Cuidado de los pies',
          'Reconocer y tratar una hipoglucemia',
          'Automonitoreo',
        ],
      }),
  },
  {
    code: 'ENDO_CTRL_TIROIDES',
    carpeta: 'endocrinologia',
    nombre: 'Control de hipotiroidismo o hipertiroidismo',
    fuente: 'MINSA_NT022',
    nota: 'Seguimiento de la función tiroidea: TSH y T4 libre, síntomas y examen del cuello.',
    campos: () =>
      control({
        condicion: 'enfermedad tiroidea',
        evaluacion: [
          una(
            'tiroides_condicion',
            'Condición',
            ['Hipotiroidismo', 'Hipertiroidismo', 'Nódulo tiroideo', 'Bocio'],
            { req: true },
          ),
          d('tsh', 'TSH (mUI/L)', { req: true }),
          d('t4_libre', 'T4 libre (ng/dL)'),
          varias('sintomas_tiroideos', 'Síntomas', [
            'Cansancio',
            'Intolerancia al frío',
            'Intolerancia al calor',
            'Palpitaciones',
            'Temblor',
            'Cambio de peso',
            'Ninguno',
          ]),
          i('frecuencia_cardiaca', 'Frecuencia cardíaca (lpm)'),
          d('peso_kg', 'Peso (kg)'),
          una('bocio_oms', 'Bocio (clasificación OMS)', [
            'Grado 0',
            'Grado 1',
            'Grado 2',
          ]),
          ...si('tiroides_condicion', 'Nódulo tiroideo', [
            s('tirads', 'Ecografía — categoría TI-RADS', { req: true }),
          ]),
        ],
        metas: ['TSH en rango', 'Sin síntomas'],
        educacion: [
          'Tomar la levotiroxina en ayunas',
          'Embarazo: avisar para ajustar la dosis',
        ],
      }),
  },
  {
    code: 'ENDO_CTRL_OBESIDAD',
    carpeta: 'endocrinologia',
    nombre: 'Control de obesidad',
    fuente: 'OMS_OBESIDAD',
    nota: 'Clasificación de la OMS por IMC y perímetro abdominal; seguimiento de comorbilidades.',
    campos: () =>
      control({
        condicion: 'obesidad',
        evaluacion: [
          d('peso_kg', 'Peso (kg)', { req: true }),
          d('talla_cm', 'Talla (cm)', { req: true }),
          d('imc', 'IMC (kg/m²)'),
          una(
            'obesidad_grado',
            'Clasificación OMS',
            [
              'Sobrepeso (25–29,9)',
              'Obesidad I (30–34,9)',
              'Obesidad II (35–39,9)',
              'Obesidad III (≥ 40)',
            ],
            { req: true },
          ),
          d('perimetro_abdominal_cm', 'Perímetro abdominal (cm)'),
          d('cambio_de_peso_kg', 'Cambio de peso desde el último control (kg)'),
          varias('comorbilidades_obesidad', 'Comorbilidades', [
            'Diabetes o prediabetes',
            'Hipertensión',
            'Dislipidemia',
            'Apnea del sueño',
            'Hígado graso',
            'Artrosis',
            'Ninguna',
          ]),
        ],
        metas: [
          'Bajó al menos 5 % del peso',
          'Actividad física ≥ 150 min por semana',
        ],
        educacion: ['Alimentación', 'Actividad física', 'Sueño'],
      }),
  },
  {
    code: 'ENDO_CTRL_DISLIPIDEMIA',
    carpeta: 'endocrinologia',
    nombre: 'Control de dislipidemia',
    fuente: 'OMS_HEARTS',
    nota: 'Perfil lipídico y riesgo cardiovascular según el módulo de HEARTS.',
    campos: () =>
      control({
        condicion: 'dislipidemia',
        evaluacion: [
          d('colesterol_total', 'Colesterol total (mg/dL)'),
          d('ldl', 'LDL (mg/dL)', { req: true }),
          d('hdl', 'HDL (mg/dL)'),
          d('trigliceridos', 'Triglicéridos (mg/dL)'),
          una('riesgo_cv', 'Riesgo cardiovascular a 10 años (tabla OMS/OPS)', [
            '< 10 %',
            '10 % a < 20 %',
            '≥ 20 %',
            'Prevención secundaria',
          ]),
          b('estatina', 'Recibe estatina'),
          ...si('estatina', true, [b('mialgias', 'Mialgias con la estatina')]),
        ],
        metas: ['LDL en la meta según su riesgo', 'Triglicéridos < 150 mg/dL'],
        educacion: ['Alimentación', 'Actividad física'],
      }),
  },

  /* ---- Neumología ---- */
  {
    code: 'NEUMO_CTRL_ASMA',
    carpeta: 'neumologia',
    nombre: 'Control de asma',
    fuente: 'GINA',
    nota: 'Control de síntomas de las últimas 4 semanas y riesgo futuro según las categorías de GINA.',
    campos: () =>
      control({
        condicion: 'asma',
        evaluacion: [
          ...ASMA(),
          una(
            'tecnica_inhalatoria',
            'Técnica inhalatoria',
            ['Correcta', 'Con errores', 'No evaluada'],
            { req: true },
          ),
          d('pef', 'Flujo espiratorio máximo (L/min)'),
          d('vef1', 'VEF₁ (% del predicho)'),
          i('saturacion_de_oxigeno', 'Saturación de oxígeno (%)'),
        ],
        complicaciones: [
          b(
            'corticoides_orales',
            'Recibió corticoides orales en el último año',
          ),
        ],
        metas: [
          'Asma controlada',
          'Sin crisis en el año',
          'Técnica inhalatoria correcta',
        ],
        educacion: [
          'Técnica inhalatoria',
          'Plan de acción escrito',
          'Evitar desencadenantes',
        ],
      }),
  },
  {
    code: 'NEUMO_CTRL_EPOC',
    carpeta: 'neumologia',
    nombre: 'Control de EPOC',
    fuente: 'GOLD',
    nota: 'Disnea (mMRC), exacerbaciones y grupo de manejo según las categorías GOLD; exposición a biomasa.',
    campos: () =>
      control({
        condicion: 'EPOC',
        evaluacion: [
          una('epoc_mmrc', 'Disnea (escala mMRC)', MMRC, { req: true }),
          i('epoc_exacerbaciones_anio', 'Exacerbaciones en el último año', {
            req: true,
          }),
          i(
            'epoc_internaciones_anio',
            'Internaciones por exacerbación en el último año',
          ),
          d('vef1', 'VEF₁ posbroncodilatador (% del predicho)'),
          una('gold_grupo', 'Grupo GOLD', ['A', 'B', 'E']),
          i('saturacion_de_oxigeno', 'Saturación de oxígeno (%)', {
            req: true,
          }),
          una('tabaco', 'Tabaco', [
            'Nunca fumó',
            'Exfumador',
            'Fumador actual',
          ]),
          b('epoc_biomasa', 'Exposición a humo de leña o biomasa'),
          b('oxigeno_domiciliario', 'Usa oxígeno en domicilio'),
          una('tecnica_inhalatoria', 'Técnica inhalatoria', [
            'Correcta',
            'Con errores',
            'No evaluada',
          ]),
        ],
        metas: [
          'Sin exacerbaciones',
          'No fuma',
          'Vacunas al día (influenza y neumococo)',
        ],
        educacion: [
          'Dejar de fumar',
          'Técnica inhalatoria',
          'Rehabilitación respiratoria',
          'Signos de exacerbación',
        ],
      }),
  },
  {
    code: 'NEUMO_CTRL_TB',
    carpeta: 'neumologia',
    nombre: 'Control de tratamiento de tuberculosis',
    fuente: 'OMS_TB',
    nota: 'Seguimiento del tratamiento: fase, baciloscopías de control, adherencia (tratamiento directamente observado) y reacciones adversas.',
    campos: () =>
      control({
        condicion: 'tuberculosis',
        evaluacion: [
          ...TBC(),
          una(
            'tb_fase',
            'Fase del tratamiento',
            ['Intensiva', 'Continuación', 'Terminado'],
            { req: true },
          ),
          i('tb_mes', 'Mes de tratamiento'),
          una('tb_taes', 'Tratamiento directamente observado', [
            'Diario sin faltas',
            'Con faltas',
            'No supervisado',
          ]),
          d('peso_kg', 'Peso (kg)'),
          una('vih_tb', 'Prueba de VIH', [
            'Negativa',
            'Positiva',
            'No realizada',
          ]),
        ],
        complicaciones: [
          varias('ram_tb', 'Reacciones adversas', [
            'Hepatotoxicidad',
            'Erupción',
            'Neuropatía',
            'Alteración visual',
            'Ninguna',
          ]),
        ],
        metas: [
          'Baciloscopía negativa al final de la fase intensiva',
          'Sin faltas',
        ],
        educacion: [
          'Adherencia',
          'Estudio de contactos',
          'Medidas de aislamiento respiratorio',
        ],
      }),
  },
  {
    code: 'NEUMO_CTRL_NEUMONIA',
    carpeta: 'neumologia',
    nombre: 'Neumonía adquirida en la comunidad: evaluación y control',
    fuente: 'MINSA_NT022',
    nota: 'Gravedad por CURB-65 (British Thoracic Society) y respuesta al tratamiento a las 48–72 horas.',
    campos: () =>
      control({
        condicion: 'neumonía',
        evaluacion: [
          ...NEUMONIA(),
          i('frecuencia_respiratoria', 'Frecuencia respiratoria (rpm)', {
            req: true,
          }),
          i('saturacion_de_oxigeno', 'Saturación de oxígeno (%)', {
            req: true,
          }),
          d('temperatura', 'Temperatura (°C)'),
          una('respuesta_48h', 'Respuesta a las 48–72 h', [
            'Mejoría',
            'Sin cambios',
            'Empeoramiento',
            'Todavía no corresponde',
          ]),
          s('rx_torax', 'Radiografía de tórax — hallazgo'),
        ],
        metas: ['Afebril', 'Saturación ≥ 92 %'],
        educacion: ['Completar el antibiótico', 'Signos de alarma'],
      }),
  },

  /* ---- Gastroenterología ---- */
  {
    code: 'GASTRO_CTRL_ERGE_DISPEPSIA',
    carpeta: 'gastroenterologia',
    nombre: 'Control de reflujo gastroesofágico y dispepsia',
    fuente: 'MINSA_NT022',
    nota: 'Síntomas típicos y atípicos, signos de alarma que indican endoscopía y estado de Helicobacter pylori.',
    campos: () =>
      control({
        condicion: 'reflujo o dispepsia',
        evaluacion: [
          varias(
            'erge_sintomas',
            'Síntomas',
            [
              'Pirosis',
              'Regurgitación',
              'Dolor epigástrico',
              'Saciedad precoz',
              'Tos crónica',
              'Disfonía',
            ],
            { req: true },
          ),
          i('dias_sintomas_semana', 'Días con síntomas por semana'),
          varias(
            'alarma_digestiva',
            'Signos de alarma',
            [
              'Disfagia',
              'Pérdida de peso',
              'Anemia',
              'Vómitos persistentes',
              'Sangrado',
              'Edad > 50 con síntomas nuevos',
              'Ninguno',
            ],
            { req: true },
          ),
          una('helicobacter', 'Helicobacter pylori', [
            'Positivo, sin tratar',
            'Erradicado',
            'Negativo',
            'No estudiado',
          ]),
          b('aines', 'Consume AINE'),
          s('endoscopia', 'Endoscopía — hallazgo'),
        ],
        metas: ['Sin síntomas', 'H. pylori erradicado'],
        educacion: [
          'Cenar temprano',
          'Elevar la cabecera',
          'Evitar AINE',
          'Bajar de peso',
        ],
      }),
  },
  {
    code: 'GASTRO_CTRL_HEPATOPATIA',
    carpeta: 'gastroenterologia',
    nombre: 'Control de hepatopatía crónica y cirrosis',
    fuente: 'MINSA_NT022',
    nota: 'Gravedad por Child-Pugh (puntaje publicado de uso libre), descompensaciones y tamizaje de hepatocarcinoma.',
    campos: () =>
      control({
        condicion: 'hepatopatía crónica',
        evaluacion: [
          una(
            'hepatopatia_causa',
            'Causa',
            [
              'Alcohol',
              'Hígado graso',
              'Hepatitis B',
              'Hepatitis C',
              'Autoinmune',
              'Otra o no establecida',
            ],
            { req: true },
          ),
          una('child_pugh', 'Child-Pugh', ['A (5–6)', 'B (7–9)', 'C (10–15)'], {
            req: true,
          }),
          varias(
            'descompensaciones',
            'Descompensaciones desde el último control',
            [
              'Ascitis',
              'Encefalopatía',
              'Hemorragia variceal',
              'Ictericia',
              'Ninguna',
            ],
          ),
          d('bilirrubina', 'Bilirrubina total (mg/dL)'),
          d('albumina', 'Albúmina (g/dL)'),
          d('inr', 'INR'),
          una(
            'ecografia_6_meses',
            'Ecografía de tamizaje en los últimos 6 meses',
            ['Sí, sin nódulos', 'Sí, con nódulo', 'No'],
          ),
        ],
        metas: [
          'Abstinencia de alcohol',
          'Tamizaje al día',
          'Vacunas de hepatitis A y B',
        ],
        educacion: [
          'Abstinencia de alcohol',
          'Restricción de sal si hay ascitis',
          'Signos de alarma',
        ],
      }),
  },
  {
    code: 'GASTRO_CTRL_HEMORRAGIA',
    carpeta: 'gastroenterologia',
    nombre: 'Hemorragia digestiva: evaluación inicial',
    fuente: 'MINSA_NT022',
    nota: 'Evaluación hemodinámica y puntaje de Glasgow-Blatchford (publicado, de uso libre) para decidir internación.',
    campos: () =>
      control({
        condicion: 'hemorragia digestiva',
        modo: 'agudo',
        evaluacion: [
          varias(
            'hd_forma',
            'Cómo se manifestó',
            ['Hematemesis', 'Melena', 'Hematoquecia'],
            { req: true },
          ),
          una(
            'hd_estabilidad',
            'Estado hemodinámico',
            ['Estable', 'Taquicardia', 'Hipotensión o shock'],
            { req: true },
          ),
          ...PA(),
          d('hemoglobina', 'Hemoglobina (g/dL)', { req: true }),
          d('urea', 'Urea (mg/dL)'),
          i('glasgow_blatchford', 'Puntaje de Glasgow-Blatchford'),
          varias('hd_factores', 'Factores', [
            'AINE',
            'Anticoagulantes',
            'Cirrosis',
            'Úlcera previa',
            'Alcohol',
          ]),
        ],
        metas: ['Hemodinámicamente estable', 'Endoscopía en menos de 24 h'],
      }),
  },

  /* ---- Nefrología ---- */
  {
    code: 'NEFRO_CTRL_ERC',
    carpeta: 'nefrologia',
    nombre: 'Control de enfermedad renal crónica',
    fuente: 'KDIGO',
    nota: 'Estadio por filtrado (G1–G5) y albuminuria (A1–A3) según las categorías KDIGO; control de PA, anemia y metabolismo mineral.',
    campos: () =>
      control({
        condicion: 'enfermedad renal crónica',
        evaluacion: [
          d('creatinina', 'Creatinina (mg/dL)', { req: true }),
          d('tfg', 'Filtrado glomerular estimado (mL/min/1,73 m²)', {
            req: true,
          }),
          una(
            'erc_estadio_kdigo',
            'Estadio por filtrado',
            [
              'G1 (≥ 90)',
              'G2 (60–89)',
              'G3a (45–59)',
              'G3b (30–44)',
              'G4 (15–29)',
              'G5 (< 15)',
            ],
            { req: true },
          ),
          una('albuminuria', 'Albuminuria', [
            'A1 (< 30 mg/g)',
            'A2 (30–300 mg/g)',
            'A3 (> 300 mg/g)',
            'No medida',
          ]),
          ...PA(),
          d('potasio', 'Potasio (mEq/L)'),
          d('hemoglobina', 'Hemoglobina (g/dL)'),
          una('erc_causa', 'Causa', [
            'Diabetes',
            'Hipertensión',
            'Glomerulopatía',
            'Poliquistosis',
            'Litiasis u obstructiva',
            'No establecida',
          ]),
          una('terapia_renal', 'Terapia de reemplazo', [
            'No la necesita',
            'En preparación',
            'Hemodiálisis',
            'Diálisis peritoneal',
            'Trasplante',
          ]),
        ],
        metas: [
          'PA < 130/80 mmHg',
          'Recibe IECA o ARA II si hay albuminuria',
          'Evita nefrotóxicos',
        ],
        educacion: [
          'Evitar AINE y medicina sin indicación',
          'Alimentación',
          'Ajuste de dosis de fármacos',
        ],
      }),
  },
  {
    code: 'NEFRO_CTRL_LITIASIS',
    carpeta: 'nefrologia',
    nombre: 'Control de litiasis renal',
    fuente: 'MINSA_NT022',
    nota: 'Episodios, tamaño y ubicación del lito, y estudio metabólico.',
    campos: () =>
      control({
        condicion: 'litiasis renal',
        evaluacion: [
          i('colicos_anio', 'Cólicos en el último año'),
          s('lito_tamano', 'Imagen: tamaño y ubicación del lito', {
            req: true,
          }),
          b('hidronefrosis', 'Hidronefrosis'),
          b('fiebre_litiasis', 'Fiebre (obstrucción infectada: urgencia)'),
          una('lito_composicion', 'Composición', [
            'Oxalato de calcio',
            'Ácido úrico',
            'Estruvita',
            'Cistina',
            'Desconocida',
          ]),
          b('estudio_metabolico', 'Estudio metabólico realizado'),
        ],
        metas: ['Diuresis > 2 litros por día', 'Sin cólicos'],
        educacion: ['Tomar agua', 'Menos sal y proteína animal'],
      }),
  },

  /* ---- Neurología ---- */
  {
    code: 'NEURO_CTRL_ACV',
    carpeta: 'neurologia',
    nombre: 'Accidente cerebrovascular: evaluación y seguimiento',
    fuente: 'NIH_NIHSS',
    nota: 'Déficit por la escala NIHSS (dominio público), discapacidad por escala de Rankin modificada y prevención secundaria.',
    campos: () =>
      control({
        condicion: 'accidente cerebrovascular',
        evaluacion: [
          ...ACV(),
          i('nihss', 'NIHSS (0–42)', { req: true }),
          una('acv_tipo', 'Tipo', [
            'Isquémico',
            'Hemorrágico',
            'Accidente isquémico transitorio',
            'No establecido',
          ]),
          una('rankin', 'Escala de Rankin modificada', [
            '0 — sin síntomas',
            '1 — sin discapacidad significativa',
            '2 — discapacidad leve',
            '3 — moderada',
            '4 — moderadamente grave',
            '5 — grave',
            '6 — fallecido',
          ]),
          una('disfagia_tamizaje', 'Tamizaje de disfagia', [
            'Normal',
            'Alterado',
            'No realizado',
          ]),
          ...PA(),
        ],
        metas: [
          'PA < 130/80 mmHg',
          'Antiagregado o anticoagulado según causa',
          'Estatina',
          'En rehabilitación',
        ],
        educacion: [
          'Reconocer un nuevo ACV (cara, brazo, habla: llamar ya)',
          'Adherencia',
          'Rehabilitación',
        ],
      }),
  },
  {
    code: 'NEURO_CTRL_EPILEPSIA',
    carpeta: 'neurologia',
    nombre: 'Control de epilepsia',
    fuente: 'OMS_MHGAP',
    nota: 'Módulo de epilepsia de mhGAP: frecuencia de crisis, adherencia, efectos adversos y situaciones especiales (embarazo).',
    campos: () =>
      control({
        condicion: 'epilepsia',
        evaluacion: [
          ...CONVULSION().filter((c) => c.code !== 'convulsion_primera'),
          i('crisis_desde_ultimo_control', 'Crisis desde el último control', {
            req: true,
          }),
          s('fecha_ultima_crisis', 'Fecha de la última crisis'),
          una('embarazo_epilepsia', '¿Embarazo o deseo de embarazo?', [
            'Sí',
            'No',
            'No aplica',
          ]),
        ],
        metas: ['Sin crisis', 'Sin efectos adversos'],
        educacion: [
          'No suspender la medicación',
          'Primeros auxilios en una crisis',
          'Riesgos: conducir, nadar, alturas',
        ],
      }),
  },
  {
    code: 'NEURO_CTRL_CEFALEA',
    carpeta: 'neurologia',
    nombre: 'Control de cefalea primaria (migraña o tensional)',
    fuente: 'MINSA_NT022',
    nota: 'Fenotipo, frecuencia, uso de analgésicos y banderas rojas SNOOP.',
    campos: () =>
      control({
        condicion: 'cefalea',
        evaluacion: [
          ...CEFALEA(),
          i('dias_analgesicos_mes', 'Días por mes que toma analgésicos'),
          i('cefalea_intensidad', 'Intensidad habitual (0 a 10)'),
          b('profilaxis', 'Recibe tratamiento preventivo'),
        ],
        metas: [
          'Menos de 4 días de cefalea por mes',
          'Analgésicos menos de 10 días por mes',
        ],
        educacion: [
          'Diario de cefalea',
          'Evitar abuso de analgésicos',
          'Sueño y desencadenantes',
        ],
      }),
  },
  {
    code: 'NEURO_CTRL_PARKINSON',
    carpeta: 'neurologia',
    nombre: 'Control de enfermedad de Parkinson',
    fuente: 'MINSA_NT022',
    nota: 'Estadio de Hoehn y Yahr (publicado), fluctuaciones motoras y síntomas no motores.',
    campos: () =>
      control({
        condicion: 'enfermedad de Parkinson',
        evaluacion: [
          una(
            'hoehn_yahr',
            'Estadio de Hoehn y Yahr',
            [
              '1 — unilateral',
              '2 — bilateral sin alteración del equilibrio',
              '3 — inestabilidad postural leve',
              '4 — discapacidad grave, camina con ayuda',
              '5 — silla de ruedas o cama',
            ],
            { req: true },
          ),
          varias('parkinson_motores', 'Problemas motores', [
            'Fluctuaciones (fin de dosis)',
            'Discinesias',
            'Congelamiento de la marcha',
            'Caídas',
          ]),
          varias('parkinson_no_motores', 'Síntomas no motores', [
            'Depresión',
            'Deterioro cognitivo',
            'Alucinaciones',
            'Constipación',
            'Hipotensión ortostática',
            'Trastorno del sueño',
          ]),
        ],
        educacion: [
          'Horarios de la levodopa',
          'Prevención de caídas',
          'Ejercicio',
        ],
      }),
  },
];
