/**
 * Roles del representante legal y de las gerencias de contacto de un tenant
 * (subtarea 1.4).
 *
 * ## Qué resuelve
 *
 * El registro de procesos pide, en el alta de aseguradora (y, repetido igual,
 * en farmacia/laboratorio/imagenología), el nombre del representante legal con
 * su poder notariado en PDF y su correo, más tres gerencias de contacto
 * —general, comercial y marketing— con nombre, celular y correo.
 * `directory.tenant_legal_representatives` existe completa desde v4.0.4 y
 * hasta ahora **no tenía un solo escritor**: lo único que faltaba era el
 * diccionario que traduce «qué cargo declara el formulario» a «qué código
 * tiene ese cargo en `vs_legal_representative_role`».
 *
 * ## Por qué los nombres del DTO no son los códigos del catálogo
 *
 * La convención del proyecto es API en inglés, y el value set es castellano
 * (`REPRESENTANTE_LEGAL`, `GERENTE_COMERCIAL`...). Este archivo es el único
 * lugar que sabe la correspondencia, igual que `affiliation-documents.ts` con
 * los documentos de afiliación.
 *
 * ## Por qué los códigos van en MAYÚSCULAS
 *
 * `AffiliationDocumentConceptsService.resolveValueSet` compara contra
 * `catalog_concepts.code` **sin normalizar**, y `concept_id()` de
 * `gen_seeds.py` siembra todo en mayúsculas.
 *
 * ## Por qué el representante lleva `is_primary = true` y los gerentes `NULL`
 *
 * `uk_tenant_legal_representatives_primary` es UNIQUE sobre
 * `(tenant_id, is_primary)` y **no es parcial** (`SQL/04_directory/04_indexes.sql`):
 * con `true` sólo cabe uno por tenant, que es justo lo que se quiere, pero con
 * `false` tampoco cabría más de uno — el segundo gerente violaría la clave. La
 * columna es nullable y Postgres trata cada `NULL` como distinto, así que
 * dejarla sin escribir es la única forma de que convivan las tres gerencias.
 * Escribir `false` acá es un error que la base castiga con `23505`.
 */

/** Value set que gobierna `tenant_legal_representatives.representative_role_concept_id`. */
export const LEGAL_REPRESENTATIVE_ROLE_VALUE_SET =
  'VS_LEGAL_REPRESENTATIVE_ROLE';

/** Rol canónico (inglés) → código del value set (castellano, MAYÚSCULAS). */
export const REPRESENTATIVE_ROLE_CODE = {
  LEGAL_REPRESENTATIVE: 'REPRESENTANTE_LEGAL',
  GENERAL_MANAGER: 'GERENTE_GENERAL',
  COMMERCIAL_MANAGER: 'GERENTE_COMERCIAL',
  MARKETING_MANAGER: 'GERENTE_MARKETING',
} as const;

export type RepresentativeRole = keyof typeof REPRESENTATIVE_ROLE_CODE;

/** Los tres cargos que el alta declara además del representante legal. */
export type ExecutiveRole = Exclude<RepresentativeRole, 'LEGAL_REPRESENTATIVE'>;

/**
 * Clave del bloque `executives` del alta ↔ rol canónico, en el orden en que se
 * persisten y en el que `GET /tenants/me` los devuelve.
 *
 * El orden importa porque la lectura no puede confiar en el que devuelva
 * Postgres: `listLegalRepsByTenant` no ordena.
 */
export const EXECUTIVE_ROLE_BY_DTO_KEY = {
  generalManager: 'GENERAL_MANAGER',
  commercialManager: 'COMMERCIAL_MANAGER',
  marketingManager: 'MARKETING_MANAGER',
} as const satisfies Record<string, ExecutiveRole>;

/** Las claves del bloque `executives`, en su orden canónico. */
export const EXECUTIVE_DTO_KEYS = Object.keys(
  EXECUTIVE_ROLE_BY_DTO_KEY,
) as readonly (keyof typeof EXECUTIVE_ROLE_BY_DTO_KEY)[];

/** Rol canónico → clave del bloque, para la lectura. */
export const DTO_KEY_BY_EXECUTIVE_ROLE = Object.fromEntries(
  Object.entries(EXECUTIVE_ROLE_BY_DTO_KEY).map(([key, role]) => [role, key]),
) as Readonly<Record<ExecutiveRole, keyof typeof EXECUTIVE_ROLE_BY_DTO_KEY>>;

/** Código del catálogo → rol canónico, para resolver lo leído de la base. */
export const REPRESENTATIVE_ROLE_BY_CODE = Object.fromEntries(
  Object.entries(REPRESENTATIVE_ROLE_CODE).map(([role, code]) => [code, role]),
) as Readonly<Record<string, RepresentativeRole>>;
