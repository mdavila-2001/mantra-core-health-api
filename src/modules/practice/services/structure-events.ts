import type { EntityManager } from '@mikro-orm/postgresql';
import type { OutboxService } from '../../messaging/services/outbox.service';

/**
 * Eventos de dominio de la estructura (F1, contrato §3; catálogo en
 * `asyncapi/asyncapi.yaml` → `PracticeStructureEvent`).
 *
 * Se publican en la misma transacción que el cambio (outbox): si la escritura
 * se revierte, el evento también. El payload lleva ids, códigos y la
 * `rowVersion` resultante —nunca datos de pacientes—; la versión además hace
 * única la clave de idempotencia derivada, así dos cambios iguales sucesivos
 * (suspender, reactivar, suspender) no se deduplican entre sí.
 */
export const STRUCTURE_EVENTS = {
  spaceCreated: 'practice.care_space.created',
  spaceUpdated: 'practice.care_space.updated',
  spaceMoved: 'practice.care_space.moved',
  spaceLifecycleChanged: 'practice.care_space.lifecycle_changed',
  unitCreated: 'practice.clinical_unit.created',
  unitUpdated: 'practice.clinical_unit.updated',
  unitLifecycleChanged: 'practice.clinical_unit.lifecycle_changed',
  licenseCreated: 'practice.site_license.created',
  licenseUpdated: 'practice.site_license.updated',
  siteRegulatoryUpdated: 'practice.site.regulatory_updated',
  siteSnisVerified: 'practice.site.snis_verified',
  siteCapacityDeclared: 'practice.site.capacity_declared',
} as const;

/** Tipo de evento de estructura. */
export type StructureEventType =
  (typeof STRUCTURE_EVENTS)[keyof typeof STRUCTURE_EVENTS];

/** Agregado por prefijo del evento. */
const AGGREGATE_TYPE: Record<string, string> = {
  care_space: 'practice.care_spaces',
  clinical_unit: 'practice.clinical_units',
  site_license: 'organization_extensions.facility_licenses',
  site: 'practice.practice_sites',
};

/**
 * Publica un evento de estructura en la transacción del llamador.
 *
 * @param outbox - `OutboxService`.
 * @param tx - Transacción en curso.
 * @param eventType - Uno de `STRUCTURE_EVENTS`.
 * @param input - Tenant, agregado, actor y payload.
 */
export async function publishStructureEvent(
  outbox: Pick<OutboxService, 'publishDomainEvent'>,
  tx: EntityManager,
  eventType: StructureEventType,
  input: {
    tenantId: string;
    aggregateId: string;
    actorUserId?: string;
    payload: Record<string, unknown>;
  },
): Promise<void> {
  const kind = eventType.split('.')[1];
  await outbox.publishDomainEvent(tx, {
    tenantId: input.tenantId,
    eventType,
    aggregateType: AGGREGATE_TYPE[kind] ?? `practice.${kind}`,
    aggregateId: input.aggregateId,
    payloadJson: input.payload,
    actorUserId: input.actorUserId,
  });
}
