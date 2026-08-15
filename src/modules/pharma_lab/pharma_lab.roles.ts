import type { ClinicalRoleSeed } from '../authz/authz.seed';
import { clinicalRoleId } from '../authz/authz.seed';

/**
 * Roles de sistema del carril 17, materializados en `authz.roles`.
 *
 * Sin estas filas no hay nada que asignar: `POST /authz/users/:id/role-assignments`
 * exige un `roleId` existente, y el claim `roles` del token se construye con el
 * `code` de estas filas. Los endpoints de este módulo declaran
 * `@Roles('PHARMA_LAB_ADMIN')` / `@Roles('MEDICAL_VISITOR')`; sin sembrarlos, el
 * único sujeto capaz de ejercerlos sería `SUPERADMIN` por comodín, que es
 * exactamente lo contrario de lo que la spec pide para el visitador
 * («permisos limitados a sus funciones», 5315).
 *
 * Ninguno es `CLINICAL`: un visitador **no** es personal asistencial y no debe
 * quedar sujeto al PDP clínico ni, sobre todo, aparecer como candidato a
 * permisos sobre pacientes.
 *
 * Se declaran acá y no en `authz.seed.ts` para que el carril pueda añadir sus
 * roles sin tocar un archivo compartido con el resto de los carriles en curso.
 */
export const PHARMA_LAB_ROLE_SEED: readonly ClinicalRoleSeed[] = [
  {
    id: clinicalRoleId('PHARMA_LAB_ADMIN'),
    code: 'PHARMA_LAB_ADMIN',
    name: 'Administrador de laboratorio farmacéutico',
    baseRole: 'ADMIN',
    scope: 'TENANT',
  },
  {
    id: clinicalRoleId('MEDICAL_VISITOR'),
    code: 'MEDICAL_VISITOR',
    name: 'Visitador médico',
    baseRole: 'STAFF',
    scope: 'TENANT',
  },
  {
    id: clinicalRoleId('PHARMACOVIGILANCE_OFFICER'),
    code: 'PHARMACOVIGILANCE_OFFICER',
    name: 'Responsable de farmacovigilancia',
    baseRole: 'STAFF',
    scope: 'TENANT',
  },
  {
    id: clinicalRoleId('REGULATORY_AFFAIRS'),
    code: 'REGULATORY_AFFAIRS',
    name: 'Asuntos regulatorios',
    baseRole: 'STAFF',
    scope: 'TENANT',
  },
] as const;

/** Códigos sembrados por este carril. */
export const PHARMA_LAB_ROLE_CODES: readonly string[] =
  PHARMA_LAB_ROLE_SEED.map((role) => role.code);
