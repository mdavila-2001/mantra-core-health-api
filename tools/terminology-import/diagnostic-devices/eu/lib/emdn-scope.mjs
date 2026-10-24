// =============================================================================
// Qué ramas de la EMDN cuentan como «equipo de diagnóstico».
//
// Regla de diseño: se decide por CÓDIGO, nunca por palabras del nombre. La
// categoría W (IVD) entra entera porque todo producto sanitario para
// diagnóstico in vitro es diagnóstico por definición (Reglamento (UE)
// 2017/746, art. 2.2). Fuera de W, la EMDN mezcla en un mismo grupo equipos
// de diagnóstico con instrumental terapéutico o quirúrgico (verificado: el
// grupo Z12 contiene Z12130580, accesorios de un sistema motorizado de
// cirugía ortopédica), así que fuera de W solo entran TIPOS listados uno por
// uno en INCLUDED_TYPE_PREFIXES, cada uno con su motivo y la versión de la
// EMDN contra la que se verificó.
//
// Las descripciones de categoría de abajo son paráfrasis propias para
// justificar la decisión; el nombre oficial de cada código sale siempre de la
// EMDN descargada.
// =============================================================================

/** Categorías que entran completas. */
export const INCLUDED_CATEGORIES = {
  W: 'Diagnóstico in vitro: todo producto IVD es diagnóstico (IVDR art. 2.2); incluye analizadores, reactivos, kits, calibradores, controles y pruebas de autodiagnóstico y point-of-care.',
};

/**
 * Categorías con ramas diagnósticas mezcladas con terapéuticas: se revisan
 * tipo por tipo cuando la EMDN completa está disponible (build.mjs escribe
 * `out/emdn-scope-review.md` con todos sus tipos).
 */
export const REVIEW_CATEGORIES = {
  C: 'Aparato cardiocirculatorio: contiene catéteres y electrodos diagnósticos (p. ej. ECG, cateterismo diagnóstico) junto con terapéuticos.',
  G: 'Aparato gastrointestinal: contiene dispositivos de endoscopía diagnóstica junto con terapéuticos.',
  N: 'Sistema nervioso: contiene electrodos y dispositivos de neurofisiología diagnóstica (EEG/EMG) junto con estimuladores.',
  Q: 'Odontología, oftalmología y ORL: contiene oftalmología diagnóstica, audiometría y otoscopía junto con terapéuticos.',
  R: 'Respiratorio y anestesia: contiene accesorios de espirometría y pruebas de función pulmonar junto con terapia ventilatoria.',
  U: 'Aparato urogenital: contiene dispositivos de diagnóstico urodinámico junto con terapéuticos.',
  V: 'Varios: contiene termómetros, dispositivos de medición y otros diagnósticos junto con productos generales.',
  Z: 'Equipamiento: contiene imagenología, monitorización, exploración funcional y patología digital junto con equipos quirúrgicos, de terapia y de esterilización.',
};

/** Categorías excluidas enteras, con su motivo. */
export const EXCLUDED_CATEGORIES = {
  A: 'Administración, extracción y recolección: agujas, jeringas y sistemas de infusión; la recolección de muestras para IVD que se clasifica como IVD ya está en W.',
  B: 'Hematología y hemotransfusión: bolsas y equipos de transfusión, terapéuticos.',
  D: 'Desinfectantes, antisépticos y esterilizantes: no diagnósticos.',
  F: 'Diálisis: terapéuticos.',
  H: 'Suturas: terapéuticos.',
  J: 'Implantables activos: terapéuticos (marcapasos, desfibriladores, neuroestimuladores).',
  K: 'Endoterapia y electrocirugía: terapéuticos o quirúrgicos.',
  L: 'Instrumental quirúrgico reutilizable: quirúrgico.',
  M: 'Apósitos y medicación general: terapéuticos.',
  P: 'Prótesis implantables y osteosíntesis: terapéuticos.',
  S: 'Esterilización: no diagnósticos.',
  T: 'Protección del paciente e incontinencia: no diagnósticos.',
  X: 'Productos sin finalidad médica (anexo XVI MDR): fuera de alcance.',
  Y: 'Ayudas técnicas para personas con discapacidad: no diagnósticos.',
};

/**
 * Tipos fuera de W incluidos explícitamente. Cada entrada:
 *   prefix: código EMDN (entra el código y toda su descendencia)
 *   motive: por qué es diagnóstico
 *   verifiedAgainst: versión de la EMDN donde se leyó el nombre oficial
 * Vacío hasta tener la EMDN completa (la red de esta sesión no la alcanzó):
 * se completa en la revisión tipo por tipo, nunca de memoria.
 */
export const INCLUDED_TYPE_PREFIXES = [];

/** Código EMDN → categoría (la letra inicial). */
export const emdnCategory = (code) =>
  /^[A-Z]/.test(code ?? '') ? code[0] : null;

/**
 * @returns {{ inScope: boolean, rule: string }}
 */
export function classifyEmdn(code, typePrefixes = INCLUDED_TYPE_PREFIXES) {
  const cat = emdnCategory(code);
  if (!cat) return { inScope: false, rule: 'sin-codigo-emdn' };
  if (INCLUDED_CATEGORIES[cat])
    return { inScope: true, rule: `categoria-incluida:${cat}` };
  const typeHit = typePrefixes.find((t) => code.startsWith(t.prefix));
  if (typeHit)
    return { inScope: true, rule: `tipo-incluido:${typeHit.prefix}` };
  if (EXCLUDED_CATEGORIES[cat])
    return { inScope: false, rule: `categoria-excluida:${cat}` };
  if (REVIEW_CATEGORIES[cat])
    return { inScope: false, rule: `pendiente-revision:${cat}` };
  return { inScope: false, rule: `categoria-desconocida:${cat}` };
}

/**
 * Verifica que cada prefijo explícito exista en la EMDN cargada; un prefijo
 * que no existe es un error de curación, no un caso a ignorar.
 */
export function assertTypePrefixesExist(
  emdnCodes,
  typePrefixes = INCLUDED_TYPE_PREFIXES,
) {
  const missing = typePrefixes.filter((t) => !emdnCodes.has(t.prefix));
  if (missing.length)
    throw new Error(
      `Prefijos EMDN incluidos que no existen en la EMDN cargada: ${missing.map((m) => m.prefix).join(', ')}`,
    );
}
