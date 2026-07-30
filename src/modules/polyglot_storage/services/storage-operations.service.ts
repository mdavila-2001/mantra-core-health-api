import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import {
  StorageBackendsRepository,
  PlacementsRepository,
  StoragePoliciesRepository,
  DatasetsRepository,
} from '../repositories';
import {
  FAILOVER_MODE,
  HEALTH_STATUS,
  PLACEMENT_STATE,
  POLICY_STATE,
} from '../constants';
import {
  RecordHealthCheckDto,
  HealthCheckResponseDto,
  FailoverPlacementDto,
  FailoverResponseDto,
  ConsolidateCostSnapshotDto,
  CostSnapshotResponseDto,
  DefineIntegrityPolicyDto,
  IntegrityPolicyResponseDto,
  VerifyIntegrityDto,
  VerifyIntegrityResponseDto,
} from '../dto';

/** Estados desde los que una colocación todavía sirve tráfico. */
const LIVE_PLACEMENT_STATES: string[] = [
  PLACEMENT_STATE.APPROVED,
  PLACEMENT_STATE.ACTIVATED,
];

/**
 * Operación del almacenamiento: salud y failover, consolidación de costes y
 * verificación de integridad de las proyecciones
 * (UC-54-11, 12, 13).
 */
@Injectable()
export class StorageOperationsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param backendsRepo - Valor de backends repo requerido por la operación.
   * @param placementsRepo - Valor de placements repo requerido por la operación.
   * @param policiesRepo - Valor de policies repo requerido por la operación.
   * @param datasetsRepo - Valor de datasets repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly backendsRepo: StorageBackendsRepository,
    private readonly placementsRepo: PlacementsRepository,
    private readonly policiesRepo: StoragePoliciesRepository,
    private readonly datasetsRepo: DatasetsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(StorageOperationsService.name);
  }

  /**
   * UC-54-11: registrar la comprobación de salud y, si la región cayó, degradar
   * sus colocaciones y mover el tráfico al secundario.
   *
   * **El failover automático sólo ocurre si la política lo autoriza.** Mover
   * tráfico entre regiones puede cruzar una frontera de residencia, así que no
   * es una decisión que el monitor pueda tomar por su cuenta.
   */
  async recordHealthCheck(
    dto: RecordHealthCheckDto,
  ): Promise<HealthCheckResponseDto> {
    return this.em.transactional(async (tx) => {
      const region = await this.backendsRepo.findRegionForUpdate(
        tx,
        dto.storageBackendRegionId,
      );
      if (!region) {
        throw new ResourceNotFoundException('Región no encontrada', {
          storageBackendRegionId: dto.storageBackendRegionId,
        });
      }

      const check = this.backendsRepo.createHealthCheck(tx, {
        storageBackendRegionId: dto.storageBackendRegionId,
        checkType: dto.checkType,
        status: dto.status,
        latencyMs: dto.latencyMs,
        detailsJson: dto.detailsJson,
      });

      if (dto.status !== HEALTH_STATUS.UNHEALTHY) {
        return {
          id: check.id,
          status: dto.status,
          degradedPlacements: 0,
          swappedBindings: 0,
        };
      }

      const placements =
        await this.placementsRepo.findPlacementsByRegionForUpdate(
          tx,
          dto.storageBackendRegionId,
          LIVE_PLACEMENT_STATES,
        );

      let degradedPlacements = 0;
      let swappedBindings = 0;

      for (const placement of placements) {
        const policy = placement.replicationPolicyId
          ? await this.policiesRepo.findReplicationPolicyById(
              tx,
              placement.replicationPolicyId,
            )
          : null;
        if (policy?.failoverMode !== FAILOVER_MODE.AUTOMATIC) continue;

        placement.state = PLACEMENT_STATE.DEGRADED;
        degradedPlacements += 1;
        swappedBindings += await this.swapBindings(tx, placement.id);
      }

      this.logger.warn(
        {
          operation: 'polyglot.health.check',
          regionId: dto.storageBackendRegionId,
          degradedPlacements,
          swappedBindings,
        },
        'Storage region reported unhealthy',
      );

      return {
        id: check.id,
        status: dto.status,
        degradedPlacements,
        swappedBindings,
      };
    });
  }

  /** UC-54-11: forzar el failover de una colocación a mano. */
  async failoverPlacement(
    placementId: string,
    dto: FailoverPlacementDto,
    actor: AuthenticatedUser,
  ): Promise<FailoverResponseDto> {
    return this.em.transactional(async (tx) => {
      const placement = await this.placementsRepo.findPlacementForUpdate(
        tx,
        placementId,
      );
      if (!placement) {
        throw new ResourceNotFoundException('Colocación no encontrada', {
          placementId,
        });
      }
      if (!LIVE_PLACEMENT_STATES.includes(placement.state)) {
        throw new PreconditionFailedException(
          'La colocación no está sirviendo tráfico',
          {
            placementId,
            state: placement.state,
          },
        );
      }

      placement.state = PLACEMENT_STATE.DEGRADED;
      const swappedBindings = await this.swapBindings(tx, placementId);

      this.logger.warn(
        {
          operation: 'polyglot.placement.failover',
          placementId,
          swappedBindings,
          actorUserId: actor.id,
          reason: dto.reason,
        },
        'Placement failed over manually',
      );

      return { placementId, state: PLACEMENT_STATE.DEGRADED, swappedBindings };
    });
  }

  /**
   * UC-54-12: consolidar la instantánea de costes.
   *
   * Idempotente por ámbito y periodo: reconsolidar el mismo mes **actualiza** en
   * lugar de sumar una segunda fila, que es lo que duplicaría la factura.
   */
  async consolidateCostSnapshot(
    dto: ConsolidateCostSnapshotDto,
  ): Promise<CostSnapshotResponseDto> {
    const periodStart = new Date(dto.periodStart);
    const periodEnd = new Date(dto.periodEnd);
    if (periodEnd <= periodStart) {
      throw new PreconditionFailedException('El periodo está invertido', {
        periodStart: dto.periodStart,
        periodEnd: dto.periodEnd,
      });
    }
    // Consolidar un periodo que aún no ha terminado daría un coste parcial que
    // parecería definitivo.
    if (periodEnd.getTime() > Date.now()) {
      throw new PreconditionFailedException(
        'El periodo todavía no ha cerrado',
        {
          periodEnd: dto.periodEnd,
        },
      );
    }

    return this.em.transactional(async (tx) => {
      const region = await this.backendsRepo.findRegionById(
        tx,
        dto.storageBackendRegionId,
      );
      if (!region) {
        throw new ResourceNotFoundException('Región no encontrada', {
          storageBackendRegionId: dto.storageBackendRegionId,
        });
      }

      const existing = await this.placementsRepo.findCostSnapshotForUpdate(
        tx,
        dto.storageBackendRegionId,
        dto.tenantId,
        dto.datasetDefinitionId,
        periodStart,
        periodEnd,
      );

      if (existing) {
        existing.storageBytes = dto.storageBytes;
        existing.readUnits = dto.readUnits;
        existing.writeUnits = dto.writeUnits;
        existing.egressBytes = dto.egressBytes;
        existing.estimatedCost = dto.estimatedCost;
        existing.currencyCode = dto.currencyCode;

        return {
          id: existing.id,
          estimatedCost: dto.estimatedCost,
          updated: true,
        };
      }

      const snapshot = this.placementsRepo.createCostSnapshot(tx, {
        storageBackendRegionId: dto.storageBackendRegionId,
        tenantId: dto.tenantId,
        datasetDefinitionId: dto.datasetDefinitionId,
        periodStart,
        periodEnd,
        storageBytes: dto.storageBytes,
        readUnits: dto.readUnits,
        writeUnits: dto.writeUnits,
        egressBytes: dto.egressBytes,
        estimatedCost: dto.estimatedCost,
        currencyCode: dto.currencyCode,
      });

      return {
        id: snapshot.id,
        estimatedCost: dto.estimatedCost,
        updated: false,
      };
    });
  }

  /** UC-54-13: definir la política de integridad del dataset. Una por dataset. */
  async defineIntegrityPolicy(
    dto: DefineIntegrityPolicyDto,
  ): Promise<IntegrityPolicyResponseDto> {
    const sample = Number(dto.samplePercentage);
    if (!Number.isFinite(sample) || sample <= 0 || sample > 100) {
      throw new PreconditionFailedException(
        'El porcentaje de muestra debe estar entre 0 y 100',
        { samplePercentage: dto.samplePercentage },
      );
    }

    return this.em.transactional(async (tx) => {
      const dataset = await this.datasetsRepo.findDatasetById(
        tx,
        dto.datasetDefinitionId,
      );
      if (!dataset) {
        throw new ResourceNotFoundException('Dataset no encontrado', {
          datasetDefinitionId: dto.datasetDefinitionId,
        });
      }

      const existing = await this.placementsRepo.findIntegrityPolicyForUpdate(
        tx,
        dto.datasetDefinitionId,
      );
      if (existing) {
        existing.hashAlgorithm = dto.hashAlgorithm;
        existing.verificationIntervalHours = dto.verificationIntervalHours;
        existing.samplePercentage = dto.samplePercentage;
        existing.compareWithCanonicalSource =
          dto.compareWithCanonicalSource ?? true;
        existing.quarantineOnMismatch = dto.quarantineOnMismatch ?? true;
        existing.state = POLICY_STATE.ACTIVE;

        return {
          id: existing.id,
          datasetDefinitionId: dto.datasetDefinitionId,
          state: POLICY_STATE.ACTIVE,
          updated: true,
        };
      }

      const policy = this.placementsRepo.createIntegrityPolicy(tx, {
        datasetDefinitionId: dto.datasetDefinitionId,
        hashAlgorithm: dto.hashAlgorithm,
        verificationIntervalHours: dto.verificationIntervalHours,
        samplePercentage: dto.samplePercentage,
        compareWithCanonicalSource: dto.compareWithCanonicalSource ?? true,
        quarantineOnMismatch: dto.quarantineOnMismatch ?? true,
        state: POLICY_STATE.ACTIVE,
      });

      return {
        id: policy.id,
        datasetDefinitionId: dto.datasetDefinitionId,
        state: POLICY_STATE.ACTIVE,
        updated: false,
      };
    });
  }

  /**
   * UC-54-13: verificar que la proyección cuadra con la fuente canónica.
   *
   * Si no cuadra y la política lo ordena, la colocación queda en cuarentena:
   * seguir sirviendo una proyección que ya se sabe divergente es devolver datos
   * incorrectos sin avisar.
   */
  async verifyIntegrity(
    datasetId: string,
    dto: VerifyIntegrityDto,
  ): Promise<VerifyIntegrityResponseDto> {
    return this.em.transactional(async (tx) => {
      const policy = await this.placementsRepo.findIntegrityPolicy(
        tx,
        datasetId,
      );
      if (!policy) {
        throw new ResourceNotFoundException(
          'El dataset no tiene política de integridad',
          {
            datasetId,
          },
        );
      }

      const placement = await this.placementsRepo.findPlacementForUpdate(
        tx,
        dto.placementId,
      );
      if (!placement) {
        throw new ResourceNotFoundException('Colocación no encontrada', {
          placementId: dto.placementId,
        });
      }

      const matched =
        dto.canonicalHash.toLowerCase() === dto.projectionHash.toLowerCase();
      const quarantined = !matched && policy.quarantineOnMismatch === true;

      if (quarantined) {
        placement.state = PLACEMENT_STATE.QUARANTINED;

        this.logger.warn(
          {
            operation: 'polyglot.integrity.verify',
            datasetId,
            placementId: dto.placementId,
          },
          'Projection diverges from its canonical source: placement quarantined',
        );
      }

      return {
        placementId: dto.placementId,
        matched,
        placementState: placement.state,
        quarantined,
      };
    });
  }

  // --- Apoyo ---

  /**
   * Mueve al secundario los vínculos cuyo primario acaba de caer. El que no
   * tiene secundario se queda como está: dejarlo sin primario lo dejaría sin
   * ningún sitio donde escribir, que es peor que escribir en algo degradado.
   */
  private async swapBindings(
    tx: EntityManager,
    placementId: string,
  ): Promise<number> {
    const bindings = await this.placementsRepo.findBindingsByPrimaryForUpdate(
      tx,
      placementId,
    );

    let swapped = 0;
    for (const binding of bindings) {
      if (!binding.secondaryPlacementId) continue;

      binding.primaryPlacementId = binding.secondaryPlacementId;
      binding.secondaryPlacementId = placementId;
      binding.updatedAt = new Date();
      swapped += 1;
    }

    return swapped;
  }
}
