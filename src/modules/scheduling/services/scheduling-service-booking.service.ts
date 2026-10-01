import { randomUUID } from 'node:crypto';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  getCurrentTenantId,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { PatientRepresentationService } from '../../profiles/services/patient-representation.service';
import type {
  PractitionerServiceOfferings,
  SchedulableResources,
} from '../entities';
import {
  SchedulingBookingsRepository,
  SchedulingCatalogRepository,
  SchedulingOfferingsRepository,
} from '../repositories';
import {
  cabeElServicio,
  proponerHorariosDeServicio,
  tramoOcupado,
  type DuracionDelServicio,
  type Intervalo,
} from '../service-availability';
import type {
  CreateServiceHoldDto,
  ServiceAvailabilityQueryDto,
  ServiceAvailabilityResponseDto,
  ServiceHoldResponseDto,
  ServiceStartDto,
} from '../dto/scheduling-service-offerings.dto';
import { SCHED } from '../scheduling.concepts';
import { PractitionerAffiliationGateService } from './practitioner-affiliation-gate.service';
import { SchedulingProfessionalTimeService } from './scheduling-professional-time.service';
import {
  SchedulingServiceAgendaService,
  type FranjasDeServicio,
} from './scheduling-service-agenda.service';
import { ROLES_DE_AGENDA } from './scheduling-bookings.service';

const MS_POR_MINUTO = 60_000;
const MS_POR_DIA = 24 * 60 * MS_POR_MINUTO;

/** Cuántos días se pueden mirar de una vez: una pantalla de calendario, no el año. */
const MAX_DIAS_DE_CONSULTA = 62;

/** Cuánto dura la retención de un turno si ninguna política dice otra cosa. */
const TTL_DE_RETENCION_SEGUNDOS = 300;

const TABLAS_DE_PERFIL_PROFESIONAL: readonly string[] = [
  'practitioner_profiles',
  'health_practitioner_profiles',
];

/**
 * Leer horarios de un servicio y retener el turno elegido.
 *
 * ## El cupo nace al retener
 *
 * Las consultas salen de una grilla ya generada; un servicio no, porque dura entre
 * `min` y `max` minutos según el profesional y cada reserva distinta dejaría la
 * grilla mintiendo. Acá se **calcula** qué cabe ({@link availability}) y recién al
 * retener ({@link placeHold}) nace un cupo puntual —de capacidad 1, ya tomado— con
 * la duración máxima. Desde ahí es una reserva más: la confirma el mismo
 * `POST /scheduling/holds/:token/confirm` que ya usan las consultas.
 *
 * ## Por qué la comprobación definitiva es la de retener
 *
 * El cliente leyó los horarios hace minutos. Lo único que cuenta es lo que el
 * servidor comprueba **bajo el candado del profesional**, el mismo que toma la regla
 * madre: dos pedidos concurrentes se serializan y el segundo ve al primero.
 */
@Injectable()
export class SchedulingServiceBookingService {
  constructor(
    private readonly em: EntityManager,
    private readonly offeringsRepo: SchedulingOfferingsRepository,
    private readonly catalogRepo: SchedulingCatalogRepository,
    private readonly bookingsRepo: SchedulingBookingsRepository,
    private readonly agenda: SchedulingServiceAgendaService,
    private readonly tiempoProfesional: SchedulingProfessionalTimeService,
    private readonly vinculos: PractitionerAffiliationGateService,
    private readonly representation: PatientRepresentationService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SchedulingServiceBookingService.name);
  }

  /**
   * Los horarios donde cabe el servicio, en las sedes del profesional.
   *
   * No reserva nada: es una lectura. Un horario que se ofrece acá puede dejar de
   * estar libre un segundo después, y por eso {@link placeHold} lo vuelve a decidir.
   */
  async availability(
    query: ServiceAvailabilityQueryDto,
    actor: AuthenticatedUser,
  ): Promise<ServiceAvailabilityResponseDto> {
    const ahora = new Date();
    const desde = new Date(
      Math.max(new Date(query.from).getTime(), ahora.getTime()),
    );
    const hasta = new Date(query.to);
    if (!(hasta.getTime() > desde.getTime())) {
      throw new PreconditionFailedException(
        'La ventana debe empezar antes de terminar.',
        { from: query.from, to: query.to },
      );
    }
    if (hasta.getTime() - desde.getTime() > MAX_DIAS_DE_CONSULTA * MS_POR_DIA) {
      throw new PreconditionFailedException(
        `Se pueden mirar hasta ${MAX_DIAS_DE_CONSULTA} días de una vez.`,
        { from: query.from, to: query.to },
      );
    }

    return this.em.transactional(async (tx) => {
      const oferta = await this.ofertaVisible(tx, query.offeringId, actor);
      const sedes = (
        await this.offeringsRepo.findResourcesOfProfessional(
          tx,
          oferta.practitionerProfileId,
        )
      ).filter(
        (sede) =>
          (query.resourceId === undefined || sede.id === query.resourceId) &&
          this.sedeEnAlcance(sede, actor),
      );

      const grupos = await this.agenda.franjasDeServicios(
        tx,
        oferta.practitionerProfileId,
        sedes.map((sede) => ({
          id: sede.id,
          name: sede.name,
          timeZone: sede.timeZone ?? undefined,
        })),
        desde,
        hasta,
      );
      const ocupado = await this.agenda.ocupadoDelProfesional(
        tx,
        oferta.practitionerProfileId,
        desde,
        hasta,
        ahora,
      );

      const servicio = duracionDe(oferta);
      const items = new Map<string, ServiceStartDto>();
      for (const grupo of grupos) {
        const horarios = proponerHorariosDeServicio({
          franjas: grupo.franjas,
          ocupado,
          servicio,
          noAntesDe: new Date(
            ahora.getTime() + grupo.minNoticeMinutes * MS_POR_MINUTO,
          ),
          noDespuesDe:
            grupo.maxAdvanceDays === undefined
              ? hasta
              : new Date(
                  Math.min(
                    hasta.getTime(),
                    ahora.getTime() + grupo.maxAdvanceDays * MS_POR_DIA,
                  ),
                ),
        });
        for (const horario of horarios) {
          const clave = `${grupo.resourceId}|${horario.startAt.getTime()}`;
          if (items.has(clave)) continue;
          items.set(clave, {
            resourceId: grupo.resourceId,
            startAt: horario.startAt.toISOString(),
            endAtMax: horario.endAtMax.toISOString(),
            endAtMin: horario.endAtMin.toISOString(),
          });
        }
      }

      return {
        offeringId: oferta.id,
        minDurationMinutes: oferta.minDurationMinutes,
        maxDurationMinutes: oferta.maxDurationMinutes,
        items: [...items.values()].sort((a, b) =>
          a.startAt.localeCompare(b.startAt),
        ),
      };
    });
  }

  /**
   * Retiene el turno de un servicio: crea su cupo puntual y la retención.
   *
   * @throws ConflictException si el horario ya no cabe (otro lo tomó, o cambió la agenda).
   */
  async placeHold(
    offeringId: string,
    dto: CreateServiceHoldDto,
    actor: AuthenticatedUser,
  ): Promise<ServiceHoldResponseDto> {
    if (dto.patientProfileId !== undefined && this.esUnPaciente(actor)) {
      await this.representation.assertMayActForPatient(
        dto.patientProfileId,
        actor,
      );
    }
    const startAt = new Date(dto.startAt);

    this.logger.info(
      {
        operation: 'scheduling.service-hold.place',
        offeringId,
        resourceId: dto.resourceId,
      },
      'Placing hold on a service slot',
    );

    return this.em.transactional(async (tx) => {
      const oferta = await this.ofertaVisible(tx, offeringId, actor);
      const sede = await this.catalogRepo.findResourceById(tx, dto.resourceId);
      if (sede === null || !this.esSedeDelProfesional(sede, oferta)) {
        throw new ResourceNotFoundException('Agenda no encontrada', {
          resourceId: dto.resourceId,
        });
      }
      this.assertSedeEnAlcance(sede, actor);

      // El MISMO candado que toma la regla madre: serializa este pedido con cualquier
      // otra decisión sobre el calendario del profesional, en cualquiera de sus sedes.
      await this.tiempoProfesional.bloquearAgendaDeProfesional(
        tx,
        oferta.practitionerProfileId,
      );

      const servicio = duracionDe(oferta);
      const endAt = new Date(
        startAt.getTime() + oferta.maxDurationMinutes * MS_POR_MINUTO,
      );
      const ahora = new Date();
      if (startAt.getTime() <= ahora.getTime()) {
        throw new PreconditionFailedException('Ese horario ya pasó.', {
          startAt: startAt.toISOString(),
        });
      }
      await this.assertVinculoVigente(sede.tenantId, actor);

      const alrededor = {
        desde: new Date(startAt.getTime() - MS_POR_DIA),
        hasta: new Date(endAt.getTime() + MS_POR_DIA),
      };
      const grupos = (
        await this.agenda.franjasDeServicios(
          tx,
          oferta.practitionerProfileId,
          [
            {
              id: sede.id,
              name: sede.name,
              timeZone: sede.timeZone ?? undefined,
            },
          ],
          alrededor.desde,
          alrededor.hasta,
        )
      ).filter((grupo) => grupo.resourceId === sede.id);

      const ocupado = await this.agenda.ocupadoDelProfesional(
        tx,
        oferta.practitionerProfileId,
        startAt,
        endAt,
        ahora,
      );
      const franjas: Intervalo[] = grupos.flatMap((grupo) => [
        ...grupo.franjas,
      ]);
      if (!cabeElServicio(franjas, ocupado, servicio, startAt)) {
        throw new ConflictException(
          'Ese horario ya no está disponible para este servicio. Elegí otro.',
          { offeringId, startAt: startAt.toISOString() },
        );
      }
      this.assertPolitica(grupos, startAt, endAt, ahora);

      const catalogo = await this.offeringsRepo.findCatalogItem(
        tx,
        oferta.serviceCatalogId,
      );
      const tramo = tramoOcupado(startAt, endAt, servicio);
      const retractedSlots = await this.agenda.retraer(
        tx,
        sede.resourceRefId,
        tramo.startAt,
        tramo.endAt,
        actor.id,
      );

      const cupo = this.catalogRepo.createSlot(tx, {
        resourceId: sede.id,
        serviceConceptId: catalogo?.serviceConceptId ?? undefined,
        practitionerServiceOfferingId: oferta.id,
        startAt,
        endAt,
        capacity: 1,
        remainingCapacity: 0,
        statusConceptId: CONCEPTS.SLOT_HELD,
        actorUserId: actor.id,
      });
      await tx.flush();

      const holdToken = randomUUID();
      const hold = this.bookingsRepo.createHold(tx, {
        bookableSlotId: cupo.id,
        patientProfileId: dto.patientProfileId,
        heldByUserId: actor.id,
        holdToken,
        statusConceptId: CONCEPTS.HOLD_ACTIVE,
        expiresAt: new Date(ahora.getTime() + TTL_DE_RETENCION_SEGUNDOS * 1000),
        actorUserId: actor.id,
      });
      touch(cupo, actor.id);
      await tx.flush();

      return {
        id: hold.id,
        holdToken,
        expiresAt: hold.expiresAt.toISOString(),
        bookableSlotId: cupo.id,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        retractedSlots,
      };
    });
  }

  /** La política de la plantilla que ofrece ese rato: aviso mínimo y anticipación máxima. */
  private assertPolitica(
    grupos: readonly FranjasDeServicio[],
    startAt: Date,
    endAt: Date,
    ahora: Date,
  ): void {
    const grupo = grupos.find((g) =>
      g.franjas.some(
        (franja) =>
          franja.startAt.getTime() <= startAt.getTime() &&
          franja.endAt.getTime() >= endAt.getTime(),
      ),
    );
    if (grupo === undefined) return;
    if (
      startAt.getTime() <
      ahora.getTime() + grupo.minNoticeMinutes * MS_POR_MINUTO
    ) {
      throw new PreconditionFailedException(
        `Ese turno empieza demasiado pronto: hay que pedirlo con al menos ${grupo.minNoticeMinutes} minutos de anticipación.`,
        { minNoticeMinutes: grupo.minNoticeMinutes },
      );
    }
    if (
      grupo.maxAdvanceDays !== undefined &&
      startAt.getTime() > ahora.getTime() + grupo.maxAdvanceDays * MS_POR_DIA
    ) {
      throw new PreconditionFailedException(
        `Sólo se puede pedir con hasta ${grupo.maxAdvanceDays} días de anticipación.`,
        { maxAdvanceDays: grupo.maxAdvanceDays },
      );
    }
  }

  /**
   * La oferta, si el actor puede verla.
   *
   * Un paciente sólo ve lo activo y reservable. Lo demás responde 404, igual que una
   * oferta inexistente: no se confirma que exista algo que no se puede pedir.
   */
  private async ofertaVisible(
    tx: EntityManager,
    offeringId: string,
    actor: AuthenticatedUser,
  ): Promise<PractitionerServiceOfferings> {
    const oferta = await this.offeringsRepo.findOfferingById(tx, offeringId);
    const noExiste = new ResourceNotFoundException('Servicio no encontrado', {
      offeringId,
    });
    if (oferta === null) throw noExiste;

    const esDelDueno =
      actor.practitionerProfileId === oferta.practitionerProfileId;
    const operaAgendas = actor.roles.some((rol) =>
      ROLES_DE_AGENDA.includes(rol),
    );
    if (esDelDueno || operaAgendas) return oferta;

    if (
      oferta.statusConceptId !== SCHED.OFFERING_ACTIVE ||
      !oferta.isPatientBookable
    ) {
      throw noExiste;
    }
    const catalogo = await this.offeringsRepo.findCatalogItem(
      tx,
      oferta.serviceCatalogId,
    );
    if (catalogo === null || !catalogo.isActive) throw noExiste;
    return oferta;
  }

  private esSedeDelProfesional(
    sede: SchedulableResources,
    oferta: PractitionerServiceOfferings,
  ): boolean {
    return (
      sede.resourceRefId === oferta.practitionerProfileId &&
      TABLAS_DE_PERFIL_PROFESIONAL.includes(sede.resourceRefType)
    );
  }

  /** Mismo criterio que `assertRecursoEnTenantActivo` de las reservas, sin lanzar. */
  private sedeEnAlcance(
    sede: SchedulableResources,
    actor: AuthenticatedUser,
  ): boolean {
    if (actor.roles.includes('SUPERADMIN')) return true;
    const activo = getCurrentTenantId();
    return activo
      ? activo === sede.tenantId
      : actor.tenantIds?.includes(sede.tenantId) === true;
  }

  private assertSedeEnAlcance(
    sede: SchedulableResources,
    actor: AuthenticatedUser,
  ): void {
    if (!this.sedeEnAlcance(sede, actor)) {
      throw new ForbiddenException(
        'La agenda indicada pertenece a otra organización.',
      );
    }
  }

  /** ¿Es una cuenta de paciente sin más oficio? Mismo criterio que las reservas. */
  private esUnPaciente(actor: AuthenticatedUser): boolean {
    if (actor.roles.some((rol) => ROLES_DE_AGENDA.includes(rol))) return false;
    return actor.practitionerProfileId === undefined;
  }

  /** Quien atiende no puede comprometer turnos de una organización que lo desvinculó. */
  private async assertVinculoVigente(
    tenantId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    if (actor.roles.some((rol) => ROLES_DE_AGENDA.includes(rol))) return;
    if (actor.practitionerProfileId === undefined) return;
    const veredicto = await this.vinculos.evaluar(tenantId, actor);
    if (veredicto === 'sin-vinculos' || veredicto === 'aprobado') return;
    throw new PreconditionFailedException(
      veredicto === 'pendiente'
        ? 'Tu vínculo con esta organización todavía está pendiente de aprobación.'
        : 'Tu vínculo con esta organización ya no está vigente.',
      { tenantId, vinculo: veredicto },
    );
  }
}

function duracionDe(oferta: PractitionerServiceOfferings): DuracionDelServicio {
  return {
    minDurationMinutes: oferta.minDurationMinutes,
    maxDurationMinutes: oferta.maxDurationMinutes,
    prepMinutes: oferta.prepMinutes ?? 0,
    cleanupMinutes: oferta.cleanupMinutes ?? 0,
  };
}
