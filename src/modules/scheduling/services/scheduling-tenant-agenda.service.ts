import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  type AuthenticatedUser,
} from '../../../common';
import { TenantAdministrationService } from '../../directory/services';
// Se importa la ENTIDAD de `profiles` y no su módulo —el mismo criterio que ya
// usa la agenda del profesional para resolver nombres—: traer el módulo entero
// para leer una columna abriría una dependencia que hoy no existe.
import { Persons } from '../../profiles/entities';
import { SchedulingBookingsRepository } from '../repositories';
import { SchedulingAgendaRepository } from '../repositories';
import { SchedulableResources } from '../entities';
import {
  MAX_CITAS_POR_PAGINA,
  MAX_RANGO_AGENDA_DIAS,
  type TenantAgendaQueryDto,
  type TenantAgendaItemDto,
  type TenantAgendaResponseDto,
} from '../dto';

/** Milisegundos de un día. */
const UN_DIA_MS = 24 * 60 * 60 * 1000;

/** Tope por omisión cuando el cliente no pide uno. */
const LIMITE_POR_OMISION = 200;

/** Las dos formas de `resourceRefType` que apuntan a un perfil profesional. */
const TABLAS_DE_PERFIL_PROFESIONAL: readonly string[] = [
  'practitioner_profiles',
  'health_practitioner_profiles',
];

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
   * @param tenantAdmin - Quién administra cada organización.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly bookingsRepo: SchedulingBookingsRepository,
    private readonly agendaRepo: SchedulingAgendaRepository,
    private readonly tenantAdmin: TenantAdministrationService,
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
  async listar(
    tenantId: string,
    query: TenantAgendaQueryDto,
    actor: AuthenticatedUser,
  ): Promise<TenantAgendaResponseDto> {
    const em = this.em.fork();

    // Leer la agenda es parte de trabajar en la organización, así que alcanza
    // con pertenecer: exigir administrarla dejaría fuera justamente a la
    // recepción, que es para quien esta pantalla existe.
    await this.tenantAdmin.assertCanRead(em, tenantId, actor);

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
    if (to.getTime() - from.getTime() > MAX_RANGO_AGENDA_DIAS * UN_DIA_MS) {
      throw new PreconditionFailedException(
        `El rango no puede superar los ${MAX_RANGO_AGENDA_DIAS} días`,
        { from: query.from, to: query.to },
      );
    }

    // Los recursos de la organización, siempre acotados a ella. Sirven para dos
    // cosas: rotular la sede de cada cita, y traducir «este profesional» a
    // «sus recursos ACÁ» — que es lo que hace que pedir la agenda de un médico
    // de otra clínica devuelva vacío en vez de sus citas allá.
    const recursos = await this.agendaRepo.findResources(em, { tenantId });
    const recursoPorId = new Map(
      recursos.map((recurso) => [recurso.id, recurso]),
    );

    const resourceIds = query.practitionerProfileId
      ? recursos
          .filter(
            (recurso) =>
              TABLAS_DE_PERFIL_PROFESIONAL.includes(recurso.resourceRefType) &&
              recurso.resourceRefId === query.practitionerProfileId,
          )
          .map((recurso) => recurso.id)
      : undefined;

    const limit = Math.min(
      query.limit ?? LIMITE_POR_OMISION,
      MAX_CITAS_POR_PAGINA,
    );

    const filas = await this.bookingsRepo.findTenantAgenda(
      em,
      { tenantId, from, to, resourceIds },
      limit,
    );

    const items = await this.proyectar(em, filas, recursoPorId);

    return { items, truncated: items.length >= limit };
  }

  /**
   * Traduce las filas al contrato, con los nombres resueltos.
   *
   * Los nombres se buscan en lote y no de a uno: una agenda de una semana son
   * decenas de citas, y una consulta por cita convertiría una pantalla en una
   * tormenta de lecturas.
   */
  private async proyectar(
    em: EntityManager,
    filas: readonly {
      booking: {
        id: string;
        resourceId?: string;
        patientProfileId: string;
        statusConceptId: string;
      };
      slot: { startAt: Date; endAt: Date } | null;
    }[],
    recursoPorId: ReadonlyMap<string, SchedulableResources>,
  ): Promise<TenantAgendaItemDto[]> {
    const pacienteIds = [
      ...new Set(filas.map((fila) => fila.booking.patientProfileId)),
    ];

    const personas =
      pacienteIds.length > 0
        ? await em.find(Persons, { id: { $in: pacienteIds } })
        : [];
    // El nombre del paciente sale de `persons` por el mismo camino que el del
    // profesional: `patient_profiles.profile_id` referencia a `persons(id)`.
    const nombrePorPersona = new Map(
      personas
        .filter((persona) => (persona.displayName ?? '') !== '')
        .map((persona) => [persona.id, persona.displayName as string]),
    );

    return filas.map((fila) => {
      const recurso = fila.booking.resourceId
        ? (recursoPorId.get(fila.booking.resourceId) ?? null)
        : null;
      const practitionerProfileId = this.perfilProfesionalDe(
        fila.booking.resourceId,
        recursoPorId,
      );

      return {
        bookingId: fila.booking.id,
        startAt: fila.slot!.startAt,
        endAt: fila.slot!.endAt,
        resourceId: recurso?.id ?? null,
        resourceName: recurso?.name ?? null,
        practitionerProfileId,
        patientProfileId: fila.booking.patientProfileId,
        patientName:
          nombrePorPersona.get(fila.booking.patientProfileId) ?? null,
        statusConceptId: fila.booking.statusConceptId,
      };
    });
  }

  /** El perfil profesional detrás de un recurso, si el recurso apunta a uno. */
  private perfilProfesionalDe(
    resourceId: string | undefined,
    recursoPorId: ReadonlyMap<string, SchedulableResources>,
  ): string | null {
    if (!resourceId) return null;
    const recurso = recursoPorId.get(resourceId);
    if (!recurso) return null;
    return TABLAS_DE_PERFIL_PROFESIONAL.includes(recurso.resourceRefType)
      ? recurso.resourceRefId
      : null;
  }
}
