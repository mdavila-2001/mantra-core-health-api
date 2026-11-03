import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { InfraPolicy } from '../../practice/domain/ops/infra-scope';
import {
  INFRA_POLICIES,
  type InfraPolicyRegistry,
} from '../../practice/services/infrastructure-access.service';

/**
 * Acciones de F3 y quién las puede hacer (CONTRATO-F2-F5 §F3.3, «Permisos
 * F3»). La supervisión de Enfermería implica Enfermería (§0.3).
 */
export const INFRA_F3_POLICY: InfraPolicy = {
  name: 'F3',
  actions: {
    'f3.adt.place': { roles: ['NURSE', 'ADMISSION'] },
    // «Admisión crea el vínculo»: internar a un paciente SIN huella previa en
    // el tenant. Sólo roles de nivel sede del hospital (se decide con
    // siteLevelRoles); sin roles globales ni plataforma suelta.
    'f3.adt.admit_without_footprint': {
      roles: ['ORG_ADMIN', 'SITE_ADMIN', 'ADMISSION', 'NURSE_SUPERVISOR'],
    },
    'f3.adt.override': { roles: ['NURSE_SUPERVISOR'] },
    'f3.adt.read': {
      roles: ['SUPERADMIN', 'ORG_ADMIN', 'SITE_ADMIN', 'NURSE', 'ADMISSION'],
    },
    'f3.incident.review': { roles: ['NURSE_SUPERVISOR', 'INFECTION_CONTROL'] },
    'f3.census.read': {
      roles: [
        'SUPERADMIN',
        'ORG_ADMIN',
        'SITE_ADMIN',
        'NURSE',
        'ADMISSION',
        'BILLING',
      ],
      globalRoles: ['BILLING'],
    },
    'f3.census.close': {
      roles: ['ORG_ADMIN', 'SITE_ADMIN', 'NURSE_SUPERVISOR', 'ADMISSION'],
    },
    'f3.census.adjust': {
      roles: ['ORG_ADMIN', 'SITE_ADMIN', 'NURSE_SUPERVISOR'],
    },
    'f3.indicators.read': {
      roles: [
        'SUPERADMIN',
        'ORG_ADMIN',
        'SITE_ADMIN',
        'NURSE',
        'ADMISSION',
        'BILLING',
      ],
      globalRoles: ['BILLING'],
    },
  },
};

/** Registra la política de F3 en el evaluador de §0.3 al arrancar `clinical`. */
@Injectable()
export class InfraF3PolicyRegistrar implements OnModuleInit {
  constructor(
    @Inject(INFRA_POLICIES) private readonly registry: InfraPolicyRegistry,
  ) {}

  /** @inheritdoc */
  onModuleInit(): void {
    this.registry.register(INFRA_F3_POLICY);
  }
}
