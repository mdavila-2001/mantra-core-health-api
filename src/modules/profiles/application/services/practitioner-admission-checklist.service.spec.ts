import { jest } from '@jest/globals';
import { PROF } from '../../profiles.concepts';
import type { ChecklistRequirement, ReviewState } from '../../domain/admissions/admission-checklist';
import {
  PractitionerAdmissionChecklistService,
  NULL,
} from './practitioner-admission-checklist.service';
import {
  JurisdictionAuthorizations,
  PractitionerSpecialties,
  ProfessionalCredentials,
} from '../../entities';

const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
const NOW = new Date('2026-10-29T12:00:00.000Z');

const reviewConcept: Record<ReviewState, string> = {
  PENDING: PROF.ADMISSION_REVIEW_PENDING,
  VERIFIED: PROF.ADMISSION_REVIEW_VERIFIED,
  REJECTED: PROF.ADMISSION_REVIEW_REJECTED,
  INFO_REQUIRED: PROF.ADMISSION_REVIEW_INFO_REQUIRED,
};

const req = (code: string, over: Partial<ChecklistRequirement> = {}): ChecklistRequirement => ({
  id: `req-${code}`,
  code,
  label: code,
  itemType: 'CREDENTIAL',
  itemSubtype: 'DEGREE',
  evidence: 'DOCUMENT',
  required: true,
  requiresSourceUri: true,
  sortOrder: 1,
  ...over,
});

const live = (itemId: string, sha = 'h1', over: Record<string, unknown> = {}) => ({
  itemType: 'CREDENTIAL',
  itemSubtype: 'DEGREE',
  itemId,
  label: itemId,
  fileId: `f-${itemId}`,
  evidenceSha256: sha,
  ...over,
});

const review = (itemId: string, state: ReviewState, sha: string | null, over: Record<string, unknown> = {}) => ({
  id: `rev-${itemId}`,
  admissionId: 'adm-1',
  requirementId: 'req-TIT',
  itemId,
  statusConceptId: reviewConcept[state],
  evidenceSha256: sha,
  reviewedByUserId: state === 'PENDING' ? undefined : 'u-rev',
  reasonText: state === 'REJECTED' ? 'x' : undefined,
  updatedAt: NOW,
  ...over,
});

function build(opts: {
  requirements?: ChecklistRequirement[];
  items?: any[];
  reviews?: any[];
  group?: 'MEDICO' | 'ODONTOLOGO';
}) {
  const requirementsRepo = {
    findActiveByType: fn().mockResolvedValue([]),
  };
  const created: any[] = [];
  const removed: any[] = [];
  const reviewsRepo = {
    findByAdmission: fn().mockResolvedValue(opts.reviews ?? []),
    create: fn((_tx: unknown, data: any) => {
      const row = { id: `new-${data.itemId}`, statusConceptId: PROF.ADMISSION_REVIEW_PENDING, ...data };
      created.push(row);
      return row;
    }),
    remove: fn((_tx: unknown, row: any) => removed.push(row)),
  };
  const evidence = {
    collect: fn().mockResolvedValue({ items: opts.items ?? [], professionGroup: opts.group ?? 'MEDICO' }),
  };
  const service = new PractitionerAdmissionChecklistService(
    requirementsRepo as never,
    reviewsRepo as never,
    evidence as never,
  );
  const reqs = opts.requirements ?? [req('TIT')];
  jest.spyOn(service, 'requirementsOf').mockResolvedValue(reqs);
  const tx = {
    flush: fn().mockResolvedValue(undefined),
    findOne: fn(),
  };
  const admission = { id: 'adm-1', practitionerProfileId: 'prac-1', admissionTypeConceptId: 't' } as never;
  return { service, reviewsRepo, evidence, created, removed, tx, admission };
}

describe('PractitionerAdmissionChecklistService.buildView', () => {
  it('cruza requisitos con lo que hay: un ítem sin revisión es PENDIENTE y sin id', async () => {
    const d = build({ items: [live('c1')] });
    const view = await d.service.buildView(d.tx as never, d.admission);
    const [row] = view.evaluation.rows;
    expect(row.items[0]).toMatchObject({ state: 'PENDING', review: undefined });
    expect(view.evaluation.canVerify).toBe(false);
  });

  it('un obligatorio sin ítems está FALTANTE', async () => {
    const d = build({ items: [] });
    const view = await d.service.buildView(d.tx as never, d.admission);
    expect(view.evaluation.blockers).toEqual([{ requirementCode: 'TIT', label: 'TIT', reason: 'MISSING' }]);
  });

  it('un ítem se asigna a un solo requisito: por clase y por subtipo', async () => {
    const d = build({
      requirements: [req('TIT'), req('DIP', { itemSubtype: 'DIPLOMA', required: false })],
      items: [live('c1'), live('c2', 'h', { itemSubtype: 'DIPLOMA' })],
    });
    const { evaluation } = await d.service.buildView(d.tx as never, d.admission);
    expect(evaluation.rows.map((r) => r.items.map((i) => i.live.itemId))).toEqual([['c1'], ['c2']]);
  });

  it('un requisito sin subtipo acepta cualquiera de su clase', async () => {
    const d = build({
      requirements: [req('ESP', { itemType: 'SPECIALTY', itemSubtype: undefined, required: false })],
      items: [{ itemType: 'SPECIALTY', itemId: 's1', label: 'Cardiología', evidenceSha256: 'x' }],
    });
    const { evaluation } = await d.service.buildView(d.tx as never, d.admission);
    expect(evaluation.rows[0].items).toHaveLength(1);
  });

  it('el requisito del colegio que no aplica a la profesión no entra al checklist', async () => {
    const d = build({
      requirements: [
        req('MED', { itemType: 'LICENSE', itemSubtype: 'PROFESSIONAL_COLLEGE', professionGroup: 'MEDICO' }),
        req('ODO', { itemType: 'LICENSE', itemSubtype: 'PROFESSIONAL_COLLEGE', professionGroup: 'ODONTOLOGO' }),
      ],
      items: [live('l1', 'h', { itemType: 'LICENSE', itemSubtype: 'PROFESSIONAL_COLLEGE' })],
      group: 'ODONTOLOGO',
    });
    const { evaluation } = await d.service.buildView(d.tx as never, d.admission);
    expect(evaluation.rows.map((r) => r.requirement.code)).toEqual(['ODO']);
  });

  it('una verificación sobre un dato/archivo que cambió después deja de valer: vuelve a PENDIENTE', async () => {
    const d = build({
      items: [live('c1', 'NUEVO')],
      reviews: [review('c1', 'VERIFIED', 'VIEJO')],
    });
    const { evaluation } = await d.service.buildView(d.tx as never, d.admission);
    expect(evaluation.rows[0].items[0]).toMatchObject({ state: 'PENDING', evidenceChanged: true });
    expect(evaluation.canVerify).toBe(false);
  });

  it('una revisión sin huella (anterior a la huella) se respeta', async () => {
    const d = build({ items: [live('c1', 'h')], reviews: [review('c1', 'VERIFIED', null)] });
    const { evaluation } = await d.service.buildView(d.tx as never, d.admission);
    expect(evaluation.rows[0].items[0]).toMatchObject({ state: 'VERIFIED', evidenceChanged: false });
  });
});

describe('PractitionerAdmissionChecklistService.materialize', () => {
  it('crea la revisión PENDIENTE de cada ítem nuevo, con su archivo y su huella', async () => {
    const d = build({ items: [live('c1'), live('c2', 'h2')] });
    await d.service.materialize(d.tx as never, d.admission, { actorUserId: 'u' });
    expect(d.created.map((c) => [c.itemId, c.requirementId, c.fileId, c.evidenceSha256])).toEqual([
      ['c1', 'req-TIT', 'f-c1', 'h1'],
      ['c2', 'req-TIT', 'f-c2', 'h2'],
    ]);
    expect(d.tx.flush).toHaveBeenCalled();
  });

  it('es idempotente: no vuelve a crear lo que ya existe', async () => {
    const d = build({ items: [live('c1')], reviews: [review('c1', 'PENDING', 'h1')] });
    await d.service.materialize(d.tx as never, d.admission);
    expect(d.created).toHaveLength(0);
    expect(d.removed).toHaveLength(0);
  });

  it('borra la revisión de un ítem que el médico retiró', async () => {
    const huerfana = review('c9', 'VERIFIED', 'h');
    const d = build({ items: [live('c1')], reviews: [review('c1', 'PENDING', 'h1'), huerfana] });
    await d.service.materialize(d.tx as never, d.admission);
    expect(d.removed).toEqual([huerfana]);
  });

  it('200 ítems se materializan sin perder ninguno', async () => {
    const items = Array.from({ length: 200 }, (_, i) => live(`c${i}`));
    const d = build({ items });
    await d.service.materialize(d.tx as never, d.admission);
    expect(d.created).toHaveLength(200);
  });

  describe('reenvío (D-06: lo que cambió se vuelve a revisar)', () => {
    const entity = { stateConceptId: PROF.CRED_REJECTED, updatedAt: NOW } as Record<string, any>;
    beforeEach(() => {
      entity.stateConceptId = PROF.CRED_REJECTED;
    });

    it('CHANGED: lo rechazado que el médico NO cambió sigue rechazado', async () => {
      const r = review('c1', 'REJECTED', 'h1');
      const d = build({ items: [live('c1', 'h1')], reviews: [r] });
      await d.service.materialize(d.tx as never, d.admission, { reset: 'CHANGED' });
      expect(r.statusConceptId).toBe(reviewConcept.REJECTED);
    });

    it('CHANGED: lo que cambió vuelve a PENDIENTE, con la revisión limpia y la ficha otra vez pendiente', async () => {
      const r = review('c1', 'REJECTED', 'VIEJO');
      const d = build({ items: [live('c1', 'NUEVO')], reviews: [r] });
      d.tx.findOne.mockResolvedValue(entity);
      await d.service.materialize(d.tx as never, d.admission, { reset: 'CHANGED', actorUserId: 'u-doc' });
      expect(r).toMatchObject({
        statusConceptId: reviewConcept.PENDING,
        evidenceSha256: 'NUEVO',
        reasonText: NULL,
        reviewedByUserId: NULL,
      });
      expect(d.tx.findOne).toHaveBeenCalledWith(ProfessionalCredentials, { id: 'c1' });
      expect(entity.stateConceptId).toBe(PROF.CRED_PENDING);
    });

    it('CHANGED: lo verificado y sin cambios se conserva', async () => {
      const r = review('c1', 'VERIFIED', 'h1');
      const d = build({ items: [live('c1', 'h1')], reviews: [r] });
      await d.service.materialize(d.tx as never, d.admission, { reset: 'CHANGED' });
      expect(r.statusConceptId).toBe(reviewConcept.VERIFIED);
    });

    it('CHANGED: la información pedida que se respondió vuelve a PENDIENTE aunque el dato no cambie', async () => {
      const r = review('c1', 'INFO_REQUIRED', 'h1');
      const d = build({ items: [live('c1', 'h1')], reviews: [r] });
      d.tx.findOne.mockResolvedValue(entity);
      await d.service.materialize(d.tx as never, d.admission, { reset: 'CHANGED' });
      expect(r.statusConceptId).toBe(reviewConcept.PENDING);
    });

    it('ALL (renovación tras vencer): todo vuelve a PENDIENTE', async () => {
      const r1 = review('c1', 'VERIFIED', 'h1');
      const r2 = review('c2', 'REJECTED', 'h2');
      const d = build({ items: [live('c1', 'h1'), live('c2', 'h2')], reviews: [r1, r2] });
      d.tx.findOne.mockResolvedValue(entity);
      await d.service.materialize(d.tx as never, d.admission, { reset: 'ALL' });
      expect(r1.statusConceptId).toBe(reviewConcept.PENDING);
      expect(r2.statusConceptId).toBe(reviewConcept.PENDING);
    });

    it('NONE no invalida nada', async () => {
      const r = review('c1', 'VERIFIED', 'VIEJO');
      const d = build({ items: [live('c1', 'NUEVO')], reviews: [r] });
      await d.service.materialize(d.tx as never, d.admission);
      expect(r.statusConceptId).toBe(reviewConcept.VERIFIED);
    });
  });
});

describe('PractitionerAdmissionChecklistService.applyEntityDecision', () => {
  const meta = { actorUserId: 'u-app', at: NOW, sourceRef: 'Registro MINSALUD', reasonText: 'Ilegible' };
  const { service } = build({});

  it('matrícula verificada: AUTH_ACTIVE con quién, cuándo y fuente', async () => {
    const row: Record<string, any> = { stateConceptId: PROF.AUTH_PENDING, updatedAt: NOW };
    const tx = { findOne: fn().mockResolvedValue(row) };
    await service.applyEntityDecision(tx as never, { itemType: 'LICENSE', itemId: 'l1' }, 'VERIFIED', meta);
    expect(tx.findOne).toHaveBeenCalledWith(JurisdictionAuthorizations, { id: 'l1' });
    expect(row).toMatchObject({
      stateConceptId: PROF.AUTH_ACTIVE,
      verifiedByUserId: 'u-app',
      verifiedAt: NOW,
      verificationSourceUri: 'Registro MINSALUD',
      rejectionReasonText: NULL,
    });
  });

  it('matrícula rechazada: AUTH_REJECTED con el motivo', async () => {
    const row: Record<string, any> = { stateConceptId: PROF.AUTH_PENDING, updatedAt: NOW };
    const tx = { findOne: fn().mockResolvedValue(row) };
    await service.applyEntityDecision(tx as never, { itemType: 'LICENSE', itemId: 'l1' }, 'REJECTED', meta);
    expect(row).toMatchObject({ stateConceptId: PROF.AUTH_REJECTED, rejectionReasonText: 'Ilegible' });
  });

  it('título: CRED_VERIFIED / CRED_REJECTED / de vuelta a CRED_PENDING (limpia lo anterior)', async () => {
    const row: Record<string, any> = { stateConceptId: PROF.CRED_PENDING, updatedAt: NOW };
    const tx = { findOne: fn().mockResolvedValue(row) };
    await service.applyEntityDecision(tx as never, { itemType: 'CREDENTIAL', itemId: 'c1' }, 'VERIFIED', meta);
    expect(row.stateConceptId).toBe(PROF.CRED_VERIFIED);
    await service.applyEntityDecision(tx as never, { itemType: 'CREDENTIAL', itemId: 'c1' }, 'REJECTED', meta);
    expect(row).toMatchObject({ stateConceptId: PROF.CRED_REJECTED, rejectionReasonText: 'Ilegible' });
    await service.applyEntityDecision(tx as never, { itemType: 'CREDENTIAL', itemId: 'c1' }, 'PENDING', meta);
    expect(row).toMatchObject({
      stateConceptId: PROF.CRED_PENDING,
      verifiedByUserId: NULL,
      verifiedAt: NULL,
      rejectionReasonText: NULL,
    });
  });

  it('especialidad: las especialidades por fin pasan a SPEC_VERIF_VERIFIED, con su fecha', async () => {
    const row: Record<string, any> = { verificationStatusConceptId: PROF.SPEC_VERIF_PENDING, updatedAt: NOW };
    const tx = { findOne: fn().mockResolvedValue(row) };
    await service.applyEntityDecision(tx as never, { itemType: 'SPECIALTY', itemId: 's1' }, 'VERIFIED', meta);
    expect(tx.findOne).toHaveBeenCalledWith(PractitionerSpecialties, { id: 's1' });
    expect(row).toMatchObject({ verificationStatusConceptId: PROF.SPEC_VERIF_VERIFIED, verifiedAt: NOW });
    await service.applyEntityDecision(tx as never, { itemType: 'SPECIALTY', itemId: 's1' }, 'REJECTED', meta);
    expect(row.verificationStatusConceptId).toBe(PROF.SPEC_VERIF_REJECTED);
  });

  it('un dato del perfil no tiene ficha que proyectar; una ficha inexistente no rompe', async () => {
    const tx = { findOne: fn().mockResolvedValue(null) };
    await expect(
      service.applyEntityDecision(tx as never, { itemType: 'PROFILE', itemId: 'p' }, 'VERIFIED', meta),
    ).resolves.toBeUndefined();
    expect(tx.findOne).not.toHaveBeenCalled();
    await expect(
      service.applyEntityDecision(tx as never, { itemType: 'LICENSE', itemId: 'gone' }, 'VERIFIED', meta),
    ).resolves.toBeUndefined();
  });
});
