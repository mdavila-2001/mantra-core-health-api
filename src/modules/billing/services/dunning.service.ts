import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { DunningRepository, InvoicesRepository } from '../repositories';
import { ExecuteDunningRunDto, DunningRunResponseDto } from '../dto';
import { BILL } from '../billing.concepts';

/**
 * UC-17-10: ejecuta un ciclo de morosidad (dunning). Crea una corrida (única por
 * tenant + run_number) y un ítem por factura morosa; opcionalmente marca las
 * facturas como IN_COLLECTION. La corrida se cierra en estado COMPLETED en la
 * misma transacción.
 */
@Injectable()
export class DunningService {
  constructor(
    private readonly em: EntityManager,
    private readonly dunningRepo: DunningRepository,
    private readonly invoicesRepo: InvoicesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DunningService.name);
  }

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
}
