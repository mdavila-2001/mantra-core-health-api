/**
 * Fichas específicas por condición (2 de 3): reumatología, infectología,
 * hematología, oncología, geriatría, dermatología, medicina general y
 * familiar, medicina interna, cuidados intensivos, emergencia y salud mental.
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
  ANEMIA,
  DENGUE,
  DEPRESION_ANSIEDAD,
  DM2,
  EDA,
  HTA,
  IRA_ALTA,
  ITU,
  LUMBALGIA,
  SRQ20,
} from './sindromes.mjs';

const PA = () => [
  i('presion_arterial_sistolica', 'Presión arterial sistólica (mmHg)', {
    req: true,
  }),
  i('presion_arterial_diastolica', 'Presión arterial diastólica (mmHg)', {
    req: true,
  }),
];
const AGUDO = { modo: 'agudo' };
const GLASGOW = () => [
  una('glasgow_ocular', 'Glasgow — apertura ocular', [
    '4 — espontánea',
    '3 — a la voz',
    '2 — al dolor',
    '1 — ninguna',
  ]),
  una('glasgow_verbal', 'Glasgow — respuesta verbal', [
    '5 — orientada',
    '4 — confusa',
    '3 — palabras inapropiadas',
    '2 — sonidos incomprensibles',
    '1 — ninguna',
  ]),
  una('glasgow_motora', 'Glasgow — respuesta motora', [
    '6 — obedece órdenes',
    '5 — localiza el dolor',
    '4 — retira al dolor',
    '3 — flexión anormal',
    '2 — extensión',
    '1 — ninguna',
  ]),
];
const AUDIT = [
  [
    'audit_1',
    '1. ¿Con qué frecuencia consume alguna bebida alcohólica?',
    [
      'Nunca (0)',
      'Una o menos veces al mes (1)',
      'De 2 a 4 veces al mes (2)',
      'De 2 a 3 veces a la semana (3)',
      '4 o más veces a la semana (4)',
    ],
  ],
  [
    'audit_2',
    '2. ¿Cuántas consumiciones toma en un día de consumo normal?',
    ['1 o 2 (0)', '3 o 4 (1)', '5 o 6 (2)', '7 a 9 (3)', '10 o más (4)'],
  ],
  [
    'audit_3',
    '3. ¿Con qué frecuencia toma 6 o más bebidas en una sola ocasión?',
    [
      'Nunca (0)',
      'Menos de una vez al mes (1)',
      'Mensualmente (2)',
      'Semanalmente (3)',
      'A diario o casi (4)',
    ],
  ],
  [
    'audit_4',
    '4. En el último año, ¿con qué frecuencia no pudo parar de beber una vez que empezó?',
    [
      'Nunca (0)',
      'Menos de una vez al mes (1)',
      'Mensualmente (2)',
      'Semanalmente (3)',
      'A diario o casi (4)',
    ],
  ],
  [
    'audit_5',
    '5. ¿Con qué frecuencia no pudo hacer lo que se esperaba de usted porque había bebido?',
    [
      'Nunca (0)',
      'Menos de una vez al mes (1)',
      'Mensualmente (2)',
      'Semanalmente (3)',
      'A diario o casi (4)',
    ],
  ],
  [
    'audit_6',
    '6. ¿Con qué frecuencia necesitó beber en ayunas para recuperarse después de beber mucho?',
    [
      'Nunca (0)',
      'Menos de una vez al mes (1)',
      'Mensualmente (2)',
      'Semanalmente (3)',
      'A diario o casi (4)',
    ],
  ],
  [
    'audit_7',
    '7. ¿Con qué frecuencia tuvo remordimientos o sentimientos de culpa después de beber?',
    [
      'Nunca (0)',
      'Menos de una vez al mes (1)',
      'Mensualmente (2)',
      'Semanalmente (3)',
      'A diario o casi (4)',
    ],
  ],
  [
    'audit_8',
    '8. ¿Con qué frecuencia no pudo recordar lo que sucedió la noche anterior porque había bebido?',
    [
      'Nunca (0)',
      'Menos de una vez al mes (1)',
      'Mensualmente (2)',
      'Semanalmente (3)',
      'A diario o casi (4)',
    ],
  ],
  [
    'audit_9',
    '9. ¿Usted u otra persona resultó herida porque usted había bebido?',
    ['No (0)', 'Sí, pero no en el último año (2)', 'Sí, en el último año (4)'],
  ],
  [
    'audit_10',
    '10. ¿Algún familiar, amigo o profesional se preocupó por su consumo o le sugirió dejar de beber?',
    ['No (0)', 'Sí, pero no en el último año (2)', 'Sí, en el último año (4)'],
  ],
];

export const ESPECIFICAS_2 = [
  /* ---- Reumatología ---- */
  {
    code: 'REUMA_CTRL_AR',
    carpeta: 'reumatologia',
    nombre: 'Control de artritis reumatoide',
    fuente: 'EULAR',
    nota: 'Actividad por DAS28 (índice publicado) con recuento de 28 articulaciones; seguimiento de fármacos modificadores.',
    campos: () =>
      control({
        condicion: 'artritis reumatoide',
        evaluacion: [
          i('articulaciones_dolorosas_28', 'Articulaciones dolorosas (de 28)', {
            req: true,
          }),
          i(
            'articulaciones_tumefactas_28',
            'Articulaciones tumefactas (de 28)',
            { req: true },
          ),
          d('vsg', 'VSG (mm/h)'),
          d('pcr', 'PCR (mg/L)'),
          i(
            'evaluacion_global_paciente',
            'Evaluación global del paciente (0 a 100)',
          ),
          d('das28', 'DAS28'),
          una(
            'actividad_das28',
            'Actividad',
            [
              'Remisión (< 2,6)',
              'Baja (2,6–3,2)',
              'Moderada (3,2–5,1)',
              'Alta (> 5,1)',
            ],
            { req: true },
          ),
          i('rigidez_matinal_minutos', 'Rigidez matinal (minutos)'),
        ],
        complicaciones: [
          varias('ar_controles_farmacos', 'Controles de seguridad al día', [
            'Hemograma',
            'Transaminasas',
            'Creatinina',
            'Tamizaje de tuberculosis antes de biológico',
          ]),
        ],
        metas: ['Remisión o baja actividad'],
        educacion: [
          'Adherencia al metotrexato y ácido fólico',
          'Ejercicio',
          'Protección articular',
        ],
      }),
  },
  {
    code: 'REUMA_CTRL_LES',
    carpeta: 'reumatologia',
    nombre: 'Control de lupus eritematoso sistémico',
    fuente: 'EULAR',
    nota: 'Órganos comprometidos, actividad y vigilancia renal.',
    campos: () =>
      control({
        condicion: 'lupus eritematoso sistémico',
        evaluacion: [
          varias(
            'les_actividad',
            'Manifestaciones activas',
            [
              'Artritis',
              'Lesiones cutáneas',
              'Úlceras orales',
              'Serositis',
              'Nefritis',
              'Citopenias',
              'Neurológico',
              'Ninguna',
            ],
            { req: true },
          ),
          d('proteinuria_24h', 'Proteinuria de 24 h (g)'),
          d('creatinina', 'Creatinina (mg/dL)'),
          s('complemento', 'Complemento C3/C4'),
          s('anti_dna', 'Anti-ADN'),
          b('hidroxicloroquina', 'Recibe hidroxicloroquina'),
          ...si('hidroxicloroquina', true, [
            una('control_oftalmologico', 'Control oftalmológico anual', [
              'Al día',
              'Pendiente',
            ]),
          ]),
        ],
        metas: ['Sin actividad', 'Corticoide ≤ 5 mg/día de prednisona'],
        educacion: [
          'Fotoprotección',
          'Anticoncepción y planificación del embarazo',
        ],
      }),
  },
  {
    code: 'REUMA_CTRL_GOTA',
    carpeta: 'reumatologia',
    nombre: 'Control de gota',
    fuente: 'EULAR',
    nota: 'Crisis, tofos y meta de uricemia < 6 mg/dL.',
    campos: () =>
      control({
        condicion: 'gota',
        evaluacion: [
          i('crisis_gota_anio', 'Crisis en el último año', { req: true }),
          d('acido_urico', 'Ácido úrico (mg/dL)', { req: true }),
          b('tofos', 'Tofos'),
          varias('gota_comorbilidades', 'Comorbilidades', [
            'Hipertensión',
            'Enfermedad renal',
            'Diabetes',
            'Obesidad',
            'Ninguna',
          ]),
        ],
        metas: ['Ácido úrico < 6 mg/dL', 'Sin crisis'],
        educacion: [
          'Reducir alcohol y bebidas azucaradas',
          'No suspender el alopurinol en una crisis',
        ],
      }),
  },
  {
    code: 'REUMA_CTRL_ARTROSIS',
    carpeta: 'reumatologia',
    nombre: 'Control de artrosis',
    fuente: 'MINSA_NT022',
    nota: 'Articulaciones afectadas, dolor y función.',
    campos: () =>
      control({
        condicion: 'artrosis',
        evaluacion: [
          varias(
            'artrosis_sitio',
            'Articulaciones',
            ['Rodilla', 'Cadera', 'Manos', 'Columna'],
            { req: true },
          ),
          i('dolor_intensidad', 'Dolor (0 a 10)', { req: true }),
          una('limitacion', 'Limitación funcional', [
            'Ninguna',
            'Leve',
            'Moderada',
            'Grave',
          ]),
          d('imc', 'IMC (kg/m²)'),
        ],
        metas: ['Dolor ≤ 3', 'Hace ejercicio terapéutico'],
        educacion: [
          'Ejercicio de fortalecimiento',
          'Bajar de peso',
          'Uso de bastón',
        ],
      }),
  },

  /* ---- Infectología ---- */
  {
    code: 'INFECTO_CTRL_DENGUE',
    carpeta: 'infectologia',
    nombre: 'Dengue: evaluación y seguimiento diario',
    fuente: 'OPS_DENGUE',
    nota: 'Clasificación en grupos A/B/C y signos de alarma de la guía de OPS; control diario en la fase crítica (días 3 a 7).',
    campos: () =>
      control({
        condicion: 'dengue',
        ...AGUDO,
        evaluacion: [
          ...DENGUE(),
          ...PA(),
          i('frecuencia_cardiaca', 'Frecuencia cardíaca (lpm)'),
          d('hematocrito', 'Hematocrito (%)'),
          i('plaquetas', 'Plaquetas (/µL)'),
          una('hidratacion_oral', 'Tolera la hidratación oral', [
            'Sí',
            'Parcialmente',
            'No',
          ]),
          d('diuresis', 'Diuresis (mL/kg/h)'),
        ],
        metas: ['Sin signos de alarma', 'Hematocrito estable'],
        educacion: [
          'Hidratación oral',
          'No tomar AINE ni aspirina',
          'Volver ya ante un signo de alarma',
          'Mosquitero y eliminar criaderos',
        ],
      }),
  },
  {
    code: 'INFECTO_CTRL_VIH',
    carpeta: 'infectologia',
    nombre: 'Control de VIH',
    fuente: 'OMS_VIH',
    nota: 'Estadio clínico de la OMS, carga viral, CD4, adherencia a la terapia antirretroviral y profilaxis.',
    campos: () =>
      control({
        condicion: 'VIH',
        evaluacion: [
          una('estadio_oms_vih', 'Estadio clínico OMS', ['1', '2', '3', '4'], {
            req: true,
          }),
          s('carga_viral', 'Última carga viral (copias/mL)', { req: true }),
          i('cd4', 'Último CD4 (células/µL)'),
          varias('vih_tamizajes', 'Tamizajes al día', [
            'Tuberculosis',
            'Sífilis',
            'Hepatitis B',
            'Cáncer de cuello uterino',
          ]),
          b('profilaxis_cotrimoxazol', 'Recibe cotrimoxazol'),
          varias('vih_sintomas', 'Síntomas', [
            'Fiebre',
            'Pérdida de peso',
            'Diarrea crónica',
            'Tos',
            'Lesiones orales',
            'Ninguno',
          ]),
        ],
        metas: ['Carga viral indetectable', 'Adherencia > 95 %'],
        educacion: [
          'Adherencia',
          'Prevención de la transmisión',
          'Pareja: prueba',
        ],
      }),
  },
  {
    code: 'INFECTO_CTRL_MALARIA',
    carpeta: 'infectologia',
    nombre: 'Malaria: evaluación y seguimiento',
    fuente: 'OMS_MALARIA',
    nota: 'Especie, signos de gravedad de la OMS y control parasitológico.',
    campos: () =>
      control({
        condicion: 'malaria',
        ...AGUDO,
        evaluacion: [
          una(
            'malaria_especie',
            'Gota gruesa',
            ['P. vivax', 'P. falciparum', 'Mixta', 'Negativa'],
            { req: true },
          ),
          s('parasitemia', 'Parasitemia'),
          varias(
            'malaria_gravedad',
            'Signos de gravedad',
            [
              'Alteración de la conciencia',
              'Convulsiones',
              'Dificultad respiratoria',
              'Ictericia',
              'Anemia grave',
              'Sangrado',
              'Hipoglucemia',
              'Ninguno',
            ],
            { req: true },
          ),
          s('zona_exposicion', 'Zona donde se expuso'),
        ],
        metas: ['Gota gruesa negativa al control'],
        educacion: [
          'Completar el tratamiento (primaquina en vivax)',
          'Mosquitero',
        ],
      }),
  },
  {
    code: 'INFECTO_CTRL_ITU',
    carpeta: 'infectologia',
    nombre: 'Infección urinaria: evaluación y control',
    fuente: 'MINSA_NT022',
    nota: 'Cistitis frente a pielonefritis, factores de complicación y urocultivo.',
    campos: () =>
      control({
        condicion: 'infección urinaria',
        ...AGUDO,
        evaluacion: [
          ...ITU(),
          varias('itu_complicada', 'Factores de complicación', [
            'Embarazo',
            'Varón',
            'Diabetes',
            'Sonda vesical',
            'Litiasis u obstrucción',
            'Inmunosupresión',
            'Ninguno',
          ]),
          s('urocultivo', 'Urocultivo y antibiograma'),
        ],
        metas: ['Asintomático al control'],
      }),
  },

  /* ---- Hematología ---- */
  {
    code: 'HEMATO_CTRL_ANEMIA',
    carpeta: 'hematologia',
    nombre: 'Control de anemia ferropénica',
    fuente: 'MINSA_NT022',
    nota: 'Hemoglobina ajustada por altitud, causa y respuesta al hierro.',
    campos: () =>
      control({
        condicion: 'anemia',
        evaluacion: [
          ...ANEMIA(),
          d('ferritina', 'Ferritina (ng/mL)'),
          d('vcm', 'VCM (fL)'),
          s('altitud_residencia', 'Altitud de residencia (m s. n. m.)'),
          d('reticulocitos', 'Reticulocitos (%)'),
        ],
        metas: ['Hemoglobina normal para su altitud', 'Causa identificada'],
        educacion: [
          'Hierro con el estómago vacío y con vitamina C',
          'Alimentos con hierro',
        ],
      }),
  },
  {
    code: 'HEMATO_CTRL_ANTICOAGULACION',
    carpeta: 'hematologia',
    nombre: 'Control de anticoagulación oral',
    fuente: 'MINSA_NT022',
    nota: 'INR en rango terapéutico, sangrados e interacciones.',
    campos: () =>
      control({
        condicion: 'anticoagulación',
        evaluacion: [
          una(
            'indicacion_anticoagulacion',
            'Indicación',
            [
              'Fibrilación auricular',
              'Trombosis venosa profunda',
              'Embolia pulmonar',
              'Prótesis valvular',
              'Otra',
            ],
            { req: true },
          ),
          d('inr', 'INR de hoy', { req: true }),
          s('inr_meta', 'INR meta'),
          b('sangrado', 'Sangrado desde el último control'),
          ...si('sangrado', true, [
            una('sangrado_gravedad', 'Gravedad', ['Menor', 'Mayor'], {
              req: true,
            }),
          ]),
          t('farmacos_nuevos', 'Fármacos o hierbas nuevos'),
        ],
        metas: ['INR en rango'],
        educacion: [
          'Dieta estable en verduras de hoja verde',
          'Signos de sangrado',
          'Avisar antes de procedimientos',
        ],
      }),
  },

  /* ---- Oncología ---- */
  {
    code: 'ONCO_CTRL_QUIMIOTERAPIA',
    carpeta: 'oncologia',
    nombre: 'Control previo a cada ciclo de quimioterapia',
    fuente: 'NCI_CTCAE',
    nota: 'Toxicidad graduada por CTCAE (NCI, dominio público) y estado funcional ECOG antes de autorizar el ciclo.',
    campos: () =>
      control({
        condicion: 'tratamiento oncológico',
        evaluacion: [
          s('esquema', 'Esquema y número de ciclo', { req: true }),
          una('ecog', 'ECOG', ['0', '1', '2', '3', '4'], { req: true }),
          d('peso_kg', 'Peso (kg)'),
          i('neutrofilos', 'Neutrófilos (/µL)'),
          i('plaquetas', 'Plaquetas (/µL)'),
          d('hemoglobina', 'Hemoglobina (g/dL)'),
          varias(
            'toxicidad',
            'Toxicidad desde el último ciclo',
            [
              'Náuseas y vómitos',
              'Mucositis',
              'Diarrea',
              'Neuropatía',
              'Fiebre con neutropenia',
              'Fatiga',
              'Ninguna',
            ],
            { req: true },
          ),
          una('toxicidad_grado', 'Peor grado CTCAE', ['0', '1', '2', '3', '4']),
          una(
            'apto_ciclo',
            '¿Se autoriza el ciclo?',
            ['Sí', 'Se difiere', 'Se ajusta la dosis'],
            { req: true },
          ),
        ],
        educacion: [
          'Fiebre: consultar de inmediato',
          'Higiene bucal',
          'Hidratación',
        ],
      }),
  },
  {
    code: 'ONCO_CTRL_PALIATIVOS',
    carpeta: 'oncologia',
    nombre: 'Control de cuidados paliativos',
    fuente: 'ECOG',
    nota: 'Intensidad de síntomas, dolor por la escala de la OMS y estado funcional.',
    campos: () =>
      control({
        condicion: 'enfermedad avanzada',
        evaluacion: [
          una('ecog', 'ECOG', ['0', '1', '2', '3', '4'], { req: true }),
          i('dolor_intensidad', 'Dolor (0 a 10)', { req: true }),
          una('escalon_analgesico', 'Escalón analgésico de la OMS', [
            '1 — no opioide',
            '2 — opioide débil',
            '3 — opioide fuerte',
          ]),
          varias('sintomas_paliativos', 'Síntomas que molestan', [
            'Disnea',
            'Náuseas',
            'Constipación',
            'Insomnio',
            'Ansiedad',
            'Delirium',
            'Anorexia',
          ]),
          b('voluntades', 'Se conversaron las voluntades anticipadas'),
          una('lugar_preferido', 'Lugar donde prefiere ser atendido', [
            'Domicilio',
            'Hospital',
            'No lo decidió',
          ]),
        ],
        metas: ['Dolor ≤ 3', 'Síntomas controlados'],
        educacion: ['Opioides: uso y efectos', 'Apoyo a la familia'],
      }),
  },

  /* ---- Geriatría ---- */
  {
    code: 'GERIA_CTRL_FRAGILIDAD',
    carpeta: 'geriatria',
    nombre: 'Control de fragilidad y capacidad intrínseca (ICOPE)',
    fuente: 'OMS_ICOPE',
    nota: 'Los dominios de capacidad intrínseca del tamizaje ICOPE: cognición, movilidad, nutrición, visión, audición y ánimo.',
    campos: () =>
      control({
        condicion: 'fragilidad',
        evaluacion: [
          varias(
            'icope_alterados',
            'Dominios ICOPE con tamizaje alterado',
            [
              'Cognición',
              'Movilidad (levantarse 5 veces de la silla)',
              'Nutrición (pérdida de peso o apetito)',
              'Visión',
              'Audición',
              'Síntomas depresivos',
              'Ninguno',
            ],
            { req: true },
          ),
          d(
            'silla_5_veces_segundos',
            'Levantarse 5 veces de la silla (segundos)',
          ),
          d('velocidad_de_marcha', 'Velocidad de marcha en 4 m (m/s)'),
          varias('fried', 'Criterios de Fried', [
            'Pérdida de peso no intencionada',
            'Agotamiento',
            'Debilidad',
            'Marcha lenta',
            'Baja actividad física',
          ]),
          i('numero_de_farmacos', 'Fármacos en uso'),
        ],
        metas: ['Plan de atención por cada dominio alterado'],
        educacion: [
          'Ejercicio multicomponente',
          'Alimentación con proteínas',
          'Revisión de fármacos',
        ],
      }),
  },
  {
    code: 'GERIA_CTRL_CAIDAS',
    carpeta: 'geriatria',
    nombre: 'Evaluación de caídas',
    fuente: 'OMS_ICOPE',
    nota: 'Caídas, factores de riesgo modificables y consecuencias.',
    campos: () =>
      control({
        condicion: 'caídas',
        ...AGUDO,
        evaluacion: [
          i('caidas_anio', 'Caídas en el último año', { req: true }),
          b('caida_con_lesion', 'Alguna con lesión o fractura'),
          varias('caidas_riesgo', 'Factores de riesgo', [
            'Alteración de la marcha',
            'Hipotensión ortostática',
            'Psicofármacos',
            'Déficit visual',
            'Riesgos en el hogar',
            'Incontinencia de urgencia',
          ]),
          b('miedo_a_caer', 'Miedo a caer'),
          d('timed_up_and_go', 'Prueba «levántate y anda» (segundos)'),
        ],
        educacion: ['Adaptar el hogar', 'Calzado', 'Ejercicio de equilibrio'],
      }),
  },
  {
    code: 'GERIA_CTRL_DEMENCIA',
    carpeta: 'geriatria',
    nombre: 'Control de demencia',
    fuente: 'OMS_MHGAP',
    nota: 'Módulo de demencia de mhGAP: función, síntomas conductuales y apoyo al cuidador.',
    campos: () =>
      control({
        condicion: 'demencia',
        evaluacion: [
          s('prueba_cognitiva', 'Prueba cognitiva y puntaje'),
          una(
            'demencia_funcion',
            'Repercusión funcional',
            [
              'Leve: actividades instrumentales',
              'Moderada: actividades básicas',
              'Grave: dependencia total',
            ],
            { req: true },
          ),
          varias('sintomas_conductuales', 'Síntomas conductuales', [
            'Agitación',
            'Agresividad',
            'Deambulación',
            'Alucinaciones',
            'Insomnio',
            'Depresión',
            'Ninguno',
          ]),
          una('sobrecarga_cuidador', 'Sobrecarga del cuidador', [
            'Baja',
            'Moderada',
            'Alta',
          ]),
        ],
        educacion: ['Apoyo al cuidador', 'Seguridad en el hogar', 'Rutinas'],
      }),
  },

  /* ---- Dermatología ---- */
  {
    code: 'DERMA_CTRL_LESION_PIGMENTADA',
    carpeta: 'dermatologia',
    nombre: 'Evaluación de lesión pigmentada',
    fuente: 'MINSA_NT022',
    nota: 'Regla ABCDE del melanoma y dermatoscopía.',
    campos: () =>
      control({
        condicion: 'lesión pigmentada',
        ...AGUDO,
        evaluacion: [
          s('localizacion', 'Localización', { req: true }),
          varias(
            'abcde',
            'Criterios ABCDE',
            [
              'Asimetría',
              'Bordes irregulares',
              'Color heterogéneo',
              'Diámetro > 6 mm',
              'Evolución (cambió)',
              'Ninguno',
            ],
            { req: true },
          ),
          una('fototipo', 'Fototipo de Fitzpatrick', [
            'I',
            'II',
            'III',
            'IV',
            'V',
            'VI',
          ]),
          b(
            'antecedente_melanoma',
            'Antecedente personal o familiar de melanoma',
          ),
          s('dermatoscopia', 'Dermatoscopía — hallazgo'),
          una('conducta_lesion', 'Conducta', [
            'Control',
            'Biopsia',
            'Extirpación',
          ]),
        ],
        educacion: ['Fotoprotección', 'Autoexamen de la piel'],
      }),
  },
  {
    code: 'DERMA_CTRL_PSORIASIS',
    carpeta: 'dermatologia',
    nombre: 'Control de psoriasis',
    fuente: 'MINSA_NT022',
    nota: 'Extensión (PASI y superficie corporal) y artritis psoriásica.',
    campos: () =>
      control({
        condicion: 'psoriasis',
        evaluacion: [
          d('pasi', 'PASI', { req: true }),
          d('superficie_corporal', 'Superficie corporal afectada (%)'),
          varias('psoriasis_sitios', 'Sitios especiales', [
            'Cuero cabelludo',
            'Uñas',
            'Genitales',
            'Palmas y plantas',
          ]),
          b('dolor_articular', 'Dolor o tumefacción articular'),
        ],
        metas: ['Mejoría del PASI ≥ 75 %'],
        educacion: ['Emolientes', 'Desencadenantes', 'Riesgo cardiovascular'],
      }),
  },
  {
    code: 'DERMA_CTRL_LEISHMANIASIS',
    carpeta: 'dermatologia',
    nombre: 'Control de leishmaniasis cutánea y mucosa',
    fuente: 'OMS_LEISH',
    nota: 'Forma, número de lesiones, compromiso mucoso y respuesta al tratamiento.',
    campos: () =>
      control({
        condicion: 'leishmaniasis',
        evaluacion: [
          una('leish_forma', 'Forma', ['Cutánea', 'Mucosa', 'Mucocutánea'], {
            req: true,
          }),
          i('leish_lesiones', 'Número de úlceras', { req: true }),
          s('leish_tamano', 'Tamaño de la mayor (mm)'),
          b('leish_mucosa', 'Compromiso nasal u oral'),
          s('leish_procedencia', 'Zona de exposición'),
          una('leish_confirmacion', 'Confirmación', [
            'Frotis',
            'Biopsia',
            'PCR',
            'Sin confirmar',
          ]),
          una('leish_respuesta', 'Respuesta al tratamiento', [
            'Reepitelización completa',
            'Parcial',
            'Sin respuesta',
            'Todavía en tratamiento',
          ]),
        ],
        educacion: [
          'Completar el tratamiento',
          'Control a los 3, 6 y 12 meses',
        ],
      }),
  },

  /* ---- Medicina general y familiar ---- */
  {
    code: 'MEDGEN_CTRL_ECNT',
    carpeta: 'medicina-general',
    nombre: 'Control de hipertensión y diabetes en atención primaria (HEARTS)',
    fuente: 'OMS_HEARTS',
    nota: 'La visita de control del programa HEARTS para hipertensión y diabetes en el primer nivel.',
    campos: () =>
      control({
        condicion: 'hipertensión o diabetes',
        evaluacion: [
          varias(
            'ecnt_condiciones',
            'Condiciones en control',
            ['Hipertensión', 'Diabetes tipo 2'],
            { req: true },
          ),
          ...PA(),
          ...si('ecnt_condiciones', 'Diabetes tipo 2', DM2()),
          ...HTA().filter((c) => c.code !== 'hta_adherencia'),
          d('peso_kg', 'Peso (kg)'),
        ],
        metas: ['PA < 140/90 mmHg', 'HbA1c < 7 %', 'No fuma'],
        educacion: ['Sal', 'Actividad física', 'Adherencia', 'Pies (diabetes)'],
      }),
  },
  {
    code: 'MEDGEN_CTRL_IRA',
    carpeta: 'medicina-general',
    nombre: 'Infección respiratoria aguda en adultos',
    fuente: 'MINSA_NT022',
    nota: 'Criterios de Centor/McIsaac para faringoamigdalitis y CURB-65 si se sospecha neumonía.',
    campos: () =>
      control({
        condicion: 'infección respiratoria aguda',
        ...AGUDO,
        evaluacion: [
          ...IRA_ALTA(),
          i('centor_puntaje', 'Puntaje de Centor/McIsaac'),
          i('frecuencia_respiratoria', 'Frecuencia respiratoria (rpm)'),
          i('saturacion_de_oxigeno', 'Saturación de oxígeno (%)'),
          b('crepitantes', 'Crepitantes (sospecha de neumonía)'),
        ],
        educacion: [
          'Hidratación y antipiréticos',
          'Antibiótico sólo si está indicado',
          'Signos de alarma',
        ],
      }),
  },
  {
    code: 'MEDGEN_CTRL_EDA',
    carpeta: 'medicina-general',
    nombre: 'Enfermedad diarreica aguda en adultos',
    fuente: 'OMS_AIEPI',
    nota: 'Estado de hidratación y planes A/B/C de la OMS.',
    campos: () =>
      control({
        condicion: 'diarrea aguda',
        ...AGUDO,
        evaluacion: [...EDA(), ...PA()],
        educacion: [
          'Sales de rehidratación oral',
          'Lavado de manos',
          'Signos de alarma',
        ],
      }),
  },
  {
    code: 'MEDGEN_CTRL_LUMBALGIA',
    carpeta: 'medicina-general',
    nombre: 'Lumbalgia',
    fuente: 'MINSA_NT022',
    nota: 'Banderas rojas, componente radicular y función.',
    campos: () =>
      control({
        condicion: 'lumbalgia',
        ...AGUDO,
        evaluacion: [
          ...LUMBALGIA(),
          i('dolor_intensidad', 'Dolor (0 a 10)', { req: true }),
          una(
            'lumbalgia_duracion',
            'Duración',
            [
              'Aguda (< 6 semanas)',
              'Subaguda (6–12 semanas)',
              'Crónica (> 12 semanas)',
            ],
            { req: true },
          ),
        ],
        educacion: ['Mantenerse activo', 'Evitar reposo en cama'],
      }),
  },
  {
    code: 'MEDFAM_CTRL_SALUD_MENTAL',
    carpeta: 'medicina-familiar',
    nombre: 'Salud mental en atención primaria (mhGAP)',
    fuente: 'OMS_MHGAP',
    nota: 'Tamizaje SRQ-20 de la OMS y evaluación de riesgo suicida según mhGAP.',
    campos: () =>
      control({
        condicion: 'trastorno mental común',
        evaluacion: [
          ...DEPRESION_ANSIEDAD(),
          una('funcionamiento', 'Funcionamiento en casa, trabajo o estudio', [
            'Conservado',
            'Algo afectado',
            'Muy afectado',
          ]),
        ],
        metas: ['Mejora del SRQ-20', 'Sin ideación suicida'],
        educacion: ['Psicoeducación', 'Activación conductual', 'Red de apoyo'],
      }),
  },
  {
    code: 'MEDFAM_CTRL_PLANIFICACION',
    carpeta: 'medicina-familiar',
    nombre: 'Consejería en planificación familiar',
    fuente: 'OMS_MEC',
    nota: 'Elegibilidad de cada método según los criterios médicos de la OMS (categorías 1 a 4).',
    campos: () =>
      control({
        condicion: 'anticoncepción',
        modo: 'evaluacion',
        evaluacion: [
          una('metodo_actual', 'Método actual', [
            'Ninguno',
            'Preservativo',
            'Píldora combinada',
            'Inyectable',
            'Implante',
            'DIU de cobre',
            'DIU hormonal',
            'Ligadura o vasectomía',
          ]),
          varias('condiciones_mec', 'Condiciones que cambian la elegibilidad', [
            'Fuma y tiene 35 años o más',
            'Hipertensión',
            'Migraña con aura',
            'Antecedente de trombosis',
            'Lactancia < 6 semanas',
            'Ninguna',
          ]),
          una('metodo_elegido', 'Método elegido', [
            'Preservativo',
            'Píldora combinada',
            'Píldora de progestágeno',
            'Inyectable',
            'Implante',
            'DIU de cobre',
            'DIU hormonal',
            'Ligadura o vasectomía',
            'Ninguno',
          ]),
          una('categoria_mec', 'Categoría OMS del método elegido', [
            '1',
            '2',
            '3',
            '4',
          ]),
          ...PA(),
        ],
        educacion: [
          'Uso correcto',
          'Doble protección con preservativo',
          'Anticoncepción de emergencia',
        ],
      }),
  },

  /* ---- Medicina interna e intensiva ---- */
  {
    code: 'MEDINT_CTRL_SFP',
    carpeta: 'medicina-interna',
    nombre: 'Síndrome febril prolongado',
    fuente: 'MINSA_NT022',
    nota: 'Estudio escalonado de la fiebre de origen desconocido.',
    campos: () =>
      control({
        condicion: 'síndrome febril prolongado',
        ...AGUDO,
        evaluacion: [
          i('dias_de_fiebre', 'Días de fiebre', { req: true }),
          varias('sfp_sintomas', 'Acompañantes', [
            'Pérdida de peso',
            'Sudoración nocturna',
            'Adenopatías',
            'Artralgias',
            'Lesiones de piel',
            'Soplo nuevo',
          ]),
          varias(
            'sfp_estudios',
            'Estudios realizados',
            [
              'Hemocultivos',
              'Urocultivo',
              'Serología VIH',
              'Baciloscopía',
              'Serología Chagas',
              'Gota gruesa',
              'Imágenes',
              'Ninguno',
            ],
            { req: true },
          ),
          s('sfp_exposicion', 'Exposiciones y viajes'),
        ],
      }),
  },
  {
    code: 'MEDINT_CTRL_MULTIMORBILIDAD',
    carpeta: 'medicina-interna',
    nombre: 'Control de multimorbilidad y polifarmacia',
    fuente: 'MINSA_NT022',
    nota: 'Revisión de problemas activos, fármacos (polifarmacia ≥ 5) y prioridades del paciente.',
    campos: () =>
      control({
        condicion: 'multimorbilidad',
        evaluacion: [
          varias(
            'condiciones_cronicas',
            'Condiciones crónicas activas',
            [
              'Hipertensión',
              'Diabetes',
              'Insuficiencia cardíaca',
              'EPOC',
              'Enfermedad renal crónica',
              'Fibrilación auricular',
              'Depresión',
              'Artrosis',
            ],
            { otro: true, req: true },
          ),
          i('numero_de_farmacos', 'Fármacos en uso', {
            req: true,
            ayuda: '5 o más: polifarmacia; revisar cada uno.',
          }),
          varias('problemas_con_farmacos', 'Problemas detectados', [
            'Duplicación',
            'Interacción relevante',
            'Dosis no ajustada a la función renal',
            'Fármaco sin indicación vigente',
            'Ninguno',
          ]),
          t('farmacos_a_suspender', 'Fármacos a suspender o ajustar'),
          t(
            'prioridades_paciente',
            'Qué es lo más importante para el paciente',
          ),
          ...PA(),
        ],
        educacion: [
          'Lista actualizada de medicamentos',
          'Pastillero',
          'Signos de alarma',
        ],
      }),
  },
  {
    code: 'UCI_CTRL_SEPSIS',
    carpeta: 'medicina-intensiva',
    nombre: 'Sepsis y shock séptico en cuidados intensivos',
    fuente: 'MINSA_NT022',
    nota: 'Disfunción orgánica por SOFA (publicado, de uso libre), lactato y metas de la primera hora.',
    campos: () =>
      control({
        condicion: 'sepsis',
        ...AGUDO,
        evaluacion: [
          s('foco_sepsis', 'Foco', { req: true }),
          i('sofa', 'Puntaje SOFA', { req: true }),
          d('lactato', 'Lactato (mmol/L)', { req: true }),
          i('presion_arterial_media', 'Presión arterial media (mmHg)'),
          varias('primera_hora', 'Medidas de la primera hora', [
            'Hemocultivos antes del antibiótico',
            'Antibiótico en la primera hora',
            'Cristaloides 30 mL/kg',
            'Vasopresor si PAM < 65',
          ]),
          d('diuresis', 'Diuresis (mL/kg/h)'),
        ],
        metas: [
          'PAM ≥ 65 mmHg',
          'Lactato en descenso',
          'Diuresis ≥ 0,5 mL/kg/h',
        ],
      }),
  },
  {
    code: 'UCI_CTRL_VENTILACION',
    carpeta: 'medicina-intensiva',
    nombre: 'Ventilación mecánica y destete',
    fuente: 'MINSA_NT022',
    nota: 'Parámetros, oxigenación y prueba de respiración espontánea.',
    campos: () =>
      control({
        condicion: 'ventilación mecánica',
        ...AGUDO,
        evaluacion: [
          una(
            'modo_ventilatorio',
            'Modo',
            ['Volumen control', 'Presión control', 'Presión soporte', 'CPAP'],
            { req: true },
          ),
          d('fio2', 'FiO₂ (%)'),
          i('peep', 'PEEP (cmH₂O)'),
          d('pafi', 'PaO₂/FiO₂', { req: true }),
          una('rass', 'RASS', ['+2', '+1', '0', '−1', '−2', '−3', '−4', '−5']),
          una(
            'prueba_respiracion_espontanea',
            'Prueba de respiración espontánea',
            ['Superada', 'Fallida', 'No corresponde todavía'],
          ),
          ...GLASGOW(),
        ],
      }),
  },

  /* ---- Emergencia ---- */
  {
    code: 'EMERG_DOLOR_TORACICO',
    carpeta: 'medicina-emergencia',
    nombre: 'Dolor torácico agudo en emergencia',
    fuente: 'MINSA_NT022',
    nota: 'ECG en menos de 10 minutos, troponina y estratificación con el puntaje HEART (publicado, de uso libre).',
    campos: () =>
      control({
        condicion: 'dolor torácico',
        ...AGUDO,
        evaluacion: [
          b('dolor_actual', 'Dolor en este momento'),
          ...socrates('dolor', 'dolor_actual', true, { sitio: false }),
          s('hora_ecg', 'Hora del ECG', { req: true }),
          s('ecg_hallazgo', 'ECG — hallazgo', { req: true }),
          una('ecg_st', 'Segmento ST', [
            'Elevación (SCACEST: reperfusión ya)',
            'Depresión o T invertida',
            'Normal',
          ]),
          s('troponina', 'Troponina y hora'),
          i('heart_score', 'Puntaje HEART (0–10)'),
          ...PA(),
        ],
      }),
  },
  {
    code: 'EMERG_ACV',
    carpeta: 'medicina-emergencia',
    nombre: 'Código ACV en emergencia',
    fuente: 'NIH_NIHSS',
    nota: 'Hora de inicio, Cincinnati, NIHSS, glucemia e imagen para decidir trombólisis.',
    campos: () =>
      control({
        condicion: 'accidente cerebrovascular agudo',
        ...AGUDO,
        evaluacion: [
          s('hora_inicio', 'Hora de inicio o de la última vez visto bien', {
            req: true,
          }),
          varias(
            'cincinnati',
            'Cincinnati',
            ['Asimetría facial', 'Caída de un brazo', 'Alteración del habla'],
            { req: true },
          ),
          i('nihss', 'NIHSS (0–42)'),
          d('glucemia', 'Glucemia capilar (mg/dL)', { req: true }),
          ...PA(),
          s('tac', 'TAC de cerebro — hallazgo y hora'),
          una('trombolisis', 'Trombólisis', [
            'Indicada',
            'Contraindicada',
            'Fuera de ventana',
          ]),
        ],
      }),
  },
  {
    code: 'EMERG_POLITRAUMA',
    carpeta: 'medicina-emergencia',
    nombre: 'Paciente politraumatizado: evaluación primaria',
    fuente: 'MINSA_NT022',
    nota: 'Evaluación primaria ABCDE con control cervical y Glasgow.',
    campos: () =>
      control({
        condicion: 'politraumatismo',
        ...AGUDO,
        evaluacion: [
          s('mecanismo', 'Mecanismo', { req: true }),
          una(
            'via_aerea',
            'A — vía aérea con control cervical',
            ['Permeable', 'Comprometida'],
            { req: true },
          ),
          una('respiracion', 'B — respiración', [
            'Adecuada',
            'Neumotórax sospechado',
            'Dificultad respiratoria',
          ]),
          una(
            'circulacion',
            'C — circulación',
            ['Estable', 'Hemorragia activa', 'Shock'],
            { req: true },
          ),
          ...GLASGOW(),
          varias('lesiones', 'Lesiones', [
            'Craneoencefálica',
            'Torácica',
            'Abdominal',
            'Pélvica',
            'Extremidades',
            'Columna',
          ]),
          ...PA(),
        ],
      }),
  },
  {
    code: 'EMERG_INTOXICACION',
    carpeta: 'medicina-emergencia',
    nombre: 'Intoxicación aguda',
    fuente: 'MINSA_NT022',
    nota: 'Sustancia, tiempo, vía, toxíndrome e intención.',
    campos: () =>
      control({
        condicion: 'intoxicación',
        ...AGUDO,
        evaluacion: [
          s('sustancia', 'Sustancia y cantidad', { req: true }),
          s('hora_exposicion', 'Hora de la exposición', { req: true }),
          una('via', 'Vía', ['Oral', 'Inhalatoria', 'Cutánea', 'Parenteral']),
          una('toxindrome', 'Toxíndrome', [
            'Colinérgico (organofosforados)',
            'Anticolinérgico',
            'Simpaticomimético',
            'Opioide',
            'Sedante-hipnótico',
            'No definido',
          ]),
          una(
            'intencion',
            'Intención',
            ['Accidental', 'Autolesión', 'Laboral', 'No se sabe'],
            { req: true },
          ),
          ...si('intencion', 'Autolesión', [
            b(
              'evaluacion_salud_mental',
              'Interconsulta a salud mental pedida',
              { req: true },
            ),
          ]),
          ...GLASGOW(),
        ],
      }),
  },

  /* ---- Salud mental ---- */
  {
    code: 'PSIQ_CTRL_DEPRESION',
    carpeta: 'psiquiatria',
    nombre: 'Control de depresión',
    fuente: 'OMS_MHGAP',
    nota: 'Módulo de depresión de mhGAP: síntomas, funcionamiento, riesgo suicida y respuesta al tratamiento.',
    campos: () =>
      control({
        condicion: 'depresión',
        evaluacion: [
          varias(
            'depresion_sintomas',
            'Síntomas en las últimas 2 semanas',
            [
              'Ánimo deprimido',
              'Anhedonia',
              'Sueño alterado',
              'Apetito alterado',
              'Fatiga',
              'Culpa o inutilidad',
              'Concentración',
              'Enlentecimiento o agitación',
              'Ideas de muerte',
            ],
            { req: true },
          ),
          varias(
            'srq20_respuestas_si',
            'SRQ-20: preguntas respondidas «sí»',
            SRQ20,
          ),
          i('srq20_puntaje', 'SRQ-20 — total'),
          una(
            'riesgo_suicida',
            'Riesgo suicida',
            [
              'Sin ideación',
              'Ideación sin plan',
              'Ideación con plan',
              'Intento reciente',
            ],
            { req: true },
          ),
          ...si(
            'riesgo_suicida',
            ['Ideación con plan', 'Intento reciente'],
            [
              t('plan_de_seguridad', 'Plan de seguridad y derivación', {
                req: true,
              }),
            ],
          ),
        ],
        metas: ['Remisión de síntomas', 'Sin ideación suicida'],
        educacion: [
          'El antidepresivo tarda 2 a 4 semanas',
          'No suspender de golpe',
          'Activación conductual',
        ],
      }),
  },
  {
    code: 'PSIQ_CTRL_PSICOSIS',
    carpeta: 'psiquiatria',
    nombre: 'Control de psicosis',
    fuente: 'OMS_MHGAP',
    nota: 'Módulo de psicosis de mhGAP: síntomas, adherencia al antipsicótico, efectos adversos y riesgo.',
    campos: () =>
      control({
        condicion: 'psicosis',
        evaluacion: [
          varias(
            'psicosis_sintomas',
            'Síntomas presentes',
            [
              'Delirios',
              'Alucinaciones',
              'Discurso desorganizado',
              'Conducta desorganizada',
              'Síntomas negativos',
              'Ninguno',
            ],
            { req: true },
          ),
          varias('efectos_antipsicotico', 'Efectos del antipsicótico', [
            'Rigidez o temblor',
            'Acatisia',
            'Aumento de peso',
            'Sedación',
            'Ninguno',
          ]),
          d('peso_kg', 'Peso (kg)'),
          d('glucemia', 'Glucemia (mg/dL)'),
          una('riesgo_heteroagresion', 'Riesgo de violencia', [
            'Bajo',
            'Moderado',
            'Alto',
          ]),
        ],
        educacion: ['Adherencia', 'Signos de recaída', 'Apoyo a la familia'],
      }),
  },
  {
    code: 'PSIQ_CTRL_ALCOHOL',
    carpeta: 'psiquiatria',
    nombre: 'Consumo de alcohol: AUDIT completo (OMS)',
    fuente: 'OMS_MHGAP',
    nota: 'Las 10 preguntas del AUDIT de la OMS con su puntaje, y abstinencia.',
    campos: () =>
      control({
        condicion: 'consumo de alcohol',
        modo: 'evaluacion',
        evaluacion: [
          ...AUDIT.map(([code, nombre, opciones]) =>
            una(code, nombre, opciones, { req: true }),
          ),
          i('audit_total', 'AUDIT — total (0–40)', {
            req: true,
            ayuda:
              '8–15: consumo de riesgo · 16–19: perjudicial · ≥ 20: probable dependencia.',
          }),
          b('abstinencia', 'Signos de abstinencia'),
        ],
        educacion: [
          'Intervención breve',
          'Límites de consumo',
          'Grupos de apoyo',
        ],
      }),
  },
  {
    code: 'PSICO_CTRL_ANSIEDAD_DEPRESION',
    carpeta: 'psicologia-clinica',
    nombre: 'Seguimiento psicológico de ansiedad y depresión',
    fuente: 'OMS_MHGAP',
    nota: 'Tamizaje SRQ-20 de la OMS, funcionamiento y riesgo según mhGAP; intervención psicológica breve.',
    campos: () =>
      control({
        condicion: 'ansiedad o depresión',
        evaluacion: [
          ...DEPRESION_ANSIEDAD(),
          una('predominio', 'Predominio', ['Depresivo', 'Ansioso', 'Mixto'], {
            req: true,
          }),
          i('sesion_numero', 'Sesión número'),
          una('intervencion', 'Intervención', [
            'Activación conductual',
            'Manejo del estrés',
            'Resolución de problemas',
            'Terapia cognitivo-conductual',
            'Psicoeducación',
          ]),
          una('funcionamiento', 'Funcionamiento', [
            'Conservado',
            'Algo afectado',
            'Muy afectado',
          ]),
        ],
        metas: [
          'Mejora del SRQ-20',
          'Sin ideación suicida',
          'Retomó sus actividades',
        ],
        educacion: [
          'Higiene del sueño',
          'Respiración y relajación',
          'Red de apoyo',
        ],
      }),
  },
  {
    code: 'PSICO_CTRL_VIOLENCIA',
    carpeta: 'psicologia-clinica',
    nombre: 'Atención a personas en situación de violencia',
    fuente: 'OMS_VIOLENCIA',
    nota: 'Primera ayuda (escuchar, preguntar, validar, mejorar la seguridad, apoyo) de las directrices clínicas de la OMS.',
    campos: () =>
      control({
        condicion: 'violencia',
        modo: 'evaluacion',
        evaluacion: [
          varias(
            'violencia_tipo',
            'Tipo de violencia',
            ['Física', 'Psicológica', 'Sexual', 'Económica'],
            { req: true },
          ),
          b('riesgo_inminente', 'Riesgo inminente para su vida', { req: true }),
          ...si('riesgo_inminente', true, [
            t('plan_de_seguridad', 'Plan de seguridad acordado', { req: true }),
          ]),
          b('violencia_sexual_72h', 'Violencia sexual en las últimas 72 horas'),
          ...si('violencia_sexual_72h', true, [
            varias(
              'atencion_urgente',
              'Atención urgente',
              [
                'Profilaxis VIH',
                'Anticoncepción de emergencia',
                'Profilaxis de ITS',
              ],
              { req: true },
            ),
          ]),
          b('orientacion_denuncia', 'Orientada sobre la denuncia (Ley 348)'),
          ...DEPRESION_ANSIEDAD(),
        ],
      }),
  },
];
