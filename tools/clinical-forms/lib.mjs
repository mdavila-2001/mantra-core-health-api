/**
 * Piezas para escribir las fichas clínicas estándar (v2) sin repetir bloques.
 *
 * Una ficha es una lista de **secciones** —el esqueleto SOAP de la NT 022 del
 * MINSA: motivo, antecedentes, hábitos, examen, diagnóstico presuntivo,
 * observaciones dirigidas, plan— y cada sección, una lista de campos. Lo que
 * este archivo aporta son los constructores de campo y los bloques que todas
 * las fichas preguntan igual: alergias, antecedentes, medicación, hábitos
 * (AUDIT-C de la OMS), dolor (SOCRATES) y signos vitales.
 *
 * Tres reglas que nacen del reclamo del propietario (2026-10-02):
 *
 * - **Un «sí» que tiene detalle pregunta «¿cuál?».** El hijo lleva
 *   `showWhen: { field, equals }`, la semántica de `enableWhen` de HL7 FHIR
 *   Questionnaire con el operador `=` y el comportamiento `SHOW` que ya declara
 *   `CreateFieldDependencyDto`. Si el padre es de varias respuestas, `equals`
 *   se cumple cuando la respuesta **incluye** el valor —como en FHIR con un
 *   ítem repetible—, y si `equals` es una lista, basta con que coincida uno.
 * - **Una escala con categorías finitas se elige, no se escribe.** Elección
 *   única = `dataType: "string"` con `options` (se guarda la opción elegida
 *   en `value_string`); varias = `dataType: "json"` con `options` y
 *   `multiple: true` (se guarda la lista en `value_json`). No se usa `code`:
 *   ese tipo escribe en `value_concept_id`, que es un uuid de terminología, y
 *   las opciones de una ficha no son conceptos sembrados.
 * - **Lo que se observa depende de la enfermedad sospechada.** Cada ficha de
 *   consulta abre con un `diagnostico_presuntivo` y, por cada síndrome, un
 *   bloque que sólo se muestra al elegirlo.
 */

/** @typedef {{ field: string, equals: string | boolean | readonly (string|boolean)[] }} ShowWhen */

const OTRO = 'Otro';

/** Texto largo: relato, examen narrado, plan. */
export const t = (code, name, extra = {}) => campo(code, name, 'text', extra);
/** Texto corto. */
export const s = (code, name, extra = {}) => campo(code, name, 'string', extra);
/** Entero. La unidad va en el nombre. */
export const i = (code, name, extra = {}) =>
  campo(code, name, 'integer', extra);
/** Decimal. La unidad va en el nombre. */
export const d = (code, name, extra = {}) =>
  campo(code, name, 'decimal', extra);
/** Sí / No. */
export const b = (code, name, extra = {}) =>
  campo(code, name, 'boolean', extra);
/** Fecha. */
export const f = (code, name, extra = {}) => campo(code, name, 'date', extra);

/** Una sola respuesta de una lista cerrada. */
export const una = (code, name, options, extra = {}) =>
  campo(code, name, 'string', { ...extra, options: [...options] });

/** Varias respuestas de una lista cerrada. */
export const varias = (code, name, options, extra = {}) =>
  campo(code, name, 'json', {
    ...extra,
    options: [...options],
    multiple: true,
  });

function campo(code, name, dataType, extra) {
  const { req, otro, ayuda, ...resto } = extra;
  return {
    code,
    name,
    dataType,
    required: req === true,
    ...resto,
    ...(otro === true ? { allowOther: true } : {}),
    ...(ayuda === undefined ? {} : { description: ayuda }),
  };
}

/** Marca como obligatorio. */
export const obl = (c) => ({ ...c, required: true });

/**
 * Los campos sólo se muestran cuando `field` vale `equals`. Un campo que ya
 * dependía de otro (un nieto) no se reasigna.
 */
export function si(field, equals, campos) {
  // Un nieto conserva a su padre directo: se ve cuando su padre se ve **y**
  // su propia condición se cumple. La cadena la resuelve quien dibuja.
  return campos.map((c) =>
    c.showWhen === undefined ? { ...c, showWhen: { field, equals } } : c,
  );
}

/** Una sección: el nombre se copia a cada campo. */
export function seccion(nombre, campos) {
  return campos.flat().map((c) => ({ section: nombre, ...c }));
}

/* -- Bloques comunes ------------------------------------------------------ */

/** Motivo y tiempo de evolución. Los códigos varían entre fichas v1. */
export function motivo({
  tiempo = 'tiempo_de_evolucion',
  relato = null,
  tiempoReq = true,
} = {}) {
  return [
    obl(
      t('motivo_consulta', 'Motivo de consulta', {
        ayuda: 'Con las palabras del paciente.',
      }),
    ),
    ...(tiempo === null
      ? []
      : [
          s(tiempo, 'Tiempo de evolución', {
            req: tiempoReq,
            ayuda: 'Por ejemplo: 3 días, 2 semanas, 6 meses.',
          }),
        ]),
    ...(relato === null
      ? []
      : [
          obl(
            t(relato, 'Relato de la enfermedad actual', {
              ayuda:
                'Inicio, curso y síntomas acompañantes, en orden cronológico.',
            }),
          ),
        ]),
  ];
}

/** Las enfermedades crónicas que se preguntan en toda primera consulta en Bolivia. */
export const CRONICAS = [
  'Hipertensión arterial',
  'Diabetes mellitus',
  'Asma',
  'EPOC',
  'Cardiopatía',
  'Enfermedad renal crónica',
  'Enfermedad tiroidea',
  'Cáncer',
  'Tuberculosis',
  'Enfermedad de Chagas',
  'Epilepsia',
  'VIH',
  'Ninguna',
];

/**
 * Antecedentes personales: se marcan los crónicos y el detalle queda en el
 * campo de texto de la v1 (`detalle`), que conserva su código.
 */
export function antecedentes(
  detalle = 'antecedentes_patologicos',
  etiqueta = 'Antecedentes patológicos',
) {
  return [
    varias(
      'antecedentes_cronicos',
      'Enfermedades crónicas conocidas',
      CRONICAS,
      { otro: true },
    ),
    t(detalle, `${etiqueta} — detalle`, {
      ayuda: 'Año de diagnóstico, tratamiento y si está controlada.',
    }),
  ];
}

/** Alergias: sí/no → a qué y qué reacción. El detalle conserva el código v1. */
export function alergias(detalle = 'alergias') {
  return [
    b('tiene_alergias', '¿Tiene alergias conocidas?'),
    ...si('tiene_alergias', true, [
      varias(
        'tipo_de_alergia',
        '¿A qué es alérgico?',
        [
          'Medicamentos',
          'Alimentos',
          'Látex',
          'Picadura de insectos',
          'Polen, polvo o ácaros',
        ],
        { otro: true, req: true },
      ),
      t(detalle, '¿Cuál exactamente y qué reacción le produjo?', {
        ayuda: 'Por ejemplo: penicilina → urticaria; AINE → broncoespasmo.',
      }),
    ]),
  ];
}

/** Medicación habitual: sí/no → cuál. */
export function medicacion(detalle = 'medicacion_habitual') {
  return [
    b('toma_medicacion', '¿Toma algún medicamento de forma habitual?'),
    ...si('toma_medicacion', true, [
      t(detalle, '¿Cuál? Nombre, dosis y frecuencia', { req: true }),
    ]),
  ];
}

/** Cirugías previas: sí/no → cuáles. */
export function quirurgicos(detalle = 'antecedentes_quirurgicos') {
  return [
    b('tuvo_cirugias', '¿Tuvo cirugías previas?'),
    ...si('tuvo_cirugias', true, [
      t(detalle, '¿Cuáles y en qué año?', { req: true }),
    ]),
  ];
}

export const TABACO = ['Nunca fumó', 'Exfumador', 'Fumador actual'];

/**
 * Tabaco, alcohol (AUDIT-C de la OMS, preguntas 1 a 3 del AUDIT) y otras
 * sustancias. Los rótulos de las opciones del AUDIT-C siguen la versión en
 * castellano publicada por la OMS (WHO/MSD/MSB/01.6a).
 */
export function habitos() {
  return [
    una('tabaco', 'Consumo de tabaco', TABACO),
    ...si('tabaco', 'Fumador actual', [
      i('cigarrillos_por_dia', 'Cigarrillos por día'),
      i('anios_fumando', 'Años fumando'),
    ]),
    ...si('tabaco', 'Exfumador', [
      i('anios_sin_fumar', 'Años desde que dejó de fumar'),
    ]),
    una(
      'audit_c_frecuencia',
      '¿Con qué frecuencia consume alguna bebida alcohólica? (AUDIT-C 1)',
      [
        'Nunca',
        'Una o menos veces al mes',
        'De 2 a 4 veces al mes',
        'De 2 a 3 veces a la semana',
        '4 o más veces a la semana',
      ],
    ),
    ...si(
      'audit_c_frecuencia',
      [
        'Una o menos veces al mes',
        'De 2 a 4 veces al mes',
        'De 2 a 3 veces a la semana',
        '4 o más veces a la semana',
      ],
      [
        una(
          'audit_c_cantidad',
          '¿Cuántas consumiciones toma en un día de consumo normal? (AUDIT-C 2)',
          ['1 o 2', '3 o 4', '5 o 6', '7 a 9', '10 o más'],
        ),
        una(
          'audit_c_seis_o_mas',
          '¿Con qué frecuencia toma 6 o más bebidas en una sola ocasión? (AUDIT-C 3)',
          [
            'Nunca',
            'Menos de una vez al mes',
            'Mensualmente',
            'Semanalmente',
            'A diario o casi a diario',
          ],
        ),
      ],
    ),
    b('otras_sustancias', '¿Consume otras sustancias?'),
    ...si('otras_sustancias', true, [
      varias(
        'otras_sustancias_cuales',
        '¿Cuáles?',
        [
          'Hoja de coca (acullicu)',
          'Marihuana',
          'Cocaína o pasta base',
          'Sedantes sin receta',
        ],
        { otro: true, req: true },
      ),
    ]),
  ];
}

/** Antecedentes familiares de primer grado. */
export function familiares(detalle = 'antecedentes_familiares') {
  return [
    varias(
      'antecedentes_familiares_marcados',
      'Antecedentes familiares (padres, hermanos, hijos)',
      [
        'Hipertensión arterial',
        'Diabetes mellitus',
        'Cardiopatía isquémica antes de los 55 (H) o 65 (M) años',
        'Accidente cerebrovascular',
        'Cáncer',
        'Enfermedad mental',
        'Ninguno conocido',
      ],
      { otro: true },
    ),
    t(detalle, 'Antecedentes familiares — detalle', {
      ayuda: 'Parentesco y edad al diagnóstico.',
    }),
  ];
}

/**
 * Signos vitales. `codigos` permite conservar los de la v1 de cada ficha; un
 * signo con código `null` no se pregunta.
 */
export function vitales(codigos = {}, requeridos = []) {
  const c = {
    pas: 'presion_arterial_sistolica',
    pad: 'presion_arterial_diastolica',
    pa: null,
    fc: 'frecuencia_cardiaca',
    fr: 'frecuencia_respiratoria',
    temp: 'temperatura',
    sat: 'saturacion_de_oxigeno',
    peso: 'peso_kg',
    talla: 'talla_cm',
    ...codigos,
  };
  const r = (k) => requeridos.includes(k);
  return [
    ...(c.pa
      ? [
          s(c.pa, 'Presión arterial (mmHg, sistólica/diastólica)', {
            req: r('pa'),
            ayuda: 'Por ejemplo: 120/80.',
          }),
        ]
      : []),
    ...(c.pas
      ? [i(c.pas, 'Presión arterial sistólica (mmHg)', { req: r('pas') })]
      : []),
    ...(c.pad
      ? [i(c.pad, 'Presión arterial diastólica (mmHg)', { req: r('pad') })]
      : []),
    ...(c.fc ? [i(c.fc, 'Frecuencia cardíaca (lpm)', { req: r('fc') })] : []),
    ...(c.fr
      ? [i(c.fr, 'Frecuencia respiratoria (rpm)', { req: r('fr') })]
      : []),
    ...(c.temp
      ? [d(c.temp, 'Temperatura axilar (°C)', { req: r('temp') })]
      : []),
    ...(c.sat
      ? [i(c.sat, 'Saturación de oxígeno (%)', { req: r('sat') })]
      : []),
    ...(c.peso ? [d(c.peso, 'Peso (kg)', { req: r('peso') })] : []),
    ...(c.talla ? [d(c.talla, 'Talla (cm)', { req: r('talla') })] : []),
  ];
}

export const CARACTER_DEL_DOLOR = [
  'Opresivo',
  'Punzante',
  'Urente (ardor)',
  'Cólico',
  'Pulsátil',
  'Sordo',
  'Lancinante',
  'Eléctrico o en descarga',
];

/**
 * Semiología del dolor por SOCRATES (sitio, inicio, carácter, irradiación,
 * asociados, tiempo, factores, severidad), con prefijo para que dos dolores en
 * una misma ficha no choquen. Cuelga de `padre` = `equals`.
 */
export function socrates(
  prefijo,
  padre,
  equals,
  { sitio = true, caracter = null } = {},
) {
  const p = (x) => `${prefijo}_${x}`;
  return si(padre, equals, [
    ...(sitio
      ? [s(p('localizacion'), 'Dolor — ¿dónde se localiza?', { req: true })]
      : []),
    una(p('inicio'), 'Dolor — inicio', ['Súbito', 'Progresivo']),
    caracter === null
      ? una(p('caracter'), 'Dolor — carácter', CARACTER_DEL_DOLOR, {
          otro: true,
        })
      : caracter,
    b(p('irradiado'), 'Dolor — ¿se irradia?'),
    ...si(p('irradiado'), true, [
      s(p('irradiacion'), '¿Hacia dónde se irradia?', { req: true }),
    ]),
    i(p('intensidad'), 'Dolor — intensidad (0 a 10, escala numérica)', {
      req: true,
      ayuda: '0 = sin dolor; 10 = el peor dolor imaginable.',
    }),
    una(p('patron'), 'Dolor — patrón temporal', [
      'Continuo',
      'Intermitente',
      'Nocturno',
      'Con el esfuerzo',
      'Posprandial',
    ]),
    t(p('agravantes_atenuantes'), 'Dolor — qué lo agrava y qué lo alivia'),
  ]);
}

/**
 * El diagnóstico presuntivo y los bloques que cada uno abre.
 *
 * `bloques` es `{ 'Nombre del síndrome': campos[] }`; el orden de las claves es
 * el de las opciones. Siempre se agrega «Otro» con texto libre.
 */
export function sospecha(
  bloques,
  {
    code = 'diagnostico_presuntivo',
    nombre = 'Diagnóstico presuntivo (lo que se sospecha)',
  } = {},
) {
  const sindromes = Object.keys(bloques);
  return [
    una(code, nombre, sindromes, {
      otro: true,
      req: true,
      ayuda:
        'Al elegirlo se abren las observaciones que ese cuadro exige registrar.',
    }),
    ...sindromes.flatMap((sindrome) => si(code, sindrome, bloques[sindrome])),
  ];
}

/** El cierre de toda consulta: diagnóstico final (CIE-10) y conducta. */
export function cierre({
  diagnostico = 'diagnostico',
  plan = 'conducta',
  planNombre = 'Conducta y plan',
} = {}) {
  return [
    obl(t(diagnostico, 'Diagnóstico (con código CIE-10 si se conoce)')),
    t(plan, planNombre, {
      ayuda:
        'Tratamiento, estudios pedidos, educación, interconsultas y control.',
    }),
  ];
}

/* -- Validación ----------------------------------------------------------- */

/**
 * Rechaza una ficha mal armada antes de escribirla. Es la misma regla que
 * aplica `catalog.ts` al cargar, adelantada al momento de escribir.
 */
export function validarFicha(ficha) {
  const errores = [];
  const vistos = new Map();
  for (const c of ficha.fields) {
    if (vistos.has(c.code)) errores.push(`código repetido «${c.code}»`);
    if (c.options !== undefined) {
      if (c.options.length === 0) errores.push(`${c.code}: options vacío`);
      if (new Set(c.options).size !== c.options.length)
        errores.push(`${c.code}: opción repetida`);
      if (c.multiple === true && c.dataType !== 'json')
        errores.push(`${c.code}: varias respuestas exige json`);
      if (c.multiple !== true && c.dataType !== 'string')
        errores.push(`${c.code}: una respuesta exige string`);
    }
    if (c.showWhen !== undefined) {
      const padre = vistos.get(c.showWhen.field);
      if (padre === undefined) {
        errores.push(
          `${c.code}: showWhen apunta a «${c.showWhen.field}», que no está antes en la ficha`,
        );
      } else {
        const valores = Array.isArray(c.showWhen.equals)
          ? c.showWhen.equals
          : [c.showWhen.equals];
        for (const v of valores) {
          if (padre.dataType === 'boolean' && typeof v !== 'boolean')
            errores.push(
              `${c.code}: padre sí/no y equals ${JSON.stringify(v)}`,
            );
          if (padre.options !== undefined && !padre.options.includes(v))
            errores.push(`${c.code}: «${v}» no es opción de ${padre.code}`);
          if (padre.dataType !== 'boolean' && padre.options === undefined)
            errores.push(
              `${c.code}: el padre ${padre.code} no es sí/no ni de elección`,
            );
        }
      }
    }
    vistos.set(c.code, c);
  }
  if (errores.length > 0)
    throw new Error(`Ficha ${ficha.code}:\n  - ${errores.join('\n  - ')}`);
}

export { OTRO };
