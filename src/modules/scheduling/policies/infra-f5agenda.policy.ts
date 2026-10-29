import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import {
  INFRA_POLICIES,
  InfraPolicyRegistry,
  type InfraPolicy,
} from '../../practice/policies/infra-policy';

/**
 * Acciones de la agenda por espacio (CONTRATO-F2-F5 F5d).
 *
 * Atar el horario de una plantilla a un consultorio lo reserva: mientras esa plantilla esté
 * publicada, ninguna otra puede ocupar el mismo consultorio a la misma hora. Por eso no es
 * una acción de cualquier profesional sobre su propia agenda sino de quien administra el
 * espacio (organización o sucursal) o de quien coordina agendas del tenant
 * (`SCHEDULING_ADMIN`, que `CareSpaceTemplateGuard` reconoce aparte).
 */
export const INFRA_F5AGENDA_POLICY: InfraPolicy = {
  name: 'F5AGENDA',
  rules: {
    'infra.agenda.assign': {
      roles: ['SUPERADMIN', 'ORG_ADMIN', 'BRANCH_ADMIN'],
      summary: 'Atar el horario de una plantilla a un consultorio o sala',
    },
    'infra.agenda.book': {
      roles: ['SUPERADMIN', 'ORG_ADMIN', 'BRANCH_ADMIN', 'ADMISSION'],
      summary:
        'Elegir el consultorio de una cita puntual (la agenda no lo fija) dentro del alcance propio',
    },
  },
};

/** Registra la política de la agenda por espacio en el registro de infraestructura. */
@Injectable()
export class InfraF5AgendaPolicyInitializer implements OnModuleInit {
  /** @param registry - Registro de políticas (`INFRA_POLICIES`). */
  constructor(
    @Inject(INFRA_POLICIES) private readonly registry: InfraPolicyRegistry,
  ) {}

  /** Alta de la política. */
  onModuleInit(): void {
    this.registry.register(INFRA_F5AGENDA_POLICY);
  }
}
