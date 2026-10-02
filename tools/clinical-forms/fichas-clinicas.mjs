/**
 * Fichas de consulta de las especialidades clínicas (v2).
 *
 * Cada entrada devuelve la lista de campos en orden. Los códigos que ya
 * existían en la v1 se conservan con su mismo tipo: son la clave con la que la
 * siembra reconcilia y la que referencian las capturas ya hechas.
 */
import {
  alergias,
  antecedentes,
  b,
  cierre,
  d,
  f,
  familiares,
  habitos,
  i,
  medicacion,
  motivo,
  quirurgicos,
  s,
  seccion,
  si,
  socrates,
  sospecha,
  t,
  una,
  varias,
  vitales,
} from './lib.mjs';
import {
  ACV,
  ANEMIA,
  ARRITMIA,
  ASMA,
  CEFALEA,
  CHAGAS,
  CONVULSION,
  DENGUE,
  DEPRESION_ANSIEDAD,
  DM2,
  DOLOR_TORACICO,
  EDA,
  EPOC,
  HTA,
  IC,
  IRA_ALTA,
  ITU,
  LUMBALGIA,
  MMRC,
  NEUMONIA,
  NYHA,
  SINCOPE,
  TBC,
} from './sindromes.mjs';

const ROS = (codigo = 'revision_por_sistemas') => [
  varias('sintomas_generales', 'Síntomas generales', [
    'Fiebre',
    'Pérdida de peso',
    'Astenia',
    'Sudoración nocturna',
    'Ninguno',
  ]),
  t(codigo, 'Revisión por sistemas — hallazgos positivos'),
];

export const CLINICAS = {
  MEDGEN_CONSULTA_BASE: () => [
    seccion('Motivo de consulta', motivo({ relato: 'enfermedad_actual' })),
    seccion('Antecedentes', [
      antecedentes(
        'antecedentes_personales',
        'Antecedentes personales patológicos',
      ),
      quirurgicos(),
      alergias(),
      medicacion(),
      familiares(),
    ]),
    seccion('Hábitos', habitos()),
    seccion('Revisión por sistemas', [
      t(
        'funciones_biologicas',
        'Funciones biológicas (apetito, sed, sueño, orina, deposiciones)',
      ),
    ]),
    seccion('Examen físico', [
      vitales({
        pa: 'presion_arterial',
        pas: null,
        pad: null,
        peso: 'peso',
        talla: 'talla',
        fr: 'frecuencia_respiratoria',
        sat: 'saturacion_de_oxigeno',
      }),
      t('examen_fisico_general', 'Examen físico general'),
      t('examen_por_aparatos', 'Examen por aparatos y sistemas'),
    ]),
    seccion(
      'Diagnóstico presuntivo y observaciones',
      sospecha({
        'Infección respiratoria alta (resfrío, faringoamigdalitis)': IRA_ALTA(),
        'Neumonía adquirida en la comunidad': NEUMONIA(),
        'Enfermedad diarreica aguda': EDA(),
        'Infección urinaria': ITU(),
        'Hipertensión arterial': HTA(),
        'Diabetes mellitus tipo 2': DM2(),
        'Dengue o síndrome febril agudo': DENGUE(),
        Lumbalgia: LUMBALGIA(),
      }),
    ),
    seccion('Diagnóstico y plan', [
      t('examenes_auxiliares', 'Exámenes auxiliares solicitados'),
      cierre(),
    ]),
  ],

  MEDFAM_CONSULTA_BASE: () => [
    seccion('Motivo de consulta', motivo({ relato: 'enfermedad_actual' })),
    seccion('Antecedentes', [
      antecedentes('antecedentes_personales', 'Antecedentes personales'),
      alergias('alergias_detalle'),
      medicacion(),
      familiares(),
    ]),
    seccion('Familia y entorno', [
      una('etapa_ciclo_vital', 'Etapa del ciclo vital familiar', [
        'Formación (pareja sin hijos)',
        'Expansión (hijos pequeños)',
        'Consolidación (hijos escolares o adolescentes)',
        'Contracción (los hijos se van)',
        'Disolución (adultos mayores solos)',
      ]),
      t(
        'composicion_grupo_familiar',
        'Composición del grupo familiar (familiograma)',
      ),
      i('numero_convivientes', 'Número de convivientes'),
      una('apgar_familiar', 'APGAR familiar (Smilkstein)', [
        'Funcional (7 a 10)',
        'Disfunción leve (4 a 6)',
        'Disfunción grave (0 a 3)',
      ]),
      varias('condiciones_vivienda_marcadas', 'Vivienda', [
        'Agua potable',
        'Alcantarillado',
        'Piso de tierra',
        'Hacinamiento',
        'Vinchucas en la vivienda',
        'Cocina a leña dentro de la casa',
      ]),
      t('condiciones_de_vivienda', 'Condiciones de vivienda — detalle'),
      t('red_de_apoyo', 'Red de apoyo'),
      s('ocupacion', 'Ocupación'),
    ]),
    seccion('Hábitos y prevención', [
      habitos(),
      t('habitos', 'Otros hábitos (alimentación, actividad física, sueño)'),
      varias('controles_preventivos_al_dia', 'Controles preventivos al día', [
        'Vacunas',
        'Papanicolaou o IVAA',
        'Mamografía',
        'Glucemia',
        'Presión arterial',
        'Salud bucal',
      ]),
      t('controles_preventivos', 'Controles preventivos — detalle'),
    ]),
    seccion('Examen físico', [
      vitales({ pa: 'presion_arterial', pas: null, pad: null }),
      t('examen_fisico_general', 'Examen físico general'),
      t('examen_por_aparatos', 'Examen por aparatos'),
    ]),
    seccion(
      'Diagnóstico presuntivo y observaciones',
      sospecha({
        'Infección respiratoria alta': IRA_ALTA(),
        'Enfermedad diarreica aguda': EDA(),
        'Hipertensión arterial': HTA(),
        'Diabetes mellitus tipo 2': DM2(),
        'Infección urinaria': ITU(),
        'Trastorno mental común (ansiedad, depresión)': DEPRESION_ANSIEDAD(),
        'Enfermedad de Chagas': CHAGAS(),
      }),
    ),
    seccion(
      'Diagnóstico y plan',
      cierre({
        plan: 'plan_de_tratamiento',
        planNombre: 'Plan de tratamiento y seguimiento familiar',
      }),
    ),
  ],

  MEDINT_EVALUACION_BASE: () => [
    seccion('Motivo de consulta', [
      obl_(t('motivo_consulta', 'Motivo de consulta')),
      obl_(t('enfermedad_actual', 'Relato de la enfermedad actual')),
    ]),
    seccion('Antecedentes', [
      varias(
        'antecedentes_cronicos',
        'Comorbilidades',
        [
          'Hipertensión arterial',
          'Diabetes mellitus',
          'Cardiopatía',
          'EPOC o asma',
          'Enfermedad renal crónica',
          'Hepatopatía',
          'Cáncer',
          'Enfermedad de Chagas',
          'VIH',
          'Ninguna',
        ],
        { otro: true },
      ),
      obl_(t('comorbilidades', 'Comorbilidades — detalle y grado de control')),
      obl_(
        t('medicacion_actual', 'Medicación actual (nombre, dosis, frecuencia)'),
      ),
      i('cantidad_de_farmacos', 'Cantidad de fármacos en uso', {
        ayuda: '5 o más: polifarmacia.',
      }),
      alergias(),
      habitos(),
      t('habitos_toxicos', 'Hábitos tóxicos — detalle'),
      una('estado_funcional', 'Estado funcional', [
        'Independiente',
        'Requiere ayuda para actividades instrumentales',
        'Requiere ayuda para actividades básicas',
        'Postrado',
      ]),
    ]),
    seccion('Revisión por sistemas', [
      b('perdida_de_peso_reciente', 'Pérdida de peso reciente'),
      ...si('perdida_de_peso_reciente', true, [
        d('perdida_de_peso_kg', '¿Cuántos kg y en cuánto tiempo?', {
          req: true,
        }),
      ]),
      b('fiebre', 'Fiebre'),
      ...si('fiebre', true, [
        i('fiebre_dias', 'Días de fiebre', { req: true }),
      ]),
      t('revision_por_sistemas', 'Revisión por sistemas — hallazgos'),
    ]),
    seccion('Examen físico', [
      vitales(),
      obl_(t('examen_fisico_dirigido', 'Examen físico dirigido')),
      t('laboratorio_relevante', 'Laboratorio relevante'),
    ]),
    seccion(
      'Diagnóstico presuntivo y observaciones',
      sospecha({
        'Insuficiencia cardíaca': IC(),
        'Diabetes mellitus descompensada': DM2(),
        'Hipertensión arterial': HTA(),
        Neumonía: NEUMONIA(),
        Anemia: ANEMIA(),
        'Síndrome febril prolongado': [
          i('sfp_dias', 'Días de fiebre', { req: true }),
          varias('sfp_estudios', 'Estudios ya realizados', [
            'Hemocultivos',
            'Urocultivo',
            'Serología VIH',
            'Baciloscopía',
            'Imágenes',
            'Ninguno',
          ]),
        ],
        'Enfermedad renal crónica': [
          d('erc_creatinina', 'Creatinina (mg/dL)', { req: true }),
          d('erc_tfg', 'Filtrado glomerular estimado (mL/min/1,73 m²)'),
        ],
      }),
    ),
    seccion('Problemas y plan', [
      obl_(t('problemas_activos', 'Lista de problemas activos')),
      obl_(t('plan_por_problema', 'Plan por problema')),
    ]),
  ],

  CARDIO_FICHA_BASE: () => [
    seccion(
      'Motivo de consulta',
      motivo({ tiempo: 'tiempo_de_evolucion', tiempoReq: false }),
    ),
    seccion('Síntomas cardiovasculares', [
      b('dolor_toracico', 'Dolor torácico'),
      ...socrates('dolor_toracico', 'dolor_toracico', true, { sitio: false }),
      t(
        'caracteristicas_del_dolor',
        'Características del dolor — otras observaciones',
      ),
      b('disnea', 'Disnea'),
      ...si('disnea', true, [
        una('nyha_clase_funcional', 'Clase funcional NYHA', NYHA, {
          req: true,
        }),
        varias('disnea_tipo', 'Tipo de disnea', [
          'De esfuerzo',
          'Ortopnea',
          'Disnea paroxística nocturna',
          'En reposo',
        ]),
      ]),
      b('palpitaciones', 'Palpitaciones'),
      ...si('palpitaciones', true, ARRITMIA()),
      b('sincope', 'Síncope'),
      ...si('sincope', true, SINCOPE()),
      b('edema_de_miembros_inferiores', 'Edema de miembros inferiores'),
      ...si('edema_de_miembros_inferiores', true, [
        una(
          'edema_grado',
          'Edema (fóvea)',
          ['+ (2 mm)', '++ (4 mm)', '+++ (6 mm)', '++++ (8 mm)'],
          { req: true },
        ),
        una('edema_lateralidad', 'Lateralidad', ['Bilateral', 'Unilateral']),
      ]),
    ]),
    seccion('Factores de riesgo', [
      b('hipertension_arterial', 'Hipertensión arterial'),
      ...si('hipertension_arterial', true, [
        s('hta_tratamiento', '¿Qué tratamiento recibe?'),
      ]),
      b('diabetes', 'Diabetes'),
      ...si('diabetes', true, [d('dm_hba1c', 'Última HbA1c (%)')]),
      b('dislipidemia', 'Dislipidemia'),
      ...si('dislipidemia', true, [d('ldl', 'Último colesterol LDL (mg/dL)')]),
      b('tabaquismo', 'Tabaquismo'),
      ...si('tabaquismo', true, [i('paquetes_anio', 'Paquetes-año')]),
      b(
        'antecedente_familiar_coronario',
        'Familiar de primer grado con enfermedad coronaria precoz',
      ),
      ...si('antecedente_familiar_coronario', true, [
        s('familiar_coronario_quien', '¿Quién y a qué edad?', { req: true }),
      ]),
      b('chagas_riesgo', 'Vivió en zona endémica de Chagas'),
      ...si('chagas_riesgo', true, [
        una(
          'chagas_serologia_cardio',
          'Serología para Chagas',
          ['Positiva', 'Negativa', 'Nunca se hizo'],
          { req: true },
        ),
      ]),
      alergias('alergias'),
      medicacion(),
    ]),
    seccion('Examen físico', [
      vitales(
        { fr: null, temp: null, sat: null, peso: 'peso_kg', talla: 'talla_cm' },
        ['pas', 'pad', 'fc'],
      ),
      t('ruidos_cardiacos', 'Ruidos cardíacos'),
      b('hay_soplo', 'Soplo'),
      ...si('hay_soplo', true, [
        una(
          'soplo_grado_levine',
          'Intensidad (Levine)',
          ['I/VI', 'II/VI', 'III/VI', 'IV/VI', 'V/VI', 'VI/VI'],
          { req: true },
        ),
        una('soplo_tiempo', 'Tiempo', ['Sistólico', 'Diastólico', 'Continuo']),
        t('soplos', 'Foco e irradiación'),
      ]),
      t('pulsos_perifericos', 'Pulsos periféricos'),
      t('ecg_hallazgos', 'ECG — hallazgos'),
    ]),
    seccion(
      'Diagnóstico presuntivo y observaciones',
      sospecha({
        'Síndrome coronario o angina': DOLOR_TORACICO(),
        'Insuficiencia cardíaca': IC(),
        'Hipertensión arterial': HTA(),
        Arritmia: [
          una(
            'arr_tipo',
            'Ritmo documentado',
            [
              'Fibrilación auricular',
              'Flutter auricular',
              'Taquicardia supraventricular',
              'Extrasístoles',
              'Bloqueo AV',
              'No documentado',
            ],
            { req: true },
          ),
          b('arr_anticoagulado', 'Recibe anticoagulación'),
        ],
        'Cardiopatía chagásica': CHAGAS(),
        Valvulopatía: [
          s('valv_valvula', 'Válvula comprometida', { req: true }),
          s('valv_eco', 'Ecocardiograma — hallazgo principal'),
        ],
      }),
    ),
    seccion('Diagnóstico y plan', cierre()),
  ],

  CARDIO_RIESGO_CV_OMS: () => [
    seccion('Datos para la tabla OMS/OPS', [
      obl_(
        i('edad', 'Edad (años)', {
          ayuda: 'Las tablas cubren de 40 a 74 años.',
        }),
      ),
      obl_(una('sexo', 'Sexo', ['Mujer', 'Hombre'])),
      obl_(b('fumador_actual', 'Fumador actual (o dejó hace menos de un año)')),
      obl_(b('diabetes', 'Diabetes')),
      obl_(
        i('presion_arterial_sistolica', 'Presión arterial sistólica (mmHg)'),
      ),
      b('colesterol_disponible', '¿Hay colesterol total medido?'),
      ...si('colesterol_disponible', true, [
        d('colesterol_total', 'Colesterol total (mmol/L)', { req: true }),
      ]),
      ...si('colesterol_disponible', false, [
        d('indice_masa_corporal', 'Índice de masa corporal (kg/m²)', {
          req: true,
          ayuda: 'La tabla sin laboratorio usa el IMC.',
        }),
      ]),
    ]),
    seccion('Resultado', [
      d('riesgo_a_10_anios', 'Riesgo a 10 años (%)'),
      una(
        'categoria_de_riesgo',
        'Categoría de riesgo',
        ['< 5 %', '5 % a < 10 %', '10 % a < 20 %', '20 % a < 30 %', '≥ 30 %'],
        { req: true },
      ),
      t('recomendaciones', 'Recomendaciones'),
    ]),
  ],

  NEUMO_EVALUACION_BASE: () => [
    seccion('Motivo de consulta', motivo({ tiempo: 'tiempo_de_enfermedad' })),
    seccion('Síntomas respiratorios', [
      b('tiene_disnea', 'Disnea'),
      ...si('tiene_disnea', true, [
        una('disnea_mmrc', 'Disnea (escala mMRC)', MMRC, { req: true }),
        t('disnea', 'Disnea — detalle'),
      ]),
      b('tiene_tos', 'Tos'),
      ...si('tiene_tos', true, [
        i('tos_dias', 'Días de tos', { req: true }),
        una('tos_tipo', 'Tipo de tos', ['Seca', 'Productiva']),
        t('tos', 'Tos — detalle'),
      ]),
      ...si('tos_tipo', 'Productiva', [
        una('expectoracion_aspecto', 'Aspecto de la expectoración', [
          'Mucosa',
          'Purulenta',
          'Hemoptoica',
        ]),
        t('expectoracion', 'Expectoración — detalle'),
      ]),
      b('hemoptisis', 'Hemoptisis'),
      ...si('hemoptisis', true, [
        una(
          'hemoptisis_volumen',
          'Volumen',
          [
            'Esputo hemoptoico',
            'Menos de 100 mL/24 h',
            'Más de 100 mL/24 h (masiva)',
          ],
          { req: true },
        ),
      ]),
      t('dolor_toracico', 'Dolor torácico'),
      b('sibilancias', 'Sibilancias'),
    ]),
    seccion('Exposiciones y antecedentes', [
      una('tabaco', 'Consumo de tabaco', [
        'Nunca fumó',
        'Exfumador',
        'Fumador actual',
      ]),
      ...si(
        'tabaco',
        ['Exfumador', 'Fumador actual'],
        [i('paquetes_anio', 'Paquetes-año', { req: true })],
      ),
      t('tabaquismo', 'Tabaquismo — detalle'),
      varias(
        'exposiciones',
        'Exposiciones',
        [
          'Humo de leña o biomasa',
          'Polvo de minería',
          'Sílice o asbesto',
          'Aves o palomas',
          'Contacto con tuberculosis',
          'Ninguna',
        ],
        { otro: true },
      ),
      t(
        'exposicion_ocupacional_o_ambiental',
        'Exposición ocupacional o ambiental — detalle',
      ),
      t('antecedentes_respiratorios', 'Antecedentes respiratorios'),
      alergias(),
    ]),
    seccion('Examen físico', [
      vitales(
        {
          pas: null,
          pad: null,
          fc: 'frecuencia_cardiaca',
          temp: null,
          peso: null,
          talla: null,
        },
        ['sat'],
      ),
      obl_(t('auscultacion_pulmonar', 'Auscultación pulmonar')),
      t('examenes_previos', 'Exámenes previos (espirometría, imágenes)'),
    ]),
    seccion(
      'Diagnóstico presuntivo y observaciones',
      sospecha({
        Asma: ASMA(),
        EPOC: EPOC(),
        Neumonía: NEUMONIA(),
        'Tuberculosis pulmonar': TBC(),
        'Enfermedad pulmonar intersticial': [
          b('epi_velcro', 'Crepitantes tipo «velcro»', { req: true }),
          b('epi_hipocratismo', 'Hipocratismo digital'),
        ],
        'Apnea obstructiva del sueño': [
          varias(
            'apnea_sintomas',
            'Síntomas y factores de apnea del sueño',
            [
              'Ronquido fuerte',
              'Somnolencia diurna',
              'Apneas observadas por otra persona',
              'Hipertensión',
              'Obesidad',
              'Cuello ancho',
            ],
            { req: true },
          ),
          i(
            'somnolencia_diurna_veces_semana',
            'Veces por semana que se duerme sin querer de día',
          ),
        ],
      }),
    ),
    seccion('Diagnóstico y plan', cierre()),
  ],

  GASTRO_EVALUACION_BASE: () => [
    seccion('Motivo de consulta', motivo({ relato: 'enfermedad_actual' })),
    seccion('Síntomas digestivos', [
      b('dolor_abdominal', 'Dolor abdominal'),
      ...socrates('dolor_abdominal', 'dolor_abdominal', true),
      t('caracteristicas_del_dolor', 'Dolor — otras observaciones'),
      una('bristol', 'Forma de las heces (escala de Bristol)', [
        'Tipo 1 — bolitas duras',
        'Tipo 2 — salchicha grumosa',
        'Tipo 3 — salchicha con grietas',
        'Tipo 4 — salchicha lisa',
        'Tipo 5 — trozos blandos',
        'Tipo 6 — pastosa',
        'Tipo 7 — líquida',
      ]),
      i('deposiciones_por_dia', 'Deposiciones por día'),
      t('habito_intestinal', 'Hábito intestinal — detalle'),
      b('nauseas_o_vomitos', 'Náuseas o vómitos'),
      b('pirosis_o_reflujo', 'Pirosis o reflujo'),
      b('hubo_hemorragia', 'Hemorragia digestiva'),
      ...si('hubo_hemorragia', true, [
        varias(
          'hemorragia_tipo',
          '¿Cómo se manifestó?',
          ['Hematemesis', 'Melena', 'Hematoquecia', 'Sangre oculta en heces'],
          { req: true },
        ),
        t('hemorragia_digestiva', 'Hemorragia — detalle'),
      ]),
      b('ictericia', 'Ictericia'),
      ...si('ictericia', true, [
        varias('ictericia_acompanantes', 'Acompañantes', [
          'Coluria',
          'Acolia',
          'Prurito',
          'Fiebre',
          'Dolor en hipocondrio derecho',
        ]),
      ]),
      varias(
        'signos_de_alarma_digestivos',
        'Signos de alarma',
        [
          'Pérdida de peso',
          'Disfagia',
          'Anemia',
          'Vómitos persistentes',
          'Masa palpable',
          'Edad > 50 con síntomas nuevos',
          'Ninguno',
        ],
        { req: true },
      ),
    ]),
    seccion('Antecedentes', [
      t('antecedentes_digestivos', 'Antecedentes digestivos'),
      medicacion(),
      alergias('alergias'),
      habitos(),
    ]),
    seccion('Examen del abdomen', [
      t('inspeccion_del_abdomen', 'Inspección'),
      t('auscultacion_del_abdomen', 'Auscultación'),
      obl_(t('palpacion_del_abdomen', 'Palpación')),
      t('tacto_rectal', 'Tacto rectal'),
    ]),
    seccion(
      'Diagnóstico presuntivo y observaciones',
      sospecha({
        'Dispepsia o gastritis': [
          b('helicobacter', 'Prueba de Helicobacter pylori realizada'),
          b('aines', 'Consume AINE'),
        ],
        'Enfermedad por reflujo gastroesofágico': [
          varias(
            'erge_sintomas',
            'Síntomas',
            [
              'Pirosis',
              'Regurgitación',
              'Tos crónica',
              'Disfonía',
              'Dolor torácico no cardíaco',
            ],
            { req: true },
          ),
        ],
        'Enfermedad diarreica': EDA(),
        'Síndrome de intestino irritable': [
          varias(
            'sii_caracteristicas',
            'Dolor abdominal recurrente: características',
            [
              'Mejora o empeora con la defecación',
              'Se asocia a cambio en la frecuencia',
              'Se asocia a cambio en la forma de las heces',
            ],
            { req: true },
          ),
          i('sii_meses', 'Meses de evolución'),
        ],
        'Hemorragia digestiva': [
          una(
            'hd_estabilidad',
            'Estabilidad hemodinámica',
            ['Estable', 'Taquicardia', 'Hipotensión o shock'],
            { req: true },
          ),
          d('hd_hemoglobina', 'Hemoglobina (g/dL)'),
        ],
        'Hepatopatía o ictericia': [
          varias(
            'hep_estigmas',
            'Estigmas de hepatopatía',
            [
              'Arañas vasculares',
              'Eritema palmar',
              'Ascitis',
              'Encefalopatía',
              'Ninguno',
            ],
            { req: true },
          ),
          s('hep_serologias', 'Serologías virales'),
        ],
        'Colelitiasis o colecistitis': [
          b('murphy', 'Signo de Murphy positivo', { req: true }),
          b('colico_posprandial', 'Dolor posprandial en hipocondrio derecho'),
        ],
      }),
    ),
    seccion('Diagnóstico y plan', cierre()),
  ],

  ENDO_EVALUACION_BASE: () => [
    seccion('Motivo de consulta', motivo({ relato: 'enfermedad_actual' })),
    seccion('Antecedentes', [
      t(
        'antecedentes_metabolicos_familiares',
        'Antecedentes metabólicos familiares (diabetes, tiroides, obesidad)',
      ),
      antecedentes('antecedentes_personales', 'Antecedentes personales'),
      medicacion(),
    ]),
    seccion('Síntomas', [
      b('poliuria', 'Poliuria'),
      b('polidipsia', 'Polidipsia'),
      b('polifagia', 'Polifagia'),
      una('tendencia_de_peso', 'Cambio de peso', [
        'Estable',
        'Aumentó',
        'Bajó',
      ]),
      ...si(
        'tendencia_de_peso',
        ['Aumentó', 'Bajó'],
        [s('cambio_de_peso', '¿Cuántos kg y en cuánto tiempo?', { req: true })],
      ),
      varias('sintomas_tiroideos_marcados', 'Síntomas tiroideos', [
        'Intolerancia al frío',
        'Intolerancia al calor',
        'Palpitaciones',
        'Temblor',
        'Constipación',
        'Caída de cabello',
        'Bocio referido',
        'Ninguno',
      ]),
      t('sintomas_tiroideos', 'Síntomas tiroideos — detalle'),
    ]),
    seccion('Examen físico', [
      obl_(d('peso', 'Peso (kg)')),
      d('talla', 'Talla (cm)'),
      d('perimetro_abdominal', 'Perímetro abdominal (cm)'),
      s('presion_arterial', 'Presión arterial (mmHg)'),
      una('bocio_oms', 'Bocio (clasificación OMS)', [
        'Grado 0 — no palpable',
        'Grado 1 — palpable, no visible',
        'Grado 2 — visible con el cuello en posición normal',
      ]),
      t('examen_de_tiroides', 'Examen de tiroides — detalle'),
      varias('signos_cutaneos', 'Piel', [
        'Acantosis nigricans',
        'Estrías violáceas',
        'Hirsutismo',
        'Mixedema',
        'Ninguno',
      ]),
      t('piel_y_anexos', 'Piel y anexos — detalle'),
    ]),
    seccion(
      'Diagnóstico presuntivo y observaciones',
      sospecha({
        'Diabetes mellitus': DM2(),
        Hipotiroidismo: [
          d('tsh', 'TSH (mUI/L)', { req: true }),
          d('t4l', 'T4 libre (ng/dL)'),
        ],
        Hipertiroidismo: [
          d('tsh_hiper', 'TSH (mUI/L)', { req: true }),
          b('oftalmopatia', 'Oftalmopatía'),
        ],
        'Nódulo tiroideo': [
          s('nodulo_tirads', 'Ecografía — categoría TI-RADS', { req: true }),
          b('nodulo_puncion', 'Punción con aguja fina indicada'),
        ],
        'Obesidad y síndrome metabólico': [
          varias(
            'sm_criterios',
            'Criterios de síndrome metabólico',
            [
              'Perímetro abdominal aumentado',
              'Triglicéridos ≥ 150 mg/dL',
              'HDL bajo',
              'PA ≥ 130/85',
              'Glucemia en ayunas ≥ 100 mg/dL',
            ],
            { req: true },
          ),
        ],
        Dislipidemia: [
          d('ldl_endo', 'LDL (mg/dL)', { req: true }),
          d('trigliceridos', 'Triglicéridos (mg/dL)'),
        ],
      }),
    ),
    seccion(
      'Diagnóstico y plan',
      cierre({
        plan: 'plan_de_tratamiento',
        planNombre: 'Plan de tratamiento',
      }),
    ),
  ],

  NEFRO_EVALUACION_BASE: () => [
    seccion('Motivo de consulta', motivo({ tiempo: 'tiempo_de_enfermedad' })),
    seccion('Síntomas', [
      b('tiene_edemas', 'Edemas'),
      ...si('tiene_edemas', true, [
        una(
          'edema_localizacion',
          'Localización',
          ['Palpebral', 'Miembros inferiores', 'Generalizado (anasarca)'],
          { req: true },
        ),
        t('edemas', 'Edemas — detalle'),
      ]),
      una('volumen_de_diuresis', 'Diuresis', [
        'Normal',
        'Disminuida (oliguria)',
        'Aumentada (poliuria)',
        'Anuria',
      ]),
      t('diuresis', 'Diuresis — detalle'),
      b('nicturia', 'Nicturia'),
      b('hematuria', 'Hematuria'),
      b('espuma_en_la_orina', 'Espuma en la orina'),
      t('dolor_lumbar', 'Dolor lumbar'),
    ]),
    seccion('Antecedentes', [
      t('antecedente_de_litiasis', 'Antecedente de litiasis'),
      t(
        'antecedentes_de_hipertension_o_diabetes',
        'Hipertensión o diabetes — detalle',
      ),
      varias(
        'nefrotoxicos',
        'Nefrotóxicos',
        [
          'AINE',
          'Contraste yodado reciente',
          'Aminoglucósidos',
          'Medicina tradicional o hierbas',
          'Ninguno',
        ],
        { otro: true },
      ),
      t('medicacion_nefrotoxica', 'Medicación nefrotóxica — detalle'),
    ]),
    seccion('Examen físico', [
      vitales(
        {
          fr: null,
          temp: null,
          sat: null,
          peso: 'peso',
          talla: null,
          fc: null,
        },
        ['pas', 'pad'],
      ),
      t('examen_fisico', 'Examen físico'),
    ]),
    seccion(
      'Diagnóstico presuntivo y observaciones',
      sospecha({
        'Enfermedad renal crónica': [
          d('creatinina', 'Creatinina (mg/dL)', { req: true }),
          d('tfg', 'Filtrado glomerular estimado (mL/min/1,73 m²)', {
            req: true,
          }),
          una('erc_estadio_kdigo', 'Estadio KDIGO', [
            'G1 (≥ 90)',
            'G2 (60–89)',
            'G3a (45–59)',
            'G3b (30–44)',
            'G4 (15–29)',
            'G5 (< 15)',
          ]),
          una('albuminuria', 'Albuminuria', [
            'A1 (< 30 mg/g)',
            'A2 (30–300 mg/g)',
            'A3 (> 300 mg/g)',
            'No medida',
          ]),
        ],
        'Lesión renal aguda': [
          una(
            'lra_causa',
            'Causa probable',
            ['Prerrenal', 'Renal intrínseca', 'Posrenal (obstructiva)'],
            { req: true },
          ),
          d('lra_creatinina_basal', 'Creatinina basal (mg/dL)'),
        ],
        'Síndrome nefrótico': [
          d('proteinuria_24h', 'Proteinuria de 24 h (g)', { req: true }),
          d('albumina_serica', 'Albúmina sérica (g/dL)'),
        ],
        'Síndrome nefrítico': [
          b('nefritico_hta', 'Hipertensión', { req: true }),
          b(
            'nefritico_infeccion_previa',
            'Infección faríngea o cutánea reciente',
          ),
        ],
        'Litiasis renal': [
          b('litiasis_colico', 'Cólico renal', { req: true }),
          s('litiasis_imagen', 'Imagen — tamaño y ubicación del lito'),
        ],
        'Infección urinaria': ITU(),
      }),
    ),
    seccion('Diagnóstico y plan', [
      t('funcion_renal_previa', 'Función renal previa'),
      cierre(),
    ]),
  ],

  NEURO_EVALUACION_BASE: () => [
    seccion('Motivo de consulta', motivo({ relato: 'enfermedad_actual' })),
    seccion('Síntomas', [
      t('antecedentes_neurologicos', 'Antecedentes neurológicos'),
      b('cefalea', 'Cefalea'),
      ...si('cefalea', true, [
        t(
          'caracteristicas_cefalea',
          'Cefalea — localización, carácter, frecuencia',
          { req: true },
        ),
      ]),
      b('convulsiones', 'Convulsiones'),
      ...si('convulsiones', true, [
        t('descripcion_convulsiones', 'Descripción de las crisis (testigos)', {
          req: true,
        }),
      ]),
      b('mareo_o_vertigo', 'Mareo o vértigo'),
      ...si('mareo_o_vertigo', true, [
        una(
          'vertigo_tipo',
          'Tipo',
          ['Vértigo rotatorio', 'Inestabilidad', 'Presíncope'],
          { req: true },
        ),
      ]),
      medicacion(),
    ]),
    seccion('Examen neurológico', [
      i('glasgow', 'Escala de Glasgow (3–15)'),
      obl_(t('estado_de_conciencia', 'Estado de conciencia y orientación')),
      t('lenguaje', 'Lenguaje'),
      t('pares_craneales', 'Pares craneales'),
      una('fuerza_mrc', 'Fuerza (escala MRC, peor segmento)', [
        '5 — normal',
        '4 — vence algo de resistencia',
        '3 — vence la gravedad',
        '2 — sin gravedad',
        '1 — contracción sin movimiento',
        '0 — sin contracción',
      ]),
      t('fuerza_muscular', 'Fuerza muscular — detalle por segmento'),
      t('sensibilidad', 'Sensibilidad'),
      t('reflejos_osteotendinosos', 'Reflejos osteotendinosos'),
      t('coordinacion_y_marcha', 'Coordinación y marcha'),
      b('signos_meningeos', 'Signos meníngeos'),
      ...si('signos_meningeos', true, [
        varias(
          'signos_meningeos_cuales',
          '¿Cuáles?',
          ['Rigidez de nuca', 'Kernig', 'Brudzinski'],
          { req: true },
        ),
      ]),
    ]),
    seccion(
      'Diagnóstico presuntivo y observaciones',
      sospecha({
        'Accidente cerebrovascular': ACV(),
        'Cefalea primaria': CEFALEA(),
        'Epilepsia o crisis convulsiva': CONVULSION(),
        'Deterioro cognitivo': [
          s('cognitivo_prueba', 'Prueba cognitiva aplicada y puntaje', {
            req: true,
          }),
          una('cognitivo_funcional', 'Repercusión funcional', [
            'Ninguna',
            'En actividades instrumentales',
            'En actividades básicas',
          ]),
        ],
        'Enfermedad de Parkinson': [
          varias(
            'parkinson_signos',
            'Signos',
            [
              'Bradicinesia',
              'Temblor de reposo',
              'Rigidez',
              'Inestabilidad postural',
            ],
            { req: true },
          ),
        ],
        'Neuropatía periférica': [
          una(
            'neuropatia_patron',
            'Patrón',
            ['En guante y calcetín', 'Mononeuropatía', 'Multineuritis'],
            { req: true },
          ),
          b('neuropatia_diabetes', 'Diabetes asociada'),
        ],
        Vértigo: [
          una(
            'dix_hallpike',
            'Maniobra de Dix-Hallpike',
            ['Positiva', 'Negativa', 'No realizada'],
            { req: true },
          ),
          b(
            'vertigo_signos_centrales',
            'Signos centrales (diplopía, disartria, ataxia)',
          ),
        ],
      }),
    ),
    seccion('Diagnóstico y plan', cierre()),
  ],

  REUMA_EVALUACION_BASE: () => [
    seccion('Motivo de consulta', motivo({ tiempo: 'tiempo_de_enfermedad' })),
    seccion('Síntomas articulares', [
      t('dolor_articular', 'Dolor articular'),
      una('ritmo_del_dolor', 'Ritmo del dolor', [
        'Inflamatorio (empeora en reposo, rigidez matinal)',
        'Mecánico (empeora con el uso)',
        'Mixto',
      ]),
      i('rigidez_matinal_minutos', 'Rigidez matinal (minutos)'),
      obl_(t('articulaciones_comprometidas', 'Articulaciones comprometidas')),
      una('patron_de_compromiso', 'Patrón de compromiso', [
        'Monoarticular',
        'Oligoarticular (2–4)',
        'Poliarticular (5 o más)',
        'Axial',
      ]),
      i('articulaciones_tumefactas', 'Número de articulaciones tumefactas'),
      i('articulaciones_dolorosas', 'Número de articulaciones dolorosas'),
      t('tumefaccion_articular', 'Tumefacción articular — detalle'),
      t('limitacion_funcional', 'Limitación funcional'),
    ]),
    seccion('Compromiso extraarticular', [
      varias('extraarticular', 'Manifestaciones', [
        'Fotosensibilidad',
        'Eritema malar',
        'Úlceras orales',
        'Raynaud',
        'Ojo seco o boca seca',
        'Psoriasis',
        'Uveítis',
        'Ninguna',
      ]),
      t('compromiso_cutaneo', 'Compromiso cutáneo — detalle'),
      t('sintomas_sistemicos', 'Síntomas sistémicos'),
      t(
        'antecedentes_familiares_reumatologicos',
        'Antecedentes familiares reumatológicos',
      ),
      t('tratamientos_previos', 'Tratamientos previos'),
    ]),
    seccion('Examen', [
      obl_(t('examen_osteoarticular', 'Examen osteoarticular')),
      t('examenes_previos', 'Exámenes previos (FR, anti-CCP, ANA, VSG, PCR)'),
    ]),
    seccion(
      'Diagnóstico presuntivo y observaciones',
      sospecha({
        'Artritis reumatoide': [
          b('ar_fr_ccp', 'Factor reumatoide o anti-CCP positivo', {
            req: true,
          }),
          b('ar_erosiones', 'Erosiones en radiografía'),
          d('ar_das28', 'DAS28'),
        ],
        Artrosis: [
          varias(
            'artrosis_sitio',
            'Articulaciones',
            ['Rodilla', 'Cadera', 'Manos', 'Columna'],
            { req: true },
          ),
          b('artrosis_crepitacion', 'Crepitación'),
        ],
        Gota: [
          d('acido_urico', 'Ácido úrico (mg/dL)', { req: true }),
          b('gota_tofos', 'Tofos'),
          b('gota_podagra', 'Compromiso de la primera metatarsofalángica'),
        ],
        'Lupus eritematoso sistémico': [
          b('les_ana', 'ANA positivo', { req: true }),
          varias('les_organos', 'Órganos comprometidos', [
            'Piel',
            'Articulaciones',
            'Riñón',
            'Hematológico',
            'Serosas',
            'Neurológico',
          ]),
        ],
        Espondiloartritis: [
          b(
            'espondilo_dolor_inflamatorio',
            'Lumbalgia inflamatoria de más de 3 meses',
            { req: true },
          ),
          b('espondilo_hla_b27', 'HLA-B27 positivo'),
        ],
        Fibromialgia: [
          i('fibro_iid', 'Índice de dolor generalizado (0–19)', { req: true }),
          i('fibro_sss', 'Escala de gravedad de síntomas (0–12)'),
        ],
      }),
    ),
    seccion(
      'Diagnóstico y plan',
      cierre({
        plan: 'plan_de_tratamiento',
        planNombre: 'Plan de tratamiento',
      }),
    ),
  ],

  INFECTO_EVALUACION_BASE: () => [
    seccion('Motivo de consulta', motivo({ tiempo: 'tiempo_de_enfermedad' })),
    seccion('Fiebre y foco', [
      b('fiebre', 'Fiebre'),
      ...si('fiebre', true, [
        i('dias_de_fiebre', 'Días de fiebre', { req: true }),
        una('patron_febril_tipo', 'Patrón', [
          'Continua',
          'Intermitente',
          'Recurrente',
          'Vespertina',
        ]),
        t('patron_febril', 'Patrón febril — detalle'),
      ]),
      d('temperatura', 'Temperatura axilar (°C)'),
      t('sintomas_acompanantes', 'Síntomas acompañantes'),
      una('foco_probable', 'Foco clínico probable', [
        'Respiratorio',
        'Urinario',
        'Digestivo',
        'Piel y partes blandas',
        'Sistema nervioso',
        'Sin foco aparente',
      ]),
      t('foco_clinico_probable', 'Foco — detalle'),
    ]),
    seccion('Epidemiología', [
      b('viajo', 'Viajó en las últimas 4 semanas'),
      ...si('viajo', true, [
        t('viajes_recientes', '¿A dónde y cuándo?', { req: true }),
      ]),
      varias(
        'exposiciones_marcadas',
        'Exposiciones',
        [
          'Zona de dengue, zika o chikungunya',
          'Zona de malaria',
          'Zona de leishmaniasis',
          'Agua o barro (leptospirosis)',
          'Animales o roedores',
          'Relaciones sexuales sin protección',
          'Ninguna',
        ],
        { otro: true },
      ),
      t('exposiciones_de_riesgo', 'Exposiciones — detalle'),
      b('contacto_con_caso_similar', 'Contacto con un caso similar'),
      ...si('contacto_con_caso_similar', true, [
        s('contacto_quien', '¿Quién y con qué diagnóstico?', { req: true }),
      ]),
      t('estado_de_vacunacion', 'Estado de vacunación'),
      b('uso_antimicrobianos', 'Recibió antibióticos o antiparasitarios'),
      ...si('uso_antimicrobianos', true, [
        t('antimicrobianos_previos', '¿Cuál, dosis y días?', { req: true }),
      ]),
      varias('inmunosupresion', 'Inmunosupresión', [
        'VIH',
        'Diabetes',
        'Corticoides',
        'Quimioterapia',
        'Trasplante',
        'Ninguna',
      ]),
      t('condiciones_de_inmunosupresion', 'Inmunosupresión — detalle'),
    ]),
    seccion('Examen', [
      obl_(t('examen_fisico', 'Examen físico')),
      t('examenes_previos', 'Exámenes previos'),
    ]),
    seccion(
      'Diagnóstico presuntivo y observaciones',
      sospecha({
        Dengue: DENGUE(),
        'Chikungunya o zika': [
          b('chik_artralgia', 'Artralgias intensas', { req: true }),
          b('zika_embarazo', 'Embarazo en curso'),
          b('chik_exantema', 'Exantema'),
        ],
        Malaria: [
          una(
            'malaria_gota_gruesa',
            'Gota gruesa',
            [
              'Positiva — P. vivax',
              'Positiva — P. falciparum',
              'Negativa',
              'Pendiente',
            ],
            { req: true },
          ),
        ],
        Leishmaniasis: [
          una('leish_forma', 'Forma', ['Cutánea', 'Mucosa', 'Visceral'], {
            req: true,
          }),
          i('leish_lesiones', 'Número de lesiones'),
        ],
        Tuberculosis: TBC(),
        VIH: [
          s('vih_cd4', 'CD4 (células/µL)', { req: true }),
          s('vih_carga_viral', 'Carga viral'),
          b('vih_tar', 'En terapia antirretroviral'),
        ],
        'Infección de piel y partes blandas': [
          varias(
            'ppb_signos',
            'Signos',
            [
              'Eritema',
              'Calor',
              'Absceso fluctuante',
              'Crepitación',
              'Necrosis',
            ],
            { req: true },
          ),
          b('ppb_sistemico', 'Compromiso sistémico'),
        ],
        Sepsis: [
          varias(
            'qsofa',
            'qSOFA',
            [
              'Frecuencia respiratoria ≥ 22',
              'Alteración del estado mental',
              'PAS ≤ 100 mmHg',
            ],
            { req: true, ayuda: '2 o más: alto riesgo.' },
          ),
        ],
      }),
    ),
    seccion('Diagnóstico y plan', cierre()),
  ],

  HEMATO_EVALUACION_BASE: () => [
    seccion('Motivo de consulta', motivo({ tiempoReq: false })),
    seccion('Síntomas', [
      b('astenia', 'Astenia'),
      b('palidez', 'Palidez'),
      b('fiebre', 'Fiebre'),
      ...si('fiebre', true, [
        i('fiebre_dias_hemato', 'Días de fiebre', { req: true }),
      ]),
      b('tuvo_sangrados', 'Sangrados'),
      ...si('tuvo_sangrados', true, [
        varias(
          'sangrado_tipo',
          '¿Dónde?',
          [
            'Encías',
            'Epistaxis',
            'Equimosis fáciles',
            'Petequias',
            'Menstruación abundante',
            'Digestivo',
            'Urinario',
          ],
          { req: true },
        ),
        t('sangrados', 'Sangrados — detalle'),
      ]),
      b('transfusiones_previas', 'Transfusiones previas'),
      ...si('transfusiones_previas', true, [
        t(
          'detalle_de_transfusiones_previas',
          '¿Cuántas, cuándo y hubo reacción?',
          { req: true },
        ),
      ]),
      medicacion('medicacion_actual'),
      t(
        'antecedentes_familiares_hematologicos',
        'Antecedentes familiares hematológicos',
      ),
    ]),
    seccion('Examen físico', [
      b('adenopatias', 'Adenopatías'),
      ...si('adenopatias', true, [
        s('localizacion_de_las_adenopatias', '¿Dónde y de qué tamaño?', {
          req: true,
        }),
      ]),
      b('esplenomegalia', 'Esplenomegalia'),
      b('hepatomegalia', 'Hepatomegalia'),
      obl_(t('examen_fisico', 'Examen físico')),
      t(
        'estudios_de_laboratorio_recientes',
        'Laboratorio reciente (hemograma, frotis)',
      ),
    ]),
    seccion(
      'Diagnóstico presuntivo y observaciones',
      sospecha({
        'Anemia ferropénica': ANEMIA(),
        'Anemia megaloblástica': [
          d('vcm_mega', 'VCM (fL)', { req: true }),
          d('b12', 'Vitamina B12 (pg/mL)'),
          b('mega_neuro', 'Síntomas neurológicos'),
        ],
        Trombocitopenia: [
          i('plaquetas', 'Plaquetas (/µL)', { req: true }),
          b('trombo_sangrado_activo', 'Sangrado activo'),
        ],
        'Trastorno de la coagulación': [
          s('tp_inr', 'TP / INR', { req: true }),
          s('ttpa', 'TTPa'),
          b('anticoagulado', 'Recibe anticoagulantes'),
        ],
        'Sospecha de leucemia o linfoma': [
          varias(
            'sintomas_b',
            'Síntomas B',
            [
              'Fiebre',
              'Sudoración nocturna',
              'Pérdida de más del 10 % del peso',
            ],
            { req: true },
          ),
          b('blastos', 'Blastos en el frotis'),
        ],
        Policitemia: [
          d('hematocrito', 'Hematocrito (%)', {
            req: true,
            ayuda: 'Interpretar según la altitud de residencia.',
          }),
          s('residencia_altitud', 'Altitud de residencia (m s. n. m.)'),
        ],
      }),
    ),
    seccion('Diagnóstico y plan', cierre()),
  ],

  ONCO_EVALUACION_BASE: () => [
    seccion('Motivo de consulta', [
      obl_(t('motivo_consulta', 'Motivo de consulta')),
    ]),
    seccion('Enfermedad oncológica', [
      s('diagnostico_oncologico_conocido', 'Diagnóstico oncológico conocido'),
      f('fecha_del_diagnostico', 'Fecha del diagnóstico'),
      s('estadio_clinico', 'Estadio clínico (TNM)'),
      varias('tratamientos_recibidos', 'Tratamientos recibidos', [
        'Cirugía',
        'Quimioterapia',
        'Radioterapia',
        'Hormonoterapia',
        'Inmunoterapia',
        'Ninguno',
      ]),
      t('tratamientos_oncologicos_recibidos', 'Tratamientos — detalle'),
      f('fecha_del_ultimo_tratamiento', 'Fecha del último tratamiento'),
    ]),
    seccion('Estado actual', [
      una(
        'ecog',
        'Estado funcional ECOG',
        [
          '0 — totalmente activo',
          '1 — síntomas, ambulatorio, trabajo liviano',
          '2 — ambulatorio, autocuidado, no trabaja; en cama < 50 % del día',
          '3 — autocuidado limitado; en cama > 50 % del día',
          '4 — totalmente dependiente, postrado',
        ],
        { req: true },
      ),
      obl_(t('sintomas_actuales', 'Síntomas actuales')),
      b('dolor', 'Dolor'),
      ...socrates('dolor_onco', 'dolor', true),
      b('perdida_de_peso', 'Pérdida de peso'),
      ...si('perdida_de_peso', true, [
        d('perdida_peso_porcentaje', 'Porcentaje del peso perdido en 6 meses', {
          req: true,
        }),
      ]),
      d('peso_actual_kg', 'Peso actual (kg)'),
      t('medicacion_actual', 'Medicación actual'),
      t(
        'antecedentes_familiares_oncologicos',
        'Antecedentes familiares oncológicos',
      ),
    ]),
    seccion('Examen', [
      obl_(t('examen_fisico', 'Examen físico')),
      t('estudios_complementarios', 'Estudios complementarios'),
    ]),
    seccion(
      'Diagnóstico presuntivo y observaciones',
      sospecha({
        'Sospecha de neoplasia (estudio inicial)': [
          varias(
            'neo_alarma',
            'Signos de alarma',
            [
              'Masa palpable',
              'Adenopatía dura o fija',
              'Sangrado no explicado',
              'Pérdida de peso',
              'Síntomas B',
            ],
            { req: true },
          ),
          s('neo_biopsia', 'Biopsia — estado'),
        ],
        'Toxicidad del tratamiento': [
          varias(
            'toxicidad',
            'Toxicidad',
            [
              'Neutropenia febril',
              'Mucositis',
              'Náuseas y vómitos',
              'Diarrea',
              'Neuropatía',
              'Cardiotoxicidad',
            ],
            { req: true },
          ),
          una('ctcae_grado', 'Grado CTCAE', ['1', '2', '3', '4']),
        ],
        'Progresión de enfermedad': [
          s('progresion_sitio', 'Sitio de progresión', { req: true }),
        ],
        'Control de síntomas y cuidados paliativos': [
          varias(
            'paliativos_sintomas',
            'Síntomas a controlar',
            [
              'Dolor',
              'Disnea',
              'Náuseas',
              'Constipación',
              'Delirio',
              'Ansiedad',
            ],
            { req: true },
          ),
          b('voluntades', 'Conversación sobre voluntades anticipadas'),
        ],
        'Emergencia oncológica': [
          una(
            'emergencia_onco',
            'Tipo',
            [
              'Compresión medular',
              'Síndrome de vena cava superior',
              'Hipercalcemia',
              'Síndrome de lisis tumoral',
              'Neutropenia febril',
            ],
            { req: true },
          ),
        ],
      }),
    ),
    seccion('Diagnóstico y plan', cierre()),
  ],

  GERIA_VALORACION_BASE: () => [
    seccion('Motivo de consulta', motivo({ tiempo: 'tiempo_de_enfermedad' })),
    seccion('Antecedentes', [
      antecedentes('antecedentes_personales', 'Antecedentes personales'),
      alergias('alergias_detalle'),
    ]),
    seccion('Valoración funcional', [
      varias(
        'katz_dependiente',
        'Actividades básicas en las que necesita ayuda (Katz)',
        [
          'Bañarse',
          'Vestirse',
          'Usar el baño',
          'Movilizarse',
          'Continencia',
          'Alimentarse',
          'Ninguna',
        ],
      ),
      obl_(t('autonomia_actividades_basicas', 'Actividades básicas — detalle')),
      varias(
        'lawton_dependiente',
        'Actividades instrumentales en las que necesita ayuda (Lawton)',
        [
          'Usar el teléfono',
          'Hacer compras',
          'Preparar la comida',
          'Tareas de la casa',
          'Lavar la ropa',
          'Usar transporte',
          'Manejar su medicación',
          'Manejar su dinero',
          'Ninguna',
        ],
      ),
      t(
        'autonomia_actividades_instrumentales',
        'Actividades instrumentales — detalle',
      ),
      d('velocidad_de_marcha', 'Velocidad de marcha en 4 m (m/s)', {
        ayuda: 'Menos de 0,8 m/s: riesgo de fragilidad.',
      }),
      t('marcha_y_equilibrio', 'Marcha y equilibrio'),
      i('caidas_en_el_ultimo_ano', 'Caídas en el último año'),
    ]),
    seccion('Fármacos', [
      i('numero_de_farmacos_en_uso', 'Número de fármacos en uso'),
      t('farmacos_en_uso', 'Fármacos en uso'),
      b(
        'farmacos_inapropiados',
        'Algún fármaco potencialmente inapropiado (Beers/STOPP)',
      ),
      ...si('farmacos_inapropiados', true, [
        s('farmacos_inapropiados_cuales', '¿Cuál?', { req: true }),
      ]),
    ]),
    seccion('Valoración mental y social', [
      s('prueba_cognitiva', 'Prueba cognitiva aplicada y puntaje'),
      t('estado_cognitivo', 'Estado cognitivo — detalle'),
      b('animo_bajo', 'Ánimo bajo o pérdida de interés en el último mes'),
      ...si('animo_bajo', true, [
        t('estado_de_animo', 'Estado de ánimo — detalle', { req: true }),
      ]),
      varias('incontinencia', 'Incontinencia', [
        'Urinaria de esfuerzo',
        'Urinaria de urgencia',
        'Fecal',
        'Ninguna',
      ]),
      t('continencia', 'Continencia — detalle'),
      b('perdida_de_peso', 'Pérdida de peso no intencionada'),
      ...si('perdida_de_peso', true, [
        d('perdida_de_peso_kg_geria', '¿Cuántos kg en los últimos 6 meses?', {
          req: true,
        }),
      ]),
      t('alimentacion_y_peso', 'Alimentación y peso'),
      varias('deficit_sensorial', 'Déficit sensorial', [
        'Visual',
        'Auditivo',
        'Ninguno',
      ]),
      t('vision_y_audicion', 'Visión y audición — detalle'),
      una('vive', 'Con quién vive', [
        'Solo',
        'Con pareja',
        'Con hijos o familiares',
        'En un hogar o residencia',
      ]),
      t('soporte_social', 'Soporte social'),
    ]),
    seccion('Examen', [vitales(), obl_(t('examen_fisico', 'Examen físico'))]),
    seccion(
      'Diagnóstico presuntivo y observaciones',
      sospecha({
        'Síndrome de fragilidad': [
          varias(
            'fried',
            'Criterios de Fried',
            [
              'Pérdida de peso no intencionada',
              'Agotamiento',
              'Debilidad (prensión)',
              'Marcha lenta',
              'Baja actividad física',
            ],
            { req: true, ayuda: '3 o más: frágil · 1–2: prefrágil.' },
          ),
        ],
        Caídas: [
          varias(
            'caidas_riesgo',
            'Factores de riesgo',
            [
              'Alteración de la marcha',
              'Hipotensión ortostática',
              'Psicofármacos',
              'Déficit visual',
              'Riesgos en el hogar',
            ],
            { req: true },
          ),
          b('caidas_fractura', 'Fractura en alguna caída'),
        ],
        'Deterioro cognitivo o demencia': [
          s('demencia_prueba', 'Prueba y puntaje', { req: true }),
          b('demencia_conducta', 'Síntomas conductuales'),
        ],
        Delirium: [
          varias(
            'delirium_rasgos',
            'Rasgos de delirium',
            [
              'Inicio agudo y curso fluctuante',
              'Inatención',
              'Pensamiento desorganizado',
              'Alteración del nivel de conciencia',
            ],
            { req: true },
          ),
        ],
        Polifarmacia: [
          t('polifarmacia_revision', 'Fármacos a suspender o ajustar', {
            req: true,
          }),
        ],
        'Depresión del adulto mayor': DEPRESION_ANSIEDAD(),
      }),
    ),
    seccion(
      'Diagnóstico y plan',
      cierre({
        plan: 'plan_de_tratamiento',
        planNombre: 'Plan de tratamiento',
      }),
    ),
  ],

  DERMA_EXAMEN_BASE: () => [
    seccion('Motivo de consulta', motivo()),
    seccion('Síntomas', [
      b('prurito', 'Prurito'),
      ...si('prurito', true, [
        i('prurito_intensidad', 'Intensidad del prurito (0 a 10)'),
        b('prurito_nocturno', 'Empeora de noche'),
      ]),
      b('dolor_local', 'Dolor local'),
    ]),
    seccion('Lesión', [
      obl_(
        una('lesion_elemental', 'Lesión elemental', [
          'Mácula',
          'Pápula',
          'Placa',
          'Nódulo',
          'Vesícula',
          'Ampolla',
          'Pústula',
          'Habón',
          'Escama',
          'Costra',
          'Úlcera',
          'Cicatriz',
        ]),
      ),
      obl_(
        t(
          'descripcion_de_la_lesion',
          'Descripción (color, bordes, superficie)',
        ),
      ),
      obl_(t('localizacion', 'Localización')),
      una('distribucion', 'Distribución', [
        'Localizada',
        'Generalizada',
        'Simétrica',
        'Dermatómica',
        'Fotoexpuesta',
        'Flexural',
      ]),
      i('numero_de_lesiones', 'Número de lesiones'),
      d('tamano_mayor_mm', 'Tamaño de la mayor (mm)'),
      una('fototipo', 'Fototipo de Fitzpatrick', [
        'I',
        'II',
        'III',
        'IV',
        'V',
        'VI',
      ]),
      b('compromiso_de_mucosas', 'Compromiso de mucosas'),
      ...si('compromiso_de_mucosas', true, [
        varias(
          'mucosas_cuales',
          '¿Cuáles?',
          ['Oral', 'Genital', 'Conjuntival', 'Nasal'],
          { req: true },
        ),
      ]),
      b('compromiso_de_faneras', 'Compromiso de pelo o uñas'),
      ...si('compromiso_de_faneras', true, [
        varias('faneras_cuales', '¿Qué?', ['Caída de pelo', 'Uñas'], {
          req: true,
        }),
      ]),
      t('factores_desencadenantes', 'Factores desencadenantes'),
      t('tratamientos_previos', 'Tratamientos previos'),
    ]),
    seccion(
      'Diagnóstico presuntivo y observaciones',
      sospecha({
        'Lesión pigmentada (descartar melanoma)': [
          varias(
            'abcde',
            'Criterios ABCDE',
            [
              'Asimetría',
              'Bordes irregulares',
              'Color heterogéneo',
              'Diámetro > 6 mm',
              'Evolución (cambió)',
            ],
            { req: true },
          ),
          b('dermatoscopia', 'Dermatoscopía realizada'),
        ],
        'Dermatitis (atópica o de contacto)': [
          b('atopia', 'Antecedente de atopia', { req: true }),
          s('dermatitis_contactante', 'Posible contactante'),
        ],
        Psoriasis: [
          d('pasi', 'PASI', { req: true }),
          d('superficie_corporal', 'Superficie corporal afectada (%)'),
          b('psoriasis_artritis', 'Dolor articular'),
        ],
        Acné: [
          una(
            'acne_grado',
            'Grado',
            [
              'Comedoniano',
              'Papulopustuloso leve',
              'Papulopustuloso moderado',
              'Noduloquístico',
            ],
            { req: true },
          ),
        ],
        'Micosis superficial': [
          una(
            'micosis_tipo',
            'Tipo',
            [
              'Tiña corporal',
              'Tiña pedis',
              'Onicomicosis',
              'Pitiriasis versicolor',
              'Candidiasis',
            ],
            { req: true },
          ),
          b('koh', 'KOH o cultivo realizado'),
        ],
        'Leishmaniasis cutánea': [
          i('leish_cutanea_lesiones', 'Número de úlceras', { req: true }),
          b('leish_mucosa', 'Compromiso nasal o bucal'),
          s('leish_procedencia', 'Zona donde se expuso'),
        ],
        'Carcinoma de piel no melanoma': [
          una(
            'cpnm_tipo',
            'Sospecha',
            ['Basocelular', 'Espinocelular', 'Queratosis actínica'],
            { req: true },
          ),
          b('cpnm_biopsia', 'Biopsia indicada'),
        ],
      }),
    ),
    seccion('Diagnóstico y plan', [
      t('estudios_solicitados', 'Estudios solicitados'),
      cierre(),
    ]),
  ],
};

function obl_(c) {
  return { ...c, required: true };
}
