#!/usr/bin/env node
/**
 * Convierte el texto de las Normas Nacionales de Atención Clínica (NNAC,
 * Ministerio de Salud y Deportes de Bolivia, 2012) en `nnac-norms.json`: una
 * entrada por norma, con su número, título, códigos CIE-10, niveles de
 * resolución y las listas que la norma declara (criterios clínicos,
 * clasificación, exámenes, complicaciones, criterios de referencia y de alta).
 *
 * No inventa nada: cada ítem es una viñeta de la norma, con el salto de línea
 * del PDF deshecho. Lo que la norma no trae queda vacío.
 *
 *   node tools/clinical-forms/nnac/parse-nnac.mjs <nnac.txt> [salida.json]
 *
 * `nnac.txt` sale de `extract-text.mjs` (pdfjs-dist, que no es dependencia
 * del repositorio: `npm i --no-save pdfjs-dist` en una carpeta aparte).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

/** Encabezados de sección de la norma, en el orden en que aparecen. */
const SECCIONES = [
  ['DEFINICIÓN', 'definicion'],
  ['ETIOLOGÍA', 'etiologia'],
  ['FACTORES DE RIESGO', 'factores_riesgo'],
  ['CLASIFICACIÓN', 'clasificacion'],
  ['DIAGNÓSTICO', 'diagnostico'],
  ['DIAGNÓSTICO DIFERENCIAL', 'diferencial'],
  ['EXÁMENES COMPLEMENTARIOS', 'examenes'],
  ['TRATAMIENTO', 'tratamiento'],
  ['TRATAMIENTO MÉDICO', 'tratamiento'],
  ['TRATAMIENTO QUIRÚRGICO', 'tratamiento_quirurgico'],
  ['COMPLICACIONES', 'complicaciones'],
  ['CRITERIOS DE REFERENCIA', 'referencia'],
  ['CRITERIOS DE ALTA', 'alta'],
];
const ENCABEZADOS = new Map(
  SECCIONES.map(([texto, clave]) => [normalizar(texto), clave]),
);
/** Los dos encabezados lado a lado que el PDF imprime en una sola línea. */
const DOBLES = new Map([
  [
    normalizar('CRITERIOS DE REFERENCIA CRITERIOS DE ALTA'),
    ['referencia', 'alta'],
  ],
  [
    normalizar('CRITERIOS DE REFERENCIA CRITERIOS DE CONTRARREFERENCIA'),
    ['referencia', 'alta'],
  ],
  [
    normalizar('CRITERIOS DE ALTA CRITERIOS DE CONTRARREFERENCIA'),
    ['alta', 'alta'],
  ],
]);
/** Encabezados que abren una norma (los que aparecen antes del bloque CIE-10). */
const FRENTE = new Set([
  'definicion',
  'etiologia',
  'factores_riesgo',
  'clasificacion',
  'diagnostico',
]);

const CODIGOS = /^(?=.*\d)[A-Za-z0-9.,\s–-]{2,40}$/;
const NIVELES = /^(I{1,3}|II|III)(\s*[–-]\s*(I{1,3}))*$/;
const NUMERO = /^\d{1,3}(\.\d{1,2})*\.?$/;

/** Dónde empieza cada unidad temática del libro (página del PDF = del libro). */
export const UNIDADES = [
  [1, 89, 'Traumatismos, envenenamientos y emergencias'],
  [2, 185, 'Violencia y sus efectos'],
  [3, 225, 'Enfermedades infecciosas y parasitarias'],
  [4, 375, 'Tumores'],
  [5, 397, 'Enfermedades de la sangre'],
  [6, 423, 'Enfermedades endócrinas'],
  [7, 461, 'Alimentación y nutrición'],
  [8, 531, 'Trastornos mentales y del comportamiento'],
  [9, 599, 'Enfermedades del sistema nervioso'],
  [10, 629, 'Enfermedades del ojo y sus anexos'],
  [11, 679, 'Enfermedades del oído'],
  [12, 691, 'Enfermedades del sistema circulatorio'],
  [13, 725, 'Enfermedades del sistema respiratorio'],
  [14, 763, 'Enfermedades médicas del sistema digestivo'],
  [15, 807, 'Enfermedades quirúrgicas del sistema digestivo'],
  [16, 883, 'Enfermedades de la piel'],
  [17, 917, 'Enfermedades osteomusculares'],
  [18, 955, 'Enfermedades genitourinarias'],
  [19, 1013, 'Afecciones perinatales'],
  [20, 1145, 'Embarazo, parto y puerperio'],
  [21, 1281, 'Anticoncepción'],
  [22, 1315, 'ITS y VIH-sida'],
  [23, 1365, 'Cavidad bucal y odontología'],
  [24, 1505, 'Anestesiología'],
];
export function unidadDe(pagina) {
  let u = null;
  for (const [n, desde] of UNIDADES) if (pagina >= desde) u = n;
  return u;
}

const BULLET = /^\s*(?:■■|■●|●|■|•|▪)\s*/;

function normalizar(texto) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

/** Un renglón que se repite en cada página y no es contenido. */
function esRuido(linea, titulosNorm) {
  const l = linea.trim();
  if (l === '') return true;
  if (/^===\s*PAGE/.test(l)) return true;
  if (/^serie documentos t[eé]cnico/i.test(l)) return true;
  if (/^\d{1,4}$/.test(l)) return true;
  if (/NNAC\s*[–-]\s*(UNIDAD|PRIMERA)/i.test(l)) return true;
  // El título que el libro repite al tope de cada página: «12. FRACTURAS» o,
  // si el título es largo y se parte, su continuación. Una palabra suelta que
  // casualmente forma parte de algún título («esclerosis») es contenido.
  const conNumero = /^\d{1,3}(\.\d{1,2})*\.?\s+/.test(l);
  const sinNumero = normalizar(l.replace(/^\d{1,3}(\.\d{1,2})*\.?\s+/, ''));
  const largo = sinNumero.length >= 24;
  if (
    (conNumero || largo) &&
    sinNumero.length >= 8 &&
    titulosNorm.some((t) => t.includes(sinNumero))
  )
    return true;
  return false;
}

/** Une los renglones partidos por el ancho de la columna. */
function unir(partes) {
  return partes
    .join(' ')
    .replace(/(\p{L})- (\p{Ll})/gu, '$1$2')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Rastros de que lo que sigue ya es de otra parte de la norma. Cuando el PDF
 * reordena las columnas, el encabezado siguiente queda pegado al último ítem.
 */
const OTRA_SECCION =
  /\b(MEDIDAS GENERALES|TRATAMIENTO|NIVEL [I-V]+|CRITERIOS DE|EXÁMENES|COMPLICACIONES|DIAGNÓSTICO|CLASIFICACIÓN|FACTORES DE RIESGO)\b/u;

/**
 * Lo que es de un esquema de tratamiento y no de una lista de hallazgos: dosis,
 * vías de administración e instrucciones en imperativo. Si el PDF mezcla el
 * tratamiento con los criterios (pasa al reordenar columnas), esto no puede
 * terminar como una opción que alguien marque como «observado».
 */
const ES_TRATAMIENTO = new RegExp(
  [
    String.raw`\b\d+(?:[.,]\d+)?\s?(?:mg|mcg|µg|g|ml|mL|UI|mEq|gotas?|comprimidos?|tabletas?|ampollas?|cápsulas?)\b`,
    String.raw`\b(?:IV|VO|IM|SC|EV|VR)\b`,
    String.raw`\bdosis\b`,
    String.raw`^(?:Considere|Reanude|Administre|Aplique|Inicie|Continúe|Suspenda|Utilice|Use|Mantenga|Realice|Coloque|Evite|Controle|Vigile|Reponga|Verifique|Solicite|Indique|Prescriba|Complemente|Modifique|Dar|Indicar|Reducir|Eliminar|Ingerir|Ofrecer|Enseñar|Explicar|Recomendar|Orientar|Referir|Aconsejar|Brindar|Promover|Fomentar|Realizar|Si)\b`,
    String.raw`:\s*\d{1,3}\s?%`,
  ].join('|'),
  'u',
);

/** Una viñeta apta para ser opción de una lista cerrada, o `null`. */
export function limpiarItem(crudo) {
  let t = crudo.trim();
  // Un encabezado de tabla pegado al final («… RIESGO DE INJURIA …»).
  const mayusculas = /(?:\s|^)(?:[A-ZÁÉÍÓÚÑ]{2,}[\s:/-]+){3,}/u.exec(t);
  if (mayusculas !== null && mayusculas.index > 0)
    t = t.slice(0, mayusculas.index).trim();
  // Un encabezado en mayúsculas pegado tras el punto («… oral. EMERGENCIA HIPERTENSIVA»).
  t = t.replace(/\.\s+(?:[A-ZÁÉÍÓÚÑ]{2,}[A-ZÁÉÍÓÚÑj]*\s*)+$/u, '').trim();
  // Una segunda oración casi siempre es otra instrucción de la norma, no el ítem.
  const primera = t.split(/(?<=[a-záéíóúñ)%])\.\s+(?=[A-ZÁÉÍÓÚÑ0-9])/u)[0];
  if (primera.length >= 5) t = primera;
  t = t
    .replace(/[\s;,:]+$/u, '')
    .replace(/\.$/u, '')
    .trim();
  if (t.length < 4 || t.length > 160) return null;
  if (/:$/.test(crudo.trim())) return null;
  const abre = (t.match(/\(/g) ?? []).length;
  const cierra = (t.match(/\)/g) ?? []).length;
  if (abre !== cierra) return null;
  if (!/\p{L}{3}/u.test(t)) return null;
  if (ES_TRATAMIENTO.test(t)) return null;
  // Frases enteras en mayúsculas, filas de tabla y restos de tratamiento.
  if (/[A-ZÁÉÍÓÚÑ]{5,}\s+[A-ZÁÉÍÓÚÑ]{5,}/u.test(t)) return null;
  if (/pre-?referencia|^Síntomas\/signos/iu.test(t)) return null;
  if (/[<>]\s?\d+\s?%?$/u.test(t)) return null;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Los ítems aptos de una sección, cortando donde empieza otra. */
export function limpiarLista(items) {
  const salida = [];
  for (const crudo of items) {
    if (OTRA_SECCION.test(crudo)) break;
    const limpio = limpiarItem(crudo);
    if (limpio !== null) salida.push(limpio);
  }
  return [...new Set(salida)];
}

function viñetas(lineas) {
  const items = [];
  let actual = null;
  // Un marcador en medio de la línea también separa ítems («Hemograma. ■■ Glucemia»).
  const partidas = lineas.flatMap((l) => l.split(/\s+(?=(?:■■|■●|●|■|▪)\s)/u));
  for (const linea of partidas) {
    if (BULLET.test(linea)) {
      if (actual !== null) items.push(unir(actual));
      actual = [linea.replace(BULLET, '')];
    } else if (actual !== null) {
      actual.push(linea.trim());
    }
  }
  if (actual !== null) items.push(unir(actual));
  return items;
}

function prosa(lineas) {
  const sinViñetas = lineas.filter((l) => !BULLET.test(l));
  return unir(sinViñetas);
}

export function parsear(texto) {
  const crudas = texto.split('\n');
  const paginas = [];
  let pagina = 0;
  for (const l of crudas) {
    const m = /^=== PAGE (\d+)/.exec(l);
    if (m) pagina = Number(m[1]);
    paginas.push(pagina);
  }

  // Los bloques «CIE-10 / NIVEL DE RESOLUCIÓN / códigos / niveles / título /
  // número». Varían: hay normas sin códigos (nutrición), títulos de varias
  // líneas y numeración «5.1.».
  const cabeceras = [];
  for (let i = 0; i < crudas.length - 5; i += 1) {
    if (
      crudas[i].trim() !== 'CIE-10' ||
      crudas[i + 1].trim() !== 'NIVEL DE RESOLUCIÓN'
    )
      continue;
    let j = i + 2;
    let codigos = '';
    let niveles = '';
    if (CODIGOS.test(crudas[j].trim())) codigos = crudas[j++].trim();
    if (NIVELES.test(crudas[j].trim())) niveles = crudas[j++].trim();
    const titulo = [];
    while (j < i + 9 && !NUMERO.test(crudas[j].trim())) {
      if (/^=== PAGE/.test(crudas[j])) break;
      titulo.push(crudas[j].trim());
      j += 1;
    }
    const numero = NUMERO.test(crudas[j].trim())
      ? crudas[j].trim().replace(/\.$/, '')
      : null;
    cabeceras.push({
      linea: i,
      largo: j - i + 1,
      codigos,
      niveles,
      titulo: unir(titulo),
      numero,
    });
  }
  const titulosNorm = cabeceras.map((c) => normalizar(c.titulo));
  // Dónde empieza cada norma: su DEFINICIÓN (o su primer encabezado de frente).
  const inicios = cabeceras.map((c, n) => {
    const previa =
      n === 0 ? 0 : cabeceras[n - 1].linea + cabeceras[n - 1].largo;
    let primero = null;
    for (let i = previa; i < c.linea; i += 1) {
      const clave = ENCABEZADOS.get(normalizar(crudas[i]));
      if (clave === 'definicion') return i;
      if (primero === null && FRENTE.has(clave)) primero = i;
    }
    return primero ?? c.linea;
  });

  return cabeceras.map((c, n) => {
    const fin = n + 1 < cabeceras.length ? inicios[n + 1] : crudas.length;
    const lineas = crudas.slice(inicios[n], fin).filter((l, k) => {
      const abs = inicios[n] + k;
      const enBloque = abs >= c.linea && abs < c.linea + c.largo;
      return !enBloque && !esRuido(l, titulosNorm);
    });

    const secciones = {};
    let clave = null;
    for (const l of lineas) {
      const norm = normalizar(l);
      const doble = DOBLES.get(norm);
      if (doble !== undefined) {
        clave = doble[0];
        secciones[clave] ??= [];
        secciones[clave].doble = true;
        continue;
      }
      const nueva = ENCABEZADOS.get(norm);
      if (nueva !== undefined) {
        clave = nueva;
        secciones[clave] ??= [];
        continue;
      }
      if (clave !== null) secciones[clave].push(l);
    }

    const salida = {};
    for (const [k, ls] of Object.entries(secciones)) {
      salida[k] = {
        items: [...new Set(viñetas(ls))],
        opciones: limpiarLista(viñetas(ls)),
        texto: prosa(ls).slice(0, 1200),
        columnasMezcladas: ls.doble === true,
      };
    }
    return {
      numero: c.numero,
      titulo: c.titulo,
      codigos: c.codigos,
      niveles: c.niveles,
      pagina: paginas[c.linea],
      unidad: unidadDe(paginas[c.linea]),
      secciones: salida,
    };
  });
}

/** Las dos primeras oraciones de la definición, o '' si el texto está revuelto. */
export function resumirDefinicion(texto) {
  let t = texto.trim();
  const corte = OTRA_SECCION.exec(t);
  if (corte !== null) t = t.slice(0, corte.index).trim();
  const oraciones = t.match(/[^.]+\./gu) ?? [];
  let resumen = '';
  for (const o of oraciones) {
    if ((resumen + o).length > 380) break;
    resumen += `${resumen === '' ? '' : ' '}${o.trim()}`;
    if (resumen.length >= 160) break;
  }
  return resumen.length >= 40 && /^[A-ZÁÉÍÓÚÑ¿]/u.test(resumen) ? resumen : '';
}

/**
 * Lo que las fichas usan de cada norma. El tratamiento no entra: lleva dosis y
 * esquemas por nivel de atención, que no se transcriben a opciones sueltas.
 */
export function compactar(norma) {
  const lista = (clave, tope) =>
    (norma.secciones[clave]?.opciones ?? []).slice(0, tope);
  return {
    numero: norma.numero,
    titulo: norma.titulo,
    codigos: norma.codigos,
    niveles: norma.niveles,
    pagina: norma.pagina,
    unidad: norma.unidad,
    definicion: resumirDefinicion(norma.secciones.definicion?.texto ?? ''),
    criterios: lista('diagnostico', 30),
    clasificacion: lista('clasificacion', 12),
    factoresRiesgo: lista('factores_riesgo', 20),
    examenes: lista('examenes', 20),
    complicaciones: lista('complicaciones', 20),
    referencia: lista('referencia', 20),
    referenciaYAltaJuntas:
      norma.secciones.referencia?.columnasMezcladas === true,
    alta: lista('alta', 15),
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [entrada, salida] = process.argv.slice(2);
  const normas = parsear(readFileSync(entrada, 'utf8'))
    // La unidad 7 son guías de alimentación y educación nutricional: no
    // describen un cuadro que se diagnostique ni traen códigos CIE-10.
    .filter((n) => n.unidad !== 7)
    .map(compactar);
  if (salida) writeFileSync(salida, `${JSON.stringify(normas, null, 2)}\n`);
  console.log(`${normas.length} normas`);
}
