import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  ConflictException,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import { CONCEPTS } from '../../../common/constants/concepts';
import { OutboxService } from '../../messaging/services/outbox.service';
import { InfrastructureAccessService } from '../../practice/services/infrastructure-access.service';
import type { DiagnosticEquipment } from '../entities';
import { DiagnosticUnitScopeService } from './diagnostic-unit-scope.service';

/** Sede de práctica, unidad y práctica de un equipo. */
interface EquipmentHome {
  practice_site_id: string;
  tenant_id: string;
  practice_id: string | null;
  unit_name: string;
  time_zone: string | null;
}

/**
 * F5a (CONTRATO-F2-F5 §F5a): detalle del equipo con su sala, recurso agendable
 * `RES_EQUIPMENT` y estación de la Worklist DICOM. Autoriza con el evaluador
 * de §0.3 sobre la sede de práctica de la unidad (404 fuera del tenant).
 */
@Injectable()
export class EquipmentF5aService {
  constructor(
    private readonly em: EntityManager,
    private readonly scope: DiagnosticUnitScopeService,
    private readonly access: InfrastructureAccessService,
    private readonly outbox: OutboxService,
  ) {}

  /**
   * Equipo del tenant y su sede; exige `action` sobre la sede.
   *
   * @param tx - Contexto.
   * @param equipmentId - Equipo.
   * @param actor - Actor.
   * @param action - Acción registrada.
   */
  async authorize(
    tx: EntityManager,
    equipmentId: string,
    actor: AuthenticatedUser,
    action: string,
  ): Promise<{ equipment: DiagnosticEquipment; home: EquipmentHome }> {
    const equipment = await this.scope.equipment(tx, equipmentId);
    const [home] = await tx.execute<EquipmentHome[]>(
      `SELECT s.practice_site_id, u.tenant_id, u.practice_id, u.name AS unit_name,
              coalesce(ps.time_zone, p.time_zone) AS time_zone
         FROM diagnostic_units.diagnostic_unit_sites s
         JOIN diagnostic_units.diagnostic_units u ON u.id = s.diagnostic_unit_id
         JOIN practice.practice_sites ps ON ps.id = s.practice_site_id
         JOIN practice.practices p ON p.id = ps.practice_id
        WHERE s.id = ?`,
      [equipment.diagnosticUnitSiteId],
      'all',
    );
    // Revisión de seguridad F5a: un equipo ubicado se autoriza sobre SU sala
    // (alcance UNIT/SPACE exacto); uno sin sala, sólo con roles de nivel
    // sede. Nunca la expansión parcial de la sede para un recurso puntual.
    if (equipment.careSpaceId) {
      await this.access.assertCan(
        actor,
        action,
        { careSpaceId: equipment.careSpaceId },
        tx,
        requireTenantId(),
      );
    } else {
      await this.access.assertSiteLevel(
        actor,
        action,
        home.practice_site_id,
        tx,
        requireTenantId(),
      );
    }
    return { equipment, home };
  }

  /** `GET /diagnostic-equipment/:id`. */
  async detail(equipmentId: string, actor: AuthenticatedUser) {
    const em = this.em.fork();
    const { equipment, home } = await this.authorize(
      em,
      equipmentId,
      actor,
      'f5a.equipment.read',
    );
    return this.view(em, equipment, home);
  }

  /** `POST /diagnostic-equipment/:id/resource`: crea el recurso `RES_EQUIPMENT`. */
  createResource(equipmentId: string, actor: AuthenticatedUser) {
    return this.em.transactional(async (tx) => {
      const { equipment, home } = await this.authorize(
        tx,
        equipmentId,
        actor,
        'f5a.equipment.write',
      );
      const [existing] = await tx.execute<{ id: string }[]>(
        `SELECT id FROM scheduling.schedulable_resources
          WHERE resource_ref_type = 'diagnostic_equipment' AND resource_ref_id = ? AND state_concept_id = ?`,
        [equipment.id, CONCEPTS.STATE_ACTIVE],
        'all',
      );
      if (equipment.schedulableResourceId || existing)
        throw new ConflictException(
          'El equipo ya tiene un recurso agendable',
          {
            resourceId: equipment.schedulableResourceId ?? existing?.id,
          },
          'RESOURCE_ALREADY_EXISTS_FOR_EQUIPMENT',
        );
      const name =
        [equipment.manufacturer, equipment.model].filter(Boolean).join(' ') ||
        `Equipo ${equipment.serialNumber ?? equipment.id.slice(0, 8)}`;
      const [created] = await tx.execute<{ id: string }[]>(
        `INSERT INTO scheduling.schedulable_resources
           (id, tenant_id, practice_id, resource_type_concept_id, resource_ref_type, resource_ref_id,
            name, time_zone, capacity, state_concept_id, created_at, updated_at, created_by_user_id, updated_by_user_id, row_version)
         VALUES (gen_random_uuid(), ?, ?, ?, 'diagnostic_equipment', ?, ?, ?, 1, ?, now(), now(), ?, ?, 1)
         RETURNING id`,
        [
          home.tenant_id,
          home.practice_id,
          CONCEPTS.RESOURCE_EQUIPMENT,
          equipment.id,
          name.slice(0, 200),
          home.time_zone,
          CONCEPTS.STATE_ACTIVE,
          actor.id,
          actor.id,
        ],
        'all',
      );
      equipment.schedulableResourceId = created.id;
      equipment.updatedAt = new Date();
      equipment.updatedByUserId = actor.id;
      await tx.flush();
      await this.outbox.publishDomainEvent(tx, {
        tenantId: home.tenant_id,
        eventType: 'diagnostic_units.equipment.resource_linked',
        aggregateType: 'diagnostic_units.diagnostic_equipment',
        aggregateId: equipment.id,
        payloadJson: { equipmentId: equipment.id, resourceId: created.id },
        actorUserId: actor.id,
      });
      return { equipmentId: equipment.id, resourceId: created.id };
    });
  }

  /** `GET /diagnostic-equipment/:id/mwl-station` (atributos 0040,0001/0010/0011). */
  async mwlStation(equipmentId: string, actor: AuthenticatedUser) {
    const em = this.em.fork();
    const { equipment } = await this.authorize(
      em,
      equipmentId,
      actor,
      'f5a.equipment.read',
    );
    const [space] = equipment.careSpaceId
      ? await em.execute<{ code: string }[]>(
          'SELECT code FROM practice.care_spaces WHERE id = ?',
          [equipment.careSpaceId],
          'all',
        )
      : [];
    return {
      scheduledStationAETitle: equipment.aeTitle ?? null,
      scheduledStationName: equipment.stationName ?? null,
      spsLocation: space?.code ?? null,
    };
  }

  /**
   * Mover el equipo a otra sala exige el permiso también sobre la sala de
   * destino (403/404); sacarlo de toda sala, nivel sede.
   *
   * @param tx - Contexto.
   * @param actor - Actor.
   * @param careSpaceId - Sala de destino.
   */
  async authorizeDestination(
    tx: EntityManager,
    actor: AuthenticatedUser,
    careSpaceId: string | null,
    practiceSiteId: string,
  ): Promise<void> {
    // Sacar el equipo de su sala (destino null) lo deja fuera de todo
    // alcance de espacio: exige nivel sede (revisión de seguridad F5a).
    if (!careSpaceId) {
      await this.access.assertSiteLevel(
        actor,
        'f5a.equipment.write',
        practiceSiteId,
        tx,
        requireTenantId(),
      );
      return;
    }
    await this.access.assertCan(
      actor,
      'f5a.equipment.write',
      { careSpaceId },
      tx,
      requireTenantId(),
    );
  }

  /**
   * Eventos de un PATCH: `located` si cambió la sala, `status_changed` si
   * cambió el estado operativo. En la transacción del llamador.
   */
  async announceChanges(
    tx: EntityManager,
    equipment: DiagnosticEquipment,
    before: { careSpaceId: string | null; status: string },
    actorUserId: string,
  ): Promise<void> {
    const tenantId = requireTenantId();
    if ((equipment.careSpaceId ?? null) !== before.careSpaceId)
      await this.outbox.publishDomainEvent(tx, {
        tenantId,
        eventType: 'diagnostic_units.equipment.located',
        aggregateType: 'diagnostic_units.diagnostic_equipment',
        aggregateId: equipment.id,
        payloadJson: {
          equipmentId: equipment.id,
          fromCareSpaceId: before.careSpaceId,
          toCareSpaceId: equipment.careSpaceId ?? null,
        },
        actorUserId,
      });
    if (equipment.operationalStatusConceptId !== before.status)
      await this.outbox.publishDomainEvent(tx, {
        tenantId,
        eventType: 'diagnostic_units.equipment.status_changed',
        aggregateType: 'diagnostic_units.diagnostic_equipment',
        aggregateId: equipment.id,
        payloadJson: {
          equipmentId: equipment.id,
          fromStatusConceptId: before.status,
          toStatusConceptId: equipment.operationalStatusConceptId,
        },
        actorUserId,
      });
  }

  private async view(
    em: EntityManager,
    e: DiagnosticEquipment,
    home: EquipmentHome,
  ) {
    const ids = [
      e.equipmentTypeConceptId,
      e.modalityConceptId,
      e.operationalStatusConceptId,
    ].filter((x): x is string => !!x);
    const concepts = await em.execute<
      { id: string; code: string; display: string | null }[]
    >(
      'SELECT id, code, display FROM terminology.catalog_concepts WHERE id = ANY(?::uuid[])',
      [`{${ids.join(',')}}`],
      'all',
    );
    const c = (id?: string | null) => {
      const r = concepts.find((x) => x.id === id);
      return r ? { code: r.code, display: r.display ?? r.code } : null;
    };
    const space = e.careSpaceId
      ? (
          await em.execute<
            { id: string; code: string; name: string; path: string }[]
          >(
            `WITH RECURSIVE chain AS (
               SELECT id, parent_space_id, name, code, 0 AS depth FROM practice.care_spaces WHERE id = ?
               UNION ALL
               SELECT p.id, p.parent_space_id, p.name, p.code, chain.depth + 1
                 FROM chain JOIN practice.care_spaces p ON p.id = chain.parent_space_id WHERE chain.depth < 32)
             SELECT (SELECT id FROM chain WHERE depth = 0) AS id,
                    (SELECT code FROM chain WHERE depth = 0) AS code,
                    (SELECT name FROM chain WHERE depth = 0) AS name,
                    string_agg(name, ' / ' ORDER BY depth DESC) AS path FROM chain`,
            [e.careSpaceId],
            'all',
          )
        )[0]
      : null;
    return {
      id: e.id,
      siteId: home.practice_site_id,
      diagnosticUnitSiteName: home.unit_name,
      type: c(e.equipmentTypeConceptId),
      manufacturer: e.manufacturer ?? null,
      model: e.model ?? null,
      serialNumber: e.serialNumber ?? null,
      modality: c(e.modalityConceptId),
      operationalStatus: c(e.operationalStatusConceptId),
      careSpace: space,
      aeTitle: e.aeTitle ?? null,
      stationName: e.stationName ?? null,
      schedulableResourceId: e.schedulableResourceId ?? null,
      rowVersion: e.rowVersion,
    };
  }
}
