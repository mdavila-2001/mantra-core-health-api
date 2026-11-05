import { jest } from '@jest/globals';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { VectorErrorReason } from '../vector_rag.error-reasons';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { RetrievalService } from './retrieval.service';

const actor = { id: 'user-1', roles: ['CLINICIAN'] } as any;
const TENANT_ID = '11111111-1111-1111-1111-111111111111';
const COLLECTION_ID = '22222222-2222-2222-2222-222222222222';
const POLICY_ID = '33333333-3333-3333-3333-333333333333';
const SESSION_ID = '44444444-4444-4444-4444-444444444444';
const CHUNK_ID = '55555555-5555-5555-5555-555555555555';
const PATIENT_ID = '66666666-6666-6666-6666-666666666666';
const CONSENT_ID = '77777777-7777-7777-7777-777777777777';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const retrievalRepo = {
    findOpenSessionByHash: mockFn(async () => null),
    createSession: mockFn((_tx: any, data: any) => ({
      id: SESSION_ID,
      ...data,
    })),
    findSessionForUpdate: mockFn(async () => session()),
    createCandidate: mockFn((_tx: any, data: any) => ({
      id: 'cand-1',
      ...data,
    })),
    findSelectedCandidates: mockFn(async () => [{ vectorChunkId: CHUNK_ID }]),
    createEvidence: mockFn((_tx: any, data: any) => ({ id: 'ev-1', ...data })),
    createFeedback: mockFn((_tx: any, data: any) => ({ id: 'fb-1', ...data })),
  };
  const catalogRepo = {
    findCollectionById: mockFn(async () => ({
      id: COLLECTION_ID,
      tenantId: TENANT_ID,
      lifecycleState: 'active',
      accessPolicyId: POLICY_ID,
    })),
    findPolicyById: mockFn(async () => policy()),
  };
  const corpusRepo = {
    findChunkById: mockFn(async () => ({
      id: CHUNK_ID,
      vectorDocumentId: 'doc-1',
    })),
    findDocumentById: mockFn(async () => document()),
  };
  const outbox = {
    publishDomainEvent: mockFn(async () => ({ duplicate: false })),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new RetrievalService(
    em as any,
    retrievalRepo as any,
    catalogRepo as any,
    corpusRepo as any,
    outbox as any,
    logger as any,
  );
  // Las operaciones exigen el tenant activo: estas pruebas actúan dentro de
  // TENANT_ID. `raw` conserva la operación sin contexto para probar otro tenant.
  const raw = service;
  const scoped = Object.create(raw) as typeof service;
  for (const name of [
    'openSession',
    'rankCandidates',
    'materializeEvidence',
    'captureFeedback',
  ] as const) {
    (scoped as any)[name] = (...args: unknown[]) =>
      runWithTenant(TENANT_ID, () => (raw as any)[name](...args));
  }

  return {
    service: scoped,
    raw,
    em,
    tx,
    retrievalRepo,
    catalogRepo,
    corpusRepo,
    outbox,
    logger,
  };
}

/**
 * Ejecuta la operación policy.
 *
 * @param overrides - Valor de overrides requerido por la operación.
 * @returns Resultado de policy.
 */
function policy(overrides: any = {}) {
  return {
    id: POLICY_ID,
    tenantId: TENANT_ID,
    code: 'p',
    state: 'published',
    allowedPrincipalTypes: ['user'],
    allowedPurposeCodes: ['TREATMENT'],
    allowedSecurityLabels: ['NORMAL'],
    patientScopeRequired: false,
    consentRequired: false,
    ...overrides,
  };
}

/**
 * Ejecuta la operación session.
 *
 * @param overrides - Valor de overrides requerido por la operación.
 * @returns Resultado de session.
 */
function session(overrides: any = {}) {
  return {
    id: SESSION_ID,
    tenantId: TENANT_ID,
    principalId: actor.id,
    status: 'open',
    patientProfileId: PATIENT_ID,
    consentDirectiveId: CONSENT_ID,
    ...overrides,
  };
}

/**
 * Ejecuta la operación document.
 *
 * @param overrides - Valor de overrides requerido por la operación.
 * @returns Resultado de document.
 */
function document(overrides: any = {}) {
  return {
    id: 'doc-1',
    vectorCollectionId: COLLECTION_ID,
    sourceVersionId: 'ver-1',
    containsPhi: false,
    patientProfileId: PATIENT_ID,
    securityLabels: ['NORMAL'],
    ...overrides,
  };
}

const OPEN_DTO = {
  vectorCollectionId: COLLECTION_ID,
  principalType: 'user',
  purposeOfUseCode: 'TREATMENT',
  queryTextRedacted: '¿tensión del paciente?',
} as any;

describe('RetrievalService', () => {
  describe('openSession (UC-59-06)', () => {
    it('abre la sesión y guarda el hash de la consulta', async () => {
      const d = build();

      const result = await d.service.openSession(OPEN_DTO, actor);

      expect(result.status).toBe('open');
      expect(result.queryHash).toHaveLength(64);
      expect(result.duplicate).toBe(false);
    });

    it('devuelve la sesión abierta en vez de abrir otra igual', async () => {
      const d = build();
      d.retrievalRepo.findOpenSessionByHash.mockResolvedValue({
        id: 'sesion-previa',
        status: 'open',
        queryHash: 'h',
      });

      const result = await d.service.openSession(OPEN_DTO, actor);

      expect(result.duplicate).toBe(true);
      expect(d.retrievalRepo.createSession).not.toHaveBeenCalled();
    });

    it('rechaza una política en borrador', async () => {
      const d = build();
      d.catalogRepo.findPolicyById.mockResolvedValue(
        policy({ state: 'draft' }),
      );

      await expect(d.service.openSession(OPEN_DTO, actor)).rejects.toThrow(
        /no está publicada/,
      );
    });

    it('rechaza una colección sin política', async () => {
      const d = build();
      d.catalogRepo.findCollectionById.mockResolvedValue({
        id: COLLECTION_ID,
        tenantId: TENANT_ID,
        lifecycleState: 'active',
      });

      await expect(d.service.openSession(OPEN_DTO, actor)).rejects.toThrow(
        /no tiene política de acceso/,
      );
    });

    it('rechaza un tipo de principal no admitido', async () => {
      const d = build();

      await expect(
        d.service.openSession({ ...OPEN_DTO, principalType: 'agent' }, actor),
      ).rejects.toThrow(/tipo de principal/);
    });

    it('rechaza un propósito de uso no admitido', async () => {
      const d = build();

      await expect(
        d.service.openSession(
          { ...OPEN_DTO, purposeOfUseCode: 'MARKETING' },
          actor,
        ),
      ).rejects.toThrow(/propósito de uso/);
    });

    it('exige paciente si la política lo pide', async () => {
      const d = build();
      d.catalogRepo.findPolicyById.mockResolvedValue(
        policy({ patientScopeRequired: true }),
      );

      await expect(d.service.openSession(OPEN_DTO, actor)).rejects.toThrow(
        /el paciente/,
      );
    });

    it('exige consentimiento si la política lo pide', async () => {
      const d = build();
      d.catalogRepo.findPolicyById.mockResolvedValue(
        policy({ patientScopeRequired: true, consentRequired: true }),
      );

      await expect(
        d.service.openSession(
          { ...OPEN_DTO, patientProfileId: PATIENT_ID },
          actor,
        ),
      ).rejects.toThrow(/consentimiento/);
    });

    it('rechaza consultar una colección deprecada', async () => {
      const d = build();
      d.catalogRepo.findCollectionById.mockResolvedValue({
        id: COLLECTION_ID,
        tenantId: TENANT_ID,
        lifecycleState: 'deprecated',
        accessPolicyId: POLICY_ID,
      });

      await expect(d.service.openSession(OPEN_DTO, actor)).rejects.toThrow(
        /deprecada/,
      );
    });
  });

  describe('rankCandidates (UC-59-07)', () => {
    const DTO = {
      candidates: [{ vectorChunkId: CHUNK_ID, vectorScore: 0.9 }],
    } as any;

    it('autoriza y selecciona el candidato que cumple', async () => {
      const d = build();

      const result = await d.service.rankCandidates(SESSION_ID, DTO, actor);

      expect(result.candidates[0].authorizationDecision).toBe('allow');
      expect(result.candidates[0].selected).toBe(true);
      expect(result.status).toBe('ranked');
    });

    it('guarda también los denegados, con su motivo', async () => {
      const d = build();
      d.catalogRepo.findPolicyById.mockResolvedValue(
        policy({ allowedSecurityLabels: ['NORMAL'] }),
      );
      d.corpusRepo.findDocumentById.mockResolvedValue(
        document({ securityLabels: ['RESTRICTED'] }),
      );

      const result = await d.service.rankCandidates(SESSION_ID, DTO, actor);

      expect(result.candidates[0].authorizationDecision).toBe('deny_label');
      expect(result.candidates[0].selected).toBe(false);
      expect(result.deniedByReason.deny_label).toBe(1);
      expect(d.retrievalRepo.createCandidate).toHaveBeenCalled();
    });

    it('deniega por ámbito cuando el documento es de otro paciente', async () => {
      const d = build();
      d.catalogRepo.findPolicyById.mockResolvedValue(
        policy({ patientScopeRequired: true }),
      );
      d.corpusRepo.findDocumentById.mockResolvedValue(
        document({ patientProfileId: 'otro-paciente' }),
      );

      const result = await d.service.rankCandidates(SESSION_ID, DTO, actor);

      expect(result.candidates[0].authorizationDecision).toBe('deny_scope');
    });

    it('deniega por consentimiento cuando el documento tiene PHI y no hay directiva', async () => {
      const d = build();
      d.catalogRepo.findPolicyById.mockResolvedValue(
        policy({ consentRequired: true }),
      );
      d.corpusRepo.findDocumentById.mockResolvedValue(
        document({ containsPhi: true }),
      );
      d.retrievalRepo.findSessionForUpdate.mockResolvedValue(
        session({ consentDirectiveId: undefined }),
      );

      const result = await d.service.rankCandidates(SESSION_ID, DTO, actor);

      expect(result.candidates[0].authorizationDecision).toBe('deny_consent');
    });

    it('ordena por la puntuación del reranker cuando la hay', async () => {
      const d = build();

      const result = await d.service.rankCandidates(
        SESSION_ID,
        {
          candidates: [
            {
              vectorChunkId: 'chunk-bajo',
              vectorScore: 0.9,
              rerankerScore: 0.1,
            },
            {
              vectorChunkId: 'chunk-alto',
              vectorScore: 0.2,
              rerankerScore: 0.9,
            },
          ],
        },
        actor,
      );

      expect(result.candidates[0].vectorChunkId).toBe('chunk-alto');
      expect(result.candidates[0].rank).toBe(1);
    });

    it('topK recorta entre los autorizados, no antes de decidir', async () => {
      const d = build();
      d.corpusRepo.findDocumentById.mockImplementation(
        async (_tx: any, id: string) =>
          id === 'doc-denegado'
            ? document({ securityLabels: ['RESTRICTED'] })
            : document(),
      );
      d.corpusRepo.findChunkById.mockImplementation(
        async (_tx: any, id: string) => ({
          id,
          vectorDocumentId: id === 'chunk-denegado' ? 'doc-denegado' : 'doc-1',
        }),
      );

      const result = await d.service.rankCandidates(
        SESSION_ID,
        {
          candidates: [
            { vectorChunkId: 'chunk-denegado', vectorScore: 0.99 },
            { vectorChunkId: 'chunk-ok', vectorScore: 0.5 },
          ],
          topK: 1,
        },
        actor,
      );

      expect(
        result.candidates.find((c) => c.vectorChunkId === 'chunk-ok')?.selected,
      ).toBe(true);
    });

    it('rechaza ranquear una sesión que ya no está abierta', async () => {
      const d = build();
      d.retrievalRepo.findSessionForUpdate.mockResolvedValue(
        session({ status: 'ranked' }),
      );

      await expect(
        d.service.rankCandidates(SESSION_ID, DTO, actor),
      ).rejects.toThrow(/ya no está abierta/);
    });
  });

  describe('materializeEvidence (UC-59-08)', () => {
    const DTO = {
      citations: [{ vectorChunkId: CHUNK_ID, quotedTextRedacted: 'cita' }],
    } as any;

    it('materializa la cita y cierra la sesión', async () => {
      const d = build();
      const s = session({ status: 'ranked' });
      d.retrievalRepo.findSessionForUpdate.mockResolvedValue(s);

      const result = await d.service.materializeEvidence(
        SESSION_ID,
        DTO,
        actor,
      );

      expect(result.citations).toBe(1);
      expect(s.status).toBe('completed');
      expect(s.completedAt).toBeInstanceOf(Date);
    });

    it('copia la versión fuente del documento, no la recibe', async () => {
      const d = build();
      d.retrievalRepo.findSessionForUpdate.mockResolvedValue(
        session({ status: 'ranked' }),
      );

      await d.service.materializeEvidence(SESSION_ID, DTO, actor);

      expect(
        d.retrievalRepo.createEvidence.mock.calls[0][1].sourceVersionId,
      ).toBe('ver-1');
    });

    it('numera las citas desde uno', async () => {
      const d = build();
      d.retrievalRepo.findSessionForUpdate.mockResolvedValue(
        session({ status: 'ranked' }),
      );

      await d.service.materializeEvidence(
        SESSION_ID,
        {
          citations: [
            { vectorChunkId: CHUNK_ID, quotedTextRedacted: 'a' },
            { vectorChunkId: CHUNK_ID, quotedTextRedacted: 'b' },
          ],
        },
        actor,
      );

      expect(
        d.retrievalRepo.createEvidence.mock.calls[0][1].citationNumber,
      ).toBe(1);
      expect(
        d.retrievalRepo.createEvidence.mock.calls[1][1].citationNumber,
      ).toBe(2);
    });

    it('rechaza citar un chunk que no quedó seleccionado', async () => {
      const d = build();
      d.retrievalRepo.findSessionForUpdate.mockResolvedValue(
        session({ status: 'ranked' }),
      );
      d.retrievalRepo.findSelectedCandidates.mockResolvedValue([
        { vectorChunkId: 'otro-chunk' },
      ]);

      await expect(
        d.service.materializeEvidence(SESSION_ID, DTO, actor),
      ).rejects.toThrow(/no quedó seleccionado/);
    });

    it('rechaza materializar si no hay ningún candidato autorizado', async () => {
      const d = build();
      d.retrievalRepo.findSessionForUpdate.mockResolvedValue(
        session({ status: 'ranked' }),
      );
      d.retrievalRepo.findSelectedCandidates.mockResolvedValue([]);

      await expect(
        d.service.materializeEvidence(SESSION_ID, DTO, actor),
      ).rejects.toThrow(/ningún candidato seleccionado/);
    });

    it('rechaza materializar sobre una sesión que no está ranqueada', async () => {
      const d = build();

      await expect(
        d.service.materializeEvidence(SESSION_ID, DTO, actor),
      ).rejects.toThrow(/tiene que estar ranqueada/);
    });
  });

  describe('captureFeedback (UC-59-09)', () => {
    it('registra el feedback de relevancia sin marcar la sesión', async () => {
      const d = build();
      const s = session({ status: 'completed' });
      d.retrievalRepo.findSessionForUpdate.mockResolvedValue(s);

      const result = await d.service.captureFeedback(
        SESSION_ID,
        { feedbackType: 'relevance', relevanceScore: 4 },
        actor,
      );

      expect(result.flagged).toBe(false);
      expect(s.status).toBe('completed');
    });

    it('un problema de seguridad marca la sesión y publica un evento aparte', async () => {
      const d = build();
      const s = session({ status: 'completed' });
      d.retrievalRepo.findSessionForUpdate.mockResolvedValue(s);

      const result = await d.service.captureFeedback(
        SESSION_ID,
        { feedbackType: 'safety', safetyIssueCode: 'HALLUCINATION' },
        actor,
      );

      expect(result.flagged).toBe(true);
      expect(s.status).toBe('flagged');
      expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ eventType: 'RetrievalSafetyIssueRaised' }),
      );
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('rechaza dar feedback de una sesión sin completar', async () => {
      const d = build();
      d.retrievalRepo.findSessionForUpdate.mockResolvedValue(
        session({ status: 'ranked' }),
      );

      await expect(
        d.service.captureFeedback(
          SESSION_ID,
          { feedbackType: 'relevance' } as any,
          actor,
        ),
      ).rejects.toThrow(/sesión completada/);
    });

    it('otro usuario del mismo tenant no puede dar feedback ni marcar la sesión de alguien más', async () => {
      const d = build();
      const s = session({ status: 'completed', principalId: 'user-owner' });
      d.retrievalRepo.findSessionForUpdate.mockResolvedValue(s);

      let error: ResourceNotFoundException | undefined;
      try {
        await d.service.captureFeedback(
          SESSION_ID,
          { feedbackType: 'safety', safetyIssueCode: 'HALLUCINATION' },
          actor,
        );
      } catch (e) {
        error = e as ResourceNotFoundException;
      }

      expect(error?.getStatus()).toBe(404);
      expect(error?.reason).toBe(VectorErrorReason.RESOURCE_OUT_OF_SCOPE);
      expect(error?.details).toBeUndefined();
      expect(s.status).toBe('completed');
      expect(d.retrievalRepo.createFeedback).not.toHaveBeenCalled();
      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
    });

    it('la sesión ajena responde igual que una inexistente', async () => {
      const ajena = build();
      ajena.retrievalRepo.findSessionForUpdate.mockResolvedValue(
        session({ status: 'completed', principalId: 'user-owner' }),
      );
      const inexistente = build();
      inexistente.retrievalRepo.findSessionForUpdate.mockResolvedValue(null);
      const feedback = { feedbackType: 'relevance' } as any;

      const a: any = await ajena.service
        .captureFeedback(SESSION_ID, feedback, actor)
        .catch((e: unknown) => e);
      const b: any = await inexistente.service
        .captureFeedback(SESSION_ID, feedback, actor)
        .catch((e: unknown) => e);

      expect(a.getResponse()).toEqual(b.getResponse());
    });

    it('PLATFORM_ADMIN global sí puede dar feedback de la sesión de otro principal', async () => {
      const d = build();
      d.retrievalRepo.findSessionForUpdate.mockResolvedValue(
        session({ status: 'completed', principalId: 'user-owner' }),
      );
      const admin = { id: 'admin-1', roles: ['PLATFORM_ADMIN'] } as any;

      const result = await d.service.captureFeedback(
        SESSION_ID,
        { feedbackType: 'relevance' } as any,
        admin,
      );

      expect(result.flagged).toBe(false);
      expect(d.retrievalRepo.createFeedback).toHaveBeenCalled();
    });

    it('un PLATFORM_ADMIN con ámbito en otro tenant no cuenta como administrador de plataforma', async () => {
      const d = build();
      d.retrievalRepo.findSessionForUpdate.mockResolvedValue(
        session({ status: 'completed', principalId: 'user-owner' }),
      );
      const scopedElsewhere = {
        id: 'admin-2',
        roles: ['PLATFORM_ADMIN'],
        scopedRoles: {
          '99999999-9999-9999-9999-999999999999': ['PLATFORM_ADMIN'],
        },
      } as any;

      await expect(
        d.service.captureFeedback(
          SESSION_ID,
          { feedbackType: 'relevance' } as any,
          scopedElsewhere,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('alcance de tenant (VEC-01)', () => {
    const OTHER_TENANT = '99999999-9999-9999-9999-999999999999';

    /** Falla esperada: devuelve la excepción o lanza si no hubo. */
    async function failure(promise: Promise<unknown>) {
      try {
        await promise;
      } catch (error) {
        return error as ResourceNotFoundException;
      }
      throw new Error('debía rechazar');
    }

    it('abrir una sesión sobre la colección de otro tenant responde 404 y no abre nada', async () => {
      const d = build();
      d.catalogRepo.findCollectionById.mockResolvedValue({
        id: COLLECTION_ID,
        tenantId: OTHER_TENANT,
        lifecycleState: 'active',
        accessPolicyId: POLICY_ID,
      });

      const error = await failure(d.service.openSession(OPEN_DTO, actor));

      expect(error.reason).toBe(VectorErrorReason.RESOURCE_OUT_OF_SCOPE);
      expect(d.retrievalRepo.createSession).not.toHaveBeenCalled();
      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
    });

    it('la política de otro tenant enlazada a la colección no gobierna la consulta', async () => {
      const d = build();
      d.catalogRepo.findPolicyById.mockResolvedValue(
        policy({ tenantId: OTHER_TENANT }),
      );

      const error = await failure(d.service.openSession(OPEN_DTO, actor));

      expect(error.reason).toBe(VectorErrorReason.RESOURCE_OUT_OF_SCOPE);
      expect(d.retrievalRepo.createSession).not.toHaveBeenCalled();
    });

    it.each([
      [
        'ranquear',
        (d: any) =>
          d.service.rankCandidates(
            SESSION_ID,
            { candidates: [{ vectorChunkId: CHUNK_ID, vectorScore: 0.9 }] },
            actor,
          ),
      ],
      [
        'citar evidencia',
        (d: any) =>
          d.service.materializeEvidence(
            SESSION_ID,
            {
              citations: [{ vectorChunkId: CHUNK_ID, quotedTextRedacted: 'x' }],
            },
            actor,
          ),
      ],
      [
        'dar feedback',
        (d: any) =>
          d.service.captureFeedback(
            SESSION_ID,
            { feedbackType: 'relevance', safetyIssueCode: 'unsafe' },
            actor,
          ),
      ],
    ])(
      'Error: %s sobre la sesión de otro tenant responde 404 y la deja intacta',
      async (_n, run) => {
        const d = build();
        const foreign = session({
          tenantId: OTHER_TENANT,
          status: 'completed',
        });
        d.retrievalRepo.findSessionForUpdate.mockResolvedValue(foreign);

        const error = await failure(run(d));

        expect(error.getStatus()).toBe(404);
        expect(error.reason).toBe(VectorErrorReason.RESOURCE_OUT_OF_SCOPE);
        expect(foreign.status).toBe('completed');
        expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
      },
    );

    it('Falla catalogada: la sesión de B y un UUID inexistente responden exactamente igual', async () => {
      const ajena = build();
      ajena.retrievalRepo.findSessionForUpdate.mockResolvedValue(
        session({ tenantId: OTHER_TENANT, status: 'completed' }),
      );
      const inexistente = build();
      inexistente.retrievalRepo.findSessionForUpdate.mockResolvedValue(null);
      const feedback = { feedbackType: 'relevance' } as any;

      const a = await failure(
        ajena.service.captureFeedback(SESSION_ID, feedback, actor),
      );
      const b = await failure(
        inexistente.service.captureFeedback(SESSION_ID, feedback, actor),
      );

      expect(a.getResponse()).toEqual(b.getResponse());
      expect(a.details).toBeUndefined();
    });

    it('las lecturas por sesión se piden con el tenant del contexto', async () => {
      const d = build();
      d.retrievalRepo.findSessionForUpdate.mockResolvedValue(session());

      await d.service.rankCandidates(
        SESSION_ID,
        { candidates: [{ vectorChunkId: CHUNK_ID, vectorScore: 0.9 }] } as any,
        actor,
      );

      expect(d.retrievalRepo.findSessionForUpdate).toHaveBeenCalledWith(
        d.tx,
        SESSION_ID,
        TENANT_ID,
      );
    });

    it('un candidato cuyo chunk es de una colección de otro tenant se trata como inexistente', async () => {
      const d = build();
      d.retrievalRepo.findSessionForUpdate.mockResolvedValue(session());
      // La colección del documento no existe en el tenant de la sesión.
      d.catalogRepo.findCollectionById.mockResolvedValue(null);

      const error = await failure(
        d.service.rankCandidates(
          SESSION_ID,
          {
            candidates: [{ vectorChunkId: CHUNK_ID, vectorScore: 0.9 }],
          } as any,
          actor,
        ),
      );

      expect(error.reason).toBe(VectorErrorReason.RESOURCE_OUT_OF_SCOPE);
      expect(d.catalogRepo.findCollectionById).toHaveBeenCalledWith(
        d.tx,
        COLLECTION_ID,
        TENANT_ID,
      );
      expect(d.retrievalRepo.createCandidate).not.toHaveBeenCalled();
    });

    it('un actor sin tenant activo que no es SYSTEM falla cerrado (412)', async () => {
      const d = build();

      const error = await d.raw
        .openSession(OPEN_DTO, actor)
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect(d.catalogRepo.findCollectionById).not.toHaveBeenCalled();
    });
  });
});
