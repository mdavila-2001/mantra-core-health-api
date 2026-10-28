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
 * Categorías con ramas diagnósticas mezcladas con terapéuticas: se revisaron
 * tipo por tipo contra la EMDN V2 (ver INCLUDED_TYPE_PREFIXES); lo no listado
 * de estas categorías no se exporta.
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
 * Tipos fuera de W incluidos explícitamente, decididos tipo por tipo leyendo
 * el nombre oficial en la EMDN V2 y revisados contra la v2026 oficial (la
 * telemetría de signos vitales Z120306 pasó a Z12030206, dentro de Z120302). Cada entrada incluye el código y toda su
 * descendencia. Lo que NO está acá dentro de C, G, N, Q, R, U, V y Z queda
 * excluido por terapéutico, quirúrgico o mixto. Exclusiones notables: Z1101
 * (radioterapia), Z119002/Z119005 (dosimetría), los «accesorios / software /
 * otros» de grupos mixtos (Z1190xx, Z1290xx, Z12078x), Z121011 (estimulación
 * y evaluación), Z129003/Z129006 (bicicletas y cintas «de fisioterapia y/o
 * diagnóstico»), Z120209/Z120211 (neuroendoscopía y artroscopía, sobre todo
 * quirúrgicas), C0104 terapéuticos (angioplastia, embolización), N010103
 * (electroestimuladores), R070102/R070103 (hemostasia y lavado bronquial),
 * V9015 (geles conductores, compartidos con terapia).
 */
const VERIFIED =
  'EMDN v2026 (Comisión Europea, webgate.ec.europa.eu/dyna2/emdn/build/EMDN v2026_EN..xlsx)';
export const INCLUDED_TYPE_PREFIXES = [
  {
    prefix: 'Z1102',
    motive:
      'Medicina nuclear: gammacámaras, PET, SPECT/CT, escáneres de radioisótopos (imagen diagnóstica).',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'Z1103',
    motive:
      'Radiología diagnóstica e intervencionista: angiografía digital, mamografía, panorámica dental, TC, radiología digital.',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'Z1104',
    motive: 'Ecografía: ecógrafos y sondas.',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'Z1105',
    motive: 'Resonancia magnética.',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'Z1106',
    motive:
      'Gestión de bioimágenes digitales: radiografía computarizada (CR), PACS.',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'Z1107',
    motive:
      'Soporte de imagen radiográfica en película: negatoscopios, procesadoras, impresoras láser.',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'Z119001',
    motive: 'Densitometría ósea.',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'Z119003',
    motive: 'Fotografía de bioimagen.',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'Z119007',
    motive: 'Módulos de adquisición de imagen.',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'Z119008',
    motive:
      'Monitores de visualización de bioimágenes e informes diagnósticos.',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'Z119011',
    motive:
      'Sistemas estereotácticos de mamografía, ecografía o radiografía (guía de biopsia).',
    verifiedAgainst: VERIFIED,
  },
  { prefix: 'Z119013', motive: 'Termógrafos.', verifiedAgainst: VERIFIED },
  {
    prefix: 'Z120204',
    motive: 'Adquisición y gestión de imágenes endoscópicas.',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'Z120205',
    motive: 'Endoscopía del tracto gastrointestinal superior.',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'Z120206',
    motive: 'Endoscopía del tracto gastrointestinal inferior.',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'Z120207',
    motive: 'Endoscopía genitourinaria.',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'Z120208',
    motive: 'Endoscopía pulmonar.',
    verifiedAgainst: VERIFIED,
  },
  { prefix: 'Z120210', motive: 'Endoscopía ORL.', verifiedAgainst: VERIFIED },
  {
    prefix: 'Z120212',
    motive: 'Cápsulas endoscópicas.',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'Z120302',
    motive: 'Monitorización de signos vitales.',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'Z120401',
    motive:
      'Diagnóstico y monitorización en medicina general: dermatoscopios, capilaroscopios, glucómetros y sistemas de monitorización de glucosa, pletismógrafos, flujómetros.',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'Z120501',
    motive: 'Análisis de esfuerzo (ergometría).',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'Z120503',
    motive: 'Electrocardiógrafos.',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'Z120504',
    motive: 'Holter de parámetros cardiovasculares.',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'Z120505',
    motive: 'Medición del gasto cardíaco.',
    verifiedAgainst: VERIFIED,
  },
  { prefix: 'Z120507', motive: 'Cardiografía.', verifiedAgainst: VERIFIED },
  {
    prefix: 'Z120508',
    motive: 'Telemetría cardíaca.',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'Z120605',
    motive: 'Análisis electromiográfico.',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'Z120617',
    motive: 'Sistemas integrados de análisis del movimiento.',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'Z120625',
    motive: 'Captura y análisis cinemático del movimiento.',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'Z120626',
    motive: 'Sistemas dinamométricos de análisis del movimiento.',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'Z120701',
    motive: 'Manometría gastroenterológica.',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'Z120702',
    motive: 'Holter de pH gastroesofágico.',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'Z120703',
    motive: 'Análisis de la función esofágica.',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'Z120704',
    motive: 'Monitor de pH gástrico.',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'Z120707',
    motive: 'Equipos de intolerancia a la lactosa (prueba diagnóstica).',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'Z120801',
    motive: 'Diagnóstico prenatal.',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'Z121002',
    motive: 'Monitorización del sistema nervioso.',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'Z121003',
    motive: 'Electroencefalografía.',
    verifiedAgainst: VERIFIED,
  },
  { prefix: 'Z121004', motive: 'Electromiografía.', verifiedAgainst: VERIFIED },
  { prefix: 'Z121005', motive: 'Polisomnografía.', verifiedAgainst: VERIFIED },
  {
    prefix: 'Z121007',
    motive: 'Telemetría electromiográfica.',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'Z121008',
    motive: 'Telemetría electroencefalográfica.',
    verifiedAgainst: VERIFIED,
  },
  { prefix: 'Z121010', motive: 'Holter EEG.', verifiedAgainst: VERIFIED },
  {
    prefix: 'Z121012',
    motive: 'Magnetoencefalografía.',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'Z121201',
    motive: 'Evaluación y diagnóstico oftalmológico.',
    verifiedAgainst: VERIFIED,
  },
  { prefix: 'Z121401', motive: 'Audiómetros.', verifiedAgainst: VERIFIED },
  {
    prefix: 'Z121403',
    motive: 'Audiometría por potenciales evocados.',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'Z121404',
    motive: 'Análisis del sistema vestibular.',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'Z1215',
    motive:
      'Neumología y fisiopatología respiratoria: espirometría y telemetría espirométrica (el grupo no contiene equipos de terapia).',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'Z121602',
    motive: 'Holter de parámetros urodinámicos.',
    verifiedAgainst: VERIFIED,
  },
  { prefix: 'Z121604', motive: 'Urodinamia.', verifiedAgainst: VERIFIED },
  { prefix: 'Z121605', motive: 'Uroflujómetros.', verifiedAgainst: VERIFIED },
  {
    prefix: 'Z129009',
    motive: 'Equipos de análisis de potenciales.',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'Z129010',
    motive: 'Holter multidisciplinario.',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'Z129011',
    motive: 'Telemetría multidisciplinaria.',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'Z129012',
    motive: 'Sistemas poligráficos multifuncionales.',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'Z13',
    motive:
      'Consumibles inespecíficos para instrumentos de diagnóstico: películas radiográficas y papel de registro diagnóstico.',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'C01040101',
    motive:
      'Dispositivos diagnósticos de angiografía cardíaca (catéteres diagnósticos, ecografía intracoronaria).',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'C01040201',
    motive:
      'Dispositivos diagnósticos de angiografía periférica (catéteres diagnósticos, ecografía intravascular).',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'C01040401',
    motive:
      'Dispositivos diagnósticos de angiografía neurovascular (nuevo en v2026).',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'C040401',
    motive:
      'Guías neurovasculares diagnósticas (así las nombra la EMDN v2026; las guías sin calificativo diagnóstico quedan fuera).',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'C010403',
    motive: 'Medición de la reserva fraccional de flujo (FFR).',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'C0201',
    motive: 'Electrofisiología y mapeo cardíaco.',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'C0205',
    motive: 'Dispositivos de diagnóstico cardíaco: electrodos de ECG.',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'C9003',
    motive: 'Sensores cardiovasculares: sensores de oximetría de pulso.',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'C9005',
    motive: 'Fonendoscopios y estetoscopios.',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'C9006',
    motive: 'Esfigmomanómetros aneroides.',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'G0103',
    motive: 'Sondas diagnósticas oroesofágicas.',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'G0206',
    motive:
      'Dispositivos para procedimientos diagnósticos gastrointestinales (manometría, colangiografía, anoscopios, proctoscopios).',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'G0307',
    motive:
      'Dispositivos diagnósticos de endoscopía gastrointestinal (imagen, pH, marcadores de tránsito, cromoendoscopía).',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'N010101',
    motive: 'Electrodos electromiográficos.',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'N010102',
    motive: 'Electrodos electroencefalográficos.',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'Q029002',
    motive: 'Electrodos oftalmológicos de diagnóstico, de un solo uso.',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'R070101',
    motive: 'Sondas de broncoscopía, de un solo uso.',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'R9007',
    motive: 'Dispositivos de un solo uso para pruebas de función pulmonar.',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'U05',
    motive:
      'Urodinamia: catéteres de cistomanometría, presión-flujo, perfil uretral, presión intraabdominal, cavernosometría.',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'U1002',
    motive: 'Dispositivos de estudio fetal.',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'U1006',
    motive: 'Amnioscopios rígidos de un solo uso.',
    verifiedAgainst: VERIFIED,
  },
  {
    prefix: 'V03',
    motive:
      'Dispositivos de medición: termómetros, sondas de temperatura, calibres, goniómetros, tallímetros, balanzas.',
    verifiedAgainst: VERIFIED,
  },
];

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
    return { inScope: false, rule: `no-diagnostico-tras-revision:${cat}` };
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
