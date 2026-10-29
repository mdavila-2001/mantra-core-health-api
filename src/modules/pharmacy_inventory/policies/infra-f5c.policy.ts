import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import {
  INFRA_POLICIES,
  InfraPolicyRegistry,
  type InfraPolicy,
} from '../../practice/policies/infra-policy';

/**
 * Acciones de F5c (CONTRATO-F2-F5 §F5c, «Permisos»: farmacia y Admin org ✔,
 * Enfermería de lectura sobre el botiquín de su unidad).
 *
 * El personal de farmacia (rol global `PHARMACY_STAFF`) no es un rol de
 * infraestructura: lo reconoce `StockPointAccessService` antes de consultar esta
 * política, que cubre a quienes llegan por la estructura (plataforma, organización,
 * sucursal) o por una asignación operativa (enfermería).
 */
export const INFRA_F5C_POLICY: InfraPolicy = {
  name: 'F5c',
  rules: {
    'infra.stock.manage': {
      roles: ['SUPERADMIN', 'ORG_ADMIN', 'BRANCH_ADMIN'],
      summary: 'Ubicar un depósito o botiquín en un espacio y reubicarlo',
    },
    'infra.stock.view': {
      roles: ['SUPERADMIN', 'ORG_ADMIN', 'BRANCH_ADMIN', 'NURSE'],
      summary:
        'Ver las ubicaciones de inventario y sus existencias en un espacio (enfermería: el de su unidad)',
    },
  },
};

/** Registra la política de F5c en el registro de políticas de infraestructura. */
@Injectable()
export class InfraF5cPolicyInitializer implements OnModuleInit {
  /**
   * @param registry - Registro de políticas (`INFRA_POLICIES`).
   */
  constructor(
    @Inject(INFRA_POLICIES) private readonly registry: InfraPolicyRegistry,
  ) {}

  /** Alta de la política. */
  onModuleInit(): void {
    this.registry.register(INFRA_F5C_POLICY);
  }
}
