import { jest } from '@jest/globals';

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
  return {
    service,
    em,
    tx,
    retrievalRepo,
    catalogRepo,
    corpusRepo,
    outbox,
    logger,
  };
}

function policy(overrides: any = {}) {
  return {
    id: POLICY_ID,
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

function session(overrides: any = {}) {
  return {
    id: SESSION_ID,
    tenantId: TENANT_ID,
    status: 'open',
    patientProfileId: PATIENT_ID,
    consentDirectiveId: CONSENT_ID,
    ...overrides,
  };
}

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
  });
});
