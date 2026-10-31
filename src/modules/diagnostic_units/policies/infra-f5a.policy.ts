import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { InfraPolicy } from '../../practice/domain/ops/infra-scope';
import {
  INFRA_POLICIES,
  type InfraPolicyRegistry,
} from '../../practice/services/infrastructure-access.service';

/**
 * Permisos de F5a (CONTRATO-F2-F5 §F5a): Admin org/sucursal ✔; Mantenimiento
 * ✔ sólo estado operativo; Superadmin ✔ auditado. Se deciden sobre la sede de
 * práctica de la sede de la unidad diagnóstica.
 */
export const INFRA_F5A_POLICY: InfraPolicy = {
  name: 'F5a',
  actions: {
    'f5a.equipment.write': { roles: ['SUPERADMIN', 'ORG_ADMIN', 'SITE_ADMIN'] },
    'f5a.equipment.status': {
      roles: ['SUPERADMIN', 'ORG_ADMIN', 'SITE_ADMIN', 'MAINTENANCE'],
    },
    'f5a.equipment.read': {
      roles: [
        'SUPERADMIN',
        'ORG_ADMIN',
        'SITE_ADMIN',
        'MAINTENANCE',
        'NURSE_SUPERVISOR',
        'UNIT_HEAD',
      ],
    },
  },
};

/** Registra la política de F5a al arrancar el módulo. */
@Injectable()
export class InfraF5aPolicyRegistrar implements OnModuleInit {
  constructor(
    @Inject(INFRA_POLICIES) private readonly registry: InfraPolicyRegistry,
  ) {}

  /** @inheritdoc */
  onModuleInit(): void {
    this.registry.register(INFRA_F5A_POLICY);
  }
}
