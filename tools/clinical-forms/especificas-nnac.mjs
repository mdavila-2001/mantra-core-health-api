/**
 * Fichas específicas por condición — una por cada norma de las Normas
 * Nacionales de Atención Clínica (NNAC) del Ministerio de Salud y Deportes de
 * Bolivia (2012), unidades 1 a 14.
 *
 * Lo que las fichas dicen sale de `nnac/nnac-norms.json`, que a su vez sale del
 * PDF con `nnac/parse-nnac.mjs`. No se escribe a mano ningún ítem clínico: cada
 * opción es una viñeta de la norma. Tres decisiones que conviene conocer:
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
const NORMAS = JSON.parse(
  readFileSync(join(AQUI, 'nnac', 'nnac-norms.json'), 'utf8'),
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

function nivelesDe(texto) {
  const lista = (texto.match(/\b(?:III|II|I)\b/g) ?? []).map(
    (n) => `Nivel ${n}`,
  );
  return [...new Set(lista)];
}

const hay = (lista) => lista.length >= 2;

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
      s('codigo_cie10', 'Código CIE-10', {
        ayuda: `La NNAC asocia a esta norma: ${norma.codigos}.`,
      }),
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

function entradaDe(norma) {
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
    nombre: `${nombreLegible(norma.titulo)} (NNAC)`,
    fuente: 'NNAC_BOLIVIA',
    fecha: '2026-10-05',
    nota:
      `Norma N.º ${norma.numero} de la unidad ${norma.unidad} de las NNAC, pág. ${norma.pagina}; ` +
      `CIE-10 ${norma.codigos}; niveles de resolución ${norma.niveles || 'sin dato'}. ` +
      'Las listas de hallazgos, clasificación, factores de riesgo, exámenes, complicaciones y criterios ' +
      'de referencia o alta son viñetas de la norma, transcritas sin agregados y sin dosis; ' +
      'el tratamiento se registra como texto. Revisión clínica pendiente.',
    campos: () => camposDe(norma),
  };
}

export const ESPECIFICAS_NNAC = NORMAS.map(entradaDe);

const vistos = new Set();
for (const e of ESPECIFICAS_NNAC) {
  if (vistos.has(e.code)) throw new Error(`Código NNAC repetido: ${e.code}`);
  vistos.add(e.code);
}
