import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import {
  INFRA_POLICIES,
  InfraPolicyRegistry,
  type InfraPolicy,
} from '../../practice/policies/infra-policy';

/**
 * Acciones de F5e (CONTRATO-F2-F5 §F5e, «Permisos»; `matriz-de-permisos` §6).
 *
 * - Facturación (`BILLING`: asignación delegada o rol global) hace todo: configura
 *   tarifas, revisa, factura y anula cargos.
 * - Administrador de organización configura tarifas y mira los cargos; no los
 *   anula (la anulación es de Facturación, con motivo y rastro).
 * - Administrador de sucursal y soporte de plataforma sólo leen.
 * - Enfermería, Admisión, Limpieza, Mantenimiento y Jefe de quirófano no tienen
 *   ninguna acción: Facturación no edita la ocupación y ellos no editan el cobro.
 */
export const INFRA_F5E_POLICY: InfraPolicy = {
  name: 'F5e',
  rules: {
    'infra.tariff.view': {
      roles: ['SUPERADMIN', 'ORG_ADMIN', 'BRANCH_ADMIN', 'BILLING'],
      summary: 'Ver las tarifas de día-cama y de quirófano por tiempo',
    },
    'infra.tariff.write': {
      roles: ['ORG_ADMIN', 'BILLING'],
      summary: 'Crear y cerrar tarifas de espacio',
    },
    'infra.charge.view': {
      roles: ['SUPERADMIN', 'ORG_ADMIN', 'BRANCH_ADMIN', 'BILLING'],
      summary: 'Ver y revisar los cargos devengados por ocupación',
    },
    'infra.charge.invoice': {
      roles: ['BILLING'],
      summary: 'Incorporar cargos devengados a una factura',
    },
    'infra.charge.void': {
      roles: ['BILLING'],
      summary: 'Anular un cargo devengado con motivo',
    },
  },
};

/** Registra la política de F5e en el registro de políticas de infraestructura. */
@Injectable()
export class InfraF5ePolicyInitializer implements OnModuleInit {
  /**
   * @param registry - Registro de políticas (`INFRA_POLICIES`).
   */
  constructor(
    @Inject(INFRA_POLICIES) private readonly registry: InfraPolicyRegistry,
  ) {}

  /** Alta de la política. */
  onModuleInit(): void {
    this.registry.register(INFRA_F5E_POLICY);
  }
}
