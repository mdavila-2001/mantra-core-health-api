import { BookableSlots, type AppointmentBookings } from '../../../entities';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  getCurrentTenantId,
  type AuthenticatedUser,
} from '../../../../../common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  ForbiddenException,
  HttpException,
  Inject,
  Injectable,
  Optional,
} from '@nestjs/common';
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
  SUPPORT_STAFF_ROLE,
  attendsIn,
  isPatientActor,
  isSupportActor,
  operatesAnyAgenda,
} from '../../../domain/booking/agenda-actors';
import {
  SUPPORT_AUDIT_PORT,
  type SupportAuditPort,
} from '../../ports/support-audit.port';
import {
  SUPPORT_AGENDA_POLICY_PORT,
  type SupportAgendaAction,
  type SupportAgendaContext,
  type SupportAgendaDecisionHooks,
  type SupportAgendaPolicyPort,
} from '../../ports/support-agenda-policy.port';
import {
  SUPPORT_DENIED_MESSAGE,
  supportAnswerToException,
} from './support-decision-errors';

const OTHER_AGENDA_MESSAGE =
  'Esta cita es de otra agenda: solo la opera quien atiende en ella.';

/** Mensaje de rechazo de siempre (vive en `support-decision-errors.ts`; se reexporta). */
export { SUPPORT_DENIED_MESSAGE };

/**
 * Lo que el PEP sabe de la acción y la política cruza con las condiciones del
 * permiso (motivo, paciente, hora de destino). Todo es opcional: sin él un
 * permiso sin condiciones se decide como siempre.
 */
export interface SupportActOptions {
  /** Motivo ya validado por `requireReason` (cumple la obligación «motivo»). */
  readonly reasonText?: string;
  /** Paciente de la acción cuando no es el de una cita (crear, reservar). */
  readonly patientProfileId?: string;
  /** Inicio del destino (crear, reprogramar, turno sin cita). */
  readonly newAppointmentStartAt?: Date;
}

/** Contexto de la política desde las opciones del PEP. */
function contextOf(
  patientProfileId: string | undefined,
  options: SupportActOptions | undefined,
): SupportAgendaContext | undefined {
  const context: SupportAgendaContext = {
    ...((options?.patientProfileId ?? patientProfileId)
      ? { patientProfileId: options?.patientProfileId ?? patientProfileId }
      : {}),
    ...(options?.newAppointmentStartAt
      ? { newAppointmentStartAt: options.newAppointmentStartAt }
      : {}),
    ...(options?.reasonText
      ? { proof: { reasonText: options.reasonText } }
      : {}),
  };
  return Object.keys(context).length > 0 ? context : undefined;
}

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
    @Optional()
    @Inject(SUPPORT_AGENDA_POLICY_PORT)
    private readonly supportPolicy?: SupportAgendaPolicyPort,
    @Optional() private readonly em?: EntityManager,
    @Optional()
    @Inject(SUPPORT_AUDIT_PORT)
    private readonly audit?: SupportAuditPort,
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
   * @param tenantId - Organización del recurso (p. ej. la de la cita). Sin ella,
   *   la del contexto activo. SEG A-A1: el oficio de apoyo/mostrador se lee en
   *   ESA organización, no en cualquiera donde el token traiga el rol.
   * @throws ForbiddenException si es una cuenta de paciente sin título sobre él.
   */
  async assertMayActForPatient(
    patientProfileId: string,
    actor: AuthenticatedUser,
    em?: EntityManager,
    tenantId?: string,
  ): Promise<void> {
    if (!isPatientActor(actor, tenantId ?? getCurrentTenantId())) return;
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
    supportAction?: SupportAgendaAction,
  ): Promise<AppointmentBookings> {
    const booking = await this.bookingsRepo.findBookingByIdForUpdate(
      tx,
      bookingId,
    );
    if (!booking) {
      throw new ResourceNotFoundException('Cita no encontrada', { bookingId });
    }

    if (operatesAnyAgenda(actor, booking.tenantId)) {
      return booking;
    }

    // La persona de apoyo no opera por su rol: cada acción la decide la política.
    if (isSupportActor(actor, booking.tenantId)) {
      await this.assertSupportMayAct(tx, booking, actor, supportAction);
      return booking;
    }

    if (!(await this.isOwnAgenda(tx, booking, actor))) {
      // Mismo mecanismo que usa `community` para «este perfil no es tuyo»: el
      // `ForbiddenException` de Nest, que el filtro traduce a 403 FORBIDDEN.
      throw new ForbiddenException(OTHER_AGENDA_MESSAGE);
    }
    return booking;
  }

  /** ¿La cita es de un recurso que es el perfil profesional de este actor? */
  private async isOwnAgenda(
    tx: EntityManager,
    booking: AppointmentBookings,
    actor: AuthenticatedUser,
  ): Promise<boolean> {
    if (actor.practitionerProfileId === undefined || !booking.resourceId) {
      return false;
    }
    const resource = await this.catalogRepo.findResourceById(
      tx,
      booking.resourceId,
    );
    return (
      resource !== null &&
      resource !== undefined &&
      resource.resourceRefId === actor.practitionerProfileId &&
      PRACTITIONER_PROFILE_TABLES.includes(resource.resourceRefType)
    );
  }

  /**
   * Quién puede cancelar o reprogramar ESTA cita (SEG V-1).
   *
   * Antes solo se comprobaba el candado de representación, y era un no-op para
   * todo el que tuviera `practitionerProfileId`: cualquier profesional cancelaba
   * y movía las citas de un colega. Ahora, por organización de la cita:
   *  - mostrador/administración de agenda: su oficio es operar cualquiera;
   *  - persona de apoyo: la política decide permiso por permiso
   *    (`assertSupportMayAct`, que va a continuación);
   *  - cuenta de paciente (incluido el profesional de OTRA organización):
   *    titular o apoderado (`assertMayActForPatient`);
   *  - profesional de la organización: la cita de su propia agenda, o la suya o
   *    de quien representa si él mismo es el paciente.
   *
   * @throws ForbiddenException si no cumple ninguna.
   */
  async assertMayChangeBooking(
    tx: EntityManager,
    booking: AppointmentBookings,
    actor: AuthenticatedUser,
  ): Promise<void> {
    const tenantId = booking.tenantId;
    if (operatesAnyAgenda(actor, tenantId)) return;
    if (isSupportActor(actor, tenantId)) return;
    if (!attendsIn(actor, tenantId)) {
      await this.representation.assertMayActForPatient(
        booking.patientProfileId,
        actor,
        tx,
      );
      return;
    }
    if (
      actor.patientProfileId !== undefined &&
      actor.patientProfileId === booking.patientProfileId
    ) {
      return;
    }
    if (await this.isOwnAgenda(tx, booking, actor)) return;
    if (
      await this.representation.representsPatient(
        booking.patientProfileId,
        actor,
        tx,
      )
    ) {
      return;
    }
    throw new ForbiddenException(OTHER_AGENDA_MESSAGE);
  }

  /**
   * Si el actor es persona de apoyo, exige que la política le permita la acción
   * sobre ESTA cita (su doctor, servicio y espacio); para cualquier otro actor
   * no hace nada. Una operación que no declara su acción se niega: fallar
   * cerrado es lo único que impide que una ruta nueva abra la agenda entera.
   *
   * @param tx - Transacción activa.
   * @param booking - La cita sobre la que se actúa.
   * @param actor - Quien pide.
   * @param action - Acción de apoyo que la operación ejerce.
   * @param options - Motivo y destino de la acción, para las condiciones del permiso.
   * @returns El permiso que habilitó la acción; `undefined` si el actor no es de apoyo.
   * @throws ForbiddenException si la política no la permite; 422 `REASON_REQUIRED` o
   *   403 `STEP_UP_REQUIRED`/`APPROVAL_REQUIRED` si pide un desafío (ver
   *   `supportAnswerToException`).
   */
  async assertSupportMayAct(
    tx: EntityManager,
    booking: AppointmentBookings,
    actor: AuthenticatedUser,
    action?: SupportAgendaAction,
    options?: SupportActOptions,
  ): Promise<string | undefined> {
    if (!isSupportActor(actor, booking.tenantId)) return undefined;
    this.assertSupportInActiveTenant(booking.tenantId, actor);
    const decided = await this.decideSupport(
      tx,
      booking,
      actor,
      action,
      options,
    );
    await this.sealSupportAccess(actor, {
      tenantId: booking.tenantId,
      action: action as SupportAgendaAction,
      bookingId: booking.id,
      grantId: decided.grantId,
      practitionerProfileId: decided.practitionerProfileId,
    });
    return decided.grantId;
  }

  /**
   * Pregunta a la política. Con lo que el PEP sabe de la acción (paciente,
   * destino, motivo) si la política lo admite (`decideWithContext`); una política
   * que solo conoce `decide` se pregunta como siempre.
   */
  private ask(
    question: Parameters<SupportAgendaPolicyPort['decide']>[0],
    hooks: SupportAgendaDecisionHooks,
  ): ReturnType<SupportAgendaPolicyPort['decide']> {
    const policy = this.supportPolicy as SupportAgendaPolicyPort;
    const hasHooks = !!hooks.context || !!hooks.completeContext;
    return policy.decideWithContext && hasHooks
      ? policy.decideWithContext(question, hooks)
      : policy.decide(question);
  }

  /** Pregunta a la política por esta cita; falla cerrado y no sella nada. */
  private async decideSupport(
    tx: EntityManager,
    booking: AppointmentBookings,
    actor: AuthenticatedUser,
    action?: SupportAgendaAction,
    options?: SupportActOptions,
  ): Promise<{ grantId?: string; practitionerProfileId?: string }> {
    if (!action || !this.supportPolicy) {
      throw new ForbiddenException(
        'El personal de apoyo no puede realizar esta operación.',
      );
    }
    const resource = booking.resourceId
      ? await this.catalogRepo.findResourceById(tx, booking.resourceId)
      : null;
    const practitionerProfileId =
      resource !== null &&
      PRACTITIONER_PROFILE_TABLES.includes(resource.resourceRefType)
        ? resource.resourceRefId
        : undefined;
    const answer = await this.ask(
      {
        userId: actor.id,
        tenantId: booking.tenantId,
        action,
        practitionerProfileId,
        healthcareServiceId: booking.healthcareServiceId,
        careSpaceId: booking.careSpaceId,
      },
      {
        context: contextOf(booking.patientProfileId, options),
        // La hora de la cita cuesta una consulta: la política la pide solo si una
        // condición la usa o hay una aprobación que comparar con esta cita.
        completeContext: async () => {
          const slot = await tx.findOne(BookableSlots, booking.bookableSlotId);
          return slot ? { appointmentStartAt: slot.startAt } : {};
        },
      },
    );
    const refusal = supportAnswerToException(answer);
    if (refusal) throw refusal;
    return { grantId: answer.grantId, practitionerProfileId };
  }

  /**
   * Deja en la cadena de auditoría lo que la persona de apoyo hizo: qué acción,
   * sobre qué cita, con qué permiso y sobre la agenda de qué doctor. Son tres
   * sellos enlazados por el mismo actor y momento: el de la acción sobre la
   * cita, el del permiso que la habilitó y el del doctor. Va en su propia
   * transacción corta: las lecturas no tienen una abierta.
   *
   * @param actor - La persona de apoyo.
   * @param access - Qué se hizo y con qué permiso.
   */
  private async sealSupportAccess(
    actor: AuthenticatedUser,
    access: {
      tenantId: string;
      action: SupportAgendaAction;
      bookingId?: string;
      grantId?: string;
      practitionerProfileId?: string;
    },
  ): Promise<void> {
    if (!this.audit || !this.em) return;
    const audit = this.audit;
    await this.em.fork().transactional(async (tx) => {
      // Con RLS esta transacción corta es nueva y no hereda la organización de
      // la petición: el asiento lleva `tenant_id` y la política lo exige.
      if (process.env.RLS_ENFORCE === 'true') {
        await tx.execute(
          "select set_config('app.system_context', 'false', true)",
        );
        await tx.execute(
          "select set_config('app.current_tenant_id', ?, true)",
          [access.tenantId],
        );
      }
      await audit.record(tx, actor, {
        action: `SUPPORT_${access.action.replace('.', '_').toUpperCase()}`,
        entity: 'appointment_booking',
        entityId: access.bookingId,
        tenantId: access.tenantId,
      });
      if (access.grantId) {
        await audit.record(tx, actor, {
          action: 'SUPPORT_ACCESS_VIA_GRANT',
          entity: 'support_scope_grant',
          entityId: access.grantId,
          tenantId: access.tenantId,
        });
      }
      if (access.practitionerProfileId) {
        await audit.record(tx, actor, {
          action: 'SUPPORT_ACCESS_ON_PRACTITIONER',
          entity: 'practitioner_profile',
          entityId: access.practitionerProfileId,
          tenantId: access.tenantId,
        });
      }
    });
  }

  /**
   * Sella la lectura de la agenda de una persona de apoyo: un sello por permiso y
   * doctor que le dieron acceso en esta lectura (no uno por cita).
   *
   * @param actor - La persona de apoyo.
   * Además deja un asiento de acceso por cada paciente cuya cita se mostró
   * (`patient_profile_id`, sin datos clínicos), para poder responder «quién vio
   * al paciente X».
   *
   * @param tenantId - Organización de la agenda.
   * @param accesses - Permisos y doctores con los que vio citas.
   * @param patientProfileIds - Pacientes que la lectura reveló (con `schedule.view`).
   */
  async sealSupportAgendaView(
    actor: AuthenticatedUser,
    tenantId: string,
    accesses: readonly { grantId?: string; practitionerProfileId?: string }[],
    patientProfileIds: readonly string[] = [],
  ): Promise<void> {
    const unique = new Map(
      accesses.map((a) => [`${a.grantId}:${a.practitionerProfileId}`, a]),
    );
    for (const access of unique.values()) {
      await this.sealSupportAccess(actor, {
        tenantId,
        action: 'schedule.view',
        ...access,
      });
    }
    await this.sealSupportPatientViews(actor, tenantId, patientProfileIds);
  }

  /** Un asiento de acceso por paciente visto, en su propia transacción corta. */
  private async sealSupportPatientViews(
    actor: AuthenticatedUser,
    tenantId: string,
    patientProfileIds: readonly string[],
  ): Promise<void> {
    const patients = [...new Set(patientProfileIds)];
    if (!this.audit || !this.em || patients.length === 0) return;
    const audit = this.audit;
    await this.em.fork().transactional(async (tx) => {
      if (process.env.RLS_ENFORCE === 'true') {
        await tx.execute(
          "select set_config('app.system_context', 'false', true)",
        );
        await tx.execute(
          "select set_config('app.current_tenant_id', ?, true)",
          [tenantId],
        );
      }
      for (const patientProfileId of patients) {
        await audit.recordPatientAccess(tx, actor, {
          patientProfileId,
          tenantId,
          resourceType: 'SUPPORT_AGENDA',
        });
      }
    });
  }

  /**
   * Para una persona de apoyo que va a agendar una cita nueva, exige que la
   * política le permita `schedule.create` sobre el doctor, servicio y espacio
   * con los que nacerá, y devuelve el permiso que la habilita para sellarlo en
   * la cita (`booked_via_grant_id`). Para cualquier otro actor no hace nada.
   *
   * @param resource - Recurso (agenda) donde se agenda.
   * @param place - Espacio y servicio con los que nacerá la cita.
   * @param actor - Quien agenda.
   * @param action - `schedule.create` (cita puntual o retención de un cupo),
   *   `schedule.walk_in`, `schedule.waitlist` o `schedule.reschedule` (cupo destino).
   * @returns El permiso que habilitó la acción; `undefined` si el actor no es de apoyo.
   * @throws ForbiddenException si la política no la permite.
   */
  async assertSupportMayCreate(
    resource: {
      tenantId: string;
      resourceRefType: string;
      resourceRefId: string;
    },
    place: { careSpaceId?: string; healthcareServiceId?: string },
    actor: AuthenticatedUser,
    action: Extract<
      SupportAgendaAction,
      | 'schedule.create'
      | 'schedule.walk_in'
      | 'schedule.waitlist'
      | 'schedule.reschedule'
    >,
    options?: SupportActOptions,
  ): Promise<string | undefined> {
    if (!isSupportActor(actor, resource.tenantId)) return undefined;
    this.assertSupportInActiveTenant(resource.tenantId, actor);
    if (!this.supportPolicy) {
      throw new ForbiddenException(
        'El personal de apoyo no puede realizar esta operación.',
      );
    }
    const answer = await this.ask(
      {
        userId: actor.id,
        tenantId: resource.tenantId,
        action,
        practitionerProfileId: PRACTITIONER_PROFILE_TABLES.includes(
          resource.resourceRefType,
        )
          ? resource.resourceRefId
          : undefined,
        healthcareServiceId: place.healthcareServiceId,
        careSpaceId: place.careSpaceId,
      },
      { context: contextOf(undefined, options) },
    );
    const refusal = supportAnswerToException(answer);
    if (refusal) throw refusal;
    await this.sealSupportAccess(actor, {
      tenantId: resource.tenantId,
      action,
      grantId: answer.grantId,
      practitionerProfileId: PRACTITIONER_PROFILE_TABLES.includes(
        resource.resourceRefType,
      )
        ? resource.resourceRefId
        : undefined,
    });
    return answer.grantId;
  }

  /**
   * Para una persona de apoyo que va a operar sobre un cupo (retenerlo, confirmar
   * la retención, apuntarse a su espera o moverse a él), exige que la política le
   * permita la acción sobre el doctor, servicio y espacio DEL CUPO, y que el cupo
   * sea de la organización con la que actúa (`tenantId`, cuando se declara).
   * Devuelve el permiso que la habilita. Para cualquier otro actor no hace nada.
   *
   * @param tx - Transacción activa.
   * @param slot - El cupo.
   * @param actor - Quien opera.
   * @param action - Acción de apoyo que se ejerce sobre el cupo.
   * @param declaredTenantId - Organización que el cuerpo declara, si la declara.
   * @returns El permiso que habilitó la acción; `undefined` si el actor no es de apoyo.
   * @throws ForbiddenException si la política no la permite o el cupo es de otra organización.
   */
  async assertSupportMayOnSlot(
    tx: EntityManager,
    slot: Pick<
      BookableSlots,
      'resourceId' | 'careSpaceId' | 'healthcareServiceId'
    > &
      Partial<Pick<BookableSlots, 'startAt'>>,
    actor: AuthenticatedUser,
    action: Extract<
      SupportAgendaAction,
      'schedule.create' | 'schedule.waitlist' | 'schedule.reschedule'
    >,
    declaredTenantId?: string,
  ): Promise<string | undefined> {
    // Quien no trae el rol de apoyo no pasa por acá: ni se lee la agenda del cupo.
    if (!actor.roles.includes(SUPPORT_STAFF_ROLE)) return undefined;
    const resource = slot.resourceId
      ? await this.catalogRepo.findResourceById(tx, slot.resourceId)
      : null;
    if (!resource) {
      // Sin agenda que contrastar no hay organización contra la que decidir:
      // una persona de apoyo no opera sobre un cupo huérfano.
      if (!isSupportActor(actor)) return undefined;
      throw new ForbiddenException(SUPPORT_DENIED_MESSAGE);
    }
    if (!isSupportActor(actor, resource.tenantId)) return undefined;
    if (
      declaredTenantId !== undefined &&
      declaredTenantId !== resource.tenantId
    ) {
      throw new ForbiddenException(SUPPORT_DENIED_MESSAGE);
    }
    return this.assertSupportMayCreate(
      resource,
      {
        careSpaceId: slot.careSpaceId ?? undefined,
        healthcareServiceId: slot.healthcareServiceId ?? undefined,
      },
      actor,
      action,
      // El horario del cupo es el destino de la acción (horizonte de agenda).
      slot.startAt ? { newAppointmentStartAt: slot.startAt } : undefined,
    );
  }

  /**
   * La persona de apoyo actúa en UNA organización por petición: la activa
   * (`X-Tenant-Id`, o su única membresía), y el recurso sobre el que opera tiene
   * que ser de ella. El guard de roles ya comprobó que el vínculo de apoyo vale en
   * ese tenant y el interceptor que el actor pertenece a él; esto cierra el
   * tercer lado: que la cita o el cupo no sean de otra organización donde también
   * tenga vínculo. Falla con el mismo rechazo de la política, sin nombrar a la otra.
   *
   * @param resourceTenantId - Organización de la cita o del cupo.
   * @param actor - La persona de apoyo.
   * @throws ForbiddenException si el recurso no es de la organización activa.
   */
  private assertSupportInActiveTenant(
    resourceTenantId: string,
    actor: AuthenticatedUser,
  ): void {
    const active = getCurrentTenantId();
    const withinScope = active
      ? active === resourceTenantId
      : actor.tenantIds?.includes(resourceTenantId) === true;
    if (!withinScope) throw new ForbiddenException(SUPPORT_DENIED_MESSAGE);
  }

  /**
   * Para una persona de apoyo, deja solo las citas que la política le permite
   * ver (`schedule.view`); para cualquier otro actor devuelve todas.
   *
   * @param em - Contexto de lectura.
   * @param rows - Citas ya leídas.
   * @param actor - Quien pide.
   * @returns Las citas visibles para el actor.
   */
  async keepVisibleToSupport<T extends { booking: AppointmentBookings }>(
    em: EntityManager,
    rows: readonly T[],
    actor: AuthenticatedUser,
  ): Promise<T[]> {
    const visible: T[] = [];
    // Un sello por permiso y doctor, no por cita: el listado es una sola lectura.
    const sealed = new Map<
      string,
      { tenantId: string; grantId?: string; practitionerProfileId?: string }
    >();
    for (const row of rows) {
      if (!isSupportActor(actor, row.booking.tenantId)) {
        visible.push(row);
        continue;
      }
      try {
        const decided = await this.decideSupport(
          em,
          row.booking,
          actor,
          'schedule.view',
        );
        visible.push(row);
        sealed.set(`${decided.grantId}:${decided.practitionerProfileId}`, {
          tenantId: row.booking.tenantId,
          ...decided,
        });
      } catch (error) {
        // Para listar, todo lo que no es un permiso pleno deja la cita fuera
        // (también un desafío: no se ofrece ni se enumera lo que pediría uno).
        if (!(error instanceof HttpException)) throw error;
      }
    }
    for (const access of sealed.values()) {
      await this.sealSupportAccess(actor, {
        ...access,
        action: 'schedule.view',
      });
    }
    return visible;
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
    // La afiliación del doctor es asunto del doctor: ni la agenda ni el personal
    // de apoyo que opera en su nombre la tienen.
    if (operatesAnyAgenda(actor, tenantId) || isSupportActor(actor, tenantId)) {
      return;
    }

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
        // A la persona de apoyo no se le dice que la agenda existe en otra
        // organización: recibe el mismo rechazo que de la política.
        isSupportActor(actor, resourceTenantId)
          ? SUPPORT_DENIED_MESSAGE
          : 'La agenda indicada pertenece a otra organización.',
      );
    }
  }
}
