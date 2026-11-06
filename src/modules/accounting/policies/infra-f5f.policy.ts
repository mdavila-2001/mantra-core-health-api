import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { InfraPolicy } from '../../practice/domain/ops/infra-scope';
import {
  INFRA_POLICIES,
  type InfraPolicyRegistry,
} from '../../practice/services/infrastructure-access.service';

/**
 * Permisos de F5f (CONTRATO-F2-F5 §F5f): `ACCOUNTING_APPROVER`/Admin org ✔;
 * Facturación R. Se deciden a nivel práctica (`assertPracticeLevel`).
 */
export const INFRA_F5F_POLICY: InfraPolicy = {
  name: 'F5f',
  actions: {
    'f5f.accounting.write': {
      roles: ['SUPERADMIN', 'ORG_ADMIN'],
      globalRoles: ['ACCOUNTING'],
    },
    'f5f.accounting.read': {
      roles: ['SUPERADMIN', 'ORG_ADMIN', 'BILLING'],
      globalRoles: ['ACCOUNTING', 'BILLING'],
    },
  },
};

/** Registra la política de F5f al arrancar el módulo. */
@Injectable()
export class InfraF5fPolicyRegistrar implements OnModuleInit {
  constructor(
    @Inject(INFRA_POLICIES) private readonly registry: InfraPolicyRegistry,
  ) {}

  /** @inheritdoc */
  onModuleInit(): void {
    this.registry.register(INFRA_F5F_POLICY);
  }
}
