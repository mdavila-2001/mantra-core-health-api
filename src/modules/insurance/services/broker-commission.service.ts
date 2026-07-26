import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { SettlementRepository, CatalogRepository } from '../repositories';
import { INS } from '../insurance.concepts';
import { CreateCommissionStatementDto, CreatedResourceDto } from '../dto';

/**
 * UC-26-14: generar liquidación de comisión de broker. Requiere un acuerdo
 * broker–aseguradora ACTIVO y evita liquidaciones duplicadas por
 * (broker, acuerdo, periodo). La comisión se recibe ya derivada del cliente.
 */
@Injectable()
export class BrokerCommissionService {
  constructor(
    private readonly em: EntityManager,
    private readonly repo: SettlementRepository,
    private readonly catalog: CatalogRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(BrokerCommissionService.name);
  }

  async generate(dto: CreateCommissionStatementDto, actor: AuthenticatedUser): Promise<CreatedResourceDto> {
    this.logger.info({ operation: 'insurance.commission.generate', actorId: actor.id }, 'Generating commission statement');
    return this.em.transactional(async (tx) => {
      const broker = await this.catalog.findBroker(tx, dto.insuranceBrokerId);
      if (!broker) throw new ResourceNotFoundException('Broker no encontrado', { brokerId: dto.insuranceBrokerId });
      const agreement = await this.catalog.findAgreement(tx, dto.brokerCarrierAgreementId);
      if (!agreement) {
        throw new ResourceNotFoundException('Acuerdo broker–aseguradora no encontrado', {
          agreementId: dto.brokerCarrierAgreementId,
        });
      }
      if (agreement.statusConceptId !== INS.AGREEMENT_ACTIVE) {
        throw new PreconditionFailedException('El acuerdo no está activo', { agreementId: dto.brokerCarrierAgreementId });
      }

      const periodStart = new Date(dto.periodStart);
      const periodEnd = new Date(dto.periodEnd);
      const clash = await this.repo.findStatementByUnique(
        tx,
        dto.insuranceBrokerId,
        dto.brokerCarrierAgreementId,
        periodStart,
        periodEnd,
      );
      if (clash) throw new ConflictException('Ya existe liquidación para el periodo', {});

      const statement = this.repo.createStatement(tx, {
        insuranceBrokerId: dto.insuranceBrokerId,
        brokerCarrierAgreementId: dto.brokerCarrierAgreementId,
        periodStart,
        periodEnd,
        grossPremiumAmount: dto.grossPremiumAmount,
        commissionAmount: dto.commissionAmount,
        statusConceptId: INS.COMMISSION_DRAFT,
        actorUserId: actor.id,
      });
      await tx.flush();
      return { id: statement.id };
    });
  }
}
