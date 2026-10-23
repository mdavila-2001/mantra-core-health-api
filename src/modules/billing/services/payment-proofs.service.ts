import {
  ForbiddenException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { UniqueConstraintViolationException } from '@mikro-orm/core';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  DomainException,
  ErrorCode,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { AuditTrailService } from '../../audit/services';
import { NotificationsService } from '../../messaging/services';
import { PROF } from '../../profiles/profiles.concepts';
import { BILL } from '../billing.concepts';
import { chargeSettlement, type ChargeSettlement } from '../charge-settlement';
import {
  PATIENT_SHARE_PORT,
  type PatientSharePort,
  type PatientShareResult,
} from '../patient-share.port';
import type {
  ChargePaymentStatus,
  PaymentContextView,
  PaymentProofMethod,
  PaymentProofStatus,
  PaymentProofView,
  PaymentSiteView,
  ProviderPaymentRow,
  ProviderPaymentTablePage,
} from '../payment-proofs.types';
import {
  operatingScope,
  type OperatingScope,
} from '../billing-simulated.access';
import { PaymentProofsRepository } from '../repositories';
import { PaymentProofs } from '../entities';
import type {
  CreatePaymentProofDto,
  ProviderPaymentTableQueryDto,
  RejectPaymentProofDto,
} from '../dto';
import { BillingSimulatedService } from './billing-simulated.service';

type Row = Record<string, string | number | Date | null | undefined>;

const METHOD_CONCEPT: Readonly<Record<PaymentProofMethod, string>> = {
  QR_TRANSFER: BILL.METHOD_QR_TRANSFER,
  CASH: BILL.METHOD_CASH,
};
const CONCEPT_METHOD: Readonly<Record<string, PaymentProofMethod>> = {
  [BILL.METHOD_QR_TRANSFER]: 'QR_TRANSFER',
  [BILL.METHOD_CASH]: 'CASH',
};
const CONCEPT_STATUS: Readonly<Record<string, PaymentProofStatus>> = {
  [BILL.PROOF_PENDING_REVIEW]: 'PENDING_REVIEW',
  [BILL.PROOF_ACCEPTED]: 'ACCEPTED',
  [BILL.PROOF_REJECTED]: 'REJECTED',
};
/** Código del catálogo SIMULADO de métodos de pago con el que se salda la cuenta. */
const SIMULATED_METHOD_CODE: Readonly<Record<PaymentProofMethod, number>> = {
  CASH: 1,
  QR_TRANSFER: 3,
};
const DEFAULT_PAGE = 20;

/**
 * C-01 · Comprobantes de pago del paciente.
 *
 * - El PACIENTE ve el contexto de pago de SU cargo (monto, su parte según el
 *   seguro, el QR de la sede) y sube un comprobante o declara efectivo.
 * - El MÉDICO (o la administración) ve los comprobantes de SUS consultas y los
 *   acepta o rechaza con motivo. Aceptar salda la cuenta por cobrar real.
 * - Fuera del alcance del actor, 404: no se revela que el cargo exista.
 *
 * El cargo ES el encuentro (`clinical.encounters`), ver `charge-settlement.ts`.
 */
@Injectable()
export class PaymentProofsService {
  constructor(
    private readonly em: EntityManager,
    private readonly proofs: PaymentProofsRepository,
    private readonly simulated: BillingSimulatedService,
    private readonly auditTrail: AuditTrailService,
    private readonly notifications: NotificationsService,
    @Inject(PATIENT_SHARE_PORT)
    private readonly patientShare: PatientSharePort,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PaymentProofsService.name);
  }

  // ---- paciente -------------------------------------------------------------

  async paymentContext(
    user: AuthenticatedUser,
    chargeId: string,
  ): Promise<PaymentContextView> {
    const patientProfileId = this.patientOf(user);
    const charge = await this.ownChargeOrThrow(patientProfileId, chargeId);
    const [share, site, proofs] = await Promise.all([
      this.shareOf(charge),
      this.siteOf(charge),
      this.proofs.listByEncounter(this.em.fork(), charge.encounterId),
    ]);
    const views = proofs.map((p) => this.toView(p));
    return {
      chargeId: charge.encounterId,
      amountMinor: charge.amountMinor,
      currency: charge.currency,
      status: this.statusOf(charge),
      patientShare: share,
      site,
      proofs: views,
      latestProof: views[0] ?? null,
    };
  }

  async createProof(
    user: AuthenticatedUser,
    chargeId: string,
    dto: CreatePaymentProofDto,
  ): Promise<{ id: string; status: 'PENDING_REVIEW' }> {
    const patientProfileId = this.patientOf(user);
    const charge = await this.ownChargeOrThrow(patientProfileId, chargeId);
    if (charge.paid) {
      throw new ConflictException('El cargo ya está pagado', {
        reason: 'ALREADY_PAID',
      });
    }
    if (dto.method === 'QR_TRANSFER' && dto.fileId === undefined) {
      throw new DomainException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.VALIDATION_FAILED,
        'Una transferencia por QR necesita la captura del comprobante',
        { reason: 'FILE_REQUIRED', field: 'fileId' },
      );
    }
    if (dto.fileId !== undefined) {
      await this.assertOwnFile(dto.fileId, user);
    }
    const pending = await this.proofs.findPending(
      this.em.fork(),
      charge.encounterId,
    );
    if (pending !== null) {
      throw new ConflictException(
        'Ya hay un comprobante pendiente de revisión para este cargo',
        { reason: 'PROOF_ALREADY_PENDING', proofId: pending.id },
      );
    }
    const site = await this.siteOf(charge);
    try {
      const created = await this.em.transactional(async (tx) => {
        const proof = this.proofs.create(tx, {
          encounterId: charge.encounterId,
          tenantId: charge.tenantId,
          patientProfileId,
          practiceSiteId: site?.id,
          methodConceptId: METHOD_CONCEPT[dto.method],
          fileId: dto.fileId,
          amountMinor: dto.amountMinor,
          currency: charge.currency,
          actorUserId: user.id,
        });
        await tx.flush();
        await this.auditTrail.record(tx, user, {
          action: 'PAYMENT_PROOF_SUBMITTED',
          entity: 'payment_proof',
          entityId: proof.id,
          tenantId: charge.tenantId,
        });
        return proof;
      });
      this.logger.info(
        {
          operation: 'billing.paymentProof.create',
          chargeId: charge.encounterId,
          proofId: created.id,
          method: dto.method,
        },
        'Payment proof submitted',
      );
      return { id: created.id, status: 'PENDING_REVIEW' };
    } catch (error) {
      // Carrera entre dos envíos: el índice único parcial decide y el segundo
      // recibe el mismo 409 que si hubiera llegado un segundo después.
      if (error instanceof UniqueConstraintViolationException) {
        throw new ConflictException(
          'Ya hay un comprobante pendiente de revisión para este cargo',
          { reason: 'PROOF_ALREADY_PENDING' },
        );
      }
      throw error;
    }
  }

  // ---- médico / administración ---------------------------------------------

  async listForCharge(
    user: AuthenticatedUser,
    chargeId: string,
  ): Promise<{
    chargeId: string;
    status: ChargePaymentStatus;
    amountMinor: number;
    currency: string;
    items: PaymentProofView[];
  }> {
    const scope = this.scopeOf(user);
    const charge = await this.chargeInScopeOrThrow(scope, chargeId);
    const items = await this.proofs.listByEncounter(
      this.em.fork(),
      charge.encounterId,
    );
    return {
      chargeId: charge.encounterId,
      status: this.statusOf(charge),
      amountMinor: charge.amountMinor,
      currency: charge.currency,
      items: items.map((p) => this.toView(p)),
    };
  }

  async accept(
    user: AuthenticatedUser,
    proofId: string,
  ): Promise<{
    id: string;
    status: 'ACCEPTED';
    chargeStatus: ChargePaymentStatus;
  }> {
    const scope = this.scopeOf(user);
    const proof = await this.proofInScopeOrThrow(scope, proofId);
    const method = CONCEPT_METHOD[proof.methodConceptId] ?? 'CASH';

    // 1) La transición, con la precondición en el UPDATE: una sola gana.
    await this.em.transactional(async (tx) => {
      const ok = await this.proofs.review(tx, proof.id, {
        statusConceptId: BILL.PROOF_ACCEPTED,
        reviewedByUserId: user.id,
      });
      if (!ok) {
        throw new ConflictException('El comprobante ya fue revisado', {
          reason: 'PROOF_NOT_PENDING',
          proofId: proof.id,
        });
      }
      await this.auditTrail.record(tx, user, {
        action: 'PAYMENT_PROOF_ACCEPTED',
        entity: 'payment_proof',
        entityId: proof.id,
        tenantId: proof.tenantId,
      });
    });

    // 2) La cuenta por cobrar real queda saldada. Si falla, el comprobante
    //    vuelve a pendiente: no queda «aceptado» sin pago registrado.
    try {
      await this.simulated.settleFromProof(
        user,
        proof.encounterId,
        SIMULATED_METHOD_CODE[method],
        proof.id,
      );
    } catch (error) {
      await this.proofs.revertToPending(this.em.fork(), proof.id, user.id);
      this.logger.warn(
        {
          operation: 'billing.paymentProof.accept',
          proofId: proof.id,
          chargeId: proof.encounterId,
          err: error instanceof Error ? error.message : String(error),
        },
        'Settlement failed after accepting the proof; proof reverted to pending',
      );
      throw error;
    }

    const charge = await chargeSettlement(this.em.fork(), proof.encounterId);
    await this.notifyPatient(proof, user, 'ACCEPTED', null);
    this.logger.info(
      {
        operation: 'billing.paymentProof.accept',
        proofId: proof.id,
        chargeId: proof.encounterId,
      },
      'Payment proof accepted',
    );
    return {
      id: proof.id,
      status: 'ACCEPTED',
      chargeStatus: charge === null ? 'PAID' : this.statusOf(charge),
    };
  }

  async reject(
    user: AuthenticatedUser,
    proofId: string,
    dto: RejectPaymentProofDto,
  ): Promise<{
    id: string;
    status: 'REJECTED';
    chargeStatus: ChargePaymentStatus;
  }> {
    const scope = this.scopeOf(user);
    const proof = await this.proofInScopeOrThrow(scope, proofId);
    const reason = dto.reason.trim();
    await this.em.transactional(async (tx) => {
      const ok = await this.proofs.review(tx, proof.id, {
        statusConceptId: BILL.PROOF_REJECTED,
        reviewedByUserId: user.id,
        rejectionReason: reason,
      });
      if (!ok) {
        throw new ConflictException('El comprobante ya fue revisado', {
          reason: 'PROOF_NOT_PENDING',
          proofId: proof.id,
        });
      }
      await this.auditTrail.record(tx, user, {
        action: 'PAYMENT_PROOF_REJECTED',
        entity: 'payment_proof',
        entityId: proof.id,
        tenantId: proof.tenantId,
      });
    });
    const charge = await chargeSettlement(this.em.fork(), proof.encounterId);
    await this.notifyPatient(proof, user, 'REJECTED', reason);
    this.logger.info(
      {
        operation: 'billing.paymentProof.reject',
        proofId: proof.id,
        chargeId: proof.encounterId,
      },
      'Payment proof rejected',
    );
    return {
      id: proof.id,
      status: 'REJECTED',
      chargeStatus: charge === null ? 'PENDING' : this.statusOf(charge),
    };
  }

  /**
   * Q-P3 · La tabla de pagos del prestador: sus sesiones del período, con
   * monto, parte del paciente, parte del seguro, estado y comprobante.
   * Paginada por cursor (`start_at DESC, id DESC`), determinista.
   */
  async providerPaymentTable(
    user: AuthenticatedUser,
    query: ProviderPaymentTableQueryDto,
  ): Promise<ProviderPaymentTablePage> {
    const scope = this.scopeOf(user);
    const limit = query.limit ?? DEFAULT_PAGE;
    const where: string[] = [];
    const params: unknown[] = [];
    if (scope.kind === 'practitioner') {
      where.push('e.primary_practitioner_id = ?');
      params.push(scope.practitionerProfileId);
    } else if (scope.tenantIds !== null) {
      if (scope.tenantIds.length === 0) {
        return {
          items: [],
          nextCursor: null,
          totals: {
            sessions: 0,
            amountMinor: 0,
            paidMinor: 0,
            pendingMinor: 0,
          },
        };
      }
      where.push('e.tenant_id IN (?)');
      params.push([...scope.tenantIds]);
    }
    if (query.from !== undefined) {
      where.push('e.start_at >= ?');
      params.push(new Date(query.from));
    }
    if (query.to !== undefined) {
      where.push('e.start_at < ?');
      params.push(new Date(query.to));
    }
    const cursor = this.decodeCursor(query.cursor);
    if (cursor !== null) {
      where.push('(e.start_at < ? OR (e.start_at = ? AND e.id < ?))');
      params.push(cursor.startAt, cursor.startAt, cursor.id);
    }
    const rows = await this.q(
      `SELECT e.id, e.start_at AS "startAt", e.patient_profile_id AS "patientProfileId",
              COALESCE(pe.display_name, NULLIF(TRIM(CONCAT(pe.name, ' ', pe.last_name)), ''), 'Paciente') AS "patientName",
              inv.id AS "receivableId", inv.total::text AS total, inv.balance::text AS balance,
              cat.default_price::text AS "catalogPrice",
              pp.id AS "proofId",
              (SELECT COUNT(*) FROM billing.siat_simulated_invoices s
                WHERE s.encounter_id = e.id AND s.status IN ('VALIDATED','OBSERVED')) AS "invoices"
         FROM clinical.encounters e
         LEFT JOIN profiles.persons pe ON pe.id = e.patient_profile_id
         -- La práctica del cargo es la del médico que atiende (su asignación
         -- vigente, la primaria primero); sólo sin ninguna, la primera del tenant.
         -- Los médicos independientes comparten el tenant por defecto.
         LEFT JOIN LATERAL (SELECT ra.practice_id FROM practice.practitioner_role_assignments ra
                             WHERE ra.practitioner_profile_id = e.primary_practitioner_id
                               AND ra.valid_to IS NULL
                             ORDER BY ra.is_primary DESC NULLS LAST, ra.created_at, ra.id LIMIT 1) own ON TRUE
         LEFT JOIN LATERAL (SELECT p.id FROM practice.practices p
                             WHERE p.id = own.practice_id
                                OR (own.practice_id IS NULL AND p.tenant_id = e.tenant_id)
                             ORDER BY p.created_at, p.id LIMIT 1) pr ON TRUE
         LEFT JOIN LATERAL (SELECT i.id, i.total, i.balance FROM billing.invoices i
                             WHERE i.encounter_id = e.id AND i.status_concept_id <> ?
                             ORDER BY i.created_at DESC LIMIT 1) inv ON TRUE
         LEFT JOIN LATERAL (SELECT sc.default_price FROM billing.service_catalog sc
                             WHERE sc.practice_id = pr.id AND sc.is_active IS NOT FALSE
                             ORDER BY (sc.code = 'CITA_MEDICA') DESC, sc.default_price DESC NULLS LAST, sc.code
                             LIMIT 1) cat ON TRUE
         LEFT JOIN LATERAL (SELECT x.id FROM billing.payment_proofs x WHERE x.encounter_id = e.id
                             ORDER BY (x.status_concept_id = ?) DESC, x.created_at DESC LIMIT 1) pp ON TRUE
        ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
        ORDER BY e.start_at DESC NULLS LAST, e.id DESC
        LIMIT ${limit + 1}`,
      [BILL.INVOICE_CREDIT_NOTE, BILL.PROOF_ACCEPTED, ...params],
    );
    const page = rows.slice(0, limit);
    const proofIds = page
      .map((r) => r['proofId'])
      .filter((id): id is string => typeof id === 'string');
    const proofRows = proofIds.length
      ? await this.em.fork().find(PaymentProofs, { id: { $in: proofIds } })
      : [];
    const proofById = new Map(proofRows.map((p) => [p.id, this.toView(p)]));

    const items: ProviderPaymentRow[] = [];
    const totals = {
      sessions: 0,
      amountMinor: 0,
      paidMinor: 0,
      pendingMinor: 0,
    };
    for (const r of page) {
      const total =
        r['total'] === null || r['total'] === undefined
          ? null
          : this.cents(String(r['total']));
      const amountMinor = total ?? this.cents(String(r['catalogPrice'] ?? '0'));
      const balance = this.cents(String(r['balance'] ?? '0'));
      const proof =
        typeof r['proofId'] === 'string'
          ? (proofById.get(r['proofId']) ?? null)
          : null;
      const paid =
        (total !== null && total > 0 && balance === 0) ||
        proof?.status === 'ACCEPTED';
      const status: ChargePaymentStatus =
        amountMinor === 0 ? 'NOT_PRICED' : paid ? 'PAID' : 'PENDING';
      const share = await this.patientShare.compute({
        patientProfileId: String(r['patientProfileId']),
        serviceConceptId: null,
        amountMinor,
        currency: 'BOB',
        context: 'CONSULTATION',
        itemRef: String(r['id']),
      });
      totals.sessions += 1;
      totals.amountMinor += amountMinor;
      if (status === 'PAID') totals.paidMinor += amountMinor;
      if (status === 'PENDING') totals.pendingMinor += amountMinor;
      items.push({
        chargeId: String(r['id']),
        startAt: this.iso(r['startAt']),
        patientProfileId: String(r['patientProfileId']),
        patientName: String(r['patientName']),
        amountMinor,
        currency: 'BOB',
        patientAmountMinor: share.patientAmountMinor,
        insurerAmountMinor: share.insurerAmountMinor,
        coverageStatus: share.approval.status,
        status,
        proof,
        invoiced: Number(r['invoices'] ?? 0) > 0,
      });
    }
    const last = rows.length > limit ? page[page.length - 1] : undefined;
    return {
      items,
      nextCursor:
        last === undefined
          ? null
          : this.encodeCursor(this.iso(last['startAt']), String(last['id'])),
      totals,
    };
  }

  // ---- alcance --------------------------------------------------------------

  private patientOf(user: AuthenticatedUser): string {
    if (
      user.patientProfileId === undefined ||
      !user.roles.includes('PATIENT')
    ) {
      throw new ForbiddenException('Sólo el paciente paga sus consultas');
    }
    return user.patientProfileId;
  }

  private scopeOf(user: AuthenticatedUser): OperatingScope {
    const scope = operatingScope(user);
    if (scope === null) {
      throw new ForbiddenException('Su rol no permite revisar comprobantes');
    }
    return scope;
  }

  private async ownChargeOrThrow(
    patientProfileId: string,
    chargeId: string,
  ): Promise<ChargeSettlement> {
    const charge = await chargeSettlement(this.em.fork(), chargeId);
    if (charge === null || charge.patientProfileId !== patientProfileId) {
      throw new ResourceNotFoundException('El cargo no existe');
    }
    return charge;
  }

  private async chargeInScopeOrThrow(
    scope: OperatingScope,
    chargeId: string,
  ): Promise<ChargeSettlement> {
    const charge = await chargeSettlement(this.em.fork(), chargeId);
    if (charge === null || !this.inScope(scope, charge)) {
      throw new ResourceNotFoundException('El cargo no existe');
    }
    return charge;
  }

  private async proofInScopeOrThrow(
    scope: OperatingScope,
    proofId: string,
  ): Promise<PaymentProofs> {
    if (!/^[0-9a-f-]{36}$/i.test(proofId)) {
      throw new ResourceNotFoundException('El comprobante no existe');
    }
    const proof = await this.proofs.findById(this.em.fork(), proofId);
    if (proof === null) {
      throw new ResourceNotFoundException('El comprobante no existe');
    }
    await this.chargeInScopeOrThrow(scope, proof.encounterId);
    return proof;
  }

  private inScope(scope: OperatingScope, charge: ChargeSettlement): boolean {
    if (scope.kind === 'practitioner') {
      return charge.practitionerProfileId === scope.practitionerProfileId;
    }
    if (scope.tenantIds === null) return true;
    return scope.tenantIds.includes(charge.tenantId);
  }

  // ---- lecturas auxiliares --------------------------------------------------

  private async assertOwnFile(
    fileId: string,
    user: AuthenticatedUser,
  ): Promise<void> {
    const rows = await this.q(
      `SELECT created_by_user_id AS "owner" FROM common.files
        WHERE id = ? AND deleted_at IS NULL`,
      [fileId],
    );
    const owner = rows[0]?.['owner'];
    if (
      rows.length === 0 ||
      (owner !== null && owner !== undefined && String(owner) !== user.id)
    ) {
      throw new DomainException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.VALIDATION_FAILED,
        'El archivo del comprobante no existe o no es suyo',
        { reason: 'FILE_NOT_OWNED', field: 'fileId' },
      );
    }
  }

  private async siteOf(
    charge: ChargeSettlement,
  ): Promise<PaymentSiteView | null> {
    const rows = await this.q(
      `SELECT ps.id, ps.name, ps.bank_qr_file_id AS "bankQrFileId"
         FROM practice.practice_sites ps
        WHERE (ps.branch_id = ? AND ? IS NOT NULL) OR ps.practice_id = ?
        ORDER BY (ps.branch_id = ?) DESC NULLS LAST, ps.created_at, ps.id
        LIMIT 1`,
      [charge.branchId, charge.branchId, charge.practiceId, charge.branchId],
    );
    const r = rows[0];
    if (r === undefined) return null;
    return {
      id: String(r['id']),
      name: String(r['name']),
      bankQrFileId:
        r['bankQrFileId'] === null ? null : String(r['bankQrFileId']),
    };
  }

  private shareOf(charge: ChargeSettlement): Promise<PatientShareResult> {
    return this.patientShare.compute({
      patientProfileId: charge.patientProfileId,
      serviceConceptId: null,
      amountMinor: charge.amountMinor,
      currency: charge.currency,
      context: 'CONSULTATION',
      itemRef: charge.encounterId,
    });
  }

  private statusOf(charge: ChargeSettlement): ChargePaymentStatus {
    if (charge.amountMinor === 0) return 'NOT_PRICED';
    return charge.paid ? 'PAID' : 'PENDING';
  }

  /** Campana + mensaje interno al paciente (M9). Un aviso que falla no deshace la revisión. */
  private async notifyPatient(
    proof: PaymentProofs,
    actor: AuthenticatedUser,
    outcome: 'ACCEPTED' | 'REJECTED',
    reason: string | null,
  ): Promise<void> {
    try {
      const rows = await this.q(
        `SELECT user_id AS "userId" FROM profiles.person_account_links
          WHERE person_id = ? AND status_concept_id = ?
          ORDER BY created_at LIMIT 1`,
        [proof.patientProfileId, PROF.ACCOUNT_LINK_ACTIVE],
      );
      const recipientUserId = rows[0]?.['userId'];
      if (typeof recipientUserId !== 'string') return;
      const monto = `${(Number(proof.amountMinor) / 100).toFixed(2)} ${proof.currency}`;
      await this.notifications.emitInApp({
        recipientUserId,
        category: 'CLINICAL',
        subject:
          outcome === 'ACCEPTED'
            ? 'Tu pago fue confirmado'
            : 'Tu comprobante fue rechazado',
        bodyText:
          outcome === 'ACCEPTED'
            ? `El consultorio confirmó tu pago de ${monto}. La consulta ya puede cerrarse y facturarse.`
            : `El consultorio rechazó tu comprobante de ${monto}. Motivo: ${reason ?? 'sin detalle'}. Podés subir otro.`,
        // Sin `destination` a propósito: la bandeja colapsa un aviso con el de
        // otro aún sin leer que apunte al mismo objeto, y «pagado» quedaría
        // tapado por un «rechazado» anterior sin leer. El aviso se basta con
        // su texto; el cargo viaja en el payload para quien quiera abrirlo.
        payloadJson: {
          kind: 'PAYMENT_PROOF_REVIEWED',
          outcome,
          chargeId: proof.encounterId,
          proofId: proof.id,
        },
        tenantId: proof.tenantId,
        debounceKey: `payment-proof:${proof.id}:${outcome}`,
        actorUserId: actor.id,
      });
    } catch (error) {
      this.logger.warn(
        {
          operation: 'billing.paymentProof.notify',
          proofId: proof.id,
          err: error instanceof Error ? error.message : String(error),
        },
        'Payment proof notice could not be delivered',
      );
    }
  }

  private toView(p: PaymentProofs): PaymentProofView {
    return {
      id: p.id,
      chargeId: p.encounterId,
      patientProfileId: p.patientProfileId,
      method: CONCEPT_METHOD[p.methodConceptId] ?? 'CASH',
      fileId: p.fileId ?? null,
      amountMinor: Number(p.amountMinor),
      currency: p.currency,
      status: CONCEPT_STATUS[p.statusConceptId] ?? 'PENDING_REVIEW',
      rejectionReason: p.rejectionReason ?? null,
      reviewedAt: p.reviewedAt ? p.reviewedAt.toISOString() : null,
      reviewedByUserId: p.reviewedByUserId ?? null,
      createdAt: p.createdAt.toISOString(),
    };
  }

  private q(sql: string, params: unknown[]): Promise<Row[]> {
    return this.em.fork().getConnection().execute<Row[]>(sql, params);
  }

  private cents(valor: string): number {
    const n = Number(valor);
    return Number.isFinite(n) ? Math.round(n * 100) : 0;
  }

  private iso(valor: unknown): string {
    return valor instanceof Date
      ? valor.toISOString()
      : new Date(String(valor)).toISOString();
  }

  private encodeCursor(startAt: string, id: string): string {
    return Buffer.from(`${startAt}|${id}`, 'utf8').toString('base64url');
  }

  private decodeCursor(
    cursor: string | undefined,
  ): { startAt: Date; id: string } | null {
    if (cursor === undefined || cursor === '') return null;
    const raw = Buffer.from(cursor, 'base64url').toString('utf8');
    const [startAt, id] = raw.split('|');
    const fecha = new Date(startAt ?? '');
    if (Number.isNaN(fecha.getTime()) || !/^[0-9a-f-]{36}$/i.test(id ?? '')) {
      throw new DomainException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_FAILED,
        'Cursor inválido',
        { field: 'cursor' },
      );
    }
    return { startAt: fecha, id: id };
  }
}
