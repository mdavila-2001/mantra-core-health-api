import { BadRequestException } from '@nestjs/common';
import { badRequestWithReason } from '../../common/errors/reasoned-http-exceptions';
import { SystemErrorReason } from '../../common/errors/system-error-reasons';
import { decodeKeysetCursor, encodeKeysetCursor } from '../../common';
import { normalizeSearchText } from '../../common/text/normalize-search-text';
import localKeys from './data/local-concept-keys.json';

/** Familias de estudio que publica el catálogo. */
export const STUDY_FAMILIES = [
  'LAB',
  'IMAGING',
  'CARDIO',
  'PATHOLOGY',
  'PROCEDURE',
] as const;
export type StudyFamily = (typeof STUDY_FAMILIES)[number];

/** Tope del texto de búsqueda y de palabras evaluadas (acota el costo de la consulta). */
export const MAX_QUERY_LENGTH = 100;
export const MAX_QUERY_TOKENS = 6;

/** Prefijo del código local (`LAB_`, `IMG_`…) -> familia. Sólo se usa para los 88 locales sin propiedad `study_family`. */
const LEGACY_PREFIX_FAMILY: Record<string, StudyFamily> = {
  LAB: 'LAB',
  IMG: 'IMAGING',
  CAR: 'CARDIO',
  PAT: 'PATHOLOGY',
  PRO: 'PROCEDURE',
};

/**
 * Familia de cada estudio local ya sembrado por el arranque, por la clave con que
 * `catalog_concepts.code` lo guarda (`clinical:STUDY_HEMOGRAMA`). El catálogo
 * investigado trae la familia como propiedad del concepto; esto cubre sólo los
 * locales (cardiología, patología, procedimientos) que ese catálogo no describe.
 */
export const LEGACY_FAMILY_BY_KEY: Readonly<Record<string, StudyFamily>> =
  Object.fromEntries(
    Object.entries(localKeys.studies).map(([code, key]) => [
      key,
      LEGACY_PREFIX_FAMILY[code.slice(0, 3)],
    ]),
  );

/** Valida `family`; ausente significa todas. */
export function parseFamily(value?: string): StudyFamily | undefined {
  if (value === undefined || value === '') return undefined;
  const upper = value.toUpperCase();
  if (!(STUDY_FAMILIES as readonly string[]).includes(upper)) {
    throw new BadRequestException(
      `family no admitida. Admitidas: ${STUDY_FAMILIES.join(', ')}`,
    );
  }
  return upper as StudyFamily;
}

/**
 * Palabras de búsqueda normalizadas (sin tildes ni mayúsculas). Vacío si no hay texto.
 * Todas las palabras deben aparecer (en el nombre, un sinónimo, el código o un
 * componente), en cualquier orden.
 */
export function parseSearchTokens(value?: string): string[] {
  if (value === undefined) return [];
  if (value.length > MAX_QUERY_LENGTH) {
    throw new BadRequestException(
      `q admite hasta ${MAX_QUERY_LENGTH} caracteres`,
    );
  }
  return normalizeSearchText(value)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, MAX_QUERY_TOKENS);
}

/** Posición de una página: clave de orden y desempate por id. */
export interface CatalogCursor {
  key: string;
  id: string;
}

export function encodeCatalogCursor(cursor: CatalogCursor): string {
  return encodeKeysetCursor({ k: cursor.key, id: cursor.id });
}

export function decodeCatalogCursor(value: string): CatalogCursor {
  const raw = decodeKeysetCursor(value);
  if (typeof raw.k !== 'string' || typeof raw.id !== 'string') {
    throw badRequestWithReason(
      'El cursor de paginación no es válido',
      SystemErrorReason.INVALID_CURSOR,
      { parameter: 'cursor' },
    );
  }
  return { key: raw.k, id: raw.id };
}

/** Avisos de uso del contenido de terceros (D15). Deben acompañar al catálogo en pantalla. */
export const ATTRIBUTIONS = {
  LOINC: {
    source: 'LOINC',
    url: 'https://loinc.org',
    license: 'https://loinc.org/license',
    text: 'Este material contiene contenido de LOINC® (http://loinc.org). LOINC es © Regenstrief Institute, Inc. y el Comité LOINC, y está disponible sin costo bajo la licencia de http://loinc.org/license. LOINC® es una marca registrada de Regenstrief Institute, Inc.',
  },
  DICOM: {
    source: 'DICOM',
    url: 'https://dicom.nema.org',
    license: 'https://www.dicomstandard.org/',
    text: 'Modalidades, regiones anatómicas y lateralidad según DICOM® PS3.16 (NEMA). DICOM® es marca registrada de la National Electrical Manufacturers Association.',
  },
  SNOMED: {
    source: 'SNOMED CT',
    url: 'https://www.snomed.org',
    license: 'https://www.snomed.org/snomed-ct/get-snomed',
    text: 'Este material incluye SNOMED Clinical Terms® (SNOMED CT®), propiedad de SNOMED International. Todos los derechos reservados.',
  },
  RADLEX: {
    source: 'RadLex',
    url: 'https://radlex.org',
    license: 'https://radlex.org/RSNA_license',
    text: 'Identificadores RadLex Playbook (RPID) de la Radiological Society of North America (RSNA).',
  },
  UBERON: {
    source: 'UBERON',
    url: 'https://obophenotype.github.io/uberon/',
    license: 'https://creativecommons.org/licenses/by/3.0/',
    text: 'Estructuras anatómicas enlazadas a UBERON (CC BY 3.0).',
  },
} as const;
export type AttributionKey = keyof typeof ATTRIBUTIONS;
