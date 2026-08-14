import { defineModuleConcepts } from '../../common/seed/concept-seed';

/**
 * Conceptos del módulo Procedures & Perioperative (53), hoy los del **registro
 * odontológico**.
 *
 * ## Por qué odontología no trae tabla propia
 *
 * El plan del carril daba por hecho que había que modelar `dental_procedures`
 * desde cero, y con eso arrastraba un bloqueador: el DDL de este sistema no se
 * escribe a mano y `SQL/` no vive en este repositorio. Leyendo el modelo, la
 * tabla ya está: `clinical.procedures` es un registro de procedimientos
 * **general** —paciente, código, profesional, fecha, nota, categoría— y
 * `procedures_perioperative.procedure_body_sites` cuelga de ella con sitio y
 * lateralidad. Un procedimiento odontológico es un procedimiento clínico cuya
 * categoría es odontológica y cuyo sitio anatómico es una pieza dentaria.
 *
 * Lo único que faltaba eran los conceptos, y esos se siembran desde TypeScript.
 * Así que este carril no toca `SQL/` ni necesita coordinar con quien tenga el
 * modelo: no hay DDL nuevo.
 *
 * ## La pieza es un concepto, no un número suelto
 *
 * `procedure_body_sites.body_site_concept_id` es NOT NULL y apunta a
 * `terminology.catalog_concepts`: guardar «11» como texto no era una opción.
 * Se siembran las **32 piezas permanentes en notación FDI** (ISO 3950), que es
 * la que usa la odontología fuera de Estados Unidos, y los **cuatro
 * cuadrantes**, porque hay tratamientos que se registran por cuadrante y no por
 * pieza —un raspaje, por ejemplo—. La dentición temporal (51-85) queda fuera a
 * propósito: se agrega el día que haya odontopediatría, y agregarla es una
 * entrada más en este arreglo.
 *
 * El número FDI ya codifica el cuadrante (el primer dígito), así que la pieza y
 * el cuadrante no se guardan a la vez: se guarda **uno de los dos**, el más
 * preciso que se conozca.
 *
 * ## Los códigos de procedimiento son un mínimo, no una nomenclatura
 *
 * Diez códigos de uso corriente, para que el registro se pueda usar el primer
 * día sin esperar a que alguien cargue una nomenclatura completa. El endpoint
 * acepta **cualquier** concepto válido como código, no sólo estos: la
 * restricción real es la clave foránea, no esta lista.
 */
export const { seeds: PROCEDURES_PERIOPERATIVE_CONCEPT_SEEDS, ids: PERIOP } =
  defineModuleConcepts('procedures_perioperative', {
    // --- clasificación del registro odontológico -----------------------------
    DENTAL_PROCEDURE_CATEGORY: {
      code: 'DENTAL_PROC',
      display: 'Dental procedure',
    },
    DENTAL_SITE_ROLE: {
      code: 'DENTAL_SITE_TREATED',
      display: 'Tooth or quadrant treated',
    },

    // --- códigos de procedimiento odontológico -------------------------------
    DENTAL_EXAM: { code: 'DENT_EXAM', display: 'Dental examination' },
    DENTAL_RADIOGRAPH: { code: 'DENT_RX', display: 'Dental radiograph' },
    DENTAL_PROPHYLAXIS: {
      code: 'DENT_PROPHY',
      display: 'Dental prophylaxis (cleaning)',
    },
    DENTAL_SCALING: {
      code: 'DENT_SCALING',
      display: 'Periodontal scaling and root planing',
    },
    DENTAL_RESTORATION: {
      code: 'DENT_RESTORATION',
      display: 'Dental restoration (filling)',
    },
    DENTAL_ENDODONTICS: {
      code: 'DENT_ENDO',
      display: 'Endodontic treatment (root canal)',
    },
    DENTAL_CROWN: { code: 'DENT_CROWN', display: 'Dental crown placement' },
    DENTAL_EXTRACTION: { code: 'DENT_EXTRACTION', display: 'Tooth extraction' },
    DENTAL_SURGICAL_EXTRACTION: {
      code: 'DENT_SURG_EXTRACTION',
      display: 'Surgical tooth extraction',
    },
    DENTAL_OTHER: { code: 'DENT_OTHER', display: 'Other dental procedure' },

    // --- cuadrantes (FDI) ----------------------------------------------------
    QUADRANT_1: { code: 'FDI_Q1', display: 'Quadrant 1 — upper right' },
    QUADRANT_2: { code: 'FDI_Q2', display: 'Quadrant 2 — upper left' },
    QUADRANT_3: { code: 'FDI_Q3', display: 'Quadrant 3 — lower left' },
    QUADRANT_4: { code: 'FDI_Q4', display: 'Quadrant 4 — lower right' },

    // --- cuadrante 1 (upper right) -------------------------------------------
    TOOTH_11: {
      code: 'FDI_11',
      display: 'Tooth 11 — upper right central incisor',
    },
    TOOTH_12: {
      code: 'FDI_12',
      display: 'Tooth 12 — upper right lateral incisor',
    },
    TOOTH_13: { code: 'FDI_13', display: 'Tooth 13 — upper right canine' },
    TOOTH_14: {
      code: 'FDI_14',
      display: 'Tooth 14 — upper right first premolar',
    },
    TOOTH_15: {
      code: 'FDI_15',
      display: 'Tooth 15 — upper right second premolar',
    },
    TOOTH_16: { code: 'FDI_16', display: 'Tooth 16 — upper right first molar' },
    TOOTH_17: {
      code: 'FDI_17',
      display: 'Tooth 17 — upper right second molar',
    },
    TOOTH_18: { code: 'FDI_18', display: 'Tooth 18 — upper right third molar' },

    // --- cuadrante 2 (upper left) --------------------------------------------
    TOOTH_21: {
      code: 'FDI_21',
      display: 'Tooth 21 — upper left central incisor',
    },
    TOOTH_22: {
      code: 'FDI_22',
      display: 'Tooth 22 — upper left lateral incisor',
    },
    TOOTH_23: { code: 'FDI_23', display: 'Tooth 23 — upper left canine' },
    TOOTH_24: {
      code: 'FDI_24',
      display: 'Tooth 24 — upper left first premolar',
    },
    TOOTH_25: {
      code: 'FDI_25',
      display: 'Tooth 25 — upper left second premolar',
    },
    TOOTH_26: { code: 'FDI_26', display: 'Tooth 26 — upper left first molar' },
    TOOTH_27: { code: 'FDI_27', display: 'Tooth 27 — upper left second molar' },
    TOOTH_28: { code: 'FDI_28', display: 'Tooth 28 — upper left third molar' },

    // --- cuadrante 3 (lower left) --------------------------------------------
    TOOTH_31: {
      code: 'FDI_31',
      display: 'Tooth 31 — lower left central incisor',
    },
    TOOTH_32: {
      code: 'FDI_32',
      display: 'Tooth 32 — lower left lateral incisor',
    },
    TOOTH_33: { code: 'FDI_33', display: 'Tooth 33 — lower left canine' },
    TOOTH_34: {
      code: 'FDI_34',
      display: 'Tooth 34 — lower left first premolar',
    },
    TOOTH_35: {
      code: 'FDI_35',
      display: 'Tooth 35 — lower left second premolar',
    },
    TOOTH_36: { code: 'FDI_36', display: 'Tooth 36 — lower left first molar' },
    TOOTH_37: { code: 'FDI_37', display: 'Tooth 37 — lower left second molar' },
    TOOTH_38: { code: 'FDI_38', display: 'Tooth 38 — lower left third molar' },

    // --- cuadrante 4 (lower right) -------------------------------------------
    TOOTH_41: {
      code: 'FDI_41',
      display: 'Tooth 41 — lower right central incisor',
    },
    TOOTH_42: {
      code: 'FDI_42',
      display: 'Tooth 42 — lower right lateral incisor',
    },
    TOOTH_43: { code: 'FDI_43', display: 'Tooth 43 — lower right canine' },
    TOOTH_44: {
      code: 'FDI_44',
      display: 'Tooth 44 — lower right first premolar',
    },
    TOOTH_45: {
      code: 'FDI_45',
      display: 'Tooth 45 — lower right second premolar',
    },
    TOOTH_46: { code: 'FDI_46', display: 'Tooth 46 — lower right first molar' },
    TOOTH_47: {
      code: 'FDI_47',
      display: 'Tooth 47 — lower right second molar',
    },
    TOOTH_48: { code: 'FDI_48', display: 'Tooth 48 — lower right third molar' },
  });

/**
 * Los códigos de procedimiento odontológico sembrados, en el orden en que se
 * ofrecen.
 *
 * Vive acá y no en el servicio para que agregar un código sea una sola edición:
 * la definición de arriba y esta lista, en el mismo archivo y a la vista.
 */
export const DENTAL_PROCEDURE_CODE_KEYS = [
  'DENTAL_EXAM',
  'DENTAL_RADIOGRAPH',
  'DENTAL_PROPHYLAXIS',
  'DENTAL_SCALING',
  'DENTAL_RESTORATION',
  'DENTAL_ENDODONTICS',
  'DENTAL_CROWN',
  'DENTAL_EXTRACTION',
  'DENTAL_SURGICAL_EXTRACTION',
  'DENTAL_OTHER',
] as const satisfies readonly (keyof typeof PERIOP)[];

/** Las 32 piezas permanentes, en orden FDI. */
export const DENTAL_TOOTH_KEYS = [
  'TOOTH_11',
  'TOOTH_12',
  'TOOTH_13',
  'TOOTH_14',
  'TOOTH_15',
  'TOOTH_16',
  'TOOTH_17',
  'TOOTH_18',
  'TOOTH_21',
  'TOOTH_22',
  'TOOTH_23',
  'TOOTH_24',
  'TOOTH_25',
  'TOOTH_26',
  'TOOTH_27',
  'TOOTH_28',
  'TOOTH_31',
  'TOOTH_32',
  'TOOTH_33',
  'TOOTH_34',
  'TOOTH_35',
  'TOOTH_36',
  'TOOTH_37',
  'TOOTH_38',
  'TOOTH_41',
  'TOOTH_42',
  'TOOTH_43',
  'TOOTH_44',
  'TOOTH_45',
  'TOOTH_46',
  'TOOTH_47',
  'TOOTH_48',
] as const satisfies readonly (keyof typeof PERIOP)[];

/** Los cuatro cuadrantes, en orden FDI. */
export const DENTAL_QUADRANT_KEYS = [
  'QUADRANT_1',
  'QUADRANT_2',
  'QUADRANT_3',
  'QUADRANT_4',
] as const satisfies readonly (keyof typeof PERIOP)[];

/**
 * Los identificadores de todos los sitios odontológicos válidos.
 *
 * Un `Set` y no un arreglo porque su único uso es la comprobación de
 * pertenencia al validar el alta: el sitio tiene que ser una pieza o un
 * cuadrante, y no cualquier concepto del catálogo.
 */
export const DENTAL_SITE_CONCEPT_IDS: ReadonlySet<string> = new Set([
  ...DENTAL_TOOTH_KEYS.map((key) => PERIOP[key]),
  ...DENTAL_QUADRANT_KEYS.map((key) => PERIOP[key]),
]);
