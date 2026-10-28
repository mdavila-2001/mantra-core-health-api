import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { AppointmentBookings } from '../../scheduling/entities/appointment_bookings.entity';
import { BookableSlots } from '../../scheduling/entities/bookable_slots.entity';
import { PractitionerServiceOfferings } from '../../scheduling/entities/practitioner_service_offerings.entity';
import { SchedulableResources } from '../../scheduling/entities/schedulable_resources.entity';
import { PRACTITIONER_PROFILE_TABLES } from '../../scheduling/domain/resource/practitioner-profile-tables';
import { ServiceCatalog } from '../../billing/entities/service_catalog.entity';
import { Practices } from '../../practice/entities/practices.entity';

/**
 * Lecturas de las cosas que una encuesta puede evaluar: la reserva, el servicio
 * del catálogo y el profesional que atendió.
 *
 * Son entidades de `scheduling`, `billing` y `practice`, leídas por
 * `EntityManager` igual que el resto de este módulo lee la reserva; vive en un
 * repositorio propio para que el servicio de asignaciones no conozca tres
 * esquemas y para poder sustituirlo en las pruebas.
 */
@Injectable()
export class TargetsRepository {
  /**
   * Una reserva por id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de la reserva.
   * @returns La reserva, o `null`.
   */
  findBooking(
    em: EntityManager,
    id: string,
  ): Promise<AppointmentBookings | null> {
    return em.findOne(AppointmentBookings, { id });
  }

  /**
   * La oferta de servicio que se reservó.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de la oferta.
   * @returns La oferta, o `null`.
   */
  findOffering(
    em: EntityManager,
    id: string,
  ): Promise<PractitionerServiceOfferings | null> {
    return em.findOne(PractitionerServiceOfferings, { id });
  }

  /**
   * La oferta que un profesional hace de un servicio del catálogo.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practitionerProfileId - Profesional.
   * @param serviceCatalogId - Servicio del catálogo.
   * @returns La oferta, o `null` si ese profesional no ofrece ese servicio.
   */
  findOfferingOf(
    em: EntityManager,
    practitionerProfileId: string,
    serviceCatalogId: string,
  ): Promise<PractitionerServiceOfferings | null> {
    return em.findOne(PractitionerServiceOfferings, {
      practitionerProfileId,
      serviceCatalogId,
    });
  }

  /**
   * Un servicio del catálogo maestro.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - `billing.service_catalog.id`.
   * @returns El servicio, o `null`.
   */
  findServiceCatalog(
    em: EntityManager,
    id: string,
  ): Promise<ServiceCatalog | null> {
    return em.findOne(ServiceCatalog, { id });
  }

  /**
   * La organización (tenant) a la que pertenece una práctica.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practiceId - Identificador de la práctica.
   * @returns El tenant, o `null` si la práctica no existe.
   */
  async findTenantOfPractice(
    em: EntityManager,
    practiceId: string,
  ): Promise<string | null> {
    const practice = await em.findOne(Practices, { id: practiceId });
    return practice?.tenantId ?? null;
  }

  /**
   * El profesional que atendió una reserva.
   *
   * Si la reserva es de un servicio, es el dueño de la oferta. Si no, es el
   * profesional al que pertenece el recurso reservado (el de la reserva o, si
   * ésta no lo lleva, el del cupo). Una sala o un equipo no son un profesional:
   * devuelve `null`.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param booking - La reserva.
   * @returns El perfil profesional, o `null` si no se puede determinar.
   */
  async findPractitionerOfBooking(
    em: EntityManager,
    booking: AppointmentBookings,
  ): Promise<string | null> {
    if (booking.practitionerServiceOfferingId) {
      const offering = await this.findOffering(
        em,
        booking.practitionerServiceOfferingId,
      );
      if (offering) return offering.practitionerProfileId;
    }
    let resourceId = booking.resourceId;
    if (!resourceId) {
      const slot = await em.findOne(BookableSlots, {
        id: booking.bookableSlotId,
      });
      resourceId = slot?.resourceId;
    }
    if (!resourceId) return null;
    const resource = await em.findOne(SchedulableResources, {
      id: resourceId,
    });
    if (
      !resource ||
      !PRACTITIONER_PROFILE_TABLES.includes(resource.resourceRefType)
    )
      return null;
    return resource.resourceRefId;
  }
}
