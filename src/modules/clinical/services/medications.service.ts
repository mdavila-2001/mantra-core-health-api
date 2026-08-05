import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  MedicationRecordsRepository,
  MedicationRequestsRepository,
} from '../repositories';
import {
  CreateMedicationRecordDto,
  CreateMedicationRequestDto,
  EditMedicationRequestDraftDto,
  InvalidateMedicationRequestDto,
  MedicationRecordResponseDto,
  MedicationRequestResponseDto,
  ReplaceMedicationRequestDto,
  RenewMedicationRequestDto,
} from '../dto';
import { MedicationRequests } from '../entities';
import { CLIN } from '../clinical.concepts';
import { PrescriptionSignaturePoliciesService } from './prescription-signature-policies.service';
import { AuditTrailService } from '../../audit/services';
import { HistoryRepository } from '../../audit/repositories';
import { AUD } from '../../audit/audit.concepts';

/** Recurso sellado en la cadena WORM para cada evento de receta (CAN-AUDIT-001). */
const RX_AUDIT_ENTITY = 'medication_request';
/** Clave de la tabla `audit.medication_requests_history` en el registro (§2). */
const RX_HISTORY_ENTITY = 'medication_requests';

/**
 * UC-08-10 (prescribir) y UC-08-11 (administrar/registrar) de medicación, más la
 * máquina de estados e inmutabilidad de receta de REDESA (CAN-RX-001..004):
 *
 *   DRAFT ──edit──▶ DRAFT ──issue──▶ ISSUED ──administer(final)──▶ COMPLETED
 *                                       │
 *                                       ├─ invalidate ─▶ INVALIDATED
 *                                       └─ replace ────▶ REPLACED (+ nueva DRAFT)
 *                                       renew ─────────▶ nueva DRAFT (original intacta)
 *
 * `prescribe` crea la receta en DRAFT (editable/eliminable por el autor). Al
 * emitir (`issue`) se sella el contenido: ningún estado ≥ ISSUED admite editar
 * ítems clínicos. Corregir una receta emitida = `invalidate`/`replace` + nueva
 * receta relacionada; renovar = `renew` (nueva receta copiando datos). No hay
 * PATCH/DELETE genérico: solo comandos de negocio. `medication_records` no es el
 * ledger de inventario de farmacia.
 */
@Injectable()
export class MedicationsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param requestsRepo - Valor de requests repo requerido por la operación.
   * @param recordsRepo - Valor de records repo requerido por la operación.
   * @param signaturePolicies - Valor de signature policies requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly requestsRepo: MedicationRequestsRepository,
    private readonly recordsRepo: MedicationRecordsRepository,
    private readonly signaturePolicies: PrescriptionSignaturePoliciesService,
    private readonly auditTrail: AuditTrailService,
    private readonly historyRepo: HistoryRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(MedicationsService.name);
  }

  /** Snapshot del contenido clínico sellado, para la tabla de historial. */
  private snapshot(request: MedicationRequests): Record<string, unknown> {
    return {
      status: request.statusConceptId,
      medicationConceptId: request.medicationConceptId,
      substanceAtcConceptId: request.substanceAtcConceptId,
      doseText: request.doseText,
      routeConceptId: request.routeConceptId,
      frequencyText: request.frequencyText,
      quantityDecimal: request.quantityDecimal,
      unitConceptId: request.unitConceptId,
      validFrom: request.validFrom ?? null,
      validTo: request.validTo ?? null,
      issuedAt: request.issuedAt ?? null,
      statusReasonText: request.statusReasonText ?? null,
    };
  }

  /** Proyección estable de una receta a su DTO de respuesta. */
  private toRequestResponse(
    request: MedicationRequests,
  ): MedicationRequestResponseDto {
    return {
      id: request.id,
      patientProfileId: request.patientProfileId,
      status: request.statusConceptId,
      replacesRequestId: request.replacesRequestId ?? null,
      replacedByRequestId: request.replacedByRequestId ?? null,
      renewedFromRequestId: request.renewedFromRequestId ?? null,
      signedAt: request.signedAt ?? null,
      createdAt: request.createdAt,
    };
  }

  /**
   * Carga una receta o lanza 404. Comando de negocio: nunca se expone find genérico.
   */
  private async loadRequestOrThrow(
    tx: EntityManager,
    requestId: string,
  ): Promise<MedicationRequests> {
    const request = await this.requestsRepo.findById(tx, requestId);
    if (!request) {
      throw new ResourceNotFoundException('Receta no encontrada', {
        requestId,
      });
    }
    return request;
  }

  /**
   * UC-08-10: prescribe una medicación. La receta nace en DRAFT (borrador
   * editable/eliminable por el autor); no surte efecto hasta emitirla (`issue`).
   */
  async prescribe(
    dto: CreateMedicationRequestDto,
    actor: AuthenticatedUser,
  ): Promise<MedicationRequestResponseDto> {
    this.logger.info(
      {
        operation: 'clinical.medication.prescribe',
        patientProfileId: dto.patientProfileId,
      },
      'Prescribing medication (draft)',
    );
    return this.em.transactional(async (tx) => {
      const request = this.requestsRepo.create(tx, {
        custodianTenantId: dto.custodianTenantId,
        patientProfileId: dto.patientProfileId,
        encounterId: dto.encounterId,
        medicationConceptId: dto.medicationConceptId,
        substanceAtcConceptId: dto.substanceAtcConceptId,
        intentConceptId: CLIN.MEDICATION_INTENT_ORDER,
        statusConceptId: CLIN.MEDICATION_REQUEST_DRAFT,
        prescriberProfileId: dto.prescriberProfileId,
        doseText: dto.doseText,
        routeConceptId: dto.routeConceptId,
        frequencyText: dto.frequencyText,
        quantityDecimal:
          dto.quantityDecimal !== undefined
            ? String(dto.quantityDecimal)
            : undefined,
        unitConceptId: dto.unitConceptId,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validTo: dto.validTo ? new Date(dto.validTo) : undefined,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        { operation: 'clinical.medication.prescribe', requestId: request.id },
        'Medication prescribed (draft)',
      );
      return this.toRequestResponse(request);
    });
  }

  /**
   * Edita ítems clínicos de una receta. Solo permitido en DRAFT: una receta
   * emitida es inmutable y se rechaza con PreconditionFailed.
   */
  async editDraft(
    requestId: string,
    dto: EditMedicationRequestDraftDto,
    actor: AuthenticatedUser,
  ): Promise<MedicationRequestResponseDto> {
    this.logger.info(
      { operation: 'clinical.medication.editDraft', requestId },
      'Editing medication request draft',
    );
    return this.em.transactional(async (tx) => {
      const request = await this.loadRequestOrThrow(tx, requestId);
      if (request.statusConceptId !== CLIN.MEDICATION_REQUEST_DRAFT) {
        throw new PreconditionFailedException(
          'Solo un borrador (DRAFT) admite edición; una receta emitida es inmutable',
          { requestId, status: request.statusConceptId },
        );
      }

      if (dto.encounterId !== undefined) request.encounterId = dto.encounterId;
      if (dto.medicationConceptId !== undefined)
        request.medicationConceptId = dto.medicationConceptId;
      if (dto.substanceAtcConceptId !== undefined)
        request.substanceAtcConceptId = dto.substanceAtcConceptId;
      if (dto.prescriberProfileId !== undefined)
        request.prescriberProfileId = dto.prescriberProfileId;
      if (dto.doseText !== undefined) request.doseText = dto.doseText;
      if (dto.routeConceptId !== undefined)
        request.routeConceptId = dto.routeConceptId;
      if (dto.frequencyText !== undefined)
        request.frequencyText = dto.frequencyText;
      if (dto.quantityDecimal !== undefined)
        request.quantityDecimal = String(dto.quantityDecimal);
      if (dto.unitConceptId !== undefined)
        request.unitConceptId = dto.unitConceptId;
      if (dto.validFrom !== undefined)
        request.validFrom = new Date(dto.validFrom);
      if (dto.validTo !== undefined) request.validTo = new Date(dto.validTo);
      touch(request, actor.id);
      await tx.flush();

      this.logger.info(
        { operation: 'clinical.medication.editDraft', requestId },
        'Medication request draft edited',
      );
      return this.toRequestResponse(request);
    });
  }

  /**
   * REDESA D-05 / CAN-RX: firma una receta en borrador (DRAFT). Aditivo: registra
   * quién firma y cuándo, sin alterar la máquina de estados. Firmar es idempotente
   * (no re-firma si ya está firmada) y solo se permite antes de emitir.
   */
  async sign(
    requestId: string,
    actor: AuthenticatedUser,
  ): Promise<MedicationRequestResponseDto> {
    this.logger.info(
      { operation: 'clinical.medication.sign', requestId },
      'Signing medication request',
    );
    return this.em.transactional(async (tx) => {
      const request = await this.loadRequestOrThrow(tx, requestId);
      if (request.statusConceptId !== CLIN.MEDICATION_REQUEST_DRAFT) {
        throw new PreconditionFailedException(
          'Solo un borrador (DRAFT) puede firmarse antes de emitirse',
          { requestId, status: request.statusConceptId },
        );
      }
      if (!request.signedAt) {
        request.signedAt = new Date();
        request.signedByUserId = actor.id;
        touch(request, actor.id);
        await tx.flush();
        await this.auditTrail.record(tx, actor, {
          action: 'MEDICATION_SIGNED',
          entity: RX_AUDIT_ENTITY,
          entityId: request.id,
          tenantId: request.custodianTenantId,
        });
      }
      return this.toRequestResponse(request);
    });
  }

  /**
   * CAN-RX: emite la receta (DRAFT → ISSUED) y SELLA su contenido. A partir de
   * aquí es inmutable; toda corrección pasa por invalidate/replace.
   *
   * REDESA D-05: si la política PARAMETRIZABLE de firma vigente exige firma para
   * esta receta y aún no está firmada, se rechaza. FAIL-SAFE: sin política
   * aplicable, `isSignatureRequired` es `false` y la emisión no cambia.
   */
  async issue(
    requestId: string,
    actor: AuthenticatedUser,
    idempotencyKey?: string,
  ): Promise<MedicationRequestResponseDto> {
    this.logger.info(
      { operation: 'clinical.medication.issue', requestId },
      'Issuing medication request',
    );
    return this.em.transactional(async (tx) => {
      const request = await this.loadRequestOrThrow(tx, requestId);
      // CAN §6 (idempotencia): un reintento de la emisión con la MISMA clave sobre
      // una receta ya emitida devuelve el resultado sellado (replay), sin volver a
      // emitir ni fallar. Sin clave o clave distinta, el guard de estado se mantiene.
      if (
        idempotencyKey &&
        request.statusConceptId === CLIN.MEDICATION_REQUEST_ISSUED &&
        request.issueIdempotencyKey === idempotencyKey
      ) {
        return this.toRequestResponse(request);
      }
      if (request.statusConceptId !== CLIN.MEDICATION_REQUEST_DRAFT) {
        throw new PreconditionFailedException(
          'Solo un borrador (DRAFT) puede emitirse',
          { requestId, status: request.statusConceptId },
        );
      }

      // `issue_idempotency_key` es UNIQUE global sobre la tabla: si la clave ya
      // pertenece a OTRA receta (no un replay de esta misma), rechazar aquí con
      // un 409 claro en vez de dejar que el `flush` falle con una violación de
      // restricción cruda.
      if (idempotencyKey) {
        const existing = await this.requestsRepo.findByIssueIdempotencyKey(
          tx,
          idempotencyKey,
        );
        if (existing && existing.id !== request.id) {
          throw new ConflictException(
            'La clave de idempotencia ya fue usada para emitir otra receta',
            { requestId, idempotencyKey },
          );
        }
      }

      if (!request.signedAt) {
        const signatureRequired =
          await this.signaturePolicies.isSignatureRequired(
            request.custodianTenantId,
            { medicationType: request.medicationConceptId },
          );
        if (signatureRequired) {
          throw new PreconditionFailedException(
            'La política vigente exige firmar la receta antes de emitirla',
            { requestId },
          );
        }
      }

      request.statusConceptId = CLIN.MEDICATION_REQUEST_ISSUED;
      request.issuedAt = new Date();
      if (idempotencyKey) request.issueIdempotencyKey = idempotencyKey;
      touch(request, actor.id);
      await tx.flush();

      await this.auditTrail.record(tx, actor, {
        action: 'MEDICATION_ISSUED',
        entity: RX_AUDIT_ENTITY,
        entityId: request.id,
        tenantId: request.custodianTenantId,
      });
      // §2: sella la primera revisión versionada del contenido emitido.
      await this.historyRepo.append(tx, RX_HISTORY_ENTITY, request.id, {
        operationConceptId: AUD.OPERATION_INSERT,
        dataSnapshot: this.snapshot(request),
        changedByUserId: actor.id,
      });

      this.logger.info(
        {
          operation: 'clinical.medication.issue',
          requestId,
          issuedAt: request.issuedAt,
        },
        'Medication request issued (sealed, immutable)',
      );
      return this.toRequestResponse(request);
    });
  }

  /**
   * CAN-RX: invalida una receta emitida (motivo obligatorio). Queda inutilizable
   * pero se conserva (INVALIDATED); no se borra.
   */
  async invalidate(
    requestId: string,
    dto: InvalidateMedicationRequestDto,
    actor: AuthenticatedUser,
  ): Promise<MedicationRequestResponseDto> {
    this.logger.info(
      { operation: 'clinical.medication.invalidate', requestId },
      'Invalidating medication request',
    );
    return this.em.transactional(async (tx) => {
      const request = await this.loadRequestOrThrow(tx, requestId);
      if (request.statusConceptId !== CLIN.MEDICATION_REQUEST_ISSUED) {
        throw new PreconditionFailedException(
          'Solo una receta emitida (ISSUED) puede invalidarse',
          { requestId, status: request.statusConceptId },
        );
      }
      request.statusConceptId = CLIN.MEDICATION_REQUEST_INVALIDATED;
      request.statusReasonText = dto.reasonText;
      touch(request, actor.id);
      await tx.flush();

      await this.auditTrail.record(tx, actor, {
        action: 'MEDICATION_INVALIDATED',
        entity: RX_AUDIT_ENTITY,
        entityId: request.id,
        tenantId: request.custodianTenantId,
      });
      await this.historyRepo.append(tx, RX_HISTORY_ENTITY, request.id, {
        operationConceptId: AUD.OPERATION_UPDATE,
        dataSnapshot: this.snapshot(request),
        changedByUserId: actor.id,
      });

      this.logger.info(
        {
          operation: 'clinical.medication.invalidate',
          requestId,
          reason: dto.reasonText,
        },
        'Medication request invalidated',
      );
      return this.toRequestResponse(request);
    });
  }

  /**
   * CAN-RX: reemplaza una receta emitida. La original queda REPLACED (con motivo
   * y `replaced_by`) y se crea una NUEVA receta en DRAFT que la corrige, enlazada
   * con `replaces`. Devuelve la NUEVA receta.
   */
  async replace(
    requestId: string,
    dto: ReplaceMedicationRequestDto,
    actor: AuthenticatedUser,
  ): Promise<MedicationRequestResponseDto> {
    this.logger.info(
      { operation: 'clinical.medication.replace', requestId },
      'Replacing medication request',
    );
    return this.em.transactional(async (tx) => {
      const original = await this.loadRequestOrThrow(tx, requestId);
      if (original.statusConceptId !== CLIN.MEDICATION_REQUEST_ISSUED) {
        throw new PreconditionFailedException(
          'Solo una receta emitida (ISSUED) puede reemplazarse',
          { requestId, status: original.statusConceptId },
        );
      }

      const replacement = this.requestsRepo.create(tx, {
        custodianTenantId: original.custodianTenantId,
        patientProfileId: original.patientProfileId,
        encounterId: original.encounterId,
        medicationConceptId:
          dto.medicationConceptId ?? original.medicationConceptId,
        substanceAtcConceptId:
          dto.substanceAtcConceptId ?? original.substanceAtcConceptId,
        intentConceptId: original.intentConceptId,
        statusConceptId: CLIN.MEDICATION_REQUEST_DRAFT,
        prescriberProfileId: original.prescriberProfileId,
        doseText: dto.doseText ?? original.doseText,
        routeConceptId: dto.routeConceptId ?? original.routeConceptId,
        frequencyText: dto.frequencyText ?? original.frequencyText,
        quantityDecimal:
          dto.quantityDecimal !== undefined
            ? String(dto.quantityDecimal)
            : original.quantityDecimal,
        unitConceptId: dto.unitConceptId ?? original.unitConceptId,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : original.validFrom,
        validTo: dto.validTo ? new Date(dto.validTo) : original.validTo,
        replacesRequestId: original.id,
        actorUserId: actor.id,
      });
      await tx.flush();

      original.statusConceptId = CLIN.MEDICATION_REQUEST_REPLACED;
      original.statusReasonText = dto.reasonText;
      original.replacedByRequestId = replacement.id;
      touch(original, actor.id);
      await tx.flush();

      await this.auditTrail.record(tx, actor, {
        action: 'MEDICATION_REPLACED',
        entity: RX_AUDIT_ENTITY,
        entityId: original.id,
        tenantId: original.custodianTenantId,
      });
      await this.historyRepo.append(tx, RX_HISTORY_ENTITY, original.id, {
        operationConceptId: AUD.OPERATION_UPDATE,
        dataSnapshot: this.snapshot(original),
        changedByUserId: actor.id,
      });

      this.logger.info(
        {
          operation: 'clinical.medication.replace',
          requestId,
          replacementId: replacement.id,
          reason: dto.reasonText,
        },
        'Medication request replaced',
      );
      return this.toRequestResponse(replacement);
    });
  }

  /**
   * CAN-RX: renueva una receta emitida/completada creando una NUEVA receta en
   * DRAFT que copia sus datos clínicos (enlazada con `renewed_from`). La original
   * NO se modifica. Devuelve la NUEVA receta.
   */
  async renew(
    requestId: string,
    dto: RenewMedicationRequestDto,
    actor: AuthenticatedUser,
  ): Promise<MedicationRequestResponseDto> {
    this.logger.info(
      { operation: 'clinical.medication.renew', requestId },
      'Renewing medication request',
    );
    return this.em.transactional(async (tx) => {
      const source = await this.loadRequestOrThrow(tx, requestId);
      const renewable = [
        CLIN.MEDICATION_REQUEST_ISSUED,
        CLIN.MEDICATION_REQUEST_COMPLETED,
      ];
      if (!renewable.includes(source.statusConceptId)) {
        throw new PreconditionFailedException(
          'Solo una receta emitida o completada puede renovarse',
          { requestId, status: source.statusConceptId },
        );
      }

      const renewal = this.requestsRepo.create(tx, {
        custodianTenantId: source.custodianTenantId,
        patientProfileId: source.patientProfileId,
        encounterId: source.encounterId,
        medicationConceptId: source.medicationConceptId,
        substanceAtcConceptId: source.substanceAtcConceptId,
        intentConceptId: source.intentConceptId,
        statusConceptId: CLIN.MEDICATION_REQUEST_DRAFT,
        prescriberProfileId: source.prescriberProfileId,
        doseText: dto.doseText ?? source.doseText,
        routeConceptId: source.routeConceptId,
        frequencyText: dto.frequencyText ?? source.frequencyText,
        quantityDecimal:
          dto.quantityDecimal !== undefined
            ? String(dto.quantityDecimal)
            : source.quantityDecimal,
        unitConceptId: source.unitConceptId,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validTo: dto.validTo ? new Date(dto.validTo) : undefined,
        renewedFromRequestId: source.id,
        actorUserId: actor.id,
      });
      await tx.flush();

      await this.auditTrail.record(tx, actor, {
        action: 'MEDICATION_RENEWED',
        entity: RX_AUDIT_ENTITY,
        entityId: renewal.id,
        tenantId: source.custodianTenantId,
      });

      this.logger.info(
        {
          operation: 'clinical.medication.renew',
          requestId,
          renewalId: renewal.id,
        },
        'Medication request renewed',
      );
      return this.toRequestResponse(renewal);
    });
  }

  /** UC-08-11: registra la administración de una medicación. */
  async administer(
    dto: CreateMedicationRecordDto,
    actor: AuthenticatedUser,
  ): Promise<MedicationRecordResponseDto> {
    this.logger.info(
      {
        operation: 'clinical.medication.administer',
        patientProfileId: dto.patientProfileId,
      },
      'Recording medication administration',
    );
    return this.em.transactional(async (tx) => {
      if (dto.requestId) {
        const request = await this.requestsRepo.findById(tx, dto.requestId);
        if (!request) {
          throw new ResourceNotFoundException('Prescripción no encontrada', {
            requestId: dto.requestId,
          });
        }
        // Solo se dispensa contra una receta emitida (sellada). Un borrador aún
        // no surte efecto; una invalidada/reemplazada/completada no es dispensable.
        if (request.statusConceptId !== CLIN.MEDICATION_REQUEST_ISSUED) {
          throw new PreconditionFailedException(
            'La prescripción no está emitida (ISSUED)',
            {
              requestId: dto.requestId,
              status: request.statusConceptId,
            },
          );
        }
        if (dto.isFinalDose) {
          request.statusConceptId = CLIN.MEDICATION_REQUEST_COMPLETED;
          touch(request, actor.id);
        }
      }

      const record = this.recordsRepo.create(tx, {
        custodianTenantId: dto.custodianTenantId,
        patientProfileId: dto.patientProfileId,
        requestId: dto.requestId,
        medicationConceptId: dto.medicationConceptId,
        statusConceptId: CLIN.MEDICATION_RECORD_COMPLETED,
        recordTypeConceptId: CLIN.MEDICATION_RECORD_TYPE_ADMINISTRATION,
        doseDecimal:
          dto.doseDecimal !== undefined ? String(dto.doseDecimal) : undefined,
        unitConceptId: dto.unitConceptId,
        administeredAt: dto.administeredAt
          ? new Date(dto.administeredAt)
          : new Date(),
        recordedByUserId: actor.id,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        { operation: 'clinical.medication.administer', recordId: record.id },
        'Medication administration recorded',
      );
      return {
        id: record.id,
        patientProfileId: record.patientProfileId,
        status: record.statusConceptId,
        requestId: record.requestId ?? null,
        createdAt: record.createdAt,
      };
    });
  }
}
