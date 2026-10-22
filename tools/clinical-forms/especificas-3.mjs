/**
 * Fichas específicas por condición (3 de 3): especialidades quirúrgicas,
 * materno-infantil, odontología, profesiones no médicas e informes.
 */
import {
  b,
  control,
  d,
  f,
  i,
  informeDe,
  s,
  si,
  socrates,
  t,
  una,
  varias,
} from './lib.mjs';
import { ASMA, EDA, LUMBALGIA } from './sindromes.mjs';

const AGUDO = { modo: 'agudo' };
const PA = () => [
  i('presion_arterial_sistolica', 'Presión arterial sistólica (mmHg)', {
    req: true,
  }),
  i('presion_arterial_diastolica', 'Presión arterial diastólica (mmHg)', {
    req: true,
  }),
];
const SIGNOS_DE_PELIGRO = [
  'No puede beber ni tomar el pecho',
  'Vomita todo',
  'Convulsiones',
  'Letárgico o inconsciente',
  'Ninguno',
];

export const ESPECIFICAS_3 = [
  /* ---- Cirugía ---- */
  {
    code: 'CIRGEN_CTRL_POSOPERATORIO',
    carpeta: 'cirugia-general',
    nombre: 'Control posoperatorio',
    fuente: 'MINSA_NT022',
    nota: 'Herida, dolor, tránsito y complicaciones graduadas por Clavien-Dindo (clasificación publicada de uso libre).',
    campos: () =>
      control({
        condicion: 'posoperatorio',
        ...AGUDO,
        evaluacion: [
          s('cirugia_realizada', 'Cirugía realizada', { req: true }),
          f('fecha_cirugia', 'Fecha de la cirugía'),
          una(
            'herida',
            'Herida',
            [
              'Limpia y seca',
              'Eritema',
              'Secreción serosa',
              'Secreción purulenta',
              'Dehiscencia',
            ],
            { req: true },
          ),
          i('dolor_intensidad', 'Dolor (0 a 10)'),
          una('transito', 'Tránsito intestinal', [
            'Conservado',
            'Sin gases ni heces',
          ]),
          b('fiebre', 'Fiebre'),
          una('clavien_dindo', 'Complicación (Clavien-Dindo)', [
            'Sin complicaciones',
            'I',
            'II',
            'IIIa',
            'IIIb',
            'IVa',
            'IVb',
            'V',
          ]),
          b('retiro_puntos', 'Retiro de puntos hoy'),
        ],
      }),
  },
  {
    code: 'CIRGEN_CTRL_ABDOMEN_AGUDO',
    carpeta: 'cirugia-general',
    nombre: 'Abdomen agudo: evaluación quirúrgica',
    fuente: 'MINSA_NT022',
    nota: 'Semiología del dolor, signos peritoneales y escala de Alvarado (publicada).',
    campos: () =>
      control({
        condicion: 'abdomen agudo',
        ...AGUDO,
        evaluacion: [
          b('dolor_abdominal', 'Dolor abdominal', { req: true }),
          ...socrates('dolor', 'dolor_abdominal', true),
          varias(
            'signos_peritoneales',
            'Signos peritoneales',
            ['Defensa', 'Rebote', 'Rovsing', 'Psoas', 'Murphy', 'Ninguno'],
            { req: true },
          ),
          varias('alvarado', 'Escala de Alvarado', [
            'Migración del dolor a fosa ilíaca derecha',
            'Anorexia',
            'Náuseas o vómitos',
            'Dolor en fosa ilíaca derecha (2)',
            'Rebote',
            'Fiebre > 37,3 °C',
            'Leucocitosis > 10 000 (2)',
            'Desviación a la izquierda',
          ]),
          i('alvarado_puntaje', 'Alvarado — puntaje'),
          s('imagen', 'Imagen — hallazgo'),
          una('decision', 'Decisión', [
            'Cirugía',
            'Observación',
            'Alta con signos de alarma',
          ]),
        ],
      }),
  },
  {
    code: 'URO_CTRL_HPB',
    carpeta: 'urologia',
    nombre: 'Control de hiperplasia prostática',
    fuente: 'MINSA_NT022',
    nota: 'Síntomas del tracto urinario inferior, residuo, PSA y tacto rectal.',
    campos: () =>
      control({
        condicion: 'hiperplasia prostática',
        evaluacion: [
          varias(
            'stui',
            'Síntomas urinarios',
            [
              'Chorro débil',
              'Esfuerzo',
              'Goteo terminal',
              'Vaciado incompleto',
              'Polaquiuria',
              'Urgencia',
            ],
            { req: true },
          ),
          i('nicturia', 'Nicturia (veces por noche)'),
          una(
            'molestia_global',
            'Si tuviera que vivir así el resto de su vida, se sentiría',
            ['Bien', 'Más o menos', 'Mal'],
          ),
          d('psa', 'PSA total (ng/mL)'),
          d('residuo', 'Residuo posmiccional (mL)'),
          s('volumen_prostatico', 'Volumen prostático (mL)'),
          b('retencion', 'Retención urinaria desde el último control'),
        ],
        educacion: ['Reducir líquidos de noche', 'Evitar descongestionantes'],
      }),
  },
  {
    code: 'URO_CTRL_LITIASIS',
    carpeta: 'urologia',
    nombre: 'Cólico renal y litiasis urinaria',
    fuente: 'MINSA_NT022',
    nota: 'Dolor, signos de obstrucción infectada y tamaño del lito para la decisión.',
    campos: () =>
      control({
        condicion: 'litiasis urinaria',
        ...AGUDO,
        evaluacion: [
          i('dolor_intensidad', 'Dolor (0 a 10)', { req: true }),
          b('fiebre', 'Fiebre (urgencia: obstrucción infectada)'),
          s('lito_tamano', 'Tamaño y ubicación del lito', { req: true }),
          b('hidronefrosis', 'Hidronefrosis'),
          una('conducta_lito', 'Conducta', [
            'Expulsión espontánea',
            'Litotricia',
            'Ureteroscopía',
            'Derivación urgente',
          ]),
        ],
      }),
  },
  {
    code: 'ORL_CTRL_OTITIS',
    carpeta: 'otorrinolaringologia',
    nombre: 'Otitis media: evaluación y control',
    fuente: 'MINSA_NT022',
    nota: 'Otoscopía, otorrea y audición.',
    campos: () =>
      control({
        condicion: 'otitis media',
        ...AGUDO,
        evaluacion: [
          una('oido', 'Oído', ['Derecho', 'Izquierdo', 'Ambos'], { req: true }),
          una(
            'membrana',
            'Membrana timpánica',
            ['Normal', 'Abombada', 'Retraída', 'Perforada'],
            { req: true },
          ),
          b('otorrea', 'Otorrea'),
          b('fiebre', 'Fiebre'),
          una('audicion', 'Audición', ['Conservada', 'Disminuida']),
          i('episodios_anio', 'Episodios en el último año'),
        ],
      }),
  },
  {
    code: 'ORL_CTRL_HIPOACUSIA',
    carpeta: 'otorrinolaringologia',
    nombre: 'Hipoacusia: evaluación',
    fuente: 'MINSA_NT022',
    nota: 'Inicio, lateralidad, audiometría y factores de riesgo.',
    campos: () =>
      control({
        condicion: 'hipoacusia',
        ...AGUDO,
        evaluacion: [
          una('inicio', 'Inicio', ['Súbito (urgencia)', 'Progresivo'], {
            req: true,
          }),
          una('lado', 'Lado', ['Derecho', 'Izquierdo', 'Bilateral']),
          una('tipo', 'Tipo', [
            'Conductiva',
            'Neurosensorial',
            'Mixta',
            'No establecida',
          ]),
          s('audiometria', 'Audiometría — umbrales'),
          varias('factores', 'Factores', [
            'Ruido laboral',
            'Ototóxicos',
            'Edad',
            'Antecedente familiar',
          ]),
        ],
      }),
  },
  {
    code: 'OFTALMO_CTRL_RETINOPATIA',
    carpeta: 'oftalmologia',
    nombre: 'Control de retinopatía diabética',
    fuente: 'AAO',
    nota: 'Escala internacional de retinopatía diabética y edema macular (categorías de la AAO).',
    campos: () =>
      control({
        condicion: 'retinopatía diabética',
        modo: 'evaluacion',
        evaluacion: [
          s('agudeza_visual_od', 'Agudeza visual OD', { req: true }),
          s('agudeza_visual_oi', 'Agudeza visual OI', { req: true }),
          una(
            'retinopatia_od',
            'Retinopatía OD',
            [
              'Sin retinopatía',
              'No proliferativa leve',
              'No proliferativa moderada',
              'No proliferativa grave',
              'Proliferativa',
            ],
            { req: true },
          ),
          una(
            'retinopatia_oi',
            'Retinopatía OI',
            [
              'Sin retinopatía',
              'No proliferativa leve',
              'No proliferativa moderada',
              'No proliferativa grave',
              'Proliferativa',
            ],
            { req: true },
          ),
          una('edema_macular', 'Edema macular', [
            'Ausente',
            'Presente sin compromiso central',
            'Presente con compromiso central',
          ]),
          d('hba1c', 'Última HbA1c (%)'),
        ],
      }),
  },
  {
    code: 'OFTALMO_CTRL_GLAUCOMA',
    carpeta: 'oftalmologia',
    nombre: 'Control de glaucoma',
    fuente: 'AAO',
    nota: 'Presión intraocular, nervio óptico y campo visual.',
    campos: () =>
      control({
        condicion: 'glaucoma',
        evaluacion: [
          d('pio_od', 'Presión intraocular OD (mmHg)', { req: true }),
          d('pio_oi', 'Presión intraocular OI (mmHg)', { req: true }),
          s('copa_disco', 'Relación copa/disco OD/OI'),
          una('campo_visual', 'Campo visual', [
            'Sin cambios',
            'Progresión',
            'No realizado',
          ]),
          una('angulo', 'Tipo', ['Ángulo abierto', 'Ángulo cerrado']),
        ],
        metas: ['Presión en la meta individual', 'Campo visual estable'],
        educacion: ['Gotas todos los días', 'Técnica de aplicación'],
      }),
  },
  {
    code: 'TRAUMA_CTRL_FRACTURA',
    carpeta: 'traumatologia',
    nombre: 'Control de fractura',
    fuente: 'MINSA_NT022',
    nota: 'Inmovilización, estado neurovascular, consolidación radiológica y rehabilitación.',
    campos: () =>
      control({
        condicion: 'fractura',
        ...AGUDO,
        evaluacion: [
          s('fractura_hueso', 'Hueso y segmento', { req: true }),
          f('fecha_fractura', 'Fecha de la fractura'),
          una('tratamiento_fractura', 'Tratamiento', [
            'Yeso o férula',
            'Cirugía con osteosíntesis',
            'Funcional',
          ]),
          una(
            'neurovascular',
            'Estado neurovascular distal',
            ['Conservado', 'Alterado'],
            { req: true },
          ),
          b(
            'compartimental',
            'Dolor desproporcionado (descartar síndrome compartimental)',
          ),
          una('consolidacion', 'Consolidación radiológica', [
            'Sin callo',
            'Callo en formación',
            'Consolidada',
            'Retardo',
          ]),
          una('carga', 'Carga permitida', ['Sin carga', 'Parcial', 'Total']),
        ],
      }),
  },
  {
    code: 'TRAUMA_CTRL_RODILLA',
    carpeta: 'traumatologia',
    nombre: 'Rodilla dolorosa: evaluación',
    fuente: 'MINSA_NT022',
    nota: 'Mecanismo, derrame, maniobras meniscales y ligamentarias y reglas de Ottawa.',
    campos: () =>
      control({
        condicion: 'rodilla dolorosa',
        ...AGUDO,
        evaluacion: [
          una('lado', 'Lado', ['Derecha', 'Izquierda'], { req: true }),
          una('mecanismo', 'Mecanismo', [
            'Torsión',
            'Golpe directo',
            'Sin traumatismo',
          ]),
          b('derrame', 'Derrame'),
          varias('maniobras', 'Maniobras positivas', [
            'Lachman',
            'Cajón anterior',
            'McMurray',
            'Bostezo varo',
            'Bostezo valgo',
            'Ninguna',
          ]),
          b('ottawa', 'Reglas de Ottawa positivas (pedir radiografía)'),
        ],
      }),
  },
  {
    code: 'ANEST_CTRL_RECUPERACION',
    carpeta: 'anestesiologia',
    nombre: 'Recuperación posanestésica',
    fuente: 'MINSA_NT022',
    nota: 'Puntaje de Aldrete (publicado) para el alta de la sala de recuperación, dolor y náuseas.',
    campos: () =>
      control({
        condicion: 'recuperación posanestésica',
        ...AGUDO,
        evaluacion: [
          una('aldrete_actividad', 'Aldrete — actividad', [
            '2 — mueve 4 extremidades',
            '1 — mueve 2',
            '0 — no mueve',
          ]),
          una('aldrete_respiracion', 'Aldrete — respiración', [
            '2 — respira y tose',
            '1 — disnea',
            '0 — apnea',
          ]),
          una('aldrete_circulacion', 'Aldrete — circulación', [
            '2 — PA ± 20 % del basal',
            '1 — ± 20–50 %',
            '0 — ± más de 50 %',
          ]),
          una('aldrete_conciencia', 'Aldrete — conciencia', [
            '2 — despierto',
            '1 — responde al llamado',
            '0 — no responde',
          ]),
          una('aldrete_saturacion', 'Aldrete — saturación', [
            '2 — > 92 % al aire',
            '1 — necesita O₂',
            '0 — < 90 % con O₂',
          ]),
          i('aldrete_total', 'Aldrete — total (alta con ≥ 9)', { req: true }),
          i('dolor_intensidad', 'Dolor (0 a 10)'),
          b('nauseas', 'Náuseas o vómitos'),
        ],
      }),
  },

  /* ---- Materno-infantil ---- */
  {
    code: 'PEDIA_CTRL_IRA',
    carpeta: 'pediatria',
    nombre: 'Niño con tos o dificultad para respirar (AIEPI)',
    fuente: 'OMS_AIEPI',
    nota: 'Signos generales de peligro, respiración rápida para la edad y tiraje, con la clasificación AIEPI.',
    campos: () =>
      control({
        condicion: 'tos o dificultad respiratoria',
        ...AGUDO,
        evaluacion: [
          i('edad_en_meses', 'Edad (meses)', { req: true }),
          varias(
            'signos_de_peligro',
            'Signos generales de peligro',
            SIGNOS_DE_PELIGRO,
            { req: true },
          ),
          i('frecuencia_respiratoria', 'Frecuencia respiratoria (rpm)', {
            req: true,
            ayuda: 'Rápida: ≥ 50 de 2 a 11 meses; ≥ 40 de 1 a 4 años.',
          }),
          b('tiraje', 'Tiraje subcostal'),
          b('estridor', 'Estridor en reposo'),
          b('sibilancias', 'Sibilancias'),
          i('saturacion_de_oxigeno', 'Saturación de oxígeno (%)'),
          una(
            'clasificacion_aiepi',
            'Clasificación',
            [
              'Neumonía grave o enfermedad muy grave',
              'Neumonía',
              'Tos o resfriado',
            ],
            { req: true },
          ),
        ],
        educacion: [
          'Signos para volver de inmediato',
          'Alimentación y líquidos',
          'Antibiótico completo si corresponde',
        ],
      }),
  },
  {
    code: 'PEDIA_CTRL_EDA',
    carpeta: 'pediatria',
    nombre: 'Niño con diarrea (AIEPI)',
    fuente: 'OMS_AIEPI',
    nota: 'Estado de hidratación y planes A/B/C, disentería y diarrea persistente.',
    campos: () =>
      control({
        condicion: 'diarrea',
        ...AGUDO,
        evaluacion: [
          i('edad_en_meses', 'Edad (meses)', { req: true }),
          varias(
            'signos_de_peligro',
            'Signos generales de peligro',
            SIGNOS_DE_PELIGRO,
            { req: true },
          ),
          ...EDA(),
          i('dias_de_diarrea', 'Días de diarrea', {
            ayuda: '14 o más: diarrea persistente.',
          }),
          d('peso_kg', 'Peso (kg)'),
        ],
        educacion: [
          'Sales de rehidratación oral',
          'Zinc por 10 a 14 días',
          'Seguir alimentando',
          'Signos para volver',
        ],
      }),
  },
  {
    code: 'PEDIA_CTRL_DESNUTRICION',
    carpeta: 'pediatria',
    nombre: 'Control de desnutrición aguda',
    fuente: 'OMS_DESNUTRICION',
    nota: 'Puntaje Z peso/talla, perímetro braquial, edema y prueba del apetito.',
    campos: () =>
      control({
        condicion: 'desnutrición aguda',
        evaluacion: [
          i('edad_en_meses', 'Edad (meses)', { req: true }),
          d('peso_kg', 'Peso (kg)', { req: true }),
          d('talla_cm', 'Talla (cm)', { req: true }),
          d('z_peso_talla', 'Z peso/talla', { req: true }),
          d('perimetro_braquial', 'Perímetro braquial (mm)'),
          b('edema_bilateral', 'Edema bilateral'),
          una('prueba_apetito', 'Prueba del apetito', [
            'Pasa',
            'No pasa',
            'No realizada',
          ]),
          una(
            'desnutricion_clasificacion',
            'Clasificación',
            [
              'Aguda moderada',
              'Aguda grave sin complicaciones',
              'Aguda grave complicada',
            ],
            { req: true },
          ),
        ],
        metas: ['Ganancia de peso ≥ 5 g/kg/día', 'Z peso/talla ≥ −2'],
        educacion: ['Alimento terapéutico', 'Lactancia', 'Higiene'],
      }),
  },
  {
    code: 'PEDIA_CTRL_ASMA',
    carpeta: 'pediatria',
    nombre: 'Control de asma en niños',
    fuente: 'GINA',
    nota: 'Control de síntomas de las últimas 4 semanas según las categorías de GINA y técnica con espaciador.',
    campos: () =>
      control({
        condicion: 'asma',
        evaluacion: [
          ...ASMA(),
          una(
            'espaciador',
            'Usa espaciador',
            ['Sí, correctamente', 'Sí, con errores', 'No'],
            { req: true },
          ),
          i('dias_escuela_perdidos', 'Días de escuela perdidos en el mes'),
        ],
        metas: ['Asma controlada', 'Sin crisis'],
        educacion: [
          'Técnica con espaciador',
          'Plan de acción',
          'Evitar humo de tabaco y leña',
        ],
      }),
  },
  {
    code: 'PEDIA_RECIEN_NACIDO',
    carpeta: 'pediatria',
    nombre: 'Atención del recién nacido',
    fuente: 'OMS_POSTNATAL',
    nota: 'Apgar, antropometría, tamizajes y signos de peligro del recién nacido.',
    campos: () =>
      control({
        condicion: 'recién nacido',
        modo: 'evaluacion',
        evaluacion: [
          i('apgar_1', 'Apgar al minuto', { req: true }),
          i('apgar_5', 'Apgar a los 5 minutos', { req: true }),
          i('edad_gestacional', 'Edad gestacional (semanas)', { req: true }),
          d('peso_g', 'Peso al nacer (g)', { req: true }),
          d('talla_cm', 'Talla (cm)'),
          d('perimetro_cefalico_cm', 'Perímetro cefálico (cm)'),
          b('lactancia_primera_hora', 'Lactancia en la primera hora'),
          varias('tamizajes_rn', 'Tamizajes', [
            'Metabólico',
            'Auditivo',
            'Cardiopatía (oximetría)',
            'Reflejo rojo',
          ]),
          varias(
            'signos_peligro_rn',
            'Signos de peligro',
            [
              'No se alimenta bien',
              'Convulsiones',
              'Respiración rápida (≥ 60)',
              'Tiraje',
              'Fiebre o hipotermia',
              'Ictericia en las primeras 24 h',
              'Ninguno',
            ],
            { req: true },
          ),
          b('vacunas_rn', 'BCG y hepatitis B aplicadas'),
        ],
      }),
  },
  {
    code: 'GINOBS_CONSULTA_GINECOLOGICA',
    carpeta: 'ginecologia-obstetricia',
    nombre: 'Consulta ginecológica (base)',
    fuente: 'MINSA_NT022',
    nota: 'Ficha base de ginecología: antecedentes gineco-obstétricos, ciclo, anticoncepción, tamizajes y examen.',
    campos: () =>
      control({
        condicion: 'consulta ginecológica',
        modo: 'evaluacion',
        evaluacion: [
          t('motivo_consulta', 'Motivo de consulta', { req: true }),
          i('menarca', 'Menarca (edad)'),
          f('fum', 'Fecha de última menstruación'),
          una('ciclo', 'Ciclo', [
            'Regular',
            'Irregular',
            'Amenorrea',
            'Menopausia',
          ]),
          i('gestas', 'Gestas'),
          i('partos', 'Partos'),
          i('cesareas', 'Cesáreas'),
          i('abortos', 'Abortos'),
          una('anticoncepcion', 'Anticoncepción', [
            'Ninguna',
            'Preservativo',
            'Hormonal',
            'DIU',
            'Implante',
            'Quirúrgica',
          ]),
          una('ultimo_tamizaje_cervix', 'Último tamizaje de cuello uterino', [
            'Menos de 3 años',
            '3 a 5 años',
            'Más de 5 años',
            'Nunca',
          ]),
          varias('sintomas_gineco', 'Síntomas', [
            'Flujo anormal',
            'Dolor pélvico',
            'Sangrado anormal',
            'Dispareunia',
            'Bulto en la mama',
            'Ninguno',
          ]),
          t('examen_ginecologico', 'Examen ginecológico y mamario'),
        ],
      }),
  },
  {
    code: 'GINOBS_CTRL_TAMIZAJE_CERVIX',
    carpeta: 'ginecologia-obstetricia',
    nombre: 'Tamizaje de cáncer de cuello uterino',
    fuente: 'OMS_CERVIX',
    nota: 'Estrategia de la OMS: prueba de VPH o IVAA, resultado y tratamiento de lesiones.',
    campos: () =>
      control({
        condicion: 'tamizaje de cuello uterino',
        modo: 'evaluacion',
        evaluacion: [
          una(
            'prueba_tamizaje',
            'Prueba',
            ['VPH', 'IVAA', 'Citología (Papanicolaou)'],
            { req: true },
          ),
          una(
            'resultado_tamizaje',
            'Resultado',
            ['Negativo', 'Positivo', 'No concluyente'],
            { req: true },
          ),
          ...si('resultado_tamizaje', 'Positivo', [
            una(
              'conducta_tamizaje',
              'Conducta',
              [
                'Tratamiento ablativo (crioterapia o termoablación)',
                'Escisión (LEEP)',
                'Colposcopía',
                'Derivación por sospecha de cáncer',
              ],
              { req: true },
            ),
          ]),
          b('vih_positiva', 'Mujer con VIH (tamizaje más frecuente)'),
          f('proximo_tamizaje', 'Próximo tamizaje'),
        ],
      }),
  },
  {
    code: 'GINOBS_CTRL_PUERPERIO',
    carpeta: 'ginecologia-obstetricia',
    nombre: 'Control de puerperio',
    fuente: 'OMS_POSTNATAL',
    nota: 'Contactos posnatales de la OMS: sangrado, infección, presión, lactancia, ánimo y anticoncepción.',
    campos: () =>
      control({
        condicion: 'puerperio',
        modo: 'evaluacion',
        evaluacion: [
          una('tipo_parto', 'Tipo de parto', ['Vaginal', 'Cesárea'], {
            req: true,
          }),
          i('dias_posparto', 'Días posparto', { req: true }),
          ...PA(),
          d('temperatura', 'Temperatura (°C)'),
          una('loquios', 'Loquios', ['Normales', 'Abundantes', 'Fétidos']),
          una('involucion_uterina', 'Involución uterina', [
            'Adecuada',
            'Subinvolución',
          ]),
          una('lactancia', 'Lactancia', [
            'Exclusiva',
            'Mixta',
            'Sin lactancia',
          ]),
          varias('animo_puerperio', 'Ánimo', [
            'Tristeza persistente',
            'Ansiedad',
            'Ideas de hacerse daño',
            'Ninguno',
          ]),
          una('anticoncepcion_posparto', 'Anticoncepción', [
            'Elegida e iniciada',
            'Elegida, pendiente',
            'No desea',
          ]),
        ],
      }),
  },
  {
    code: 'OBST_CTRL_HIPERTENSION',
    carpeta: 'obstetricia',
    nombre: 'Trastorno hipertensivo del embarazo',
    fuente: 'OMS_ANC',
    nota: 'Presión, proteinuria y criterios de gravedad de preeclampsia; sulfato de magnesio y momento del parto.',
    campos: () =>
      control({
        condicion: 'hipertensión en el embarazo',
        evaluacion: [
          i('edad_gestacional_semanas', 'Edad gestacional (semanas)', {
            req: true,
          }),
          ...PA(),
          una('proteinuria', 'Proteinuria', ['Negativa', '+', '++', '+++'], {
            req: true,
          }),
          varias(
            'criterios_gravedad',
            'Criterios de gravedad',
            [
              'PA ≥ 160/110',
              'Cefalea o alteración visual',
              'Dolor en epigastrio',
              'Plaquetas < 100 000',
              'Transaminasas elevadas',
              'Oliguria',
              'Edema pulmonar',
              'Ninguno',
            ],
            { req: true },
          ),
          b('sulfato_magnesio', 'Recibe sulfato de magnesio'),
          i('frecuencia_cardiaca_fetal', 'Frecuencia cardíaca fetal (lpm)'),
        ],
        educacion: [
          'Signos de alarma',
          'Aspirina en dosis baja si corresponde',
        ],
      }),
  },
  {
    code: 'OBST_CTRL_DIABETES_GESTACIONAL',
    carpeta: 'obstetricia',
    nombre: 'Control de diabetes gestacional',
    fuente: 'OMS_ANC',
    nota: 'Glucemias de ayuno y posprandiales, crecimiento fetal y tratamiento.',
    campos: () =>
      control({
        condicion: 'diabetes gestacional',
        evaluacion: [
          i('edad_gestacional_semanas', 'Edad gestacional (semanas)', {
            req: true,
          }),
          d('glucemia_ayunas', 'Glucemia en ayunas (mg/dL)', { req: true }),
          d('glucemia_posprandial', 'Glucemia 1 h posprandial (mg/dL)'),
          una('tratamiento_dg', 'Tratamiento', [
            'Dieta',
            'Metformina',
            'Insulina',
          ]),
          d('altura_uterina_cm', 'Altura uterina (cm)'),
          s('ecografia_crecimiento', 'Ecografía — percentil de crecimiento'),
        ],
        metas: ['Ayunas < 95 mg/dL', '1 h posprandial < 140 mg/dL'],
        educacion: [
          'Alimentación',
          'Automonitoreo',
          'Tamizaje posparto a las 4–12 semanas',
        ],
      }),
  },
  {
    code: 'OBST_TRABAJO_DE_PARTO',
    carpeta: 'obstetricia',
    nombre: 'Trabajo de parto (guía de cuidados de la OMS)',
    fuente: 'OMS_PARTO',
    nota: 'Variables de la Labour Care Guide de la OMS: bienestar materno y fetal y progreso del trabajo de parto.',
    campos: () =>
      control({
        condicion: 'trabajo de parto',
        modo: 'evaluacion',
        evaluacion: [
          s('hora_evaluacion', 'Hora de la evaluación', { req: true }),
          i('dilatacion_cm', 'Dilatación (cm)', { req: true }),
          una('descenso', 'Descenso', [
            '5/5',
            '4/5',
            '3/5',
            '2/5',
            '1/5',
            '0/5',
          ]),
          i('contracciones_10min', 'Contracciones en 10 minutos'),
          i('frecuencia_cardiaca_fetal', 'Frecuencia cardíaca fetal (lpm)', {
            req: true,
          }),
          una('liquido_amniotico', 'Líquido amniótico', [
            'Íntegras',
            'Claro',
            'Meconial',
            'Sanguinolento',
          ]),
          ...PA(),
          b('acompanante', 'Tiene acompañante de su elección'),
        ],
      }),
  },

  /* ---- Odontología, nutrición, fisioterapia, enfermería, deporte ---- */
  {
    code: 'ODONTO_CTRL_PERIODONTAL',
    carpeta: 'odontologia',
    nombre: 'Evaluación periodontal',
    fuente: 'OMS_ORAL',
    nota: 'Índice periodontal comunitario (sangrado y bolsas) de los métodos de encuesta de salud bucal de la OMS.',
    campos: () =>
      control({
        condicion: 'enfermedad periodontal',
        evaluacion: [
          una(
            'sangrado_gingival',
            'Sangrado al sondaje',
            ['Ausente', 'Presente'],
            { req: true },
          ),
          una(
            'bolsas',
            'Bolsas periodontales',
            ['Sin bolsas', '4–5 mm', '6 mm o más'],
            { req: true },
          ),
          b('movilidad', 'Movilidad dentaria'),
          varias('factores_perio', 'Factores', [
            'Tabaco',
            'Diabetes',
            'Higiene deficiente',
            'Embarazo',
          ]),
        ],
        educacion: ['Técnica de cepillado', 'Hilo dental', 'Dejar de fumar'],
      }),
  },
  {
    code: 'NUTRI_CTRL_OBESIDAD',
    carpeta: 'nutricion',
    nombre: 'Control nutricional de sobrepeso y obesidad',
    fuente: 'OMS_OBESIDAD',
    nota: 'Antropometría, cambio de peso, hábitos y metas.',
    campos: () =>
      control({
        condicion: 'sobrepeso u obesidad',
        evaluacion: [
          d('peso_kg', 'Peso (kg)', { req: true }),
          d('imc', 'IMC (kg/m²)'),
          d('perimetro_abdominal_cm', 'Perímetro abdominal (cm)'),
          d('cambio_de_peso_kg', 'Cambio desde el último control (kg)'),
          varias('consumo_frecuente', 'Consumo frecuente', [
            'Bebidas azucaradas',
            'Frituras',
            'Comida rápida',
            'Frutas y verduras',
          ]),
          una('actividad_fisica', 'Actividad física', [
            'Sedentario',
            'Menos de 150 min por semana',
            '150 min o más',
          ]),
        ],
        metas: ['Bajó 5 % del peso', 'Sin bebidas azucaradas'],
        educacion: ['Plato saludable', 'Porciones', 'Actividad física'],
      }),
  },
  {
    code: 'NUTRI_CTRL_DIABETES',
    carpeta: 'nutricion',
    nombre: 'Plan alimentario en diabetes',
    fuente: 'OMS_HEARTS_D',
    nota: 'Recordatorio, distribución de carbohidratos y glucemias.',
    campos: () =>
      control({
        condicion: 'diabetes',
        evaluacion: [
          d('peso_kg', 'Peso (kg)', { req: true }),
          d('hba1c', 'Última HbA1c (%)'),
          i('comidas_al_dia', 'Comidas al día'),
          t('recordatorio_24h', 'Recordatorio de 24 horas'),
          b('hipoglucemias', 'Hipoglucemias'),
        ],
        educacion: [
          'Conteo de carbohidratos',
          'Horarios regulares',
          'Qué hacer en una hipoglucemia',
        ],
      }),
  },
  {
    code: 'FISIO_CTRL_LUMBALGIA',
    carpeta: 'fisioterapia',
    nombre: 'Rehabilitación de lumbalgia',
    fuente: 'MINSA_NT022',
    nota: 'Banderas rojas, dolor, función y progreso del ejercicio.',
    campos: () =>
      control({
        condicion: 'lumbalgia',
        evaluacion: [
          ...LUMBALGIA(),
          i('dolor_intensidad', 'Dolor (0 a 10)', { req: true }),
          i('sesion_numero', 'Sesión número'),
          t('ejercicios', 'Ejercicios indicados'),
        ],
        metas: ['Dolor ≤ 3', 'Volvió a sus actividades'],
      }),
  },
  {
    code: 'FISIO_CTRL_NEUROLOGICA',
    carpeta: 'fisioterapia',
    nombre: 'Rehabilitación neurológica (secuela de ACV)',
    fuente: 'MINSA_NT022',
    nota: 'Independencia por índice de Barthel (dominio público), marcha y equilibrio.',
    campos: () =>
      control({
        condicion: 'secuela neurológica',
        evaluacion: [
          i('barthel', 'Índice de Barthel (0–100)', { req: true }),
          una('marcha', 'Marcha', [
            'Independiente',
            'Con bastón',
            'Con andador',
            'No camina',
          ]),
          una('fuerza_mrc', 'Fuerza del lado afectado (MRC)', [
            '5',
            '4',
            '3',
            '2',
            '1',
            '0',
          ]),
          b('espasticidad', 'Espasticidad'),
          i('sesion_numero', 'Sesión número'),
        ],
      }),
  },
  {
    code: 'ENFER_CTRL_HERIDAS',
    carpeta: 'enfermeria',
    nombre: 'Curación y control de heridas',
    fuente: 'MINSA_NT022',
    nota: 'Tipo, dimensiones, lecho, exudado, signos de infección y estadio de lesión por presión.',
    campos: () =>
      control({
        condicion: 'herida',
        ...AGUDO,
        evaluacion: [
          una(
            'tipo_herida',
            'Tipo',
            [
              'Quirúrgica',
              'Traumática',
              'Lesión por presión',
              'Úlcera venosa',
              'Pie diabético',
              'Quemadura',
            ],
            { req: true },
          ),
          ...si('tipo_herida', 'Lesión por presión', [
            una(
              'upp_estadio',
              'Estadio',
              ['1', '2', '3', '4', 'No estadificable'],
              { req: true },
            ),
          ]),
          s('dimensiones', 'Largo × ancho × profundidad (cm)'),
          una('lecho', 'Lecho', [
            'Granulación',
            'Esfacelo',
            'Necrosis',
            'Epitelización',
          ]),
          una('exudado', 'Exudado', [
            'Ninguno',
            'Escaso',
            'Moderado',
            'Abundante',
          ]),
          varias('infeccion', 'Signos de infección', [
            'Calor',
            'Rubor',
            'Dolor creciente',
            'Mal olor',
            'Secreción purulenta',
            'Ninguno',
          ]),
          s('aposito', 'Apósito utilizado'),
        ],
      }),
  },
  {
    code: 'MEDEP_PREPARTICIPATIVA',
    carpeta: 'medicina-deportiva',
    nombre: 'Evaluación preparticipativa deportiva',
    fuente: 'MINSA_NT022',
    nota: 'Tamizaje cardiovascular para muerte súbita: síntomas con esfuerzo, antecedente familiar, examen y ECG.',
    campos: () =>
      control({
        condicion: 'aptitud deportiva',
        modo: 'evaluacion',
        evaluacion: [
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
          b(
            'muerte_subita_familiar',
            'Familiar con muerte súbita antes de los 50 años',
            { req: true },
          ),
          b('soplo', 'Soplo'),
          ...PA(),
          s('ecg', 'ECG de reposo — hallazgo'),
          una(
            'aptitud',
            'Aptitud',
            ['Apto', 'Apto con restricciones', 'No apto temporal', 'No apto'],
            { req: true },
          ),
        ],
      }),
  },

  /* ---- Informes ---- */
  {
    code: 'RADIO_INFORME_MAMOGRAFIA',
    carpeta: 'radiologia',
    nombre: 'Informe de mamografía',
    fuente: 'ACR_BIRADS',
    nota: 'Composición mamaria, hallazgos y categoría BI-RADS (0 a 6) con su conducta.',
    campos: () =>
      informeDe('mamografía', [
        una(
          'tipo_de_mamografia',
          'Tipo',
          ['Tamizaje', 'Diagnóstica', 'Control'],
          { req: true },
        ),
        una('composicion', 'Composición mamaria', [
          'a — grasa',
          'b — densidades fibroglandulares dispersas',
          'c — heterogéneamente densa',
          'd — extremadamente densa',
        ]),
        varias(
          'hallazgos_mama',
          'Hallazgos',
          [
            'Nódulo',
            'Calcificaciones',
            'Distorsión de la arquitectura',
            'Asimetría',
            'Adenopatía axilar',
            'Ninguno',
          ],
          { req: true },
        ),
        una(
          'birads',
          'Categoría BI-RADS',
          [
            '0 — incompleto',
            '1 — negativo',
            '2 — benigno',
            '3 — probablemente benigno',
            '4 — sospechoso',
            '5 — altamente sugestivo de malignidad',
            '6 — malignidad confirmada',
          ],
          { req: true },
        ),
      ]),
  },
  {
    code: 'RADIO_INFORME_RX_TORAX',
    carpeta: 'radiologia',
    nombre: 'Informe de radiografía de tórax',
    fuente: 'MINSA_NT022',
    nota: 'Lectura sistemática: técnica, partes blandas, huesos, mediastino, corazón, pulmones y pleura.',
    campos: () =>
      informeDe('radiografía de tórax', [
        una('proyeccion', 'Proyección', ['PA', 'AP', 'Lateral'], { req: true }),
        una('tecnica_adecuada', 'Técnica', [
          'Adecuada',
          'Rotada',
          'Subpenetrada',
          'Inspiración insuficiente',
        ]),
        varias(
          'hallazgos_torax',
          'Hallazgos',
          [
            'Consolidación',
            'Infiltrado intersticial',
            'Derrame pleural',
            'Neumotórax',
            'Cardiomegalia',
            'Nódulo o masa',
            'Cavitación',
            'Sin hallazgos',
          ],
          { req: true },
        ),
        d('indice_cardiotoracico', 'Índice cardiotorácico'),
      ]),
  },
  {
    code: 'RADIO_INFORME_ECO_OBSTETRICA',
    carpeta: 'radiologia',
    nombre: 'Informe de ecografía obstétrica',
    fuente: 'OMS_ANC',
    nota: 'Biometría, edad gestacional, líquido, placenta y vitalidad (recomendada antes de las 24 semanas por la OMS).',
    campos: () =>
      informeDe('ecografía obstétrica', [
        i('numero_fetos', 'Número de fetos', { req: true }),
        b('actividad_cardiaca', 'Actividad cardíaca presente', { req: true }),
        s('biometria', 'Biometría (DBP, CC, CA, LF)'),
        s('edad_gestacional_eco', 'Edad gestacional por ecografía'),
        una('presentacion', 'Presentación', [
          'Cefálica',
          'Podálica',
          'Transversa',
        ]),
        una('placenta', 'Placenta', ['Normoinserta', 'Previa', 'Baja']),
        una('liquido', 'Líquido amniótico', [
          'Normal',
          'Oligoamnios',
          'Polihidramnios',
        ]),
      ]),
  },
  {
    code: 'PATOL_INFORME_CITOLOGIA_CERVICAL',
    carpeta: 'patologia-clinica',
    nombre: 'Informe de citología cervical',
    fuente: 'OMS_CERVIX',
    nota: 'Calidad de la muestra y categorías del sistema Bethesda.',
    campos: () =>
      informeDe('citología cervical', [
        una(
          'calidad_muestra',
          'Calidad de la muestra',
          ['Satisfactoria', 'Insatisfactoria'],
          { req: true },
        ),
        una(
          'bethesda',
          'Resultado (Bethesda)',
          [
            'Negativo para lesión intraepitelial o malignidad',
            'ASC-US',
            'ASC-H',
            'LSIL',
            'HSIL',
            'Carcinoma escamoso',
            'AGC',
            'Adenocarcinoma',
          ],
          { req: true },
        ),
        varias('microorganismos', 'Microorganismos', [
          'Trichomonas',
          'Cándida',
          'Vaginosis bacteriana',
          'Cambios por herpes',
          'Ninguno',
        ]),
      ]),
  },
  {
    code: 'BIOQ_INFORME_HEMOGRAMA',
    carpeta: 'bioquimica-clinica',
    nombre: 'Informe de hemograma',
    fuente: 'MINSA_NT022',
    nota: 'Serie roja, blanca y plaquetas con valores de referencia; la hemoglobina se interpreta según la altitud.',
    campos: () =>
      informeDe('hemograma', [
        d('hemoglobina', 'Hemoglobina (g/dL)', { req: true }),
        d('hematocrito', 'Hematocrito (%)'),
        d('vcm', 'VCM (fL)'),
        d('hcm', 'HCM (pg)'),
        i('leucocitos', 'Leucocitos (/µL)', { req: true }),
        d('neutrofilos_pct', 'Neutrófilos (%)'),
        d('linfocitos_pct', 'Linfocitos (%)'),
        d('eosinofilos_pct', 'Eosinófilos (%)'),
        i('plaquetas', 'Plaquetas (/µL)', { req: true }),
        s('frotis', 'Frotis de sangre periférica'),
        s('altitud', 'Altitud del laboratorio (m s. n. m.)'),
      ]),
  },
  {
    code: 'BIOQ_INFORME_ORINA',
    carpeta: 'bioquimica-clinica',
    nombre: 'Informe de examen general de orina',
    fuente: 'MINSA_NT022',
    nota: 'Examen físico, químico (tira) y sedimento.',
    campos: () =>
      informeDe('examen de orina', [
        una('aspecto', 'Aspecto', [
          'Transparente',
          'Ligeramente turbio',
          'Turbio',
        ]),
        d('densidad', 'Densidad'),
        d('ph', 'pH'),
        una('proteinas', 'Proteínas', ['Negativo', 'Trazas', '+', '++', '+++']),
        una('glucosa', 'Glucosa', ['Negativo', '+', '++', '+++']),
        una('nitritos', 'Nitritos', ['Negativo', 'Positivo'], { req: true }),
        una('leucocitos_tira', 'Esterasa leucocitaria', [
          'Negativo',
          '+',
          '++',
          '+++',
        ]),
        s(
          'sedimento',
          'Sedimento (leucocitos, hematíes, cilindros, cristales por campo)',
        ),
      ]),
  },
];
