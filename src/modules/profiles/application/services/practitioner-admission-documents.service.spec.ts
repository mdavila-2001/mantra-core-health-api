import { jest } from '@jest/globals';
import { GoneException } from '@nestjs/common';
import { ResourceNotFoundException } from '../../../../common';
import { InsufficientRoleException } from '../../../../common/errors/domain.exception';
import { ProfilesErrorReason } from '../../profiles.error-reasons';
import {
  ADMISSION_DOCUMENT_URL_TTL_MS,
  PractitionerAdmissionDocumentsService,
} from './practitioner-admission-documents.service';

const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
const NOW = new Date('2026-10-29T12:00:00.000Z');
const REVIEWER = { id: 'u-rev', roles: ['ADMISSIONS_REVIEWER'] } as never;
const OTHER = { id: 'u-other', roles: ['ADMISSIONS_REVIEWER'] } as never;

function build(files: string[] = ['f1', 'f2']) {
  const em = { fork: () => em };
  const admissionsRepo = {
    findById: fn((_em: unknown, id: string) =>
      Promise.resolve(
        id === 'adm-1'
          ? { id, practitionerProfileId: 'prac-1' }
          : id === 'adm-2'
            ? { id, practitionerProfileId: 'prac-2' }
            : null,
      ),
    ),
  };
  const accountLinksRepo = {
    // prac-1 tiene dos vínculos activos y la cuenta del médico es la SEGUNDA (S-6):
    // el primero (u-delegado) no es quien consulta.
    hasActiveLink: fn((_em: unknown, personId: string, userId: string) =>
      Promise.resolve(
        personId === 'prac-1' && ['u-delegado', 'u-doctor'].includes(userId),
      ),
    ),
  };
  const evidence = {
    collect: fn((_em: unknown, practitioner: string) =>
      Promise.resolve({
        items: (practitioner === 'prac-1' ? files : ['f-otra']).map(
          (fileId, i) => ({ itemId: `i${i}`, fileId }),
        ),
        professionGroup: 'MEDICO',
      }),
    ),
    fileFacts: fn((_em: unknown, ids: string[]) =>
      Promise.resolve(
        new Map(
          ids.map((id) => [
            id,
            {
              id,
              name: `${id}.pdf`,
              mimeType: 'application/pdf',
              sizeBytes: 10,
              uploadedAt: NOW,
            },
          ]),
        ),
      ),
    ),
  };
  const content = {
    buffer: Buffer.from('%PDF'),
    mimeType: 'application/pdf',
    originalName: 'título "final".pdf',
  };
  const filesService = {
    downloadForAuthorizedContext: fn().mockResolvedValue(content),
  };
  const logger = { setContext: fn(), info: fn(), warn: fn(), error: fn() };
  const service = new PractitionerAdmissionDocumentsService(
    em as never,
    admissionsRepo as never,
    accountLinksRepo as never,
    evidence as never,
    filesService as never,
    logger as never,
  );
  return { service, evidence, filesService, content, logger };
}

function query(url: string) {
  const u = new URL(`http://x${url}`);
  return {
    expires: u.searchParams.get('expires') ?? undefined,
    signature: u.searchParams.get('signature') ?? undefined,
  };
}

describe('PractitionerAdmissionDocumentsService', () => {
  describe('S-3 · el profesional no abre sus documentos por la vista del personal', () => {
    const DOCTOR = { id: 'u-doctor', roles: ['ADMISSIONS_REVIEWER'] } as never;

    it('con rol de revisor pero dueño de la admisión: 403 ADMISSION_SELF_ACCESS al emitir', async () => {
      const d = build();
      const error = await d.service
        .issueUrl('adm-1', 'f1', DOCTOR, NOW)
        .catch((e: unknown) => e);
      expect(error).toBeInstanceOf(InsufficientRoleException);
      expect(
        (error as any).reason ?? (error as any).getResponse?.().reason,
      ).toBe(ProfilesErrorReason.ADMISSION_SELF_ACCESS);
    });

    it('tampoco lo abre con una URL firmada válida que le hayan pasado', async () => {
      const d = build();
      const issued = await d.service.issueUrl('adm-1', 'f1', REVIEWER, NOW);
      // Misma firma pero otro actor: ya la rechaza la firma; la del dueño no se puede ni emitir.
      await expect(
        d.service.open('adm-1', 'f1', query(issued.url), DOCTOR, NOW),
      ).rejects.toBeInstanceOf(InsufficientRoleException);
      expect(
        d.filesService.downloadForAuthorizedContext,
      ).not.toHaveBeenCalled();
    });

    it('el mismo usuario con rol revisa la admisión de OTRO profesional sin problema', async () => {
      const d = build();
      const issued = await d.service.issueUrl('adm-2', 'f-otra', DOCTOR, NOW);
      expect(issued.url).toContain(
        '/admissions/adm-2/documents/f-otra/content',
      );
    });
  });

  it('emite una URL firmada de dos minutos con el nombre y el tipo del archivo', async () => {
    const d = build();
    const issued = await d.service.issueUrl('adm-1', 'f1', REVIEWER, NOW);
    expect(issued.url).toMatch(
      /^\/admissions\/adm-1\/documents\/f1\/content\?expires=\d+&signature=[0-9a-f]{64}$/,
    );
    expect(issued.expiresAt).toBe(
      new Date(NOW.getTime() + ADMISSION_DOCUMENT_URL_TTL_MS).toISOString(),
    );
    expect(ADMISSION_DOCUMENT_URL_TTL_MS).toBe(120_000);
    expect(issued).toMatchObject({
      name: 'f1.pdf',
      mimeType: 'application/pdf',
    });
  });

  it('un archivo de OTRA admisión no se firma: 404 (BOLA)', async () => {
    const d = build();
    // «f-otra» es de la admisión adm-2; pedirlo bajo adm-1 no debe funcionar.
    const error = await d.service
      .issueUrl('adm-1', 'f-otra', REVIEWER, NOW)
      .catch((e: Error) => e);
    expect(error).toBeInstanceOf(ResourceNotFoundException);
    expect((error as any).reason).toBe(
      ProfilesErrorReason.ADMISSION_DOCUMENT_NOT_FOUND,
    );
  });

  it('una admisión inexistente y un archivo inexistente responden igual (no se filtra nada)', async () => {
    const d = build();
    const a = await d.service
      .issueUrl('nada', 'f1', REVIEWER, NOW)
      .catch((e: Error) => e);
    const b = await d.service
      .issueUrl('adm-1', 'no-existe', REVIEWER, NOW)
      .catch((e: Error) => e);
    expect(a).toBeInstanceOf(ResourceNotFoundException);
    expect((a as any).reason).toBe((b as any).reason);
  });

  it('el médico y cualquier rol ajeno no abren documentos de admisiones: 403', async () => {
    const d = build();
    for (const roles of [['USER', 'PRACTITIONER'], ['PHARMACY_STAFF'], []]) {
      const error = await d.service
        .issueUrl('adm-1', 'f1', { id: 'u', roles } as never, NOW)
        .catch((e: Error) => e);
      expect(error).toBeInstanceOf(InsufficientRoleException);
    }
  });

  it('abre el documento con una firma válida y devuelve los bytes por el camino de contexto autorizado', async () => {
    const d = build();
    const issued = await d.service.issueUrl('adm-1', 'f1', REVIEWER, NOW);
    const opened = await d.service.open(
      'adm-1',
      'f1',
      query(issued.url),
      REVIEWER,
      NOW,
    );
    expect(opened).toMatchObject({
      mimeType: 'application/pdf',
      disposition: 'inline',
      fileName: 'título "final".pdf',
    });
    expect(d.filesService.downloadForAuthorizedContext).toHaveBeenCalledWith(
      'f1',
      'profiles.admission.document',
    );
  });

  it('la firma está atada al usuario: la URL de otro revisor no sirve (403)', async () => {
    const d = build();
    const issued = await d.service.issueUrl('adm-1', 'f1', REVIEWER, NOW);
    const error = await d.service
      .open('adm-1', 'f1', query(issued.url), OTHER, NOW)
      .catch((e: Error) => e);
    expect(error).toBeInstanceOf(InsufficientRoleException);
    expect((error as any).reason).toBe(
      ProfilesErrorReason.ADMISSION_DOCUMENT_URL_INVALID,
    );
    expect(d.filesService.downloadForAuthorizedContext).not.toHaveBeenCalled();
  });

  it('la firma está atada a la admisión y al archivo: no se reusa para otro', async () => {
    const d = build();
    const issued = await d.service.issueUrl('adm-1', 'f1', REVIEWER, NOW);
    for (const [adm, file] of [
      ['adm-1', 'f2'],
      ['adm-2', 'f1'],
    ]) {
      await expect(
        d.service.open(adm, file, query(issued.url), REVIEWER, NOW),
      ).rejects.toBeDefined();
    }
    expect(d.filesService.downloadForAuthorizedContext).not.toHaveBeenCalled();
  });

  it('una firma alterada, ausente o mal formada se rechaza sin leer nada', async () => {
    const d = build();
    const issued = await d.service.issueUrl('adm-1', 'f1', REVIEWER, NOW);
    const q = query(issued.url);
    for (const bad of [
      { ...q, signature: `${q.signature!.slice(0, -2)}00` },
      { ...q, signature: undefined },
      { ...q, expires: undefined },
      { ...q, signature: 'zz' },
      { expires: 'abc', signature: q.signature },
    ]) {
      await expect(
        d.service.open('adm-1', 'f1', bad, REVIEWER, NOW),
      ).rejects.toBeInstanceOf(InsufficientRoleException);
    }
  });

  it('vencida a los dos minutos: 410', async () => {
    const d = build();
    const issued = await d.service.issueUrl('adm-1', 'f1', REVIEWER, NOW);
    const later = new Date(NOW.getTime() + ADMISSION_DOCUMENT_URL_TTL_MS + 1);
    await expect(
      d.service.open('adm-1', 'f1', query(issued.url), REVIEWER, later),
    ).rejects.toBeInstanceOf(GoneException);
    // Justo en el límite todavía vale.
    await expect(
      d.service.open(
        'adm-1',
        'f1',
        query(issued.url),
        REVIEWER,
        new Date(NOW.getTime() + ADMISSION_DOCUMENT_URL_TTL_MS),
      ),
    ).resolves.toBeDefined();
  });

  it('aunque la firma sea válida, si el archivo ya no es de la admisión (el médico lo retiró) no se sirve', async () => {
    const d = build(['f1']);
    const issued = await d.service.issueUrl('adm-1', 'f1', REVIEWER, NOW);
    d.evidence.collect.mockResolvedValue({
      items: [],
      professionGroup: 'MEDICO',
    });
    await expect(
      d.service.open('adm-1', 'f1', query(issued.url), REVIEWER, NOW),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('lo que el navegador podría ejecutar (SVG, HTML) se sirve como descarga genérica, nunca en línea', async () => {
    const d = build();
    const issued = await d.service.issueUrl('adm-1', 'f1', REVIEWER, NOW);
    for (const mimeType of [
      'image/svg+xml',
      'text/html',
      'application/javascript',
    ]) {
      d.filesService.downloadForAuthorizedContext.mockResolvedValue({
        ...d.content,
        mimeType,
      });
      const opened = await d.service.open(
        'adm-1',
        'f1',
        query(issued.url),
        REVIEWER,
        NOW,
      );
      expect(opened).toMatchObject({
        mimeType: 'application/octet-stream',
        disposition: 'attachment',
      });
    }
  });

  it('las imágenes y el PDF se muestran en línea', async () => {
    const d = build();
    const issued = await d.service.issueUrl('adm-1', 'f1', REVIEWER, NOW);
    for (const mimeType of [
      'image/png',
      'image/jpeg',
      'image/webp',
      'application/pdf',
    ]) {
      d.filesService.downloadForAuthorizedContext.mockResolvedValue({
        ...d.content,
        mimeType,
      });
      expect(
        (await d.service.open('adm-1', 'f1', query(issued.url), REVIEWER, NOW))
          .disposition,
      ).toBe('inline');
    }
  });

  it('60 documentos en la misma admisión: cada uno firma y abre', async () => {
    const files = Array.from({ length: 60 }, (_, i) => `f${i}`);
    const d = build(files);
    for (const f of files) {
      const issued = await d.service.issueUrl('adm-1', f, REVIEWER, NOW);
      await expect(
        d.service.open('adm-1', f, query(issued.url), REVIEWER, NOW),
      ).resolves.toBeDefined();
    }
    expect(d.filesService.downloadForAuthorizedContext).toHaveBeenCalledTimes(
      60,
    );
  });
});
