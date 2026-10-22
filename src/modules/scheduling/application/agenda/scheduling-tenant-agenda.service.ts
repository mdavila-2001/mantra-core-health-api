import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  type AuthenticatedUser,
} from '../../../../common';
import {
  TENANT_DIRECTORY_PORT,
  type TenantDirectoryPort,
} from '../ports/tenant-directory.port';
// Se importa la ENTIDAD de `profiles` y no su módulo —el mismo criterio que ya
// usa la agenda del profesional para resolver nombres—: traer el módulo entero
// para leer una columna abriría una dependencia que hoy no existe.
import { SchedulingBookingsRepository } from '../../infrastructure/repositories';
import { SchedulingAgendaRepository } from '../../infrastructure/repositories';
import { SchedulableResources } from '../../entities';
import {
  MAX_BOOKINGS_PER_PAGE,
  MAX_AGENDA_RANGE_DAYS,
  type TenantAgendaQueryDto,
  type TenantAgendaItemDto,
  type TenantAgendaResponseDto,
} from '../../presentation/dto';
import { PRACTITIONER_PROFILE_TABLES } from '../../domain/resource/practitioner-profile-tables';

/** Milisegundos de un día. */
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/** Tope por omisión cuando el cliente no pide uno. */
const DEFAULT_PAGE_LIMIT = 200;

/**
 * La agenda de la organización (TP-5).
 *
 * ## El tercer actor
 *
 * La agenda del médico existía y la del paciente también. Faltaba la de quien
 * recibe: una recepción que necesita saber quién viene hoy, a qué hora y con
 * qué profesional. Sin esta lectura, esa persona tenía que preguntarle a cada
 * médico por su agenda, de a uno.
 *
 * ## El motivo de consulta no viaja, y no por un filtro
 *
 * El DTO simplemente no lo declara. Es distinto de excluirlo con una condición:
 * no hay un `if` que alguien pueda invertir por accidente ni una bandera que
 * alguien pueda encender. Una recepción necesita saber **quién viene**, no
 * **por qué viene** — lo segundo es del paciente y de su médico.
 *
 * ## El perímetro está en la consulta
 *
 * `tenantId` entra en el `where` del repositorio. Es la lección del #156, y la
 * diferencia con comprobarlo después no es de estilo: filtrando en la consulta,
 * las filas ajenas nunca se leyeron, así que ningún camino posterior puede
 * exponerlas.
 */
@Injectable()
export class SchedulingTenantAgendaService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param bookingsRepo - Acceso a `scheduling.appointment_bookings`.
   * @param agendaRepo - Acceso a los recursos agendables.
   * @param tenants - Quién administra cada organización y cómo se llaman las personas.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly bookingsRepo: SchedulingBookingsRepository,
    private readonly agendaRepo: SchedulingAgendaRepository,
    @Inject(TENANT_DIRECTORY_PORT)
    private readonly tenants: TenantDirectoryPort,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SchedulingTenantAgendaService.name);
  }

  /**
   * Las citas de la organización en una ventana.
   *
   * @param tenantId - La organización que mira su agenda.
   * @param query - Ventana, filtro por profesional y tope.
   * @param actor - Quien mira; tiene que pertenecer a esa organización.
   * @returns Sus citas, en orden cronológico y sin motivo de consulta.
   */
  async list(
    tenantId: string,
    query: TenantAgendaQueryDto,
    actor: AuthenticatedUser,
  ): Promise<TenantAgendaResponseDto> {
    const em = this.em.fork();

    // Leer la agenda es parte de trabajar en la organización, así que alcanza
    // con pertenecer: exigir administrarla dejaría fuera justamente a la
    // recepción, que es para quien esta pantalla existe.
    await this.tenants.assertCanRead(em, tenantId, actor);

    const from = new Date(query.from);
    const to = new Date(query.to);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      throw new PreconditionFailedException(
        'La ventana no es una fecha válida',
        {
          from: query.from,
          to: query.to,
        },
      );
    }
    if (from >= to) {
      throw new PreconditionFailedException(
        'La ventana debe empezar antes de terminar',
        { from: query.from, to: query.to },
      );
    }
    if (to.getTime() - from.getTime() > MAX_AGENDA_RANGE_DAYS * ONE_DAY_MS) {
      throw new PreconditionFailedException(
        `El rango no puede superar los ${MAX_AGENDA_RANGE_DAYS} días`,
        { from: query.from, to: query.to },
      );
    }

    // Los recursos de la organización, siempre acotados a ella. Sirven para dos
    // cosas: rotular la sede de cada cita, y traducir «este profesional» a
    // «sus recursos ACÁ» — que es lo que hace que pedir la agenda de un médico
    // de otra clínica devuelva vacío en vez de sus citas allá.
    const resources = await this.agendaRepo.findResources(em, { tenantId });
    const resourceById = new Map(
      resources.map((resource) => [resource.id, resource]),
    );

    const resourceIds = query.practitionerProfileId
      ? resources
          .filter(
            (resource) =>
              PRACTITIONER_PROFILE_TABLES.includes(resource.resourceRefType) &&
              resource.resourceRefId === query.practitionerProfileId,
          )
          .map((resource) => resource.id)
      : undefined;

    const limit = Math.min(
      query.limit ?? DEFAULT_PAGE_LIMIT,
      MAX_BOOKINGS_PER_PAGE,
    );

    const rows = await this.bookingsRepo.findTenantAgenda(
      em,
      { tenantId, from, to, resourceIds },
      limit,
    );

    const items = await this.project(em, rows, resourceById);

    return { items, truncated: items.length >= limit };
  }

  /**
   * Traduce las filas al contrato, con los nombres resueltos.
   *
   * Los nombres se buscan en lote y no de a uno: una agenda de una semana son
   * decenas de citas, y una consulta por cita convertiría una pantalla en una
   * tormenta de lecturas.
   */
  private async project(
    em: EntityManager,
    rows: readonly {
      booking: {
        id: string;
        resourceId?: string;
        patientProfileId: string;
        statusConceptId: string;
      };
      slot: { startAt: Date; endAt: Date } | null;
    }[],
    resourceById: ReadonlyMap<string, SchedulableResources>,
  ): Promise<TenantAgendaItemDto[]> {
    const patientIds = [
      ...new Set(rows.map((row) => row.booking.patientProfileId)),
    ];

    // El nombre del paciente sale de `persons` por el mismo camino que el del
    // profesional: `patient_profiles.profile_id` referencia a `persons(id)`.
    const nameByPerson = await this.tenants.findDisplayNames(em, patientIds);

    return rows.map((row) => {
      const resource = row.booking.resourceId
        ? (resourceById.get(row.booking.resourceId) ?? null)
        : null;
      const practitionerProfileId = this.practitionerProfileOf(
        row.booking.resourceId,
        resourceById,
      );

      return {
        bookingId: row.booking.id,
        startAt: row.slot!.startAt,
        endAt: row.slot!.endAt,
        resourceId: resource?.id ?? null,
        resourceName: resource?.name ?? null,
        practitionerProfileId,
        patientProfileId: row.booking.patientProfileId,
        patientName: nameByPerson.get(row.booking.patientProfileId) ?? null,
        statusConceptId: row.booking.statusConceptId,
      };
    });
  }

  /** El perfil profesional detrás de un recurso, si el recurso apunta a uno. */
  private practitionerProfileOf(
    resourceId: string | undefined,
    resourceById: ReadonlyMap<string, SchedulableResources>,
  ): string | null {
    if (!resourceId) return null;
    const resource = resourceById.get(resourceId);
    if (!resource) return null;
    return PRACTITIONER_PROFILE_TABLES.includes(resource.resourceRefType)
      ? resource.resourceRefId
      : null;
  }
}
