import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { jest } from '@jest/globals';
import {
  ConcurrencyConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../../common';
import { InsufficientRoleException } from '../../../../common/errors/domain.exception';
import { PROF } from '../../profiles.concepts';
import { ProfilesErrorReason } from '../../profiles.error-reasons';
import { PractitionerAdmissionsRepository } from '../../infrastructure/repositories';
import {
  evaluateChecklist,
  type ChecklistRequirement,
  type ReviewState,
} from '../../domain/admissions/admission-checklist';
import {
  ADMISSION_STATUS_CONCEPT,
  admissionStatusCode,
  type AdmissionStatusCode,
} from '../../domain/admissions/admission-status';
import { REASONS } from '../../domain/admissions/admission-vocabulary';
import { PractitionerAdmissionsService } from './practitioner-admissions.service';

// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;

const REVIEWER = { id: 'u-reviewer', roles: ['ADMISSIONS_REVIEWER'] } as never;
const OTHER_REVIEWER = {
  id: 'u-reviewer-2',
  roles: ['ADMISSIONS_REVIEWER'],
} as never;
const APPROVER = { id: 'u-approver', roles: ['ADMISSIONS_APPROVER'] } as never;
const SECADMIN = { id: 'u-secadmin', roles: ['SECURITY_ADMIN'] } as never;
const SUPER = { id: 'u-super', roles: ['SUPERADMIN'] } as never;
const DOCTOR = { id: 'u-doctor', roles: ['USER', 'PRACTITIONER'] } as never;
const caller = (user: unknown) => ({ user }) as never;

const NOW = new Date('2026-10-29T12:00:00.000Z');

type Row = {
  requirement: ChecklistRequirement;
  items: Array<{
    state: ReviewState;
    live: { itemType: string; itemId: string; label: string; fileId?: string };
    review?: Record<string, unknown>;
    evidenceChanged: boolean;
  }>;
};

const requirement = (
  code: string,
  overrides: Partial<ChecklistRequirement> = {},
): ChecklistRequirement => ({
  id: `req-${code}`,
  code,
  label: code,
  itemType: 'CREDENTIAL',
  evidence: 'DOCUMENT',
  required: true,
  requiresSourceUri: true,
  sortOrder: 1,
  ...overrides,
});

const item = (
  id: string,
  state: ReviewState,
  overrides: Record<string, unknown> = {},
  itemType = 'CREDENTIAL',
): Row['items'][number] => ({
  state,
  live: { itemType, itemId: id, label: `Ítem ${id}` },
  review: {
    id: `rev-${id}`,
    admissionId: 'adm-1',
    itemId: id,
    requirementId: 'req-A',
    statusConceptId: {
      PENDING: PROF.ADMISSION_REVIEW_PENDING,
      VERIFIED: PROF.ADMISSION_REVIEW_VERIFIED,
      REJECTED: PROF.ADMISSION_REVIEW_REJECTED,
      INFO_REQUIRED: PROF.ADMISSION_REVIEW_INFO_REQUIRED,
    }[state],
    rowVersion: 1,
    updatedAt: NOW,
    ...overrides,
  },
  evidenceChanged: false,
});

function viewOf(rows: Row[]) {
  return {
    evaluation: evaluateChecklist(
      rows.map((r) => ({ requirement: r.requirement, items: r.items })),
    ),
    live: { items: [], professionGroup: 'MEDICO' },
    reviews: [],
  } as never;
}

function admission(
  status: AdmissionStatusCode,
  overrides: Record<string, unknown> = {},
) {
  return {
    id: 'adm-1',
    practitionerProfileId: 'prac-1',
    admissionTypeConceptId: PROF.ADMISSION_TYPE_PRACTITIONER_ONBOARDING,
    statusConceptId: ADMISSION_STATUS_CONCEPT[status],
    submittedAt: new Date('2026-10-27T12:00:00.000Z'),
    dueAt: new Date('2026-10-30T12:00:00.000Z'),
    rowVersion: 4,
    resubmissionCount: 0,
    assignedToUserId: undefined as string | undefined,
    updatedAt: NOW,
    ...overrides,
  } as Record<string, any>;
}

function build(options: { admission?: Record<string, any> | null } = {}) {
  const tx = {
    flush: fn().mockResolvedValue(undefined),
    findOne: fn(),
    find: fn().mockResolvedValue([]),
  };
  const em = {
    transactional: fn((work: (t: typeof tx) => unknown) =>
      Promise.resolve(work(tx)),
    ),
    fork: () => tx,
  };
  // `null` modela «la admisión no existe»; los casos que lo usan no leen `d.current`.
  const current = (
    options.admission === undefined
      ? admission('EN_REVISION', { assignedToUserId: 'u-reviewer' })
      : options.admission
  ) as NonNullable<typeof options.admission>;

  const realRepo = new PractitionerAdmissionsRepository();
  const admissionsRepo = {
    findByIdForUpdate: fn().mockResolvedValue(current),
    findById: fn().mockResolvedValue(current),
    findOpenByPractitioner: fn().mockResolvedValue(null),
    findOpenByPractitionerForUpdate: fn().mockResolvedValue(null),
    create: fn((_tx: unknown, data: Record<string, unknown>) => ({
      id: 'adm-new',
      rowVersion: 1,
      resubmissionCount: 0,
      ...data,
    })),
    setStatus: fn((a: any, s: AdmissionStatusCode, u: string, now: Date) =>
      realRepo.setStatus(a, s, u, now),
    ),
    findExpired: fn().mockResolvedValue([]),
    findAbandoned: fn().mockResolvedValue([]),
  };
  const events: Array<Record<string, any>> = [];
  const eventsRepo = {
    append: fn((_tx: unknown, data: Record<string, any>) => events.push(data)),
  };
  const reviewsRepo = {
    findByIdForUpdate: fn().mockResolvedValue(null),
    findByAdmission: fn().mockResolvedValue([]),
  };
  const accountLinksRepo = {
    // Vínculos activos persona-cuenta: prac-1 tiene dos (delegado y titular) y el
    // titular, u-doctor, es el SEGUNDO (S-6). Los tests lo cambian con `links`.
    links: [
      { personId: 'prac-1', userId: 'u-delegado' },
      { personId: 'prac-1', userId: 'u-doctor' },
    ] as Array<{ personId: string; userId: string }>,
    hasActiveLink: fn(),
  };
  accountLinksRepo.hasActiveLink.mockImplementation(
    (_tx: unknown, personId: string, userId: string) =>
      Promise.resolve(
        accountLinksRepo.links.some(
          (l) => l.personId === personId && l.userId === userId,
        ),
      ),
  );
  const checklist = {
    requirementsOf: fn().mockResolvedValue([requirement('A')]),
    materialize: fn().mockResolvedValue(viewOf([])),
    applyEntityDecision: fn().mockResolvedValue(undefined),
  };
  const evidence = {
    collect: fn().mockResolvedValue({ items: [], professionGroup: 'MEDICO' }),
    buildSnapshot: fn().mockResolvedValue({ personal: {} }),
  };
  const projector = {
    projectVerified: fn().mockResolvedValue({
      projected: true,
      roleGranted: true,
    }),
    projectNotVerified: fn().mockResolvedValue({
      projected: true,
      roleGranted: false,
    }),
  };
  const read = {
    detailOf: fn((_tx: unknown, a: any) =>
      Promise.resolve({
        id: a.id,
        status: admissionStatusCode(a.statusConceptId),
      }),
    ),
    ownOf: fn((_tx: unknown, a: any) => Promise.resolve({ id: a.id })),
    currentOf: fn().mockResolvedValue(current),
    userExists: fn().mockResolvedValue(true),
  };
  const notices = { emit: fn().mockResolvedValue({ delivered: true }) };
  const logger = { setContext: fn(), info: fn(), warn: fn(), error: fn() };

  const service = new PractitionerAdmissionsService(
    em as never,
    admissionsRepo as never,
    eventsRepo as never,
    reviewsRepo as never,
    accountLinksRepo as never,
    checklist as never,
    evidence as never,
    projector as never,
    read as never,
    notices as never,
    logger as never,
  );
  return {
    service,
    tx,
    em,
    admissionsRepo,
    eventsRepo,
    events,
    reviewsRepo,
    accountLinksRepo,
    checklist,
    evidence,
    projector,
    read,
    notices,
    logger,
    current,
  };
}

const reasonOf = (error: unknown) => (error as { reason?: string }).reason;
async function failure(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (error) {
    return error as Error;
  }
  throw new Error('se esperaba un rechazo');
}

describe('PractitionerAdmissionsService', () => {
  afterEach(() => {
    delete process.env.ADMISSIONS_FOUR_EYES;
    delete process.env.ADMISSIONS_SECURITY_ADMIN_INHERITS;
    delete process.env.ADMISSIONS_MAX_RESUBMISSIONS;
    delete process.env.NODE_ENV_OVERRIDE;
  });

  // ═══════════════════════════════════════════════════ creación ══
  describe('openForRegistration', () => {
    it('crea la admisión ENVIADA con su plazo, su foto, su primer evento y el checklist, en la transacción del alta', async () => {
      const d = build({ admission: null });
      const created = await d.service.openForRegistration(d.tx as never, {
        practitionerProfileId: 'prac-1',
        actorUserId: 'u-doctor',
        attestation: { acceptedAt: NOW, textVersion: 'v1' },
        now: new Date('2026-10-29T15:30:00.000Z'),
      });

      const data = d.admissionsRepo.create.mock.calls[0][1];
      expect(data.statusConceptId).toBe(ADMISSION_STATUS_CONCEPT.ENVIADA);
      // 3 días hábiles desde un jueves: martes.
      expect(data.dueAt.toISOString()).toBe('2026-11-03T15:30:00.000Z');
      expect(data.submittedSnapshot).toEqual({ personal: {} });
      expect(data.attestationTextVersion).toBe('v1');
      expect(d.events).toHaveLength(1);
      expect(d.events[0]).toMatchObject({
        toStatusConceptId: ADMISSION_STATUS_CONCEPT.ENVIADA,
        actorRoleCode: 'REGISTRATION',
      });
      expect(d.checklist.materialize).toHaveBeenCalledWith(
        d.tx,
        created,
        expect.anything(),
      );
      expect(d.tx.flush).toHaveBeenCalled();
    });

    it('es idempotente: si ya hay una abierta la devuelve sin crear otra', async () => {
      const d = build();
      const existing = admission('ENVIADA');
      d.admissionsRepo.findOpenByPractitioner.mockResolvedValue(existing);
      await expect(
        d.service.openForRegistration(d.tx as never, {
          practitionerProfileId: 'prac-1',
          actorUserId: 'u',
        }),
      ).resolves.toBe(existing);
      expect(d.admissionsRepo.create).not.toHaveBeenCalled();
      expect(d.events).toHaveLength(0);
    });

    it('si el checklist falla, el error sale: el alta que la contiene se revierte', async () => {
      const d = build({ admission: null });
      d.checklist.materialize.mockRejectedValue(new Error('base caída'));
      await expect(
        d.service.openForRegistration(d.tx as never, {
          practitionerProfileId: 'prac-1',
          actorUserId: 'u',
        }),
      ).rejects.toThrow('base caída');
    });

    it('respeta el SLA configurado', async () => {
      process.env.ADMISSIONS_SLA_BUSINESS_DAYS = '1';
      try {
        const d = build({ admission: null });
        await d.service.openForRegistration(d.tx as never, {
          practitionerProfileId: 'prac-1',
          actorUserId: 'u',
          now: new Date('2026-10-30T09:00:00.000Z'),
        });
        expect(
          d.admissionsRepo.create.mock.calls[0][1].dueAt.toISOString(),
        ).toBe('2026-11-02T09:00:00.000Z');
      } finally {
        delete process.env.ADMISSIONS_SLA_BUSINESS_DAYS;
      }
    });
  });

  // ═══════════════════════════════════════════════════ claim ══
  describe('claim', () => {
    it('ENVIADA pasa a EN_REVISION asignada a quien la toma, con evento y checklist materializado', async () => {
      const d = build({ admission: admission('ENVIADA') });
      const result = await d.service.claim('adm-1', 4, caller(REVIEWER));
      expect(d.current).toMatchObject({
        statusConceptId: ADMISSION_STATUS_CONCEPT.EN_REVISION,
        assignedToUserId: 'u-reviewer',
      });
      expect(d.events[0]).toMatchObject({
        actorRoleCode: 'ADMISSIONS_REVIEWER',
        actorUserId: 'u-reviewer',
      });
      expect(d.checklist.materialize).toHaveBeenCalled();
      expect(result).toMatchObject({ status: 'EN_REVISION' });
    });

    it('dos revisores a la vez: el segundo recibe 409 ADMISSION_STALE con la versión vigente', async () => {
      const d = build({ admission: admission('ENVIADA', { rowVersion: 5 }) });
      const error = await failure(
        d.service.claim('adm-1', 4, caller(REVIEWER)),
      );
      expect(error).toBeInstanceOf(ConcurrencyConflictException);
      expect(reasonOf(error)).toBe(ProfilesErrorReason.ADMISSION_STALE);
      expect((error as any).details).toEqual({ currentRowVersion: 5 });
      expect(d.events).toHaveLength(0);
    });

    it('tomar una ya tomada por otro revisor es una transición inválida (422)', async () => {
      const d = build({
        admission: admission('EN_REVISION', {
          assignedToUserId: 'u-reviewer-2',
        }),
      });
      const error = await failure(
        d.service.claim('adm-1', 4, caller(REVIEWER)),
      );
      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect(reasonOf(error)).toBe(
        ProfilesErrorReason.ADMISSION_INVALID_TRANSITION,
      );
    });

    it('repetir el claim del mismo revisor es idempotente (200, sin evento nuevo)', async () => {
      const d = build({
        admission: admission('EN_REVISION', { assignedToUserId: 'u-reviewer' }),
      });
      await expect(
        d.service.claim('adm-1', 1, caller(REVIEWER)),
      ).resolves.toBeDefined();
      expect(d.events).toHaveLength(0);
    });

    it('una admisión inexistente es 404', async () => {
      const d = build({ admission: null });
      d.admissionsRepo.findByIdForUpdate.mockResolvedValue(null);
      const error = await failure(d.service.claim('x', 1, caller(REVIEWER)));
      expect(error).toBeInstanceOf(ResourceNotFoundException);
      expect(reasonOf(error)).toBe(ProfilesErrorReason.ADMISSION_NOT_FOUND);
    });

    it('nadie revisa su propia admisión (el médico que además es revisor)', async () => {
      const d = build({ admission: admission('ENVIADA') });
      d.accountLinksRepo.links.push({
        personId: 'prac-1',
        userId: 'u-reviewer',
      });
      const error = await failure(
        d.service.claim('adm-1', 4, caller(REVIEWER)),
      );
      expect(error).toBeInstanceOf(InsufficientRoleException);
      expect(reasonOf(error)).toBe(ProfilesErrorReason.ADMISSION_SELF_ACCESS);
    });
  });

  // ═══════════════════════════════════════════════════ roles ══
  describe('roles (la API autoriza)', () => {
    it('un aprobador no puede tomar ni revisar: 403', async () => {
      const d = build({ admission: admission('ENVIADA') });
      const error = await failure(
        d.service.claim('adm-1', 4, caller(APPROVER)),
      );
      expect(error).toBeInstanceOf(InsufficientRoleException);
      expect(reasonOf(error)).toBe(ProfilesErrorReason.ADMISSION_ROLE_REQUIRED);
    });

    it('un revisor no puede resolver: 403', async () => {
      const d = build();
      const error = await failure(
        d.service.decide(
          'adm-1',
          { decision: 'REJECTED', reason: 'x', expectedRowVersion: 4 } as never,
          caller(REVIEWER),
        ),
      );
      expect(reasonOf(error)).toBe(ProfilesErrorReason.ADMISSION_ROLE_REQUIRED);
    });

    it('el médico (sin rol de admisiones) no puede nada', async () => {
      const d = build({ admission: admission('ENVIADA') });
      const error = await failure(d.service.claim('adm-1', 4, caller(DOCTOR)));
      expect(reasonOf(error)).toBe(ProfilesErrorReason.ADMISSION_ROLE_REQUIRED);
    });

    it('SECURITY_ADMIN hereda ambos roles fuera de producción', async () => {
      const d = build({ admission: admission('ENVIADA') });
      await expect(
        d.service.claim('adm-1', 4, caller(SECADMIN)),
      ).resolves.toBeDefined();
      expect(d.events[0].actorRoleCode).toBe('SECURITY_ADMIN');
    });

    it('SECURITY_ADMIN NO hereda cuando ADMISSIONS_SECURITY_ADMIN_INHERITS=false', async () => {
      process.env.ADMISSIONS_SECURITY_ADMIN_INHERITS = 'false';
      const d = build({ admission: admission('ENVIADA') });
      const error = await failure(
        d.service.claim('adm-1', 4, caller(SECADMIN)),
      );
      expect(reasonOf(error)).toBe(ProfilesErrorReason.ADMISSION_ROLE_REQUIRED);
    });

    it('SUPERADMIN es el comodín de plataforma', async () => {
      const d = build({ admission: admission('ENVIADA') });
      await expect(
        d.service.claim('adm-1', 4, caller(SUPER)),
      ).resolves.toBeDefined();
      expect(d.events[0].actorRoleCode).toBe('SUPERADMIN');
    });
  });

  // ═══════════════════════════════════════════ release / reassign ══
  describe('release y reassign', () => {
    it('el dueño suelta la revisión: vuelve a ENVIADA sin asignado', async () => {
      const d = build();
      await d.service.release('adm-1', 4, caller(REVIEWER));
      expect(d.current).toMatchObject({
        statusConceptId: ADMISSION_STATUS_CONCEPT.ENVIADA,
      });
      expect(d.current.assignedToUserId).toBeNull();
      expect(d.events[0].eventTypeConceptId).toBe(
        PROF.ADMISSION_EVENT_RELEASED,
      );
    });

    it('un aprobador puede soltar la revisión de otro; otro revisor no', async () => {
      const d = build();
      await expect(
        d.service.release('adm-1', 4, caller(APPROVER)),
      ).resolves.toBeDefined();
      const e = build();
      const error = await failure(
        e.service.release('adm-1', 4, caller(OTHER_REVIEWER)),
      );
      expect(reasonOf(error)).toBe(ProfilesErrorReason.ADMISSION_ROLE_REQUIRED);
    });

    it('soltar una que no está en revisión es inválido', async () => {
      const d = build({ admission: admission('ENVIADA') });
      const error = await failure(
        d.service.release('adm-1', 4, caller(APPROVER)),
      );
      expect(reasonOf(error)).toBe(
        ProfilesErrorReason.ADMISSION_INVALID_TRANSITION,
      );
    });

    it('reasignar a otro revisor lo deja EN_REVISION con el nuevo asignado', async () => {
      const d = build();
      await d.service.reassign('adm-1', 'u-new', 4, caller(APPROVER));
      expect(d.current.assignedToUserId).toBe('u-new');
      expect(d.events[0].eventTypeConceptId).toBe(
        PROF.ADMISSION_EVENT_REASSIGNED,
      );
    });

    it('no se reasigna a un usuario inexistente ni al propio solicitante', async () => {
      const d = build();
      d.read.userExists.mockResolvedValue(false);
      const e1 = await failure(
        d.service.reassign('adm-1', 'u-x', 4, caller(APPROVER)),
      );
      expect(reasonOf(e1)).toBe(ProfilesErrorReason.ADMISSION_ASSIGNEE_INVALID);
      const e = build();
      // u-delegado también tiene un vínculo activo con el solicitante (S-6).
      for (const applicant of ['u-doctor', 'u-delegado']) {
        const e2 = await failure(
          e.service.reassign('adm-1', applicant, 4, caller(APPROVER)),
        );
        expect(reasonOf(e2)).toBe(
          ProfilesErrorReason.ADMISSION_ASSIGNEE_INVALID,
        );
      }
    });
  });

  // ═══════════════════════════════════════════════ request-info ══
  describe('requestInfo', () => {
    const dto = (over: Record<string, unknown> = {}) =>
      ({
        reason: 'Falta el reverso del título',
        expectedRowVersion: 4,
        ...over,
      }) as never;

    it('EN_REVISION pasa a INFORMACION_REQUERIDA con el texto y el plazo del solicitante', async () => {
      const d = build();
      await d.service.requestInfo('adm-1', dto(), caller(REVIEWER));
      expect(d.current).toMatchObject({
        statusConceptId: ADMISSION_STATUS_CONCEPT.INFORMACION_REQUERIDA,
        infoRequestedText: 'Falta el reverso del título',
      });
      expect(d.current.infoDueAt.getTime()).toBeGreaterThan(
        Date.now() + 29 * 86_400_000,
      );
      expect(d.notices.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'INFO_REQUIRED',
          statusCode: 'INFORMACION_REQUERIDA',
        }),
      );
    });

    it('sin motivo (vacío o sólo espacios): 422 ADMISSION_REASON_REQUIRED', async () => {
      const d = build();
      for (const reason of ['', '   ', undefined]) {
        const error = await failure(
          d.service.requestInfo('adm-1', dto({ reason }), caller(REVIEWER)),
        );
        expect(reasonOf(error)).toBe(
          ProfilesErrorReason.ADMISSION_REASON_REQUIRED,
        );
      }
      expect(d.events).toHaveLength(0);
    });

    it('sólo quien tomó la revisión puede pedir información', async () => {
      const d = build();
      const error = await failure(
        d.service.requestInfo('adm-1', dto(), caller(OTHER_REVIEWER)),
      );
      expect(reasonOf(error)).toBe(
        ProfilesErrorReason.ADMISSION_NOT_ASSIGNED_TO_ACTOR,
      );
    });

    it('desde ENVIADA (sin tomar) es una transición inválida', async () => {
      const d = build({ admission: admission('ENVIADA') });
      const error = await failure(
        d.service.requestInfo('adm-1', dto(), caller(REVIEWER)),
      );
      expect(reasonOf(error)).toBe(
        ProfilesErrorReason.ADMISSION_INVALID_TRANSITION,
      );
    });

    it('marca INFO_REQUIRED los ítems nombrados y deja un evento por ítem', async () => {
      const d = build();
      const target = item('c1', 'PENDING');
      d.checklist.materialize.mockResolvedValue(
        viewOf([
          {
            requirement: requirement('A'),
            items: [target, item('c2', 'PENDING')],
          },
        ]),
      );
      await d.service.requestInfo(
        'adm-1',
        dto({
          items: [{ type: 'CREDENTIAL', id: 'c1' }],
          reasonCode: 'ILEGIBLE',
        }),
        caller(REVIEWER),
      );
      expect(target.review?.statusConceptId).toBe(
        PROF.ADMISSION_REVIEW_INFO_REQUIRED,
      );
      expect(target.review?.reasonCodeConceptId).toBe(REASONS.ILEGIBLE.concept);
      const itemEvents = d.events.filter(
        (e) => e.eventTypeConceptId === PROF.ADMISSION_EVENT_ITEM_INFO_REQUIRED,
      );
      expect(itemEvents).toHaveLength(1);
      expect(itemEvents[0].itemId).toBe('c1');
    });
  });

  // ═════════════════════════════════════════════════ reviewItem ══
  describe('reviewItem', () => {
    function withReview(
      state: ReviewState = 'PENDING',
      requirementOver: Partial<ChecklistRequirement> = {},
    ) {
      const d = build();
      const target = item('c1', state, {
        rowVersion: 2,
        evidenceSha256: 'abc',
      });
      d.reviewsRepo.findByIdForUpdate.mockResolvedValue(target.review);
      d.checklist.requirementsOf.mockResolvedValue([
        requirement('A', requirementOver),
      ]);
      d.evidence.collect.mockResolvedValue({
        items: [
          {
            itemType: 'CREDENTIAL',
            itemId: 'c1',
            label: 'x',
            fileId: 'f1',
            evidenceSha256: 'abc',
          },
        ],
        professionGroup: 'MEDICO',
      });
      return { d, review: target.review as Record<string, any> };
    }
    const review = (over: Record<string, unknown> = {}) =>
      ({
        decision: 'VERIFIED',
        sourceType: 'COLEGIO_MEDICO',
        expectedRowVersion: 2,
        evidenceSha256: 'abc',
        ...over,
      }) as never;

    it('VERIFIED con fuente: queda verificado, con quién, cuándo, fuente y la huella de lo que vio', async () => {
      const { d, review: row } = withReview();
      await d.service.reviewItem(
        'adm-1',
        'rev-c1',
        review({ sourceRef: 'Trámite 123' }),
        caller(REVIEWER),
      );
      expect(row).toMatchObject({
        statusConceptId: PROF.ADMISSION_REVIEW_VERIFIED,
        reviewedByUserId: 'u-reviewer',
        sourceTypeConceptId: PROF.ADMISSION_SOURCE_MEDICAL_COLLEGE,
        sourceRef: 'Trámite 123',
        evidenceSha256: 'abc',
        fileId: 'f1',
      });
      expect(d.events[0]).toMatchObject({
        eventTypeConceptId: PROF.ADMISSION_EVENT_ITEM_VERIFIED,
        itemId: 'c1',
        requirementId: 'req-A',
      });
    });

    it('VERIFIED con sólo la URL (compatibilidad): la fuente se registra como OTRO', async () => {
      const { d, review: row } = withReview();
      await d.service.reviewItem(
        'adm-1',
        'rev-c1',
        review({
          sourceType: undefined,
          verificationSourceUri: 'https://registro.example/x',
        }),
        caller(REVIEWER),
      );
      expect(row.sourceTypeConceptId).toBe(PROF.ADMISSION_SOURCE_OTHER);
      expect(row.verificationSourceUri).toBe('https://registro.example/x');
      expect(row.sourceRef).toBe('https://registro.example/x');
    });

    it('VERIFIED sin fuente: 422 ADMISSION_ITEM_REQUIRES_SOURCE y nada se escribe', async () => {
      const { d, review: row } = withReview();
      for (const extra of [
        { sourceType: undefined },
        { sourceType: undefined, verificationSourceUri: '   ' },
      ]) {
        const error = await failure(
          d.service.reviewItem(
            'adm-1',
            'rev-c1',
            review(extra),
            caller(REVIEWER),
          ),
        );
        expect(reasonOf(error)).toBe(
          ProfilesErrorReason.ADMISSION_ITEM_REQUIRES_SOURCE,
        );
      }
      expect(row.statusConceptId).toBe(PROF.ADMISSION_REVIEW_PENDING);
      expect(d.events).toHaveLength(0);
    });

    it('un dato (sin documento ni fuente obligatoria) se verifica sin fuente', async () => {
      const { d, review: row } = withReview('PENDING', {
        requiresSourceUri: false,
        evidence: 'DATA',
      });
      await d.service.reviewItem(
        'adm-1',
        'rev-c1',
        review({ sourceType: undefined }),
        caller(REVIEWER),
      );
      expect(row.statusConceptId).toBe(PROF.ADMISSION_REVIEW_VERIFIED);
    });

    it('la fecha de consulta no puede ser futura', async () => {
      const { d } = withReview();
      const error = await failure(
        d.service.reviewItem(
          'adm-1',
          'rev-c1',
          review({ sourceConsultedAt: '2099-01-01T00:00:00Z' }),
          caller(REVIEWER),
        ),
      );
      expect(error).toBeInstanceOf(PreconditionFailedException);
    });

    it('REJECTED e INFO_REQUIRED exigen motivo', async () => {
      const { d } = withReview();
      for (const decision of ['REJECTED', 'INFO_REQUIRED']) {
        for (const reason of [undefined, '', '  ']) {
          const error = await failure(
            d.service.reviewItem(
              'adm-1',
              'rev-c1',
              review({ decision, reason }),
              caller(REVIEWER),
            ),
          );
          expect(reasonOf(error)).toBe(
            ProfilesErrorReason.ADMISSION_REASON_REQUIRED,
          );
        }
      }
    });

    it('REJECTED con motivo: guarda código (por omisión OTRO), texto y nota interna; limpia la fuente', async () => {
      const { d, review: row } = withReview();
      await d.service.reviewItem(
        'adm-1',
        'rev-c1',
        review({
          decision: 'REJECTED',
          reason: 'Ilegible',
          internalNote: 'ojo',
          sourceType: undefined,
        }),
        caller(REVIEWER),
      );
      expect(row).toMatchObject({
        statusConceptId: PROF.ADMISSION_REVIEW_REJECTED,
        reasonText: 'Ilegible',
        reasonCodeConceptId: REASONS.OTRO.concept,
        internalNote: 'ojo',
      });
      expect(row.sourceTypeConceptId).toBeNull();
    });

    it('dos revisores sobre el mismo ítem: el segundo recibe 409 ADMISSION_STALE', async () => {
      const { d } = withReview();
      const error = await failure(
        d.service.reviewItem(
          'adm-1',
          'rev-c1',
          review({ expectedRowVersion: 1 }),
          caller(REVIEWER),
        ),
      );
      expect(error).toBeInstanceOf(ConcurrencyConflictException);
      expect(reasonOf(error)).toBe(ProfilesErrorReason.ADMISSION_STALE);
    });

    it('repetir la misma verificación es idempotente: ni escribe ni duplica el evento', async () => {
      const { d } = withReview('VERIFIED');
      await expect(
        d.service.reviewItem('adm-1', 'rev-c1', review(), caller(REVIEWER)),
      ).resolves.toBeDefined();
      expect(d.events).toHaveLength(0);
    });

    it('un ítem de OTRA admisión es 404 (no se filtra que existe)', async () => {
      const { d } = withReview();
      const error = await failure(
        d.service.reviewItem('adm-OTRA', 'rev-c1', review(), caller(REVIEWER)),
      );
      expect(error).toBeInstanceOf(ResourceNotFoundException);
      expect(reasonOf(error)).toBe(
        ProfilesErrorReason.ADMISSION_ITEM_NOT_FOUND,
      );
    });

    it('un ítem que no existe es 404', async () => {
      const { d } = withReview();
      d.reviewsRepo.findByIdForUpdate.mockResolvedValue(null);
      const error = await failure(
        d.service.reviewItem('adm-1', 'nada', review(), caller(REVIEWER)),
      );
      expect(reasonOf(error)).toBe(
        ProfilesErrorReason.ADMISSION_ITEM_NOT_FOUND,
      );
    });

    it('sólo quien tomó la revisión revisa sus ítems, y sólo con la admisión EN_REVISION', async () => {
      const { d } = withReview();
      const e1 = await failure(
        d.service.reviewItem(
          'adm-1',
          'rev-c1',
          review(),
          caller(OTHER_REVIEWER),
        ),
      );
      expect(reasonOf(e1)).toBe(
        ProfilesErrorReason.ADMISSION_NOT_ASSIGNED_TO_ACTOR,
      );

      const x = withReview();
      x.d.admissionsRepo.findById.mockResolvedValue(admission('ENVIADA'));
      const e2 = await failure(
        x.d.service.reviewItem('adm-1', 'rev-c1', review(), caller(REVIEWER)),
      );
      expect(reasonOf(e2)).toBe(
        ProfilesErrorReason.ADMISSION_INVALID_TRANSITION,
      );
    });

    it('un ítem sin archivo se revisa igual (la huella queda sin archivo)', async () => {
      const { d, review: row } = withReview();
      d.evidence.collect.mockResolvedValue({
        items: [
          {
            itemType: 'CREDENTIAL',
            itemId: 'c1',
            label: 'x',
            evidenceSha256: 'sin-archivo',
          },
        ],
        professionGroup: 'MEDICO',
      });
      await d.service.reviewItem(
        'adm-1',
        'rev-c1',
        review({ evidenceSha256: 'sin-archivo' }),
        caller(REVIEWER),
      );
      expect(row.fileId).toBeUndefined();
      expect(row.evidenceSha256).toBe('sin-archivo');
    });

    it('un motivo de 500 caracteres con emoji se guarda entero', async () => {
      const { d, review: row } = withReview();
      const texto = `${'á'.repeat(496)}👩‍⚕️`;
      await d.service.reviewItem(
        'adm-1',
        'rev-c1',
        review({ decision: 'REJECTED', reason: texto, sourceType: undefined }),
        caller(REVIEWER),
      );
      expect(row.reasonText).toBe(texto.trim());
    });

    // ── S-2 · TOCTOU: la huella que queda es la que el revisor vio ──
    describe('S-2 · la evidencia cambió entre que el revisor la miró y decidió', () => {
      it('VERIFIED con una huella que ya no es la viva: 409 ADMISSION_EVIDENCE_CHANGED y no se escribe nada', async () => {
        const { d, review: row } = withReview();
        const error = await failure(
          d.service.reviewItem(
            'adm-1',
            'rev-c1',
            review({ evidenceSha256: 'la-que-vio-el-revisor' }),
            caller(REVIEWER),
          ),
        );
        expect(error).toBeInstanceOf(ConcurrencyConflictException);
        expect(reasonOf(error)).toBe(
          ProfilesErrorReason.ADMISSION_EVIDENCE_CHANGED,
        );
        expect(
          (error as any).details ?? (error as any).getResponse?.().details,
        ).toMatchObject({
          currentEvidenceSha256: 'abc',
        });
        expect(row.statusConceptId).toBe(PROF.ADMISSION_REVIEW_PENDING);
        expect(row.evidenceSha256).toBe('abc');
        expect(d.events).toHaveLength(0);
        expect(d.tx.flush).not.toHaveBeenCalled();
      });

      it('VERIFIED sin huella: no se acepta (nunca se verifica «lo de hoy»)', async () => {
        const { d, review: row } = withReview();
        const error = await failure(
          d.service.reviewItem(
            'adm-1',
            'rev-c1',
            review({ evidenceSha256: undefined }),
            caller(REVIEWER),
          ),
        );
        expect(reasonOf(error)).toBe(
          ProfilesErrorReason.ADMISSION_EVIDENCE_CHANGED,
        );
        expect(row.statusConceptId).toBe(PROF.ADMISSION_REVIEW_PENDING);
      });

      it('VERIFIED de un ítem que el médico retiró (ya no hay evidencia viva): 409', async () => {
        const { d } = withReview();
        d.evidence.collect.mockResolvedValue({
          items: [],
          professionGroup: 'MEDICO',
        });
        const error = await failure(
          d.service.reviewItem('adm-1', 'rev-c1', review(), caller(REVIEWER)),
        );
        expect(reasonOf(error)).toBe(
          ProfilesErrorReason.ADMISSION_EVIDENCE_CHANGED,
        );
      });

      it('REJECTED sin huella se acepta; con una huella vieja, 409', async () => {
        const ok = withReview();
        await ok.d.service.reviewItem(
          'adm-1',
          'rev-c1',
          review({
            decision: 'REJECTED',
            reason: 'Ilegible',
            sourceType: undefined,
            evidenceSha256: undefined,
          }),
          caller(REVIEWER),
        );
        expect(ok.review.statusConceptId).toBe(PROF.ADMISSION_REVIEW_REJECTED);

        const bad = withReview();
        const error = await failure(
          bad.d.service.reviewItem(
            'adm-1',
            'rev-c1',
            review({
              decision: 'REJECTED',
              reason: 'Ilegible',
              sourceType: undefined,
              evidenceSha256: 'vieja',
            }),
            caller(REVIEWER),
          ),
        );
        expect(reasonOf(error)).toBe(
          ProfilesErrorReason.ADMISSION_EVIDENCE_CHANGED,
        );
      });

      it('quien no tomó la revisión recibe 403 antes que 409: la huella viva no se le revela', async () => {
        const { d } = withReview();
        const error = await failure(
          d.service.reviewItem(
            'adm-1',
            'rev-c1',
            review({ evidenceSha256: 'otra' }),
            caller(OTHER_REVIEWER),
          ),
        );
        expect(reasonOf(error)).toBe(
          ProfilesErrorReason.ADMISSION_NOT_ASSIGNED_TO_ACTOR,
        );
      });

      it('repetir una verificación cuando la evidencia cambió después NO responde «ya está»: 409', async () => {
        const { d } = withReview('VERIFIED');
        d.evidence.collect.mockResolvedValue({
          items: [
            {
              itemType: 'CREDENTIAL',
              itemId: 'c1',
              label: 'x',
              fileId: 'f2',
              evidenceSha256: 'nueva',
            },
          ],
          professionGroup: 'MEDICO',
        });
        const error = await failure(
          d.service.reviewItem('adm-1', 'rev-c1', review(), caller(REVIEWER)),
        );
        expect(reasonOf(error)).toBe(
          ProfilesErrorReason.ADMISSION_EVIDENCE_CHANGED,
        );
      });
    });
  });

  // ═══════════════════════════════════════════════════ decide ══
  describe('decide', () => {
    const decision = (over: Record<string, unknown> = {}) =>
      ({ decision: 'VERIFIED', expectedRowVersion: 4, ...over }) as never;
    const license = (validTo?: Date) => ({ id: 'l1', validTo });
    function verifiable(extra: Row[] = []) {
      const d = build();
      const rows: Row[] = [
        {
          requirement: requirement('MAT', { itemType: 'LICENSE' }),
          items: [
            item(
              'l1',
              'VERIFIED',
              { sourceRef: 'Reg', reviewedAt: NOW },
              'LICENSE',
            ),
          ],
        },
        {
          requirement: requirement('TIT'),
          items: [
            item('c1', 'VERIFIED', {
              verificationSourceUri: 'u',
              reviewedAt: NOW,
            }),
          ],
        },
        ...extra,
      ];
      d.checklist.materialize.mockResolvedValue(viewOf(rows));
      d.tx.find.mockResolvedValue([
        license(new Date('2027-05-01T00:00:00.000Z')),
      ]);
      d.reviewsRepo.findByAdmission.mockResolvedValue([
        { reviewedByUserId: 'u-reviewer' },
      ]);
      return d;
    }

    it('VERIFIED con el checklist completo: proyecta fichas, perfil y sello en una transacción, con vigencia = la matrícula', async () => {
      const d = verifiable();
      const result = await d.service.decide(
        'adm-1',
        decision(),
        caller(APPROVER),
      );
      expect(d.current.statusConceptId).toBe(
        ADMISSION_STATUS_CONCEPT.VERIFICADA,
      );
      expect(d.current.validUntil.toISOString().slice(0, 10)).toBe(
        '2027-05-01',
      );
      expect(d.checklist.applyEntityDecision).toHaveBeenCalledTimes(2);
      expect(d.checklist.applyEntityDecision).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ itemId: 'l1' }),
        'VERIFIED',
        expect.objectContaining({ actorUserId: 'u-approver' }),
      );
      expect(d.projector.projectVerified).toHaveBeenCalledWith(
        d.tx,
        'prac-1',
        'u-approver',
        'adm-1',
        // El último instante del 1/5/2027 en La Paz.
        new Date('2027-05-02T03:59:59.999Z'),
      );
      expect(d.events.at(-1)).toMatchObject({
        eventTypeConceptId: PROF.ADMISSION_EVENT_VERIFIED,
        actorRoleCode: 'ADMISSIONS_APPROVER',
      });
      expect(d.notices.emit).toHaveBeenCalledWith(
        expect.objectContaining({ kind: 'VERIFIED' }),
      );
      expect(result).toMatchObject({ status: 'VERIFICADA' });
    });

    it('sin vencimiento en ninguna matrícula, vale la vigencia por defecto (36 meses)', async () => {
      const d = verifiable();
      d.tx.find.mockResolvedValue([license(undefined)]);
      await d.service.decide('adm-1', decision(), caller(APPROVER));
      const hoy = new Date();
      const hasta = new Date(
        `${d.current.validUntil.toISOString().slice(0, 10)}T00:00:00.000Z`,
      );
      const meses =
        (hasta.getUTCFullYear() - hoy.getUTCFullYear()) * 12 +
        hasta.getUTCMonth() -
        hoy.getUTCMonth();
      expect(meses).toBeGreaterThanOrEqual(35);
      expect(meses).toBeLessThanOrEqual(36);
    });

    it('una matrícula verificada que ya venció impide verificar', async () => {
      const d = verifiable();
      d.tx.find.mockResolvedValue([
        license(new Date('2020-01-01T00:00:00.000Z')),
      ]);
      const error = await failure(
        d.service.decide('adm-1', decision(), caller(APPROVER)),
      );
      expect(reasonOf(error)).toBe(
        ProfilesErrorReason.ADMISSION_VALIDITY_LAPSED,
      );
      expect(d.projector.projectVerified).not.toHaveBeenCalled();
    });

    it('un obligatorio faltante o pendiente impide verificar: 422 con los bloqueos', async () => {
      const d = verifiable([
        { requirement: requirement('COL'), items: [] },
        { requirement: requirement('X'), items: [item('x1', 'PENDING')] },
      ]);
      const error = await failure(
        d.service.decide('adm-1', decision(), caller(APPROVER)),
      );
      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect(reasonOf(error)).toBe(
        ProfilesErrorReason.ADMISSION_CHECKLIST_INCOMPLETE,
      );
      expect(
        (error as any).details.blockers.map(
          (b: any) => `${b.requirementCode}:${b.reason}`,
        ),
      ).toEqual(['COL:MISSING', 'X:PENDING']);
      expect(d.projector.projectVerified).not.toHaveBeenCalled();
      expect(d.current.statusConceptId).toBe(
        ADMISSION_STATUS_CONCEPT.EN_REVISION,
      );
    });

    it('S-2 · un ítem verificado cuya evidencia cambió después (el checklist lo evalúa PENDIENTE) impide verificar', async () => {
      const changed = {
        ...item('x1', 'PENDING', { evidenceSha256: 'vieja' }),
        evidenceChanged: true,
      };
      const d = verifiable([
        { requirement: requirement('X'), items: [changed] },
      ]);
      const error = await failure(
        d.service.decide('adm-1', decision(), caller(APPROVER)),
      );
      expect(reasonOf(error)).toBe(
        ProfilesErrorReason.ADMISSION_CHECKLIST_INCOMPLETE,
      );
      expect(
        (error as any).details.blockers.map(
          (b: any) => `${b.requirementCode}:${b.reason}`,
        ),
      ).toEqual(['X:PENDING']);
      expect(d.projector.projectVerified).not.toHaveBeenCalled();
    });

    it('falla cerrado: sin catálogo de requisitos aplicables nadie puede verificar', async () => {
      const d = build();
      d.checklist.materialize.mockResolvedValue(viewOf([]));
      d.reviewsRepo.findByAdmission.mockResolvedValue([
        { reviewedByUserId: 'u-reviewer' },
      ]);
      const error = await failure(
        d.service.decide('adm-1', decision(), caller(APPROVER)),
      );
      expect(reasonOf(error)).toBe(
        ProfilesErrorReason.ADMISSION_CHECKLIST_INCOMPLETE,
      );
      expect(d.projector.projectVerified).not.toHaveBeenCalled();
    });

    it('un obligatorio RECHAZADO impide verificar el perfil (corrige el defecto de countInStateExcept)', async () => {
      const d = verifiable([
        { requirement: requirement('COL'), items: [item('k1', 'REJECTED')] },
      ]);
      const error = await failure(
        d.service.decide('adm-1', decision(), caller(APPROVER)),
      );
      expect(reasonOf(error)).toBe(
        ProfilesErrorReason.ADMISSION_CHECKLIST_INCOMPLETE,
      );
      expect((error as any).details.blockers[0].reason).toBe('REJECTED');
    });

    it('un opcional rechazado NO bloquea, y su ficha queda rechazada con el motivo', async () => {
      const d = verifiable([
        {
          requirement: requirement('DIP', { required: false }),
          items: [
            item('d1', 'REJECTED', {
              reasonText: 'No es legible',
              reviewedAt: NOW,
            }),
          ],
        },
      ]);
      await d.service.decide('adm-1', decision(), caller(APPROVER));
      expect(d.current.statusConceptId).toBe(
        ADMISSION_STATUS_CONCEPT.VERIFICADA,
      );
      expect(d.checklist.applyEntityDecision).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ itemId: 'd1' }),
        'REJECTED',
        expect.objectContaining({ reasonText: 'No es legible' }),
      );
    });

    it('REJECTED exige motivo; con motivo rechaza, proyecta lo rechazado y no concede el check', async () => {
      const d = verifiable([
        {
          requirement: requirement('COL'),
          items: [
            item('k1', 'REJECTED', {
              reasonText: 'No figura',
              reviewedAt: NOW,
            }),
          ],
        },
      ]);
      const error = await failure(
        d.service.decide(
          'adm-1',
          decision({ decision: 'REJECTED' }),
          caller(APPROVER),
        ),
      );
      expect(reasonOf(error)).toBe(
        ProfilesErrorReason.ADMISSION_REASON_REQUIRED,
      );

      await d.service.decide(
        'adm-1',
        decision({
          decision: 'REJECTED',
          reason: 'No figura en el registro',
          reasonCode: 'NO_FIGURA_EN_REGISTRO',
          internalNote: 'revisar',
        }),
        caller(APPROVER),
      );
      expect(d.current).toMatchObject({
        statusConceptId: ADMISSION_STATUS_CONCEPT.RECHAZADA,
        decisionReasonText: 'No figura en el registro',
        decisionReasonCodeConceptId: REASONS.NO_FIGURA_EN_REGISTRO.concept,
        internalNote: 'revisar',
      });
      expect(d.projector.projectVerified).not.toHaveBeenCalled();
      expect(d.projector.projectNotVerified).toHaveBeenCalled();
      expect(d.checklist.applyEntityDecision).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ itemId: 'k1' }),
        'REJECTED',
        expect.anything(),
      );
      expect(d.notices.emit).toHaveBeenCalledWith(
        expect.objectContaining({ kind: 'REJECTED' }),
      );
    });

    it('el comando ya no recibe ítems: mandarlos es 422 y no se escribe nada', async () => {
      const d = verifiable();
      const error = await failure(
        d.service.decide(
          'adm-1',
          decision({
            items: [{ type: 'LICENSE', id: 'l1', decision: 'VERIFIED' }],
          }),
          caller(APPROVER),
        ),
      );
      expect(reasonOf(error)).toBe(
        ProfilesErrorReason.ADMISSION_DECISION_ITEMS_NOT_ACCEPTED,
      );
      expect(d.admissionsRepo.findByIdForUpdate).not.toHaveBeenCalled();
    });

    it('repetir la MISMA resolución es idempotente (200, sin eventos ni proyección)', async () => {
      const d = build({ admission: admission('VERIFICADA') });
      await expect(
        d.service.decide(
          'adm-1',
          decision({ expectedRowVersion: 1 }),
          caller(APPROVER),
        ),
      ).resolves.toMatchObject({
        status: 'VERIFICADA',
      });
      expect(d.events).toHaveLength(0);
      expect(d.projector.projectVerified).not.toHaveBeenCalled();
    });

    it('la resolución contraria sobre una ya resuelta es una transición inválida', async () => {
      const d = build({ admission: admission('VERIFICADA') });
      const error = await failure(
        d.service.decide(
          'adm-1',
          decision({ decision: 'REJECTED', reason: 'x' }),
          caller(APPROVER),
        ),
      );
      expect(reasonOf(error)).toBe(
        ProfilesErrorReason.ADMISSION_INVALID_TRANSITION,
      );
    });

    it('sin tomar la revisión (ENVIADA) no se puede resolver', async () => {
      const d = build({ admission: admission('ENVIADA') });
      const error = await failure(
        d.service.decide('adm-1', decision(), caller(APPROVER)),
      );
      expect(reasonOf(error)).toBe(
        ProfilesErrorReason.ADMISSION_INVALID_TRANSITION,
      );
    });

    it('dos aprobadores a la vez: el segundo recibe 409', async () => {
      const d = verifiable();
      d.current.rowVersion = 5;
      const error = await failure(
        d.service.decide('adm-1', decision(), caller(APPROVER)),
      );
      expect(reasonOf(error)).toBe(ProfilesErrorReason.ADMISSION_STALE);
    });

    describe('cuatro ojos', () => {
      it('encendido: quien tomó la revisión no puede aprobar (403)', async () => {
        process.env.ADMISSIONS_FOUR_EYES = 'true';
        const d = verifiable();
        const error = await failure(
          d.service.decide(
            'adm-1',
            decision(),
            caller({ id: 'u-reviewer', roles: ['ADMISSIONS_APPROVER'] }),
          ),
        );
        expect(error).toBeInstanceOf(InsufficientRoleException);
        expect(reasonOf(error)).toBe(
          ProfilesErrorReason.ADMISSION_FOUR_EYES_REQUIRED,
        );
        expect(d.projector.projectVerified).not.toHaveBeenCalled();
      });

      it('encendido: tampoco puede aprobar quien revisó un ítem aunque no tomó la revisión', async () => {
        process.env.ADMISSIONS_FOUR_EYES = 'true';
        const d = verifiable();
        d.reviewsRepo.findByAdmission.mockResolvedValue([
          { reviewedByUserId: 'u-checker' },
        ]);
        const error = await failure(
          d.service.decide(
            'adm-1',
            decision(),
            caller({ id: 'u-checker', roles: ['ADMISSIONS_APPROVER'] }),
          ),
        );
        expect(reasonOf(error)).toBe(
          ProfilesErrorReason.ADMISSION_FOUR_EYES_REQUIRED,
        );
      });

      it('encendido: un aprobador distinto de todos los revisores sí aprueba', async () => {
        process.env.ADMISSIONS_FOUR_EYES = 'true';
        const d = verifiable();
        await expect(
          d.service.decide('adm-1', decision(), caller(APPROVER)),
        ).resolves.toBeDefined();
        expect(d.current.fourEyesWaived).toBe(false);
      });

      it('apagado: el mismo que revisó puede aprobar, y la resolución queda marcada como «cuatro ojos omitido»', async () => {
        process.env.ADMISSIONS_FOUR_EYES = 'false';
        const d = verifiable();
        await d.service.decide(
          'adm-1',
          decision(),
          caller({ id: 'u-reviewer', roles: ['ADMISSIONS_APPROVER'] }),
        );
        expect(d.current.statusConceptId).toBe(
          ADMISSION_STATUS_CONCEPT.VERIFICADA,
        );
        expect(d.current.fourEyesWaived).toBe(true);
      });

      it('con o sin flag: nadie aprueba su propia admisión', async () => {
        process.env.ADMISSIONS_FOUR_EYES = 'false';
        const d = verifiable();
        d.accountLinksRepo.links.push({
          personId: 'prac-1',
          userId: 'u-approver',
        });
        const error = await failure(
          d.service.decide('adm-1', decision(), caller(APPROVER)),
        );
        expect(reasonOf(error)).toBe(ProfilesErrorReason.ADMISSION_SELF_ACCESS);
      });
    });

    it('un aviso que falla NO rompe la resolución', async () => {
      const d = verifiable();
      d.notices.emit.mockRejectedValue(new Error('canal caído'));
      await expect(
        d.service.decide('adm-1', decision(), caller(APPROVER)),
      ).resolves.toMatchObject({ status: 'VERIFICADA' });
      expect(d.current.statusConceptId).toBe(
        ADMISSION_STATUS_CONCEPT.VERIFICADA,
      );
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('si la proyección falla, el error sale y la transacción se revierte (todo o nada)', async () => {
      const d = verifiable();
      d.projector.projectVerified.mockRejectedValue(
        new Error('rol no asignable'),
      );
      await expect(
        d.service.decide('adm-1', decision(), caller(APPROVER)),
      ).rejects.toThrow('rol no asignable');
      expect(d.notices.emit).not.toHaveBeenCalled();
    });
  });

  // ═════════════════════════════════════ suspend / reinstate ══
  describe('suspend y reinstate', () => {
    const body = (over: Record<string, unknown> = {}) =>
      ({
        reason: 'Denuncia en trámite',
        expectedRowVersion: 4,
        ...over,
      }) as never;

    it('suspender una VERIFICADA quita el check (proyector) y avisa', async () => {
      const d = build({
        admission: admission('VERIFICADA', {
          validUntil: new Date('2027-01-01T00:00:00Z'),
        }),
      });
      await d.service.suspend('adm-1', body(), caller(APPROVER));
      expect(d.current.statusConceptId).toBe(
        ADMISSION_STATUS_CONCEPT.SUSPENDIDA,
      );
      expect(d.projector.projectNotVerified).toHaveBeenCalledWith(
        d.tx,
        'prac-1',
        'u-approver',
      );
      expect(d.notices.emit).toHaveBeenCalledWith(
        expect.objectContaining({ kind: 'SUSPENDED' }),
      );
    });

    it('sin motivo no se suspende ni se repone', async () => {
      const d = build({ admission: admission('VERIFICADA') });
      const error = await failure(
        d.service.suspend('adm-1', body({ reason: ' ' }), caller(APPROVER)),
      );
      expect(reasonOf(error)).toBe(
        ProfilesErrorReason.ADMISSION_REASON_REQUIRED,
      );
      const e = build({
        admission: admission('SUSPENDIDA', {
          validUntil: new Date('2099-01-01T00:00:00Z'),
        }),
      });
      const error2 = await failure(
        e.service.reinstate('adm-1', body({ reason: '' }), caller(APPROVER)),
      );
      expect(reasonOf(error2)).toBe(
        ProfilesErrorReason.ADMISSION_REASON_REQUIRED,
      );
    });

    it('sólo se suspende lo verificado; sólo se repone lo suspendido', async () => {
      const d = build({ admission: admission('EN_REVISION') });
      expect(
        reasonOf(
          await failure(d.service.suspend('adm-1', body(), caller(APPROVER))),
        ),
      ).toBe(ProfilesErrorReason.ADMISSION_INVALID_TRANSITION);
      expect(
        reasonOf(
          await failure(d.service.reinstate('adm-1', body(), caller(APPROVER))),
        ),
      ).toBe(ProfilesErrorReason.ADMISSION_INVALID_TRANSITION);
    });

    it('repetir la suspensión o la reposición es idempotente', async () => {
      const a = build({ admission: admission('SUSPENDIDA') });
      await expect(
        a.service.suspend('adm-1', body(), caller(APPROVER)),
      ).resolves.toBeDefined();
      expect(a.events).toHaveLength(0);
      const b = build({ admission: admission('VERIFICADA') });
      await expect(
        b.service.reinstate('adm-1', body(), caller(APPROVER)),
      ).resolves.toBeDefined();
      expect(b.events).toHaveLength(0);
    });

    it('reponer devuelve el check hasta la vigencia original', async () => {
      const d = build({
        admission: admission('SUSPENDIDA', {
          validUntil: new Date('2099-03-04T00:00:00.000Z'),
        }),
      });
      await d.service.reinstate('adm-1', body(), caller(APPROVER));
      expect(d.current.statusConceptId).toBe(
        ADMISSION_STATUS_CONCEPT.VERIFICADA,
      );
      expect(d.projector.projectVerified).toHaveBeenCalledWith(
        d.tx,
        'prac-1',
        'u-approver',
        'adm-1',
        new Date('2099-03-05T03:59:59.999Z'),
      );
    });

    it('una verificación ya vencida no se repone: se renueva', async () => {
      const d = build({
        admission: admission('SUSPENDIDA', {
          validUntil: new Date('2020-01-01T00:00:00.000Z'),
        }),
      });
      const error = await failure(
        d.service.reinstate('adm-1', body(), caller(APPROVER)),
      );
      expect(reasonOf(error)).toBe(
        ProfilesErrorReason.ADMISSION_VALIDITY_LAPSED,
      );
      expect(d.projector.projectVerified).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════ expire-sweep ══
  describe('expireSweep', () => {
    const sweeper = { id: 'sys', roles: ['SYSTEM'] };

    it('expira lo vencido (baja el check como EXPIRED) y abandona lo sin respuesta', async () => {
      const d = build();
      const vencida = admission('VERIFICADA', { id: 'a1' });
      const sinRespuesta = admission('INFORMACION_REQUERIDA', { id: 'a2' });
      d.admissionsRepo.findExpired.mockResolvedValue([vencida]);
      d.admissionsRepo.findAbandoned.mockResolvedValue([sinRespuesta]);
      d.admissionsRepo.findByIdForUpdate.mockImplementation(
        (_t: unknown, id: string) =>
          Promise.resolve(id === 'a1' ? vencida : sinRespuesta),
      );

      const result = await d.service.expireSweep(caller(sweeper));

      expect(result).toEqual({ expired: 1, abandoned: 1 });
      expect(vencida.statusConceptId).toBe(ADMISSION_STATUS_CONCEPT.EXPIRADA);
      expect(sinRespuesta.statusConceptId).toBe(
        ADMISSION_STATUS_CONCEPT.ABANDONADA,
      );
      expect(d.projector.projectNotVerified).toHaveBeenCalledWith(
        d.tx,
        'prac-1',
        'sys',
        'EXPIRED',
      );
      expect(d.events.map((e) => e.actorRoleCode)).toEqual([
        'SYSTEM',
        'SYSTEM',
      ]);
      expect(d.notices.emit).toHaveBeenCalledTimes(2);
    });

    it('es idempotente: una segunda corrida no encuentra nada y no escribe', async () => {
      const d = build();
      const result = await d.service.expireSweep(caller(sweeper));
      expect(result).toEqual({ expired: 0, abandoned: 0 });
      expect(d.events).toHaveLength(0);
    });

    it('si entre la búsqueda y el bloqueo otro la resolvió, la saltea', async () => {
      const d = build();
      const yaSuspendida = admission('SUSPENDIDA', { id: 'a1' });
      d.admissionsRepo.findExpired.mockResolvedValue([yaSuspendida]);
      d.admissionsRepo.findByIdForUpdate.mockResolvedValue(yaSuspendida);
      const result = await d.service.expireSweep(caller(sweeper));
      expect(result.expired).toBe(0);
      expect(d.projector.projectNotVerified).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════ el médico: me/* ══
  describe('resubmit y withdraw (el sujeto sale de la sesión)', () => {
    it('reenviar desde INFORMACION_REQUERIDA: vuelve a ENVIADA, recalcula el plazo, cuenta el reenvío y toma una foto nueva', async () => {
      const d = build({
        admission: admission('INFORMACION_REQUERIDA', {
          assignedToUserId: 'u-reviewer',
          resubmissionCount: 1,
        }),
      });
      await d.service.resubmit(DOCTOR, 'req-1');
      expect(d.current).toMatchObject({
        statusConceptId: ADMISSION_STATUS_CONCEPT.ENVIADA,
        resubmissionCount: 2,
      });
      expect(d.current.assignedToUserId).toBeNull();
      expect(d.current.infoRequestedText).toBeNull();
      expect(d.current.dueAt.getTime()).toBeGreaterThan(Date.now());
      expect(d.evidence.buildSnapshot).toHaveBeenCalled();
      expect(d.current.submittedSnapshot).toEqual({ personal: {} });
      expect(d.checklist.materialize).toHaveBeenCalledWith(
        d.tx,
        d.current,
        expect.objectContaining({ reset: 'CHANGED' }),
      );
      expect(d.events[0]).toMatchObject({
        eventTypeConceptId: PROF.ADMISSION_EVENT_RESUBMITTED,
        actorRoleCode: 'PRACTITIONER',
      });
    });

    it('desde EXPIRADA invalida todo lo revisado (renovación)', async () => {
      const d = build({ admission: admission('EXPIRADA') });
      await d.service.resubmit(DOCTOR);
      expect(d.checklist.materialize).toHaveBeenCalledWith(
        d.tx,
        d.current,
        expect.objectContaining({ reset: 'ALL' }),
      );
    });

    it.each<AdmissionStatusCode>(['RECHAZADA', 'ABANDONADA'])(
      'se puede reenviar desde %s',
      async (status) => {
        const d = build({ admission: admission(status) });
        await expect(d.service.resubmit(DOCTOR)).resolves.toBeDefined();
      },
    );

    it.each<AdmissionStatusCode>([
      'ENVIADA',
      'EN_REVISION',
      'VERIFICADA',
      'SUSPENDIDA',
      'RETIRADA',
    ])('no se reenvía desde %s (422)', async (status) => {
      const d = build({ admission: admission(status) });
      const error = await failure(d.service.resubmit(DOCTOR));
      expect(reasonOf(error)).toBe(
        ProfilesErrorReason.ADMISSION_INVALID_TRANSITION,
      );
    });

    it('tope de reenvíos: superado, 422 ADMISSION_RESUBMISSION_LIMIT', async () => {
      const d = build({
        admission: admission('RECHAZADA', { resubmissionCount: 3 }),
      });
      const error = await failure(d.service.resubmit(DOCTOR));
      expect(reasonOf(error)).toBe(
        ProfilesErrorReason.ADMISSION_RESUBMISSION_LIMIT,
      );
    });

    it('el tope es configurable', async () => {
      process.env.ADMISSIONS_MAX_RESUBMISSIONS = '5';
      const d = build({
        admission: admission('RECHAZADA', { resubmissionCount: 4 }),
      });
      await expect(d.service.resubmit(DOCTOR)).resolves.toBeDefined();
    });

    it('sin admisión propia: 404 (nadie lee ni mueve la de otro)', async () => {
      const d = build({ admission: null });
      d.read.currentOf.mockResolvedValue(null);
      const error = await failure(d.service.resubmit(DOCTOR));
      expect(error).toBeInstanceOf(ResourceNotFoundException);
      expect(d.admissionsRepo.findByIdForUpdate).not.toHaveBeenCalled();
    });

    it('la admisión sobre la que se actúa sale de la sesión, no de un parámetro', async () => {
      const d = build({ admission: admission('RECHAZADA') });
      await d.service.resubmit(DOCTOR);
      expect(d.read.currentOf).toHaveBeenCalledWith(d.tx, DOCTOR);
    });

    it('retirar cierra la solicitud (RETIRADA, closed_at) y libera el lugar de la abierta', async () => {
      const d = build({
        admission: admission('INFORMACION_REQUERIDA', {
          assignedToUserId: 'u-reviewer',
        }),
      });
      await d.service.withdraw(DOCTOR);
      expect(d.current.statusConceptId).toBe(ADMISSION_STATUS_CONCEPT.RETIRADA);
      expect(d.current.closedAt).toBeInstanceOf(Date);
      expect(d.events[0].eventTypeConceptId).toBe(
        PROF.ADMISSION_EVENT_WITHDRAWN,
      );
    });

    it('no se retira lo ya en revisión o resuelto; retirar dos veces es idempotente', async () => {
      const a = build({ admission: admission('EN_REVISION') });
      expect(reasonOf(await failure(a.service.withdraw(DOCTOR)))).toBe(
        ProfilesErrorReason.ADMISSION_INVALID_TRANSITION,
      );
      const b = build({ admission: admission('RETIRADA') });
      await expect(b.service.withdraw(DOCTOR)).resolves.toBeDefined();
      expect(b.events).toHaveLength(0);
    });
  });

  // ═══════════════════ ganchos heredados (CV-20 y M27) ══
  // ═════════════════════════ S-3 / S-4 · nadie actúa sobre su propia admisión ══
  describe('S-4 · toda ruta que toca una admisión pasa por la misma puerta (el propio profesional → 403 ADMISSION_SELF_ACCESS)', () => {
    const both = {
      id: 'u-doctor',
      roles: ['ADMISSIONS_REVIEWER', 'ADMISSIONS_APPROVER', 'SECURITY_ADMIN'],
    } as never;
    type D = ReturnType<typeof build>;
    const dtoV = { expectedRowVersion: 4, reason: 'motivo' } as never;
    /** Por cada método del servicio de personal: cómo se invoca y en qué estados (incluidos los idempotentes). */
    const routes: Array<
      [string, AdmissionStatusCode, (d: D) => Promise<unknown>]
    > = [
      ['claim', 'ENVIADA', (d) => d.service.claim('adm-1', 4, caller(both))],
      [
        'claim (ya tomada por él: retorno idempotente)',
        'EN_REVISION',
        (d) => d.service.claim('adm-1', 4, caller(both)),
      ],
      [
        'release',
        'EN_REVISION',
        (d) => d.service.release('adm-1', 4, caller(both)),
      ],
      [
        'reassign',
        'EN_REVISION',
        (d) => d.service.reassign('adm-1', 'u-reviewer-2', 4, caller(both)),
      ],
      [
        'requestInfo',
        'EN_REVISION',
        (d) => d.service.requestInfo('adm-1', dtoV, caller(both)),
      ],
      [
        'reviewItem',
        'EN_REVISION',
        (d) =>
          d.service.reviewItem(
            'adm-1',
            'rev-c1',
            {
              decision: 'REJECTED',
              reason: 'x',
              expectedRowVersion: 1,
            } as never,
            caller(both),
          ),
      ],
      [
        'decide VERIFIED',
        'EN_REVISION',
        (d) =>
          d.service.decide(
            'adm-1',
            { decision: 'VERIFIED', expectedRowVersion: 4 } as never,
            caller(both),
          ),
      ],
      [
        'decide VERIFIED (ya resuelta: retorno idempotente)',
        'VERIFICADA',
        (d) =>
          d.service.decide(
            'adm-1',
            { decision: 'VERIFIED', expectedRowVersion: 4 } as never,
            caller(both),
          ),
      ],
      [
        'decide REJECTED (ya resuelta: retorno idempotente)',
        'RECHAZADA',
        (d) =>
          d.service.decide(
            'adm-1',
            {
              decision: 'REJECTED',
              expectedRowVersion: 4,
              reason: 'x',
            } as never,
            caller(both),
          ),
      ],
      [
        'suspend',
        'VERIFICADA',
        (d) => d.service.suspend('adm-1', dtoV, caller(both)),
      ],
      [
        'suspend (ya suspendida: retorno idempotente)',
        'SUSPENDIDA',
        (d) => d.service.suspend('adm-1', dtoV, caller(both)),
      ],
      [
        'reinstate',
        'SUSPENDIDA',
        (d) => d.service.reinstate('adm-1', dtoV, caller(both)),
      ],
      [
        'reinstate (ya verificada: retorno idempotente)',
        'VERIFICADA',
        (d) => d.service.reinstate('adm-1', dtoV, caller(both)),
      ],
    ];

    it.each(routes)(
      '%s sobre la propia admisión (%s): 403 y no cambia nada',
      async (_name, status, run) => {
        const d = build({
          admission: admission(status, {
            assignedToUserId: 'u-doctor',
            validUntil: new Date('2030-01-01'),
          }),
        });
        const target = item('c1', 'PENDING', { rowVersion: 1 });
        d.reviewsRepo.findByIdForUpdate.mockResolvedValue(target.review);
        const before = d.current.statusConceptId;
        const error = await failure(run(d));
        expect(error).toBeInstanceOf(InsufficientRoleException);
        expect(reasonOf(error)).toBe(ProfilesErrorReason.ADMISSION_SELF_ACCESS);
        expect(d.events).toHaveLength(0);
        expect(d.current.statusConceptId).toBe(before);
        expect(d.tx.flush).not.toHaveBeenCalled();
        expect(d.notices.emit).not.toHaveBeenCalled();
      },
    );

    it('los mismos comandos de otra persona con rol sí avanzan (la puerta no es un 403 genérico)', async () => {
      const d = build({
        admission: admission('VERIFICADA', {
          validUntil: new Date('2030-01-01'),
        }),
      });
      await expect(
        d.service.decide(
          'adm-1',
          { decision: 'VERIFIED', expectedRowVersion: 4 } as never,
          caller(APPROVER),
        ),
      ).resolves.toBeDefined();
    });

    it('cubre todos los métodos públicos del servicio que reciben una admisión', () => {
      const covered = new Set([
        'claim',
        'release',
        'reassign',
        'requestInfo',
        'reviewItem',
        'decide',
        'suspend',
        'reinstate',
      ]);
      const exemptions = new Set([
        // Del propio profesional (la sesión es el sujeto) o sin llamador humano.
        'resubmit',
        'withdraw',
        'openForRegistration',
        'expireSweep',
        // Hooks internos: la puerta está dentro (CV-20) o la autoridad no es una persona (M27).
        'recordCredentialReview',
        'recordExternalLicenseVerification',
      ]);
      // Los métodos públicos son los declarados `async nombre(` sin `private`.
      const source = readFileSync(
        join(
          process.cwd(),
          'src/modules/profiles/application/services/practitioner-admissions.service.ts',
        ),
        'utf8',
      );
      const methods = [...source.matchAll(/^ {2}async (\w+)\(/gm)].map(
        (m) => m[1],
      );
      expect(methods.length).toBeGreaterThan(8);
      const outside = methods.filter(
        (m) => !covered.has(m) && !exemptions.has(m),
      );
      expect(outside).toEqual([]);
    });
  });

  describe('caminos heredados', () => {
    function legacy(profileStatus: string, open: Record<string, any> | null) {
      const d = build({ admission: open });
      d.admissionsRepo.findOpenByPractitionerForUpdate.mockResolvedValue(open);
      d.tx.findOne.mockResolvedValue({
        verificationStatusConceptId: profileStatus,
      });
      const target = item('c1', 'PENDING');
      d.checklist.materialize.mockResolvedValue(
        viewOf([{ requirement: requirement('A'), items: [target] }]),
      );
      return { d, target };
    }

    const taken = () =>
      admission('EN_REVISION', { assignedToUserId: 'u-reviewer' });
    const asReviewer = {
      id: 'u-reviewer',
      roles: ['ADMISSIONS_REVIEWER'],
    } as never;

    it('CV-20 REJECTED: con la admisión tomada por el revisor, el rechazo queda como revisión del requisito y NO toca el perfil', async () => {
      const { d, target } = legacy(PROF.PRACT_VERIF_PENDING, taken());
      const recorded = await d.service.recordCredentialReview(d.tx as never, {
        credentialId: 'c1',
        practitionerProfileId: 'prac-1',
        decision: 'REJECTED',
        reason: 'Ilegible',
        actor: asReviewer,
      });
      expect(recorded).toBe(true);
      expect(target.review?.statusConceptId).toBe(
        PROF.ADMISSION_REVIEW_REJECTED,
      );
      expect(target.review?.reviewedByUserId).toBe('u-reviewer');
      expect(d.events.at(-1)).toMatchObject({
        actorRoleCode: 'ADMISSIONS_REVIEWER',
      });
      expect(d.projector.projectVerified).not.toHaveBeenCalled();
      expect(d.current.statusConceptId).toBe(
        ADMISSION_STATUS_CONCEPT.EN_REVISION,
      );
    });

    describe('S-1 / S-5 · el camino heredado pasa por las mismas puertas que reviewItem y no verifica', () => {
      const credentialByCv20 = (
        d: ReturnType<typeof build>,
        actor: unknown,
        decision: 'VERIFIED' | 'REJECTED' = 'REJECTED',
      ) =>
        d.service.recordCredentialReview(d.tx as never, {
          credentialId: 'c1',
          practitionerProfileId: 'prac-1',
          decision,
          verificationSourceUri: 'https://colegio.example/x',
          reason: decision === 'REJECTED' ? 'Ilegible' : undefined,
          actor: actor as never,
        });

      it('S-5 · VERIFIED por CV-20 con una admisión abierta se rechaza 412 ADMISSION_VERIFY_VIA_REVIEW: no se escribe nada', async () => {
        const { d, target } = legacy(PROF.PRACT_VERIF_PENDING, taken());
        const error = await failure(
          credentialByCv20(d, asReviewer, 'VERIFIED'),
        );
        expect(error).toBeInstanceOf(PreconditionFailedException);
        expect(reasonOf(error)).toBe(
          ProfilesErrorReason.ADMISSION_VERIFY_VIA_REVIEW,
        );
        expect(target.review?.statusConceptId).toBe(
          PROF.ADMISSION_REVIEW_PENDING,
        );
        expect(d.events).toHaveLength(0);
      });

      it('S-5 · tampoco abre una admisión para verificar: pendiente y sin admisión, VERIFIED es 412 (el llamador revierte)', async () => {
        const { d } = legacy(PROF.PRACT_VERIF_PENDING, null);
        const error = await failure(
          credentialByCv20(d, asReviewer, 'VERIFIED'),
        );
        expect(reasonOf(error)).toBe(
          ProfilesErrorReason.ADMISSION_VERIFY_VIA_REVIEW,
        );
      });

      it('un SECURITY_ADMIN que es el propio profesional no toca SU título: 403 ADMISSION_SELF_ACCESS', async () => {
        const { d, target } = legacy(PROF.PRACT_VERIF_PENDING, taken());
        for (const decision of ['VERIFIED', 'REJECTED'] as const) {
          const error = await failure(
            credentialByCv20(
              d,
              { id: 'u-doctor', roles: ['SECURITY_ADMIN'] },
              decision,
            ),
          );
          expect(error).toBeInstanceOf(InsufficientRoleException);
          expect(reasonOf(error)).toBe(
            ProfilesErrorReason.ADMISSION_SELF_ACCESS,
          );
        }
        expect(target.review?.statusConceptId).toBe(
          PROF.ADMISSION_REVIEW_PENDING,
        );
        expect(d.events).toHaveLength(0);
      });

      it('el propio profesional tampoco toca su título cuando ya está verificado y no hay admisión abierta', async () => {
        const { d } = legacy(PROF.PRACT_VERIF_VERIFIED, null);
        const error = await failure(
          credentialByCv20(d, { id: 'u-doctor', roles: ['SECURITY_ADMIN'] }),
        );
        expect(reasonOf(error)).toBe(ProfilesErrorReason.ADMISSION_SELF_ACCESS);
      });

      it('un revisor que no tomó la admisión: 403 ADMISSION_NOT_ASSIGNED_TO_ACTOR', async () => {
        const { d, target } = legacy(PROF.PRACT_VERIF_PENDING, taken());
        const error = await failure(
          credentialByCv20(d, {
            id: 'u-reviewer-2',
            roles: ['ADMISSIONS_REVIEWER'],
          }),
        );
        expect(reasonOf(error)).toBe(
          ProfilesErrorReason.ADMISSION_NOT_ASSIGNED_TO_ACTOR,
        );
        expect(target.review?.statusConceptId).toBe(
          PROF.ADMISSION_REVIEW_PENDING,
        );
      });

      it('admisión ENVIADA (nadie la tomó): 412 ADMISSION_INVALID_TRANSITION; el legado no se auto-asigna', async () => {
        const { d, target } = legacy(
          PROF.PRACT_VERIF_PENDING,
          admission('ENVIADA'),
        );
        const error = await failure(credentialByCv20(d, asReviewer));
        expect(error).toBeInstanceOf(PreconditionFailedException);
        expect(reasonOf(error)).toBe(
          ProfilesErrorReason.ADMISSION_INVALID_TRANSITION,
        );
        expect(target.review?.statusConceptId).toBe(
          PROF.ADMISSION_REVIEW_PENDING,
        );
        expect(d.current.assignedToUserId).toBeUndefined();
      });

      it('sin rol de revisor de admisiones (SECURITY_ADMIN sin herencia): 403 ADMISSION_ROLE_REQUIRED', async () => {
        process.env.ADMISSIONS_SECURITY_ADMIN_INHERITS = 'false';
        const { d, target } = legacy(
          PROF.PRACT_VERIF_PENDING,
          admission('EN_REVISION', { assignedToUserId: 'u-secadmin' }),
        );
        const error = await failure(
          credentialByCv20(d, { id: 'u-secadmin', roles: ['SECURITY_ADMIN'] }),
        );
        expect(reasonOf(error)).toBe(
          ProfilesErrorReason.ADMISSION_ROLE_REQUIRED,
        );
        expect(target.review?.statusConceptId).toBe(
          PROF.ADMISSION_REVIEW_PENDING,
        );
      });

      it('CV-20 REJECTED de un pendiente sin admisión la abre pero, como nadie la tomó, falla 412 (la transacción del llamador revierte)', async () => {
        const { d } = legacy(PROF.PRACT_VERIF_PENDING, null);
        const error = await failure(credentialByCv20(d, asReviewer));
        expect(reasonOf(error)).toBe(
          ProfilesErrorReason.ADMISSION_INVALID_TRANSITION,
        );
      });
    });

    it('CV-20 de un perfil ya verificado (o sin admisión) no registra nada', async () => {
      const { d } = legacy(PROF.PRACT_VERIF_VERIFIED, null);
      const recorded = await d.service.recordCredentialReview(d.tx as never, {
        credentialId: 'c1',
        practitionerProfileId: 'prac-1',
        decision: 'VERIFIED',
        verificationSourceUri: 'u',
        actor: { id: 'u-secadmin', roles: ['SECURITY_ADMIN'] } as never,
      });
      expect(recorded).toBe(false);
      expect(d.admissionsRepo.create).not.toHaveBeenCalled();
    });

    it('M27: la matrícula verificada por la autoridad queda como revisión con su caso como referencia', async () => {
      const { d, target } = legacy(
        PROF.PRACT_VERIF_PENDING,
        admission('EN_REVISION', { assignedToUserId: 'u-reviewer' }),
      );
      target.live.itemId = 'auth-1';
      const recorded = await d.service.recordExternalLicenseVerification(
        d.tx as never,
        {
          authorizationId: 'auth-1',
          practitionerProfileId: 'prac-1',
          identityCaseId: 'caso-7',
          actorUserId: 'sys',
        },
      );
      expect(recorded).toBe(true);
      expect(target.review).toMatchObject({
        statusConceptId: PROF.ADMISSION_REVIEW_VERIFIED,
        sourceTypeConceptId: PROF.ADMISSION_SOURCE_MINSALUD_REGISTRY,
        sourceRef: 'identity_verification_case:caso-7',
      });
      expect(d.projector.projectVerified).not.toHaveBeenCalled();
    });

    it('una admisión ya resuelta no recibe revisiones heredadas', async () => {
      const { d } = legacy(PROF.PRACT_VERIF_VERIFIED, admission('VERIFICADA'));
      expect(
        await d.service.recordExternalLicenseVerification(d.tx as never, {
          authorizationId: 'auth-1',
          practitionerProfileId: 'prac-1',
          identityCaseId: 'c',
          actorUserId: 'sys',
        }),
      ).toBe(false);
    });
  });
});
