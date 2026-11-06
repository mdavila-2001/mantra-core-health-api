import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { createdBy } from '../../../common';
import type { OpeningHoursShiftDto } from '../../../common/dto/opening-hours.dto';
import { TenantOpeningHours } from '../entities';

/** The site a set of shifts belongs to: none is the headquarters. */
export interface OpeningHoursSite {
  readonly tenantId: string;
  readonly branchId?: string;
  readonly medicalFacilitySiteId?: string;
  readonly actorUserId?: string;
}

/**
 * Acceso a datos de `directory.tenant_opening_hours`. Stateless: la unidad de
 * trabajo se recibe siempre por parámetro.
 */
@Injectable()
export class TenantOpeningHoursRepository {
  /**
   * Crea los turnos de una sede en la unidad de trabajo (sin flush). El
   * ordinal sale del orden de apertura dentro de cada día. La sede ya tiene
   * que estar volcada: las FK son columnas `uuid` planas.
   */
  createShifts(
    em: EntityManager,
    site: OpeningHoursSite,
    shifts: readonly OpeningHoursShiftDto[] = [],
  ): TenantOpeningHours[] {
    const ordinals = new Map<number, number>();
    return [...shifts]
      .sort(
        (a, b) =>
          a.dayOfWeek - b.dayOfWeek || a.opensAt.localeCompare(b.opensAt),
      )
      .map((shift) => {
        const ordinal = (ordinals.get(shift.dayOfWeek) ?? 0) + 1;
        ordinals.set(shift.dayOfWeek, ordinal);
        return em.create(
          TenantOpeningHours,
          {
            tenantId: site.tenantId,
            branchId: site.branchId,
            medicalFacilitySiteId: site.medicalFacilitySiteId,
            dayOfWeek: shift.dayOfWeek,
            shiftOrdinal: ordinal,
            opensAt: shift.opensAt,
            closesAt: shift.closesAt,
            ...createdBy(site.actorUserId),
          },
          { partial: true },
        );
      });
  }
}
