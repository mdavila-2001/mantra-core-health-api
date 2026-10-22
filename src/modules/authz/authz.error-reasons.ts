/**
 * Catálogo de sub-códigos de negocio estables para el módulo `authz`
 * (permisos, roles, políticas ABAC, delegación/relaciones asistenciales y
 * grants). Se usan como tercer argumento de `DomainException` y subclases,
 * complementando el `code` HTTP genérico con el motivo concreto dentro del
 * módulo. Ver `src/common/errors/domain.exception.ts`.
 */
export enum AuthzErrorReason {
  /** `validTo` no es posterior a `validFrom` en un acceso clínico. */
  CLINICAL_ACCESS_INVALID_VALIDITY_WINDOW = 'CLINICAL_ACCESS_INVALID_VALIDITY_WINDOW',
  /** El propósito de uso no es tratamiento directo y no se aportó consentimiento. */
  CLINICAL_ACCESS_CONSENT_REQUIRED = 'CLINICAL_ACCESS_CONSENT_REQUIRED',
  /** Ya existe un acceso clínico activo para ese (paciente, usuario). */
  CLINICAL_ACCESS_ALREADY_ACTIVE = 'CLINICAL_ACCESS_ALREADY_ACTIVE',
  /** No se encontró el acceso clínico a revocar. */
  CLINICAL_ACCESS_NOT_FOUND = 'CLINICAL_ACCESS_NOT_FOUND',
  /** El acceso clínico a revocar no está en estado activo. */
  CLINICAL_ACCESS_NOT_ACTIVE = 'CLINICAL_ACCESS_NOT_ACTIVE',

  /** Ya existe un rol con ese código. */
  ROLE_CODE_ALREADY_EXISTS = 'ROLE_CODE_ALREADY_EXISTS',
  /** El rol padre referenciado no existe. */
  ROLE_PARENT_NOT_FOUND = 'ROLE_PARENT_NOT_FOUND',
  /** No se encontró el rol. */
  ROLE_NOT_FOUND = 'ROLE_NOT_FOUND',
  /** No se encontró el permiso referenciado al asignar permisos a un rol. */
  ROLE_PERMISSION_NOT_FOUND = 'ROLE_PERMISSION_NOT_FOUND',
  /** Se pidió `canWrite=true` sin `canRead=true` en un permiso de campo del rol. */
  ROLE_FIELD_PERMISSION_WRITE_REQUIRES_READ = 'ROLE_FIELD_PERMISSION_WRITE_REQUIRES_READ',

  /** Ya existe una política ABAC activa con esa prioridad para el recurso objetivo. */
  POLICY_PRIORITY_CLASH = 'POLICY_PRIORITY_CLASH',

  /** Ya existe una categoría de permiso con ese código. */
  PERMISSION_CATEGORY_CODE_ALREADY_EXISTS = 'PERMISSION_CATEGORY_CODE_ALREADY_EXISTS',
  /** Ya existe un permiso con ese código. */
  PERMISSION_CODE_ALREADY_EXISTS = 'PERMISSION_CODE_ALREADY_EXISTS',
  /** La categoría de permiso referenciada no existe. */
  PERMISSION_CATEGORY_NOT_FOUND = 'PERMISSION_CATEGORY_NOT_FOUND',

  /** `validTo` no es posterior a `validFrom` en una relación asistencial. */
  CARE_RELATIONSHIP_INVALID_VALIDITY_WINDOW = 'CARE_RELATIONSHIP_INVALID_VALIDITY_WINDOW',
  /** Ya existe una relación asistencial activa para ese (paciente, practicante). */
  CARE_RELATIONSHIP_ALREADY_ACTIVE = 'CARE_RELATIONSHIP_ALREADY_ACTIVE',
  /** No se encontró la relación asistencial a revocar. */
  CARE_RELATIONSHIP_NOT_FOUND = 'CARE_RELATIONSHIP_NOT_FOUND',
  /** La relación asistencial a revocar no está en estado activo. */
  CARE_RELATIONSHIP_NOT_ACTIVE = 'CARE_RELATIONSHIP_NOT_ACTIVE',
  /** `validTo` no es posterior a `validFrom` en una representación legal. */
  LEGAL_REPRESENTATION_INVALID_VALIDITY_WINDOW = 'LEGAL_REPRESENTATION_INVALID_VALIDITY_WINDOW',
  /** Ya existe una representación legal activa para ese (paciente, representante). */
  LEGAL_REPRESENTATION_ALREADY_ACTIVE = 'LEGAL_REPRESENTATION_ALREADY_ACTIVE',
  /** No se encontró la representación legal a revocar. */
  LEGAL_REPRESENTATION_NOT_FOUND = 'LEGAL_REPRESENTATION_NOT_FOUND',
  /** La representación legal a revocar no está en estado activo. */
  LEGAL_REPRESENTATION_NOT_ACTIVE = 'LEGAL_REPRESENTATION_NOT_ACTIVE',

  /** No se indicó `roleId` ni `roleCode` al asignar un rol. */
  ROLE_ASSIGNMENT_MISSING_ROLE_REFERENCE = 'ROLE_ASSIGNMENT_MISSING_ROLE_REFERENCE',
  /** El rol a asignar no existe. */
  ROLE_ASSIGNMENT_ROLE_NOT_FOUND = 'ROLE_ASSIGNMENT_ROLE_NOT_FOUND',
  /** El rol referenciado no es asignable. */
  ROLE_ASSIGNMENT_ROLE_NOT_ASSIGNABLE = 'ROLE_ASSIGNMENT_ROLE_NOT_ASSIGNABLE',
  /** `validFrom` no es anterior a `validTo` en una asignación de rol. */
  ROLE_ASSIGNMENT_INVALID_VALIDITY_WINDOW = 'ROLE_ASSIGNMENT_INVALID_VALIDITY_WINDOW',
  /** El usuario ya tiene ese rol asignado y activo. */
  ROLE_ASSIGNMENT_ALREADY_ACTIVE = 'ROLE_ASSIGNMENT_ALREADY_ACTIVE',

  /** El permiso referenciado en una excepción de permiso no existe. */
  PERMISSION_GRANT_PERMISSION_NOT_FOUND = 'PERMISSION_GRANT_PERMISSION_NOT_FOUND',
  /** El usuario ya tiene una excepción activa para ese permiso. */
  PERMISSION_GRANT_ALREADY_ACTIVE = 'PERMISSION_GRANT_ALREADY_ACTIVE',

  /** El permiso referenciado en un grant de recurso no existe. */
  RESOURCE_SCOPE_GRANT_PERMISSION_NOT_FOUND = 'RESOURCE_SCOPE_GRANT_PERMISSION_NOT_FOUND',
  /** Ya existe un grant de recurso para ese (sujeto, permiso, recurso). */
  RESOURCE_SCOPE_GRANT_ALREADY_EXISTS = 'RESOURCE_SCOPE_GRANT_ALREADY_EXISTS',
}
