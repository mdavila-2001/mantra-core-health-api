import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  AppointmentBookings,
  AppointmentReminders,
  BookableSlots,
  SchedulableResources,
  WaitlistEntries,
} from '../entities';
import {
  PersonAccountLinks,
  PersonProfiles,
  Persons,
} from '../../profiles/entities';
import {
  AuthenticationCredentials,
  EmailVerifications,
} from '../../iam/entities';
import { PROF } from '../../profiles/profiles.concepts';

/**
 * Cómo nombra un recurso a la tabla de perfiles profesionales.
 *
 * Los dos nombres conviven en los datos —el real y el que siembran los recursos
 * de ejemplo—, igual que en `SchedulingBookingsService`. Aceptar uno solo
 * dejaría la mitad de los avisos diciendo «tu profesional» en vez del nombre.
 */
const TABLAS_DE_PERFIL_PROFESIONAL: readonly string[] = [
  'practitioner_profiles',
  'health_practitioner_profiles',
];

/** Lo que un aviso necesita saber de una cita. */
export interface BookingNoticeSnapshot {
  readonly bookingId: string;
  readonly tenantId: string;
  readonly patientProfileId: string;
  readonly resourceId?: string;
  readonly slotId: string;
  readonly startAt?: Date;
  readonly endAt?: Date;
  /** Cómo se llama la agenda: el profesional, si el recurso es de uno. */
  readonly resourceLabel: string;
}

/** Lo que un aviso necesita saber de un cupo liberado. */
export interface SlotNoticeSnapshot {
  readonly slotId: string;
  readonly resourceId: string;
  readonly startAt: Date;
  readonly endAt?: Date;
  readonly resourceLabel: string;
}

/** Entrada de lista de espera tal como la ve quien la pidió. */
export interface WaitlistEntrySnapshot {
  readonly id: string;
  readonly tenantId: string;
  readonly patientProfileId: string;
  readonly resourceId?: string;
  readonly resourceLabel: string;
  readonly desiredFrom?: Date;
  readonly desiredTo?: Date;
  readonly priority: number;
  readonly statusConceptId: string;
  readonly createdAt: Date;
}

/**
 * Lecturas que los avisos de agenda necesitan y que ningún otro repositorio
 * ofrecía (P8).
 *
 * Vive aparte de `SchedulingBookingsRepository` —que toma filas con
 * `FOR UPDATE` para el flujo de escritura— porque acá no se bloquea nada:
 * son consultas para redactar un aviso y para saber a qué cuenta mandarlo.
 * Ninguna de ellas decide nada del negocio, así que todas toleran leer un
 * instante tarde.
 */
@Injectable()
export class SchedulingNoticeRepository {
  /**
   * Cuenta de portal que encarna a un perfil de paciente o de profesional.
   *
   * Es el paso que convierte «el turno es de este paciente» en «este aviso va a
   * esta bandeja». Devuelve `null` cuando la persona no tiene cuenta —un
   * paciente cargado por mostrador que nunca se registró—, que no es un error:
   * es un aviso que no se puede entregar y hay que decirlo, no fallar.
   *
   * ## Por qué el id del perfil **es** el de la persona
   *
   * `profiles.patient_profiles.profile_id` y
   * `profiles.health_practitioner_profiles.profile_id` son claves foráneas a
   * `profiles.persons(id)`, no a `person_profiles`: el perfil de paciente es una
   * extensión de la persona, con su misma identidad. Buscar por
   * `person_profiles` —que es la tabla de *tipos* de perfil— no encontraba nada
   * y dejaba a todo aviso sin destinatario, en silencio y con la excusa
   * plausible «este paciente no tiene cuenta».
   *
   * El rodeo por `person_profiles` queda como respaldo por si algún dato
   * antiguo lo usara; en la base viva no hace falta.
   *
   * @param em - Contexto de persistencia.
   * @param profileId - `patient_profiles.profile_id` o
   * `health_practitioner_profiles.profile_id` (ambos, el id de la persona).
   */
  async findAccountForProfile(
    em: EntityManager,
    profileId: string,
  ): Promise<string | null> {
    const personId = await this.resolvePersonId(em, profileId);
    if (personId === null) return null;
    const link = await em.findOne(PersonAccountLinks, {
      personId,
      statusConceptId: PROF.ACCOUNT_LINK_ACTIVE,
    });
    return link?.userId ?? null;
  }

  /**
   * La persona detrás de un id de perfil.
   *
   * Directo, porque el id del perfil es el de la persona (ver
   * {@link findAccountForProfile}); por `person_profiles` sólo si aquélla no
   * existe, para tolerar datos que se hubieran cargado con la otra convención.
   */
  private async resolvePersonId(
    em: EntityManager,
    profileId: string,
  ): Promise<string | null> {
    const person = await em.findOne(Persons, { id: profileId });
    if (person) return person.id;
    const profile = await em.findOne(PersonProfiles, { id: profileId });
    return profile?.personId ?? null;
  }

  /**
   * A qué dirección se le puede escribir a una cuenta.
   *
   * El correo de agenda necesita una dirección concreta: el canal `EMAIL` de
   * mensajería exige `recipientAddress` porque el proveedor externo no sabe
   * resolver un `userId`. Este proyecto guarda esa dirección en dos lugares y
   * ninguno se llama «email»:
   *
   * 1. `iam.authentication_credentials.external_subject`, cuando la persona
   *    entra con su correo. Quien entra con su cédula **no** tiene correo ahí,
   *    y por eso no alcanza con mirar sólo esta tabla.
   * 2. `iam.email_verifications.email`, que es el que declaró en el alta.
   *
   * Es el mismo orden que ya usa `IamEmailVerificationService` para decidir a
   * dónde reenviar la verificación; se replica acá en vez de exportarlo para no
   * acoplar `scheduling` a un servicio de `iam`, que arrastraría su módulo
   * entero.
   *
   * Devuelve `null` cuando la cuenta no declaró correo en ninguno de los dos:
   * no es un error, es un aviso que sale sólo por la campana.
   *
   * @param em - Contexto de persistencia.
   * @param userId - Cuenta destinataria del aviso.
   */
  async findEmailForUser(
    em: EntityManager,
    userId: string,
  ): Promise<string | null> {
    const credentials = await em.find(AuthenticationCredentials, { userId });
    const porCredencial = credentials
      .map((credential) => credential.externalSubject)
      .find(
        (subject): subject is string =>
          typeof subject === 'string' && subject.includes('@'),
      );
    if (porCredencial !== undefined) return porCredencial.trim();

    const verification = await em.findOne(
      EmailVerifications,
      { userId },
      { orderBy: { createdAt: 'desc' } },
    );
    const declarado = verification?.email?.trim();
    return declarado === undefined || declarado === '' ? null : declarado;
  }

  /** Cómo se llama la persona de un perfil, para nombrarla en el aviso. */
  async findDisplayNameForProfile(
    em: EntityManager,
    profileId: string,
  ): Promise<string | null> {
    const personId = await this.resolvePersonId(em, profileId);
    if (personId === null) return null;
    const person = await em.findOne(Persons, { id: personId });
    if (!person) return null;
    const compuesto = [person.name, person.lastName]
      .filter((parte): parte is string => typeof parte === 'string')
      .join(' ')
      .trim();
    return person.displayName ?? (compuesto === '' ? null : compuesto);
  }

  /** La cita con su cupo y el nombre de su agenda. */
  async describeBooking(
    em: EntityManager,
    bookingId: string,
  ): Promise<BookingNoticeSnapshot | null> {
    const booking = await em.findOne(AppointmentBookings, { id: bookingId });
    if (!booking) return null;

    const slot = await em.findOne(BookableSlots, {
      id: booking.bookableSlotId,
    });
    const resourceId = booking.resourceId ?? slot?.resourceId;

    return {
      bookingId: booking.id,
      tenantId: booking.tenantId,
      patientProfileId: booking.patientProfileId,
      ...(resourceId === undefined ? {} : { resourceId }),
      slotId: booking.bookableSlotId,
      ...(slot?.startAt === undefined ? {} : { startAt: slot.startAt }),
      ...(slot?.endAt === undefined ? {} : { endAt: slot.endAt }),
      resourceLabel: await this.describeResource(em, resourceId),
    };
  }

  /** El cupo con el nombre de su agenda. */
  async describeSlot(
    em: EntityManager,
    slotId: string,
  ): Promise<SlotNoticeSnapshot | null> {
    const slot = await em.findOne(BookableSlots, { id: slotId });
    if (!slot) return null;
    return {
      slotId: slot.id,
      resourceId: slot.resourceId,
      startAt: slot.startAt,
      endAt: slot.endAt,
      resourceLabel: await this.describeResource(em, slot.resourceId),
    };
  }

  /**
   * Cómo nombrar una agenda en un aviso.
   *
   * Con el nombre del profesional cuando el recurso apunta a un perfil
   * profesional; con el nombre del propio recurso —una sala, un equipo— si no.
   * Nunca con el uuid: un aviso que dice un identificador no dice nada.
   */
  async describeResource(
    em: EntityManager,
    resourceId: string | undefined,
  ): Promise<string> {
    if (resourceId === undefined) return 'tu agenda';
    const resource = await em.findOne(SchedulableResources, { id: resourceId });
    if (!resource) return 'tu agenda';

    if (TABLAS_DE_PERFIL_PROFESIONAL.includes(resource.resourceRefType)) {
      const nombre = await this.findDisplayNameForProfile(
        em,
        resource.resourceRefId,
      );
      if (nombre !== null) return nombre;
    }
    return resource.name;
  }

  /**
   * Cuenta del profesional que atiende un recurso.
   *
   * Es lo que permite avisarle **a él** cuando el paciente cancela: sin este
   * camino el aviso siempre volvería al paciente, que es quien ya sabe lo que
   * acaba de hacer. Devuelve `null` cuando el recurso es una sala o un equipo,
   * que no tienen a quién avisarle.
   */
  async findResourceAccount(
    em: EntityManager,
    resourceId: string | undefined,
  ): Promise<string | null> {
    if (resourceId === undefined) return null;
    const resource = await em.findOne(SchedulableResources, { id: resourceId });
    if (
      !resource ||
      !TABLAS_DE_PERFIL_PROFESIONAL.includes(resource.resourceRefType)
    ) {
      return null;
    }
    return this.findAccountForProfile(em, resource.resourceRefId);
  }

  /** Los perfiles de paciente de unas entradas de lista de espera. */
  async findWaitlistPatients(
    em: EntityManager,
    entryIds: readonly string[],
  ): Promise<
    readonly { id: string; patientProfileId: string; tenantId: string }[]
  > {
    if (entryIds.length === 0) return [];
    const rows = await em.find(WaitlistEntries, { id: { $in: [...entryIds] } });
    return rows.map((row) => ({
      id: row.id,
      patientProfileId: row.patientProfileId,
      tenantId: row.tenantId,
    }));
  }

  /** La lista de espera de un paciente (UC-41-11, lectura que faltaba). */
  async findWaitlistByPatient(
    em: EntityManager,
    patientProfileId: string,
    statusConceptIds: readonly string[] | undefined,
    limit: number,
  ): Promise<readonly WaitlistEntrySnapshot[]> {
    const rows = await em.find(
      WaitlistEntries,
      {
        patientProfileId,
        ...(statusConceptIds === undefined || statusConceptIds.length === 0
          ? {}
          : { statusConceptId: { $in: [...statusConceptIds] } }),
      },
      { orderBy: { createdAt: 'desc' }, limit },
    );

    const snapshots: WaitlistEntrySnapshot[] = [];
    for (const row of rows) {
      snapshots.push({
        id: row.id,
        tenantId: row.tenantId,
        patientProfileId: row.patientProfileId,
        ...(row.resourceId === undefined ? {} : { resourceId: row.resourceId }),
        resourceLabel: await this.describeResource(em, row.resourceId),
        ...(row.desiredFrom === undefined
          ? {}
          : { desiredFrom: row.desiredFrom }),
        ...(row.desiredTo === undefined ? {} : { desiredTo: row.desiredTo }),
        priority: row.priority,
        statusConceptId: row.statusConceptId,
        createdAt: row.createdAt,
      });
    }
    return snapshots;
  }

  /**
   * Las citas que una demora afecta: las vigentes de ese recurso dentro de la
   * ventana informada.
   *
   * La ventana la fija quien informa la demora («hoy», «esta tarde»), no el
   * repositorio: una demora de veinte minutos no afecta el turno de la semana
   * que viene, pero tampoco sólo al que está entrando.
   */
  async findAffectedBookings(
    em: EntityManager,
    resourceId: string,
    from: Date,
    to: Date,
    activeStates: readonly string[],
    limit: number,
  ): Promise<readonly BookingNoticeSnapshot[]> {
    const slots = await em.find(BookableSlots, {
      resourceId,
      startAt: { $gte: from, $lte: to },
    });
    if (slots.length === 0) return [];

    const porSlot = new Map(slots.map((slot) => [slot.id, slot]));
    const bookings = await em.find(
      AppointmentBookings,
      {
        bookableSlotId: { $in: [...porSlot.keys()] },
        statusConceptId: { $in: [...activeStates] },
      },
      { limit },
    );

    const label = await this.describeResource(em, resourceId);
    return bookings
      .map((booking) => {
        const slot = porSlot.get(booking.bookableSlotId);
        return {
          bookingId: booking.id,
          tenantId: booking.tenantId,
          patientProfileId: booking.patientProfileId,
          resourceId,
          slotId: booking.bookableSlotId,
          ...(slot?.startAt === undefined ? {} : { startAt: slot.startAt }),
          ...(slot?.endAt === undefined ? {} : { endAt: slot.endAt }),
          resourceLabel: label,
        } satisfies BookingNoticeSnapshot;
      })
      .sort(
        (a, b) => (a.startAt?.getTime() ?? 0) - (b.startAt?.getTime() ?? 0),
      );
  }

  /** La cita a la que pertenece un recordatorio ya despachado. */
  async findBookingIdsForReminders(
    em: EntityManager,
    reminderIds: readonly string[],
  ): Promise<
    readonly { reminderId: string; bookingId: string; offsetMinutes: number }[]
  > {
    if (reminderIds.length === 0) return [];
    const rows = await em.find(AppointmentReminders, {
      id: { $in: [...reminderIds] },
    });
    return rows.map((row) => ({
      reminderId: row.id,
      bookingId: row.bookingId,
      offsetMinutes: row.offsetMinutes,
    }));
  }
}
