import type { InfraPolicy } from '../domain/ops/infra-scope';

/**
 * Acciones de F2 y quién las puede hacer (CONTRATO-F2-F5 §F2.3, «Permisos
 * F2»). Las marcas «(quirófanos)» de la matriz van en `operatingRoomRoles`.
 * «R sin paciente» = lectura sin el bloque `patient` (lo decide
 * `PATIENT_VIEWERS`).
 */
export const INFRA_F2_POLICY: InfraPolicy = {
  name: 'F2',
  actions: {
    'f2.board.read': {
      roles: [
        'SUPERADMIN',
        'ORG_ADMIN',
        'SITE_ADMIN',
        'NURSE',
        'ADMISSION',
        'HOUSEKEEPING',
        'MAINTENANCE',
        'OR_MANAGER',
      ],
    },
    'f2.availability.clinical': {
      roles: ['NURSE'],
      operatingRoomRoles: ['OR_MANAGER'],
    },
    'f2.availability.admin': {
      roles: ['SUPERADMIN', 'ORG_ADMIN', 'SITE_ADMIN'],
      operatingRoomRoles: ['OR_MANAGER'],
    },
    'f2.availability.maintenance': {
      roles: ['ORG_ADMIN', 'SITE_ADMIN', 'MAINTENANCE'],
    },
    'f2.hygiene.mark-dirty': {
      roles: ['NURSE', 'HOUSEKEEPING'],
      operatingRoomRoles: ['OR_MANAGER'],
    },
    'f2.hygiene.mark-contaminated': {
      roles: ['NURSE'],
      operatingRoomRoles: ['OR_MANAGER'],
    },
    'f2.isolation.set': { roles: ['NURSE'] },
    'f2.isolation.cohort-approve': { roles: ['INFECTION_CONTROL'] },
    'f2.cleaning.read': {
      roles: [
        'ORG_ADMIN',
        'SITE_ADMIN',
        'NURSE',
        'ADMISSION',
        'HOUSEKEEPING',
        'OR_MANAGER',
      ],
    },
    'f2.cleaning.create': { roles: ['NURSE', 'HOUSEKEEPING', 'OR_MANAGER'] },
    'f2.cleaning.assign': { roles: ['NURSE', 'HOUSEKEEPING', 'OR_MANAGER'] },
    'f2.cleaning.work': { roles: ['NURSE', 'HOUSEKEEPING'] },
    'f2.cleaning.inspect': {
      roles: ['NURSE_SUPERVISOR', 'HOUSEKEEPING_SUPERVISOR'],
    },
    'f2.cleaning.cancel': { roles: ['NURSE', 'HOUSEKEEPING', 'OR_MANAGER'] },
    'f2.events.read': {
      roles: [
        'SUPERADMIN',
        'ORG_ADMIN',
        'SITE_ADMIN',
        'NURSE',
        'ADMISSION',
        'HOUSEKEEPING',
        'MAINTENANCE',
        'OR_MANAGER',
      ],
    },
  },
};

/** Supervisores que apagan la bandera de limpieza terminal (§F2.2). */
export const TERMINAL_INSPECTORS = [
  'NURSE_SUPERVISOR',
  'HOUSEKEEPING_SUPERVISOR',
] as const;
