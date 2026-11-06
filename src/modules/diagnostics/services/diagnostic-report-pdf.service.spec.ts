import { describe, expect, it, jest } from '@jest/globals';
import { DiagnosticReportPdfService } from './diagnostic-report-pdf.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

function build() {
  const labels = {
    findTenantNames: mockFn(async () => new Map([['lab', 'Laboratorio Sur']])),
    findPatientLabels: mockFn(
      async () =>
        new Map([
          ['pat', { displayName: 'Paciente Sintético', patientCode: 'P-1' }],
        ]),
    ),
    findConceptDisplays: mockFn(async () => new Map([['hemo', 'Hemograma']])),
  };
  const drafts = {
    findIssuerSettings: mockFn(async () => ({
      signatureFileId: 'lab-sig',
      sealFileId: 'lab-seal',
      responsibleName: 'Bioq. R',
    })),
  };
  const signers = {
    identities: mockFn(async () => [
      {
        profileId: 'p1',
        name: 'Dr. Firmante',
        registration: 'MP-1',
        signatureFileId: 'sig',
        sealFileId: null,
      },
      {
        profileId: 'doc',
        name: 'Dra. Solicitante',
        registration: null,
        signatureFileId: null,
        sealFileId: null,
      },
    ]),
  };
  const files = {
    downloadForAuthorizedContext: mockFn(async (id: string) => {
      if (id === 'lab-seal') throw new Error('storage down');
      return {
        buffer: Buffer.from(id),
        mimeType: id === 'sig' ? 'image/webp' : 'image/png',
      };
    }),
  };
  const logger = { setContext: mockFn(), warn: mockFn() };
  const em: any = { findOne: mockFn(async () => ({ avatarFileId: 'logo' })) };
  const service = new DiagnosticReportPdfService(
    labels as any,
    drafts as any,
    signers as any,
    files as any,
    logger as any,
  );
  return { service, em, signers, files, logger };
}

const ctx: any = {
  draft: { signerProfileId: 'p1' },
  order: {
    patientProfileId: 'pat',
    requesterProfileId: 'doc',
    codeConceptId: 'hemo',
    createdAt: new Date('2026-11-01T10:00:00Z'),
  },
};
const body = {
  version: 1 as const,
  blocks: [{ type: 'paragraph' as const, runs: [{ text: 'Normal' }] }],
};

describe('DiagnosticReportPdfService', () => {
  it('resolves signer and requester as practitioners, reads images on the server and survives an unreadable one', async () => {
    const t = build();
    const pdf = await t.service.render(
      t.em,
      'lab',
      ctx,
      body,
      {
        versionId: 'v1',
        contentHash: 'a'.repeat(64),
        issuedAt: new Date(),
      },
      true,
    );
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(t.signers.identities).toHaveBeenCalledWith(t.em, ['p1', 'doc']);
    expect(
      t.files.downloadForAuthorizedContext.mock.calls
        .map((c: any[]) => c[0])
        .sort(),
    ).toEqual(['lab-seal', 'lab-sig', 'logo', 'sig']);
    expect(t.logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ fileId: 'lab-seal' }),
      expect.any(String),
    );
  });

  it('a preview for someone other than the signer never reads the signer images', async () => {
    const t = build();
    await t.service.render(t.em, 'lab', ctx, body, null, false);
    const read = t.files.downloadForAuthorizedContext.mock.calls.map(
      (c: any[]) => c[0],
    );
    expect(read).not.toContain('sig');
    expect(read).toEqual(expect.arrayContaining(['lab-sig', 'logo']));
  });
});
