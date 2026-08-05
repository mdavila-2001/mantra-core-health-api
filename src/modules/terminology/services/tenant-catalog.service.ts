import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  CatalogConceptsRepository,
  TenantCatalogRepository,
  ValueSetsRepository,
} from '../repositories';
import {
  type CatalogMode,
  type TenantCatalogPolicyResponseDto,
  type UpsertTenantCatalogPolicyDto,
} from '../dto';

/** Modo declarado por el administrador → concepto del catálogo. */
const CATALOG_MODE_CONCEPTS: Record<CatalogMode, string> = {
  INHERIT: CONCEPTS.TENANT_CATALOG_INHERIT,
  SUBSET: CONCEPTS.TENANT_CATALOG_SUBSET,
  EXTEND: CONCEPTS.TENANT_CATALOG_EXTEND,
};

/** Modo por omisión: el tenant hereda el catálogo global sin recortarlo. */
const DEFAULT_CATALOG_MODE: CatalogMode = 'INHERIT';

/**
 * Política de catálogo por tenant (UC-03-12): qué parte del catálogo global ve
 * cada tenant, con qué nombres y con qué valor por omisión.
 */
@Injectable()
export class TenantCatalogService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantCatalogRepo - Valor de tenant catalog repo requerido por la operación.
   * @param valueSetsRepo - Valor de value sets repo requerido por la operación.
   * @param conceptsRepo - Valor de concepts repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly tenantCatalogRepo: TenantCatalogRepository,
    private readonly valueSetsRepo: ValueSetsRepository,
    private readonly conceptsRepo: CatalogConceptsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TenantCatalogService.name);
  }

  /** UC-03-12: define (o redefine) la política de catálogo del tenant. */
  async upsertPolicy(
    tenantId: string,
    dto: UpsertTenantCatalogPolicyDto,
    actor: AuthenticatedUser,
  ): Promise<TenantCatalogPolicyResponseDto> {
    this.logger.info(
      {
        operation: 'terminology.tenant-catalog.upsert',
        tenantId,
        valueSetId: dto.valueSetId,
      },
      'Actualizando política de catálogo del tenant',
    );

    const mode = dto.mode ?? DEFAULT_CATALOG_MODE;
    const allowAlias = dto.allowAlias ?? false;
    const concepts = dto.concepts ?? [];

    // Renombrar sin `allowAlias` dejaría un alias guardado que la propia política
    // declara prohibido: se rechaza antes de tocar nada.
    const aliasWithoutPermission = concepts.some(
      (concept) => concept.aliasDisplay && !allowAlias,
    );
    if (aliasWithoutPermission) {
      throw new PreconditionFailedException(
        'La política no permite renombrar conceptos',
        {
          tenantId,
          valueSetId: dto.valueSetId,
        },
      );
    }
    const defaults = concepts.filter((concept) => concept.isDefault);
    if (defaults.length > 1) {
      throw new PreconditionFailedException(
        'Sólo un concepto puede ser el valor por omisión',
        {
          tenantId,
          conceptIds: defaults.map((concept) => concept.conceptId),
        },
      );
    }

    return this.em.transactional(async (tx) => {
      const valueSet = await this.valueSetsRepo.findById(tx, dto.valueSetId);
      if (!valueSet) {
        throw new ResourceNotFoundException(
          'Conjunto de valores no encontrado',
          {
            valueSetId: dto.valueSetId,
          },
        );
      }

      const existing = await this.tenantCatalogRepo.findPolicyForUpdate(
        tx,
        tenantId,
        dto.valueSetId,
      );
      const modeConceptId = CATALOG_MODE_CONCEPTS[mode];
      const validFrom = dto.validFrom ? new Date(dto.validFrom) : undefined;
      const validTo = dto.validTo ? new Date(dto.validTo) : undefined;

      let policyId: string;
      if (existing) {
        existing.modeConceptId = modeConceptId;
        existing.allowSubset = dto.allowSubset ?? false;
        existing.allowAlias = allowAlias;
        existing.allowLocalConcepts = dto.allowLocalConcepts ?? false;
        existing.validFrom = validFrom;
        existing.validTo = validTo;
        touch(existing, actor.id);
        policyId = existing.id;
      } else {
        const created = this.tenantCatalogRepo.createPolicy(tx, {
          tenantId,
          valueSetId: dto.valueSetId,
          modeConceptId,
          allowSubset: dto.allowSubset ?? false,
          allowAlias,
          allowLocalConcepts: dto.allowLocalConcepts ?? false,
          validFrom,
          validTo,
          actorUserId: actor.id,
        });
        policyId = created.id;
      }
      await tx.flush();

      // Un solo `is_default` por tenant: se degradan los anteriores con las filas
      // bloqueadas antes de promover el nuevo.
      if (defaults.length === 1) {
        const previous = await this.tenantCatalogRepo.findDefaultsForUpdate(
          tx,
          tenantId,
          concepts.map((concept) => concept.conceptId),
        );
        for (const config of previous) {
          if (config.conceptId !== defaults[0].conceptId) {
            config.isDefault = false;
            touch(config, actor.id);
          }
        }
      }

      let conceptsCreated = 0;
      let conceptsUpdated = 0;
      // En serie a propósito: dos entradas con el mismo `conceptId` en el mismo
      // cuerpo tienen que colapsar en una sola fila.
      for (const input of concepts) {
        const concept = await this.conceptsRepo.findById(tx, input.conceptId);
        if (!concept) {
          throw new ResourceNotFoundException('Concepto no encontrado', {
            conceptId: input.conceptId,
          });
        }

        const config = await this.tenantCatalogRepo.findConfig(
          tx,
          tenantId,
          input.conceptId,
        );
        if (config) {
          config.enabled = input.enabled ?? true;
          config.aliasDisplay = input.aliasDisplay;
          config.ordinal = input.ordinal;
          config.isDefault = input.isDefault ?? false;
          touch(config, actor.id);
          conceptsUpdated += 1;
        } else {
          this.tenantCatalogRepo.createConfig(tx, {
            tenantId,
            conceptId: input.conceptId,
            enabled: input.enabled ?? true,
            aliasDisplay: input.aliasDisplay,
            ordinal: input.ordinal,
            isDefault: input.isDefault ?? false,
            actorUserId: actor.id,
          });
          conceptsCreated += 1;
        }
        await tx.flush();
      }

      this.logger.info(
        {
          operation: 'terminology.tenant-catalog.upsert',
          tenantId,
          policyId,
          conceptsCreated,
          conceptsUpdated,
        },
        'Política de catálogo del tenant actualizada',
      );
      return {
        id: policyId,
        tenantId,
        valueSetId: dto.valueSetId,
        modeConceptId,
        conceptsCreated,
        conceptsUpdated,
        updated: Boolean(existing),
      };
    });
  }
}
