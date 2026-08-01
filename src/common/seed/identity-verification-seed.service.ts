import { Injectable } from '@nestjs/common';
import { MikroORM, type EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ExternalProviders,
  IntegrationEndpoints,
} from '../../modules/integrations/entities';
import { INTEG } from '../../modules/integrations/integrations.concepts';
import {
  IdentityAuthorities,
  IdentityAuthorityEndpoints,
  IdentityVerificationPolicies,
} from '../../modules/identity_assurance/entities';
import { IDA } from '../../modules/identity_assurance/identity_assurance.concepts';
import {
  IDA_SEED,
  IDENTITY_VERIFICATION_VERTICALS,
} from '../../modules/identity_assurance/identity_assurance.seed';
import { CONCEPTS, SEED } from '../constants/concepts';

/**
 * Materializa los datos de referencia sin los cuales no se puede abrir un caso
 * de verificación de identidad: el proveedor externo y su endpoint HTTP, la
 * autoridad verificadora, un endpoint de autoridad por capacidad (carnet /
 * matrícula / documento de institución) y las tres políticas de verificación.
 *
 * Va aparte de `TerminologySeedService` porque son filas de dominio, no del
 * catálogo de terminología; corre después de él (mismo `OnApplicationBootstrap`,
 * registrado más tarde en `SeedModule`) porque depende de que sus conceptos y
 * el tenant por defecto ya existan.
 *
 * Idempotente igual que el seed de terminología: ids deterministas, se consulta
 * lo presente y sólo se inserta lo que falta. Se flushea por niveles porque las
 * FK son columnas uuid planas y MikroORM no ordena inserts entre entidades no
 * relacionadas.
 */
@Injectable()
export class IdentityVerificationSeedService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param orm - Valor de orm requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly orm: MikroORM,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(IdentityVerificationSeedService.name);
  }

  /**
   * Ejecuta el seed. Público para que las pruebas de integración lo invoquen
   * tras materializar el esquema.
   *
   * @returns Cuántas filas se insertaron en esta pasada.
   */
  async run(): Promise<{
    /**
     * Valor de inserted mantenido por la instancia.
     */
    inserted: number;
  }> {
    const em = this.orm.em.fork();
    const now = new Date();
    let inserted = 0;

    inserted += await this.seedProvider(em, now);
    await em.flush();

    inserted += await this.seedAuthority(em, now);
    await em.flush();

    inserted += await this.seedAuthorityEndpoints(em, now);
    inserted += await this.seedPolicies(em, now);
    await em.flush();

    if (inserted > 0) {
      this.logger.info(
        { inserted },
        'Datos de referencia de verificación de identidad materializados',
      );
    }
    return { inserted };
  }

  /** Proveedor externo + su endpoint HTTP en `integrations`. */
  private async seedProvider(em: EntityManager, now: Date): Promise<number> {
    let inserted = 0;

    if (!(await em.findOne(ExternalProviders, { id: IDA_SEED.providerId }))) {
      em.create(
        ExternalProviders,
        {
          id: IDA_SEED.providerId,
          code: IDA_SEED.providerCode,
          name: 'Identity verification provider',
          providerTypeConceptId: INTEG.PROVIDER_TYPE_GOV,
          authTypeConceptId: INTEG.AUTH_API_KEY,
          stateConceptId: INTEG.PROVIDER_ACTIVE,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      inserted++;
      // El endpoint referencia al proveedor por FK: separarlos en dos flushes.
      await em.flush();
    }

    if (
      !(await em.findOne(IntegrationEndpoints, {
        id: IDA_SEED.integrationEndpointId,
      }))
    ) {
      em.create(
        IntegrationEndpoints,
        {
          id: IDA_SEED.integrationEndpointId,
          providerId: IDA_SEED.providerId,
          code: IDA_SEED.integrationEndpointCode,
          operation: 'identity-verification',
          httpMethodConceptId: INTEG.HTTP_POST,
          // La URL base real la resuelve el worker por `.env`
          // (`MOCK_PROVIDER_BASE_URL`): esta fila documenta el contrato, no
          // enruta la llamada.
          path: '/identity-verification',
          version: '1',
          stateConceptId: INTEG.ENDPOINT_PUBLISHED,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      inserted++;
    }

    return inserted;
  }

  /** Autoridad verificadora del tenant por defecto. */
  private async seedAuthority(em: EntityManager, now: Date): Promise<number> {
    if (await em.findOne(IdentityAuthorities, { id: IDA_SEED.authorityId })) {
      return 0;
    }
    em.create(
      IdentityAuthorities,
      {
        id: IDA_SEED.authorityId,
        tenantId: SEED.tenantId,
        authorityCode: IDA_SEED.authorityCode,
        name: 'Default identity registry',
        authorityTypeConceptId: IDA.AUTHORITY_TYPE_REGISTRY,
        verificationStatusConceptId: IDA.AUTHORITY_VERIFIED,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        createdAt: now,
        updatedAt: now,
      },
      { partial: true },
    );
    return 1;
  }

  /**
   * Un endpoint de autoridad por capacidad. La capacidad ES el tipo de check,
   * de modo que el worker resuelve a qué endpoint despachar cada check sin una
   * tabla de traducción aparte.
   */
  private async seedAuthorityEndpoints(
    em: EntityManager,
    now: Date,
  ): Promise<number> {
    const ids = IDENTITY_VERIFICATION_VERTICALS.map(
      (v) => v.authorityEndpointId,
    );
    const existing = await em.find(IdentityAuthorityEndpoints, {
      id: { $in: ids },
    });
    const present = new Set(existing.map((row) => row.id));

    let inserted = 0;
    for (const verticalDef of IDENTITY_VERIFICATION_VERTICALS) {
      if (present.has(verticalDef.authorityEndpointId)) continue;
      em.create(
        IdentityAuthorityEndpoints,
        {
          id: verticalDef.authorityEndpointId,
          identityAuthorityId: IDA_SEED.authorityId,
          integrationEndpointId: IDA_SEED.integrationEndpointId,
          capabilityConceptId: verticalDef.checkTypeConceptId,
          assuranceLevelConceptId: IDA.ASSURANCE_LEVEL_IAL2,
          statusConceptId: CONCEPTS.STATE_ACTIVE,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      inserted++;
    }
    return inserted;
  }

  /** Las tres políticas de verificación (carnet, matrícula, institución). */
  private async seedPolicies(em: EntityManager, now: Date): Promise<number> {
    const ids = IDENTITY_VERIFICATION_VERTICALS.map((v) => v.policyId);
    const existing = await em.find(IdentityVerificationPolicies, {
      id: { $in: ids },
    });
    const present = new Set(existing.map((row) => row.id));

    let inserted = 0;
    for (const verticalDef of IDENTITY_VERIFICATION_VERTICALS) {
      if (present.has(verticalDef.policyId)) continue;
      em.create(
        IdentityVerificationPolicies,
        {
          id: verticalDef.policyId,
          policyCode: verticalDef.policyCode,
          subjectTypeConceptId: verticalDef.subjectTypeConceptId,
          transactionRiskConceptId: IDA.TRANSACTION_RISK_STANDARD,
          requiredIdentityAssuranceLevelConceptId: IDA.ASSURANCE_LEVEL_IAL2,
          evidenceRequirementsJson: {
            requiredEvidenceTypeConceptId: verticalDef.evidenceTypeConceptId,
            minimumEvidenceCount: 1,
          },
          versionNumber: 1,
          effectiveFrom: now,
          statusConceptId: CONCEPTS.STATE_ACTIVE,
          createdAt: now,
        },
        { partial: true },
      );
      inserted++;
    }
    return inserted;
  }
}
