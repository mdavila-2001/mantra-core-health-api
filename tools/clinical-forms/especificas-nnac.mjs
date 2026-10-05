/**
 * Fichas específicas por condición — una por cada norma de las Normas
 * Nacionales de Atención Clínica (NNAC) del Ministerio de Salud y Deportes de
 * Bolivia, de dos ediciones:
 *
 * - **2012**, unidades 1 a 14 del libro (`nnac/nnac-norms.json`, `parse-nnac.mjs`);
 * - **2025** (RM 0456, 30/09/2025), seis volúmenes por especialidad: Medicina
 *   Interna, Terapia Intensiva, Traumatología, Urgencias y Emergencias,
 *   Neurología y Pediatría (`nnac/nnac-norms-2025.json`, `parse-nnac2025.mjs`).
 *
 * Para una misma enfermedad se publica **una sola ficha**: la de 2025 sustituye
 * a la de 2012 salvo que la de 2012 traiga más contenido (`SUSTITUYE`).
 *
 * No se escribe a mano ningún ítem clínico: cada opción es una viñeta de la
 * norma. Tres decisiones que conviene conocer:
 *
 * - **El tratamiento no se transcribe a opciones.** Lleva dosis y esquemas por
 *   nivel de atención; el campo es texto libre y apunta a la página de la norma.
 * - **Donde el PDF imprime «referencia» y «alta» en columnas pegadas, la lista
 *   es una sola** («criterios de referencia o de alta»): el texto extraído no
 *   permite saber dónde termina una y empieza la otra.
 * - **La especialidad es la de la unidad de la norma** salvo las excepciones de
 *   `ESPECIALIDAD_POR_NORMA` (una fractura es de traumatología aunque esté en la
 *   unidad de emergencias).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { b, f, obl, s, seccion, si, t, una, varias } from './lib.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const leer = (archivo) =>
  JSON.parse(readFileSync(join(AQUI, 'nnac', archivo), 'utf8'));
const NORMAS_2012 = leer('nnac-norms.json');
/** Los capítulos sin código CIE-10 (aspectos generales, alimentación) no son un cuadro. */
const NORMAS_2025 = leer('nnac-norms-2025.json').filter(
  (n) => !n.titulo.startsWith('*'),
);

/** Carpeta (especialidad) por unidad de las NNAC. */
const CARPETA_POR_UNIDAD = {
  1: 'medicina-emergencia',
  2: 'psicologia-clinica',
  3: 'infectologia',
  4: 'oncologia',
  5: 'hematologia',
  6: 'endocrinologia',
  8: 'psiquiatria',
  9: 'neurologia',
  10: 'oftalmologia',
  11: 'otorrinolaringologia',
  12: 'cardiologia',
  13: 'neumologia',
  14: 'gastroenterologia',
};

/** `unidad:numero` → carpeta, cuando la norma es de otra especialidad. */
const ESPECIALIDAD_POR_NORMA = new Map([
  ['1:12', 'traumatologia'], // fracturas
  ['1:23', 'geriatria'], // caídas en el adulto mayor
  ['3:16', 'dermatologia'], // erisipela
  ['3:26', 'dermatologia'], // larva migrans cutánea
  ['3:31', 'dermatologia'], // miasis
  ['3:35', 'dermatologia'], // pediculosis
  ['3:41', 'dermatologia'], // sarcoptosis
  ['3:49', 'dermatologia'], // verruga vulgar
  ['3:44', 'neumologia'], // tuberculosis
  ['3:45', 'neumologia'], // reacciones adversas a antituberculosos
  ['9:3', 'traumatologia'], // dolor lumbar agudo
  ['12:6', 'cirugia-general'], // obstrucción arterial aguda
  ['12:7', 'cirugia-general'], // obstrucción arterial crónica
  ['12:8', 'cirugia-general'], // trombosis venosa profunda
  ['12:9', 'cirugia-general'], // várices
  ['13:1', 'otorrinolaringologia'], // resfrío común
  ['13:2', 'otorrinolaringologia'], // faringoamigdalitis
  ['13:3', 'otorrinolaringologia'], // laringitis
  ['13:4', 'otorrinolaringologia'], // epiglotitis – crup
  ['13:5', 'otorrinolaringologia'], // rinosinusitis
  ['13:6', 'pediatria'], // bronquiolitis
  ['13:8', 'pediatria'], // asma en niños
  ['13:11', 'pediatria'], // neumonía grave en menores de cinco años
  ['14:9', 'cirugia-general'], // obstrucción intestinal
  ['14:12', 'cirugia-general'], // vólvulo sigmoide
]);

const PALABRAS_MENORES = new Set([
  'DE',
  'LA',
  'EL',
  'EN',
  'Y',
  'O',
  'AL',
  'DEL',
  'LOS',
  'LAS',
  'UN',
  'POR',
  'CON',
  'SIN',
  'NO',
  'A',
  'U',
  'E',
  'SU',
  'SE',
  'PARA',
]);

/** «TRAUMATISMO CRANEOENCEFÁLICO» → «Traumatismo craneoencefálico». */
function nombreLegible(titulo) {
  const palabras = titulo.split(/\s+/);
  const texto = palabras
    .map((palabra, n) => {
      const limpia = palabra.replace(/[()/,:.–-]/g, '');
      const esSigla =
        limpia.length >= 2 &&
        limpia.length <= 4 &&
        !PALABRAS_MENORES.has(limpia) &&
        (palabra.startsWith('(') || /^[A-ZÁÉÍÓÚÑ]{2,4}$/u.test(limpia)) &&
        n > 0;
      return esSigla ? palabra : palabra.toLowerCase();
    })
    .join(' ');
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function sinTildes(texto) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function codigoDe(norma) {
  const [entero] = norma.numero.split('.');
  const resto = norma.numero.includes('.')
    ? `_${norma.numero.split('.')[1]}`
    : '';
  const palabras = sinTildes(norma.titulo.replace(/\(.*?\)/g, ''))
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter((p) => p !== '' && !PALABRAS_MENORES.has(p));
  const slug = palabras.slice(0, 3).join('_').slice(0, 30);
  return `NNAC_U${String(norma.unidad).padStart(2, '0')}_${entero.padStart(2, '0')}${resto}_${slug}`;
}

function codigo2025(norma) {
  const palabras = sinTildes(norma.titulo.replace(/\(.*?\)/g, ''))
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter((p) => p !== '' && !PALABRAS_MENORES.has(p));
  const slug = palabras.slice(0, 3).join('_').slice(0, 30);
  return `NNAC25_${norma.sigla}_${norma.numero.padStart(2, '0')}_${slug}`;
}

/** Los títulos de 2025 a veces enumeran todo el capítulo: se corta en la primera parte. */
function nombreCorto(titulo) {
  const principal = titulo
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .split(/\s+[-–]\s+/)[0];
  const base = principal.length > 90 ? principal.slice(0, 90) : principal;
  return nombreLegible(base.trim());
}

function nivelesDe(texto) {
  const lista = (texto.match(/\b(?:III|II|I)\b/g) ?? []).map(
    (n) => `Nivel ${n}`,
  );
  return [...new Set(lista)];
}

const hay = (lista) => lista.length >= 2;

/** El código CIE-10: lista cerrada si la norma trae los códigos con su nombre oficial. */
function campoCie10(norma) {
  const opciones = [
    ...new Set(
      (norma.cie10 ?? [])
        .map((c) => `${c.codigo}: ${c.nombre}`)
        .filter((o) => o.length <= 160),
    ),
  ];
  if (opciones.length > 0)
    return una('codigo_cie10', 'Código CIE-10', opciones, {
      otro: true,
      ayuda: 'Los códigos y nombres son los que declara la NNAC.',
    });
  const texto = norma.codigos ?? norma.cie10Texto ?? '';
  return s('codigo_cie10', 'Código CIE-10', {
    ayuda:
      texto === ''
        ? 'La NNAC no declara código CIE-10 para esta norma.'
        : `La NNAC asocia a esta norma: ${texto}.`,
  });
}

function camposDe(norma) {
  const ayudaCriterios = [
    `Según la NNAC, pág. ${norma.pagina}.`,
    norma.definicion,
  ]
    .filter((x) => x !== '')
    .join(' ');
  const niveles = nivelesDe(norma.niveles);

  return [
    seccion('Consulta', [
      una(
        'tipo_de_consulta',
        'Tipo de consulta',
        ['Primera evaluación', 'Control', 'Consulta de urgencia'],
        { req: true },
      ),
      obl(t('motivo_consulta', 'Motivo de consulta y tiempo de evolución')),
    ]),
    seccion('Criterios de la norma', [
      ...(hay(norma.criterios)
        ? [
            varias(
              'criterios_clinicos',
              'Hallazgos presentes (criterios diagnósticos de la NNAC)',
              norma.criterios,
              { otro: true, ayuda: ayudaCriterios },
            ),
          ]
        : []),
      ...(hay(norma.clasificacion)
        ? [
            varias(
              'clasificacion_nnac',
              'Clasificación o causas que describe la NNAC',
              norma.clasificacion,
              { otro: true },
            ),
          ]
        : []),
      ...(hay(norma.factoresRiesgo)
        ? [
            varias(
              'factores_de_riesgo',
              'Factores de riesgo presentes',
              norma.factoresRiesgo,
              { otro: true },
            ),
          ]
        : []),
      t('examen_fisico', 'Examen físico y otros hallazgos'),
    ]),
    seccion('Exámenes complementarios', [
      ...(hay(norma.examenes)
        ? [
            varias(
              'examenes_solicitados',
              'Exámenes solicitados (según la NNAC)',
              norma.examenes,
              { otro: true },
            ),
          ]
        : []),
      t('resultados_de_examenes', 'Resultados de los exámenes'),
    ]),
    seccion('Diagnóstico', [
      campoCie10(norma),
      obl(t('diagnostico', 'Diagnóstico')),
      ...(hay(norma.complicaciones)
        ? [
            varias(
              'complicaciones',
              'Complicaciones presentes',
              norma.complicaciones,
              { otro: true },
            ),
          ]
        : []),
    ]),
    seccion('Conducta', [
      ...(niveles.length > 0
        ? [
            una(
              'nivel_de_atencion',
              'Nivel de atención que resuelve el caso',
              niveles,
            ),
          ]
        : []),
      t('tratamiento', 'Tratamiento indicado', {
        ayuda: `La NNAC define el tratamiento por nivel de atención (norma ${norma.numero}, pág. ${norma.pagina}); se registra aquí lo indicado, con dosis y duración.`,
      }),
      ...(hay(norma.hospitalizacion ?? [])
        ? [
            varias(
              'criterios_de_hospitalizacion',
              'Criterios de hospitalización que se cumplen',
              norma.hospitalizacion,
              { otro: true },
            ),
          ]
        : []),
      b('se_refiere', '¿Se refiere al paciente a otro establecimiento?'),
      ...si('se_refiere', true, [
        ...(hay(norma.referencia)
          ? [
              varias(
                'criterios_de_referencia',
                norma.referenciaYAltaJuntas
                  ? 'Criterios de la NNAC que se cumplen (referencia o alta)'
                  : 'Criterios de referencia que se cumplen',
                norma.referencia,
                { otro: true },
              ),
            ]
          : []),
        s('establecimiento_de_referencia', 'Establecimiento de destino'),
      ]),
      ...(hay(norma.alta) && !norma.referenciaYAltaJuntas
        ? [
            varias(
              'criterios_de_alta',
              'Criterios de alta que se cumplen',
              norma.alta,
              { otro: true },
            ),
          ]
        : []),
      t('observaciones', 'Observaciones'),
      f('proximo_control', 'Próximo control'),
    ]),
  ];
}

const NOTA_LISTAS =
  'Las listas de hallazgos, clasificación, factores de riesgo, exámenes, complicaciones, hospitalización ' +
  'y criterios de referencia o alta son viñetas de la norma, transcritas sin agregados y sin dosis; ' +
  'el tratamiento se registra como texto. Revisión clínica pendiente.';

function entrada2012(norma) {
  const carpeta =
    ESPECIALIDAD_POR_NORMA.get(`${norma.unidad}:${norma.numero}`) ??
    CARPETA_POR_UNIDAD[norma.unidad];
  if (carpeta === undefined)
    throw new Error(
      `NNAC ${norma.numero}: unidad ${norma.unidad} sin carpeta.`,
    );
  return {
    code: codigoDe(norma),
    carpeta,
    nombre: `${nombreLegible(norma.titulo)} (NNAC 2012)`,
    fuente: 'NNAC_BOLIVIA',
    fecha: '2026-10-05',
    nota:
      `NNAC 2012, norma N.º ${norma.numero} de la unidad ${norma.unidad}, pág. ${norma.pagina}; ` +
      `CIE-10 ${norma.codigos}; niveles de resolución ${norma.niveles || 'sin dato'}. ${NOTA_LISTAS}`,
    campos: () => camposDe(norma),
  };
}

function entrada2025(norma) {
  return {
    code: codigo2025(norma),
    carpeta: norma.carpeta,
    nombre: `${nombreCorto(norma.titulo)} (NNAC 2025)`,
    fuente: `NNAC_2025_${norma.sigla}`,
    fecha: '2026-10-05',
    nota:
      `NNAC 2025 (RM 0456, 30/09/2025), capítulo ${norma.numero}, pág. ${norma.pagina}; ` +
      `niveles de atención ${norma.niveles || 'sin dato'}. ${NOTA_LISTAS}`,
    campos: () => camposDe(norma),
  };
}

/** Cuánto contenido transcrito trae una norma: sirve para elegir entre dos ediciones. */
function riqueza(norma) {
  return [
    'criterios',
    'clasificacion',
    'factoresRiesgo',
    'examenes',
    'complicaciones',
    'hospitalizacion',
    'referencia',
    'alta',
  ].reduce((suma, clave) => suma + (norma[clave] ?? []).length, 0);
}

const CLAVE_2012 = (n) => `${n.unidad}:${n.numero}`;

/**
 * Qué normas de 2012 y 2025 describen la misma enfermedad. Es una tabla, no un
 * parecido de títulos: «bronquiolitis» y «bronquitis» se parecen y no lo son.
 * Cada fila: volumen, patrón del título de 2025, normas de 2012 (`unidad:número`).
 */
const SUSTITUYE = [
  ['URG', /^ANGINA DE PECHO ESTABLE/, ['12:5.1']],
  ['URG', /^CAÍDAS EN EL ADULTO MAYOR/, ['1:23']],
  ['URG', /^CHOQUE ANAFILÁCTICO/, ['1:3']],
  ['URG', /^CHOQUE$/, ['1:2']],
  ['URG', /^CRISIS HIPERTENSIVA/, ['1:4']],
  ['URG', /^ENFERMEDAD TROMBOEMBÓLICA VENOSA/, ['12:8']],
  ['URG', /^HEMOPTISIS/, ['1:5']],
  ['URG', /^HEMORRAGIA DIGESTIVA ALTA NO VARICOSA/, ['14:5']],
  ['URG', /^HEMORRAGIA DIGESTIVA ALTA VARICOSA/, ['14:6']],
  ['URG', /^HERIDAS/, ['1:11']],
  ['URG', /^INTOXICACIÓN AGUDA POR ACETILSALICÍLICO/, ['1:17']],
  ['URG', /^INTOXICACIÓN AGUDA POR BENZODIAZEPINAS/, ['1:18']],
  ['URG', /^INTOXICACIÓN AGUDA POR ETANOL/, ['1:19']],
  ['URG', /^INTOXICACIÓN AGUDA POR INHIBIDOR DE COLINESTERASA/, ['1:14']],
  ['URG', /^INTOXICACIÓN AGUDA POR PARAQUAT/, ['1:15']],
  ['URG', /^INTOXICACIÓN POR PARACETAMOL/, ['1:16']],
  ['URG', /^INTOXICACIONES AGUDAS/, ['1:13']],
  ['URG', /^MORDEDURA DE SERPIENTE/, ['1:21']],
  ['URG', /^MORDEDURA DE VIUDA NEGRA/, ['1:22']],
  ['URG', /^PARO CARDIORRESPIRATORIO/, ['1:1']],
  ['URG', /^POLITRAUMATISMO/, ['1:9']],
  ['URG', /^QUEMADURAS/, ['1:10']],
  ['URG', /^SÍNDROME TROPOIDE/, ['1:20']],
  ['TI', /^ACCIDENTE CEREBROVASCULAR AGUDO/, ['9:6']],
  ['TI', /^CETOACIDOSIS DIABÉTICA/, ['6:2']],
  ['TI', /^COAGULACIÓN INTRAVASCULAR DISEMINADA/, ['5:2']],
  ['TI', /^FALLA HEPÁTICA AGUDA/, ['14:4']],
  ['TI', /^SÍNDROME CORONARIO AGUDO/, ['12:5.2', '12:5.3', '12:5.4']],
  ['TI', /^TRAUMA ABDOMINAL Y PÉLVICO/, ['1:8']],
  ['TI', /^TRAUMA TORÁCICO/, ['1:7']],
  ['TI', /^TRAUMATISMO CRANEOENCEFÁLICO/, ['1:6']],
  ['TI', /^TROMBOEMBOLISMO PULMONAR/, ['12:3']],
  ['TRA', /^FRACTURAS$/, ['1:12']],
  ['TRA', /^LUMBALGIA/, ['9:3']],
  ['NEU', /^ATAQUE CEREBROVASCULAR ISQUÉMICO/, ['9:6']],
  ['NEU', /^CEFALEA TENSIONAL/, ['9:1']],
  ['NEU', /^EPILEPSIA/, ['9:7']],
  ['NEU', /^ESTADO DE MAL EPILÉPTICO/, ['9:8']],
  ['NEU', /^MENINGITIS BACTERIANA AGUDA/, ['3:30']],
  ['NEU', /^MIGRAÑA/, ['9:9']],
  ['NEU', /^NEURALGIA DEL TRIGÉMINO/, ['9:10']],
  ['NEU', /^PARÁLISIS FACIAL PERIFÉRICA/, ['9:11']],
  ['NEU', /^ENFERMEDAD DE PARKINSON/, ['9:4']],
  ['NEU', /^ENFERMEDADES DESMIELINIZANTES/, ['9:5']],
  ['NEU', /^POLINEUROPATÍA INFLAMATORIA/, ['9:12']],
  ['NEU', /^ENCEFALITIS/, ['3:11']],
  ['NEU', /^NEUROCISTICERCOSIS/, ['3:5']],
  ['MI', /^ANEMIA FERROPÉNICA/, ['5:1']],
  ['MI', /^ASMA BRONQUIAL/, ['13:7']],
  ['MI', /^BRONQUITIS AGUDA/, ['13:13']],
  ['MI', /^DIABETES MELLITUS/, ['6:1']],
  ['MI', /^DISLIPIDEMIAS/, ['6:13']],
  ['MI', /^ENFERMEDAD POR REFLUJO/, ['14:2']],
  ['MI', /^ESTREÑIMIENTO CRÓNICO/, ['14:3']],
  ['MI', /^FIEBRE REUMÁTICA/, ['12:1']],
  ['MI', /^FIEBRE TIFOIDEA/, ['3:18']],
  ['MI', /^HEPATITIS VIRAL AGUDA/, ['3:22']],
  ['MI', /^HIPERTENSIÓN ARTERIAL/, ['12:2']],
  ['MI', /^HIPERTIROIDISMO/, ['6:6']],
  ['MI', /^HIPOTIROIDISMO/, ['6:7']],
  ['MI', /^INSUFICIENCIA SUPRARRENAL/, ['6:5']],
  ['MI', /^NEUMONÍA ADQUIRIDA EN LA COMUNIDAD/, ['13:10']],
  ['MI', /^NEUMONÍA INTRAHOSPITALARIA/, ['13:12']],
  ['MI', /^PANCREATITIS AGUDA/, ['14:10']],
  ['MI', /^SÍNDROME METABÓLICO/, ['6:9']],
  ['MI', /^ÚLCERA PÉPTICA/, ['14:11']],
  ['PED', /^ASMA$/, ['13:8']],
  ['PED', /^BRONQUIOLITIS/, ['13:6']],
  ['PED', /^DENGUE/, ['3:6']],
  ['PED', /^DIARREA, GASTROENTERITIS/, ['3:7']],
  ['PED', /^EPIGLOTITIS/, ['13:4']],
  ['PED', /^ERISIPELA/, ['3:16']],
  ['PED', /^FARINGITIS ESTREPTOCÓCICA/, ['13:2']],
  ['PED', /^HEPATITIS AGUDA TIPO A COMPLICADA/, ['3:23']],
  ['PED', /^HEPATITIS AGUDA TIPO A$/, ['3:22']],
  ['PED', /^INFLUENZA/, ['3:25']],
  ['PED', /^LARINGITIS/, ['13:3']],
  ['PED', /^NEUMONÍA ADQUIRIDA EN LA COMUNIDAD/, ['13:9']],
  ['PED', /^NEUMONÍA GRAVE EN MENORES/, ['13:11']],
  ['PED', /^OBESIDAD INFANTIL/, ['6:10']],
  ['PED', /^OTITIS MEDIA AGUDA/, ['11:1']],
  ['PED', /^PAROTIDITIS/, ['3:34']],
  ['PED', /^PUBERTAD PRECOZ/, ['6:12']],
  ['PED', /^SALMONELOSIS/, ['3:39']],
  ['PED', /^SARAMPIÓN/, ['3:40']],
  ['PED', /^TALLA BAJA/, ['6:11']],
  ['PED', /^VARICELA/, ['3:48']],
];

/** Elige, para cada enfermedad, la edición con más contenido (2025 si empatan). */
function elegir() {
  const de2012 = new Map(NORMAS_2012.map((n) => [CLAVE_2012(n), n]));
  const retiradas2012 = new Set();
  const saltadas2025 = new Set();
  for (const norma of NORMAS_2025) {
    const fila = SUSTITUYE.find(
      ([sigla, patron]) => sigla === norma.sigla && patron.test(norma.titulo),
    );
    if (fila === undefined) continue;
    const viejas = fila[2].map((k) => de2012.get(k));
    if (viejas.some((v) => v === undefined))
      throw new Error(`SUSTITUYE: ${fila[2]} no existe en 2012.`);
    const mejor2012 = Math.max(...viejas.map(riqueza));
    if (riqueza(norma) >= mejor2012)
      fila[2].forEach((k) => retiradas2012.add(k));
    else saltadas2025.add(`${norma.sigla}:${norma.numero}`);
  }
  return {
    de2012: NORMAS_2012.filter((n) => !retiradas2012.has(CLAVE_2012(n))),
    de2025: NORMAS_2025.filter(
      (n) => !saltadas2025.has(`${n.sigla}:${n.numero}`),
    ),
    retiradas2012: retiradas2012.size,
    saltadas2025: saltadas2025.size,
  };
}

const ELEGIDAS = elegir();
export const RESUMEN_NNAC = {
  de2012: ELEGIDAS.de2012.length,
  de2025: ELEGIDAS.de2025.length,
  retiradas2012: ELEGIDAS.retiradas2012,
  saltadas2025: ELEGIDAS.saltadas2025,
};

export const ESPECIFICAS_NNAC = [
  ...ELEGIDAS.de2012.map(entrada2012),
  ...ELEGIDAS.de2025.map(entrada2025),
];

const vistos = new Set();
for (const e of ESPECIFICAS_NNAC) {
  if (vistos.has(e.code)) throw new Error(`Código NNAC repetido: ${e.code}`);
  vistos.add(e.code);
}
