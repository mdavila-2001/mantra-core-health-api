import type { AuthenticatedUser } from '../../common';
import { CLINICAL_ROLE_SEED } from '../authz/authz.seed';

/**
 * Audiencia y antigüedad de las secciones de farmacología clínica
 * (`clinical-pharmacology`, cargadas por `tools/terminology-import/clinical-pharmacology/`).
 *
 * ## Qué hay en la base
 *
 * Cada sección de una monografía es una fila de `terminology.concept_properties`
 * con código `pharmacology_section_<clave>` y un `value_json` que trae, entre
 * otros, `audience` y `document`/`retrievedAt` (la procedencia). No hay columna
 * de visibilidad: la audiencia viaja dentro del JSON, así que la lectura es la
 * que tiene que respetarla.
 *
 * ## Posología solo para el personal clínico (decisión del propietario, issue 824)
 *
 * Toda sección se carga con `audience: 'professional'`, la posología incluida
 * (el corte S3 del glosario prohíbe la posología para pacientes). La autoridad
 * es la API: ocultar el bloque en el front no es seguridad. Las lecturas que
 * devuelven propiedades de un concepto (`$lookup` y la ficha por id) omiten las
 * filas `professional` salvo que el sujeto tenga un rol clínico.
 *
 * ## Antigüedad del dato (estado S7)
 *
 * CIMA no publica la fecha de revisión de 788 fichas técnicas. Esas secciones se
 * cargan igual, con `document.versionUnpublished: true`, y la lectura lo expone
 * como `sourceAge.known === false` (con la fecha de consulta) para que el front
 * muestre «antigüedad desconocida» en vez de un dato sin edad.
 */

/** Valor de `audience` que restringe una fila al personal clínico. */
export const PROFESSIONAL_AUDIENCE = 'professional';

/**
 * Roles clínicos que ven contenido `professional`: los asistenciales del
 * catálogo de actores (`baseRole: 'CLINICAL'`, p. ej. `CLINICIAN`,
 * `PRACTITIONER`, `SURGEON`). El catálogo terminológico no tiene tenant, así
 * que no se mira el ámbito del rol.
 */
export const CLINICAL_ROLES: ReadonlySet<string> = new Set(
  CLINICAL_ROLE_SEED.filter((role) => role.baseRole === 'CLINICAL').map(
    (role) => role.code,
  ),
);

/** Del sujeto solo importan sus roles (y su ámbito, para distinguir el `SUPERADMIN` de plataforma). */
export type Viewer = Pick<AuthenticatedUser, 'roles' | 'scopedRoles'>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** `true` si la fila (su `value_json`) está restringida al personal clínico. */
export function isProfessionalOnly(valueJson: unknown): boolean {
  return isRecord(valueJson) && valueJson.audience === PROFESSIONAL_AUDIENCE;
}

/**
 * `true` si el sujeto tiene un rol clínico, o es el `SUPERADMIN` de plataforma
 * (el comodín del `RolesGuard`: un `SUPERADMIN` que el token trae también en
 * `scopedRoles` es una asignación acotada a un tenant y no lo es). Sin sujeto:
 * no (falla cerrado).
 */
export function canReadProfessionalContent(
  viewer: Viewer | undefined,
): boolean {
  const roles = viewer?.roles ?? [];
  if (roles.some((role) => CLINICAL_ROLES.has(role))) return true;
  return (
    roles.includes('SUPERADMIN') &&
    !Object.values(viewer?.scopedRoles ?? {}).some((codes) =>
      codes.includes('SUPERADMIN'),
    )
  );
}

/**
 * Las propiedades que `viewer` puede ver: las `professional` se omiten salvo
 * que tenga un rol clínico. No toca el resto (glosario, imágenes, etc.).
 */
export function visibleProperties<T extends { valueJson: unknown }>(
  properties: readonly T[],
  viewer: Viewer | undefined,
): T[] {
  if (canReadProfessionalContent(viewer)) return [...properties];
  return properties.filter(
    (property) => !isProfessionalOnly(property.valueJson),
  );
}

/** Antigüedad del dato de una sección, tal como la expone la lectura. */
export interface SourceAge {
  /** `false` si la fuente no publica la fecha de la versión. */
  known: boolean;
  /** Fecha de la fuente tal como se cargó (ISO o `mm/aaaa` en CIMA); solo si `known`. */
  sourceDate?: string;
  /** Cuándo se consultó la fuente (ISO). Es la fecha que vale cuando `known` es `false`. */
  retrievedAt: string;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}/;

/**
 * Antigüedad de una sección de farmacología, o `undefined` si el valor no es una
 * sección (sin `document` ni `retrievedAt`): una propiedad cualquiera no tiene edad.
 *
 * Fecha de la fuente, en este orden: `document.effectiveDate`, `document.version`
 * si es una fecha, `document.revisionDateInText`. Una ficha con
 * `versionUnpublished`, o sin ninguna de las tres, es de antigüedad desconocida.
 */
export function sourceAgeOf(valueJson: unknown): SourceAge | undefined {
  if (
    !isRecord(valueJson) ||
    !isRecord(valueJson.document) ||
    typeof valueJson.retrievedAt !== 'string'
  ) {
    return undefined;
  }
  const document = valueJson.document;
  const retrievedAt = valueJson.retrievedAt;
  const asString = (value: unknown): string | undefined =>
    typeof value === 'string' && value.trim() !== '' ? value : undefined;
  const version = asString(document.version);
  const sourceDate =
    document.versionUnpublished === true
      ? undefined
      : (asString(document.effectiveDate) ??
        (version !== undefined && ISO_DATE.test(version)
          ? version
          : undefined) ??
        asString(document.revisionDateInText));
  return sourceDate === undefined
    ? { known: false, retrievedAt }
    : { known: true, sourceDate, retrievedAt };
}
