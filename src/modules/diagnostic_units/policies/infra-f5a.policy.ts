import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import {
  INFRA_POLICIES,
  InfraPolicyRegistry,
  type InfraPolicy,
} from '../../practice/policies/infra-policy';

/**
 * Acciones sobre el equipo de diagnóstico (CONTRATO-F2-F5 F5a, `matriz-de-permisos`):
 * Admin de organización y de sucursal ✔; Mantenimiento ✔ **solo el estado operativo**;
 * Superadmin ✔ auditado.
 */
export const INFRA_F5A_POLICY: InfraPolicy = {
  name: 'F5A',
  rules: {
    'infra.equipment.edit': {
      roles: ['SUPERADMIN', 'ORG_ADMIN', 'BRANCH_ADMIN'],
      summary:
        'Ubicar el equipo en una sala, ponerle AE Title y nombre de estación, editar sus datos',
    },
    'infra.equipment.status': {
      roles: ['SUPERADMIN', 'ORG_ADMIN', 'BRANCH_ADMIN', 'MAINTENANCE'],
      summary:
        'Cambiar el estado operativo del equipo (mantenimiento, fuera de servicio) y su calibración',
    },
    'infra.equipment.worklist': {
      roles: ['SUPERADMIN', 'ORG_ADMIN', 'BRANCH_ADMIN'],
      summary:
        'Operar la estación de imagen: ver la worklist completa del equipo (con los pacientes programados)',
    },
    'infra.equipment.view': {
      roles: ['SUPERADMIN', 'ORG_ADMIN', 'BRANCH_ADMIN', 'MAINTENANCE'],
      summary: 'Ver la estación DICOM (AE Title, sala) de un equipo',
    },
  },
};

/** Registra la política del equipo en el registro de infraestructura. */
@Injectable()
export class InfraF5APolicyInitializer implements OnModuleInit {
  /** @param registry - Registro de políticas (`INFRA_POLICIES`). */
  constructor(
    @Inject(INFRA_POLICIES) private readonly registry: InfraPolicyRegistry,
  ) {}

  /** Alta de la política. */
  onModuleInit(): void {
    this.registry.register(INFRA_F5A_POLICY);
  }
}
