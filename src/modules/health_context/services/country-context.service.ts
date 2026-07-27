import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { HealthContextRepository } from '../repositories';
import {
  CreateContextDto,
  ContextResponseDto,
  DraftContextVersionDto,
  ContextVersionResponseDto,
  RecordQualityReviewDto,
  QualityReviewResponseDto,
  PublishVersionResponseDto,
  SupersedeVersionDto,
  SupersedeVersionResponseDto,
  ResolvedContextResponseDto,
  ResolvedFactDto,
  type ReviewOutcome,
} from '../dto';

const REVIEW_OUTCOME_CONCEPT: Readonly<Record<ReviewOutcome, string>> = {
  APPROVED: CONCEPTS.HCTX_REVIEW_APPROVED,
  REJECTED: CONCEPTS.HCTX_REVIEW_REJECTED,
};

/** Estados de corrida desde los que sus observaciones ya sirven de evidencia. */
const USABLE_RUN_STATES: readonly string[] = [
  CONCEPTS.HCTX_RUN_RUNNING,
  CONCEPTS.HCTX_RUN_SUCCEEDED,
];

/**
 * Contexto de salud por país: alta, versiones con hechos y evidencia, revisión
 * de calidad, publicación, retiro y resolución para consumo
 * (UC-44-04, 07 … 09, 11, 12).
 */
@Injectable()
export class CountryContextService {
  constructor(
    private readonly em: EntityManager,
    private readonly contextRepo: HealthContextRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CountryContextService.name);
  }

  /** UC-44-04: crear el contexto raíz. Nace en borrador, sin versión vigente. */
  async createContext(
    dto: CreateContextDto,
    actor: AuthenticatedUser,
  ): Promise<ContextResponseDto> {
    this.logger.info(
      {
        operation: 'health-context.context.create',
        contextKey: dto.contextKey,
      },
      'Creating country health context',
    );

    return this.em.transactional(async (tx) => {
      const duplicate = await this.contextRepo.findContextByKey(
        tx,
        dto.countryConceptId,
        dto.contextDomainConceptId,
        dto.contextKey,
      );
      if (duplicate) {
        throw new ConflictException(
          'Ya existe ese contexto para el país y el dominio',
          {
            contextKey: dto.contextKey,
          },
        );
      }

      const context = this.contextRepo.createContext(tx, {
        countryConceptId: dto.countryConceptId,
        contextDomainConceptId: dto.contextDomainConceptId,
        contextKey: dto.contextKey,
        title: dto.title,
        description: dto.description,
        statusConceptId: CONCEPTS.HCTX_CONTEXT_DRAFT,
        actorUserId: actor.id,
      });

      return {
        id: context.id,
        contextKey: dto.contextKey,
        statusConceptId: CONCEPTS.HCTX_CONTEXT_DRAFT,
      };
    });
  }

  /**
   * UC-44-07: redactar la versión con sus hechos y la evidencia de cada uno.
   *
   * Un hecho sin evidencia retenida se rechaza: el valor de este módulo es
   * poder decir de dónde salió cada dato, y un hecho huérfano lo destruye. La
   * evidencia además debe apuntar a observaciones **de la misma corrida**, o el
   * respaldo sería de otra recolección distinta a la que se está versionando.
   */
  async draftVersion(
    contextId: string,
    dto: DraftContextVersionDto,
    actor: AuthenticatedUser,
  ): Promise<ContextVersionResponseDto> {
    this.logger.info(
      {
        operation: 'health-context.version.draft',
        contextId,
        facts: dto.facts.length,
      },
      'Drafting country health context version',
    );

    this.assertUniqueFactKeys(dto, contextId);

    return this.em.transactional(async (tx) => {
      // El contexto se bloquea porque el número de versión sale de un máximo.
      const context = await this.contextRepo.findContextForUpdate(
        tx,
        contextId,
      );
      if (!context) {
        throw new ResourceNotFoundException('Contexto no encontrado', {
          contextId,
        });
      }

      const run = await this.contextRepo.findRunById(tx, dto.collectionRunId);
      if (!run) {
        throw new ResourceNotFoundException('Corrida no encontrada', {
          collectionRunId: dto.collectionRunId,
        });
      }
      if (!USABLE_RUN_STATES.includes(run.statusConceptId)) {
        throw new PreconditionFailedException(
          'La corrida no está en un estado del que se pueda versionar',
          { collectionRunId: dto.collectionRunId },
        );
      }
      if (run.countryConceptId !== context.countryConceptId) {
        throw new PreconditionFailedException('La corrida es de otro país', {
          contextId,
          collectionRunId: dto.collectionRunId,
        });
      }

      const observations = await this.contextRepo.findObservationsByRun(
        tx,
        dto.collectionRunId,
      );
      const accepted = new Set(
        observations
          .filter(
            (observation) =>
              observation.statusConceptId === CONCEPTS.HCTX_OBS_ACCEPTED,
          )
          .map((observation) => observation.id),
      );

      const latest = await this.contextRepo.findLatestVersion(tx, contextId);
      const versionNumber = (latest?.versionNumber ?? 0) + 1;
      const contentHash = this.contentHash(dto.contextPayloadJson);

      const version = this.contextRepo.createContextVersion(tx, {
        countryHealthContextId: contextId,
        versionNumber,
        collectionRunId: dto.collectionRunId,
        schemaVersion: dto.schemaVersion,
        summary: dto.summary,
        contextPayloadJson: dto.contextPayloadJson,
        observedAt: dto.observedAt ? new Date(dto.observedAt) : undefined,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        confidenceScore: dto.confidenceScore,
        contentHash,
        statusConceptId: CONCEPTS.HCTX_VERSION_DRAFT,
        recordedByUserId: actor.id,
      });

      const factIds: string[] = [];
      let evidenceCount = 0;
      for (const fact of dto.facts) {
        for (const evidence of fact.evidence) {
          if (!accepted.has(evidence.sourceObservationId)) {
            throw new PreconditionFailedException(
              'La evidencia debe apuntar a una observación aceptada de la misma corrida',
              {
                contextId,
                factKey: fact.factKey,
                sourceObservationId: evidence.sourceObservationId,
              },
            );
          }
        }

        const created = this.contextRepo.createFact(tx, {
          contextVersionId: version.id,
          factKey: fact.factKey,
          metricConceptId: fact.metricConceptId,
          valueType: fact.valueType,
          valueJson: fact.valueJson,
          unitConceptId: fact.unitConceptId,
          periodStart: fact.periodStart
            ? new Date(fact.periodStart)
            : undefined,
          periodEnd: fact.periodEnd ? new Date(fact.periodEnd) : undefined,
          confidenceScore: fact.confidenceScore,
          statusConceptId: CONCEPTS.STATE_ACTIVE,
          recordedByUserId: actor.id,
        });
        factIds.push(created.id);

        for (const evidence of fact.evidence) {
          this.contextRepo.createFactEvidence(tx, {
            healthContextFactId: created.id,
            sourceObservationId: evidence.sourceObservationId,
            evidenceLocatorJson: evidence.evidenceLocatorJson,
            relevanceScore: evidence.relevanceScore,
            evidenceHash: evidence.evidenceHash,
            recordedByUserId: actor.id,
          });
          evidenceCount += 1;
        }
      }

      // La versión nace en borrador y no toca `current_version_id`: publicar es
      // una decisión aparte, y antes tiene que pasar por revisión.
      return {
        id: version.id,
        versionNumber,
        statusConceptId: CONCEPTS.HCTX_VERSION_DRAFT,
        contentHash,
        factIds,
        evidenceCount,
      };
    });
  }

  /**
   * UC-44-08: registrar la revisión de calidad. El log admite varias; la que
   * mueve el estado es cada una, y un rechazo bloquea la publicación.
   */
  async recordQualityReview(
    versionId: string,
    dto: RecordQualityReviewDto,
    actor: AuthenticatedUser,
  ): Promise<QualityReviewResponseDto> {
    this.logger.info(
      {
        operation: 'health-context.version.review',
        versionId,
        outcome: dto.outcome,
      },
      'Recording context quality review',
    );

    return this.em.transactional(async (tx) => {
      const version = await this.contextRepo.findVersionForUpdate(
        tx,
        versionId,
      );
      if (!version) {
        throw new ResourceNotFoundException('Versión no encontrada', {
          versionId,
        });
      }
      if (version.statusConceptId !== CONCEPTS.HCTX_VERSION_DRAFT) {
        throw new PreconditionFailedException(
          'La versión no está en borrador',
          { versionId },
        );
      }

      const review = this.contextRepo.createQualityReview(tx, {
        contextVersionId: versionId,
        reviewerAgentId: dto.reviewerAgentId,
        // Una revisión automática la firma el agente; una humana, quien la hace.
        reviewedByUserId: dto.reviewerAgentId ? undefined : actor.id,
        reviewTypeConceptId: dto.reviewTypeConceptId,
        outcomeConceptId: REVIEW_OUTCOME_CONCEPT[dto.outcome],
        issuesJson: dto.issuesJson,
        notes: dto.notes,
      });

      version.statusConceptId =
        dto.outcome === 'APPROVED'
          ? CONCEPTS.HCTX_VERSION_APPROVED
          : CONCEPTS.HCTX_VERSION_REJECTED;

      if (dto.outcome === 'REJECTED') {
        this.logger.warn(
          { operation: 'health-context.version.review', versionId },
          'Context version rejected in quality review',
        );
      }

      return {
        id: review.id,
        contextVersionId: versionId,
        versionStatusConceptId: version.statusConceptId,
      };
    });
  }

  /**
   * UC-44-09: publicar la versión aprobada y avanzar el contexto. La publicada
   * anterior queda superseded en la misma transacción: sólo puede haber una
   * vigente, o un consumidor no sabría cuál le corresponde.
   */
  async publishVersion(
    versionId: string,
    actor: AuthenticatedUser,
  ): Promise<PublishVersionResponseDto> {
    this.logger.info(
      { operation: 'health-context.version.publish', versionId },
      'Publishing country health context version',
    );

    return this.em.transactional(async (tx) => {
      const version = await this.contextRepo.findVersionForUpdate(
        tx,
        versionId,
      );
      if (!version) {
        throw new ResourceNotFoundException('Versión no encontrada', {
          versionId,
        });
      }
      if (version.statusConceptId !== CONCEPTS.HCTX_VERSION_APPROVED) {
        throw new PreconditionFailedException(
          'Sólo se publica una versión aprobada en revisión de calidad',
          { versionId },
        );
      }

      const context = await this.contextRepo.findContextForUpdate(
        tx,
        version.countryHealthContextId,
      );
      if (!context) {
        throw new ResourceNotFoundException('Contexto no encontrado', {
          contextId: version.countryHealthContextId,
        });
      }

      const now = new Date();
      const previous = await this.contextRepo.findPublishedVersionForUpdate(
        tx,
        context.id,
        CONCEPTS.HCTX_VERSION_PUBLISHED,
      );
      if (previous) {
        previous.statusConceptId = CONCEPTS.HCTX_VERSION_SUPERSEDED;
        previous.effectiveTo = now;
      }

      version.statusConceptId = CONCEPTS.HCTX_VERSION_PUBLISHED;
      version.effectiveFrom ??= now;
      version.effectiveTo = undefined;

      context.currentVersionId = version.id;
      context.statusConceptId = CONCEPTS.HCTX_CONTEXT_ACTIVE;
      touch(context, actor.id);

      return {
        id: version.id,
        versionNumber: version.versionNumber,
        statusConceptId: CONCEPTS.HCTX_VERSION_PUBLISHED,
        countryHealthContextId: context.id,
        supersededVersionId: previous?.id,
      };
    });
  }

  /**
   * UC-44-11: retirar la versión vigente, con reemplazo o por caducidad. Sin
   * reemplazo el contexto queda obsoleto en lugar de activo: seguir marcándolo
   * activo cuando ya no entrega nada engañaría al consumidor.
   */
  async supersedeVersion(
    versionId: string,
    dto: SupersedeVersionDto,
    actor: AuthenticatedUser,
  ): Promise<SupersedeVersionResponseDto> {
    this.logger.info(
      {
        operation: 'health-context.version.supersede',
        versionId,
        mode: dto.mode,
      },
      'Superseding country health context version',
    );

    if (dto.mode === 'SUPERSEDED' && !dto.replacementVersionId) {
      throw new PreconditionFailedException(
        'Sustituir exige declarar la versión que reemplaza',
        {
          versionId,
        },
      );
    }

    return this.em.transactional(async (tx) => {
      const version = await this.contextRepo.findVersionForUpdate(
        tx,
        versionId,
      );
      if (!version) {
        throw new ResourceNotFoundException('Versión no encontrada', {
          versionId,
        });
      }
      if (version.statusConceptId !== CONCEPTS.HCTX_VERSION_PUBLISHED) {
        throw new PreconditionFailedException('La versión no está publicada', {
          versionId,
        });
      }

      const context = await this.contextRepo.findContextForUpdate(
        tx,
        version.countryHealthContextId,
      );
      if (!context) {
        throw new ResourceNotFoundException('Contexto no encontrado', {
          contextId: version.countryHealthContextId,
        });
      }

      const now = new Date();
      let currentVersionId: string | undefined;

      if (dto.mode === 'SUPERSEDED') {
        const replacement = await this.contextRepo.findVersionForUpdate(
          tx,
          dto.replacementVersionId as string,
        );
        if (!replacement) {
          throw new ResourceNotFoundException(
            'Versión de reemplazo no encontrada',
            {
              replacementVersionId: dto.replacementVersionId,
            },
          );
        }
        if (replacement.countryHealthContextId !== context.id) {
          throw new PreconditionFailedException(
            'El reemplazo es de otro contexto',
            {
              versionId,
              replacementVersionId: dto.replacementVersionId,
            },
          );
        }
        if (replacement.statusConceptId !== CONCEPTS.HCTX_VERSION_APPROVED) {
          throw new PreconditionFailedException(
            'El reemplazo debe estar aprobado en revisión de calidad',
            { replacementVersionId: dto.replacementVersionId },
          );
        }

        replacement.statusConceptId = CONCEPTS.HCTX_VERSION_PUBLISHED;
        replacement.effectiveFrom ??= now;
        replacement.effectiveTo = undefined;
        currentVersionId = replacement.id;
      }

      version.statusConceptId =
        dto.mode === 'SUPERSEDED'
          ? CONCEPTS.HCTX_VERSION_SUPERSEDED
          : CONCEPTS.HCTX_VERSION_EXPIRED;
      version.effectiveTo = now;
      version.expiresAt ??= now;

      context.currentVersionId = currentVersionId;
      context.statusConceptId = currentVersionId
        ? CONCEPTS.HCTX_CONTEXT_ACTIVE
        : CONCEPTS.HCTX_CONTEXT_STALE;
      touch(context, actor.id);

      this.logger.warn(
        {
          operation: 'health-context.version.supersede',
          versionId,
          mode: dto.mode,
          reason: dto.reason,
          contextStatusConceptId: context.statusConceptId,
        },
        'Country health context version retired',
      );

      return {
        id: versionId,
        statusConceptId: version.statusConceptId,
        currentVersionId,
        contextStatusConceptId: context.statusConceptId,
      };
    });
  }

  /**
   * UC-44-12: resolver el contexto vigente para consumo, con sus hechos y la
   * trazabilidad a las observaciones que los respaldan.
   *
   * Una versión caducada se devuelve marcada como obsoleta en lugar de negarse:
   * el consumidor suele preferir un dato viejo declarado como tal a no tener
   * ninguno, y esconderlo le quitaría la decisión.
   */
  async resolveContext(
    countryConceptId: string,
    contextDomainConceptId: string,
    contextKey: string,
  ): Promise<ResolvedContextResponseDto> {
    return this.em.transactional(async (tx) => {
      const context = await this.contextRepo.findContextByKey(
        tx,
        countryConceptId,
        contextDomainConceptId,
        contextKey,
      );
      if (!context) {
        throw new ResourceNotFoundException('Contexto no encontrado', {
          contextKey,
        });
      }
      if (!context.currentVersionId) {
        throw new PreconditionFailedException(
          'El contexto no tiene versión vigente',
          {
            contextId: context.id,
            contextKey,
          },
        );
      }

      const version = await this.contextRepo.findVersionById(
        tx,
        context.currentVersionId,
      );
      if (!version) {
        throw new ResourceNotFoundException('La versión vigente no existe', {
          contextId: context.id,
          versionId: context.currentVersionId,
        });
      }
      if (version.statusConceptId !== CONCEPTS.HCTX_VERSION_PUBLISHED) {
        throw new PreconditionFailedException(
          'La versión vigente no está publicada',
          {
            contextId: context.id,
            versionId: version.id,
          },
        );
      }

      const facts = await this.contextRepo.findFactsByVersion(tx, version.id);
      const evidence = facts.length
        ? await this.contextRepo.findEvidenceByFacts(
            tx,
            facts.map((fact) => fact.id),
          )
        : [];

      const byFact = new Map<string, string[]>();
      for (const link of evidence) {
        const list = byFact.get(link.healthContextFactId) ?? [];
        list.push(link.sourceObservationId);
        byFact.set(link.healthContextFactId, list);
      }

      const resolvedFacts: ResolvedFactDto[] = facts.map((fact) => ({
        id: fact.id,
        factKey: fact.factKey,
        valueType: fact.valueType,
        valueJson: fact.valueJson,
        metricConceptId: fact.metricConceptId,
        unitConceptId: fact.unitConceptId,
        confidenceScore: fact.confidenceScore,
        evidenceObservationIds: byFact.get(fact.id) ?? [],
      }));

      const stale =
        version.expiresAt !== undefined &&
        version.expiresAt.getTime() <= Date.now();
      if (stale) {
        this.logger.warn(
          {
            operation: 'health-context.context.resolve',
            contextId: context.id,
            contextKey,
          },
          'Resolved a country health context whose version already expired',
        );
      }

      return {
        contextId: context.id,
        versionId: version.id,
        versionNumber: version.versionNumber,
        contextPayloadJson: version.contextPayloadJson,
        observedAt: version.observedAt?.toISOString(),
        expiresAt: version.expiresAt?.toISOString(),
        stale,
        facts: resolvedFacts,
      };
    });
  }

  // --- Apoyo ---

  private assertUniqueFactKeys(
    dto: DraftContextVersionDto,
    contextId: string,
  ): void {
    const seen = new Set<string>();
    for (const fact of dto.facts) {
      if (seen.has(fact.factKey)) {
        throw new PreconditionFailedException(
          'La clave del hecho está repetida en la versión',
          {
            contextId,
            factKey: fact.factKey,
          },
        );
      }
      seen.add(fact.factKey);
    }
  }

  /** Hash del payload con las claves ordenadas, para que no dependa del orden. */
  private contentHash(payload: unknown): string {
    return createHash('sha256')
      .update(this.canonicalise(payload))
      .digest('hex');
  }

  private canonicalise(value: unknown): string {
    if (value === null || typeof value !== 'object')
      return JSON.stringify(value) ?? 'null';
    if (Array.isArray(value)) {
      return `[${value.map((item) => this.canonicalise(item)).join(',')}]`;
    }

    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(
        ([key, item]) => `${JSON.stringify(key)}:${this.canonicalise(item)}`,
      );

    return `{${entries.join(',')}}`;
  }
}
