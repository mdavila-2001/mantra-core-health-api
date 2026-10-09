import type { AppointmentBookings } from '../../../entities';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  getCurrentTenantId,
  type AuthenticatedUser,
} from '../../../../../common';
import { EntityManager } from '@mikro-orm/postgresql';
import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import {
  PATIENT_REPRESENTATION_PORT,
  type PatientRepresentationPort,
} from '../../ports/patient-representation.port';
import { PRACTITIONER_PROFILE_TABLES } from '../../../domain/resource/practitioner-profile-tables';
import { PractitionerAffiliationGateService } from '../../affiliation/practitioner-affiliation-gate.service';
import {
  SchedulingBookingsRepository,
  SchedulingCatalogRepository,
} from '../../../infrastructure/repositories';
import {
  isPatientActor,
  operatesAnyAgenda,
} from '../../../domain/booking/agenda-actors';
import { SchedulingErrorReason } from '../../../scheduling.error-reasons';

/**
 * Quién puede actuar sobre una cita, y sobre cuál.
 *
 * Reúne las comprobaciones de **actor** que antes eran métodos privados del
 * servicio de reservas: representación del paciente (B.1), titularidad de la
 * agenda al operar, vínculo vigente con la organización y pertenencia del
 * recurso al tenant activo. El guard de roles responde «¿es un profesional?»,
 * no «¿es *el* profesional de esta cita?»: esto es lo segundo.
 */

@Injectable()
export class BookingAccess {
  constructor(
    private readonly bookingsRepo: SchedulingBookingsRepository,
    private readonly catalogRepo: SchedulingCatalogRepository,
    @Inject(PATIENT_REPRESENTATION_PORT)
    private readonly representation: PatientRepresentationPort,
    private readonly affiliations: PractitionerAffiliationGateService,
  ) {}

  /**
   * Exige que el actor pueda actuar por ese paciente, si es una cuenta de paciente.
   *
   * El mostrador y la administración de agenda pasan sin preguntar: su oficio es
   * repartir turnos entre pacientes que no son ellos. A quien entra como
   * paciente se le exige ser el titular o tener apoderamiento vigente.
   *
   * @param patientProfileId - El paciente sobre el que se quiere actuar.
   * @param actor - Quien pide.
   * @param em - Transacción activa, si la hay.
   * @throws ForbiddenException si es una cuenta de paciente sin título sobre él.
   */
  async assertMayActForPatient(
    patientProfileId: string,
    actor: AuthenticatedUser,
    em?: EntityManager,
  ): Promise<void> {
    if (!isPatientActor(actor)) return;
    await this.representation.assertMayActForPatient(
      patientProfileId,
      actor,
      em,
    );
  }

  /**
   * Carga la cita para operarla y comprueba **quién** puede hacerlo.
   *
   * ## Por qué el actor se valida acá y no solo en el `@Roles`
   *
   * El guard de roles responde «¿es un profesional?», no «¿es *el* profesional
   * de esta cita?». Sin esta comprobación, cualquier cuenta con rol clínico
   * podría aceptar, iniciar o cerrar el turno de un colega, que es exactamente
   * la clase de cosa que el rol solo no alcanza a impedir.
   *
   * Quien administra la agenda (`SCHEDULING_ADMIN`/`SCHEDULING_AGENT`) sí opera
   * cualquier cita: ese **es** su trabajo. Un profesional, solo las de su
   * recurso; y si su cuenta no declara perfil profesional, ninguna.
   *
   * @throws ResourceNotFoundException si la cita no existe.
   * @throws ForbiddenActionException si la cita no es de quien la opera.
   */
  async loadForOperation(
    tx: EntityManager,
    bookingId: string,
    actor: AuthenticatedUser,
  ): Promise<AppointmentBookings> {
    const booking = await this.bookingsRepo.findBookingByIdForUpdate(
      tx,
      bookingId,
    );
    if (!booking) {
      throw new ResourceNotFoundException(
        'Cita no encontrada',
        { bookingId },
        SchedulingErrorReason.BOOKING_NOT_FOUND,
      );
    }

    if (operatesAnyAgenda(actor)) {
      return booking;
    }

    const resource = booking.resourceId
      ? await this.catalogRepo.findResourceById(tx, booking.resourceId)
      : null;
    const isOwnAgenda =
      actor.practitionerProfileId !== undefined &&
      resource !== null &&
      resource.resourceRefId === actor.practitionerProfileId &&
      PRACTITIONER_PROFILE_TABLES.includes(resource.resourceRefType);

    if (!isOwnAgenda) {
      // Mismo mecanismo que usa `community` para «este perfil no es tuyo»: el
      // `ForbiddenException` de Nest, que el filtro traduce a 403 FORBIDDEN.
      throw new ForbiddenException(
        'Esta cita es de otra agenda: solo la opera quien atiende en ella.',
      );
    }
    return booking;
  }

  /**
   * Exige que el vínculo con la organización siga vigente para comprometer un
   * turno suyo.
   *
   * ## Por qué hace falta si publicar ya estaba bloqueado
   *
   * Publicar y aceptar ocurren en momentos distintos. Un médico publica su
   * agenda con el vínculo aprobado y meses después la organización se lo
   * revoca: la agenda ya está publicada y los pedidos siguen entrando. Sin esta
   * comprobación seguiría comprometiendo turnos en nombre de una institución
   * que ya no lo reconoce.
   *
   * ## Las citas ya confirmadas no se caen solas
   *
   * Esto bloquea aceptar de acá en adelante; **no toca** las que ya estaban
   * confirmadas. Cancelarlas en bloque al revocar un vínculo dejaría plantados a
   * pacientes que tenían un turno prometido, por un trámite entre el médico y la
   * organización del que no fueron parte. Avisarles es responsabilidad de la
   * organización y del médico.
   *
   * Por lo mismo **no se instrumentan `start` ni `check-in`**: llegado ese
   * momento el paciente ya está en la puerta, y negarle la atención por un
   * vínculo administrativo lo castiga a él, no a quien corresponde.
   *
   * @param tenantId - La organización dueña de la reserva.
   * @param actor - Quien acepta.
   * @throws PreconditionFailedException si el vínculo no está vigente.
   */
  async assertAffiliationCurrent(
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    if (operatesAnyAgenda(actor)) return;

    const verdict = await this.affiliations.evaluate(tenantId, actor);
    if (verdict === 'sin-vinculos' || verdict === 'aprobado') return;

    throw new PreconditionFailedException(
      verdict === 'pendiente'
        ? 'Su vínculo con esta organización todavía está pendiente de ' +
            'aprobación, así que todavía no puede comprometer citas suyas.'
        : 'Su vínculo con esta organización ya no está vigente, así que no ' +
            'puede aceptar citas suyas. Las citas que ya confirmó siguen ' +
            'en pie: hable con la organización para reactivarlo.',
      { tenantId, vinculo: verdict },
      SchedulingErrorReason.AFFILIATION_NOT_ACTIVE,
    );
  }

  /**
   * Impide que un UUID conocido salte el tenant activo del request.
   *
   * El `RolesGuard` limita el rol al tenant resuelto, pero el recurso llega por
   * id y su repositorio no agrega `tenant_id` al predicado. Cuando RLS no está
   * activo, un agente de agenda podía usar el recurso de otra organización y
   * su rol de mostrador evitaba las comprobaciones de titularidad posteriores.
   *
   * `tenantIds` es el respaldo para invocaciones internas sin contexto HTTP.
   * Sin contexto ni membresía comprobable se rechaza; `SUPERADMIN` mantiene su
   * alcance de plataforma.
   */
  assertResourceInActiveTenant(
    resourceTenantId: string,
    actor: AuthenticatedUser,
  ): void {
    if (actor.roles.includes('SUPERADMIN')) return;

    const activeTenantId = getCurrentTenantId();
    const withinScope = activeTenantId
      ? activeTenantId === resourceTenantId
      : actor.tenantIds?.includes(resourceTenantId) === true;

    if (!withinScope) {
      throw new ForbiddenException(
        'La agenda indicada pertenece a otra organización.',
      );
    }
  }
}
