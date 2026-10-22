import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { ACCT } from '../accounting.concepts';
import { AssetRepository } from '../repositories';
import { PostingHelper } from './posting.helper';
import { toCents, fromCents } from './money';
import {
  CapitalizeAssetDto,
  RunDepreciationDto,
  AssetResponseDto,
  DepreciationRunResponseDto,
} from '../dto';

/**
 * Casos de uso de activos fijos: capitalización/alta con su asiento de adquisición
 * (UC-16-10) y corrida de depreciación por periodo que postea D gasto / H
 * depreciación acumulada por cada activo elegible (UC-16-11). Ambos incluyen
 * UC-16-01 vía `PostingHelper`.
 */
@Injectable()
export class AssetService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param assetRepo - Valor de asset repo requerido por la operación.
   * @param posting - Valor de posting requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly assetRepo: AssetRepository,
    private readonly posting: PostingHelper,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AssetService.name);
  }

  /** UC-16-10: capitaliza un activo y postea su asiento de alta. */
  async capitalize(
    dto: CapitalizeAssetDto,
    actor: AuthenticatedUser,
  ): Promise<AssetResponseDto> {
    this.logger.info(
      { operation: 'accounting.asset.capitalize', code: dto.code },
      'Capitalizing asset',
    );
    return this.em.transactional(async (tx) => {
      const clash = await this.assetRepo.findByCode(
        tx,
        dto.practiceId,
        dto.code,
      );
      if (clash) {
        throw new ConflictException(
          'Ya existe un activo con ese código en la práctica',
          {
            code: dto.code,
          },
        );
      }

      const asset = this.assetRepo.createAsset(tx, {
        practiceId: dto.practiceId,
        code: dto.code,
        name: dto.name,
        statusConceptId: ACCT.ASSET_ACTIVE,
        assetTypeConceptId: ACCT.ASSET_TYPE_EQUIPMENT,
        accountId: dto.acquisitionAccountId,
        acquisitionDate: new Date(dto.acquisitionDate),
        acquisitionCost: dto.acquisitionCost,
        depreciationMethodConceptId: ACCT.DEPRECIATION_METHOD_STRAIGHT_LINE,
        usefulLifeMonths: dto.usefulLifeMonths,
        salvageValue: dto.salvageValue ?? '0',
        accumulatedDepreciation: '0',
        bookValue: dto.acquisitionCost,
        actorUserId: actor.id,
      });
      await tx.flush();

      if (dto.depreciationAreaId) {
        this.assetRepo.createValuation(tx, {
          assetId: asset.id,
          depreciationAreaId: dto.depreciationAreaId,
          acquisitionValue: dto.acquisitionCost,
          accumulatedDepreciation: '0',
          bookValue: dto.acquisitionCost,
          validFrom: new Date(dto.acquisitionDate),
          actorUserId: actor.id,
        });
      }
      if (dto.costCenterId || dto.responsibleEmployeeId) {
        this.assetRepo.createAssignment(tx, {
          assetId: asset.id,
          costCenterId: dto.costCenterId,
          responsibleEmployeeId: dto.responsibleEmployeeId,
          validFrom: new Date(dto.acquisitionDate),
          actorUserId: actor.id,
        });
      }

      const posted = await this.posting.post(tx, {
        practiceId: dto.practiceId,
        transactionTypeConceptId: ACCT.TXN_TYPE_ASSET_ACQUISITION,
        transactionNumber: this.posting.generateNumber('ASSET'),
        transactionDate: new Date(dto.acquisitionDate),
        fiscalPeriodId: dto.fiscalPeriodId,
        description: `Alta de activo ${dto.code}`,
        reference: dto.code,
        lines: [
          {
            accountId: dto.acquisitionAccountId,
            direction: 'DEBIT',
            amount: dto.acquisitionCost,
            assetId: asset.id,
          },
          {
            accountId: dto.offsetAccountId,
            direction: 'CREDIT',
            amount: dto.acquisitionCost,
          },
        ],
        actorUserId: actor.id,
      });

      this.assetRepo.createPosting(tx, {
        assetId: asset.id,
        ledgerEntryId: posted.entryIds[0],
        transactionTypeConceptId: ACCT.ASSET_POSTING_ACQUISITION,
        amount: dto.acquisitionCost,
        assetValueDate: new Date(dto.acquisitionDate),
        actorUserId: actor.id,
      });

      return {
        id: asset.id,
        code: asset.code,
        status: asset.statusConceptId,
        bookValue: asset.bookValue ?? dto.acquisitionCost,
        transactionId: posted.transactionId,
      };
    });
  }

  /** UC-16-11: corre depreciación lineal por periodo (idempotente por activo/periodo). */
  async runDepreciation(
    dto: RunDepreciationDto,
    actor: AuthenticatedUser,
  ): Promise<DepreciationRunResponseDto> {
    this.logger.info(
      {
        operation: 'accounting.depreciation.run',
        periodId: dto.fiscalPeriodId,
      },
      'Running depreciation batch',
    );
    return this.em.transactional(async (tx) => {
      // Las filas de los activos se leen bloqueadas (`FOR UPDATE`) ANTES de
      // comprobar o crear la depreciación del periodo. Dos corridas
      // concurrentes sobre el mismo (activo, periodo) se serializan en esta
      // lectura: la segunda espera a que la primera confirme, relee y
      // `findDepreciation` ya encuentra la fila → la omite. Es la garantía
      // que el modelo no declara (no hay UK sobre `asset_depreciations`),
      // resuelta en la capa de la API sin tocar esquema (T26 · AC-26-5).
      const assets = await this.assetRepo.activeAssets(
        tx,
        dto.practiceId,
        ACCT.ASSET_ACTIVE,
        { assetId: dto.assetId, forUpdate: true },
      );

      const transactionIds: string[] = [];
      let depreciated = 0;
      for (const asset of assets) {
        if (!asset.usefulLifeMonths || asset.usefulLifeMonths <= 0) continue;

        const already = await this.assetRepo.findDepreciation(
          tx,
          asset.id,
          dto.fiscalPeriodId,
        );
        if (already) continue; // idempotencia: una depreciación por (activo, periodo)

        const cost = toCents(asset.acquisitionCost ?? '0');
        const salvage = toCents(asset.salvageValue ?? '0');
        const bookValue = toCents(
          asset.bookValue ?? asset.acquisitionCost ?? '0',
        );
        const depreciable = bookValue - salvage;
        if (depreciable <= 0) continue;

        const monthly = Math.round((cost - salvage) / asset.usefulLifeMonths);
        const amountCents = Math.min(monthly, depreciable);
        if (amountCents <= 0) continue;

        const amount = fromCents(amountCents);
        const bookValueAfter = fromCents(bookValue - amountCents);

        const posted = await this.posting.post(tx, {
          practiceId: dto.practiceId,
          transactionTypeConceptId: ACCT.TXN_TYPE_DEPRECIATION,
          transactionNumber: this.posting.generateNumber('DEP'),
          transactionDate: new Date(dto.postingDate),
          fiscalPeriodId: dto.fiscalPeriodId,
          description: `Depreciación ${asset.code}`,
          reference: asset.code,
          lines: [
            {
              accountId: dto.depreciationExpenseAccountId,
              direction: 'DEBIT',
              amount,
              assetId: asset.id,
            },
            {
              accountId: dto.accumulatedDepreciationAccountId,
              direction: 'CREDIT',
              amount,
              assetId: asset.id,
            },
          ],
          actorUserId: actor.id,
        });

        this.assetRepo.createDepreciation(tx, {
          assetId: asset.id,
          fiscalPeriodId: dto.fiscalPeriodId,
          amount,
          bookValueAfter,
          transactionId: posted.transactionId,
          actorUserId: actor.id,
        });
        this.assetRepo.createPosting(tx, {
          assetId: asset.id,
          ledgerEntryId: posted.entryIds[0],
          transactionTypeConceptId: ACCT.ASSET_POSTING_DEPRECIATION,
          amount,
          assetValueDate: new Date(dto.postingDate),
          actorUserId: actor.id,
        });

        asset.accumulatedDepreciation = fromCents(
          toCents(asset.accumulatedDepreciation ?? '0') + amountCents,
        );
        asset.bookValue = bookValueAfter;
        touch(asset, actor.id);

        transactionIds.push(posted.transactionId);
        depreciated += 1;
      }

      if (depreciated === 0) {
        throw new PreconditionFailedException(
          'No hay activos elegibles para depreciar en el periodo',
          {
            fiscalPeriodId: dto.fiscalPeriodId,
          },
        );
      }

      return { depreciatedAssets: depreciated, transactionIds };
    });
  }
}
