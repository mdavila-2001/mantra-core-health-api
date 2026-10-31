import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedUser } from '../../../../common';
import {
  CLEANING_STATUS,
  OPEN_CLEANING_STATUSES,
  type CleaningStatusCode,
} from '../../../practice/domain/ops/ops-catalog';
import { allowedCleaningActions } from '../../../practice/domain/ops/cleaning-rules';
import { InfrastructureAccessService } from '../../../practice/services/infrastructure-access.service';
import { findPractitionerNames } from '../../../profiles/infrastructure/read-models/practitioner-names';
import { PERIOP } from '../../procedures_perioperative.concepts';

/** Clave de concepto de periop por id (`OR_EVENT_PATIENT_IN_ROOM`…). */
const PERIOP_KEY_BY_ID = new Map<string, string>(
  Object.entries(PERIOP).map(([k, id]) => [id, k]),
);
/** Eventos de sala de F4 (los demás de la tabla son de agenda/legado). */
const ROOM_EVENT_IDS = Object.entries(PERIOP)
  .filter(([k]) => k.startsWith('OR_EVENT_'))
  .map(([, id]) => id);
const STATUS_BY_ID = new Map<string, CleaningStatusCode>(
  Object.entries(CLEANING_STATUS).map(([k, id]) => [
    id,
    k as CleaningStatusCode,
  ]),
);

/** Lo mínimo de un caso que necesita la vista de quirófano. */
export interface CaseOrSource {
  id: string;
  operatingRoomId?: string;
  operatingRoomBlockId?: string;
  caseTypeConceptId?: string;
}

/** Campos de quirófano de un caso (§F4.3, lo que lee la web). */
export interface CaseOrFields {
  operatingRoom: { id: string; code: string; name: string } | null;
  block: { id: string; label: string } | null;
  caseType: { code: string; display: string } | null;
}

/**
 * Vista de quirófano de los casos (CONTRATO-F2-F5 §F4.3): sala, bloque con su
 * dueño resuelto, tipo de caso y, en el detalle, check-list OMS, eventos de
 * sala y orden de recambio. SQL de sólo lectura acotado al tenant del caso.
 */
@Injectable()
export class CaseOrViewBuilder {
  constructor(
    private readonly em: EntityManager,
    private readonly access: InfrastructureAccessService,
  ) {}

  /**
   * Sala, bloque y tipo de cada caso.
   *
   * @param cases - Casos ya acotados al tenant.
   * @param tenantId - Tenant activo.
   */
  async fields(
    cases: readonly CaseOrSource[],
    tenantId: string,
  ): Promise<Map<string, CaseOrFields>> {
    const em = this.em.fork();
    const roomIds = [
      ...new Set(cases.map((c) => c.operatingRoomId).filter(Boolean)),
    ] as string[];
    const blockIds = [
      ...new Set(cases.map((c) => c.operatingRoomBlockId).filter(Boolean)),
    ] as string[];
    const typeIds = [
      ...new Set(cases.map((c) => c.caseTypeConceptId).filter(Boolean)),
    ] as string[];
    const [rooms, labels, types] = await Promise.all([
      roomIds.length
        ? em.execute<{ id: string; code: string; name: string }[]>(
            'SELECT id, code, name FROM practice.care_spaces WHERE id = ANY(?::uuid[]) AND tenant_id = ?',
            [`{${roomIds.join(',')}}`, tenantId],
            'all',
          )
        : [],
      this.blockLabels(em, blockIds, tenantId),
      typeIds.length
        ? em.execute<{ id: string; code: string; display: string | null }[]>(
            'SELECT id, code, display FROM terminology.catalog_concepts WHERE id = ANY(?::uuid[])',
            [`{${typeIds.join(',')}}`],
            'all',
          )
        : [],
    ]);
    const roomById = new Map(rooms.map((r) => [r.id, r]));
    const typeById = new Map(types.map((t) => [t.id, t]));
    const out = new Map<string, CaseOrFields>();
    for (const c of cases) {
      const room = c.operatingRoomId
        ? roomById.get(c.operatingRoomId)
        : undefined;
      const type = c.caseTypeConceptId
        ? typeById.get(c.caseTypeConceptId)
        : undefined;
      out.set(c.id, {
        operatingRoom: room
          ? { id: room.id, code: room.code, name: room.name }
          : null,
        block: c.operatingRoomBlockId
          ? {
              id: c.operatingRoomBlockId,
              label: labels.get(c.operatingRoomBlockId) ?? '',
            }
          : null,
        caseType: type
          ? { code: shortCode(type.code), display: type.display ?? type.code }
          : null,
      });
    }
    return out;
  }

  /**
   * Etiqueta del dueño de cada bloque: nombre de la unidad (servicio) o del
   * cirujano.
   *
   * @param em - Contexto.
   * @param blockIds - Bloques.
   * @param tenantId - Tenant activo.
   */
  async blockLabels(
    em: EntityManager,
    blockIds: readonly string[],
    tenantId: string,
  ): Promise<Map<string, string>> {
    if (blockIds.length === 0) return new Map();
    const rows = await em.execute<
      {
        id: string;
        owner_kind_concept_id: string;
        clinical_unit_id: string | null;
        surgeon_profile_id: string | null;
        unit_name: string | null;
        specialty: string | null;
      }[]
    >(
      `SELECT b.id, b.owner_kind_concept_id, b.clinical_unit_id, b.surgeon_profile_id,
              u.name AS unit_name, coalesce(sp.display, sp.code) AS specialty
         FROM procedures_perioperative.operating_room_blocks b
         LEFT JOIN practice.clinical_units u ON u.id = b.clinical_unit_id
         LEFT JOIN terminology.catalog_concepts sp ON sp.id = b.surgical_specialty_concept_id
        WHERE b.id = ANY(?::uuid[]) AND b.tenant_id = ?`,
      [`{${blockIds.join(',')}}`, tenantId],
      'all',
    );
    const names = await findPractitionerNames(
      em,
      rows.map((r) => r.surgeon_profile_id).filter((x): x is string => !!x),
    );
    return new Map(
      rows.map((r) => [
        r.id,
        r.owner_kind_concept_id === PERIOP.ORB_OWNER_SERVICE
          ? (r.unit_name ?? r.specialty ?? 'Servicio')
          : (names.get(r.surgeon_profile_id ?? '') ?? 'Cirujano'),
      ]),
    );
  }

  /**
   * Check-list OMS, eventos de sala y orden de recambio del caso (detalle).
   *
   * @param c - Caso.
   * @param actor - Actor (las transiciones del recambio son las suyas).
   * @param tenantId - Tenant activo.
   */
  async detail(c: CaseOrSource, actor: AuthenticatedUser, tenantId: string) {
    const em = this.em.fork();
    const [checklists, events, cleaning] = await Promise.all([
      em.execute<
        {
          id: string;
          sign_in_completed_at: Date | null;
          time_out_completed_at: Date | null;
          sign_out_completed_at: Date | null;
        }[]
      >(
        `SELECT id, sign_in_completed_at, time_out_completed_at, sign_out_completed_at
           FROM procedures_perioperative.surgical_safety_checklists
          WHERE procedure_case_id = ? ORDER BY created_at DESC LIMIT 1`,
        [c.id],
        'all',
      ),
      em.execute<
        {
          id: string;
          event_type_concept_id: string;
          occurred_at: Date;
          recorded_by_user_id: string | null;
        }[]
      >(
        `SELECT id, event_type_concept_id, occurred_at, recorded_by_user_id
           FROM procedures_perioperative.operating_room_utilization_events
          WHERE procedure_case_id = ? AND tenant_id = ?
            AND event_type_concept_id = ANY(?::uuid[])
          ORDER BY occurred_at, id LIMIT 200`,
        [c.id, tenantId, `{${ROOM_EVENT_IDS.join(',')}}`],
        'all',
      ),
      em.execute<
        {
          id: string;
          status_concept_id: string;
          row_version: number;
          care_space_id: string;
        }[]
      >(
        `SELECT id, status_concept_id, row_version, care_space_id FROM practice.cleaning_orders
          WHERE source_ref_id = ? AND tenant_id = ?
          ORDER BY requested_at DESC, id LIMIT 1`,
        [c.id, tenantId],
        'all',
      ),
    ]);
    const [cl] = checklists;
    // Una sola orden abierta por espacio: si un caso anterior dejó la suya
    // abierta, la salida de sala de este caso la reutiliza (y su
    // source_ref_id sigue siendo el del caso anterior). El recambio de este
    // caso es entonces la orden de la sala que estaba abierta al salir el
    // paciente: la misma que devolvió POST …/room-events.
    let [order] = cleaning;
    const out = events.find(
      (e) => e.event_type_concept_id === PERIOP.OR_EVENT_PATIENT_OUT_OF_ROOM,
    );
    if (!order && out && c.operatingRoomId) {
      [order] = await em.execute<
        {
          id: string;
          status_concept_id: string;
          row_version: number;
          care_space_id: string;
        }[]
      >(
        `SELECT id, status_concept_id, row_version, care_space_id FROM practice.cleaning_orders
          WHERE care_space_id = ? AND tenant_id = ? AND requested_at <= ?
            AND (status_concept_id = ANY(?::uuid[]) OR updated_at >= ?)
          ORDER BY requested_at DESC, id LIMIT 1`,
        [
          c.operatingRoomId,
          tenantId,
          out.occurred_at,
          `{${OPEN_CLEANING_STATUSES.map((st) => CLEANING_STATUS[st]).join(',')}}`,
          out.occurred_at,
        ],
        'all',
      );
    }
    let allowed: string[] = [];
    const status = order
      ? STATUS_BY_ID.get(order.status_concept_id)
      : undefined;
    if (order && status) {
      const actions = await this.access.actionsOn(
        actor,
        { careSpaceId: order.care_space_id },
        em,
        tenantId,
        ['f2.cleaning.'],
      );
      allowed = allowedCleaningActions(status, (k) => actions.includes(k));
    }
    const at = (d: Date | null) => (d ? new Date(d).toISOString() : null);
    return {
      checklist: cl
        ? {
            id: cl.id,
            signIn: { completedAt: at(cl.sign_in_completed_at) },
            timeOut: { completedAt: at(cl.time_out_completed_at) },
            signOut: { completedAt: at(cl.sign_out_completed_at) },
          }
        : null,
      roomEvents: events.map((e) => ({
        id: e.id,
        eventCode: (
          PERIOP_KEY_BY_ID.get(e.event_type_concept_id) ?? ''
        ).replace(/^OR_EVENT_/, ''),
        occurredAt: at(e.occurred_at),
        recordedByUserId: e.recorded_by_user_id,
      })),
      turnoverCleaning: order
        ? {
            id: order.id,
            status: status ?? null,
            rowVersion: order.row_version,
            allowedTransitions: allowed,
          }
        : null,
    };
  }
}

/** `procedures_perioperative:CASE_TYPE_X` → `CASE_TYPE_X`. */
function shortCode(code: string): string {
  const i = code.lastIndexOf(':');
  return i >= 0 ? code.slice(i + 1) : code;
}
