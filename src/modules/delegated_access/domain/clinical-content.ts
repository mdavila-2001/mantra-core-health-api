/**
 * Palabras que delatan un mensaje clínico. Se comparan sin acentos ni
 * mayúsculas y al comienzo de palabra (`vomit` alcanza «vómitos»); las que
 * terminan en `$` deben ser la palabra entera (`dolor$` no alcanza «Dolorosa»).
 * Es una heurística simple a propósito: no decide nada clínico, solo manda el
 * mensaje al doctor en vez de dejar que la persona de apoyo lo conteste.
 *
 * SEG A-A4: NO es una frontera de seguridad por sí sola (una lista de palabras
 * no cubre todo idioma ni toda forma de decir lo mismo). Por eso la vista previa
 * de la lista de la bandeja es solo metadatos para el personal de apoyo salvo
 * que se cumplan condiciones adicionales (ver `CommunitySupportInboxService`),
 * y esta lista cubre además diagnósticos, oncología, VIH, salud mental, salud
 * sexual y reproductiva, procedimientos y medicamentos, con y sin tildes, con
 * sustituciones básicas (`c4ncer`) y letras repetidas (`caaancer`).
 */
export const DEFAULT_CLINICAL_KEYWORDS: readonly string[] = [
  // Síntomas y malestares
  'dolor$',
  'dolores$',
  'duele',
  'duelen',
  'doliendo',
  'fiebre',
  'febril',
  'escalofrio',
  'sintoma',
  'malestar',
  'vomit',
  'nausea',
  'mareo',
  'vertigo',
  'desmay',
  'sangr',
  'hemorrag',
  'alergi',
  'erupcion',
  'sarpullido',
  'ronchas',
  'hinchaz',
  'edema',
  'tos$',
  'flema',
  'gripe',
  'resfri',
  'catarro',
  'diarrea',
  'estrenimiento',
  'reflujo',
  'cefalea',
  'migrana',
  'jaqueca',
  'insomnio',
  'herida',
  'quemadura',
  'mordedura',
  'convuls',
  'respirar',
  'falta de aire',
  'palpitacion',
  'bulto',
  'nodulo',
  'quiste',
  'lunar$',
  'lunares$',
  'seno$',
  'senos$',
  'mamari',
  'orina',
  'heces',
  // Diagnósticos y enfermedades
  'diagnostic',
  'enfermedad',
  'enfermo',
  'enferma$',
  'enfermos',
  'padezco',
  'padece',
  'patologia',
  'cronico',
  'cronica',
  'diabet',
  'hipertens',
  'hipotens',
  'hipotiroid',
  'hipertiroid',
  'tiroides',
  'colesterol',
  'trigliceridos',
  'anemia',
  'asma$',
  'bronquitis',
  'neumonia',
  'infeccion',
  'inflamacion',
  'gastritis',
  'ulcera',
  'colitis',
  'cistitis',
  'calculos',
  'cirrosis',
  'artritis',
  'osteoporosis',
  'lupus',
  'epilepsi',
  'parkinson',
  'alzheimer',
  'demencia',
  'esclerosis',
  'paralisis',
  'infarto',
  'derrame cerebral',
  'ictus',
  'angina',
  'arritmia',
  'taquicardia',
  'covid',
  'dengue',
  'chagas',
  'malaria',
  'tuberculosis',
  'discapacidad',
  'obesidad',
  'desnutricion',
  'presion arterial',
  'glucosa',
  'fractura',
  'esguince',
  // Oncología
  'cancer',
  'tumor',
  'biopsi',
  'oncolog',
  'quimio',
  'radioterap',
  'metastasi',
  'leucemi',
  'linfoma',
  'melanoma',
  'mamograf',
  'citologia',
  'papanicolau',
  'colposcop',
  // VIH e infecciones de transmisión sexual
  'vih$',
  'hiv$',
  'sida$',
  'seropositiv',
  'hepatitis',
  'sifilis',
  'gonorrea',
  'clamidia',
  'herpes',
  'papiloma',
  'transmision sexual',
  // Salud sexual y reproductiva
  'embaraz',
  'gestacion',
  'gestante',
  'parto',
  'cesarea',
  'aborto',
  'abortar',
  'legrado',
  'curetaje',
  'interrupcion del embarazo',
  'anticonceptiv',
  'pastilla del dia despues',
  'menstrua',
  'amenorrea',
  'endometriosis',
  'ovario',
  'utero',
  'prostata',
  'testiculo',
  'impotencia',
  'disfuncion erectil',
  'fertilidad',
  'infertilidad',
  'esterilidad',
  'fecundacion',
  'vasectomia',
  'ligadura de trompas',
  'diu$',
  // Salud mental y adicciones
  'depresi',
  'deprimid',
  'ansiedad',
  'angustia',
  'panico',
  'suicid',
  'quitarme la vida',
  'quitarse la vida',
  'quitar la vida',
  'acabar con mi vida',
  'no quiero vivir',
  'hacerme dano',
  'matarme',
  'autolesion',
  'psiquiatr',
  'psicolog',
  'psicoterap',
  'terapia',
  'bipolar',
  'esquizofreni',
  'trastorno',
  'autismo',
  'adiccion',
  'alcoholismo',
  'drogadiccion',
  'sobredosis',
  'estres postraumatico',
  'anorexia',
  'bulimia',
  'maltrato',
  'violencia',
  'abuso sexual',
  'violacion',
  'agresion sexual',
  // Procedimientos, estudios y hospitalización
  'cirug',
  'operacion',
  'operar',
  'operaron',
  'apendic',
  'hernia',
  'anestesia',
  'quirofano',
  'quirurgic',
  'endoscop',
  'colonoscop',
  'resonancia',
  'tomograf',
  'radiograf',
  'rayos x',
  'electrocardiograma',
  'hemograma',
  'transfusion',
  'dialisis',
  'trasplante',
  'protesis',
  'marcapaso',
  'internacion',
  'internado',
  'hospitaliz',
  'terapia intensiva',
  'urgencia',
  'emergencia',
  'ambulancia',
  'historia clinica',
  'historial medico',
  'examen',
  'analisis',
  'resultado',
  'tratamiento',
  'vacuna',
  // Medicamentos
  'ibuprofeno',
  'paracetamol',
  'aspirina',
  'diclofenaco',
  'naproxeno',
  'tramadol',
  'morfina',
  'codeina',
  'antibiotic',
  'amoxicilina',
  'azitromicina',
  'metformina',
  'losartan',
  'enalapril',
  'atorvastatina',
  'omeprazol',
  'clonazepam',
  'alprazolam',
  'diazepam',
  'sertralina',
  'fluoxetina',
  'antidepresiv',
  'ansiolitic',
  'anticoagul',
  'corticoide',
  'prednisona',
  'antihistamin',
  'levotiroxina',
  'testosterona',
  'estrogeno',
  'hormona',
  'medicacion',
  'medicamento',
  'dosis',
  'pastilla',
  'inyeccion',
  'receta',
  'insulina',
  // Variantes de escritura y portugués (SEG V-2)
  'kancer',
  'canser',
  'cancro',
  'gravida',
  'gravidez',
  'doenca',
  // Inglés
  'biopsy',
  'depress',
  'surgery',
  'pregnan',
  'diagnos',
  'medication',
  'symptom',
  'chemo',
  'therapy',
  'disease',
  'pain$',
  // Quechua (palabras frecuentes de salud)
  'nanay',
  'onqoy',
];

/** Dosis escritas con unidad (`500 mg`, `5 ml`): delatan una consulta de medicación. */
const DOSE_PATTERN = /\b\d+(?:[.,]\d+)?\s?(?:mg|ml|mcg|ui|gotas)\b/;

/** Veredicto de la heurística. */
export interface ClinicalContentVerdict {
  /** ¿El texto parece clínico? */
  readonly clinical: boolean;
  /** Palabras que lo delataron. */
  readonly matched: readonly string[];
}

/**
 * Letras de otros alfabetos que se leen como una letra latina (homoglifos). Se
 * aplica sobre el texto ya en minúsculas, sin marcas combinantes y con NFKC (que
 * ya pliega ancho completo, negritas matemáticas, ligaduras y círculos).
 */
const CONFUSABLES: Readonly<Record<string, string>> = {
  // Cirílico
  а: 'a',
  в: 'b',
  е: 'e',
  к: 'k',
  м: 'm',
  н: 'h',
  о: 'o',
  р: 'p',
  с: 'c',
  т: 't',
  у: 'y',
  х: 'x',
  ѕ: 's',
  і: 'i',
  ј: 'j',
  ӏ: 'l',
  һ: 'h',
  ԁ: 'd',
  ԛ: 'q',
  ԝ: 'w',
  ѵ: 'v',
  з: '3',
  ч: '4',
  и: 'n',
  // Griego
  α: 'a',
  β: 'b',
  γ: 'y',
  ε: 'e',
  η: 'n',
  ι: 'i',
  κ: 'k',
  μ: 'u',
  ν: 'v',
  ο: 'o',
  ρ: 'p',
  τ: 't',
  υ: 'u',
  χ: 'x',
  ω: 'w',
  ς: 's',
  // Latinas especiales y versalitas
  ı: 'i',
  ɑ: 'a',
  ł: 'l',
  đ: 'd',
  ø: 'o',
  ħ: 'h',
  ꜰ: 'f',
  ᴀ: 'a',
  ʙ: 'b',
  ᴄ: 'c',
  ᴅ: 'd',
  ᴇ: 'e',
  ɢ: 'g',
  ʜ: 'h',
  ɪ: 'i',
  ᴊ: 'j',
  ᴋ: 'k',
  ʟ: 'l',
  ᴍ: 'm',
  ɴ: 'n',
  ᴏ: 'o',
  ᴘ: 'p',
  ʀ: 'r',
  ꜱ: 's',
  ᴛ: 't',
  ᴜ: 'u',
  ᴠ: 'v',
  ᴡ: 'w',
  ʏ: 'y',
  ᴢ: 'z',
};

const CONFUSABLE_CHARS = new RegExp(
  `[${Object.keys(CONFUSABLES).join('')}]`,
  'g',
);

/**
 * Caracteres que no se ven y no son «formato» para Unicode (relleno hangul y
 * braille en blanco): se quitan igual que los `Cf`.
 */
const INVISIBLE = /[\u115f\u1160\u2800\u3164\uffa0]/g;

/**
 * Minúsculas, sin acentos y sin disfraz de formato (SEG V-2): NFKC (ancho
 * completo, negritas matemáticas, ligaduras), fuera los caracteres de formato
 * (`\p{Cf}`: ancho cero, guion blando, marcas de dirección) y las marcas
 * combinantes (`\p{M}`), homoglifos latinos/cirílicos/griegos plegados y toda
 * secuencia de espacios (incluidos los no separables y los saltos de línea)
 * reducida a uno.
 */
function normalize(text: string): string {
  return text
    .normalize('NFKC')
    .replace(/\p{Cf}/gu, '')
    .replace(INVISIBLE, '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(CONFUSABLE_CHARS, (c) => CONFUSABLES[c] ?? c)
    .replace(/\s+/g, ' ')
    .trim();
}

/** Separadores que se cuelan DENTRO de una palabra para romperla (`can-cer`, `c.a.n.c.e.r`). */
const INTRA_WORD_SEPARATORS =
  /(?<=[a-z0-9])[.\-_*·•'’`´~^|\\/+=#]+(?=[a-z0-9])/g;

/** Los mismos separadores entre PALABRAS (`falta-de-aire`, `falta.de.aire`). */
const WORD_SEPARATORS = /[.\-_*·•|\\/+=#~^]+/g;

/**
 * Tramos de tres o más letras o cifras sueltas separadas por uno a tres
 * símbolos o espacios (`c a n c e r`, `c . a . n`). Dentro de un tramo toda
 * posición es un límite de palabra, de modo que se compara contra el tramo
 * pegado, sin espacios.
 */
const SPELLED_RUN =
  /(?<![a-z0-9])[a-z0-9](?:[^a-z0-9]{1,3}[a-z0-9]){2,}(?![a-z0-9])/g;

/** Los tramos de letras sueltas del texto, ya pegados. */
function spelledRuns(plain: string): string[] {
  return (plain.match(SPELLED_RUN) ?? []).map((run) =>
    deObfuscate(run.replace(/[^a-z0-9]/g, '')),
  );
}

/** Marcas que invierten la dirección del texto: lo que se ve puede ser lo escrito al revés. */
const BIDI_REVERSAL = /[\u202b\u202e\u2067]/;

/** Sustituciones habituales para escribir una palabra sin que se lea («c4ncer»). */
const LEET: Readonly<Record<string, string>> = {
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '@': 'a',
  $: 's',
};

/**
 * Versión «sin disfraz» del texto: en una palabra que mezcla letras con cifras o
 * símbolos de sustitución se devuelven las letras (`c4ncer` → `cancer`), y las
 * letras repetidas tres o más veces se reducen a una (`caaancer`). Una cifra
 * suelta (`10`, `7654321`) no se toca.
 */
function deObfuscate(haystack: string): string {
  return haystack
    .replace(/[a-z0-9@$]+/g, (word) =>
      /[a-z]/.test(word) && /[0-9@$]/.test(word)
        ? word.replace(/[0-9@$]/g, (c) => LEET[c] ?? c)
        : word,
    )
    .replace(/([a-z])\1{2,}/g, '$1');
}

/** Patrones ya compilados por palabra: la lista es larga y se consulta por cada mensaje. */
const PATTERN_CACHE = new Map<string, { word: string; pattern: RegExp }>();

function compiled(raw: string): { word: string; pattern: RegExp } {
  const cached = PATTERN_CACHE.get(raw);
  if (cached) return cached;
  const exact = raw.endsWith('$');
  const word = normalize(exact ? raw.slice(0, -1) : raw);
  const pattern = new RegExp(
    `(^|[^a-z0-9])${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}${exact ? '($|[^a-z0-9])' : ''}`,
  );
  const entry = { word, pattern };
  PATTERN_CACHE.set(raw, entry);
  return entry;
}

/**
 * ¿El texto parece clínico? Sirve para dos cosas: marcar un mensaje de paciente
 * para derivarlo al doctor, y negarle a la persona de apoyo un texto suyo que
 * dé contenido clínico.
 *
 * @param text - Texto del mensaje.
 * @param keywords - Palabras a buscar; por defecto las del producto.
 * @returns Si parece clínico y qué palabras lo delataron.
 */
export function looksClinical(
  text: string | undefined,
  keywords: readonly string[] = DEFAULT_CLINICAL_KEYWORDS,
): ClinicalContentVerdict {
  if (!text) return { clinical: false, matched: [] };
  const plain = normalize(text);
  // SEG V-2: además del texto tal cual y «sin disfraz», se mira (a) con los
  // separadores colados dentro de la palabra quitados (`can-cer`), (b) con los
  // separadores entre palabras vueltos espacio (`falta-de-aire`), (c) los
  // tramos de letras sueltas pegados (`c a n c e r`) y (d) invertido si el
  // texto trae una marca de dirección que lo invierte al mostrarse. Son vistas
  // ADICIONALES: solo pueden añadir coincidencias (más ocultamiento), nunca quitar.
  const views = new Set<string>([plain]);
  const joined = plain.replace(INTRA_WORD_SEPARATORS, '');
  views.add(joined);
  views.add(plain.replace(WORD_SEPARATORS, ' ').replace(/ {2,}/g, ' '));
  if (BIDI_REVERSAL.test(text)) {
    views.add([...plain].reverse().join(''));
  }
  const haystacks = [...views].flatMap((view) => [view, deObfuscate(view)]);
  const runs = spelledRuns(plain);
  const matched: string[] = [];
  for (const raw of keywords) {
    const { word, pattern } = compiled(raw);
    const compact = word.replace(/ /g, '');
    if (
      haystacks.some((h) => pattern.test(h)) ||
      runs.some((run) => run.includes(compact))
    ) {
      matched.push(word);
    }
  }
  // La dosis (`500 mg`) solo en el original.
  if (DOSE_PATTERN.test(plain)) matched.push('dosis con unidad');
  return { clinical: matched.length > 0, matched };
}

/**
 * Lista de palabras del entorno: `SUPPORT_CLINICAL_KEYWORDS` (separadas por
 * coma) reemplaza la de por defecto y `SUPPORT_CLINICAL_KEYWORDS_EXTRA` la
 * amplía. Una variable vacía no deja la lista sin palabras.
 *
 * @param env - Variables de entorno.
 * @returns Las palabras vigentes.
 */
export function clinicalKeywordsFromEnv(
  env: Readonly<Record<string, string | undefined>>,
): readonly string[] {
  const list = (value: string | undefined): string[] =>
    (value ?? '')
      .split(',')
      .map((word) => word.trim().toLowerCase())
      .filter((word) => word.length > 0);
  const replacement = list(env.SUPPORT_CLINICAL_KEYWORDS);
  const base = replacement.length > 0 ? replacement : DEFAULT_CLINICAL_KEYWORDS;
  return [...base, ...list(env.SUPPORT_CLINICAL_KEYWORDS_EXTRA)];
}
