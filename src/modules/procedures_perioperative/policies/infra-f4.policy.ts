import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { InfraPolicy } from '../../practice/domain/ops/infra-scope';
import {
  INFRA_POLICIES,
  type InfraPolicyRegistry,
} from '../../practice/services/infrastructure-access.service';

/**
 * Acciones de F4 (CONTRATO-F2-F5 §F4.3, «Permisos F4»). El Jefe QX (asignado
 * o el `PERIOP_ADMIN` global) cuenta sólo sobre quirófanos; `BILLING` global
 * sólo en las lecturas que lo nombran.
 */
export const INFRA_F4_POLICY: InfraPolicy = {
  name: 'F4',
  actions: {
    'f4.or-block.manage': { roles: [], operatingRoomRoles: ['OR_MANAGER'] },
    'f4.or.read': {
      roles: [
        'SUPERADMIN',
        'ORG_ADMIN',
        'SITE_ADMIN',
        'NURSE',
        'HOUSEKEEPING',
        'MAINTENANCE',
        'BILLING',
      ],
      operatingRoomRoles: ['OR_MANAGER'],
      // Matriz F4 «Ver agenda de quirófanos»: R para Facturación y para el
      // personal de periop (sus roles globales, con ámbito de tenant).
      globalRoles: ['BILLING', 'PERIOP_STAFF'],
    },
    'f4.utilization.read': {
      roles: ['SUPERADMIN', 'ORG_ADMIN', 'SITE_ADMIN', 'BILLING'],
      operatingRoomRoles: ['OR_MANAGER'],
      globalRoles: ['BILLING'],
    },
  },
};

/** Registra la política de F4 al arrancar `procedures_perioperative`. */
@Injectable()
export class InfraF4PolicyRegistrar implements OnModuleInit {
  constructor(
    @Inject(INFRA_POLICIES) private readonly registry: InfraPolicyRegistry,
  ) {}

  /** @inheritdoc */
  onModuleInit(): void {
    this.registry.register(INFRA_F4_POLICY);
  }
}
