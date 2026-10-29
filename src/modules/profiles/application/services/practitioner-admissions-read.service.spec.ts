import { jest } from '@jest/globals';
import { ResourceNotFoundException } from '../../../../common';
import { InsufficientRoleException } from '../../../../common/errors/domain.exception';
import { Identifiers } from '../../../common/entities';
import { Users } from '../../../iam/entities';
import { CatalogConcepts } from '../../../terminology/entities';
import {
  HealthPractitionerProfiles,
  JurisdictionAuthorizations,
  PractitionerSpecialties,
  ProfessionalCredentials,
  Persons,
} from '../../entities';
import { PROF } from '../../profiles.concepts';
import { ProfilesErrorReason } from '../../profiles.error-reasons';
import {
  evaluateChecklist,
  type ChecklistRequirement,
  type ReviewState,
} from '../../domain/admissions/admission-checklist';
import {
  ADMISSION_STATUS_CONCEPT,
  type AdmissionStatusCode,
} from '../../domain/admissions/admission-status';
import { REASONS } from '../../domain/admissions/admission-vocabulary';
import {
  PractitionerAdmissionsReadService,
  maskNationalId,
} from './practitioner-admissions-read.service';

const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
const NOW = new Date('2026-10-29T12:00:00.000Z');
const ACTOR = { id: 'u-rev', roles: ['ADMISSIONS_REVIEWER'] } as never;

const requirement = (
  code: string,
  over: Partial<ChecklistRequirement> = {},
): ChecklistRequirement => ({
  id: `req-${code}`,
  code,
  label: code,
  itemType: 'CREDENTIAL',
  evidence: 'DOCUMENT',
  required: true,
  requiresSourceUri: true,
  sortOrder: 1,
  ...over,
});

const reviewState: Record<ReviewState, string> = {
  PENDING: PROF.ADMISSION_REVIEW_PENDING,
  VERIFIED: PROF.ADMISSION_REVIEW_VERIFIED,
  REJECTED: PROF.ADMISSION_REVIEW_REJECTED,
  INFO_REQUIRED: PROF.ADMISSION_REVIEW_INFO_REQUIRED,
};

function row(over: Record<string, unknown> = {}) {
  return {
    id: 'adm-1',
    practitionerProfileId: 'prac-1',
    typeConceptId: PROF.ADMISSION_TYPE_PRACTITIONER_ONBOARDING,
    statusConceptId: ADMISSION_STATUS_CONCEPT.ENVIADA,
    submittedAt: new Date('2026-10-27T12:00:00.000Z'),
    dueAt: new Date('2026-10-30T12:00:00.000Z'),
    dueAtIso: '2026-10-30T12:00:00.000000Z',
    assignedToUserId: null,
    rowVersion: 3,
    fullName: 'Ana María Pérez Rojas',
    professionName: 'Médicos generales',
    professionalTitle: null,
    nationalId: '1234567',
    ...over,
  };
}

function admission(
  status: AdmissionStatusCode,
  over: Record<string, unknown> = {},
) {
  return {
    id: 'adm-1',
    practitionerProfileId: 'prac-1',
    admissionTypeConceptId: PROF.ADMISSION_TYPE_PRACTITIONER_ONBOARDING,
    statusConceptId: ADMISSION_STATUS_CONCEPT[status],
    submittedAt: new Date('2026-10-27T12:00:00.000Z'),
    dueAt: new Date('2026-10-30T12:00:00.000Z'),
    rowVersion: 3,
    resubmissionCount: 0,
    ...over,
  } as Record<string, any>;
}

function build(overrides: { data?: Map<unknown, unknown[]> } = {}) {
  const data = overrides.data ?? new Map<unknown, unknown[]>();
  const em = {
    find: fn((cls: unknown) => Promise.resolve(data.get(cls) ?? [])),
    findOne: fn((cls: unknown) =>
      Promise.resolve((data.get(cls) ?? [])[0] ?? null),
    ),
    fork: () => em,
  };
  const admissionsRepo = {
    listPage: fn().mockResolvedValue([]),
    countByStatus: fn().mockResolvedValue(new Map()),
    findById: fn().mockResolvedValue(null),
    findCurrentByPractitioners: fn().mockResolvedValue(new Map()),
  };
  const eventsRepo = { findByAdmission: fn().mockResolvedValue([]) };
  const reviewsRepo = { findByAdmissions: fn().mockResolvedValue([]) };
  const accountLinksRepo = {
    findActiveByUser: fn().mockResolvedValue(null),
    findActiveByPerson: fn().mockResolvedValue(null),
    /** Vínculos activos persona-cuenta; una persona o una cuenta pueden tener varios. */
    links: [] as Array<{ userId: string; personId: string }>,
    hasActiveLink: fn(),
    findActivePersonIdsByUser: fn(),
  };
  accountLinksRepo.hasActiveLink.mockImplementation(
    (_em: unknown, personId: string, userId: string) =>
      Promise.resolve(
        accountLinksRepo.links.some(
          (l) => l.personId === personId && l.userId === userId,
        ),
      ),
  );
  accountLinksRepo.findActivePersonIdsByUser.mockImplementation(
    (_em: unknown, userId: string) =>
      Promise.resolve([
        ...new Set(
          accountLinksRepo.links
            .filter((l) => l.userId === userId)
            .map((l) => l.personId),
        ),
      ]),
  );
  const checklist = {
    requirementsOf: fn().mockResolvedValue([requirement('A')]),
    buildView: fn(),
  };
  // Las lecturas de otros contextos entran por un puerto; este doble las sirve
  // de `data`, así los casos siguen declarando usuarios, cédulas y conceptos.
  const rows = (cls: unknown): any[] => (data.get(cls) ?? []) as any[];
  const foreign = {
    conceptNames: fn((_em: unknown, ids: Array<string | undefined | null>) =>
      Promise.resolve(
        new Map(
          rows(CatalogConcepts)
            .filter((r) => ids.includes(r.id))
            .map((r) => [r.id, r.display]),
        ),
      ),
    ),
    userNames: fn((_em: unknown, ids: Array<string | undefined | null>) =>
      Promise.resolve(
        new Map(
          rows(Users)
            .filter((r) => ids.includes(r.id))
            .map((r) => [r.id, r.displayName]),
        ),
      ),
    ),
    userExists: fn((_em: unknown, id: string) =>
      Promise.resolve(rows(Users).some((r) => r.id === id)),
    ),
    nationalIds: fn((_em: unknown, ids: readonly string[]) =>
      Promise.resolve(
        new Map(
          rows(Identifiers)
            .filter((r) => ids.includes(r.ownerId))
            .map((r) => [r.ownerId, r]),
        ),
      ),
    ),
  };
  const evidence = {
    fileFacts: fn().mockResolvedValue(new Map()),
    buildSnapshot: fn().mockResolvedValue({
      personal: { nationalId: '999', age: 40 },
      contact: {},
      addresses: {},
      licenses: [],
      education: [],
      specialties: [],
      practices: [],
    }),
  };
  const service = new PractitionerAdmissionsReadService(
    em as never,
    admissionsRepo as never,
    eventsRepo as never,
    reviewsRepo as never,
    accountLinksRepo as never,
    checklist as never,
    evidence as never,
    foreign as never,
  );
  return {
    service,
    em,
    data,
    admissionsRepo,
    eventsRepo,
    reviewsRepo,
    accountLinksRepo,
    checklist,
    evidence,
    foreign,
  };
}

function viewOf(
  rows: Array<{
    requirement: ChecklistRequirement;
    items: Array<{
      id: string;
      state: ReviewState;
      fileId?: string;
      review?: Record<string, unknown>;
      changed?: boolean;
      type?: string;
    }>;
  }>,
) {
  const mapped = rows.map(({ requirement: req, items }) => ({
    requirement: req,
    items: items.map((i) => ({
      state: i.state,
      evidenceChanged: i.changed ?? false,
      live: {
        itemType: i.type ?? 'CREDENTIAL',
        itemId: i.id,
        label: `Título ${i.id}`,
        fileId: i.fileId,
        evidenceSha256: `h-${i.id}`,
      },
      review: i.review,
    })),
  }));
  return {
    evaluation: evaluateChecklist(mapped as never),
    live: {
      items: mapped.flatMap((r) => r.items.map((i) => i.live)),
      professionGroup: 'MEDICO',
    },
    reviews: [],
  } as never;
}

describe('maskNationalId', () => {
  it('deja sólo los últimos tres caracteres', () => {
    expect(maskNationalId('1234567')).toBe('****567');
    expect(maskNationalId('12345678901')).toBe('******901');
  });
  it('un número corto o vacío no se revela', () => {
    expect(maskNationalId('123')).toBe('***');
    expect(maskNationalId('')).toBeNull();
    expect(maskNationalId(null)).toBeNull();
  });
});

describe('PractitionerAdmissionsReadService · bandeja', () => {
  it('devuelve la fila con la cédula ENMASCARADA y el contrato acordado', async () => {
    const d = build();
    d.admissionsRepo.listPage.mockResolvedValue([
      row({ assignedToUserId: 'u-rev', rowVersion: 7 }),
    ]);
    d.admissionsRepo.countByStatus.mockResolvedValue(
      new Map([[ADMISSION_STATUS_CONCEPT.ENVIADA, 4]]),
    );
    d.reviewsRepo.findByAdmissions.mockResolvedValue([
      {
        admissionId: 'adm-1',
        requirementId: 'req-A',
        statusConceptId: reviewState.VERIFIED,
      },
    ]);
    d.data.set(Users, [{ id: 'u-rev', displayName: 'Rosa Revisora' }]);

    const page = await d.service.list({}, ACTOR, NOW);

    expect(page.items).toHaveLength(1);
    expect(page.items[0]).toEqual({
      id: 'adm-1',
      type: { code: 'ALTA_DE_DOCTOR', label: 'Alta de doctor' },
      status: { code: 'ENVIADA', label: 'Enviada' },
      practitioner: {
        id: 'prac-1',
        fullName: 'Ana María Pérez Rojas',
        profession: 'Médicos generales',
        maskedNationalId: '****567',
      },
      itemsSummary: { licenses: 0, credentials: 1, specialties: 0 },
      requirementsSummary: { total: 1, verified: 1, rejected: 0, pending: 0 },
      submittedAt: '2026-10-27T12:00:00.000Z',
      dueAt: '2026-10-30T12:00:00.000Z',
      overdue: false,
      assignedTo: { id: 'u-rev', name: 'Rosa Revisora' },
      rowVersion: 7,
    });
    // La cédula completa no viaja en ninguna parte de la fila.
    expect(JSON.stringify(page)).not.toContain('1234567');
  });

  it('los conteos traen todos los estados, con 0 donde no hay', async () => {
    const d = build();
    d.admissionsRepo.countByStatus.mockResolvedValue(
      new Map([
        [ADMISSION_STATUS_CONCEPT.ENVIADA, 4],
        [ADMISSION_STATUS_CONCEPT.EN_REVISION, 2],
      ]),
    );
    const page = await d.service.list({}, ACTOR, NOW);
    expect(page.counts).toEqual({
      ENVIADA: 4,
      EN_REVISION: 2,
      INFORMACION_REQUERIDA: 0,
      VERIFICADA: 0,
      RECHAZADA: 0,
      SUSPENDIDA: 0,
      EXPIRADA: 0,
      RETIRADA: 0,
      ABANDONADA: 0,
    });
  });

  it('vencida: pasó su plazo y la plataforma todavía debe una respuesta', async () => {
    const d = build();
    d.reviewsRepo.findByAdmissions.mockResolvedValue([
      {
        admissionId: 'a1',
        requirementId: 'req-A',
        statusConceptId: reviewState.PENDING,
      },
      {
        admissionId: 'a2',
        requirementId: 'req-A',
        statusConceptId: reviewState.PENDING,
      },
      {
        admissionId: 'a3',
        requirementId: 'req-A',
        statusConceptId: reviewState.PENDING,
      },
    ]);
    const vencido = new Date('2026-10-28T12:00:00.000Z');
    d.admissionsRepo.listPage.mockResolvedValue([
      row({ id: 'a1', dueAt: vencido }),
      row({
        id: 'a2',
        dueAt: vencido,
        statusConceptId: ADMISSION_STATUS_CONCEPT.INFORMACION_REQUERIDA,
      }),
      row({ id: 'a3', dueAt: new Date('2026-11-05T12:00:00.000Z') }),
    ]);
    const page = await d.service.list({}, ACTOR, NOW);
    // Con información pedida el reloj de la plataforma está pausado.
    expect(page.items.map((i) => i.overdue)).toEqual([true, false, false]);
  });

  it('pagina por cursor keyset: pide limit+1 y emite el cursor de la última fila', async () => {
    const d = build();
    const filas = Array.from({ length: 3 }, (_, i) =>
      row({ id: `a${i}`, dueAtIso: `2026-10-30T12:00:0${i}.000000Z` }),
    );
    d.admissionsRepo.listPage.mockResolvedValue(filas);
    d.reviewsRepo.findByAdmissions.mockResolvedValue(
      filas.map((f) => ({
        admissionId: f.id,
        requirementId: 'req-A',
        statusConceptId: reviewState.PENDING,
      })),
    );
    const page = await d.service.list({ limit: 2 }, ACTOR, NOW);
    expect(d.admissionsRepo.listPage.mock.calls[0][3]).toBe(3);
    expect(page.items).toHaveLength(2);
    expect(page.nextCursor).not.toBeNull();

    await d.service.list({ limit: 2, cursor: page.nextCursor! }, ACTOR, NOW);
    expect(d.admissionsRepo.listPage.mock.calls[1][2]).toEqual({
      dueAtIso: '2026-10-30T12:00:01.000000Z',
      id: 'a1',
    });
  });

  it('la última página no trae cursor', async () => {
    const d = build();
    d.admissionsRepo.listPage.mockResolvedValue([row()]);
    d.reviewsRepo.findByAdmissions.mockResolvedValue([
      {
        admissionId: 'adm-1',
        requirementId: 'req-A',
        statusConceptId: reviewState.PENDING,
      },
    ]);
    expect(
      (await d.service.list({ limit: 25 }, ACTOR, NOW)).nextCursor,
    ).toBeNull();
  });

  it('un cursor inválido es 400, no 500', async () => {
    const d = build();
    await expect(
      d.service.list({ cursor: 'basura' }, ACTOR, NOW),
    ).rejects.toMatchObject({ status: 400 });
    const mal = Buffer.from(JSON.stringify({ d: 1, i: 2 })).toString(
      'base64url',
    );
    await expect(
      d.service.list({ cursor: mal }, ACTOR, NOW),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('traduce los filtros: tipo fijo, estado, asignado a mí, sin asignar, vencidas y búsqueda', async () => {
    const d = build();
    await d.service.list(
      { status: 'EN_REVISION', assignedTo: 'me', overdue: true, q: ' Pérez ' },
      ACTOR,
      NOW,
    );
    const filters = d.admissionsRepo.listPage.mock.calls[0][1];
    expect(filters).toMatchObject({
      typeConceptId: PROF.ADMISSION_TYPE_PRACTITIONER_ONBOARDING,
      statusConceptId: ADMISSION_STATUS_CONCEPT.EN_REVISION,
      assignedToUserId: 'u-rev',
      overdue: true,
      q: 'Pérez',
    });
    await d.service.list({ assignedTo: 'none' }, ACTOR, NOW);
    expect(d.admissionsRepo.listPage.mock.calls[1][1].unassigned).toBe(true);
    await d.service.list(
      { assignedTo: '3f1c2a52-1111-4222-8333-444455556666' },
      ACTOR,
      NOW,
    );
    expect(d.admissionsRepo.listPage.mock.calls[2][1].assignedToUserId).toBe(
      '3f1c2a52-1111-4222-8333-444455556666',
    );
  });

  it('el conteo no aplica el filtro de estado (son las pestañas)', async () => {
    const d = build();
    await d.service.list({ status: 'VERIFICADA' }, ACTOR, NOW);
    expect(
      d.admissionsRepo.countByStatus.mock.calls[0][1].statusConceptId,
    ).toBeUndefined();
  });

  it('assignedTo que no es uuid/me/none y q de un solo carácter: 400', async () => {
    const d = build();
    await expect(
      d.service.list({ assignedTo: 'x; DROP' }, ACTOR, NOW),
    ).rejects.toMatchObject({ status: 400 });
    await expect(d.service.list({ q: 'a' }, ACTOR, NOW)).rejects.toMatchObject({
      status: 400,
    });
  });

  it('una admisión sin revisiones materializadas (backfill) se resume en vivo', async () => {
    const d = build();
    d.admissionsRepo.listPage.mockResolvedValue([row()]);
    d.admissionsRepo.findById.mockResolvedValue(admission('ENVIADA'));
    d.checklist.buildView.mockResolvedValue(
      viewOf([
        {
          requirement: requirement('A'),
          items: [{ id: 'c1', state: 'PENDING' }],
        },
      ]),
    );
    const page = await d.service.list({}, ACTOR, NOW);
    expect(page.items[0].requirementsSummary).toEqual({
      total: 1,
      verified: 0,
      rejected: 0,
      pending: 1,
    });
    expect(d.checklist.buildView).toHaveBeenCalled();
  });

  it('una página vacía no consulta nada más', async () => {
    const d = build();
    const page = await d.service.list({}, ACTOR, NOW);
    expect(page.items).toEqual([]);
    expect(d.reviewsRepo.findByAdmissions).not.toHaveBeenCalled();
  });
});

describe('PractitionerAdmissionsReadService · detalle', () => {
  function detalleBase() {
    const d = build();
    d.data.set(Persons, [
      {
        id: 'prac-1',
        name: 'Ana',
        middleName: 'María',
        lastName: 'Pérez',
        motherLastName: 'Rojas',
      },
    ]);
    d.data.set(Identifiers, [{ ownerId: 'prac-1', value: '1234567' }]);
    d.data.set(ProfessionalCredentials, []);
    d.data.set(HealthPractitionerProfiles, []);
    d.data.set(JurisdictionAuthorizations, []);
    d.data.set(PractitionerSpecialties, []);
    d.data.set(CatalogConcepts, []);
    return d;
  }

  it('404 si no existe', async () => {
    const d = detalleBase();
    d.admissionsRepo.findById.mockResolvedValue(null);
    const error = await d.service
      .detail('x', ACTOR, NOW)
      .catch((e: Error) => e);
    expect(error).toBeInstanceOf(ResourceNotFoundException);
    expect((error as any).reason).toBe(ProfilesErrorReason.ADMISSION_NOT_FOUND);
  });

  it('el checklist trae estado, archivos, fuente, motivo, revisor y versión del ítem; y el resumen coincide', async () => {
    const d = detalleBase();
    const a = admission('EN_REVISION', { assignedToUserId: 'u-rev' });
    d.admissionsRepo.findById.mockResolvedValue(a);
    d.data.set(Users, [{ id: 'u-rev', displayName: 'Rosa Revisora' }]);
    d.checklist.buildView.mockResolvedValue(
      viewOf([
        {
          requirement: requirement('TIT'),
          items: [
            {
              id: 'c1',
              state: 'VERIFIED',
              fileId: 'f1',
              review: {
                id: 'rev-1',
                rowVersion: 4,
                verificationSourceUri: 'https://x',
                sourceTypeConceptId: PROF.ADMISSION_SOURCE_MEDICAL_COLLEGE,
                sourceRef: 'T-1',
                reviewedByUserId: 'u-rev',
                reviewedAt: NOW,
              },
            },
            {
              id: 'c2',
              state: 'REJECTED',
              review: {
                id: 'rev-2',
                rowVersion: 2,
                reasonText: 'Ilegible',
                reasonCodeConceptId: REASONS.ILEGIBLE.concept,
                internalNote: 'ojo',
              },
            },
          ],
        },
      ]),
    );
    const detail = await d.service.detail('adm-1', ACTOR, NOW);

    expect(detail.requirements).toHaveLength(1);
    const [verified, rejected] = detail.requirements[0].items;
    expect(verified).toMatchObject({
      id: 'rev-1',
      itemId: 'c1',
      state: 'VERIFIED',
      fileId: 'f1',
      verificationSourceUri: 'https://x',
      sourceType: 'COLEGIO_MEDICO',
      sourceRef: 'T-1',
      reviewedBy: { id: 'u-rev', name: 'Rosa Revisora' },
      rowVersion: 4,
    });
    expect(rejected).toMatchObject({
      state: 'REJECTED',
      reasonCode: 'ILEGIBLE',
      reasonText: 'Ilegible',
      internalNote: 'ojo',
    });
    expect(detail.requirements[0].state).toBe('VERIFIED');
    expect(detail.requirementsSummary).toEqual({
      total: 1,
      verified: 1,
      rejected: 0,
      pending: 0,
    });
    expect(detail.canVerify).toBe(true);
    expect(detail.practitioner).toMatchObject({
      fullName: 'Ana María Pérez Rojas',
      maskedNationalId: '****567',
    });
  });

  it('antes de tomar la admisión los ítems no tienen id de revisión (null) pero se listan', async () => {
    const d = detalleBase();
    d.admissionsRepo.findById.mockResolvedValue(admission('ENVIADA'));
    d.checklist.buildView.mockResolvedValue(
      viewOf([
        {
          requirement: requirement('TIT'),
          items: [{ id: 'c1', state: 'PENDING' }],
        },
      ]),
    );
    const detail = await d.service.detail('adm-1', ACTOR, NOW);
    expect(detail.requirements[0].items[0]).toMatchObject({
      id: null,
      rowVersion: null,
      state: 'PENDING',
    });
  });

  it('una revisión cuyo documento cambió después se marca evidenceChanged', async () => {
    const d = detalleBase();
    d.admissionsRepo.findById.mockResolvedValue(admission('EN_REVISION'));
    d.checklist.buildView.mockResolvedValue(
      viewOf([
        {
          requirement: requirement('TIT'),
          items: [
            {
              id: 'c1',
              state: 'PENDING',
              changed: true,
              review: { id: 'r', rowVersion: 1 },
            },
          ],
        },
      ]),
    );
    expect(
      (await d.service.detail('adm-1', ACTOR, NOW)).requirements[0].items[0]
        .evidenceChanged,
    ).toBe(true);
  });

  it('los bloqueos del checklist viajan con su causa', async () => {
    const d = detalleBase();
    d.admissionsRepo.findById.mockResolvedValue(admission('EN_REVISION'));
    d.checklist.buildView.mockResolvedValue(
      viewOf([
        { requirement: requirement('COL'), items: [] },
        {
          requirement: requirement('TIT'),
          items: [
            { id: 'c1', state: 'REJECTED', review: { id: 'r', rowVersion: 1 } },
          ],
        },
      ]),
    );
    const detail = await d.service.detail('adm-1', ACTOR, NOW);
    expect(detail.canVerify).toBe(false);
    expect(detail.blockers).toEqual([
      { requirementCode: 'COL', label: 'COL', reason: 'MISSING' },
      { requirementCode: 'TIT', label: 'TIT', reason: 'REJECTED' },
    ]);
  });

  describe('documentos (carrusel)', () => {
    it('lista TODOS los archivos en un orden estable, con su requisito y estado de revisión', async () => {
      const d = detalleBase();
      d.admissionsRepo.findById.mockResolvedValue(admission('EN_REVISION'));
      d.checklist.buildView.mockResolvedValue(
        viewOf([
          {
            requirement: requirement('MAT', { itemType: 'LICENSE' }),
            items: [
              {
                id: 'l1',
                state: 'VERIFIED',
                fileId: 'f-l1',
                type: 'LICENSE',
                review: { id: 'r-l1', rowVersion: 1 },
              },
            ],
          },
          {
            requirement: requirement('TIT'),
            items: [
              {
                id: 'c2',
                state: 'PENDING',
                fileId: 'f-c2',
                review: { id: 'r-c2', rowVersion: 1 },
              },
              {
                id: 'c1',
                state: 'REJECTED',
                fileId: 'f-c1',
                review: { id: 'r-c1', rowVersion: 1 },
              },
              { id: 'c3', state: 'PENDING' },
            ],
          },
        ]),
      );
      d.evidence.fileFacts.mockResolvedValue(
        new Map([
          [
            'f-l1',
            {
              id: 'f-l1',
              name: 'matricula.pdf',
              mimeType: 'application/pdf',
              sizeBytes: 1234,
              uploadedAt: NOW,
            },
          ],
          [
            'f-c1',
            {
              id: 'f-c1',
              name: 'titulo-1.jpg',
              mimeType: 'image/jpeg',
              sizeBytes: 99,
              uploadedAt: NOW,
            },
          ],
        ]),
      );
      const { documents } = await d.service.detail('adm-1', ACTOR, NOW);
      expect(
        documents.map(
          (x) => `${x.requirementCode}:${x.fileId}:${x.reviewState}`,
        ),
      ).toEqual(['MAT:f-l1:VERIFIED', 'TIT:f-c1:REJECTED', 'TIT:f-c2:PENDING']);
      expect(documents[0]).toMatchObject({
        id: 'r-l1',
        name: 'matricula.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1234,
        uploadedAt: NOW.toISOString(),
        pages: null,
      });
      // El ítem sin archivo no aparece; el orden no depende del de entrada.
      expect(documents).toHaveLength(3);
    });

    it('60 documentos con nombres de 200 caracteres: todos, sin truncar y en orden estable', async () => {
      const d = detalleBase();
      d.admissionsRepo.findById.mockResolvedValue(admission('EN_REVISION'));
      const ids = Array.from(
        { length: 60 },
        (_, i) => `c${String(i).padStart(2, '0')}`,
      ).reverse();
      d.checklist.buildView.mockResolvedValue(
        viewOf([
          {
            requirement: requirement('TIT'),
            items: ids.map((id) => ({
              id,
              state: 'PENDING' as const,
              fileId: `f-${id}`,
              review: { id: `r-${id}`, rowVersion: 1 },
            })),
          },
        ]),
      );
      const nombre = `${'ñ'.repeat(196)}.pdf`;
      expect(nombre).toHaveLength(200);
      d.evidence.fileFacts.mockResolvedValue(
        new Map(
          ids.map((id) => [
            `f-${id}`,
            {
              id: `f-${id}`,
              name: nombre,
              mimeType: 'application/pdf',
              sizeBytes: 1,
              uploadedAt: NOW,
            },
          ]),
        ),
      );
      const { documents } = await d.service.detail('adm-1', ACTOR, NOW);
      expect(documents).toHaveLength(60);
      expect(documents.every((x) => x.name === nombre)).toBe(true);
      expect(documents.map((x) => x.fileId)).toEqual(
        [...ids].sort().map((id) => `f-${id}`),
      );
    });
  });

  describe('formulario enviado', () => {
    it('usa la FOTO tomada al enviar: no cambia aunque el perfil se edite después', async () => {
      const d = detalleBase();
      d.data.set(Persons, [{ id: 'prac-1', name: 'NOMBRE EDITADO DESPUÉS' }]);
      d.admissionsRepo.findById.mockResolvedValue(
        admission('EN_REVISION', {
          submittedSnapshot: {
            personal: {
              nationalId: '7654321',
              nationalIdIssuer: 'SC',
              age: 41,
            },
            contact: { personalEmail: 'ana@example.com' },
            addresses: {},
            licenses: [],
            education: [],
            specialties: [],
            practices: [],
          },
        }),
      );
      d.checklist.buildView.mockResolvedValue(viewOf([]));
      const detail = await d.service.detail('adm-1', ACTOR, NOW);
      expect(detail.submittedFormSource).toBe('SNAPSHOT');
      expect(detail.practitioner).toMatchObject({
        nationalId: '7654321',
        nationalIdIssuer: 'SC',
        age: 41,
        personalEmail: 'ana@example.com',
      });
      expect(d.evidence.buildSnapshot).not.toHaveBeenCalled();
    });

    it('sin foto (admisión del backfill) usa lectura viva y lo dice', async () => {
      const d = detalleBase();
      d.admissionsRepo.findById.mockResolvedValue(admission('EN_REVISION'));
      d.checklist.buildView.mockResolvedValue(viewOf([]));
      const detail = await d.service.detail('adm-1', ACTOR, NOW);
      expect(detail.submittedFormSource).toBe('LIVE');
      expect(d.evidence.buildSnapshot).toHaveBeenCalledTimes(1);
      expect(detail.practitioner.nationalId).toBe('999');
    });
  });

  it('la bitácora trae actor, rol y estados con rótulo', async () => {
    const d = detalleBase();
    d.admissionsRepo.findById.mockResolvedValue(admission('EN_REVISION'));
    d.checklist.buildView.mockResolvedValue(viewOf([]));
    d.data.set(Users, [{ id: 'u-rev', displayName: 'Rosa Revisora' }]);
    d.eventsRepo.findByAdmission.mockResolvedValue([
      {
        id: 'e1',
        eventTypeConceptId: PROF.ADMISSION_EVENT_CLAIMED,
        fromStatusConceptId: ADMISSION_STATUS_CONCEPT.ENVIADA,
        toStatusConceptId: ADMISSION_STATUS_CONCEPT.EN_REVISION,
        actorUserId: 'u-rev',
        actorRoleCode: 'ADMISSIONS_REVIEWER',
        occurredAt: NOW,
      },
    ]);
    const { events } = await d.service.detail('adm-1', ACTOR, NOW);
    expect(events[0]).toMatchObject({
      type: 'CLAIMED',
      fromStatus: { code: 'ENVIADA', label: 'Enviada' },
      toStatus: { code: 'EN_REVISION', label: 'En revisión' },
      actor: { id: 'u-rev', name: 'Rosa Revisora' },
      actorRole: 'ADMISSIONS_REVIEWER',
    });
  });
});

describe('PractitionerAdmissionsReadService · la vista del propio médico', () => {
  it('el sujeto sale de la sesión: una cuenta sin perfil profesional no tiene admisión (404)', async () => {
    const d = build();
    const error = await d.service
      .own({ id: 'u-x', roles: [] } as never)
      .catch((e: Error) => e);
    expect(error).toBeInstanceOf(ResourceNotFoundException);
    expect(d.accountLinksRepo.findActiveByUser).toHaveBeenCalledWith(
      expect.anything(),
      'u-x',
    );
  });

  it('lee sólo la admisión de la persona vinculada a SU cuenta', async () => {
    const d = build();
    d.accountLinksRepo.findActiveByUser.mockResolvedValue({
      personId: 'prac-me',
    });
    d.data.set(HealthPractitionerProfiles, [{ profileId: 'prac-me' }]);
    d.admissionsRepo.findCurrentByPractitioners.mockResolvedValue(new Map());
    await d.service
      .own({ id: 'u-me', roles: [] } as never)
      .catch(() => undefined);
    expect(d.admissionsRepo.findCurrentByPractitioners).toHaveBeenCalledWith(
      expect.anything(),
      ['prac-me'],
    );
  });

  it('no filtra nada del personal: ni nota interna ni el código reservado «sospecha de fraude»', async () => {
    const d = build();
    const a = admission('RECHAZADA', {
      decisionReasonText: 'No figura en el registro',
      internalNote: 'parece falsificado',
    });
    d.checklist.buildView.mockResolvedValue(
      viewOf([
        {
          requirement: requirement('TIT'),
          items: [
            {
              id: 'c1',
              state: 'REJECTED',
              review: {
                id: 'r1',
                rowVersion: 1,
                reasonText: 'Documento dudoso',
                reasonCodeConceptId: REASONS.SOSPECHA_DE_FRAUDE.concept,
                internalNote: 'parece falsificado',
                reviewedByUserId: 'u-rev',
              },
            },
          ],
        },
      ]),
    );
    const own = await d.service.ownOf(d.em as never, a as never);
    const json = JSON.stringify(own);
    expect(json).not.toContain('falsificado');
    expect(json).not.toContain('internalNote');
    expect(json).not.toContain('u-rev');
    expect(own.items[0]).toMatchObject({
      state: 'REJECTED',
      reasonText: 'Documento dudoso',
      reasonCode: 'OTRO',
    });
    expect(own.decisionReasonText).toBe('No figura en el registro');
  });

  it('muestra qué se pidió y cuándo vence, y sólo permite reenviar/retirar donde corresponde', async () => {
    const d = build();
    d.checklist.buildView.mockResolvedValue(viewOf([]));
    const pidiendo = await d.service.ownOf(
      d.em as never,
      admission('INFORMACION_REQUERIDA', {
        infoRequestedText: 'Falta el reverso',
        infoDueAt: new Date('2026-11-20T00:00:00Z'),
      }) as never,
    );
    expect(pidiendo).toMatchObject({
      infoRequestedText: 'Falta el reverso',
      infoDueAt: '2026-11-20T00:00:00.000Z',
      canResubmit: true,
      canWithdraw: true,
    });
    const verificada = await d.service.ownOf(
      d.em as never,
      admission('VERIFICADA') as never,
    );
    expect(verificada).toMatchObject({
      canResubmit: false,
      canWithdraw: false,
    });
    const tope = await d.service.ownOf(
      d.em as never,
      admission('RECHAZADA', { resubmissionCount: 3 }) as never,
    );
    expect(tope.canResubmit).toBe(false);
  });

  it('el motivo de la decisión sólo se muestra al dueño cuando fue rechazo o suspensión', async () => {
    const d = build();
    d.checklist.buildView.mockResolvedValue(viewOf([]));
    const verificada = await d.service.ownOf(
      d.em as never,
      admission('VERIFICADA', {
        decisionReasonText: 'nota de aprobación',
      }) as never,
    );
    expect(verificada.decisionReasonText).toBeNull();
  });
});

describe('PractitionerAdmissionsReadService · estado visible de verificación', () => {
  it('sin admisión: UNVERIFIED (nunca IN_REVIEW) y no cae a un estado falso', async () => {
    const d = build();
    const map = await d.service.verificationOf(
      d.em as never,
      ['p1', 'p2'],
      NOW,
    );
    expect(map.get('p1')).toEqual({
      status: 'UNVERIFIED',
      verifiedAt: null,
      validUntil: null,
    });
    expect(map.size).toBe(2);
  });

  it('refleja la admisión vigente de cada profesional, en una consulta', async () => {
    const d = build();
    d.admissionsRepo.findCurrentByPractitioners.mockResolvedValue(
      new Map([
        [
          'p1',
          admission('VERIFICADA', {
            decidedAt: new Date('2026-10-01T00:00:00Z'),
            validUntil: new Date('2027-01-01T00:00:00Z'),
          }),
        ],
        ['p2', admission('EN_REVISION')],
        ['p3', admission('SUSPENDIDA')],
        [
          'p4',
          admission('VERIFICADA', {
            validUntil: new Date('2026-01-01T00:00:00Z'),
          }),
        ],
      ]),
    );
    const map = await d.service.verificationOf(
      d.em as never,
      ['p1', 'p2', 'p3', 'p4', 'p5'],
      NOW,
    );
    expect(map.get('p1')?.status).toBe('VERIFIED');
    expect(map.get('p2')?.status).toBe('IN_REVIEW');
    expect(map.get('p3')?.status).toBe('SUSPENDED');
    // La vigencia pasó aunque el barrido no corrió: el check ya no se muestra.
    expect(map.get('p4')?.status).toBe('EXPIRED');
    expect(map.get('p5')?.status).toBe('UNVERIFIED');
    expect(d.admissionsRepo.findCurrentByPractitioners).toHaveBeenCalledTimes(
      1,
    );
  });
});

describe('PractitionerAdmissionsReadService · S-3 / S-6 el profesional no ve su propia admisión por la vista del personal', () => {
  const DOCTOR_REVIEWER = {
    id: 'u-doctor',
    roles: ['ADMISSIONS_REVIEWER'],
  } as never;
  const detailData = (d: ReturnType<typeof build>, personId: string) => {
    d.data.set(Persons, [{ id: personId, name: 'Luis' }]);
    for (const cls of [
      Identifiers,
      ProfessionalCredentials,
      HealthPractitionerProfiles,
      JurisdictionAuthorizations,
      PractitionerSpecialties,
      CatalogConcepts,
    ]) {
      d.data.set(cls, []);
    }
    d.checklist.buildView.mockResolvedValue(viewOf([]));
  };

  it('detail: quien tiene rol de admisiones y es el titular de la admisión recibe 403 ADMISSION_SELF_ACCESS', async () => {
    const d = build();
    d.admissionsRepo.findById.mockResolvedValue(admission('EN_REVISION'));
    d.accountLinksRepo.links.push({ userId: 'u-doctor', personId: 'prac-1' });
    const error = await d.service
      .detail('adm-1', DOCTOR_REVIEWER, NOW)
      .catch((e: Error) => e);
    expect(error).toBeInstanceOf(InsufficientRoleException);
    expect((error as any).reason).toBe(
      ProfilesErrorReason.ADMISSION_SELF_ACCESS,
    );
    // No se armó nada del detalle: ni checklist, ni bitácora, ni notas.
    expect(d.checklist.buildView).not.toHaveBeenCalled();
    expect(d.eventsRepo.findByAdmission).not.toHaveBeenCalled();
  });

  it('S-6 · la persona tiene dos vínculos activos y el del llamador es el SEGUNDO: igual 403', async () => {
    const d = build();
    d.admissionsRepo.findById.mockResolvedValue(admission('EN_REVISION'));
    d.accountLinksRepo.links.push(
      { userId: 'u-delegado', personId: 'prac-1' },
      { userId: 'u-doctor', personId: 'prac-1' },
    );
    const error = await d.service
      .detail('adm-1', DOCTOR_REVIEWER, NOW)
      .catch((e: Error) => e);
    expect((error as any).reason).toBe(
      ProfilesErrorReason.ADMISSION_SELF_ACCESS,
    );
  });

  it('S-6 · la cuenta tiene vínculos con varias personas y la del medio es la admisión: 403', async () => {
    const d = build();
    d.admissionsRepo.findById.mockResolvedValue(admission('EN_REVISION'));
    d.accountLinksRepo.links.push(
      { userId: 'u-doctor', personId: 'paciente-x' },
      { userId: 'u-doctor', personId: 'prac-1' },
    );
    const error = await d.service
      .detail('adm-1', DOCTOR_REVIEWER, NOW)
      .catch((e: Error) => e);
    expect((error as any).reason).toBe(
      ProfilesErrorReason.ADMISSION_SELF_ACCESS,
    );
  });

  it('detail: el mismo usuario con perfil de médico ve la admisión de OTRO profesional', async () => {
    const d = build();
    d.admissionsRepo.findById.mockResolvedValue(
      admission('EN_REVISION', { practitionerProfileId: 'prac-2' }),
    );
    d.accountLinksRepo.links.push({ userId: 'u-doctor', personId: 'prac-1' });
    detailData(d, 'prac-2');
    const detail = await d.service.detail('adm-1', DOCTOR_REVIEWER, NOW);
    expect(detail.id).toBe('adm-1');
  });

  it('detail: un revisor sin vínculo de cuenta lo ve normal; con vínculo a OTRA persona también', async () => {
    const d = build();
    d.admissionsRepo.findById.mockResolvedValue(admission('ENVIADA'));
    detailData(d, 'prac-1');
    await expect(d.service.detail('adm-1', ACTOR, NOW)).resolves.toBeDefined();
    d.accountLinksRepo.links.push({
      userId: 'u-rev',
      personId: 'otra-persona',
    });
    await expect(d.service.detail('adm-1', ACTOR, NOW)).resolves.toBeDefined();
  });

  it('list: excluye del listado Y de los conteos las admisiones de TODAS las personas de la cuenta', async () => {
    const d = build();
    d.accountLinksRepo.links.push(
      { userId: 'u-doctor', personId: 'prac-1' },
      { userId: 'u-doctor', personId: 'prac-7' },
    );
    await d.service.list({}, DOCTOR_REVIEWER, NOW);
    const expected = { excludePractitionerProfileIds: ['prac-1', 'prac-7'] };
    expect(d.admissionsRepo.listPage.mock.calls[0][1]).toMatchObject(expected);
    expect(d.admissionsRepo.countByStatus.mock.calls[0][1]).toMatchObject(
      expected,
    );
  });

  it('list: sin perfil propio no excluye nada', async () => {
    const d = build();
    await d.service.list({}, ACTOR, NOW);
    expect(
      d.admissionsRepo.listPage.mock.calls[0][1].excludePractitionerProfileIds,
    ).toBeUndefined();
  });

  it('assertNotSelfAccess sirve a los documentos y a cualquier otra lectura del personal', async () => {
    const d = build();
    d.accountLinksRepo.links.push(
      { userId: 'u-otro', personId: 'prac-1' },
      { userId: 'u-doctor', personId: 'prac-1' },
    );
    await expect(
      d.service.assertNotSelfAccess(
        d.em as never,
        { practitionerProfileId: 'prac-1' },
        DOCTOR_REVIEWER,
      ),
    ).rejects.toBeInstanceOf(InsufficientRoleException);
    await expect(
      d.service.assertNotSelfAccess(
        d.em as never,
        { practitionerProfileId: 'prac-9' },
        DOCTOR_REVIEWER,
      ),
    ).resolves.toBeUndefined();
  });
});
