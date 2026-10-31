import { Inject, Injectable, Optional } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ResourceNotFoundException } from '../../../common';
import {
  ATOM_CATEGORIES,
  PERMISSION_ATOMS,
  atomsOfGrant,
  describeCondition,
  isGrantLive,
  isWithinWindows,
  locationRelation,
  targetCells,
  type LocationDim,
  type SupportCondition,
  type TargetCell,
} from '../domain';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import {
  SupportAccessRepository,
  SupportActivityRepository,
} from '../repositories';
import type { GovernanceWorld, WorldGrant } from './governance-world';
import {
  SUPPORT_TENANT_ZONE_PORT,
  type TenantZonePort,
} from './support-access-context.ports';

type CellStatus = 'FULL' | 'CONDITIONAL' | 'PARTIAL' | 'NONE';
type Row = Record<string, unknown>;

/** Frases de las condiciones de una concesión (de la suya y las de sus átomos), sin repetir. */
function conditionsOf(g: WorldGrant): string[] {
  const out = new Set<string>();
  if (g.condition) {
    const text = describeCondition(g.condition);
    if (text) out.add(text);
  }
  for (const a of g.atomGrants ?? []) {
    const c = (a as { condition?: SupportCondition }).condition;
    const text = c ? describeCondition(c, a.atom) : '';
    if (text) out.add(text);
  }
  return [...out];
}

function hasCondition(g: WorldGrant): boolean {
  return (
    !!g.condition ||
    (g.atomGrants ?? []).some(
      (a) => !!(a as { condition?: SupportCondition }).condition,
    )
  );
}

/**
 * Matrices de acceso (CONTRATO-GOBIERNO §6.6): «quién tiene qué» (por persona,
 * con celdas `FULL`, `CONDITIONAL`, `PARTIAL` o `NONE` por categoría o átomo) y
 * «quién puede actuar sobre…» un doctor, servicio o espacio, con
 * `effective: false` cuando la persona tiene el permiso pero hoy está bloqueada
 * (el doctor no la aceptó o el horario lo impide). Es el superconjunto de
 * `GET /org/access-lookup`, que no cambia. Solo identificadores y códigos.
 */
@Injectable()
export class GovernanceMatrixService {
  /**
   * @param structure - Doctores y espacios de la organización.
   * @param activity - Nombres de las personas.
   * @param zone - Zona horaria de la organización.
   */
  constructor(
    private readonly structure: SupportAccessRepository,
    private readonly activity: SupportActivityRepository,
    @Optional()
    @Inject(SUPPORT_TENANT_ZONE_PORT)
    private readonly zone: TenantZonePort | undefined,
  ) {}

  async personMatrix(
    tx: EntityManager,
    world: GovernanceWorld,
    group: 'category' | 'atom',
  ): Promise<Row> {
    const groups: Array<{ code: string; atoms: string[] }> =
      group === 'atom'
        ? PERMISSION_ATOMS.map((a) => ({ code: a.code, atoms: [a.code] }))
        : ATOM_CATEGORIES.map((c) => ({
            code: c.code,
            atoms: PERMISSION_ATOMS.filter(
              (a) => a.categoryCode === c.code,
            ).map((a) => a.code),
          }));
    const names = await this.activity.userNames(
      tx,
      world.engagements.map((e) => e.subjectUserId),
    );
    const rows = world.engagements
      .filter((e) => e.state !== 'ENDED')
      .map((e) => {
        const grants = e.grants.filter(
          (g) => g.effect !== 'DENY' && isGrantLive(g, world.now),
        );
        const cells: Record<string, Row> = {};
        for (const grp of groups) {
          const holding = grants.filter((g) =>
            atomsOfGrant(g).some((a) => grp.atoms.includes(a)),
          );
          const held = new Set<string>(holding.flatMap((g) => atomsOfGrant(g)));
          const count = grp.atoms.filter((a) => held.has(a)).length;
          const status: CellStatus =
            count === 0
              ? 'NONE'
              : holding.some(hasCondition)
                ? 'CONDITIONAL'
                : count === grp.atoms.length
                  ? 'FULL'
                  : 'PARTIAL';
          cells[grp.code] = {
            status,
            grantIds: holding.map((g) => g.grantId),
            conditions: [...new Set(holding.flatMap(conditionsOf))],
          };
        }
        return {
          userId: e.subjectUserId,
          ...(names.get(e.subjectUserId)
            ? { name: names.get(e.subjectUserId) }
            : {}),
          engagementId: e.engagementId,
          templateCode: e.templateCode,
          state: e.state,
          cells,
        };
      });
    return {
      generatedAt: world.now.toISOString(),
      by: 'person',
      group,
      columns: groups.map((g) => g.code),
      rows,
    };
  }

  /** «Quién puede actuar sobre este doctor, servicio o espacio»: superconjunto de `access-lookup`. */
  async targetMatrix(
    tx: EntityManager,
    tenantId: string,
    world: GovernanceWorld,
    by: 'doctor' | 'service' | 'location',
    id: string,
  ): Promise<Row> {
    const target = await this.resolveTarget(tx, tenantId, by, id);
    const org = (await this.zone?.timeZoneOf(tx, tenantId)) ?? 'America/La_Paz';
    const names = await this.activity.userNames(
      tx,
      world.engagements.map((e) => e.subjectUserId),
    );
    const rows: Row[] = [];
    for (const e of world.engagements) {
      if (e.state === 'ENDED') continue;
      const covering = e.grants.filter(
        (g) =>
          g.effect !== 'DENY' &&
          isGrantLive(g, world.now) &&
          targetCells(g).some((c) => covers(c, by, target)),
      );
      if (covering.length === 0) continue;
      const verdicts = covering.map((g) => blockedReason(g, world.now, org));
      const anyFree = verdicts.some((v) => v === undefined);
      const accepted =
        by !== 'doctor' ||
        e.acceptedPractitionerProfileIds.includes(target.profileId ?? id);
      const reason = !accepted
        ? 'DOCTOR_NOT_ACCEPTED'
        : anyFree
          ? undefined
          : verdicts[0];
      rows.push({
        userId: e.subjectUserId,
        ...(names.get(e.subjectUserId)
          ? { name: names.get(e.subjectUserId) }
          : {}),
        engagementId: e.engagementId,
        templateCode: e.templateCode,
        state: e.state,
        effective: reason === undefined,
        ...(reason ? { reason } : {}),
        atoms: [...new Set(covering.flatMap((g) => atomsOfGrant(g)))].sort(),
        grantIds: covering.map((g) => g.grantId),
        conditions: [...new Set(covering.flatMap(conditionsOf))],
      });
    }
    return { generatedAt: world.now.toISOString(), by, id, rows };
  }

  private async resolveTarget(
    tx: EntityManager,
    tenantId: string,
    by: 'doctor' | 'service' | 'location',
    id: string,
  ): Promise<{ ids: string[]; profileId?: string; location?: LocationDim }> {
    if (by === 'service') return { ids: [id] };
    if (by === 'doctor') {
      const role = (await this.structure.findRoleAssignments(tx, [id])).get(id);
      if (role && role.tenantId !== tenantId) throw this.targetNotFound();
      return {
        ids: role ? [id, role.practitionerProfileId] : [id],
        profileId: role?.practitionerProfileId ?? id,
      };
    }
    const space = (await this.structure.findCareSpaces(tx, [id])).get(id);
    if (!space || space.tenantId !== tenantId) throw this.targetNotFound();
    return {
      ids: [id],
      location: {
        ids: [id],
        path: space.locationPath,
        siteId: space.practiceSiteId,
      },
    };
  }

  private targetNotFound(): ResourceNotFoundException {
    return new ResourceNotFoundException(
      'Destino no encontrado',
      undefined,
      Reason.SUPPORT_TARGET_NOT_FOUND,
    );
  }
}

/** ¿La celda de cobertura alcanza al doctor, servicio o espacio consultado? */
function covers(
  cell: TargetCell,
  by: 'doctor' | 'service' | 'location',
  target: { ids: string[]; location?: LocationDim },
): boolean {
  if (by === 'doctor')
    return (
      !cell.practitioner ||
      cell.practitioner.ids.some((i) => target.ids.includes(i))
    );
  if (by === 'service')
    return (
      !cell.service || cell.service.ids.some((i) => target.ids.includes(i))
    );
  if (!cell.location) return true;
  if (!target.location) return false;
  const rel = locationRelation(cell.location, target.location);
  return rel === 'EQUAL' || rel === 'A_CONTAINS_B';
}

/** Por qué hoy no puede actuar con esta concesión (`TIME_WINDOW`), o `undefined` si puede. */
function blockedReason(
  g: WorldGrant,
  now: Date,
  orgZone: string,
): string | undefined {
  const time = g.condition?.time;
  if (!time || time.windows.length === 0) return undefined;
  return isWithinWindows(time.windows, now, time.timeZone ?? orgZone)
    ? undefined
    : 'TIME_WINDOW';
}

/** Aplana una matriz por persona (una fila por persona y columna) para exportar. */
export function flattenMatrix(m: Row): Row[] {
  const rows = (m.rows as Row[]) ?? [];
  if (m.by !== 'person') return rows;
  return rows.flatMap((r) =>
    Object.entries(r.cells as Record<string, Row>).map(([column, cell]) => ({
      userId: r.userId,
      templateCode: r.templateCode,
      column,
      status: cell.status,
      grantIds: cell.grantIds,
    })),
  );
}
