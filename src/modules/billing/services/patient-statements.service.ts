import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { ConflictException, type AuthenticatedUser } from '../../../common';
import {
  PatientStatementsRepository,
  InvoicesRepository,
  BillingDocumentLinksRepository,
} from '../repositories';
import {
  GeneratePatientStatementDto,
  PatientStatementResponseDto,
} from '../dto';
import { BILL } from '../billing.concepts';
import { fromCents, sumAmounts, toCents } from '../money.util';

/**
 * UC-17-09: genera el estado de cuenta del paciente para un periodo. Suma cargos
 * (total de facturas emitidas en el rango) y calcula el saldo de cierre. Único por
 * (práctica, paciente, periodo): un segundo statement para el mismo rango se
 * rechaza con conflicto. Los importes se leen en la misma transacción para un
 * snapshot consistente.
 */
@Injectable()
export class PatientStatementsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param statementsRepo - Valor de statements repo requerido por la operación.
   * @param invoicesRepo - Valor de invoices repo requerido por la operación.
   * @param linksRepo - Valor de links repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly statementsRepo: PatientStatementsRepository,
    private readonly invoicesRepo: InvoicesRepository,
    private readonly linksRepo: BillingDocumentLinksRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PatientStatementsService.name);
  }

  /**
   * Crea generate.
   *
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de generate conforme al contrato `Promise<PatientStatementResponseDto>`.
   * @throws Error de dominio cuando no se cumplen las precondiciones de la operación.
   */
  async generate(
    dto: GeneratePatientStatementDto,
    actor: AuthenticatedUser,
  ): Promise<PatientStatementResponseDto> {
    this.logger.info(
      {
        operation: 'billing.statement.generate',
        patientProfileId: dto.patientProfileId,
        actorId: actor.id,
      },
      'Generating patient statement',
    );
    const periodStart = new Date(dto.periodStart);
    const periodEnd = new Date(dto.periodEnd);

    return this.em.transactional(async (tx) => {
      const existing = await this.statementsRepo.findByPeriod(
        tx,
        dto.practiceId,
        dto.patientProfileId,
        periodStart,
        periodEnd,
      );
      if (existing) {
        throw new ConflictException(
          'Ya existe un estado de cuenta para el periodo',
          {
            patientProfileId: dto.patientProfileId,
            periodStart: dto.periodStart,
            periodEnd: dto.periodEnd,
          },
        );
      }

      const invoices = await this.invoicesRepo.findByPatientInRange(
        tx,
        dto.practiceId,
        dto.patientProfileId,
        periodStart,
        periodEnd,
      );
      const charges = sumAmounts(invoices.map((i) => i.total));
      const payments = sumAmounts(invoices.map((i) => i.paidTotal));
      const openingCents = dto.openingBalance ? toCents(dto.openingBalance) : 0;
      const closingCents = openingCents + toCents(charges) - toCents(payments);

      const statement = this.statementsRepo.create(tx, {
        practiceId: dto.practiceId,
        patientProfileId: dto.patientProfileId,
        periodStart,
        periodEnd,
        openingBalance: fromCents(openingCents),
        charges,
        payments,
        closingBalance: fromCents(closingCents),
        generatedAt: new Date(),
        actorUserId: actor.id,
      });
      await tx.flush();

      if (dto.tenantId) {
        for (const inv of invoices) {
          this.linksRepo.create(tx, {
            tenantId: dto.tenantId,
            relationTypeConceptId: BILL.REL_STATEMENT_INCLUDES,
            invoiceId: inv.id,
            actorUserId: actor.id,
          });
        }
      }

      this.logger.info(
        {
          operation: 'billing.statement.generate',
          statementId: statement.id,
          invoices: invoices.length,
        },
        'Patient statement generated',
      );
      return {
        id: statement.id,
        patientProfileId: statement.patientProfileId,
        periodStart: dto.periodStart,
        periodEnd: dto.periodEnd,
        openingBalance: statement.openingBalance ?? '0.00',
        charges: statement.charges ?? '0.00',
        payments: statement.payments ?? '0.00',
        closingBalance: statement.closingBalance ?? '0.00',
      };
    });
  }
}
