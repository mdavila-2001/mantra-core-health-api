/**
 * Fichas v2 de especialidades quirúrgicas, de urgencia, cuidados intensivos y
 * salud mental. Mismas reglas que `fichas-clinicas.mjs`.
 */
import {
  alergias,
  antecedentes,
  b,
  cierre,
  d,
  f,
  habitos,
  i,
  medicacion,
  motivo,
  obl,
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
  CONVULSION,
  DENGUE,
  DOLOR_TORACICO,
  NEUMONIA,
  SRQ20,
} from './sindromes.mjs';

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

export const PROCEDIMIENTO = {
  CIRGEN_EVALUACION_BASE: () => [
    seccion('Motivo de consulta', motivo()),
    seccion('Síntomas', [
      b('dolor_abdominal', 'Dolor abdominal'),
      ...socrates('dolor_abdominal', 'dolor_abdominal', true),
      t('caracteristicas_del_dolor', 'Dolor — otras observaciones'),
      b('nauseas_o_vomitos', 'Náuseas o vómitos'),
      una('transito_intestinal', 'Tránsito intestinal', [
        'Conservado',
        'Constipación',
        'Diarrea',
        'Sin gases ni heces (obstrucción)',
      ]),
      b('fiebre', 'Fiebre'),
      ...si('fiebre', true, [
        d('temperatura_maxima', 'Temperatura máxima (°C)', { req: true }),
      ]),
    ]),
    seccion('Antecedentes', [
      quirurgicos('cirugias_previas'),
      antecedentes(),
      alergias(),
      medicacion(),
    ]),
    seccion('Examen', [
      vitales(),
      obl(t('examen_del_abdomen', 'Examen del abdomen')),
      varias(
        'signos_peritoneales',
        'Signos peritoneales',
        [
          'Defensa',
          'Rebote (Blumberg)',
          'Rovsing',
          'Psoas',
          'Murphy',
          'Ninguno',
        ],
        { req: true },
      ),
      b('hay_hernia', 'Hernia'),
      ...si('hay_hernia', true, [
        una(
          'hernia_tipo',
          'Tipo',
          ['Inguinal', 'Crural', 'Umbilical', 'Epigástrica', 'Incisional'],
          { req: true },
        ),
        una(
          'hernia_estado',
          'Estado',
          ['Reductible', 'Incarcerada', 'Estrangulada'],
          { req: true },
        ),
        t('hernias', 'Hernia — detalle'),
      ]),
      t('examenes_complementarios', 'Exámenes complementarios'),
    ]),
    seccion(
      'Diagnóstico presuntivo y observaciones',
      sospecha({
        'Apendicitis aguda': [
          varias(
            'alvarado',
            'Escala de Alvarado',
            [
              'Migración del dolor a fosa ilíaca derecha',
              'Anorexia',
              'Náuseas o vómitos',
              'Dolor en fosa ilíaca derecha (2)',
              'Rebote',
              'Fiebre > 37,3 °C',
              'Leucocitosis > 10 000 (2)',
              'Desviación a la izquierda',
            ],
            { req: true, ayuda: '7 o más puntos: probable apendicitis.' },
          ),
        ],
        'Colecistitis o colelitiasis': [
          b('murphy_cirugia', 'Signo de Murphy', { req: true }),
          s('eco_vesicula', 'Ecografía — hallazgo'),
        ],
        'Hernia de pared abdominal': [
          b('hernia_dolor_cronico', 'Dolor crónico en la hernia', {
            req: true,
          }),
        ],
        'Obstrucción intestinal': [
          varias(
            'obstruccion_signos',
            'Signos',
            [
              'Distensión',
              'Vómitos fecaloides',
              'Ruidos aumentados metálicos',
              'Silencio abdominal',
              'Cicatriz previa',
            ],
            { req: true },
          ),
        ],
        'Abdomen agudo inespecífico': [
          s('abdomen_agudo_imagen', 'Imagen solicitada', { req: true }),
        ],
        'Patología anorrectal': [
          una(
            'anorrectal_tipo',
            'Sospecha',
            ['Hemorroides', 'Fisura', 'Absceso', 'Fístula'],
            { req: true },
          ),
        ],
      }),
    ),
    seccion('Plan quirúrgico', [
      una('riesgo_asa', 'Riesgo anestésico ASA', [
        'ASA I',
        'ASA II',
        'ASA III',
        'ASA IV',
        'ASA V',
      ]),
      t('riesgo_quirurgico', 'Riesgo quirúrgico — detalle'),
      t('indicacion_quirurgica_propuesta', 'Indicación quirúrgica propuesta'),
      cierre(),
    ]),
  ],

  URO_EVALUACION_BASE: () => [
    seccion('Motivo de consulta', motivo()),
    seccion('Síntomas', [
      varias('stui', 'Síntomas del tracto urinario inferior', [
        'Chorro débil',
        'Esfuerzo miccional',
        'Goteo terminal',
        'Vaciado incompleto',
        'Polaquiuria',
        'Urgencia',
        'Incontinencia',
        'Ninguno',
      ]),
      t(
        'sintomas_del_tracto_urinario_inferior',
        'Síntomas urinarios — detalle',
      ),
      b('disuria', 'Disuria'),
      b('hematuria', 'Hematuria'),
      ...si('hematuria', true, [
        una('hematuria_tipo', 'Tipo', ['Macroscópica', 'Microscópica'], {
          req: true,
        }),
        b('hematuria_coagulos', 'Con coágulos'),
      ]),
      i('nicturia', 'Nicturia (veces por noche)'),
      b('urgencia_miccional', 'Urgencia miccional'),
      una('caracteristicas_del_chorro_miccional', 'Chorro miccional', [
        'Normal',
        'Débil',
        'Entrecortado',
        'Bífido',
      ]),
      b('dolor_lumbar', 'Dolor lumbar'),
      ...socrates('dolor_lumbar', 'dolor_lumbar', true, { sitio: false }),
    ]),
    seccion('Antecedentes', [
      t('antecedentes_de_litiasis', 'Antecedente de litiasis'),
      t('infecciones_urinarias_previas', 'Infecciones urinarias previas'),
      t('cirugias_urologicas_previas', 'Cirugías urológicas previas'),
      medicacion(),
    ]),
    seccion('Examen', [
      t('examen_genital', 'Examen genital'),
      t('tacto_rectal', 'Tacto rectal'),
      t('examenes_complementarios', 'Exámenes complementarios'),
    ]),
    seccion(
      'Diagnóstico presuntivo y observaciones',
      sospecha({
        'Hiperplasia prostática benigna': [
          s('volumen_prostatico', 'Volumen prostático estimado (mL)', {
            req: true,
          }),
          d('residuo_posmiccional', 'Residuo posmiccional (mL)'),
          b('retencion_previa', 'Retención urinaria previa'),
        ],
        'Sospecha de cáncer de próstata': [
          d('psa', 'PSA total (ng/mL)', { req: true }),
          una(
            'tacto_prostata',
            'Tacto rectal',
            ['Normal', 'Nódulo', 'Indurada', 'No realizado'],
            { req: true },
          ),
        ],
        'Litiasis urinaria': [
          s('lito_tamano', 'Tamaño y ubicación del lito', { req: true }),
          b('lito_obstruccion', 'Hidronefrosis'),
          b('lito_fiebre', 'Fiebre (urgencia)'),
        ],
        'Infección urinaria': [
          varias(
            'itu_uro',
            'Síntomas',
            [
              'Disuria',
              'Polaquiuria',
              'Fiebre',
              'Dolor perineal (prostatitis)',
            ],
            { req: true },
          ),
          s('urocultivo', 'Urocultivo'),
        ],
        'Hematuria en estudio': [
          b('hematuria_tabaco', 'Fumador o exfumador', { req: true }),
          s('hematuria_imagen', 'Imagen y cistoscopía'),
        ],
        'Disfunción eréctil': [
          una('de_inicio', 'Inicio', ['Gradual', 'Brusco'], { req: true }),
          b('de_erecciones_matinales', 'Conserva erecciones matinales'),
          varias('de_factores', 'Factores asociados', [
            'Diabetes',
            'Hipertensión',
            'Tabaquismo',
            'Fármacos',
            'Ansiedad o depresión',
            'Ninguno',
          ]),
        ],
      }),
    ),
    seccion('Diagnóstico y plan', cierre()),
  ],

  ORL_EVALUACION_BASE: () => [
    seccion('Motivo de consulta', motivo()),
    seccion('Oído', [
      b('hipoacusia', 'Hipoacusia'),
      ...si('hipoacusia', true, [
        una(
          'lado_afectado',
          'Lado afectado',
          ['Derecho', 'Izquierdo', 'Bilateral'],
          { req: true },
        ),
        una('hipoacusia_inicio', 'Inicio', ['Súbito', 'Progresivo']),
      ]),
      b('otalgia', 'Otalgia'),
      ...si('otalgia', true, [
        una('otalgia_lado', 'Lado', ['Derecho', 'Izquierdo', 'Bilateral'], {
          req: true,
        }),
      ]),
      b('otorrea', 'Otorrea'),
      ...si('otorrea', true, [
        una('otorrea_aspecto', 'Aspecto', ['Serosa', 'Purulenta', 'Hemática'], {
          req: true,
        }),
      ]),
      b('acufenos', 'Acúfenos'),
      ...si('acufenos', true, [
        una('acufenos_lado', 'Lado', ['Derecho', 'Izquierdo', 'Bilateral'], {
          req: true,
        }),
        una('acufenos_tipo', 'Tipo', ['Continuo', 'Pulsátil']),
      ]),
      b('vertigo', 'Vértigo'),
    ]),
    seccion('Nariz y garganta', [
      b('obstruccion_nasal', 'Obstrucción nasal'),
      b('epistaxis', 'Epistaxis'),
      ...si('epistaxis', true, [
        una(
          'epistaxis_frecuencia',
          'Frecuencia',
          ['Episodio único', 'Recurrente'],
          { req: true },
        ),
      ]),
      b('odinofagia', 'Odinofagia'),
      b('disfonia', 'Disfonía'),
      ...si('disfonia', true, [
        i('disfonia_semanas', 'Semanas de evolución', {
          req: true,
          ayuda: 'Más de 3 semanas en fumador: laringoscopía.',
        }),
      ]),
      t(
        'antecedentes_otorrinolaringologicos',
        'Antecedentes otorrinolaringológicos',
      ),
      alergias(),
    ]),
    seccion('Examen', [
      obl(t('otoscopia', 'Otoscopía')),
      t('rinoscopia_anterior', 'Rinoscopía anterior'),
      t('examen_de_cuello', 'Examen de cuello'),
    ]),
    seccion(
      'Diagnóstico presuntivo y observaciones',
      sospecha({
        'Otitis media aguda': [
          b('oma_abombamiento', 'Membrana timpánica abombada', { req: true }),
          b('oma_fiebre', 'Fiebre'),
        ],
        'Otitis externa': [
          b('oe_dolor_trago', 'Dolor a la presión del trago', { req: true }),
          b('oe_diabetes', 'Diabetes (riesgo de otitis maligna)'),
        ],
        Faringoamigdalitis: [
          b('centor_fiebre_orl', 'Fiebre > 38 °C', { req: true }),
          b('centor_exudado_orl', 'Exudado amigdalino'),
          b('centor_adenopatias_orl', 'Adenopatías cervicales dolorosas'),
          b('centor_sin_tos_orl', 'Ausencia de tos'),
        ],
        Rinosinusitis: [
          i('rinosinusitis_dias', 'Días de evolución', {
            req: true,
            ayuda:
              'Más de 10 días o empeoramiento tras mejoría: bacteriana probable.',
          }),
          varias('rinosinusitis_sintomas', 'Síntomas', [
            'Rinorrea purulenta',
            'Dolor facial',
            'Hiposmia',
            'Fiebre',
          ]),
        ],
        'Rinitis alérgica': [
          una(
            'rinitis_aria',
            'Clasificación ARIA',
            [
              'Intermitente leve',
              'Intermitente moderada-grave',
              'Persistente leve',
              'Persistente moderada-grave',
            ],
            { req: true },
          ),
        ],
        'Hipoacusia súbita': [s('audiometria', 'Audiometría', { req: true })],
        'Vértigo periférico': [
          una(
            'dix_hallpike_orl',
            'Dix-Hallpike',
            ['Positiva', 'Negativa', 'No realizada'],
            { req: true },
          ),
        ],
      }),
    ),
    seccion('Diagnóstico y plan', cierre()),
  ],

  ANEST_VALORACION_PREANESTESICA: () => [
    seccion('Procedimiento', [
      obl(t('motivo_consulta', 'Motivo de la valoración')),
      obl(s('procedimiento_previsto', 'Procedimiento previsto')),
      una('tipo_de_cirugia', 'Tipo de cirugía', ['Programada', 'Urgencia']),
    ]),
    seccion('Antecedentes', [
      obl(t('antecedentes_patologicos', 'Antecedentes patológicos')),
      varias(
        'antecedentes_cronicos',
        'Comorbilidades',
        [
          'Hipertensión arterial',
          'Diabetes',
          'Cardiopatía',
          'Asma o EPOC',
          'Apnea del sueño',
          'Enfermedad renal',
          'Hepatopatía',
          'Ninguna',
        ],
        { otro: true },
      ),
      b('tiene_alergias', '¿Tiene alergias conocidas?'),
      ...si('tiene_alergias', true, [
        varias(
          'tipo_de_alergia',
          '¿A qué?',
          ['Medicamentos', 'Látex', 'Alimentos', 'Antisépticos'],
          { otro: true, req: true },
        ),
      ]),
      obl(t('alergias', 'Alergias — detalle y reacción')),
      medicacion(),
      varias(
        'farmacos_a_suspender',
        'Fármacos que requieren manejo perioperatorio',
        [
          'Anticoagulantes',
          'Antiagregantes',
          'Hipoglucemiantes o insulina',
          'IECA o ARA II',
          'Corticoides',
          'Ninguno',
        ],
      ),
      t('habitos_toxicos', 'Hábitos tóxicos'),
      b('anestesias_previas', 'Anestesias previas'),
      ...si('anestesias_previas', true, [
        t('experiencias_anestesicas_previas', '¿Cuáles y cuándo?', {
          req: true,
        }),
        b('hubo_complicaciones', '¿Hubo complicaciones?'),
      ]),
      ...si('hubo_complicaciones', true, [
        t(
          'complicaciones_anestesicas_previas',
          '¿Cuáles? (vía aérea difícil, náuseas, hipertermia maligna, despertar prolongado)',
          { req: true },
        ),
      ]),
      b(
        'hipertermia_maligna_familiar',
        'Familiar con hipertermia maligna o complicación anestésica grave',
      ),
      ...si('hipertermia_maligna_familiar', true, [
        s('hipertermia_quien', '¿Quién y qué pasó?', { req: true }),
      ]),
      i('ayuno_en_horas', 'Ayuno (horas)', {
        ayuda: 'Sólidos 6–8 h; líquidos claros 2 h.',
      }),
      varias('apnea_sintomas', 'Sospecha de apnea del sueño', [
        'Ronquido fuerte',
        'Somnolencia diurna',
        'Apneas observadas por otra persona',
        'Obesidad',
        'Cuello ancho',
        'Ninguno',
      ]),
    ]),
    seccion('Vía aérea', [
      una(
        'via_aerea_mallampati',
        'Mallampati',
        [
          'Clase I — paladar blando, fauces, úvula y pilares visibles',
          'Clase II — paladar blando, fauces y úvula',
          'Clase III — paladar blando y base de la úvula',
          'Clase IV — sólo paladar duro',
        ],
        { req: true },
      ),
      una('apertura_bucal', 'Apertura bucal (distancia interincisiva)', [
        'Mayor a 3 cm',
        'Entre 2 y 3 cm',
        'Menor a 2 cm',
      ]),
      una('distancia_tiromentoniana', 'Distancia tiromentoniana (Patil)', [
        'Mayor a 6,5 cm',
        'Entre 6 y 6,5 cm',
        'Menor a 6 cm',
      ]),
      una('movilidad_cervical', 'Movilidad cervical', [
        'Normal',
        'Limitada',
        'Muy limitada',
      ]),
      b('protesis_dental', 'Prótesis o piezas dentarias flojas'),
      ...si('protesis_dental', true, [
        t('piezas_dentarias_en_riesgo', '¿Cuáles?', { req: true }),
      ]),
    ]),
    seccion('Evaluación', [
      vitales({ temp: null }),
      t('examen_cardiorrespiratorio', 'Examen cardiorrespiratorio'),
      una('capacidad_funcional', 'Capacidad funcional', [
        '4 METs o más (sube 2 pisos sin parar)',
        'Menos de 4 METs',
        'No evaluable',
      ]),
      t('laboratorio_relevante', 'Laboratorio y ECG relevantes'),
      una(
        'clasificacion_asa',
        'Clasificación ASA',
        [
          'ASA I — sano',
          'ASA II — enfermedad sistémica leve',
          'ASA III — enfermedad sistémica grave',
          'ASA IV — enfermedad sistémica grave, amenaza constante para la vida',
          'ASA V — moribundo, no sobrevive sin la operación',
          'ASA VI — muerte encefálica, donante de órganos',
        ],
        { req: true },
      ),
      b('asa_urgencia', 'Modificador E (urgencia)'),
    ]),
    seccion('Conclusión', [
      obl(t('diagnostico', 'Diagnóstico')),
      una('tecnica_propuesta', 'Técnica anestésica propuesta', [
        'General',
        'Regional neuroaxial',
        'Bloqueo periférico',
        'Sedación',
        'Local con monitoreo',
      ]),
      t('plan_de_tratamiento', 'Plan anestésico propuesto'),
    ]),
  ],

  TRAUMA_EVALUACION_BASE: () => [
    seccion('Lesión', [
      obl(t('mecanismo_de_lesion', 'Mecanismo de la lesión')),
      una('mecanismo_tipo', 'Tipo de mecanismo', [
        'Caída de propia altura',
        'Caída de altura',
        'Accidente de tránsito',
        'Deportivo',
        'Sobreuso',
        'Sin traumatismo',
      ]),
      f('fecha_de_la_lesion', 'Fecha de la lesión'),
      obl(s('segmento_afectado', 'Segmento afectado')),
      una('lateralidad', 'Lateralidad', [
        'Derecho',
        'Izquierdo',
        'Bilateral',
        'No aplica',
      ]),
    ]),
    seccion('Dolor y función', [
      b('dolor_en_reposo', 'Dolor en reposo'),
      i('intensidad_del_dolor', 'Intensidad del dolor (0 a 10)'),
      b('impotencia_funcional', 'Impotencia funcional'),
      b('deformidad', 'Deformidad'),
      ...si('deformidad', true, [
        s(
          'deformidad_descripcion',
          '¿Cuál? (angulación, acortamiento, rotación)',
          { req: true },
        ),
      ]),
      b('edema_local', 'Edema local'),
      b('equimosis', 'Equimosis'),
      b('herida', 'Herida abierta'),
      ...si('herida', true, [
        una(
          'gustilo',
          'Fractura expuesta (Gustilo)',
          ['No hay fractura', 'Tipo I', 'Tipo II', 'Tipo III'],
          { req: true },
        ),
        b('antitetanica', 'Vacuna antitetánica al día'),
      ]),
    ]),
    seccion('Examen', [
      t('rango_de_movilidad', 'Rango de movilidad'),
      i('fuerza_muscular', 'Fuerza muscular (MRC 0 a 5)'),
      t('estabilidad_articular', 'Estabilidad articular'),
      una(
        'neurovascular',
        'Estado neurovascular distal',
        ['Conservado', 'Alterado'],
        { req: true },
      ),
      ...si('neurovascular', 'Alterado', [
        varias(
          'neurovascular_alteracion',
          '¿Qué está alterado?',
          [
            'Pulso',
            'Relleno capilar',
            'Sensibilidad',
            'Movilidad',
            'Dolor desproporcionado (síndrome compartimental)',
          ],
          { req: true },
        ),
      ]),
      obl(t('estado_neurovascular_distal', 'Estado neurovascular — detalle')),
      t('imagenes_solicitadas', 'Imágenes solicitadas'),
      t('hallazgos_imagenologicos', 'Hallazgos imagenológicos'),
    ]),
    seccion(
      'Diagnóstico presuntivo y observaciones',
      sospecha({
        Fractura: [
          s('fractura_hueso', 'Hueso y segmento', { req: true }),
          una('fractura_tipo', 'Tipo', ['Cerrada', 'Expuesta']),
          una('fractura_desplazamiento', 'Desplazamiento', [
            'No desplazada',
            'Desplazada',
            'Conminuta',
          ]),
        ],
        Esguince: [
          una(
            'esguince_grado',
            'Grado',
            ['I — distensión', 'II — rotura parcial', 'III — rotura completa'],
            { req: true },
          ),
          b('ottawa', 'Reglas de Ottawa positivas (tobillo/rodilla)'),
        ],
        Luxación: [
          s('luxacion_articulacion', 'Articulación', { req: true }),
          b('luxacion_reducida', 'Reducida'),
        ],
        'Lesión meniscal o ligamentaria de rodilla': [
          varias(
            'rodilla_pruebas',
            'Pruebas positivas',
            [
              'Lachman',
              'Cajón anterior',
              'McMurray',
              'Bostezo varo/valgo',
              'Ninguna',
            ],
            { req: true },
          ),
          b('rodilla_derrame', 'Derrame'),
        ],
        'Lumbalgia mecánica': [
          varias(
            'lumbalgia_banderas_trauma',
            'Banderas rojas',
            [
              'Déficit neurológico',
              'Alteración de esfínteres',
              'Fiebre',
              'Antecedente de cáncer',
              'Ninguna',
            ],
            { req: true },
          ),
        ],
        Tendinopatía: [s('tendon', 'Tendón afectado', { req: true })],
      }),
    ),
    seccion('Conducta', [
      obl(t('conducta', 'Conducta (inmovilización, cirugía, rehabilitación)')),
    ]),
  ],

  OFTALMO_EXAMEN_BASE: () => [
    seccion('Motivo de consulta', [
      obl(t('motivo_consulta', 'Motivo de consulta')),
      varias('sintomas_oculares', 'Síntomas', [
        'Baja de visión',
        'Ojo rojo',
        'Dolor ocular',
        'Fotofobia',
        'Secreción',
        'Visión doble',
        'Moscas volantes o destellos',
        'Ninguno',
      ]),
      b('usa_correccion_optica', 'Usa corrección óptica'),
      ...si('usa_correccion_optica', true, [
        una('correccion_tipo', 'Tipo', ['Lentes', 'Lentes de contacto'], {
          req: true,
        }),
      ]),
    ]),
    seccion('Agudeza visual (Snellen)', [
      obl(
        s('agudeza_visual_od', 'Agudeza visual sin corrección OD', {
          ayuda: 'Fracción de Snellen, por ejemplo 20/40.',
        }),
      ),
      obl(s('agudeza_visual_oi', 'Agudeza visual sin corrección OI')),
      s('agudeza_visual_corregida_od', 'Agudeza visual corregida OD'),
      s('agudeza_visual_corregida_oi', 'Agudeza visual corregida OI'),
    ]),
    seccion('Examen', [
      d('presion_intraocular_od', 'Presión intraocular OD (mmHg)'),
      d('presion_intraocular_oi', 'Presión intraocular OI (mmHg)'),
      t('reflejos_pupilares', 'Reflejos pupilares'),
      t('motilidad_ocular', 'Motilidad ocular'),
      t('segmento_anterior_od', 'Segmento anterior OD'),
      t('segmento_anterior_oi', 'Segmento anterior OI'),
      t('fondo_de_ojo_od', 'Fondo de ojo OD'),
      t('fondo_de_ojo_oi', 'Fondo de ojo OI'),
    ]),
    seccion(
      'Diagnóstico presuntivo y observaciones',
      sospecha({
        'Vicio de refracción': [
          una(
            'refraccion_tipo',
            'Tipo',
            ['Miopía', 'Hipermetropía', 'Astigmatismo', 'Presbicia'],
            { req: true },
          ),
        ],
        Catarata: [
          una('catarata_ojo', 'Ojo', ['OD', 'OI', 'Ambos'], { req: true }),
          b('catarata_limita', 'Limita las actividades diarias'),
        ],
        Glaucoma: [
          s('excavacion', 'Relación copa/disco', { req: true }),
          b('campimetria', 'Campimetría alterada'),
        ],
        'Retinopatía diabética o hipertensiva': [
          una(
            'retinopatia_grado',
            'Grado',
            [
              'Sin retinopatía',
              'No proliferativa leve',
              'No proliferativa moderada',
              'No proliferativa grave',
              'Proliferativa',
              'Edema macular',
            ],
            { req: true },
          ),
        ],
        Conjuntivitis: [
          una(
            'conjuntivitis_tipo',
            'Tipo',
            ['Viral', 'Bacteriana', 'Alérgica'],
            { req: true },
          ),
          b(
            'conjuntivitis_bav',
            'Baja de visión o dolor (descartar otra causa)',
          ),
        ],
        Pterigión: [
          una('pterigion_grado', 'Grado', ['I', 'II', 'III', 'IV'], {
            req: true,
          }),
        ],
        'Ojo rojo con signos de alarma': [
          varias(
            'ojo_rojo_alarma',
            'Signos de alarma',
            [
              'Dolor intenso',
              'Baja de visión',
              'Pupila arreactiva',
              'Opacidad corneal',
              'Trauma',
            ],
            { req: true },
          ),
        ],
      }),
    ),
    seccion('Diagnóstico y plan', cierre()),
  ],

  EMERG_ATENCION_BASE: () => [
    seccion('Llegada', [
      obl(t('motivo_consulta', 'Motivo de consulta')),
      obl(s('hora_de_llegada', 'Hora de llegada')),
      una('forma_de_llegada', 'Forma de llegada', [
        'Por sus medios',
        'Ambulancia',
        'Traído por terceros',
        'Policía',
      ]),
      s('tiempo_de_evolucion', 'Tiempo de evolución'),
      s(
        'nivel_de_prioridad_asignado',
        'Prioridad asignada en el triaje del establecimiento',
      ),
    ]),
    seccion('Evaluación primaria (ABCDE)', [
      obl(t('evaluacion_inicial', 'Evaluación inicial')),
      una('via_aerea', 'A — vía aérea', ['Permeable', 'Comprometida']),
      una('respiracion', 'B — respiración', [
        'Adecuada',
        'Dificultad respiratoria',
        'Apnea',
      ]),
      una('circulacion', 'C — circulación', [
        'Estable',
        'Signos de shock',
        'Hemorragia activa',
      ]),
      una('estado_de_conciencia', 'D — conciencia (AVPU)', [
        'Alerta',
        'Responde a la voz',
        'Responde al dolor',
        'No responde',
      ]),
      ...GLASGOW(),
      vitales({
        pa: 'presion_arterial',
        pas: null,
        pad: null,
        peso: null,
        talla: null,
      }),
      d('glucemia_capilar', 'Glucemia capilar (mg/dL)'),
      b('dolor_presente', 'Dolor'),
      ...si('dolor_presente', true, [
        i('dolor_intensidad', 'Intensidad (0 a 10)', { req: true }),
        s('dolor_localizacion', 'Localización'),
      ]),
    ]),
    seccion('Antecedentes (SAMPLE)', [
      t('antecedentes_relevantes', 'Antecedentes relevantes'),
      alergias('alergias'),
      medicacion('medicacion_actual'),
      s('ultima_ingesta', 'Última ingesta (hora)'),
      una('embarazo_emergencia', '¿Embarazo posible?', [
        'Sí',
        'No',
        'No aplica',
      ]),
    ]),
    seccion(
      'Diagnóstico presuntivo y observaciones',
      sospecha({
        'Dolor torácico agudo': [
          ...DOLOR_TORACICO(),
          s('troponina', 'Troponina'),
        ],
        'Accidente cerebrovascular': ACV(),
        Politraumatismo: [
          s('trauma_mecanismo', 'Mecanismo de alta energía', { req: true }),
          varias('trauma_lesiones', 'Lesiones', [
            'Craneoencefálica',
            'Torácica',
            'Abdominal',
            'Pélvica',
            'Extremidades',
            'Columna',
          ]),
        ],
        'Dificultad respiratoria': [
          una(
            'dr_causa',
            'Causa probable',
            [
              'Asma o EPOC',
              'Neumonía',
              'Insuficiencia cardíaca',
              'Anafilaxia',
              'Embolia pulmonar',
            ],
            { req: true },
          ),
        ],
        Sepsis: [
          varias(
            'qsofa_emerg',
            'qSOFA',
            [
              'Frecuencia respiratoria ≥ 22',
              'Alteración del estado mental',
              'PAS ≤ 100 mmHg',
            ],
            { req: true },
          ),
          d('lactato', 'Lactato (mmol/L)'),
        ],
        'Dengue con signos de alarma': DENGUE(),
        Convulsión: CONVULSION(),
        Intoxicación: [
          s('intox_sustancia', 'Sustancia y cantidad', { req: true }),
          s('intox_hora', 'Hora de exposición'),
          una('intox_via', 'Vía', [
            'Oral',
            'Inhalatoria',
            'Cutánea',
            'Parenteral',
          ]),
        ],
      }),
    ),
    seccion('Diagnóstico y conducta', [
      cierre(),
      una('destino', 'Destino', [
        'Alta',
        'Observación',
        'Internación',
        'Terapia intensiva',
        'Referencia a otro establecimiento',
        'Quirófano',
      ]),
    ]),
  ],

  MEDINT_UCI_EVALUACION: () => [
    seccion('Ingreso', [
      obl(t('motivo_consulta', 'Motivo de la evaluación')),
      obl(t('motivo_de_ingreso_a_la_unidad', 'Motivo de ingreso a la unidad')),
      f('fecha_de_ingreso_a_la_unidad', 'Fecha de ingreso a la unidad'),
      i('dias_de_estancia_en_la_unidad', 'Días de estancia'),
    ]),
    seccion('Neurológico', [
      una('estado_de_conciencia', 'Estado de conciencia', [
        'Alerta',
        'Somnoliento',
        'Estupor',
        'Coma',
        'Sedado',
      ]),
      ...GLASGOW(),
      b('sedacion', 'Sedación'),
      ...si('sedacion', true, [
        una(
          'rass',
          'RASS',
          [
            '+2 agitado',
            '+1 inquieto',
            '0 alerta y calmo',
            '−1 somnoliento',
            '−2 sedación leve',
            '−3 sedación moderada',
            '−4 sedación profunda',
            '−5 no despierta',
          ],
          { req: true },
        ),
      ]),
      b('delirium', 'Delirium (evaluación positiva)'),
      ...si('delirium', true, [
        una('delirium_tipo', 'Tipo', ['Hiperactivo', 'Hipoactivo', 'Mixto'], {
          req: true,
        }),
      ]),
    ]),
    seccion('Respiratorio y hemodinámico', [
      b('soporte_ventilatorio', 'Soporte ventilatorio'),
      ...si('soporte_ventilatorio', true, [
        una(
          'modo_ventilatorio',
          'Modo',
          [
            'Oxígeno por cánula',
            'Alto flujo',
            'Ventilación no invasiva',
            'Ventilación mecánica invasiva',
          ],
          { req: true },
        ),
        t(
          'descripcion_del_soporte_ventilatorio',
          'Parámetros (FiO₂, PEEP, volumen)',
        ),
        d('pafi', 'PaO₂/FiO₂'),
      ]),
      b('soporte_vasoactivo', 'Soporte vasoactivo'),
      ...si('soporte_vasoactivo', true, [
        varias(
          'vasoactivos',
          'Fármacos',
          [
            'Noradrenalina',
            'Adrenalina',
            'Vasopresina',
            'Dobutamina',
            'Dopamina',
          ],
          { req: true },
        ),
        t('descripcion_del_soporte_vasoactivo', 'Dosis'),
      ]),
      vitales({
        pa: 'presion_arterial',
        pas: null,
        pad: null,
        fr: 'frecuencia_respiratoria',
        peso: null,
        talla: null,
      }),
      d('lactato_uci', 'Lactato (mmol/L)'),
      s('balance_hidrico_del_turno', 'Balance hídrico del turno (mL)'),
      d('diuresis_ml_kg_h', 'Diuresis (mL/kg/h)'),
    ]),
    seccion(
      'Diagnóstico presuntivo y observaciones',
      sospecha({
        'Shock séptico': [
          s('foco_sepsis', 'Foco', { req: true }),
          b('hemocultivos', 'Hemocultivos tomados'),
          s('antibiotico_hora', 'Antibiótico y hora de inicio'),
        ],
        'Síndrome de distrés respiratorio agudo': [
          una(
            'sdra_berlin',
            'Gravedad (Berlín)',
            ['Leve (PaO₂/FiO₂ 200–300)', 'Moderado (100–200)', 'Grave (< 100)'],
            { req: true },
          ),
          b('prono', 'Ventilación en prono'),
        ],
        'Neumonía grave': NEUMONIA(),
        'Insuficiencia renal aguda': [
          una('kdigo_lra', 'Estadio KDIGO', ['1', '2', '3'], { req: true }),
          b('terapia_reemplazo', 'Terapia de reemplazo renal'),
        ],
        'Posoperatorio de alto riesgo': [
          s('cirugia_realizada', 'Cirugía realizada', { req: true }),
          b('sangrado_postop', 'Sangrado activo'),
        ],
        'Coma o daño neurológico agudo': [
          b('pupilas_simetricas', 'Pupilas simétricas y reactivas', {
            req: true,
          }),
          s('tac_cerebro', 'TAC de cerebro'),
        ],
      }),
    ),
    seccion('Evolución y plan', [
      obl(t('evolucion_del_turno', 'Evolución del turno')),
      cierre(),
    ]),
  ],

  PSIQ_EVALUACION_BASE: () => [
    seccion('Motivo de consulta', [
      obl(t('motivo_consulta', 'Motivo de consulta')),
      obl(t('enfermedad_actual', 'Relato de la enfermedad actual')),
    ]),
    seccion('Antecedentes', [
      t('antecedentes_psiquiatricos', 'Antecedentes psiquiátricos'),
      b('internaciones_previas', 'Internaciones psiquiátricas previas'),
      ...si('internaciones_previas', true, [
        i('internaciones_numero', '¿Cuántas?', { req: true }),
      ]),
      t('tratamientos_previos', 'Tratamientos previos'),
      habitos(),
      t('consumo_de_sustancias', 'Consumo de sustancias — detalle'),
      t('red_de_apoyo', 'Red de apoyo'),
    ]),
    seccion('Tamizaje', [
      varias(
        'srq20_respuestas_si',
        'SRQ-20 (OMS): preguntas respondidas «sí» en el último mes',
        SRQ20,
      ),
      i('srq20_puntaje', 'SRQ-20 — total (0–20)'),
    ]),
    seccion('Examen mental', [
      t('aspecto_y_actitud', 'Aspecto y actitud'),
      t('conciencia_y_orientacion', 'Conciencia y orientación'),
      t('atencion_y_memoria', 'Atención y memoria'),
      t('lenguaje', 'Lenguaje'),
      t('pensamiento_curso_y_contenido', 'Pensamiento: curso y contenido'),
      b('alucinaciones', 'Alteraciones de la sensopercepción'),
      ...si('alucinaciones', true, [
        varias(
          'alucinaciones_tipo',
          '¿Cuáles?',
          ['Auditivas', 'Visuales', 'Táctiles', 'Olfativas'],
          { req: true },
        ),
        t('sensopercepcion', 'Sensopercepción — detalle'),
      ]),
      t('afecto_y_estado_de_animo', 'Afecto y estado de ánimo'),
      una('insight', 'Juicio e insight', ['Conservado', 'Parcial', 'Ausente']),
      t('juicio_e_insight', 'Juicio e insight — detalle'),
    ]),
    seccion('Riesgo', [
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
          varias(
            'suicidio_factores',
            'Factores',
            [
              'Acceso a medios letales',
              'Intentos previos',
              'Vive solo',
              'Consumo de alcohol',
              'Desesperanza',
            ],
            { req: true },
          ),
          t('suicidio_plan_seguridad', 'Plan de seguridad acordado', {
            req: true,
          }),
        ],
      ),
      una('riesgo_de_heteroagresion', 'Riesgo de heteroagresión', [
        'Bajo',
        'Moderado',
        'Alto',
      ]),
    ]),
    seccion(
      'Diagnóstico presuntivo y observaciones',
      sospecha({
        'Episodio depresivo': [
          varias(
            'depresion_criterios',
            'Síntomas (2 semanas o más)',
            [
              'Ánimo deprimido',
              'Anhedonia',
              'Alteración del sueño',
              'Alteración del apetito',
              'Fatiga',
              'Culpa o inutilidad',
              'Dificultad para concentrarse',
              'Enlentecimiento o agitación',
              'Ideas de muerte',
            ],
            { req: true, ayuda: '5 o más, incluido ánimo o anhedonia.' },
          ),
        ],
        'Trastorno de ansiedad': [
          una(
            'ansiedad_tipo',
            'Presentación',
            [
              'Generalizada',
              'Crisis de pánico',
              'Fobia social',
              'Fobia específica',
            ],
            { req: true },
          ),
          i('ansiedad_meses', 'Meses de evolución'),
        ],
        'Trastorno bipolar': [
          varias(
            'mania',
            'Síntomas maníacos',
            [
              'Ánimo elevado o irritable',
              'Menos necesidad de dormir',
              'Verborrea',
              'Fuga de ideas',
              'Grandiosidad',
              'Conductas de riesgo',
            ],
            { req: true },
          ),
        ],
        Psicosis: [
          varias(
            'psicosis_sintomas',
            'Síntomas',
            [
              'Delirios',
              'Alucinaciones',
              'Discurso desorganizado',
              'Conducta desorganizada',
              'Síntomas negativos',
            ],
            { req: true },
          ),
          b('psicosis_primer_episodio', 'Primer episodio'),
        ],
        'Trastorno por consumo de alcohol': [
          i('audit_total', 'AUDIT completo (0–40)', { req: true }),
          b('abstinencia', 'Signos de abstinencia'),
        ],
        'Trastorno por consumo de otras sustancias': [
          s('sustancia_principal', 'Sustancia principal', { req: true }),
          s('sustancia_via_frecuencia', 'Vía y frecuencia'),
        ],
      }),
    ),
    seccion('Impresión y plan', [
      obl(t('impresion_diagnostica', 'Impresión diagnóstica (CIE-10)')),
      obl(t('plan_terapeutico', 'Plan terapéutico')),
    ]),
  ],

  PSICO_EVALUACION_BASE: () => [
    seccion('Motivo de consulta', motivo()),
    seccion('Antecedentes', [
      t(
        'antecedentes_tratamiento_psicologico',
        'Tratamiento psicológico previo',
      ),
      t(
        'antecedentes_tratamiento_psiquiatrico',
        'Tratamiento psiquiátrico previo',
      ),
      medicacion('medicacion_actual'),
      t(
        'antecedentes_familiares_salud_mental',
        'Antecedentes familiares de salud mental',
      ),
      t('situacion_vital_actual', 'Situación vital actual'),
    ]),
    seccion('Tamizaje y áreas', [
      varias(
        'srq20_respuestas_si',
        'SRQ-20 (OMS): preguntas respondidas «sí» en el último mes',
        SRQ20,
      ),
      i('srq20_puntaje', 'SRQ-20 — total (0–20)'),
      obl(t('estado_de_animo', 'Estado de ánimo')),
      t('ansiedad', 'Ansiedad'),
      una('sueno_calidad', 'Sueño', [
        'Normal',
        'Insomnio de conciliación',
        'Despertares',
        'Hipersomnia',
      ]),
      t('sueno', 'Sueño — detalle'),
      t('apetito', 'Apetito'),
      habitos(),
      t('consumo_de_sustancias', 'Consumo de sustancias — detalle'),
      t('red_de_apoyo', 'Red de apoyo'),
      una(
        'riesgo_autolesion',
        'Riesgo de autolesión',
        [
          'Sin ideación',
          'Ideación sin plan',
          'Ideación con plan',
          'Intento reciente',
        ],
        { req: true },
      ),
      ...si(
        'riesgo_autolesion',
        ['Ideación con plan', 'Intento reciente'],
        [
          t('riesgo_referido', 'Riesgo — detalle y derivación urgente', {
            req: true,
          }),
        ],
      ),
    ]),
    seccion(
      'Diagnóstico presuntivo y observaciones',
      sospecha({
        'Trastorno mental común (ansiedad, depresión)': [
          una(
            'tmc_predominio',
            'Predominio',
            ['Depresivo', 'Ansioso', 'Mixto', 'Somático'],
            { req: true },
          ),
          i('tmc_meses', 'Meses de evolución'),
        ],
        Duelo: [
          s('duelo_perdida', 'Pérdida y fecha', { req: true }),
          b('duelo_complicado', 'Más de 12 meses con deterioro funcional'),
        ],
        'Estrés postraumático': [
          varias(
            'tept',
            'Síntomas',
            [
              'Reexperimentación',
              'Evitación',
              'Hiperalerta',
              'Cambios negativos del ánimo',
            ],
            { req: true },
          ),
        ],
        Violencia: [
          varias(
            'violencia_tipo',
            'Tipo',
            ['Física', 'Psicológica', 'Sexual', 'Económica'],
            { req: true },
          ),
          b('violencia_riesgo_inminente', 'Riesgo inminente'),
          b('violencia_denuncia', 'Orientada a la denuncia (Ley 348)'),
        ],
        'Problemas de conducta en niños o adolescentes': [
          s('conducta_contexto', 'Contexto escolar y familiar', { req: true }),
        ],
      }),
    ),
    seccion('Diagnóstico y plan', [
      t('observaciones_de_la_entrevista', 'Observaciones de la entrevista'),
      cierre({
        plan: 'plan_de_tratamiento',
        planNombre: 'Plan de tratamiento',
      }),
    ]),
  ],
};
