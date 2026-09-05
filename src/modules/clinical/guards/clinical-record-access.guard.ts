import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedRequest } from '../../../common/auth/authenticated-user.interface';
import { AppointmentsRepository } from '../repositories';
import { AuthzPdpService } from '../../authz/services';

/**
 * FT-07-R08 (CAN-AUTH-001): cierra el acceso indiscriminado al expediente
 * clínico de un paciente.
 *
 * Hasta ahora `ClinicalReadController`/`ChartReadController` dejaban pasar a
 * cualquier `CLINICIAN`/`PRACTITIONER` autenticado con solo pegar un
 * `patientProfileId` — el propio código lo documentaba como deuda pendiente.
 * Este guard exige, para ESE actor y ESE paciente, alguna de tres bases
 * legítimas ya modeladas en el dominio:
 *
 * 1. una cita registrada entre ambos (`clinical.appointments`) — el camino que
 *    la pantalla de archivo clínico ya promete («la cita de tu agenda trae el
 *    identificador»);
 * 2. una relación asistencial vigente o un acceso clínico con propósito de uso
 *    (`authz.care_relationships` / `authz.clinical_access_grants`), evaluados
 *    por el PDP existente;
 * 3. representación legal vigente del paciente, que el mismo PDP resuelve.
 *
 * Sin ninguna, deniega con 403: el frontend debe ofrecer "Solicitar acceso"
 * (FT-07-R05/R06), no un mensaje mudo.
 *
 * No reemplaza `RolesGuard` ni la comprobación de titularidad del paciente
 * sobre su propio expediente (`assertOwnRecord`): sólo actúa cuando el actor
 * ejerce (`CLINICIAN`/`PRACTITIONER`) y dejar pasar a todo lo demás para que
 * el controlador resuelva esos otros casos como ya lo hacía.
 */
@Injectable()
export class ClinicalRecordAccessGuard implements CanActivate {
  constructor(
    private readonly em: EntityManager,
    private readonly appointmentsRepo: AppointmentsRepository,
    private readonly pdp: AuthzPdpService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const actor = request.user;
    const patientProfileId = request.params?.patientProfileId;

    if (!actor || !patientProfileId) {
      // Sin sujeto o sin paciente en la ruta: no es de la incumbencia de este
      // guard — `JwtAuthGuard`/`RolesGuard` ya se ocuparon o el handler no
      // aplica.
      return true;
    }

    const esQuienAtiende =
      actor.roles.includes('CLINICIAN') || actor.roles.includes('PRACTITIONER');
    if (actor.roles.includes('SUPERADMIN') || !esQuienAtiende) {
      // El comodín administrativo pasa; a quien no ejerce (p. ej. el propio
      // paciente) lo sigue acotando `assertOwnRecord` en el controlador.
      return true;
    }

    const em = this.em.fork();

    if (actor.practitionerProfileId) {
      const tieneCita = await this.appointmentsRepo.existsForPractitionerAndPatient(
        em,
        actor.practitionerProfileId,
        patientProfileId,
      );
      if (tieneCita) return true;
    }

    const tenantId = actor.tenantIds?.[0];
    if (tenantId) {
      const decision = await this.pdp.evaluate(
        {
          userId: actor.id,
          tenantId,
          resource: 'clinical.patient_record',
          action: 'READ',
          patientProfileId,
          practitionerProfileId: actor.practitionerProfileId,
          purposeOfUse: 'TREATMENT',
        },
        actor,
      );
      if (decision.decision === 'PERMIT') return true;
    }

    throw new ForbiddenException(
      'No hay una cita, relación asistencial ni autorización vigente que habilite el acceso a este expediente. Solicitá acceso al paciente.',
    );
  }
}
