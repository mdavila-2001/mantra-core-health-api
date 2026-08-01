/**
 * Comprobación de que el cuerpo de la petición no declara un tenant distinto del
 * que el actor tiene verificado en el contexto.
 *
 * Por qué existe: los DTO de escritura llevan el tenant propietario en el cuerpo
 * (`tenantId`, `custodianTenantId`) y los servicios lo persisten tal cual —son 453
 * usos repartidos por 250 servicios—. Sin esta comprobación, el tenant es un dato
 * que elige el cliente: un usuario autenticado de cualquier organización podía
 * leer y escribir historias clínicas de otra sencillamente poniendo su id en el
 * JSON. Validarlo aquí, una vez, cierra los 453 sitios sin reescribirlos.
 */

/**
 * Campos que denotan **propiedad**: el tenant al que pertenece el recurso que se
 * está creando o modificando. Son los únicos que deben coincidir con el actor.
 *
 * Deliberadamente NO se incluyen los tenants de contraparte —`issuerTenantId`,
 * `insurerTenantId`, `supplierTenantId`, `recipientTenantId` y demás—: esos
 * referencian legítimamente a *otra* organización (una aseguradora, un
 * proveedor), y exigir que coincidan con el actor rompería el dominio.
 */
const OWNERSHIP_FIELDS = ['tenantId', 'custodianTenantId'] as const;

/** Tenant declarado en el cuerpo que no coincide con el del contexto. */
export interface TenantScopeViolation {
  /** Nombre del campo del DTO que lo declara. */
  readonly field: string;
  /** Valor que traía el cuerpo. */
  readonly declared: string;
}

/** Campo de propiedad de tenant declarado por una entrada HTTP. */
export interface TenantScopeDeclaration {
  readonly field: string;
  readonly declared: string;
}

/** Lista las declaraciones de tenant propietario presentes en el primer nivel. */
export function listTenantScopeDeclarations(
  input: unknown,
): TenantScopeDeclaration[] {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return [];
  }

  const record = input as Record<string, unknown>;
  return OWNERSHIP_FIELDS.flatMap((field) => {
    const declared = record[field];
    return typeof declared === 'string' ? [{ field, declared }] : [];
  });
}

/**
 * Busca en `body` un campo de propiedad cuyo valor difiera de `tenantId`.
 *
 * Solo inspecciona el primer nivel del objeto: los DTO anidados heredan el tenant
 * del agregado padre, y descender recursivamente convertiría una comprobación de
 * autorización en un recorrido de profundidad no acotada sobre entrada del
 * cliente. Devuelve `undefined` si no hay conflicto.
 */
export function findTenantScopeViolation(
  body: unknown,
  tenantId: string,
): TenantScopeViolation | undefined {
  for (const declaration of listTenantScopeDeclarations(body)) {
    if (declaration.declared !== tenantId) {
      return declaration;
    }
  }
  return undefined;
}
