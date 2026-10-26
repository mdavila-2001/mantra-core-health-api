import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PreconditionFailedException } from '../../../common';
import { ClinicalNoteHeaders } from '../../chart/entities';
import { Encounters, ServiceRequestNotes } from '../entities';
import { CHART } from '../../chart/chart.concepts';
import { ClinicalErrorReason } from '../clinical.error-reasons';

/** Una nota sólo motiva una orden cuando ya no puede cambiar: firmada o enmendada. */
const FINAL_LIFECYCLES: ReadonlySet<string> = new Set([
  CHART.NOTE_LIFECYCLE_SIGNED,
  CHART.NOTE_LIFECYCLE_AMENDED,
]);

/**
 * P40 (carril C2): las notas médicas que motivan una orden de análisis
 * (`basedOnNoteIds`), en `clinical.service_request_notes`.
 *
 * Clase sin estado que recibe el `EntityManager` del llamador —la transacción
 * del alta, o el fork de una lectura—, igual que `SuggestedSiteNamesReader`:
 * así `diagnostics` la provee suelta para sus lecturas sin importar el módulo
 * clínico entero.
 */
@Injectable()
export class ServiceRequestNotesService {
  /**
   * Lanza 422 si alguna nota no sirve como motivo de la orden.
   *
   * Una nota sirve si, a la vez:
   * - existe y es del **mismo paciente**;
   * - cuelga de un encuentro del **tenant custodio de la orden**: la cabecera
   *   de la nota no tiene tenant propio, así que la custodia se prueba por su
   *   encuentro, y una nota sin encuentro no puede probarla;
   * - está **firmada o enmendada** (un borrador todavía puede cambiar);
   * - no tiene confidencialidad restringida (cualquier valor distinto de
   *   `DOC_CONF_NORMAL`).
   *
   * Todas esas fallas responden igual (`BASED_ON_NOTE_NOT_FOUND`): distinguirlas
   * le diría al cliente que ese id existe en otra historia, en otro tenant o
   * con otro estado. Recién superadas, si la orden tiene encuentro y la nota es
   * de otra consulta, `BASED_ON_NOTE_ENCOUNTER_MISMATCH`.
   *
   * @param em - Transacción activa del alta.
   * @param noteIds - Notas citadas, sin repetidos (lo garantiza el DTO).
   * @param patientProfileId - Paciente de la orden.
   * @param custodianTenantId - Tenant custodio de la orden.
   * @param encounterId - Encuentro de la orden, si lo tiene.
   */
  async assertUsable(
    em: EntityManager,
    noteIds: readonly string[],
    patientProfileId: string,
    custodianTenantId: string,
    encounterId?: string | null,
  ): Promise<void> {
    if (noteIds.length === 0) return;
    const notes = await em.find(
      ClinicalNoteHeaders,
      { id: { $in: [...noteIds] } },
      {
        fields: [
          'id',
          'patientProfileId',
          'encounterId',
          'lifecycleStatusConceptId',
          'confidentialityConceptId',
        ],
      },
    );
    const encounterIds = [
      ...new Set(
        notes
          .map((note) => note.encounterId)
          .filter((id): id is string => id !== undefined && id !== null),
      ),
    ];
    const encounters =
      encounterIds.length === 0
        ? []
        : await em.find(
            Encounters,
            { id: { $in: encounterIds } },
            { fields: ['id', 'tenantId'] },
          );
    const tenantOf = new Map(
      encounters.map(
        (encounter) => [encounter.id, encounter.tenantId] as const,
      ),
    );
    const byId = new Map(notes.map((note) => [note.id, note] as const));

    for (const noteId of noteIds) {
      const note = byId.get(noteId);
      const usable =
        note !== undefined &&
        note.patientProfileId === patientProfileId &&
        !!note.encounterId &&
        tenantOf.get(note.encounterId) === custodianTenantId &&
        FINAL_LIFECYCLES.has(note.lifecycleStatusConceptId) &&
        (!note.confidentialityConceptId ||
          note.confidentialityConceptId === CHART.DOC_CONFIDENTIALITY_NORMAL);
      if (!usable) {
        throw new PreconditionFailedException(
          'La nota médica citada no está disponible como motivo de esta orden',
          { noteId },
          ClinicalErrorReason.BASED_ON_NOTE_NOT_FOUND,
        );
      }
      if (encounterId && note.encounterId !== encounterId) {
        throw new PreconditionFailedException(
          'La nota médica citada pertenece a otra consulta',
          { noteId, encounterId },
          ClinicalErrorReason.BASED_ON_NOTE_ENCOUNTER_MISMATCH,
        );
      }
    }
  }

  /**
   * Escribe un vínculo por nota, en el orden en que llegaron. No hace `flush`:
   * lo hace el alta, en la misma transacción que la orden.
   *
   * @param em - Transacción activa del alta.
   * @param serviceRequestId - La orden recién creada.
   * @param noteIds - Notas ya validadas por {@link assertUsable}.
   * @param actorUserId - Quién pide la orden.
   */
  link(
    em: EntityManager,
    serviceRequestId: string,
    noteIds: readonly string[],
    actorUserId?: string,
  ): void {
    const now = new Date();
    noteIds.forEach((clinicalNoteHeaderId, ordinal) => {
      em.create(ServiceRequestNotes, {
        serviceRequestId,
        clinicalNoteHeaderId,
        ordinal,
        createdAt: now,
        createdByUserId: actorUserId,
      });
    });
  }

  /**
   * Las notas de cada orden, en el orden en que el médico las citó. Una sola
   * consulta por lote.
   *
   * @param em - Contexto de persistencia.
   * @param serviceRequestIds - Órdenes de la página.
   * @returns Orden → notas. Una orden sin notas no figura.
   */
  async noteIdsFor(
    em: EntityManager,
    serviceRequestIds: readonly string[],
  ): Promise<Map<string, string[]>> {
    const unique = [...new Set(serviceRequestIds)];
    if (unique.length === 0) return new Map();
    const rows = await em.find(
      ServiceRequestNotes,
      { serviceRequestId: { $in: unique } },
      {
        fields: ['serviceRequestId', 'clinicalNoteHeaderId', 'ordinal'],
        orderBy: { serviceRequestId: 'ASC', ordinal: 'ASC' },
      },
    );
    const byOrder = new Map<string, string[]>();
    for (const row of rows) {
      const list = byOrder.get(row.serviceRequestId) ?? [];
      list.push(row.clinicalNoteHeaderId);
      byOrder.set(row.serviceRequestId, list);
    }
    return byOrder;
  }
}
