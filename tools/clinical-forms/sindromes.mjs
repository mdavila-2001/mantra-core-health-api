/**
 * Lo que se observa según la enfermedad sospechada.
 *
 * Cada función devuelve los campos que se abren al elegir ese síndrome en el
 * `diagnostico_presuntivo` de una ficha. Son los datos que la guía de
 * referencia pide registrar para clasificar gravedad o decidir conducta, no un
 * cuestionario exhaustivo: lo demás va en el relato y el examen.
 *
 * Fuentes (todas de acceso público; la lista completa con URL está en el
 * README del catálogo):
 * - Dengue: OMS/OPS, «Dengue: guías para la atención de enfermos en la Región
 *   de las Américas», 2.ª ed. 2016 — signos de alarma y grupos A/B/C.
 * - Diarrea, IRA y signos de peligro del niño: OMS/OPS, AIEPI.
 * - Neumonía: CURB-65 (Lim et al., Thorax 2003; British Thoracic Society).
 * - Faringoamigdalitis: criterios de Centor modificados por McIsaac.
 * - Insuficiencia cardíaca: clase funcional NYHA; criterios de Framingham.
 * - EPOC: escala de disnea mMRC (Medical Research Council modificada).
 * - Asma: control de síntomas en las últimas 4 semanas (GINA, versión pública).
 * - ACV: escala prehospitalaria de Cincinnati; Glasgow (Teasdale y Jennett).
 * - Cefalea: banderas rojas SNOOP.
 * - Lumbalgia: banderas rojas (guías de atención primaria).
 * - Tuberculosis: sintomático respiratorio ≥ 15 días (Programa Nacional de
 *   Control de la Tuberculosis, Ministerio de Salud de Bolivia).
 * - Chagas: Programa Nacional de Chagas, Ministerio de Salud de Bolivia.
 * - Salud mental: SRQ-20 de la OMS (tamizaje en atención primaria).
 */
import { b, d, i, s, t, una, varias } from './lib.mjs';

export const IRA_ALTA = () => [
  b('centor_fiebre', 'Fiebre mayor a 38 °C', { req: true }),
  b('centor_sin_tos', 'Ausencia de tos'),
  b('centor_adenopatias', 'Adenopatías cervicales anteriores dolorosas'),
  b('centor_exudado', 'Exudado o tumefacción amigdalina'),
  una('ira_rinorrea', 'Rinorrea', ['Ausente', 'Acuosa', 'Purulenta']),
];

export const NEUMONIA = () => [
  b('neumonia_crepitantes', 'Crepitantes o soplo tubario localizados', {
    req: true,
  }),
  varias(
    'curb65',
    'Criterios CURB-65 presentes',
    [
      'Confusión de reciente aparición',
      'Urea > 42 mg/dL (BUN > 19 mg/dL)',
      'Frecuencia respiratoria ≥ 30 rpm',
      'PAS < 90 o PAD ≤ 60 mmHg',
      'Edad ≥ 65 años',
      'Ninguno',
    ],
    {
      req: true,
      ayuda:
        '0–1: ambulatorio · 2: valorar internación · 3 o más: neumonía grave.',
    },
  ),
  b('neumonia_expectoracion', 'Expectoración purulenta'),
];

export const EDA = () => [
  i('eda_deposiciones_24h', 'Deposiciones líquidas en las últimas 24 horas', {
    req: true,
  }),
  b('eda_sangre_en_heces', 'Sangre en las heces (disentería)'),
  b('eda_vomitos', 'Vómitos'),
  una(
    'eda_hidratacion',
    'Estado de hidratación (OMS)',
    [
      'Sin deshidratación — Plan A',
      'Algún grado de deshidratación — Plan B',
      'Deshidratación grave — Plan C',
    ],
    { req: true },
  ),
  b('eda_fiebre', 'Fiebre'),
];

export const ITU = () => [
  varias(
    'itu_sintomas',
    'Síntomas urinarios',
    [
      'Disuria',
      'Polaquiuria',
      'Urgencia miccional',
      'Hematuria',
      'Dolor suprapúbico',
    ],
    { req: true },
  ),
  b('itu_fiebre_o_lumbar', 'Fiebre o dolor lumbar (sospecha de pielonefritis)'),
  una('itu_punopercusion', 'Puñopercusión lumbar', [
    'Positiva',
    'Negativa',
    'No evaluada',
  ]),
  una('itu_embarazo', '¿Embarazo posible?', ['Sí', 'No', 'No aplica']),
];

export const HTA = () => [
  varias(
    'hta_organo_blanco',
    'Síntomas de daño de órgano blanco',
    [
      'Cefalea intensa',
      'Dolor torácico',
      'Disnea',
      'Alteración visual',
      'Déficit neurológico',
      'Ninguno',
    ],
    { req: true },
  ),
  una('hta_adherencia', 'Adherencia al tratamiento', [
    'Toma la medicación todos los días',
    'Olvida dosis',
    'Abandonó el tratamiento',
    'Sin tratamiento todavía',
  ]),
  s(
    'hta_registros_domiciliarios',
    'Registros de presión en domicilio (promedio)',
  ),
];

export const DM2 = () => [
  d('dm_glucemia_capilar', 'Glucemia capilar (mg/dL)', { req: true }),
  d('dm_hba1c', 'Última HbA1c (%)'),
  varias('dm_sintomas', 'Síntomas', [
    'Poliuria',
    'Polidipsia',
    'Pérdida de peso',
    'Visión borrosa',
    'Ninguno',
  ]),
  una(
    'dm_pie',
    'Examen del pie',
    [
      'Sensibilidad conservada (monofilamento)',
      'Sensibilidad disminuida',
      'Úlcera o lesión presente',
      'No evaluado',
    ],
    { req: true },
  ),
  b('dm_hipoglucemias', 'Episodios de hipoglucemia desde el último control'),
];

export const DENGUE = () => [
  i('dengue_dias_de_fiebre', 'Días de fiebre', { req: true }),
  varias(
    'dengue_signos_de_alarma',
    'Signos de alarma (OPS/OMS)',
    [
      'Dolor abdominal intenso y continuo',
      'Vómitos persistentes',
      'Acumulación de líquidos (ascitis, derrame)',
      'Sangrado de mucosas',
      'Letargia o irritabilidad',
      'Hepatomegalia mayor a 2 cm',
      'Aumento del hematocrito con caída de plaquetas',
      'Hipotensión postural',
      'Ninguno',
    ],
    { req: true },
  ),
  una('dengue_torniquete', 'Prueba del torniquete', [
    'Positiva',
    'Negativa',
    'No realizada',
  ]),
  una(
    'dengue_grupo',
    'Clasificación',
    [
      'Grupo A — sin signos de alarma',
      'Grupo B — con signos de alarma o condición asociada',
      'Grupo C — dengue grave',
    ],
    { req: true },
  ),
];

export const LUMBALGIA = () => [
  varias(
    'lumbalgia_banderas_rojas',
    'Banderas rojas',
    [
      'Edad menor a 20 o mayor a 55 años',
      'Traumatismo importante',
      'Fiebre',
      'Pérdida de peso no explicada',
      'Antecedente de cáncer',
      'Déficit neurológico progresivo',
      'Alteración de esfínteres o anestesia en silla de montar',
      'Ninguna',
    ],
    { req: true },
  ),
  b('lumbalgia_ciatica', 'Dolor irradiado por debajo de la rodilla'),
  una('lumbalgia_lasegue', 'Signo de Lasègue', [
    'Positivo',
    'Negativo',
    'No evaluado',
  ]),
];

export const NYHA = [
  'Clase I — sin limitación de la actividad física',
  'Clase II — limitación leve: síntomas con la actividad ordinaria',
  'Clase III — limitación marcada: síntomas con actividad menor a la ordinaria',
  'Clase IV — síntomas en reposo',
];

export const IC = () => [
  una('ic_clase_nyha', 'Clase funcional NYHA', NYHA, { req: true }),
  varias(
    'ic_signos',
    'Signos y síntomas (Framingham)',
    [
      'Ortopnea',
      'Disnea paroxística nocturna',
      'Ingurgitación yugular',
      'Crepitantes pulmonares',
      'Tercer ruido (galope)',
      'Edema de miembros inferiores',
      'Hepatomegalia',
    ],
    { req: true },
  ),
  una('ic_edema_grado', 'Edema (fóvea)', [
    'Sin edema',
    '+ (2 mm)',
    '++ (4 mm)',
    '+++ (6 mm)',
    '++++ (8 mm)',
  ]),
  d('ic_peso_seco', 'Peso de referencia (kg)'),
];

export const DOLOR_TORACICO = () => [
  una(
    'dt_tipo',
    'Tipo de dolor torácico',
    [
      'Típico: retroesternal, con el esfuerzo, cede con reposo o nitratos',
      'Atípico: cumple dos de los tres criterios',
      'No anginoso: cumple uno o ninguno',
    ],
    { req: true },
  ),
  varias('dt_acompanantes', 'Acompañantes', [
    'Diaforesis',
    'Náuseas o vómitos',
    'Disnea',
    'Síncope o presíncope',
    'Ninguno',
  ]),
  s('dt_ecg', 'ECG de 12 derivaciones — hallazgo principal'),
];

export const ARRITMIA = () => [
  una('arritmia_inicio_fin', 'Inicio y fin de las palpitaciones', [
    'Súbitos',
    'Graduales',
  ]),
  una('arritmia_ritmo', 'Ritmo referido o palpado', ['Regular', 'Irregular']),
  b('arritmia_sincope', 'Se acompañó de síncope'),
  s('arritmia_ecg', 'ECG — ritmo registrado'),
];

export const SINCOPE = () => [
  varias('sincope_contexto', 'Contexto', [
    'De pie prolongado o calor',
    'Tras orinar, toser o defecar',
    'Durante el esfuerzo',
    'En decúbito',
    'Sin desencadenante',
  ]),
  b('sincope_prodromos', 'Pródromos (mareo, visión borrosa, sudoración)'),
  b('sincope_palpitaciones_previas', 'Palpitaciones previas'),
  i(
    'sincope_duracion_segundos',
    'Duración de la pérdida de conciencia (segundos)',
  ),
];

export const CHAGAS = () => [
  una(
    'chagas_serologia',
    'Serología para Chagas',
    ['Positiva', 'Negativa', 'Pendiente', 'No realizada'],
    { req: true },
  ),
  varias('chagas_compromiso', 'Compromiso orgánico', [
    'Cardíaco (arritmia, bloqueo, insuficiencia)',
    'Digestivo (megaesófago, megacolon)',
    'Sin compromiso aparente',
  ]),
  b('chagas_tratamiento_previo', 'Recibió benznidazol o nifurtimox'),
  b('chagas_vivienda_endemica', 'Vivió en vivienda con vinchucas'),
];

export const MMRC = [
  'Grado 0 — disnea sólo con ejercicio intenso',
  'Grado 1 — al caminar rápido o subir una pendiente',
  'Grado 2 — camina más despacio que sus pares o se detiene en llano',
  'Grado 3 — se detiene a los 100 metros o a los pocos minutos',
  'Grado 4 — no sale de casa o se ahoga al vestirse',
];

export const EPOC = () => [
  una('epoc_mmrc', 'Disnea (escala mMRC)', MMRC, { req: true }),
  i('epoc_exacerbaciones_anio', 'Exacerbaciones en el último año'),
  i('epoc_paquetes_anio', 'Tabaquismo acumulado (paquetes-año)'),
  b('epoc_exposicion_biomasa', 'Exposición a humo de leña o biomasa'),
];

export const ASMA = () => [
  varias(
    'asma_control_4_semanas',
    'En las últimas 4 semanas (GINA)',
    [
      'Síntomas diurnos más de 2 veces por semana',
      'Despertares nocturnos por asma',
      'Uso de rescate más de 2 veces por semana',
      'Limitación de la actividad',
      'Ninguno',
    ],
    {
      req: true,
      ayuda:
        'Ninguno: controlada · 1–2: parcialmente controlada · 3–4: no controlada.',
    },
  ),
  i('asma_crisis_anio', 'Crisis que requirieron urgencias en el último año'),
  s('asma_tratamiento_actual', 'Inhaladores que usa'),
];

export const TBC = () => [
  i('tbc_dias_de_tos', 'Días de tos con expectoración', {
    req: true,
    ayuda: '15 días o más: sintomático respiratorio, pedir baciloscopía.',
  }),
  varias('tbc_sintomas', 'Síntomas acompañantes', [
    'Fiebre vespertina',
    'Sudoración nocturna',
    'Pérdida de peso',
    'Hemoptisis',
    'Ninguno',
  ]),
  b('tbc_contacto', 'Contacto con un caso de tuberculosis'),
  una('tbc_baciloscopia', 'Baciloscopía', [
    'Positiva',
    'Negativa',
    'Pedida',
    'No pedida',
  ]),
];

export const ANEMIA = () => [
  d('anemia_hemoglobina', 'Hemoglobina (g/dL)', {
    req: true,
    ayuda: 'Ajustar por altitud de residencia.',
  }),
  varias('anemia_sintomas', 'Síntomas', [
    'Astenia',
    'Disnea de esfuerzo',
    'Palpitaciones',
    'Pica',
    'Ninguno',
  ]),
  varias('anemia_perdidas', 'Posibles pérdidas', [
    'Menstruación abundante',
    'Sangrado digestivo',
    'Parasitosis',
    'Ninguna conocida',
  ]),
  s('anemia_vcm', 'VCM y ferritina, si se conocen'),
];

export const ACV = () => [
  varias(
    'acv_cincinnati',
    'Escala de Cincinnati',
    [
      'Asimetría facial',
      'Caída de un brazo',
      'Alteración del habla',
      'Ninguno',
    ],
    { req: true },
  ),
  s('acv_hora_inicio', 'Hora de inicio o de la última vez visto bien', {
    req: true,
  }),
  i('acv_glasgow', 'Escala de Glasgow (3–15)'),
  d('acv_glucemia', 'Glucemia capilar (mg/dL)'),
];

export const CEFALEA = () => [
  varias(
    'cefalea_snoop',
    'Banderas rojas (SNOOP)',
    [
      'Síntomas sistémicos (fiebre, pérdida de peso)',
      'Déficit neurológico focal o confusión',
      'Inicio súbito, en trueno',
      'Inicio después de los 50 años',
      'Cambio de patrón o empeora con Valsalva o posición',
      'Ninguna',
    ],
    { req: true },
  ),
  una('cefalea_tipo', 'Fenotipo', [
    'Migraña sin aura',
    'Migraña con aura',
    'Tensional',
    'En racimos',
    'Por abuso de analgésicos',
    'No definido',
  ]),
  i('cefalea_dias_mes', 'Días de cefalea por mes'),
];

export const CONVULSION = () => [
  una(
    'convulsion_tipo',
    'Tipo de crisis',
    [
      'Tónico-clónica generalizada',
      'Focal sin pérdida de conciencia',
      'Focal con alteración de conciencia',
      'Ausencia',
      'No definido',
    ],
    { req: true },
  ),
  i('convulsion_duracion_minutos', 'Duración (minutos)'),
  b('convulsion_primera', 'Es la primera crisis'),
  varias('convulsion_desencadenantes', 'Posibles desencadenantes', [
    'Fiebre',
    'Falta de sueño',
    'Alcohol',
    'Abandono de la medicación',
    'Ninguno conocido',
  ]),
];

/** SRQ-20 de la OMS: las 20 preguntas de sí/no, como casillas. */
export const SRQ20 = [
  '¿Tiene frecuentes dolores de cabeza?',
  '¿Tiene mal apetito?',
  '¿Duerme mal?',
  '¿Se asusta con facilidad?',
  '¿Sufre de temblor de manos?',
  '¿Se siente nervioso, tenso o aburrido?',
  '¿Sufre de mala digestión?',
  '¿No puede pensar con claridad?',
  '¿Se siente triste?',
  '¿Llora usted con mucha frecuencia?',
  '¿Tiene dificultad en disfrutar sus actividades diarias?',
  '¿Tiene dificultad para tomar decisiones?',
  '¿Tiene dificultad en hacer su trabajo?',
  '¿Es incapaz de desempeñar un papel útil en su vida?',
  '¿Ha perdido interés en las cosas?',
  '¿Siente que usted es una persona inútil?',
  '¿Ha tenido la idea de acabar con su vida?',
  '¿Se siente cansado todo el tiempo?',
  '¿Tiene sensaciones desagradables en su estómago?',
  '¿Se cansa con facilidad?',
];

export const DEPRESION_ANSIEDAD = () => [
  varias(
    'srq20_respuestas_si',
    'SRQ-20 (OMS): marque las preguntas que respondió «sí» en el último mes',
    SRQ20,
    {
      ayuda:
        '8 o más respuestas positivas: probable trastorno mental común. La pregunta 17 positiva exige evaluar riesgo suicida.',
    },
  ),
  i('srq20_puntaje', 'SRQ-20 — total de respuestas «sí» (0–20)', { req: true }),
  b('ideacion_suicida', 'Ideación suicida actual', { req: true }),
];
