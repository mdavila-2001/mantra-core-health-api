import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import type { OpeningHoursShiftDto } from '../../../common/dto/opening-hours.dto';
import { BRANCH_TYPE_CONCEPT_BY_CODE, DIR } from '../directory.concepts';
import { BranchesRepository } from '../repositories/branches.repository';
import { branchCodeFromName, type BranchCategory } from '../branch-categories';
import {
  TenantOpeningHoursRepository,
  type OpeningHoursSite,
} from '../repositories/tenant-opening-hours.repository';

export type { OpeningHoursSite };

/** A branch declared at sign-up, already normalized by its caller. */
export interface DeclaredBranch {
  readonly name: string;
  readonly latitude?: number;
  readonly longitude?: number;
  readonly description?: string;
  readonly locationUrl?: string;
  readonly openingHours?: readonly OpeningHoursShiftDto[];
  /** v4.2.91: head office, branch or (unsaid) default. */
  readonly category?: BranchCategory;
  /** `OFFICE` unless said; the medical organization's sites are `CLINIC`. */
  readonly branchType?: 'CLINIC' | 'OFFICE';
}

/** One sign-up's branches: same tenant, time zone and author. */
export interface DeclaredBranchesInput {
  readonly tenantId: string;
  readonly timeZone?: string;
  readonly actorUserId: string;
  readonly branches: readonly DeclaredBranch[];
}

/**
 * Las sucursales declaradas en el alta (farmacia P50, laboratorio P51) en
 * `directory.branches`, con su horario de atención, y el horario de las sedes
 * que no son filas de esa tabla (casa central, sede de establecimiento médico).
 */
@Injectable()
export class DeclaredBranchesService {
  constructor(
    private readonly branchesRepo: BranchesRepository,
    private readonly openingHoursRepo: TenantOpeningHoursRepository,
  ) {}

  /**
   * Crea cada sucursal y después sus turnos. El código sale del nombre, en
   * mayúsculas y sin repetirse dentro del alta (el tenant es nuevo). Sólo
   * vuelca si hay turnos: la FK `branch_id` es una columna `uuid` plana.
   */
  async register(
    tx: EntityManager,
    input: DeclaredBranchesInput,
  ): Promise<void> {
    const used = new Set<string>();
    const codeOf = (name: string): string => branchCodeFromName(name, used);
    const created = input.branches.map((item) => ({
      hours: item.openingHours ?? [],
      row: this.branchesRepo.create(tx, {
        tenantId: input.tenantId,
        code: codeOf(item.name),
        name: item.name,
        branchTypeConceptId:
          BRANCH_TYPE_CONCEPT_BY_CODE[item.branchType ?? 'OFFICE'],
        statusConceptId: DIR.BRANCH_ACTIVE,
        timeZone: input.timeZone,
        latitude:
          item.latitude !== undefined ? String(item.latitude) : undefined,
        longitude:
          item.longitude !== undefined ? String(item.longitude) : undefined,
        description: item.description,
        locationUrl: item.locationUrl,
        branchCategory: item.category,
        actorUserId: input.actorUserId,
      }),
    }));
    if (created.every(({ hours }) => hours.length === 0)) return;
    await tx.flush();
    for (const { row, hours } of created) {
      this.openingHoursRepo.createShifts(
        tx,
        {
          tenantId: input.tenantId,
          branchId: row.id,
          actorUserId: input.actorUserId,
        },
        hours,
      );
    }
  }

  /** Los turnos de una sede ya volcada, o de la casa central. */
  recordShifts(
    tx: EntityManager,
    site: OpeningHoursSite,
    shifts?: readonly OpeningHoursShiftDto[],
  ): void {
    this.openingHoursRepo.createShifts(tx, site, shifts);
  }
}
