import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { createHash } from 'node:crypto';
import {
  ConditionsRepository,
  MedicationRequestsRepository,
} from '../repositories';
import {
  CarePlansRepository,
  ClinicalNotesRepository,
  DocumentsRepository,
} from '../../chart/repositories';
import type { Encounters } from '../entities';
import type { EncounterSealPayload } from './encounter-seal.payload';

/**
 * Calcula el sello SHA-256 de un encuentro al cerrarlo (C.4).
 *
 * Vive en `clinical` porque lo invoca `EncountersService.close()` dentro de
 * su transacción; `chart` importa `clinical` (`ChartModule` → `clinical.module.ts`),
 * así que `clinical` no puede importar `chart` sin cerrar un ciclo. Por eso
 * este servicio recibe los tres repositorios de `chart` que necesita como
 * providers sueltos de `ClinicalModule`, igual que ya hace con los de
 * `profiles`/`scheduling`/`authz` (ver `clinical.module.ts`): son clases sin
 * estado que reciben el `EntityManager` por parámetro, no duplican fuente de
 * verdad.
 *
 * El algoritmo copia el precedente de `ChartNotesService.contentHash()`:
 * `sha256` sobre el JSON de un objeto con claves fijas.
 */
@Injectable()
export class EncounterSealService {
  constructor(
    private readonly notesRepo: ClinicalNotesRepository,
    private readonly carePlansRepo: CarePlansRepository,
    private readonly documentsRepo: DocumentsRepository,
    private readonly conditionsRepo: ConditionsRepository,
    private readonly medicationRequestsRepo: MedicationRequestsRepository,
  ) {}

  /**
   * Arma el payload canónico del encuentro y devuelve su hash SHA-256 (hex).
   *
   * @param tx - Transacción activa del cierre (misma unidad de trabajo).
   * @param encounter - Encuentro que se está cerrando.
   */
  async computeHash(tx: EntityManager, encounter: Encounters): Promise<string> {
    const payload = await this.buildPayload(tx, encounter);
    return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  }

  private async buildPayload(
    tx: EntityManager,
    encounter: Encounters,
  ): Promise<EncounterSealPayload> {
    const [headers, conditions, medicationRequests, carePlans, documents] =
      await Promise.all([
        this.notesRepo.findHeadersByEncounter(tx, encounter.id),
        this.conditionsRepo.findByEncounter(tx, encounter.id),
        this.medicationRequestsRepo.findByEncounter(tx, encounter.id),
        this.carePlansRepo.findByEncounter(tx, encounter.id),
        this.documentsRepo.findByEncounter(tx, encounter.id),
      ]);

    const versionIds = headers
      .map((header) => header.currentVersionId)
      .filter((id): id is string => Boolean(id));
    const versionsById = await this.notesRepo.findVersionsByIds(tx, versionIds);

    return {
      encounter: {
        id: encounter.id,
        patientProfileId: encounter.patientProfileId,
        primaryPractitionerId: encounter.primaryPractitionerId ?? null,
        startAt: encounter.startAt ? encounter.startAt.toISOString() : null,
        endAt: encounter.endAt ? encounter.endAt.toISOString() : null,
      },
      notes: headers.map((header) => {
        const version = header.currentVersionId
          ? versionsById.get(header.currentVersionId)
          : undefined;
        return {
          headerId: header.id,
          versionId: header.currentVersionId ?? null,
          contentHash: version?.contentHash ?? null,
        };
      }),
      conditions: conditions.map((condition) => ({
        id: condition.id,
        codeConceptId: condition.codeConceptId,
        clinicalStatusConceptId: condition.clinicalStatusConceptId ?? null,
        verificationStatusConceptId:
          condition.verificationStatusConceptId ?? null,
      })),
      medicationRequests: medicationRequests.map((request) => ({
        id: request.id,
        rowVersion: request.rowVersion,
      })),
      carePlans: carePlans.map((plan) => ({
        id: plan.id,
        rowVersion: plan.rowVersion,
        activityIds: plan.activities.map((activity) => activity.id).sort(),
      })),
      documents: documents.map((document) => ({
        id: document.id,
        fileIds: document.files.map((file) => file.fileId).sort(),
      })),
    };
  }
}
