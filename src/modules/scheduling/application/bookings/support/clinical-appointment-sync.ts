import {
  ScheduleRules,
  ScheduleTemplates,
  type AppointmentBookings,
} from '../../../entities';
import { CONCEPTS } from '../../../../../common';
import {
  intervalInWeek,
  referenceWeek,
} from '../../../domain/catalog/week-bands';
import {
  CARE_SPACE_DIRECTORY_PORT,
  type CareSpaceDirectoryPort,
} from '../../ports/care-space-directory.port';
import type { AuthenticatedUser } from '../../../../../common';
import {
  CLINICAL_APPOINTMENTS_PORT,
  type ClinicalAppointmentRef,
  type ClinicalAppointmentsPort,
} from '../../ports/clinical-appointments.port';
import { EntityManager } from '@mikro-orm/postgresql';
import { Inject, Injectable } from '@nestjs/common';
import { PRACTITIONER_PROFILE_TABLES } from '../../../domain/resource/practitioner-profile-tables';

/**
 * La cita clínica que respalda a una reserva: la crea al confirmar y la
 * mantiene al día. Habla con `clinical` sólo a través de su puerto.
 */

@Injectable()
export class ClinicalAppointmentSync {
  constructor(
    @Inject(CLINICAL_APPOINTMENTS_PORT)
    private readonly clinical: ClinicalAppointmentsPort,
    @Inject(CARE_SPACE_DIRECTORY_PORT)
    private readonly spaces?: CareSpaceDirectoryPort,
  ) {}

  /**
   * F5d: consultorio que ocupa una cita: el de la plantilla del cupo o, si
   * no, el del recurso ROOM. Un espacio `allowOverlap` (sala de espera…) no
   * se escribe (el EXCLUDE no cambia reglas de capacidad > 1).
   *
   * @param tx - Transacción.
   * @param input - Plantilla del cupo y espacio del recurso.
   */
  async careSpaceFor(
    tx: EntityManager,
    input: {
      templateId?: string | null;
      resourceCareSpaceId?: string | null;
      /** Cita sin cupo de plantilla (directa/espontánea): la plantilla publicada del recurso que cubre ese instante. */
      resourceId?: string;
      at?: Date;
      timeZone?: string | null;
    },
  ): Promise<string | undefined> {
    // Sin directorio de espacios no se puede descartar un `allowOverlap`: no
    // se escribe consultorio (fail-closed hacia «sin espacio», como antes).
    if (!this.spaces) return undefined;
    let template = input.templateId
      ? await tx.findOne(ScheduleTemplates, { id: input.templateId })
      : null;
    if (!template && input.resourceId && input.at)
      template = await this.templateCovering(
        tx,
        input.resourceId,
        input.at,
        input.timeZone ?? 'UTC',
      );
    const id = template?.careSpaceId ?? input.resourceCareSpaceId ?? undefined;
    if (!id) return undefined;
    const space = await this.spaces.describe(tx, id);
    return space && !space.allowOverlap ? id : undefined;
  }

  /**
   * Crea la cita clínica que respalda una reserva confirmada.
   *
   * ## Por qué existe
   *
   * `clinical.appointments` era una tabla **que nadie escribía**: 0 filas, y
   * ninguna reserva con `appointment_id`. Eso dejaba rota una cadena entera —el
   * check-in de un encuentro declara `appointmentId` hacia esta tabla— así que
   * un encuentro nunca podía decir de qué turno venía. La columna existía, el
   * contrato la pedía, y no había forma de llenarla.
   *
   * ## Por qué al confirmar, y no en el check-in
   *
   * Porque una cita **es** el turno visto desde lo clínico, no el registro de
   * que alguien llegó — eso es el encuentro, que es otra tabla. Crearla en el
   * check-in la haría nacer *después* del encuentro que la referencia, que es el
   * vínculo al revés. El costo aceptado es que una reserva que nadie atienda
   * deja su cita en `APPT_BOOKED`, que es exactamente lo que pasó: un turno
   * agendado al que no se presentaron.
   *
   * ## El profesional sale del recurso, si el recurso es de uno
   *
   * Un recurso puede ser una sala o un equipo. Sólo se copia el profesional
   * cuando el recurso declara apuntar a un perfil profesional; si no, la cita
   * queda sin él en vez de con el uuid de una sala, que sería una clave foránea
   * rota y un dato falso.
   *
   * @param tx - Transacción de la confirmación; la cita nace o no nace con ella.
   * @param data - Lo que la reserva sabe del turno.
   * @returns La cita creada, para enlazarla desde la reserva.
   */
  /** Plantilla publicada del recurso, con consultorio, cuya franja cubre `at`. */
  private async templateCovering(
    tx: EntityManager,
    resourceId: string,
    at: Date,
    zone: string,
  ): Promise<ScheduleTemplates | null> {
    const templates = (
      await tx.find(ScheduleTemplates, {
        resourceId,
        statusConceptId: CONCEPTS.TEMPLATE_PUBLISHED,
        careSpaceId: { $ne: null },
      })
    ).filter(
      (t) =>
        (!t.validFrom || t.validFrom.getTime() <= at.getTime()) &&
        (!t.validTo || t.validTo.getTime() >= at.getTime()),
    );
    if (templates.length === 0) return null;
    const rules = await tx.find(ScheduleRules, {
      scheduleTemplateId: { $in: templates.map((t) => t.id) },
    });
    const week = referenceWeek(at);
    const t = at.getTime();
    const hit = rules.find((r) => {
      const band = intervalInWeek(
        week,
        r.dayOfWeek,
        r.startTime,
        r.endTime,
        zone,
      );
      return band.from <= t && t < band.to;
    });
    return hit
      ? (templates.find((x) => x.id === hit.scheduleTemplateId) ?? null)
      : null;
  }

  createClinicalAppointment(
    tx: EntityManager,
    data: {
      tenantId: string;
      patientProfileId: string;
      resourceRefType?: string;
      resourceRefId?: string;
      startAt: Date;
      endAt?: Date;
      reasonText?: string;
      /** Estado clínico con el que nace: pendiente si se solicitó, reservada si se confirmó. */
      statusConceptId: string;
      /**
       * Por qué medio ocurre la atención. Ausente = presencial, que es lo que
       * fueron todas las citas hasta que existió este conjunto: no se escribe
       * un valor que nadie eligió.
       */
      channelConceptId?: string;
      /** Tipología (P42: la reconsulta nace `ACT_FOLLOW_UP`). Ausente = NULL. */
      typeConceptId?: string;
      careSpaceId?: string;
      actorUserId?: string;
    },
  ): ClinicalAppointmentRef {
    const isPractitionerResource =
      data.resourceRefType !== undefined &&
      PRACTITIONER_PROFILE_TABLES.includes(data.resourceRefType);

    return this.clinical.create(tx, {
      patientProfileId: data.patientProfileId,
      tenantId: data.tenantId,
      ...(isPractitionerResource && data.resourceRefId !== undefined
        ? { practitionerProfileId: data.resourceRefId }
        : {}),
      statusConceptId: data.statusConceptId,
      startAt: data.startAt,
      ...(data.endAt === undefined ? {} : { endAt: data.endAt }),
      ...(data.reasonText === undefined ? {} : { reasonText: data.reasonText }),
      ...(data.channelConceptId === undefined
        ? {}
        : { channelConceptId: data.channelConceptId }),
      ...(data.typeConceptId === undefined
        ? {}
        : { typeConceptId: data.typeConceptId }),
      ...(data.careSpaceId === undefined
        ? {}
        : { careSpaceId: data.careSpaceId }),
      ...(data.actorUserId === undefined
        ? {}
        : { actorUserId: data.actorUserId }),
    });
  }

  /**
   * Mantiene la cita clínica al día con el estado de la reserva.
   *
   * Son dos filas que cuentan lo mismo desde dos módulos, y desincronizarlas
   * tiene consecuencias visibles: el archivo del paciente (carril 09) lee
   * `clinical.appointments`, así que una cita atendida que allí siguiera
   * diciendo `booked` se leería como un turno al que nadie fue.
   *
   * Si la reserva no tiene cita clínica detrás no hace nada: pasa con las
   * reservas anteriores a que existiera ese vínculo, y no es un error.
   */
  async syncClinicalAppointment(
    tx: EntityManager,
    booking: AppointmentBookings,
    statusConceptId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    if (booking.appointmentId === undefined) {
      return;
    }
    await this.clinical.updateStatus(
      tx,
      booking.appointmentId,
      statusConceptId,
      actor.id,
    );
  }
}
