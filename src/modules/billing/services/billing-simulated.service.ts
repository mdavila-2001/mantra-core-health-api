/* ============================================================================
    Facturación SIAT SIMULADA (`/billing/simulated/*`) sobre el modelo REAL de
    billing.

    - Un COBRO es la consulta (`clinical.encounters`): su id es el del encuentro.
      Su cuenta por cobrar es una `billing.invoices` con `encounter_id`; si
      todavía no existe, se materializa con `InvoicesService.issueFromEncounter`
      al cobrar, al precio del catálogo de servicios de la práctica.
    - El PAGO es un `billing.payments_received` con su asignación, aplicado con
      `PaymentsReceivedService.apply` (la factura pasa a PAGADA).
    - La FACTURA fiscal es una fila de `billing.siat_simulated_invoices`
      colgada de la cuenta por cobrar. CUIS/CUFD/CUF/XML son sintéticos y
      deterministas (ver `siat-simulated.engine.ts`); nada sale a la red.
    - Una factura fiscal anulada NO genera nota de crédito contable: la
      simulación es sólo fiscal.
    ========================================================================== */

import { ForbiddenException, HttpStatus, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import {
  ConflictException,
  DomainException,
  ErrorCode,
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { BILL } from '../billing.concepts';
import { fromCents, toCents } from '../money.util';
import {
  isAdminScope,
  myInvoicesScope,
  operatingScope,
  type OperatingScope,
} from '../billing-simulated.access';
import type {
  ChargeLineView,
  MyInvoiceItemView,
  SimulatedChargeView,
  SimulatedInvoiceSummaryView,
  SimulatedInvoiceView,
  SimulatedOutboxEntryView,
  SimulatedPaymentView,
} from '../billing-simulated.types';
import {
  SimulatedAnnulDto,
  SimulatedEmailDto,
  SimulatedIssueInvoiceDto,
  SimulatedInstancePaymentDto,
} from '../dto';
import { InvoicesService } from './invoices.service';
import { PaymentsReceivedService } from './payments-received.service';
import {
  FORCEABLE_MESSAGES,
  boliviaTime,
  buildSimulatedInvoice,
  cents,
  eventOfResponse,
  importe,
  lineSubtotal,
  mensaje,
  siatResponse,
  simulatedCredentials,
  simulatedIssuer,
  type InvoiceEvent,
  type SiatResponse,
  type SimulatedInvoiceStatus,
  type SimulatedIssuerView,
} from '../siat-simulated/siat-simulated.engine';
import {
  SIAT_MESSAGE,
  SIAT_MESSAGE_DESCRIPTION,
  SIAT_STATUS,
  isWarning,
} from '../siat-simulated/siat-codes';
import {
  SIMULATED_CATALOGS,
  existsInCatalog,
} from '../siat-simulated/simulated-catalogs';

/** Unidad de medida 58 del SIAT, «unidad servicio». */
const SERVICE_UNIT = 58;
const DECIMAL = /^\d+(\.\d{1,2})?$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Tope de cobros por lectura. */
const CHARGES_LIMIT = 200;
// `SIAT-SIM:MP:n` (caja) y `PROOF:<id>:MP:n` (comprobante aceptado, C-01).
const METHOD_REFERENCE = /(?:^|:)MP:(\d+)$/;

type Row = Record<string, string | number | Date | null | undefined>;

/** Un cobro con lo interno que necesitan las escrituras. */
interface ChargeContext {
  view: SimulatedChargeView;
  encounterId: string;
  tenantId: string;
  practiceId: string;
  practiceName: string;
  patientProfileId: string;
  receivableId: string | null;
  balanceCents: number;
  serviceId: string | null;
  unitPrice: string;
  catalogName: string;
  catalogCode: string;
}

interface SiatRow {
  id: string;
  invoiceId: string;
  encounterId: string | null;
  practiceId: string;
  patientProfileId: string;
  issuerNit: string;
  invoiceNumber: number;
  cuf: string;
  cufd: string;
  issuedAtText: string;
  cabecera: Record<string, string | number | null>;
  detalle: Record<string, string | number | null>[];
  xml: string;
  hashArchivo: string;
  compressedBytes: number;
  status: SimulatedInvoiceStatus;
  statusAtReception: SimulatedInvoiceStatus;
  siatResponse: SiatResponse;
  events: InvoiceEvent[];
  createdAt: Date;
}

@Injectable()
export class BillingSimulatedService {
  constructor(
    private readonly em: EntityManager,
    private readonly invoicesService: InvoicesService,
    private readonly paymentsService: PaymentsReceivedService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(BillingSimulatedService.name);
  }

  // ---- utilidades -----------------------------------------------------------

  /** Apagable por entorno: `BILLING_SIMULATED_ENABLED=false` → 404. */
  private ensureEnabled(): void {
    if (
      (process.env['BILLING_SIMULATED_ENABLED'] ?? 'true').toLowerCase() ===
      'false'
    ) {
      throw new ResourceNotFoundException(
        'La facturación simulada está apagada (BILLING_SIMULATED_ENABLED=false)',
      );
    }
  }

  private scopeOf(user: AuthenticatedUser): OperatingScope {
    const scope = operatingScope(user);
    if (scope === null) {
      throw new ForbiddenException('Su rol no permite operar la facturación');
    }
    return scope;
  }

  private adminOnly(user: AuthenticatedUser): OperatingScope {
    const scope = this.scopeOf(user);
    if (!isAdminScope(scope)) {
      throw new ForbiddenException(
        'Sólo la administración de la clínica puede hacer esto',
      );
    }
    return scope;
  }

  private q<T = Row>(
    em: EntityManager,
    sql: string,
    params: unknown[] = [],
  ): Promise<T[]> {
    return em
      .getConnection()
      .execute<T[]>(sql, params, 'all', em.getTransactionContext());
  }

  private notFound(what: string): ResourceNotFoundException {
    return new ResourceNotFoundException(what, undefined);
  }

  private invalid(
    message: string,
    issues: { field: string; problem: string }[],
  ): DomainException {
    return new DomainException(
      HttpStatus.BAD_REQUEST,
      ErrorCode.VALIDATION_FAILED,
      message,
      {
        issues: issues.map((i) => ({ field: i.field, message: i.problem })),
        violations: issues.map((i) => `${i.field}: ${i.problem}`),
      },
    );
  }

  /** Predicado SQL del alcance sobre `clinical.encounters e`. */
  private scopeSql(scope: OperatingScope): { sql: string; params: unknown[] } {
    if (scope.kind === 'practitioner') {
      return {
        sql: 'e.primary_practitioner_id = ?',
        params: [scope.practitionerProfileId],
      };
    }
    if (scope.tenantIds === null) return { sql: 'TRUE', params: [] };
    if (scope.tenantIds.length === 0) return { sql: 'FALSE', params: [] };
    return { sql: 'e.tenant_id IN (?)', params: [[...scope.tenantIds]] };
  }

  private iso(valor: unknown): string {
    return valor instanceof Date
      ? valor.toISOString()
      : new Date(String(valor)).toISOString();
  }

  // ---- lecturas fiscales ----------------------------------------------------

  catalogs() {
    this.ensureEnabled();
    const c = SIMULATED_CATALOGS;
    const sinFuente = (e: {
      codigo: number;
      descripcion: string;
      origen: string;
    }) => ({
      codigo: e.codigo,
      descripcion: e.descripcion,
      origen: e.origen,
    });
    return {
      paymentMethods: c.metodosDePago.map(sinFuente),
      identityDocumentTypes: c.tiposDeDocumentoDeIdentidad.map(sinFuente),
      annulmentReasons: c.motivosDeAnulacion.map(sinFuente),
      forceableMessages: FORCEABLE_MESSAGES.map((codigo) => ({
        codigo,
        descripcion:
          (SIAT_MESSAGE_DESCRIPTION as Record<number, string>)[codigo] ??
          String(codigo),
        advertencia: isWarning(codigo),
      })),
      simulated: true as const,
    };
  }

  /** Emisor ficticio de cada práctica «principal» de los tenants del alcance. */
  async status(user: AuthenticatedUser) {
    this.ensureEnabled();
    const scope = this.scopeOf(user);
    const practices = await this.practicesInScope(scope);
    const ahora = new Date();
    const issuers = practices.map((p) =>
      simulatedIssuer({ practiceId: p.id, legalName: p.name }),
    );
    return {
      environment: 'SIMULADO' as const,
      modality: 2 as const,
      serverTime: boliviaTime(ahora),
      issuers: scope.kind === 'admin' ? issuers : issuers,
      credentials:
        scope.kind === 'admin'
          ? issuers.map((i) => {
              const c = simulatedCredentials(i, ahora);
              return {
                issuerId: i.id,
                cuis: c.cuis,
                cuisValidUntil: c.cuisValidUntil,
                cufd: c.cufd,
                cufdValidUntil: c.cufdValidUntil,
              };
            })
          : [],
      simulated: true as const,
    };
  }

  private async practicesInScope(
    scope: OperatingScope,
  ): Promise<{ id: string; name: string }[]> {
    if (scope.kind === 'practitioner') {
      return this.q(
        this.em,
        `SELECT DISTINCT ON (pr.tenant_id) pr.id, pr.name
           FROM clinical.encounters e
           JOIN practice.practices pr ON pr.tenant_id = e.tenant_id
          WHERE e.primary_practitioner_id = ?
          ORDER BY pr.tenant_id, pr.created_at, pr.id`,
        [scope.practitionerProfileId],
      );
    }
    if (scope.tenantIds !== null && scope.tenantIds.length === 0) return [];
    return this.q(
      this.em,
      `SELECT DISTINCT ON (pr.tenant_id) pr.id, pr.name
         FROM practice.practices pr
        WHERE ${scope.tenantIds === null ? 'TRUE' : 'pr.tenant_id IN (?)'}
        ORDER BY pr.tenant_id, pr.created_at, pr.id`,
      scope.tenantIds === null ? [] : [[...scope.tenantIds]],
    );
  }

  // ---- cobros ---------------------------------------------------------------

  async listCharges(
    user: AuthenticatedUser,
    patientProfileId?: string,
  ): Promise<{ items: SimulatedChargeView[]; count: number; simulated: true }> {
    this.ensureEnabled();
    const scope = this.scopeOf(user);
    const items = (
      await this.loadCharges(this.em, scope, { patientProfileId })
    ).map((c) => c.view);
    return { items, count: items.length, simulated: true };
  }

  private async loadCharges(
    em: EntityManager,
    scope: OperatingScope,
    filtro: { encounterId?: string; patientProfileId?: string },
  ): Promise<ChargeContext[]> {
    const sc = this.scopeSql(scope);
    const where: string[] = [sc.sql];
    const params: unknown[] = [...sc.params];
    if (filtro.encounterId !== undefined) {
      where.push('e.id = ?');
      params.push(filtro.encounterId);
    }
    if (
      filtro.patientProfileId !== undefined &&
      filtro.patientProfileId !== ''
    ) {
      where.push('e.patient_profile_id = ?');
      params.push(filtro.patientProfileId);
    }
    const encuentros = await this.q(
      em,
      `SELECT e.id, e.patient_profile_id AS "patientProfileId", e.tenant_id AS "tenantId",
              e.primary_practitioner_id AS "practitionerProfileId", e.reason_text AS "reason",
              e.start_at AS "startAt", pr.id AS "practiceId", pr.name AS "practiceName"
         FROM clinical.encounters e
         -- La práctica del cargo es la del médico que atiende (su asignación
         -- vigente, la primaria primero); sólo sin ninguna, la primera del tenant.
         -- Los médicos independientes comparten el tenant por defecto.
         LEFT JOIN LATERAL (SELECT ra.practice_id FROM practice.practitioner_role_assignments ra
                             WHERE ra.practitioner_profile_id = e.primary_practitioner_id
                               AND ra.valid_to IS NULL
                             ORDER BY ra.is_primary DESC NULLS LAST, ra.created_at, ra.id LIMIT 1) own ON TRUE
         JOIN LATERAL (SELECT p.id, p.name FROM practice.practices p
                             WHERE p.id = own.practice_id
                                OR (own.practice_id IS NULL AND p.tenant_id = e.tenant_id)
                             ORDER BY p.created_at, p.id LIMIT 1) pr ON TRUE
        WHERE ${where.join(' AND ')}
        ORDER BY e.start_at DESC NULLS LAST, e.id
        LIMIT ${CHARGES_LIMIT}`,
      params,
    );
    if (encuentros.length === 0) return [];

    const encounterIds = encuentros.map((e) => String(e['id']));
    const patientIds = [
      ...new Set(encuentros.map((e) => String(e['patientProfileId']))),
    ];
    const practiceIds = [
      ...new Set(encuentros.map((e) => String(e['practiceId']))),
    ];

    const receivables = await this.q(
      em,
      `SELECT i.id, i.encounter_id AS "encounterId", i.total::text AS total,
              i.paid_total::text AS "paidTotal", i.balance::text AS balance,
              i.status_concept_id AS "statusId", i.created_at AS "createdAt"
         FROM billing.invoices i
        WHERE i.encounter_id IN (?) AND i.status_concept_id <> ?
        ORDER BY i.created_at`,
      [encounterIds, BILL.INVOICE_CREDIT_NOTE],
    );
    const receivableByEncounter = new Map<string, Row>();
    for (const r of receivables)
      receivableByEncounter.set(String(r['encounterId']), r); // la más reciente gana

    const receivableIds = [...receivableByEncounter.values()].map((r) =>
      String(r['id']),
    );
    const lines = receivableIds.length
      ? await this.q(
          em,
          `SELECT l.invoice_id AS "invoiceId", l.service_id AS "serviceId", l.description,
                  l.quantity::text AS quantity, l.unit_price::text AS "unitPrice",
                  l.discount::text AS discount, l.line_total::text AS "lineTotal",
                  sc.code AS "serviceCode"
             FROM billing.invoice_lines l
        LEFT JOIN billing.service_catalog sc ON sc.id = l.service_id
            WHERE l.invoice_id IN (?)
            ORDER BY l.created_at, l.id`,
          [receivableIds],
        )
      : [];
    const payments = receivableIds.length
      ? await this.q(
          em,
          `SELECT a.invoice_id AS "invoiceId", p.id, p.reference, p.received_at AS "receivedAt",
                  p.created_at AS "createdAt"
             FROM billing.receivable_payment_allocations a
             JOIN billing.payments_received p ON p.id = a.payment_received_id
            WHERE a.invoice_id IN (?)
            ORDER BY p.received_at, p.created_at`,
          [receivableIds],
        )
      : [];
    const siat = await this.q<SiatRow>(
      em,
      `SELECT ${SIAT_COLUMNS}
         FROM billing.siat_simulated_invoices s
        WHERE s.encounter_id IN (?)
        ORDER BY s.created_at`,
      [encounterIds],
    );
    const latestSiat = new Map<string, SiatRow>();
    for (const s of siat)
      if (s.encounterId !== null) latestSiat.set(s.encounterId, s);

    const people = await this.q(
      em,
      `SELECT pp.profile_id AS id, pe.display_name AS "displayName", pe.name, pe.last_name AS "lastName"
         FROM profiles.patient_profiles pp
         JOIN profiles.persons pe ON pe.id = pp.profile_id
        WHERE pp.profile_id IN (?)`,
      [patientIds],
    );
    const nameOf = new Map(
      people.map((p) => [
        String(p['id']),
        String(
          p['displayName'] ??
            [p['name'], p['lastName']]
              .filter((x) => typeof x === 'string')
              .join(' ')
              .trim(),
        ),
      ]),
    );
    const docs = await this.q(
      em,
      `SELECT DISTINCT ON (owner_id) owner_id AS "ownerId", value
         FROM common.identifiers
        WHERE owner_id IN (?)
        ORDER BY owner_id, created_at`,
      [patientIds],
    );
    const docOf = new Map(
      docs.map((d) => [String(d['ownerId']), String(d['value'])]),
    );

    const catalog = await this.q(
      em,
      `SELECT DISTINCT ON (practice_id) practice_id AS "practiceId", id, code, name,
              default_price::text AS "price"
         FROM billing.service_catalog
        WHERE practice_id IN (?) AND is_active IS NOT FALSE
        ORDER BY practice_id, (code = 'CITA_MEDICA') DESC, default_price DESC NULLS LAST, code`,
      [practiceIds],
    );
    const catalogOf = new Map(catalog.map((c) => [String(c['practiceId']), c]));

    return encuentros.map((e): ChargeContext => {
      const id = String(e['id']);
      const patientId = String(e['patientProfileId']);
      const practiceId = String(e['practiceId']);
      const issuer = simulatedIssuer({
        practiceId,
        legalName: String(e['practiceName']),
      });
      const rec = receivableByEncounter.get(id) ?? null;
      const cat = catalogOf.get(practiceId);
      const fecha = this.iso(e['startAt'] ?? new Date()).slice(0, 10);

      let chargeLines: ChargeLineView[];
      let serviceId: string | null = null;
      if (rec !== null) {
        chargeLines = lines
          .filter((l) => String(l['invoiceId']) === String(rec['id']))
          .map((l) => {
            const subtotal = lineSubtotal(
              String(l['quantity']),
              String(l['unitPrice']),
              l['discount'] === null ? null : String(l['discount']),
            );
            serviceId = (l['serviceId'] as string | null) ?? serviceId;
            return {
              productCode: String(l['serviceCode'] ?? 'CONSULTA-MEDICA'),
              description: String(l['description'] ?? 'Servicio'),
              quantity: String(l['quantity']),
              unitOfMeasure: SERVICE_UNIT,
              unitPrice: String(l['unitPrice']),
              discount:
                l['discount'] === null || cents(String(l['discount'])) === 0
                  ? null
                  : String(l['discount']),
              subtotal,
            };
          });
      } else {
        const price = String(cat?.['price'] ?? '0.00');
        serviceId = (cat?.['id'] as string | undefined) ?? null;
        chargeLines = [
          {
            productCode: String(cat?.['code'] ?? 'CONSULTA-MEDICA'),
            description: `${String(cat?.['name'] ?? 'Consulta médica')} · ${fecha}`,
            quantity: '1',
            unitOfMeasure: SERVICE_UNIT,
            unitPrice: price,
            discount: null,
            subtotal: lineSubtotal('1', price, null),
          },
        ];
      }
      const total = importe(
        chargeLines.reduce((s, l) => s + cents(l.subtotal), 0),
      );
      const totalReal = rec !== null ? String(rec['total'] ?? total) : total;
      const balanceCents =
        rec !== null ? cents(String(rec['balance'] ?? '0')) : cents(total);
      const paid = rec !== null && cents(totalReal) > 0 && balanceCents === 0;

      let payment: SimulatedPaymentView | null = null;
      if (paid && rec !== null) {
        const ps = payments.filter(
          (p) => String(p['invoiceId']) === String(rec['id']),
        );
        const last = ps[ps.length - 1];
        const code = last
          ? Number(
              METHOD_REFERENCE.exec(String(last['reference'] ?? ''))?.[1] ?? 1,
            )
          : 1;
        payment = {
          id: String(last?.['id'] ?? rec['id']),
          methodCode: code,
          methodLabel:
            SIMULATED_CATALOGS.metodosDePago.find((m) => m.codigo === code)
              ?.descripcion ?? SIMULATED_CATALOGS.metodosDePago[0].descripcion,
          amount: totalReal,
          currency: 'BOB',
          paidAt: this.iso(
            last?.['receivedAt'] ?? last?.['createdAt'] ?? rec['createdAt'],
          ),
          simulated: true,
        };
      }
      const nombre = nameOf.get(patientId) ?? 'Paciente';
      const view: SimulatedChargeView = {
        id,
        source: 'CONSULTATION',
        sourceRef: id,
        issuerId: issuer.id,
        patientProfileId: patientId,
        patientName: nombre,
        practitionerProfileId:
          (e['practitionerProfileId'] as string | null) ?? null,
        description: `Consulta médica · ${String(e['reason'] ?? 'ambulatoria')} · ${fecha}`,
        lines: chargeLines,
        total: totalReal,
        currency: 'BOB',
        createdAt: this.iso(e['startAt'] ?? new Date()),
        payment,
        suggestedBuyer: {
          name: nombre,
          // Código 1 del catálogo SIMULADO de documentos (cédula de identidad).
          documentTypeCode: 1,
          documentNumber: docOf.get(patientId) ?? '',
          email: null,
        },
        latestInvoice: latestSiat.has(id)
          ? this.summary(latestSiat.get(id)!)
          : null,
        plan: null,
        simulated: true,
      };
      return {
        view,
        encounterId: id,
        tenantId: String(e['tenantId']),
        practiceId,
        practiceName: String(e['practiceName']),
        patientProfileId: patientId,
        receivableId: rec === null ? null : String(rec['id']),
        balanceCents: rec === null ? cents(total) : balanceCents,
        serviceId,
        unitPrice: chargeLines[0]?.unitPrice ?? '0.00',
        catalogName: String(cat?.['name'] ?? 'Consulta médica'),
        catalogCode: String(cat?.['code'] ?? 'CONSULTA-MEDICA'),
      };
    });
  }

  private async chargeOrThrow(
    em: EntityManager,
    scope: OperatingScope,
    id: string,
  ): Promise<ChargeContext> {
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw this.notFound('El cobro no existe');
    const [c] = await this.loadCharges(em, scope, { encounterId: id });
    // Fuera del alcance = no existe: un 403 revelaría que el cobro ajeno existe.
    if (c === undefined) throw this.notFound('El cobro no existe');
    return c;
  }

  // ---- pago -----------------------------------------------------------------

  async registerPayment(
    user: AuthenticatedUser,
    chargeId: string,
    methodCode: number,
  ): Promise<SimulatedChargeView> {
    this.ensureEnabled();
    const scope = this.scopeOf(user);
    const metodo = SIMULATED_CATALOGS.metodosDePago.find(
      (m) => m.codigo === methodCode,
    );
    if (metodo === undefined) {
      throw this.invalid('Método de pago inválido', [
        { field: 'methodCode', problem: 'no está en el catálogo simulado' },
      ]);
    }
    const cobro = await this.chargeOrThrow(this.em, scope, chargeId);
    return this.settle(
      user,
      scope,
      cobro,
      methodCode,
      `SIAT-SIM:MP:${methodCode}`,
    );
  }

  /**
   * C-01: el médico aceptó un comprobante del paciente y el cargo queda PAGADO
   * en el modelo real (cuenta por cobrar + pago asignado), igual que si la
   * administración hubiera cobrado en caja. No pasa por `ensureEnabled`: el
   * pago es del modelo real, no de la ruta fiscal simulada.
   *
   * Devuelve `null` cuando la consulta no tiene precio (nada que saldar) o ya
   * estaba saldada; en ambos casos el comprobante aceptado alcanza.
   */
  async settleFromProof(
    user: AuthenticatedUser,
    chargeId: string,
    methodCode: number,
    proofId: string,
  ): Promise<SimulatedChargeView | null> {
    const scope = this.scopeOf(user);
    const cobro = await this.chargeOrThrow(this.em, scope, chargeId);
    if (cobro.view.payment !== null) return null;
    if (cents(cobro.view.total) <= 0 || cobro.balanceCents <= 0) return null;
    return this.settle(
      user,
      scope,
      cobro,
      methodCode,
      `PROOF:${proofId}:MP:${methodCode}`,
    );
  }

  private async settle(
    user: AuthenticatedUser,
    scope: OperatingScope,
    cobro: ChargeContext,
    methodCode: number,
    reference: string,
  ): Promise<SimulatedChargeView> {
    const chargeId = cobro.encounterId;
    if (cobro.view.payment !== null) {
      throw new ConflictException('El cobro ya está pagado', {
        reason: 'ALREADY_PAID',
      });
    }
    if (cents(cobro.view.total) <= 0 || cobro.balanceCents <= 0) {
      throw new PreconditionFailedException(
        `La consulta no tiene precio: defina el precio del servicio «${cobro.catalogName}» en el catálogo de servicios de la práctica`,
        { reason: 'PRICE_NOT_DEFINED', practiceId: cobro.practiceId },
      );
    }

    // 1) La cuenta por cobrar REAL (si el cobro nace aquí).
    let receivableId = cobro.receivableId;
    if (receivableId === null) {
      const inv = await this.invoicesService.issueFromEncounter(
        {
          practiceId: cobro.practiceId,
          patientProfileId: cobro.patientProfileId,
          encounterId: cobro.encounterId,
          tenantId: cobro.tenantId,
          currencyConceptId: CONCEPTS.CURRENCY_BOB,
          lines: cobro.view.lines.map((l) => ({
            serviceId: cobro.serviceId ?? undefined,
            description: l.description,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            discount: l.discount ?? undefined,
          })),
        },
        user,
      );
      receivableId = inv.id;
    }

    // 2) El pago REAL, asignado a esa cuenta por cobrar.
    const pago = await this.paymentsService.apply(
      {
        practiceId: cobro.practiceId,
        patientProfileId: cobro.patientProfileId,
        amount: fromCents(cobro.balanceCents),
        methodConceptId: methodConcept(methodCode),
        reference,
        allocations: [
          {
            invoiceId: receivableId,
            allocatedAmount: fromCents(cobro.balanceCents),
          },
        ],
      },
      user,
    );
    this.logger.info(
      {
        operation: 'billing.simulated.payment',
        chargeId,
        paymentId: pago.id,
        methodCode,
      },
      'Simulated charge paid against the real receivable',
    );
    return (await this.chargeOrThrow(this.em, scope, chargeId)).view;
  }

  /** El modelo real no tiene planes por instancia: 409 como un servicio de una sola instancia. */
  async registerInstancePayment(
    user: AuthenticatedUser,
    chargeId: string,
    _instanceId: string,
    _dto: SimulatedInstancePaymentDto,
  ): Promise<never> {
    this.ensureEnabled();
    const scope = this.scopeOf(user);
    await this.chargeOrThrow(this.em, scope, chargeId);
    throw new ConflictException(
      'El servicio es de una sola instancia: se cobra y se factura de una vez',
      { reason: 'NOT_A_PLAN' },
    );
  }

  // ---- emisión --------------------------------------------------------------

  async issueInvoice(
    user: AuthenticatedUser,
    chargeId: string,
    dto: SimulatedIssueInvoiceDto,
  ): Promise<SimulatedInvoiceView> {
    this.ensureEnabled();
    const scope = this.scopeOf(user);
    const cobro = await this.chargeOrThrow(this.em, scope, chargeId);
    if (cobro.view.payment === null || cobro.receivableId === null) {
      throw new PreconditionFailedException('El cobro todavía no está pagado', {
        reason: 'PAYMENT_REQUIRED',
      });
    }
    const vigente = await this.q(
      this.em,
      `SELECT invoice_number AS "n" FROM billing.siat_simulated_invoices
        WHERE encounter_id = ? AND status IN ('VALIDATED','OBSERVED') LIMIT 1`,
      [cobro.encounterId],
    );
    if (vigente.length > 0) {
      throw new ConflictException(
        `El cobro ya tiene la factura ${String(vigente[0]['n'])} vigente`,
        { reason: 'ALREADY_INVOICED' },
      );
    }
    const problemas = entryProblems(dto, cobro.view.total);
    if (problemas.length > 0) {
      throw this.invalid('Datos de facturación inválidos', problemas);
    }

    const emisor = simulatedIssuer({
      practiceId: cobro.practiceId,
      legalName: cobro.practiceName,
    });
    const ahora = new Date();
    const credenciales = simulatedCredentials(emisor, ahora);
    const fechaEmision = boliviaTime(ahora);
    const pagoMetodo = cobro.view.payment.methodCode;
    const descuento =
      dto.additionalDiscount === undefined ||
      dto.additionalDiscount === null ||
      dto.additionalDiscount === ''
        ? null
        : dto.additionalDiscount;

    const id = await this.em.transactional(async (tx) => {
      // El correlativo por emisor: serializado por práctica.
      await this.q(tx, `SELECT pg_advisory_xact_lock(hashtext(?))`, [
        `siat-sim:${cobro.practiceId}`,
      ]);
      const [max] = await this.q(
        tx,
        `SELECT COALESCE(MAX(invoice_number), 0) AS "m"
           FROM billing.siat_simulated_invoices
          WHERE practice_id = ? AND status <> 'REJECTED'`,
        [cobro.practiceId],
      );
      const numeroFactura = Number(max['m']) + 1;
      const built = buildSimulatedInvoice({
        emisor,
        credenciales,
        numeroFactura,
        fechaEmision,
        patientProfileId: cobro.patientProfileId,
        paymentMethodCode: pagoMetodo,
        lines: cobro.view.lines,
        buyer: {
          name: dto.buyer.name,
          documentTypeCode: dto.buyer.documentTypeCode,
          documentNumber: dto.buyer.documentNumber,
          complement: dto.buyer.complement ?? null,
          email: dto.buyer.email ?? null,
        },
        additionalDiscount: descuento,
        usuario: user.id,
        forceMessageCode: dto.simulation?.forceMessageCode,
      });
      const at = ahora.toISOString();
      const events: InvoiceEvent[] = [
        {
          kind: 'PAYMENT_REGISTERED',
          at: cobro.view.payment!.paidAt,
          siatStatusCode: null,
          detail: `${cobro.view.payment!.methodLabel} · Bs ${cobro.view.payment!.amount}`,
        },
        {
          kind: 'INVOICE_BUILT',
          at,
          siatStatusCode: null,
          detail: `Factura N.º ${numeroFactura} · sector ${emisor.documentSector} · CUF generado`,
        },
        {
          kind: 'SENT_TO_SIAT',
          at,
          siatStatusCode: null,
          detail: `XML gzip ${built.compressedBytes} bytes · SHA-256 ${built.hashArchivo.slice(0, 12)}…`,
        },
        eventOfResponse('SIAT_RESPONSE', built.response, at),
      ];
      const nuevoId = randomUUID();
      await this.q(
        tx,
        `INSERT INTO billing.siat_simulated_invoices
           (id, invoice_id, encounter_id, practice_id, patient_profile_id, issuer_nit, invoice_number,
            cuf, cufd, issued_at_text, cabecera, detalle, xml, hash_archivo, compressed_bytes,
            status, status_at_reception, siat_response, events, created_by_user_id, updated_by_user_id)
         VALUES (?,?,?,?,?,?,?,?,?,?,?::jsonb,?::jsonb,?,?,?,?,?,?::jsonb,?::jsonb,?,?)`,
        [
          nuevoId,
          cobro.receivableId,
          cobro.encounterId,
          cobro.practiceId,
          cobro.patientProfileId,
          emisor.nit,
          numeroFactura,
          built.cuf,
          credenciales.cufd,
          fechaEmision,
          JSON.stringify(built.cabecera),
          JSON.stringify(built.detalle),
          built.xml,
          built.hashArchivo,
          built.compressedBytes,
          built.status,
          built.status,
          JSON.stringify(built.response),
          JSON.stringify(events),
          user.id,
          user.id,
        ],
      );
      return nuevoId;
    });
    this.logger.info(
      { operation: 'billing.simulated.issue', chargeId, siatInvoiceId: id },
      'Simulated SIAT invoice issued',
    );
    return this.toInvoiceView(await this.siatOrThrow(this.em, id));
  }

  // ---- lectura / anulación / entrega ---------------------------------------

  private async siatOrThrow(em: EntityManager, id: string): Promise<SiatRow> {
    if (!/^[0-9a-f-]{36}$/i.test(id))
      throw this.notFound('La factura no existe');
    const [row] = await this.q<SiatRow>(
      em,
      `SELECT ${SIAT_COLUMNS} FROM billing.siat_simulated_invoices s WHERE s.id = ?`,
      [id],
    );
    if (row === undefined) throw this.notFound('La factura no existe');
    return row;
  }

  /** La factura, si el cobro de su consulta está dentro del alcance. */
  private async scopedSiat(
    user: AuthenticatedUser,
    id: string,
    exigirAdmin: boolean,
  ): Promise<SiatRow> {
    this.ensureEnabled();
    const scope = exigirAdmin ? this.adminOnly(user) : this.scopeOf(user);
    const row = await this.siatOrThrow(this.em, id);
    if (row.encounterId === null) throw this.notFound('La factura no existe');
    await this.chargeOrThrow(this.em, scope, row.encounterId); // 404 si está fuera del alcance
    return row;
  }

  async invoice(
    user: AuthenticatedUser,
    id: string,
  ): Promise<SimulatedInvoiceView> {
    return this.toInvoiceView(await this.scopedSiat(user, id, false));
  }

  async annul(
    user: AuthenticatedUser,
    id: string,
    dto: SimulatedAnnulDto,
  ): Promise<SimulatedInvoiceView> {
    const row = await this.scopedSiat(user, id, true);
    return this.operate(user, row, (f) => {
      if (
        !existsInCatalog(
          SIMULATED_CATALOGS.motivosDeAnulacion,
          Number(dto.reasonCode),
        )
      ) {
        return {
          respuesta: siatResponse(SIAT_STATUS.ANULACION_RECHAZADA, [
            mensaje(SIAT_MESSAGE.MOTIVO_ANULACION_INVALIDO),
          ]),
          status: f.status,
          kind: 'ANNULMENT',
        };
      }
      if (f.status === 'ANNULLED') {
        return {
          respuesta: siatResponse(SIAT_STATUS.ANULACION_RECHAZADA, [
            mensaje(SIAT_MESSAGE.YA_ANULADA),
          ]),
          status: f.status,
          kind: 'ANNULMENT',
        };
      }
      if (f.status === 'REJECTED') {
        return {
          respuesta: siatResponse(SIAT_STATUS.ANULACION_RECHAZADA, [
            mensaje(SIAT_MESSAGE.NO_DISPONIBLE_PARA_ANULAR),
          ]),
          status: f.status,
          kind: 'ANNULMENT',
        };
      }
      return {
        respuesta: siatResponse(
          SIAT_STATUS.ANULACION_CONFIRMADA,
          [],
          `anula|${f.cuf}`,
        ),
        status: 'ANNULLED',
        kind: 'ANNULMENT',
      };
    });
  }

  async revertAnnulment(
    user: AuthenticatedUser,
    id: string,
  ): Promise<SimulatedInvoiceView> {
    const row = await this.scopedSiat(user, id, true);
    return this.operate(user, row, (f) =>
      f.status === 'ANNULLED'
        ? {
            respuesta: siatResponse(
              SIAT_STATUS.REVERSION_ANULACION_CONFIRMADA,
              [],
              `revierte|${f.cuf}`,
            ),
            status: f.statusAtReception,
            kind: 'ANNULMENT_REVERSAL',
          }
        : {
            respuesta: siatResponse(SIAT_STATUS.REVERSION_ANULACION_RECHAZADA, [
              mensaje(SIAT_MESSAGE.NO_DISPONIBLE_PARA_ANULAR),
            ]),
            status: f.status,
            kind: 'ANNULMENT_REVERSAL',
          },
    );
  }

  private async operate(
    user: AuthenticatedUser,
    row: SiatRow,
    decide: (f: SiatRow) => {
      respuesta: SiatResponse;
      status: SimulatedInvoiceStatus;
      kind: string;
    },
  ): Promise<SimulatedInvoiceView> {
    const { respuesta, status, kind } = decide(row);
    const at = new Date().toISOString();
    const events = [...row.events, eventOfResponse(kind, respuesta, at)];
    await this.q(
      this.em,
      `UPDATE billing.siat_simulated_invoices
          SET status = ?, siat_response = ?::jsonb, events = ?::jsonb,
              updated_at = now(), updated_by_user_id = ?, row_version = row_version + 1
        WHERE id = ?`,
      [
        status,
        JSON.stringify(respuesta),
        JSON.stringify(events),
        user.id,
        row.id,
      ],
    );
    return this.toInvoiceView(await this.siatOrThrow(this.em, row.id));
  }

  async email(
    user: AuthenticatedUser,
    id: string,
    dto: SimulatedEmailDto,
  ): Promise<SimulatedOutboxEntryView> {
    const row = await this.scopedSiat(user, id, true);
    if (!EMAIL.test(String(dto.to ?? ''))) {
      throw this.invalid('Correo inválido', [
        { field: 'to', problem: 'no es un correo' },
      ]);
    }
    if (row.status === 'REJECTED') {
      throw this.invalid('Una factura rechazada no se entrega', [
        { field: 'invoiceId', problem: 'rechazada' },
      ]);
    }
    const attachments = [
      `factura-${row.invoiceNumber}-SIMULADA.xml`,
      `factura-${row.invoiceNumber}-SIMULADA.pdf`,
    ];
    const outboxId = randomUUID();
    const at = new Date();
    await this.q(
      this.em,
      `INSERT INTO billing.siat_simulated_outbox (id, siat_invoice_id, to_email, attachments, queued_at, created_by_user_id)
       VALUES (?,?,?,?::jsonb,?,?)`,
      [outboxId, row.id, dto.to, JSON.stringify(attachments), at, user.id],
    );
    const events = [
      ...row.events,
      {
        kind: 'EMAIL_QUEUED',
        at: at.toISOString(),
        siatStatusCode: null,
        detail: `A ${dto.to} · bandeja simulada, no se envía`,
      },
    ];
    await this.q(
      this.em,
      `UPDATE billing.siat_simulated_invoices SET events = ?::jsonb, updated_at = now() WHERE id = ?`,
      [JSON.stringify(events), row.id],
    );
    return {
      id: outboxId,
      invoiceId: row.id,
      to: dto.to,
      attachments,
      status: 'NOT_SENT_SIMULATED',
      queuedAt: at.toISOString(),
      simulated: true,
    };
  }

  async outbox(user: AuthenticatedUser) {
    this.ensureEnabled();
    const scope = this.adminOnly(user);
    const sc = this.scopeSql(scope);
    const rows = await this.q(
      this.em,
      `SELECT o.id, o.siat_invoice_id AS "invoiceId", o.to_email AS "to", o.attachments,
              o.status, o.queued_at AS "queuedAt"
         FROM billing.siat_simulated_outbox o
         JOIN billing.siat_simulated_invoices s ON s.id = o.siat_invoice_id
         JOIN clinical.encounters e ON e.id = s.encounter_id
        WHERE ${sc.sql}
        ORDER BY o.queued_at DESC
        LIMIT 200`,
      sc.params,
    );
    const items: SimulatedOutboxEntryView[] = rows.map((r) => ({
      id: String(r['id']),
      invoiceId: String(r['invoiceId']),
      to: String(r['to']),
      attachments: r['attachments'] as unknown as string[],
      status: 'NOT_SENT_SIMULATED',
      queuedAt: this.iso(r['queuedAt']),
      simulated: true,
    }));
    return { items, count: items.length, simulated: true as const };
  }

  // ---- mis facturas ---------------------------------------------------------

  async myInvoices(user: AuthenticatedUser) {
    this.ensureEnabled();
    const rows = await this.myInvoiceRows(user, undefined);
    return {
      view: rows.view,
      items: rows.items,
      count: rows.items.length,
      simulated: true as const,
    };
  }

  async myInvoice(
    user: AuthenticatedUser,
    id: string,
  ): Promise<SimulatedInvoiceView> {
    this.ensureEnabled();
    if (!/^[0-9a-f-]{36}$/i.test(id))
      throw this.notFound('La factura no existe');
    const rows = await this.myInvoiceRows(user, id);
    const row = rows.rows[0];
    if (row === undefined) throw this.notFound('La factura no existe');
    return this.toInvoiceView(row);
  }

  private async myInvoiceRows(
    user: AuthenticatedUser,
    onlyId: string | undefined,
  ): Promise<{
    view: 'RECEIVED' | 'ISSUED';
    items: MyInvoiceItemView[];
    rows: SiatRow[];
  }> {
    const alcance = myInvoicesScope(user);
    const where: string[] = [];
    const params: unknown[] = [];
    if (alcance.view === 'RECEIVED') {
      where.push('s.patient_profile_id = ?');
      params.push(alcance.patientProfileId);
    } else if (alcance.scope === null) {
      return { view: 'ISSUED', items: [], rows: [] };
    } else {
      const sc = this.scopeSql(alcance.scope);
      where.push(sc.sql);
      params.push(...sc.params);
    }
    if (onlyId !== undefined) {
      where.push('s.id = ?');
      params.push(onlyId);
    }
    const rows = await this.q<
      SiatRow & {
        practiceName: string;
        patientName: string | null;
        reason: string | null;
      }
    >(
      this.em,
      `SELECT ${SIAT_COLUMNS}, pr.name AS "practiceName", pe.display_name AS "patientName"
         FROM billing.siat_simulated_invoices s
         JOIN practice.practices pr ON pr.id = s.practice_id
    LEFT JOIN clinical.encounters e ON e.id = s.encounter_id
    LEFT JOIN profiles.persons pe ON pe.id = s.patient_profile_id
        WHERE ${where.join(' AND ')}
        ${alcance.view === 'RECEIVED' ? '' : 'AND e.id IS NOT NULL'}
        ORDER BY s.created_at DESC
        LIMIT 200`,
      params,
    );
    const items: MyInvoiceItemView[] = rows.map((r) => ({
      invoice: this.summary(r),
      chargeId: r.encounterId ?? r.invoiceId,
      source: 'CONSULTATION',
      description: `Consulta médica · ${String(r.cabecera['fechaEmision'] ?? '').slice(0, 10)}`,
      issuerName: String(r.cabecera['razonSocialEmisor'] ?? r.practiceName),
      issuerNit: r.issuerNit,
      patientName:
        r.patientName ?? String(r.cabecera['nombreRazonSocial'] ?? ''),
      simulated: true,
    }));
    return { view: alcance.view, items, rows };
  }

  // ---- vistas ---------------------------------------------------------------

  private summary(f: SiatRow): SimulatedInvoiceSummaryView {
    return {
      id: f.id,
      invoiceNumber: f.invoiceNumber,
      cuf: f.cuf,
      status: f.status,
      siatStatusCode: f.siatResponse.codigoEstado,
      issuedAt: f.issuedAtText,
      total: String(f.cabecera['montoTotal']),
      simulated: true,
    };
  }

  private toInvoiceView(f: SiatRow): SimulatedInvoiceView {
    const issuer: SimulatedIssuerView = {
      id: f.practiceId,
      kind: 'PRACTICE',
      nit: f.issuerNit,
      legalName: String(f.cabecera['razonSocialEmisor']),
      municipality: String(f.cabecera['municipio']),
      address: String(f.cabecera['direccion']),
      phone: (f.cabecera['telefono'] as string | null) ?? null,
      branchCode: Number(f.cabecera['codigoSucursal']),
      pointOfSaleCode: Number(f.cabecera['codigoPuntoVenta'] ?? 0),
      documentSector: Number(f.cabecera['codigoDocumentoSector']),
      simulated: true,
    };
    return {
      id: f.id,
      chargeId: f.encounterId ?? f.invoiceId,
      issuer,
      documentSector: issuer.documentSector,
      modality: 2,
      invoiceNumber: f.invoiceNumber,
      cuf: f.cuf,
      cufd: f.cufd,
      issuedAt: f.issuedAtText,
      cabecera: f.cabecera,
      detalle: f.detalle,
      xml: f.xml,
      hashArchivo: f.hashArchivo,
      compressedBytes: f.compressedBytes,
      status: f.status,
      siatResponse: f.siatResponse,
      events: f.events,
      simulated: true,
    };
  }
}

const SIAT_COLUMNS = `
  s.id, s.invoice_id AS "invoiceId", s.encounter_id AS "encounterId", s.practice_id AS "practiceId",
  s.patient_profile_id AS "patientProfileId", s.issuer_nit AS "issuerNit",
  s.invoice_number AS "invoiceNumber", s.cuf, s.cufd, s.issued_at_text AS "issuedAtText",
  s.cabecera, s.detalle, s.xml, s.hash_archivo AS "hashArchivo",
  s.compressed_bytes AS "compressedBytes", s.status, s.status_at_reception AS "statusAtReception",
  s.siat_response AS "siatResponse", s.events, s.created_at AS "createdAt"`;

/** Método de pago del catálogo simulado → concepto real. */
function methodConcept(code: number): string {
  if (code === 2) return BILL.METHOD_CARD;
  if (code === 3) return BILL.METHOD_TRANSFER;
  return BILL.METHOD_CASH;
}

/** Los problemas del cuerpo de emisión (mismas reglas que el simulador del front). */
export function entryProblems(
  entrada: SimulatedIssueInvoiceDto,
  total: string,
): { field: string; problem: string }[] {
  const problemas: { field: string; problem: string }[] = [];
  const c = entrada?.buyer;
  const nombre = (c?.name ?? '').trim();
  if (nombre.length < 1 || nombre.length > 500) {
    problemas.push({
      field: 'buyer.name',
      problem: 'entre 1 y 500 caracteres',
    });
  }
  if (
    !existsInCatalog(
      SIMULATED_CATALOGS.tiposDeDocumentoDeIdentidad,
      Number(c?.documentTypeCode),
    )
  ) {
    problemas.push({
      field: 'buyer.documentTypeCode',
      problem: 'no está en el catálogo simulado',
    });
  }
  const documento = (c?.documentNumber ?? '').trim();
  if (documento.length < 1 || documento.length > 20) {
    problemas.push({
      field: 'buyer.documentNumber',
      problem: 'entre 1 y 20 caracteres',
    });
  }
  const complemento = c?.complement ?? null;
  if (complemento !== null && complemento.length > 5) {
    problemas.push({
      field: 'buyer.complement',
      problem: 'hasta 5 caracteres',
    });
  }
  const correo = c?.email ?? null;
  if (correo !== null && correo !== '' && !EMAIL.test(correo)) {
    problemas.push({ field: 'buyer.email', problem: 'no es un correo' });
  }
  const descuento = entrada?.additionalDiscount ?? null;
  if (descuento !== null && descuento !== '') {
    if (!DECIMAL.test(descuento)) {
      problemas.push({
        field: 'additionalDiscount',
        problem: 'decimal no negativo con hasta 2 decimales',
      });
    } else if (toCents(descuento) >= toCents(total)) {
      problemas.push({
        field: 'additionalDiscount',
        problem: 'tiene que ser menor que el total',
      });
    }
  }
  return problemas;
}
