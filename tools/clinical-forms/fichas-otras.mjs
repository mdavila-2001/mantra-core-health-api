/**
 * Fichas v2 transversales, de informe, materno-infantiles, odontológicas y de
 * las profesiones de la salud no médicas.
 *
 * Las de informe (imágenes, patología, laboratorio) y el consentimiento no
 * llevan bloque de diagnóstico presuntivo: no se atiende a nadie, se informa un
 * estudio o se registra una decisión. Ganan listas cerradas y «¿cuál?».
 */
import {
  alergias,
  antecedentes,
  b,
  cierre,
  d,
  f,
  familiares,
  i,
  medicacion,
  motivo,
  obl,
  quirurgicos,
  s,
  seccion,
  si,
  presuntivo,
  t,
  una,
  varias,
  vitales,
} from './lib.mjs';
import { ANEMIA, DM2, EDA, IRA_ALTA, LUMBALGIA } from './sindromes.mjs';

const MUESTRAS = [
  'Sangre venosa',
  'Sangre capilar',
  'Orina',
  'Heces',
  'Esputo',
  'Líquido cefalorraquídeo',
  'Hisopado',
  'Otro líquido biológico',
];

/** Signos generales de peligro del niño de 2 meses a 5 años (AIEPI). */
const SIGNOS_DE_PELIGRO_AIEPI = [
  'No puede beber ni tomar el pecho',
  'Vomita todo',
  'Convulsiones',
  'Letárgico o inconsciente',
  'Ninguno',
];

/** Hipertensión del embarazo y signos de alarma obstétricos (OPS/CLAP). */
const ALARMA_OBSTETRICA = [
  'Sangrado vaginal',
  'Pérdida de líquido',
  'Cefalea intensa o visión borrosa',
  'Dolor en epigastrio',
  'Disminución de movimientos fetales',
  'Contracciones antes de las 37 semanas',
  'Fiebre',
  'Ninguno',
];

export const OTRAS = {
  TRANSV_ANAMNESIS_GENERAL: () => [
    seccion(
      'Motivo de consulta',
      motivo({
        tiempo: 'tiempo_enfermedad',
        tiempoReq: false,
        relato: 'enfermedad_actual',
      }),
    ),
    seccion('Antecedentes', [
      antecedentes(),
      quirurgicos(),
      alergias('antecedentes_alergicos'),
      medicacion(),
      familiares(),
      una('esquema_vacunas', 'Vacunas', [
        'Completo',
        'Incompleto',
        'Desconocido',
      ]),
    ]),
    seccion('Hábitos', [
      b('habito_tabaco', 'Fuma o fumó'),
      ...si('habito_tabaco', true, [
        una('tabaco', 'Consumo de tabaco', ['Exfumador', 'Fumador actual'], {
          req: true,
        }),
        i('cigarrillos_por_dia', 'Cigarrillos por día'),
      ]),
      b('habito_alcohol', 'Consume alcohol'),
      ...si('habito_alcohol', true, [
        una(
          'audit_c_frecuencia',
          '¿Con qué frecuencia? (AUDIT-C 1)',
          [
            'Una o menos veces al mes',
            'De 2 a 4 veces al mes',
            'De 2 a 3 veces a la semana',
            '4 o más veces a la semana',
          ],
          { req: true },
        ),
        una('audit_c_cantidad', 'Consumiciones en un día normal (AUDIT-C 2)', [
          '1 o 2',
          '3 o 4',
          '5 o 6',
          '7 a 9',
          '10 o más',
        ]),
        una(
          'audit_c_seis_o_mas',
          '6 o más bebidas en una ocasión (AUDIT-C 3)',
          [
            'Nunca',
            'Menos de una vez al mes',
            'Mensualmente',
            'Semanalmente',
            'A diario o casi a diario',
          ],
        ),
      ]),
      una('habito_actividad_fisica', 'Actividad física', [
        'Sedentario',
        'Menos de 150 minutos por semana',
        '150 minutos o más por semana',
      ]),
    ]),
    seccion('Revisión por sistemas', [
      varias('sintomas_generales', 'Síntomas generales', [
        'Fiebre',
        'Pérdida de peso',
        'Astenia',
        'Sudoración nocturna',
        'Ninguno',
      ]),
      varias('ros_positivos', 'Sistemas con síntomas', [
        'Respiratorio',
        'Cardiovascular',
        'Digestivo',
        'Urinario',
        'Neurológico',
        'Osteomuscular',
        'Piel',
        'Ginecológico',
        'Ninguno',
      ]),
      t(
        'revision_por_sistemas',
        'Revisión por sistemas — detalle de lo positivo',
      ),
    ]),
    seccion('Impresión y plan', [
      obl(t('impresion_diagnostica', 'Impresión diagnóstica')),
      t('plan_de_trabajo', 'Plan de trabajo'),
    ]),
  ],

  TRANSV_EXAMEN_FISICO: () => [
    seccion('Signos vitales', [
      vitales({ sat: 'saturacion_oxigeno' }, ['pas', 'pad', 'fc']),
    ]),
    seccion('Examen general', [
      una('estado_general', 'Estado general', ['Bueno', 'Regular', 'Malo']),
      una('hidratacion', 'Hidratación', [
        'Hidratado',
        'Deshidratación leve',
        'Deshidratación moderada a grave',
      ]),
      varias('coloracion', 'Coloración', [
        'Normal',
        'Palidez',
        'Ictericia',
        'Cianosis',
      ]),
      t('piel_y_faneras', 'Piel y faneras'),
      t('cabeza_y_cuello', 'Cabeza y cuello'),
    ]),
    seccion('Examen por aparatos', [
      una('respiratorio_normal', 'Aparato respiratorio', [
        'Normal',
        'Con hallazgos',
      ]),
      ...si('respiratorio_normal', 'Con hallazgos', [
        t('aparato_respiratorio', '¿Qué hallazgos?', { req: true }),
      ]),
      una('cardiovascular_normal', 'Aparato cardiovascular', [
        'Normal',
        'Con hallazgos',
      ]),
      ...si('cardiovascular_normal', 'Con hallazgos', [
        t('aparato_cardiovascular', '¿Qué hallazgos?', { req: true }),
      ]),
      una('abdomen_normal', 'Abdomen', ['Normal', 'Con hallazgos']),
      ...si('abdomen_normal', 'Con hallazgos', [
        t('abdomen', '¿Qué hallazgos?', { req: true }),
      ]),
      una('neurologico_normal', 'Sistema nervioso', [
        'Normal',
        'Con hallazgos',
      ]),
      ...si('neurologico_normal', 'Con hallazgos', [
        t('sistema_nervioso', '¿Qué hallazgos?', { req: true }),
      ]),
      una('locomotor_normal', 'Aparato locomotor', ['Normal', 'Con hallazgos']),
      ...si('locomotor_normal', 'Con hallazgos', [
        t('aparato_locomotor', '¿Qué hallazgos?', { req: true }),
      ]),
    ]),
  ],

  TRANSV_CONSENTIMIENTO_INFORMADO: () => [
    seccion('Procedimiento', [
      obl(t('procedimiento_propuesto', 'Procedimiento propuesto')),
      obl(t('diagnostico_que_lo_motiva', 'Diagnóstico que lo motiva')),
      obl(t('beneficios_esperados', 'Beneficios esperados')),
      obl(
        t(
          'riesgos_y_complicaciones',
          'Riesgos y complicaciones frecuentes y graves',
        ),
      ),
      t('alternativas_disponibles', 'Alternativas disponibles'),
      t('consecuencias_de_no_aceptar', 'Consecuencias de no aceptar'),
      b('hubo_preguntas', '¿El paciente hizo preguntas?'),
      ...si('hubo_preguntas', true, [
        t('preguntas_del_paciente', '¿Cuáles y qué se respondió?', {
          req: true,
        }),
      ]),
    ]),
    seccion('Decisión', [
      obl(b('acepta_el_procedimiento', 'Acepta el procedimiento')),
      ...si('acepta_el_procedimiento', false, [
        t('motivo_de_rechazo', 'Motivo del rechazo (disentimiento)', {
          req: true,
        }),
      ]),
      b('otorgado_por_representante', 'Lo otorga un representante'),
      ...si('otorgado_por_representante', true, [
        s('nombre_del_representante', 'Nombre del representante', {
          req: true,
        }),
        una(
          'representante_vinculo',
          'Vínculo',
          [
            'Padre o madre',
            'Tutor legal',
            'Cónyuge',
            'Hijo o hija',
            'Otro familiar',
          ],
          { req: true },
        ),
        una(
          'representante_motivo',
          'Motivo',
          ['Menor de edad', 'Incapacidad para decidir', 'Urgencia'],
          { req: true },
        ),
      ]),
      obl(f('fecha_de_otorgamiento', 'Fecha de otorgamiento')),
    ]),
  ],

  TRANSV_EPICRISIS: () => [
    seccion('Internación', [
      obl(f('fecha_de_ingreso', 'Fecha de ingreso')),
      obl(f('fecha_de_egreso', 'Fecha de egreso')),
      obl(t('motivo_de_ingreso', 'Motivo de ingreso')),
      obl(t('diagnostico_de_ingreso', 'Diagnóstico de ingreso')),
      obl(t('diagnostico_de_egreso', 'Diagnóstico de egreso (CIE-10)')),
      obl(t('resumen_de_la_evolucion', 'Resumen de la evolución')),
      b('hubo_procedimientos', 'Se realizaron procedimientos'),
      ...si('hubo_procedimientos', true, [
        t('procedimientos_realizados', '¿Cuáles y cuándo?', { req: true }),
      ]),
      t('hallazgos_relevantes', 'Hallazgos relevantes'),
      b('hubo_complicaciones', 'Hubo complicaciones'),
      ...si('hubo_complicaciones', true, [
        t('complicaciones', '¿Cuáles?', { req: true }),
      ]),
    ]),
    seccion('Egreso', [
      obl(
        una('condicion_al_egreso', 'Condición al egreso', [
          'Alta médica — mejorado',
          'Alta médica — igual',
          'Alta voluntaria',
          'Referido a otro establecimiento',
          'Fallecido',
        ]),
      ),
      ...si('condicion_al_egreso', 'Referido a otro establecimiento', [
        s('referido_a', '¿A qué establecimiento y por qué?', { req: true }),
      ]),
      obl(t('tratamiento_al_egreso', 'Tratamiento al egreso')),
      t('recomendaciones', 'Recomendaciones y signos de alarma explicados'),
      f('control_ambulatorio', 'Fecha del control ambulatorio'),
    ]),
  ],

  RADIO_INFORME_BASE: () => [
    seccion('Solicitud', [
      obl(t('motivo_consulta', 'Indicación del estudio')),
      t('antecedentes_relevantes', 'Antecedentes relevantes'),
      obl(
        una('estudio_realizado', 'Estudio realizado', [
          'Radiografía',
          'Ecografía',
          'Tomografía',
          'Resonancia magnética',
          'Mamografía',
          'Densitometría',
          'Fluoroscopía',
        ]),
      ),
      obl(s('region_anatomica', 'Región anatómica')),
      f('fecha_del_estudio', 'Fecha del estudio'),
    ]),
    seccion('Técnica', [
      t('tecnica_y_proyecciones', 'Técnica y proyecciones'),
      b('uso_de_contraste', 'Uso de contraste'),
      ...si('uso_de_contraste', true, [
        s('medio_de_contraste_utilizado', '¿Qué contraste y por qué vía?', {
          req: true,
        }),
        b('reaccion_al_contraste', 'Hubo reacción al contraste'),
      ]),
      una('calidad', 'Calidad del estudio', ['Óptima', 'Adecuada', 'Limitada']),
      ...si('calidad', 'Limitada', [
        t('calidad_del_estudio', '¿Por qué es limitada?', { req: true }),
      ]),
      b('hay_previos', 'Hay estudios previos para comparar'),
      ...si('hay_previos', true, [
        t('comparacion_estudios_previos', 'Comparación', { req: true }),
      ]),
    ]),
    seccion('Informe', [
      obl(t('hallazgos', 'Hallazgos')),
      t('hallazgos_incidentales', 'Hallazgos incidentales'),
      t('incidentes_durante_el_estudio', 'Incidentes durante el estudio'),
      una('categoria_birads', 'BI-RADS (sólo mama)', [
        'No aplica',
        '0',
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
      ]),
      b('hallazgo_critico', 'Hay un hallazgo crítico'),
      ...si('hallazgo_critico', true, [
        s(
          'hallazgo_critico_comunicado',
          '¿Cuál, a quién se comunicó y a qué hora?',
          { req: true },
        ),
      ]),
      obl(t('diagnostico', 'Conclusión')),
      t('conducta', 'Recomendación'),
    ]),
  ],

  PATOL_INFORME_BASE: () => [
    seccion('Solicitud', [
      obl(t('motivo_consulta', 'Indicación del estudio')),
      t('diagnostico_clinico_presuntivo', 'Diagnóstico clínico presuntivo'),
      obl(
        una('tipo_de_muestra', 'Tipo de muestra', [
          'Biopsia',
          'Pieza quirúrgica',
          'Citología',
          'Punción aspirativa con aguja fina',
          'Autopsia',
        ]),
      ),
      s('procedencia_anatomica', 'Procedencia anatómica'),
      una('procedimiento_de_obtencion', 'Procedimiento de obtención', [
        'Biopsia incisional',
        'Biopsia escisional',
        'Endoscopía',
        'Punción',
        'Resección quirúrgica',
        'Raspado',
      ]),
      f('fecha_de_toma', 'Fecha de toma'),
      f('fecha_de_recepcion', 'Fecha de recepción'),
      i('numero_de_frascos', 'Número de frascos'),
      una('tipo_de_fijacion', 'Fijación', [
        'Formol al 10 %',
        'Alcohol',
        'En fresco',
        'Otra',
      ]),
      una('estado_muestra', 'Estado de la muestra', [
        'Adecuada',
        'Insuficiente',
        'Mal fijada',
        'Rechazada',
      ]),
      ...si(
        'estado_muestra',
        ['Insuficiente', 'Mal fijada', 'Rechazada'],
        [t('estado_de_la_muestra', '¿Por qué?', { req: true })],
      ),
    ]),
    seccion('Informe', [
      obl(t('descripcion_macroscopica', 'Descripción macroscópica')),
      obl(t('descripcion_microscopica', 'Descripción microscópica')),
      b('hubo_tecnicas_especiales', 'Se usaron técnicas especiales'),
      ...si('hubo_tecnicas_especiales', true, [
        t('tecnicas_especiales', '¿Cuáles? (inmunohistoquímica, tinciones)', {
          req: true,
        }),
      ]),
      t('estudio_comparativo_previo', 'Estudio comparativo previo'),
      una('malignidad', 'Malignidad', [
        'Benigno',
        'Displasia o lesión precursora',
        'Maligno',
        'Indeterminado',
      ]),
      ...si('malignidad', 'Maligno', [
        s('margenes', 'Márgenes', { req: true }),
        s('grado_histologico', 'Grado histológico'),
      ]),
      t('observaciones', 'Observaciones'),
      obl(t('diagnostico', 'Diagnóstico anatomopatológico')),
      t('conducta', 'Recomendación'),
    ]),
  ],

  BIOQ_INFORME_BASE: () => [
    seccion('Solicitud', [
      obl(t('motivo_consulta', 'Indicación')),
      t(
        'diagnostico_presuntivo_solicitante',
        'Diagnóstico presuntivo del solicitante',
      ),
      obl(t('determinaciones_solicitadas', 'Determinaciones solicitadas')),
    ]),
    seccion('Fase preanalítica', [
      obl(una('tipo_de_muestra', 'Tipo de muestra', MUESTRAS)),
      t('condiciones_de_la_toma', 'Condiciones de la toma'),
      b('ayuno', 'En ayunas'),
      ...si('ayuno', true, [
        i('horas_de_ayuno', 'Horas de ayuno', { req: true }),
      ]),
      f('fecha_de_toma', 'Fecha de toma'),
      s('hora_de_toma', 'Hora de toma'),
      t('medicacion_en_curso', 'Medicación en curso'),
      una('aspecto_muestra', 'Estado de la muestra', [
        'Adecuada',
        'Hemolizada',
        'Lipémica',
        'Ictérica',
        'Coagulada',
        'Volumen insuficiente',
      ]),
      ...si(
        'aspecto_muestra',
        [
          'Hemolizada',
          'Lipémica',
          'Ictérica',
          'Coagulada',
          'Volumen insuficiente',
        ],
        [t('estado_de_la_muestra', 'Interferencia esperada', { req: true })],
      ),
      t('observaciones_preanaliticas', 'Observaciones preanalíticas'),
    ]),
    seccion('Resultados', [
      t('metodo_analitico', 'Método analítico'),
      obl(t('resultados', 'Resultados con unidades y valores de referencia')),
      b('hay_fuera_de_rango', 'Hay valores fuera de rango'),
      ...si('hay_fuera_de_rango', true, [
        t('valores_fuera_de_rango', '¿Cuáles?', { req: true }),
        b('valor_critico', 'Alguno es un valor crítico'),
      ]),
      ...si('valor_critico', true, [
        s('valor_critico_comunicado', '¿A quién se comunicó y a qué hora?', {
          req: true,
        }),
      ]),
      t('comparacion_con_estudios_previos', 'Comparación con estudios previos'),
      obl(t('diagnostico', 'Interpretación')),
      t('conducta', 'Recomendación'),
    ]),
  ],

  PEDIA_CONTROL_NINO_SANO: () => [
    seccion('Datos del control', [
      obl(i('edad_en_meses', 'Edad (meses)')),
      obl(d('peso_kg', 'Peso (kg)')),
      obl(d('talla_cm', 'Talla (cm)')),
      d('perimetro_cefalico_cm', 'Perímetro cefálico (cm)'),
      una('estado_nutricional', 'Estado nutricional (curvas OMS)', [
        'Normal',
        'Riesgo de desnutrición',
        'Desnutrición aguda moderada',
        'Desnutrición aguda grave',
        'Talla baja',
        'Sobrepeso',
        'Obesidad',
      ]),
    ]),
    seccion('Alimentación', [
      b(
        'lactancia_materna_exclusiva',
        'Lactancia materna exclusiva (menores de 6 meses)',
      ),
      una('alimentacion_tipo', 'Alimentación', [
        'Lactancia exclusiva',
        'Lactancia y fórmula',
        'Fórmula',
        'Lactancia y alimentación complementaria',
        'Dieta familiar',
      ]),
      t('alimentacion', 'Alimentación — detalle'),
      b('suplementos', 'Recibe suplementos'),
      ...si('suplementos', true, [
        varias(
          'suplementos_cuales',
          '¿Cuáles?',
          ['Hierro', 'Vitamina A', 'Chispitas nutricionales', 'Zinc'],
          { otro: true, req: true },
        ),
      ]),
    ]),
    seccion('Vacunas y desarrollo', [
      obl(b('vacunas_al_dia', 'Vacunas al día según el esquema nacional')),
      ...si('vacunas_al_dia', false, [
        varias(
          'vacunas_faltantes',
          '¿Cuáles faltan?',
          [
            'BCG',
            'Pentavalente',
            'Antipolio',
            'Rotavirus',
            'Neumococo',
            'SRP',
            'Fiebre amarilla',
            'Influenza',
            'Varicela',
          ],
          { otro: true, req: true },
        ),
      ]),
      una('desarrollo_global', 'Desarrollo psicomotor para la edad', [
        'Adecuado',
        'Con alerta',
        'Con retraso',
      ]),
      ...si(
        'desarrollo_global',
        ['Con alerta', 'Con retraso'],
        [
          varias(
            'desarrollo_areas',
            '¿En qué áreas?',
            ['Motor grueso', 'Motor fino', 'Lenguaje', 'Social'],
            { req: true },
          ),
          t('desarrollo_motor', 'Motor — detalle'),
          t('desarrollo_del_lenguaje', 'Lenguaje — detalle'),
          t('desarrollo_social', 'Social — detalle'),
        ],
      ),
      una('agudeza_visual', 'Tamizaje visual', [
        'Normal',
        'Alterado',
        'No realizado',
      ]),
      una('tamizaje_auditivo', 'Tamizaje auditivo', [
        'Normal',
        'Alterado',
        'No realizado',
      ]),
      t('salud_bucal', 'Salud bucal'),
    ]),
    seccion('Signos de peligro (AIEPI)', [
      varias(
        'signos_de_peligro',
        'Signos generales de peligro',
        SIGNOS_DE_PELIGRO_AIEPI,
        { req: true, ayuda: 'Cualquiera presente: referencia urgente.' },
      ),
      t('signos_de_alarma', 'Otros signos de alarma — detalle'),
    ]),
    seccion(
      'Motivo agregado y observaciones',
      presuntivo(
        [
          'Niño sano, sin otro motivo',
          'Infección respiratoria aguda',
          'Enfermedad diarreica aguda',
          'Anemia',
          'Desnutrición',
        ],
        { code: 'motivo_agregado' },
      ),
    ),
    seccion('Próximo control', [f('proximo_control', 'Próximo control')]),
  ],

  PEDIA_CURVAS_CRECIMIENTO_OMS: () => [
    seccion('Medición', [
      obl(f('fecha_de_medicion', 'Fecha de medición')),
      obl(i('edad_en_meses', 'Edad (meses)')),
      obl(una('sexo', 'Sexo', ['Niña', 'Niño'])),
      obl(d('peso_kg', 'Peso (kg)')),
      obl(d('talla_cm', 'Longitud o talla (cm)')),
      una('posicion_medicion', 'Medido', [
        'Acostado (longitud)',
        'De pie (talla)',
      ]),
      d('perimetro_cefalico_cm', 'Perímetro cefálico (cm)'),
      d('imc', 'IMC (kg/m²)'),
    ]),
    seccion('Puntajes Z (patrones OMS)', [
      d('z_peso_para_la_edad', 'Z peso para la edad'),
      d('z_talla_para_la_edad', 'Z talla para la edad'),
      d('z_peso_para_la_talla', 'Z peso para la talla'),
      d('z_imc_para_la_edad', 'Z IMC para la edad'),
      una(
        'clasificacion_nutricional',
        'Clasificación nutricional',
        [
          'Normal',
          'Desnutrición aguda moderada (Z −2 a −3)',
          'Desnutrición aguda grave (Z < −3)',
          'Talla baja (Z talla < −2)',
          'Riesgo de sobrepeso',
          'Sobrepeso (Z > 2)',
          'Obesidad (Z > 3)',
        ],
        { req: true },
      ),
    ]),
  ],

  GINOBS_CONTROL_PRENATAL: () => [
    seccion('Embarazo actual', [
      obl(f('fecha_ultima_menstruacion', 'Fecha de última menstruación')),
      f('fecha_probable_de_parto', 'Fecha probable de parto'),
      obl(i('edad_gestacional_semanas', 'Edad gestacional (semanas)')),
      b('embarazo_planificado', 'Embarazo planificado'),
    ]),
    seccion('Antecedentes obstétricos', [
      obl(i('gestas_previas', 'Gestas previas')),
      i('partos_previos', 'Partos vaginales'),
      i('cesareas_previas', 'Cesáreas'),
      i('abortos_previos', 'Abortos'),
      varias(
        'antecedentes_obstetricos_riesgo',
        'Antecedentes de riesgo',
        [
          'Preeclampsia',
          'Diabetes gestacional',
          'Hemorragia posparto',
          'Parto prematuro',
          'Muerte fetal',
          'Ninguno',
        ],
        { otro: true },
      ),
    ]),
    seccion('Examen', [
      obl(d('peso_kg', 'Peso (kg)')),
      d('talla_cm', 'Talla (cm)'),
      obl(i('presion_arterial_sistolica', 'Presión arterial sistólica (mmHg)')),
      obl(
        i('presion_arterial_diastolica', 'Presión arterial diastólica (mmHg)'),
      ),
      d('altura_uterina_cm', 'Altura uterina (cm)'),
      una('presentacion_fetal', 'Presentación fetal', [
        'Cefálica',
        'Podálica',
        'Transversa',
        'No evaluable',
      ]),
      i('frecuencia_cardiaca_fetal', 'Frecuencia cardíaca fetal (lpm)'),
      b('movimientos_fetales', 'Movimientos fetales'),
      b('edema', 'Edema'),
      ...si('edema', true, [
        una(
          'edema_localizacion_hcp',
          'Localización',
          ['Miembros inferiores', 'Manos y cara', 'Generalizado'],
          { req: true },
        ),
      ]),
      una('proteinuria', 'Proteinuria (tira)', [
        'Negativa',
        'Trazas',
        '+',
        '++',
        '+++',
      ]),
    ]),
    seccion('Laboratorio y prevención', [
      d('hemoglobina', 'Hemoglobina (g/dL)'),
      varias('tamizajes', 'Tamizajes realizados', [
        'VIH',
        'Sífilis',
        'Hepatitis B',
        'Chagas',
        'Glucemia',
        'Grupo y factor Rh',
        'Urocultivo',
      ]),
      b('tamizaje_positivo', 'Algún tamizaje positivo'),
      ...si('tamizaje_positivo', true, [
        t('tamizaje_positivo_detalle', '¿Cuál y qué conducta?', { req: true }),
      ]),
      b('vacuna_antitetanica', 'Vacuna dT'),
      b('suplemento_hierro_folatos', 'Hierro y ácido fólico'),
    ]),
    seccion('Signos de alarma', [
      varias(
        'signos_de_alarma_obstetricos',
        'Signos de alarma referidos',
        ALARMA_OBSTETRICA,
        { req: true },
      ),
      ...si(
        'signos_de_alarma_obstetricos',
        ['Cefalea intensa o visión borrosa', 'Dolor en epigastrio'],
        [
          b(
            'preeclampsia_sospecha',
            'PA ≥ 140/90 con estos síntomas (sospecha de preeclampsia)',
            { req: true },
          ),
        ],
      ),
      t('riesgo_detectado', 'Riesgo detectado'),
      f('proximo_control', 'Próximo control'),
    ]),
  ],

  OBST_CONTROL_BASE: () => [
    seccion('Motivo', [obl(t('motivo_consulta', 'Motivo de consulta'))]),
    seccion('Embarazo', [
      f('fecha_ultima_menstruacion', 'Fecha de última menstruación'),
      obl(i('edad_gestacional_semanas', 'Edad gestacional (semanas)')),
      i('gestas', 'Gestas'),
      i('partos', 'Partos'),
      i('cesareas', 'Cesáreas'),
      i('abortos', 'Abortos'),
      t('antecedentes_relevantes', 'Antecedentes relevantes'),
      t('controles_previos', 'Controles previos'),
    ]),
    seccion('Examen', [
      d('peso_kg', 'Peso (kg)'),
      obl(s('presion_arterial', 'Presión arterial (mmHg)')),
      d('altura_uterina_cm', 'Altura uterina (cm)'),
      i('latidos_fetales', 'Latidos fetales (lpm)'),
      b('movimientos_fetales', 'Movimientos fetales'),
      b('tiene_edemas', 'Edemas'),
      ...si('tiene_edemas', true, [
        una(
          'edema_localizacion_obst',
          'Localización',
          ['Miembros inferiores', 'Manos y cara', 'Generalizado'],
          { req: true },
        ),
        t('edemas', 'Edemas — detalle'),
      ]),
      varias(
        'signos_de_alarma_obstetricos',
        'Signos de alarma',
        ALARMA_OBSTETRICA,
        { req: true },
      ),
      t('molestias_referidas', 'Molestias referidas'),
    ]),
    seccion(
      'Diagnóstico presuntivo y observaciones',
      presuntivo([
        'Embarazo normal',
        'Trastorno hipertensivo del embarazo',
        'Amenaza de parto prematuro',
        'Hemorragia del embarazo',
        'Diabetes gestacional',
        'Infección urinaria en el embarazo',
      ]),
    ),
    seccion('Diagnóstico y plan', cierre()),
  ],

  ODONTO_ANAMNESIS: () => [
    seccion('Motivo de consulta', [
      obl(t('motivo_consulta', 'Motivo de consulta')),
    ]),
    seccion('Antecedentes médicos', [
      b('alergia_a_medicamentos', 'Alergia a medicamentos'),
      ...si('alergia_a_medicamentos', true, [
        varias(
          'alergia_odonto_cual',
          '¿A cuál?',
          ['Penicilina', 'AINE', 'Anestésico local', 'Látex'],
          { otro: true, req: true },
        ),
      ]),
      b('consume_medicamentos', 'Consume medicamentos'),
      ...si('consume_medicamentos', true, [
        varias(
          'medicamentos_odonto_riesgo',
          '¿Alguno de estos?',
          [
            'Anticoagulantes',
            'Antiagregantes',
            'Bifosfonatos',
            'Corticoides',
            'Ninguno de estos',
          ],
          { req: true },
        ),
        s('medicamentos_odonto_cuales', '¿Cuáles toma?'),
      ]),
      b('problemas_con_anestesia', 'Problemas con anestesia dental'),
      ...si('problemas_con_anestesia', true, [
        s('anestesia_problema', '¿Qué pasó?', { req: true }),
      ]),
      b('problemas_de_sangrado', 'Sangra mucho tras extracciones o heridas'),
      b('enfermedad_cardiovascular', 'Enfermedad cardiovascular'),
      ...si('enfermedad_cardiovascular', true, [
        varias(
          'cardio_odonto',
          '¿Cuál?',
          [
            'Valvulopatía o prótesis valvular',
            'Endocarditis previa',
            'Cardiopatía isquémica',
            'Arritmia',
          ],
          { otro: true, req: true },
        ),
      ]),
      b('hipertension_arterial', 'Hipertensión arterial'),
      ...si('hipertension_arterial', true, [
        una(
          'hta_controlada_odonto',
          '¿Está controlada?',
          ['Sí', 'No', 'No sabe'],
          { req: true },
        ),
      ]),
      b('diabetes', 'Diabetes'),
      ...si('diabetes', true, [
        una(
          'dm_controlada_odonto',
          '¿Está controlada?',
          ['Sí', 'No', 'No sabe'],
          { req: true },
        ),
      ]),
      b('embarazo', 'Embarazo'),
      ...si('embarazo', true, [
        i('embarazo_semanas_odonto', 'Semanas de gestación', { req: true }),
      ]),
      b('fuma', 'Fuma'),
      ...si('fuma', true, [
        i('cigarrillos_por_dia_odonto', 'Cigarrillos por día', { req: true }),
      ]),
      t('detalle_de_antecedentes', 'Detalle de antecedentes'),
    ]),
    seccion('Antecedentes bucales', [
      b('molestia_o_dolor_bucal', 'Molestia o dolor bucal'),
      ...si('molestia_o_dolor_bucal', true, [
        una(
          'dolor_dental_tipo',
          'Tipo de dolor',
          ['Provocado (frío, dulce)', 'Espontáneo', 'Nocturno', 'Al masticar'],
          { req: true },
        ),
        i('dolor_dental_intensidad', 'Intensidad (0 a 10)'),
      ]),
      b('sangrado_de_encias', 'Sangrado de encías'),
      b('movilidad_dentaria', 'Movilidad dentaria'),
      b('bruxismo', 'Bruxismo'),
      una('frecuencia_cepillado', 'Cepillado por día', [
        'Ninguno',
        '1 vez',
        '2 veces',
        '3 o más veces',
      ]),
      f('ultima_visita_dental', 'Última visita al odontólogo'),
    ]),
    seccion('Diagnóstico y plan', [
      obl(t('diagnostico', 'Diagnóstico')),
      t('plan_de_tratamiento', 'Plan de tratamiento'),
    ]),
  ],

  NUTRI_EVALUACION_BASE: () => [
    seccion('Motivo de consulta', motivo({ tiempoReq: false })),
    seccion('Antecedentes', [
      antecedentes(),
      t('medicacion_y_suplementos', 'Medicación y suplementos'),
      b('tiene_intolerancias', 'Intolerancias alimentarias'),
      ...si('tiene_intolerancias', true, [
        varias(
          'intolerancias_cuales',
          '¿Cuáles?',
          ['Lactosa', 'Gluten', 'Fructosa'],
          { otro: true, req: true },
        ),
        t('intolerancias_alimentarias', 'Detalle'),
      ]),
      b('tiene_alergias_alimentarias', 'Alergias alimentarias'),
      ...si('tiene_alergias_alimentarias', true, [
        t('alergias_alimentarias', '¿A qué alimento y qué reacción?', {
          req: true,
        }),
      ]),
    ]),
    seccion('Antropometría', [
      obl(d('peso_kg', 'Peso (kg)')),
      obl(d('talla_m', 'Talla (m)')),
      d('imc_calculado', 'IMC (kg/m²)'),
      d('perimetro_abdominal_cm', 'Perímetro abdominal (cm)'),
      una('tendencia_de_peso', 'Cambio de peso reciente', [
        'Estable',
        'Aumentó',
        'Bajó',
      ]),
      ...si(
        'tendencia_de_peso',
        ['Aumentó', 'Bajó'],
        [
          t('cambio_de_peso_referido', '¿Cuántos kg y en cuánto tiempo?', {
            req: true,
          }),
        ],
      ),
    ]),
    seccion('Hábitos', [
      i('numero_de_comidas_al_dia', 'Comidas al día'),
      t('habitos_alimentarios', 'Recordatorio de 24 horas'),
      varias('consumo_frecuente', 'Consumo frecuente', [
        'Bebidas azucaradas',
        'Frituras',
        'Comida rápida',
        'Frutas y verduras',
        'Lácteos',
        'Legumbres',
      ]),
      t('consumo_de_liquidos', 'Consumo de líquidos'),
      t('habito_intestinal', 'Hábito intestinal'),
      una('actividad_fisica_nivel', 'Actividad física', [
        'Sedentario',
        'Menos de 150 min/semana',
        '150 min/semana o más',
      ]),
      t('actividad_fisica', 'Actividad física — detalle'),
    ]),
    seccion(
      'Diagnóstico presuntivo y observaciones',
      presuntivo([
        'Sobrepeso u obesidad',
        'Desnutrición o riesgo nutricional',
        'Diabetes o resistencia a la insulina',
        'Dislipidemia',
        'Anemia nutricional',
        'Embarazo o lactancia',
      ]),
    ),
    seccion('Plan', [
      t('objetivo_nutricional', 'Objetivo nutricional'),
      obl(t('diagnostico', 'Diagnóstico nutricional')),
      t('plan_de_tratamiento', 'Plan alimentario'),
    ]),
  ],

  FISIO_EVALUACION_BASE: () => [
    seccion('Motivo de consulta', [
      obl(t('motivo_consulta', 'Motivo de consulta')),
      obl(s('zona_afectada', 'Zona afectada')),
      obl(s('tiempo_de_evolucion', 'Tiempo de evolución')),
      t('mecanismo_de_lesion', 'Mecanismo de lesión'),
      b('derivado_por_medico', 'Viene derivado por un médico'),
      ...si('derivado_por_medico', true, [
        s('diagnostico_medico', 'Diagnóstico médico de derivación', {
          req: true,
        }),
      ]),
    ]),
    seccion('Dolor', [
      i('dolor_intensidad_referida', 'Intensidad del dolor (0 a 10)'),
      una('dolor_caracter_fisio', 'Carácter', [
        'Mecánico',
        'Inflamatorio',
        'Neuropático',
        'Mixto',
      ]),
      t('caracteristicas_del_dolor', 'Dolor — detalle'),
      t('antecedentes_relevantes', 'Antecedentes relevantes'),
      t('tratamientos_previos', 'Tratamientos previos'),
    ]),
    seccion('Evaluación', [
      t('inspeccion_y_palpacion', 'Inspección y palpación'),
      t('rango_de_movimiento', 'Rango de movimiento (goniometría)'),
      una('fuerza_mrc_fisio', 'Fuerza (MRC, peor segmento)', [
        '5',
        '4',
        '3',
        '2',
        '1',
        '0',
      ]),
      t('fuerza_muscular', 'Fuerza muscular — detalle'),
      t('marcha', 'Marcha'),
      t('postura_y_equilibrio', 'Postura y equilibrio'),
      t('limitacion_funcional', 'Limitación funcional'),
    ]),
    seccion(
      'Diagnóstico presuntivo y observaciones',
      presuntivo([
        'Lumbalgia',
        'Cervicalgia',
        'Posquirúrgico o posfractura',
        'Secuela neurológica (ACV, lesión medular)',
        'Lesión deportiva',
        'Rehabilitación respiratoria',
      ]),
    ),
    seccion('Plan', [
      t('objetivos_de_rehabilitacion', 'Objetivos de rehabilitación'),
      obl(t('diagnostico', 'Diagnóstico kinésico')),
      t('plan_de_tratamiento', 'Plan de tratamiento (sesiones, técnicas)'),
    ]),
  ],

  ENFER_VALORACION_BASE: () => [
    seccion('Motivo', [
      obl(t('motivo_consulta', 'Motivo de atención')),
      t('antecedentes_relevantes', 'Antecedentes relevantes'),
      alergias('alergias_referidas'),
      medicacion('medicacion_actual'),
    ]),
    seccion('Signos vitales', [
      vitales(
        {
          pa: 'presion_arterial',
          pas: null,
          pad: null,
          temp: 'temperatura_c',
          peso: null,
          talla: null,
        },
        ['pa'],
      ),
      i('dolor_intensidad_referida', 'Dolor (0 a 10)'),
    ]),
    seccion('Valoración', [
      una('conciencia', 'Estado de conciencia', [
        'Alerta',
        'Somnoliento',
        'Confuso',
        'Estupor',
        'Coma',
      ]),
      t('estado_de_conciencia', 'Conciencia — detalle'),
      una('piel_integridad', 'Integridad de la piel', [
        'Íntegra',
        'Lesión por presión',
        'Herida',
        'Quemadura',
      ]),
      ...si(
        'piel_integridad',
        ['Lesión por presión', 'Herida', 'Quemadura'],
        [
          una('upp_estadio', 'Estadio (si es lesión por presión)', [
            'No aplica',
            'Estadio 1',
            'Estadio 2',
            'Estadio 3',
            'Estadio 4',
            'No estadificable',
          ]),
          t('estado_de_la_piel', 'Localización y descripción', { req: true }),
        ],
      ),
      una(
        'riesgo_lesion_presion',
        'Riesgo de lesión por presión (escala del establecimiento)',
        ['Sin riesgo', 'Bajo', 'Moderado', 'Alto'],
      ),
      b('accesos_vasculares', 'Accesos vasculares o dispositivos'),
      ...si('accesos_vasculares', true, [
        varias(
          'dispositivos',
          '¿Cuáles?',
          [
            'Vía periférica',
            'Catéter central',
            'Sonda vesical',
            'Sonda nasogástrica',
            'Drenaje',
            'Ostomía',
          ],
          { req: true },
        ),
        s('dispositivos_fecha', 'Fecha de colocación'),
      ]),
      una(
        'riesgo_caidas_nivel',
        'Riesgo de caídas (escala del establecimiento)',
        ['Bajo', 'Medio', 'Alto'],
      ),
      t('riesgo_de_caidas', 'Riesgo de caídas — detalle'),
      una('autonomia_nivel', 'Autonomía', [
        'Independiente',
        'Ayuda parcial',
        'Dependiente',
      ]),
      t('autonomia', 'Autonomía — detalle'),
      t('necesidades_identificadas', 'Necesidades identificadas (Henderson)'),
    ]),
    seccion('Diagnóstico enfermero y plan', [
      obl(t('diagnostico', 'Diagnóstico de enfermería (NANDA)')),
      t('conducta', 'Intervenciones y evaluación'),
    ]),
  ],

  MEDEP_EVALUACION_BASE: () => [
    seccion('Motivo y práctica', [
      obl(t('motivo_consulta', 'Motivo de consulta')),
      obl(s('deporte_practicado', 'Deporte practicado')),
      una('nivel_de_practica', 'Nivel', [
        'Recreativo',
        'Competitivo amateur',
        'Federado',
        'Profesional',
      ]),
      i('carga_entrenamiento_semanal_horas', 'Entrenamiento semanal (horas)'),
      t('lesiones_previas', 'Lesiones previas'),
      t('dolor_actual', 'Dolor actual'),
      s('tiempo_de_evolucion', 'Tiempo de evolución'),
    ]),
    seccion('Tamizaje cardiovascular', [
      varias(
        'sintomas_esfuerzo',
        'Síntomas con el esfuerzo',
        [
          'Dolor torácico',
          'Síncope',
          'Disnea desproporcionada',
          'Palpitaciones',
          'Ninguno',
        ],
        { req: true },
      ),
      ...si(
        'sintomas_esfuerzo',
        [
          'Dolor torácico',
          'Síncope',
          'Disnea desproporcionada',
          'Palpitaciones',
        ],
        [
          t(
            'sintomas_de_esfuerzo',
            '¿Cuándo y cómo? (requiere estudio antes de autorizar)',
            { req: true },
          ),
        ],
      ),
      obl(
        b(
          'antecedente_familiar_muerte_subita',
          'Familiar con muerte súbita antes de los 50 años',
        ),
      ),
      t('antecedentes_cardiovasculares', 'Antecedentes cardiovasculares'),
      b('soplo_deporte', 'Soplo en el examen'),
      s('ecg_deporte', 'ECG de reposo — hallazgo'),
    ]),
    seccion('Examen', [
      t('suplementos_y_medicacion', 'Suplementos y medicación'),
      t('examen_general', 'Examen general'),
      t('examen_cardiorrespiratorio', 'Examen cardiorrespiratorio'),
      obl(t('examen_aparato_locomotor', 'Examen del aparato locomotor')),
      t('exploraciones_complementarias', 'Exploraciones complementarias'),
    ]),
    seccion('Conclusión', [
      obl(t('diagnostico', 'Diagnóstico')),
      una('aptitud', 'Aptitud deportiva', [
        'Apto',
        'Apto con restricciones',
        'No apto temporal',
        'No apto',
      ]),
      ...si(
        'aptitud',
        ['Apto con restricciones', 'No apto temporal', 'No apto'],
        [
          t('aptitud_propuesta', '¿Qué restricción y hasta cuándo?', {
            req: true,
          }),
        ],
      ),
      t('plan_de_tratamiento', 'Plan'),
    ]),
  ],
};

// La ficha `ODONTO_ODONTOGRAMA_OMS` no se reescribe: el odontograma ya es un
// control dedicado y sus campos de índice CPOD son numéricos. Sólo gana
// opciones en lo que era texto libre categórico.
export const ODONTOGRAMA_HIJOS = {
  traumatismo_dental: [
    s('traumatismo_piezas', '¿Qué piezas? (FDI)', { req: true }),
  ],
  uso_de_protesis: [
    una(
      'protesis_tipo',
      'Tipo de prótesis',
      ['Parcial removible', 'Total removible', 'Fija', 'Sobre implantes'],
      { req: true },
    ),
  ],
  dolor_dental: [
    s('dolor_dental_pieza', '¿Qué pieza duele? (FDI)', { req: true }),
  ],
};

export const ODONTOGRAMA_AJUSTES = {
  fluorosis_del_esmalte: [
    'Normal',
    'Cuestionable',
    'Muy leve',
    'Leve',
    'Moderada',
    'Grave',
  ],
  urgencia_de_intervencion: [
    'No necesita tratamiento',
    'Tratamiento preventivo o de rutina',
    'Tratamiento inmediato (dolor o infección)',
    'Derivación para evaluación completa',
  ],
};
