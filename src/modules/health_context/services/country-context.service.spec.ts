import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { CountryContextService } from './country-context.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'user-1', roles: ['CONTEXT_CURATOR'] };
const CONTEXT = '11111111-1111-1111-1111-111111111111';
const VERSION = '22222222-2222-2222-2222-222222222222';
const RUN = '33333333-3333-3333-3333-333333333333';
const COUNTRY = '44444444-4444-4444-4444-444444444444';
const DOMAIN = '55555555-5555-5555-5555-555555555555';
const OBSERVATION = '66666666-6666-6666-6666-666666666666';
const REVIEW_TYPE = '77777777-7777-7777-7777-777777777777';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  let factSeq = 0;
  const contextRepo = {
    createContext: mockFn(() => ({ id: CONTEXT })),
    findContextById: mockFn(),
    findContextForUpdate: mockFn(),
    findContextByKey: mockFn(() => Promise.resolve(null)),
    createContextVersion: mockFn(() => ({ id: VERSION })),
    findVersionById: mockFn(),
    findVersionForUpdate: mockFn(),
    findLatestVersion: mockFn(() => Promise.resolve(null)),
    findPublishedVersionForUpdate: mockFn(() => Promise.resolve(null)),
    findRunById: mockFn(),
    findObservationsByRun: mockFn(() =>
      Promise.resolve([
        { id: OBSERVATION, statusConceptId: CONCEPTS.HCTX_OBS_ACCEPTED },
      ]),
    ),
    createFact: mockFn(() => ({ id: `fact-${++factSeq}` })),
    findFactsByVersion: mockFn(() => Promise.resolve([])),
    createFactEvidence: mockFn(() => ({ id: 'evidence-1' })),
    findEvidenceByFacts: mockFn(() => Promise.resolve([])),
    createQualityReview: mockFn(() => ({ id: 'review-1' })),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new CountryContextService(
    em as any,
    contextRepo as any,
    logger as any,
  );
  return { service, tx, contextRepo, logger };
}

/**
 * Ejecuta la operación draft context.
 *
 * @param overrides - Valor de overrides requerido por la operación.
 * @returns Resultado de draft context conforme al contrato `any`.
 */
function draftContext(overrides: Record<string, unknown> = {}): any {
  return {
    id: CONTEXT,
    countryConceptId: COUNTRY,
    statusConceptId: CONCEPTS.HCTX_CONTEXT_DRAFT,
    ...overrides,
  };
}

const FACT = {
  factKey: 'vaccination.coverage',
  valueType: 'decimal',
  valueJson: { value: 0.87 },
  evidence: [{ sourceObservationId: OBSERVATION }],
};

describe('CountryContextService', () => {
  describe('createContext (UC-44-04)', () => {
    const dto: any = {
      countryConceptId: COUNTRY,
      contextDomainConceptId: DOMAIN,
      contextKey: 'inmunizacion',
      title: 'Inmunización en Chile',
    };

    it('creates the context in draft', async () => {
      const d = build();

      const res = await d.service.createContext(dto, actor);

      expect(res).toEqual({
        id: CONTEXT,
        contextKey: 'inmunizacion',
        statusConceptId: CONCEPTS.HCTX_CONTEXT_DRAFT,
      });
    });

    it('rejects the same key for the same country and domain', async () => {
      const d = build();
      d.contextRepo.findContextByKey.mockResolvedValue({ id: 'other' });

      await expect(
        d.service.createContext(dto, actor as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('draftVersion (UC-44-07)', () => {
    const dto: any = {
      collectionRunId: RUN,
      contextPayloadJson: { coverage: 0.87 },
      facts: [FACT],
    };

    /**
     * Ejecuta la operación wire.
     *
     * @param d - Valor de d requerido por la operación.
     * @param context - Valor de context requerido por la operación.
     * @returns Resultado de wire.
     */
    function wire(d: ReturnType<typeof build>, context = draftContext()) {
      d.contextRepo.findContextForUpdate.mockResolvedValue(context);
      d.contextRepo.findRunById.mockResolvedValue({
        id: RUN,
        countryConceptId: COUNTRY,
        statusConceptId: CONCEPTS.HCTX_RUN_SUCCEEDED,
      });
      return context;
    }

    it('drafts version 1 with its facts and evidence', async () => {
      const d = build();
      wire(d);

      const res = await d.service.draftVersion(CONTEXT, dto, actor);

      expect(res).toMatchObject({
        id: VERSION,
        versionNumber: 1,
        statusConceptId: CONCEPTS.HCTX_VERSION_DRAFT,
        factIds: ['fact-1'],
        evidenceCount: 1,
      });
      expect(res.contentHash).toHaveLength(64);
    });

    it('continues the numbering from the latest version', async () => {
      const d = build();
      wire(d);
      d.contextRepo.findLatestVersion.mockResolvedValue({ versionNumber: 6 });

      const res = await d.service.draftVersion(CONTEXT, dto, actor);

      expect(res.versionNumber).toBe(7);
    });

    it('hashes the payload regardless of key order', async () => {
      const d = build();
      wire(d);

      const first = await d.service.draftVersion(CONTEXT, dto, actor);
      const second = await d.service.draftVersion(
        CONTEXT,
        { ...dto, contextPayloadJson: { coverage: 0.87 } },
        actor,
      );

      expect(first.contentHash).toBe(second.contentHash);
    });

    it('refuses evidence that points outside the accepted observations of the run', async () => {
      const d = build();
      wire(d);

      await expect(
        d.service.draftVersion(
          CONTEXT,
          {
            ...dto,
            facts: [
              {
                ...FACT,
                evidence: [{ sourceObservationId: 'observation-ajena' }],
              },
            ],
          },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses evidence on a rejected observation', async () => {
      const d = build();
      wire(d);
      d.contextRepo.findObservationsByRun.mockResolvedValue([
        { id: OBSERVATION, statusConceptId: CONCEPTS.HCTX_OBS_REJECTED },
      ]);

      await expect(
        d.service.draftVersion(CONTEXT, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a repeated fact key', async () => {
      const d = build();

      await expect(
        d.service.draftVersion(
          CONTEXT,
          { ...dto, facts: [FACT, FACT] },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses a run from another country', async () => {
      const d = build();
      wire(d);
      d.contextRepo.findRunById.mockResolvedValue({
        id: RUN,
        countryConceptId: 'otro-pais',
        statusConceptId: CONCEPTS.HCTX_RUN_SUCCEEDED,
      });

      await expect(
        d.service.draftVersion(CONTEXT, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses a failed run', async () => {
      const d = build();
      wire(d);
      d.contextRepo.findRunById.mockResolvedValue({
        id: RUN,
        countryConceptId: COUNTRY,
        statusConceptId: CONCEPTS.HCTX_RUN_FAILED,
      });

      await expect(
        d.service.draftVersion(CONTEXT, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('accepts a run that is still collecting', async () => {
      const d = build();
      wire(d);
      d.contextRepo.findRunById.mockResolvedValue({
        id: RUN,
        countryConceptId: COUNTRY,
        statusConceptId: CONCEPTS.HCTX_RUN_RUNNING,
      });

      const res = await d.service.draftVersion(CONTEXT, dto, actor);

      expect(res.id).toBe(VERSION);
    });

    it('fails when the context does not exist', async () => {
      const d = build();
      d.contextRepo.findContextForUpdate.mockResolvedValue(null);

      await expect(
        d.service.draftVersion(CONTEXT, dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('recordQualityReview (UC-44-08)', () => {
    const dto: any = { reviewTypeConceptId: REVIEW_TYPE, outcome: 'APPROVED' };

    /**
     * Ejecuta la operación draft version.
     *
     * @param overrides - Valor de overrides requerido por la operación.
     * @returns Resultado de draft version conforme al contrato `any`.
     */
    function draftVersion(overrides: Record<string, unknown> = {}): any {
      return {
        id: VERSION,
        statusConceptId: CONCEPTS.HCTX_VERSION_DRAFT,
        ...overrides,
      };
    }

    it('approves the version', async () => {
      const d = build();
      const version = draftVersion();
      d.contextRepo.findVersionForUpdate.mockResolvedValue(version);

      const res = await d.service.recordQualityReview(VERSION, dto, actor);

      expect(res.versionStatusConceptId).toBe(CONCEPTS.HCTX_VERSION_APPROVED);
      expect(version.statusConceptId).toBe(CONCEPTS.HCTX_VERSION_APPROVED);
    });

    it('signs a human review with the actor', async () => {
      const d = build();
      d.contextRepo.findVersionForUpdate.mockResolvedValue(draftVersion());

      await d.service.recordQualityReview(VERSION, dto, actor);

      expect(d.contextRepo.createQualityReview).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          reviewedByUserId: actor.id,
          reviewerAgentId: undefined,
        }),
      );
    });

    it('signs an automated review with the agent instead', async () => {
      const d = build();
      d.contextRepo.findVersionForUpdate.mockResolvedValue(draftVersion());

      await d.service.recordQualityReview(
        VERSION,
        { ...dto, reviewerAgentId: 'agent-1' },
        actor,
      );

      expect(d.contextRepo.createQualityReview).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          reviewerAgentId: 'agent-1',
          reviewedByUserId: undefined,
        }),
      );
    });

    it('rejects the version and warns', async () => {
      const d = build();
      const version = draftVersion();
      d.contextRepo.findVersionForUpdate.mockResolvedValue(version);

      const res = await d.service.recordQualityReview(
        VERSION,
        { ...dto, outcome: 'REJECTED' },
        actor,
      );

      expect(res.versionStatusConceptId).toBe(CONCEPTS.HCTX_VERSION_REJECTED);
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('refuses reviewing a version that is not a draft', async () => {
      const d = build();
      d.contextRepo.findVersionForUpdate.mockResolvedValue(
        draftVersion({ statusConceptId: CONCEPTS.HCTX_VERSION_PUBLISHED }),
      );

      await expect(
        d.service.recordQualityReview(VERSION, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the version does not exist', async () => {
      const d = build();
      d.contextRepo.findVersionForUpdate.mockResolvedValue(null);

      await expect(
        d.service.recordQualityReview(VERSION, dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('publishVersion (UC-44-09)', () => {
    /**
     * Ejecuta la operación approved version.
     *
     * @param overrides - Valor de overrides requerido por la operación.
     * @returns Resultado de approved version conforme al contrato `any`.
     */
    function approvedVersion(overrides: Record<string, unknown> = {}): any {
      return {
        id: VERSION,
        versionNumber: 2,
        countryHealthContextId: CONTEXT,
        statusConceptId: CONCEPTS.HCTX_VERSION_APPROVED,
        ...overrides,
      };
    }

    /**
     * Ejecuta la operación wire.
     *
     * @param d - Valor de d requerido por la operación.
     * @param version - Valor de version requerido por la operación.
     * @returns Resultado de wire.
     */
    function wire(d: ReturnType<typeof build>, version = approvedVersion()) {
      const context = draftContext();
      d.contextRepo.findVersionForUpdate.mockResolvedValue(version);
      d.contextRepo.findContextForUpdate.mockResolvedValue(context);
      return { context, version };
    }

    it('publishes the version and makes the context active', async () => {
      const d = build();
      const { context, version } = wire(d);

      const res = await d.service.publishVersion(VERSION, actor);

      expect(res).toMatchObject({
        id: VERSION,
        versionNumber: 2,
        statusConceptId: CONCEPTS.HCTX_VERSION_PUBLISHED,
        countryHealthContextId: CONTEXT,
      });
      expect(version.effectiveFrom).toBeInstanceOf(Date);
      expect(context.currentVersionId).toBe(VERSION);
      expect(context.statusConceptId).toBe(CONCEPTS.HCTX_CONTEXT_ACTIVE);
    });

    it('supersedes the version that was published', async () => {
      const d = build();
      wire(d);
      const previous: any = {
        id: 'version-prev',
        statusConceptId: CONCEPTS.HCTX_VERSION_PUBLISHED,
      };
      d.contextRepo.findPublishedVersionForUpdate.mockResolvedValue(previous);

      const res = await d.service.publishVersion(VERSION, actor);

      expect(res.supersededVersionId).toBe('version-prev');
      expect(previous.statusConceptId).toBe(CONCEPTS.HCTX_VERSION_SUPERSEDED);
      expect(previous.effectiveTo).toBeInstanceOf(Date);
    });

    it('keeps an effective date the version already had', async () => {
      const d = build();
      const original = new Date('2026-06-01T00:00:00.000Z');
      const { version } = wire(d, approvedVersion({ effectiveFrom: original }));

      await d.service.publishVersion(VERSION, actor);

      expect(version.effectiveFrom).toBe(original);
    });

    it('refuses publishing a version that was not approved', async () => {
      const d = build();
      wire(
        d,
        approvedVersion({ statusConceptId: CONCEPTS.HCTX_VERSION_DRAFT }),
      );

      await expect(
        d.service.publishVersion(VERSION, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the version does not exist', async () => {
      const d = build();
      d.contextRepo.findVersionForUpdate.mockResolvedValue(null);

      await expect(
        d.service.publishVersion(VERSION, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('supersedeVersion (UC-44-11)', () => {
    /**
     * Ejecuta la operación published version.
     *
     * @param overrides - Valor de overrides requerido por la operación.
     * @returns Resultado de published version conforme al contrato `any`.
     */
    function publishedVersion(overrides: Record<string, unknown> = {}): any {
      return {
        id: VERSION,
        countryHealthContextId: CONTEXT,
        statusConceptId: CONCEPTS.HCTX_VERSION_PUBLISHED,
        ...overrides,
      };
    }

    /**
     * Ejecuta la operación active context.
     * @returns Resultado de active context conforme al contrato `any`.
     */
    function activeContext(): any {
      return draftContext({
        statusConceptId: CONCEPTS.HCTX_CONTEXT_ACTIVE,
        currentVersionId: VERSION,
      });
    }

    it('replaces the version and keeps the context active', async () => {
      const d = build();
      const context = activeContext();
      const version = publishedVersion();
      const replacement: any = {
        id: 'version-next',
        countryHealthContextId: CONTEXT,
        statusConceptId: CONCEPTS.HCTX_VERSION_APPROVED,
      };
      d.contextRepo.findVersionForUpdate
        .mockResolvedValueOnce(version)
        .mockResolvedValueOnce(replacement);
      d.contextRepo.findContextForUpdate.mockResolvedValue(context);

      const res = await d.service.supersedeVersion(
        VERSION,
        {
          mode: 'SUPERSEDED',
          reason: 'llegó el boletín nuevo',
          replacementVersionId: 'version-next',
        } as any,
        actor,
      );

      expect(res).toEqual({
        id: VERSION,
        statusConceptId: CONCEPTS.HCTX_VERSION_SUPERSEDED,
        currentVersionId: 'version-next',
        contextStatusConceptId: CONCEPTS.HCTX_CONTEXT_ACTIVE,
      });
      expect(replacement.statusConceptId).toBe(CONCEPTS.HCTX_VERSION_PUBLISHED);
      expect(context.currentVersionId).toBe('version-next');
    });

    it('expires the version and leaves the context stale', async () => {
      const d = build();
      const context = activeContext();
      const version = publishedVersion();
      d.contextRepo.findVersionForUpdate.mockResolvedValue(version);
      d.contextRepo.findContextForUpdate.mockResolvedValue(context);

      const res = await d.service.supersedeVersion(
        VERSION,
        { mode: 'EXPIRED', reason: 'caducó el TTL de frescura' } as any,
        actor,
      );

      expect(res.statusConceptId).toBe(CONCEPTS.HCTX_VERSION_EXPIRED);
      expect(res.currentVersionId).toBeUndefined();
      expect(context.statusConceptId).toBe(CONCEPTS.HCTX_CONTEXT_STALE);
      expect(context.currentVersionId).toBeUndefined();
      expect(version.effectiveTo).toBeInstanceOf(Date);
    });

    it('demands a replacement when superseding', async () => {
      const d = build();

      await expect(
        d.service.supersedeVersion(
          VERSION,
          { mode: 'SUPERSEDED', reason: 'x' } as any,
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses a replacement that is not approved', async () => {
      const d = build();
      d.contextRepo.findVersionForUpdate
        .mockResolvedValueOnce(publishedVersion())
        .mockResolvedValueOnce({
          id: 'version-next',
          countryHealthContextId: CONTEXT,
          statusConceptId: CONCEPTS.HCTX_VERSION_DRAFT,
        });
      d.contextRepo.findContextForUpdate.mockResolvedValue(activeContext());

      await expect(
        d.service.supersedeVersion(
          VERSION,
          {
            mode: 'SUPERSEDED',
            reason: 'x',
            replacementVersionId: 'version-next',
          } as any,
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses a replacement from another context', async () => {
      const d = build();
      d.contextRepo.findVersionForUpdate
        .mockResolvedValueOnce(publishedVersion())
        .mockResolvedValueOnce({
          id: 'version-next',
          countryHealthContextId: 'otro-contexto',
          statusConceptId: CONCEPTS.HCTX_VERSION_APPROVED,
        });
      d.contextRepo.findContextForUpdate.mockResolvedValue(activeContext());

      await expect(
        d.service.supersedeVersion(
          VERSION,
          {
            mode: 'SUPERSEDED',
            reason: 'x',
            replacementVersionId: 'version-next',
          } as any,
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses retiring a version that is not published', async () => {
      const d = build();
      d.contextRepo.findVersionForUpdate.mockResolvedValue(
        publishedVersion({ statusConceptId: CONCEPTS.HCTX_VERSION_DRAFT }),
      );

      await expect(
        d.service.supersedeVersion(
          VERSION,
          { mode: 'EXPIRED', reason: 'x' } as any,
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the version does not exist', async () => {
      const d = build();
      d.contextRepo.findVersionForUpdate.mockResolvedValue(null);

      await expect(
        d.service.supersedeVersion(
          VERSION,
          { mode: 'EXPIRED', reason: 'x' } as any,
          actor as any,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('resolveContext (UC-44-12)', () => {
    /**
     * Ejecuta la operación published context.
     * @returns Resultado de published context conforme al contrato `any`.
     */
    function publishedContext(): any {
      return draftContext({
        statusConceptId: CONCEPTS.HCTX_CONTEXT_ACTIVE,
        currentVersionId: VERSION,
      });
    }

    /**
     * Ejecuta la operación live version.
     *
     * @param overrides - Valor de overrides requerido por la operación.
     * @returns Resultado de live version conforme al contrato `any`.
     */
    function liveVersion(overrides: Record<string, unknown> = {}): any {
      return {
        id: VERSION,
        versionNumber: 3,
        contextPayloadJson: { coverage: 0.87 },
        statusConceptId: CONCEPTS.HCTX_VERSION_PUBLISHED,
        ...overrides,
      };
    }

    it('resolves the live version with its facts and evidence', async () => {
      const d = build();
      d.contextRepo.findContextByKey.mockResolvedValue(publishedContext());
      d.contextRepo.findVersionById.mockResolvedValue(liveVersion());
      d.contextRepo.findFactsByVersion.mockResolvedValue([
        {
          id: 'fact-1',
          factKey: 'coverage',
          valueType: 'decimal',
          valueJson: { value: 0.87 },
        },
      ]);
      d.contextRepo.findEvidenceByFacts.mockResolvedValue([
        { healthContextFactId: 'fact-1', sourceObservationId: OBSERVATION },
      ]);

      const res = await d.service.resolveContext(
        COUNTRY,
        DOMAIN,
        'inmunizacion',
      );

      expect(res).toMatchObject({
        contextId: CONTEXT,
        versionId: VERSION,
        versionNumber: 3,
        stale: false,
      });
      expect(res.facts[0].evidenceObservationIds).toEqual([OBSERVATION]);
    });

    it('flags an expired version as stale instead of hiding it', async () => {
      const d = build();
      d.contextRepo.findContextByKey.mockResolvedValue(publishedContext());
      d.contextRepo.findVersionById.mockResolvedValue(
        liveVersion({ expiresAt: new Date('2026-01-01T00:00:00.000Z') }),
      );

      const res = await d.service.resolveContext(
        COUNTRY,
        DOMAIN,
        'inmunizacion',
      );

      expect(res.stale).toBe(true);
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('returns a fact with no evidence as an empty list', async () => {
      const d = build();
      d.contextRepo.findContextByKey.mockResolvedValue(publishedContext());
      d.contextRepo.findVersionById.mockResolvedValue(liveVersion());
      d.contextRepo.findFactsByVersion.mockResolvedValue([
        {
          id: 'fact-1',
          factKey: 'coverage',
          valueType: 'decimal',
          valueJson: {},
        },
      ]);

      const res = await d.service.resolveContext(
        COUNTRY,
        DOMAIN,
        'inmunizacion',
      );

      expect(res.facts[0].evidenceObservationIds).toEqual([]);
    });

    it('refuses a context with no live version', async () => {
      const d = build();
      d.contextRepo.findContextByKey.mockResolvedValue(draftContext());

      await expect(
        d.service.resolveContext(COUNTRY, DOMAIN, 'inmunizacion'),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses a live version that is not published', async () => {
      const d = build();
      d.contextRepo.findContextByKey.mockResolvedValue(publishedContext());
      d.contextRepo.findVersionById.mockResolvedValue(
        liveVersion({ statusConceptId: CONCEPTS.HCTX_VERSION_EXPIRED }),
      );

      await expect(
        d.service.resolveContext(COUNTRY, DOMAIN, 'inmunizacion'),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the context does not exist', async () => {
      const d = build();
      d.contextRepo.findContextByKey.mockResolvedValue(null);

      await expect(
        d.service.resolveContext(COUNTRY, DOMAIN, 'inmunizacion'),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });
});
