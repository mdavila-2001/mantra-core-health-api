import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../../common';
import {
  addDecimals,
  multiplyDecimalsToMoney,
} from '../../../common/money/decimal-money';
import { CONCEPTS } from '../../../common/constants/concepts';
import { CLIN } from '../clinical.concepts';
import type { ReceivedServices } from '../entities';
import {
  ReceivedServicesRepository,
  type ChargeLine,
  type InvoiceLineAmount,
} from '../repositories/received-services.repository';
import type {
  PatientReceivedServicesResponseDto,
  ReceivedServiceCostDto,
  ReceivedServiceItemDto,
  ReceivedServiceType,
} from '../dto/received-services.dto';

/** Roles que leen la historia de otra persona: ven el servicio, no el dinero. */
const ROLES_THAT_DO_NOT_SEE_COSTS: readonly string[] = [
  'CLINICIAN',
  'PRACTITIONER',
  'SUPERADMIN',
];

const CURRENCY_CODE_BY_CONCEPT_ID: ReadonlyMap<string, string> = new Map([
  [CONCEPTS.CURRENCY_BOB, 'BOB'],
  [CONCEPTS.CURRENCY_USD, 'USD'],
]);

/**
 * «Servicios recibidos» de la historia del paciente.
 *
 * ## Quién lo puede leer
 *
 * La decisión de acceso no está acá: `ClinicalRecordAccessGuard` ya la tomó con
 * la misma política que el resumen de la historia (titular, representante, quien
 * atiende, acceso autorizado, emergencia). Este servicio solo decide qué parte
 * del servicio se muestra.
 *
 * ## Por qué el dinero no se muestra a todos
 *
 * La pantalla clínica no es una pantalla de cobro. El costo lo ve el titular o
 * quien lo representa; el personal clínico lee el servicio sin importes y la
 * respuesta lo dice (`costsVisible`) para que nadie lo lea como «sin cobro».
 *
 * ## Qué no se muestra todavía: la cobertura del seguro
 *
 * El reparto que le corresponde al paciente se publica por pedido, con una
 * explicación de beneficios firmada, y la proyección que lo decide
 * (`PatientSettlementService`) solo resuelve pedidos de farmacia y de diagnóstico.
 * Mostrar acá una cobertura leída de las líneas de reclamo, sin esa publicación,
 * exhibiría un reparto que el seguro todavía no confirmó. La fila ya guarda
 * `insurance_claim_line_id` para cuando el reparto de un procedimiento o una
 * vacuna sepa publicarse.
 */
@Injectable()
export class ReceivedServicesReadService {
  constructor(
    private readonly em: EntityManager,
    private readonly repository: ReceivedServicesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ReceivedServicesReadService.name);
  }

  async list(
    patientProfileId: string,
    limit: number,
    actor: AuthenticatedUser,
  ): Promise<PatientReceivedServicesResponseDto> {
    this.logger.info(
      { operation: 'clinical.received-services.read', patientProfileId, limit },
      'Leyendo servicios recibidos del paciente',
    );
    const em = this.em.fork();
    const rows = await this.repository.findByPatient(
      em,
      patientProfileId,
      limit + 1,
    );
    const truncated = rows.length > limit;
    const page = truncated ? rows.slice(0, limit) : rows;

    const costsVisible = !actor.roles.some((role) =>
      ROLES_THAT_DO_NOT_SEE_COSTS.includes(role),
    );
    const costs = costsVisible
      ? await this.costsOf(em, page)
      : new Map<string, ReceivedServiceCostDto>();

    return {
      patientProfileId,
      items: page.map((row) => this.toItem(row, costs.get(row.id) ?? null)),
      limit,
      truncated,
      costsVisible,
    };
  }

  private toItem(
    row: ReceivedServices,
    cost: ReceivedServiceCostDto | null,
  ): ReceivedServiceItemDto {
    return {
      id: row.id,
      type: typeOf(row.serviceTypeConceptId),
      typeConceptId: row.serviceTypeConceptId,
      serviceConceptId: row.serviceConceptId,
      statusConceptId: row.statusConceptId,
      performedAt: row.performedAt,
      performerProfileId: row.performerProfileId,
      practiceSiteId: row.practiceSiteId,
      encounterId: row.encounterId,
      outcomeConceptId: row.outcomeConceptId,
      resultText: row.resultText,
      cost,
    };
  }

  /**
   * El costo de cada servicio, por la fuente más directa que haya:
   * 1. la línea de factura enlazada a la fila;
   * 2. si no, la suma de los cargos del caso o del procedimiento.
   * Sin ninguna de las dos no hay costo (`null`): no se inventa uno.
   */
  private async costsOf(
    em: EntityManager,
    rows: readonly ReceivedServices[],
  ): Promise<Map<string, ReceivedServiceCostDto>> {
    const result = new Map<string, ReceivedServiceCostDto>();

    const lineAmounts = await this.repository.findInvoiceLineAmounts(
      em,
      rows.flatMap((row) => (row.invoiceLineId ? [row.invoiceLineId] : [])),
    );
    const lineById = new Map(
      lineAmounts.map((line) => [line.invoiceLineId, line]),
    );
    const withoutInvoice: ReceivedServices[] = [];
    for (const row of rows) {
      const line = row.invoiceLineId ? lineById.get(row.invoiceLineId) : null;
      const cost = line ? costOfInvoiceLine(line) : null;
      if (cost) result.set(row.id, cost);
      else withoutInvoice.push(row);
    }

    const charges = await this.repository.findChargeLines(
      em,
      withoutInvoice.flatMap((row) =>
        row.procedureCaseId ? [row.procedureCaseId] : [],
      ),
      withoutInvoice.flatMap((row) =>
        row.sourceProcedureId ? [row.sourceProcedureId] : [],
      ),
    );
    for (const row of withoutInvoice) {
      const own = charges.filter(
        (charge) =>
          (row.procedureCaseId &&
            charge.procedureCaseId === row.procedureCaseId) ||
          (row.sourceProcedureId &&
            charge.procedureId === row.sourceProcedureId),
      );
      const cost = costOfCharges(own);
      if (cost) result.set(row.id, cost);
    }
    return result;
  }
}

function typeOf(conceptId: string): ReceivedServiceType {
  if (conceptId === CLIN.RECEIVED_SERVICE_INTERVENTION) return 'INTERVENTION';
  if (conceptId === CLIN.RECEIVED_SERVICE_VACCINATION) return 'VACCINATION';
  return 'OTHER';
}

function costOfInvoiceLine(
  line: InvoiceLineAmount,
): ReceivedServiceCostDto | null {
  if (line.lineTotal == null || line.lineTotal.trim() === '') return null;
  return {
    amount: line.lineTotal,
    currencyCode: line.currencyConceptId
      ? (CURRENCY_CODE_BY_CONCEPT_ID.get(line.currencyConceptId) ?? null)
      : null,
    source: 'INVOICE_LINE',
  };
}

/**
 * Suma de cantidad × precio de los cargos. Si los cargos están en monedas
 * distintas no se suman (sería mezclar bolivianos con dólares) y no hay costo.
 */
function costOfCharges(
  charges: readonly ChargeLine[],
): ReceivedServiceCostDto | null {
  const priced = charges.filter(
    (charge) => charge.quantity != null && charge.unitPrice != null,
  );
  if (!priced.length) return null;
  const currencies = new Set(priced.map((charge) => charge.currencyCode ?? ''));
  if (currencies.size !== 1) return null;
  const amount = addDecimals(
    priced.map((charge) =>
      multiplyDecimalsToMoney(
        charge.quantity as string,
        charge.unitPrice as string,
      ),
    ),
  );
  if (amount == null) return null;
  const [currency] = [...currencies];
  return {
    amount,
    currencyCode: currency === '' ? null : currency,
    source: 'CHARGE_ITEMS',
  };
}
