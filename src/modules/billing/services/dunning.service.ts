import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  DunningRepository,
  InvoicesRepository,
  PracticesLookupRepository,
} from '../repositories';
import {
  ExecuteDunningRunDto,
  DunningRunResponseDto,
  RunDueDunningDto,
  RunDueDunningResponseDto,
  TenantDunningResultDto,
} from '../dto';
import { BILL } from '../billing.concepts';

const DEFAULT_DUNNING_DISCOVERY_BATCH = 500;
const MS_PER_DAY = 86_400_000;

/** Estados de factura con saldo pendiente elegibles para morosidad. */
const DUNNING_ELIGIBLE_INVOICE_STATUSES = [
  BILL.INVOICE_ISSUED,
  BILL.INVOICE_PARTIALLY_PAID,
];

/**
 * UC-17-10: ejecuta un ciclo de morosidad (dunning). Crea una corrida (única por
 * tenant + run_number) y un ítem por factura morosa; opcionalmente marca las
 * facturas como IN_COLLECTION. La corrida se cierra en estado COMPLETED en la
 * misma transacción.
 */
@Injectable()
export class DunningService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param dunningRepo - Valor de dunning repo requerido por la operación.
   * @param invoicesRepo - Valor de invoices repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly dunningRepo: DunningRepository,
    private readonly invoicesRepo: InvoicesRepository,
    private readonly practicesLookupRepo: PracticesLookupRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DunningService.name);
  }

  /**
   * Ejecuta la operación execute.
   *
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de execute conforme al contrato `Promise<DunningRunResponseDto>`.
   * @throws Error de dominio cuando no se cumplen las precondiciones de la operación.
   */
  async execute(
    dto: ExecuteDunningRunDto,
    actor: AuthenticatedUser,
  ): Promise<DunningRunResponseDto> {
    this.logger.info(
      {
        operation: 'billing.dunning.execute',
        tenantId: dto.tenantId,
        runNumber: dto.runNumber,
        actorId: actor.id,
      },
      'Executing dunning run',
    );
    return this.em.transactional(async (tx) => {
      const clash = await this.dunningRepo.findRunByNumber(
        tx,
        dto.tenantId,
        dto.runNumber,
      );
      if (clash) {
        throw new ConflictException(
          'El número de corrida ya existe para el tenant',
          {
            runNumber: dto.runNumber,
          },
        );
      }

      const run = this.dunningRepo.createRun(tx, {
        tenantId: dto.tenantId,
        runNumber: dto.runNumber,
        runDate: dto.runDate ? new Date(dto.runDate) : new Date(),
        dunningLevelConceptId:
          dto.dunningLevelConceptId ?? BILL.DUNNING_LEVEL_1,
        statusConceptId: BILL.DUNNING_RUN_RUNNING,
        actorUserId: actor.id,
      });
      // FK planas: la corrida debe existir antes de sus ítems.
      await tx.flush();

      for (const item of dto.items) {
        this.dunningRepo.createItem(tx, {
          dunningRunId: run.id,
          invoiceId: item.invoiceId,
          businessPartnerId: item.businessPartnerId,
          outstandingAmount: item.outstandingAmount,
          daysOverdue: item.daysOverdue,
          dunningFee: item.dunningFee,
          statusConceptId: BILL.DUNNING_ITEM_NOTIFIED,
        });

        // Marca opcional de factura en cobranza (si la factura pertenece a billing).
        const invoice = await this.invoicesRepo.findById(tx, item.invoiceId);
        if (invoice) {
          invoice.statusConceptId = BILL.INVOICE_IN_COLLECTION;
          touch(invoice, actor.id);
        }
      }

      // Cierra la corrida.
      run.statusConceptId = BILL.DUNNING_RUN_COMPLETED;

      this.logger.info(
        {
          operation: 'billing.dunning.execute',
          runId: run.id,
          items: dto.items.length,
        },
        'Dunning run completed',
      );
      return {
        id: run.id,
        runNumber: run.runNumber,
        status: run.statusConceptId,
        itemCount: dto.items.length,
      };
    });
  }

  /**
   * Tick de morosidad automática (Fase 4 del plan de corrección de workers):
   * `execute()` (UC-17-10) exige que el llamante ya sepa qué facturas incluir
   * — correcto para una corrida manual, pero no hay nada que lo dispare solo.
   * Este método es ese descubrimiento: agrupa las prácticas activas por
   * tenant (`invoices` no tiene `tenant_id` propio), busca las facturas
   * vencidas con saldo de cada tenant y abre una corrida diaria por tenant.
   *
   * `outstandingAmount` sale del `balance` que la propia factura ya tiene
   * asentado (no se inventa); `daysOverdue` es aritmética de fechas simple.
   * `dunningFee` se deja sin fijar deliberadamente: no existe en este repo
   * ninguna tabla de tarifas de mora de la que derivarlo, e inventar un
   * importe de recargo sería peor que no declararlo.
   *
   * Idempotente por día: el número de corrida es determinístico
   * (`AUTO-<tenant>-<fecha>`), así que reintentar el mismo día encuentra la
   * corrida ya abierta y la salta en vez de duplicarla.
   */
  async runDueDunning(
    dto: RunDueDunningDto,
    actor: AuthenticatedUser,
  ): Promise<RunDueDunningResponseDto> {
    const now = new Date();
    const limit = dto.limit ?? DEFAULT_DUNNING_DISCOVERY_BATCH;
    const runDateKey = now.toISOString().slice(0, 10);

    const practices = await this.practicesLookupRepo.findActive(
      this.em,
      CONCEPTS.STATE_ACTIVE,
    );
    const practiceIdsByTenant = new Map<string, string[]>();
    for (const practice of practices) {
      const list = practiceIdsByTenant.get(practice.tenantId) ?? [];
      list.push(practice.id);
      practiceIdsByTenant.set(practice.tenantId, list);
    }

    const results: TenantDunningResultDto[] = [];

    // Una transacción POR TENANT, no una para toda la corrida: si un tenant
    // falla a mitad de proceso (fila inválida, choque de constraint), sólo
    // ese tenant se revierte. Antes, un fallo en cualquier tenant hacía
    // rollback de TODOS los ya procesados en el mismo tick — y como el job
    // envuelve esta llamada en `runTick`, la excepción sólo quedaba
    // registrada en el log: ningún tenant recibía dunning esa hora, en
    // silencio, y se repetía cada hora mientras el tenant problemático
    // siguiera ahí.
    for (const [tenantId, practiceIds] of practiceIdsByTenant) {
      try {
        const result = await this.em.transactional(
          async (tx): Promise<TenantDunningResultDto | null> => {
            const overdue = await this.invoicesRepo.findOverdueByPractices(
              tx,
              practiceIds,
              DUNNING_ELIGIBLE_INVOICE_STATUSES,
              now,
              limit,
            );
            if (overdue.length === 0) return null;

            const runNumber = `AUTO-${runDateKey}`;
            const existing = await this.dunningRepo.findRunByNumber(
              tx,
              tenantId,
              runNumber,
            );
            if (existing) {
              return {
                tenantId,
                runId: existing.id,
                itemCount: 0,
                skipped: true,
              };
            }

            const run = this.dunningRepo.createRun(tx, {
              tenantId,
              runNumber,
              runDate: now,
              dunningLevelConceptId: BILL.DUNNING_LEVEL_1,
              statusConceptId: BILL.DUNNING_RUN_RUNNING,
              actorUserId: actor.id,
            });
            // FK planas: la corrida debe existir antes de sus ítems.
            await tx.flush();

            for (const invoice of overdue) {
              const daysOverdue = invoice.dueDate
                ? Math.floor(
                    (now.getTime() - invoice.dueDate.getTime()) / MS_PER_DAY,
                  )
                : undefined;

              this.dunningRepo.createItem(tx, {
                dunningRunId: run.id,
                invoiceId: invoice.id,
                outstandingAmount: invoice.balance,
                currencyConceptId: invoice.currencyConceptId,
                daysOverdue,
                statusConceptId: BILL.DUNNING_ITEM_NOTIFIED,
              });

              invoice.statusConceptId = BILL.INVOICE_IN_COLLECTION;
              touch(invoice, actor.id);
            }

            run.statusConceptId = BILL.DUNNING_RUN_COMPLETED;
            return {
              tenantId,
              runId: run.id,
              itemCount: overdue.length,
              skipped: false,
            };
          },
        );
        if (result) results.push(result);
      } catch (error) {
        this.logger.error(
          { operation: 'billing.dunning.run-due', tenantId, err: error },
          'Automatic dunning failed for tenant; continuing with the rest',
        );
      }
    }

    if (results.length > 0) {
      this.logger.info(
        {
          operation: 'billing.dunning.run-due',
          tenantsProcessed: results.length,
        },
        'Automatic dunning evaluated',
      );
    }

    return { tenantsProcessed: results.length, results };
  }
}
