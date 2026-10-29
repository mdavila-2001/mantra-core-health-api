import { Injectable, Inject, type OnModuleInit } from '@nestjs/common';
import {
  INFRA_POLICIES,
  InfraPolicyRegistry,
  type InfraPolicy,
  type InfraRole,
} from './infra-policy';

/** Funciones de quirófano a las que se acota el jefe de quirófano (sin prefijo `SPACE_FN_`). */
const OPERATING_ROOMS = ['OPERATING_ROOM'] as const;

const ADMINS: InfraRole[] = ['ORG_ADMIN', 'BRANCH_ADMIN'];
/** Quienes miran el tablero sin datos de paciente. */
const BOARD_READERS: InfraRole[] = [
  'SUPERADMIN',
  'ORG_ADMIN',
  'BRANCH_ADMIN',
  'NURSE',
  'ADMISSION',
  'HOUSEKEEPING',
  'MAINTENANCE',
  'OR_MANAGER',
];

/**
 * Acciones de F2 (CONTRATO-F2-F5 §F2.3, «Permisos F2»; `matriz-de-permisos` §3).
 *
 * Separación de funciones (INV-44): Admin org y Admin sucursal **no** operan camas
 * (ni bloqueo clínico, ni higiene, ni aislamiento, ni cola); Limpieza **no**
 * bloquea ni aísla ni asigna pacientes. El supervisor de enfermería o de limpieza
 * hereda los permisos del operario (`IMPLIED_ROLES`).
 */
export const INFRA_F2_POLICY: InfraPolicy = {
  name: 'F2',
  rules: {
    'infra.board.view': {
      roles: BOARD_READERS,
      summary: 'Ver el tablero de camas y el estado de un espacio',
    },
    'infra.events.view': {
      roles: [...BOARD_READERS, 'NURSE_SUPERVISOR'],
      summary: 'Ver el historial de estados (A20)',
    },
    'infra.block.clinical': {
      roles: ['NURSE', 'OR_MANAGER'],
      onlyFunctions: { OR_MANAGER: OPERATING_ROOMS },
      summary: 'Bloqueo clínico y desbloqueo',
    },
    'infra.block.admin': {
      roles: ['SUPERADMIN', ...ADMINS, 'OR_MANAGER'],
      onlyFunctions: { OR_MANAGER: OPERATING_ROOMS },
      summary:
        'Bloqueo administrativo, cierre y reapertura (el superadmin queda auditado)',
    },
    'infra.block.maintenance': {
      roles: [...ADMINS, 'MAINTENANCE'],
      summary: 'Inicio y fin de mantenimiento',
    },
    'infra.hygiene.mark-dirty': {
      roles: ['NURSE', 'HOUSEKEEPING', 'OR_MANAGER'],
      onlyFunctions: { OR_MANAGER: OPERATING_ROOMS },
      summary: 'Marcar sucia',
    },
    'infra.hygiene.mark-contaminated': {
      roles: ['NURSE', 'OR_MANAGER'],
      onlyFunctions: { OR_MANAGER: OPERATING_ROOMS },
      summary: 'Marcar contaminada (exige limpieza terminal)',
    },
    'infra.isolation.set': {
      roles: ['NURSE'],
      summary: 'Marcar y levantar el aislamiento',
    },
    'infra.cleaning.list': {
      roles: [
        'ORG_ADMIN',
        'BRANCH_ADMIN',
        'NURSE',
        'ADMISSION',
        'HOUSEKEEPING',
        'OR_MANAGER',
      ],
      summary: 'Ver la cola de limpieza (sin datos de paciente)',
    },
    'infra.cleaning.create': {
      roles: ['NURSE', 'HOUSEKEEPING', 'OR_MANAGER'],
      onlyFunctions: { OR_MANAGER: OPERATING_ROOMS },
      summary: 'Pedir una limpieza a mano',
    },
    'infra.cleaning.assign': {
      roles: ['NURSE', 'HOUSEKEEPING', 'OR_MANAGER'],
      onlyFunctions: { OR_MANAGER: OPERATING_ROOMS },
      summary: 'Asignar una orden de limpieza',
    },
    'infra.cleaning.work': {
      roles: ['NURSE', 'HOUSEKEEPING'],
      summary: 'Iniciar y terminar una limpieza',
    },
    'infra.cleaning.inspect': {
      roles: ['NURSE', 'HOUSEKEEPING_SUPERVISOR'],
      summary:
        'Inspeccionar (la limpieza terminal sólo la inspecciona un supervisor)',
    },
    'infra.cleaning.inspect-terminal': {
      roles: ['NURSE_SUPERVISOR', 'HOUSEKEEPING_SUPERVISOR'],
      summary: 'Inspeccionar una limpieza terminal',
    },
    'infra.cleaning.cancel': {
      roles: ['NURSE', 'HOUSEKEEPING_SUPERVISOR', 'OR_MANAGER'],
      onlyFunctions: { OR_MANAGER: OPERATING_ROOMS },
      summary: 'Cancelar una orden de limpieza con motivo',
    },
  },
};

/** Registra la política de F2 en el registro de políticas de infraestructura. */
@Injectable()
export class InfraF2PolicyInitializer implements OnModuleInit {
  /**
   * @param registry - Registro de políticas (`INFRA_POLICIES`).
   */
  constructor(
    @Inject(INFRA_POLICIES) private readonly registry: InfraPolicyRegistry,
  ) {}

  /** Alta de la política. */
  onModuleInit(): void {
    this.registry.register(INFRA_F2_POLICY);
  }
}
