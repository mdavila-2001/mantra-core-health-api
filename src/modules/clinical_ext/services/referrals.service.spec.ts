import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ReferralsService } from './referrals.service';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { CEXT } from '../clinical_ext.concepts';
import { ReferralErrorReason } from '../clinical_ext.error-reasons';
import { CONS } from '../../consent/consent.concepts';
import { TreatmentInformedConsents } from '../../consent/entities';
import { Branches } from '../../directory/entities';
import { ForbiddenException } from '@nestjs/common';

const actor = { id: 'md-1', roles: ['USER'] } as any;

/** Derivación tipada mínima válida (v4263). */
const typed = {
  patientProfileId: 'p1',
  referralType: 'THERAPY',
  targetExternalName: 'Centro de Fisioterapia San Martín',
  requestedServiceText: 'Fisioterapia de rodilla, 10 sesiones',
  clinicalSummary: 'Gonartrosis grado II, dolor mecánico',
};

/**
 * Espera un error con el `reason` estable y el status dados.
 *
 * @param p - Promesa que debe fallar.
 * @param status - Código HTTP.
 * @param reason - Sub-código estable.
 */
async function expectReason(
  p: Promise<unknown>,
  status: number,
  reason: ReferralErrorReason,
) {
  await expect(p).rejects.toMatchObject({ status, reason });
}

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx: any = {
    flush: mockFn().mockResolvedValue(undefined),
    findOne: mockFn().mockResolvedValue(null),
    find: mockFn().mockResolvedValue([]),
  };
  const em: any = { transactional: mockFn((cb: any) => cb(tx)) };
  em.fork = mockFn(() => tx);
  const referralsRepo = {
    findById: mockFn(),
    findByPatient: mockFn(() => Promise.resolve([])),
    findDuplicate: mockFn(),
    create: mockFn(),
  };
  const accountLinksRepo = {
    findActiveByUser: mockFn(() => Promise.resolve(null)),
  };
  const patientProfilesRepo = { findById: mockFn() };
  const clinicalRead = {
    assertCanReadHistory: mockFn(() => Promise.resolve()),
    assertCanWriteHistory: mockFn(() => Promise.resolve()),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new ReferralsService(
    em as any,
    referralsRepo,
    accountLinksRepo as any,
    patientProfilesRepo as any,
    clinicalRead as any,
    logger as any,
  );
  return {
    service,
    tx,
    referralsRepo,
    accountLinksRepo,
    patientProfilesRepo,
    clinicalRead,
  };
}

describe('ReferralsService', () => {
  describe('create (UC-18-07)', () => {
    it('emits a requested referral', async () => {
      const d = build();
      d.referralsRepo.findDuplicate.mockResolvedValue(null);
      d.referralsRepo.create.mockReturnValue({
        id: 'ref1',
        patientProfileId: 'p1',
        statusConceptId: CEXT.REFERRAL_REQUESTED,
        createdAt: new Date(),
      });
      const res = await d.service.create({ patientProfileId: 'p1' }, actor);
      expect(res.statusConceptId).toBe(CEXT.REFERRAL_REQUESTED);
    });

    it('rejects a duplicated referral (conflict)', async () => {
      const d = build();
      d.referralsRepo.findDuplicate.mockResolvedValue({ id: 'ref0' });
      await expect(
        d.service.create(
          {
            patientProfileId: 'p1',
            sourceEncounterId: 'e1',
            targetProfileId: 't1',
            specialtyConceptId: 's1',
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('respond (UC-18-08)', () => {
    it('accepts a requested referral', async () => {
      const d = build();
      const referral = {
        id: 'ref1',
        statusConceptId: CEXT.REFERRAL_REQUESTED,
        updatedAt: new Date(),
      };
      d.referralsRepo.findById.mockResolvedValue(referral);
      const res = await d.service.respond(
        'ref1',
        { decision: 'ACCEPT' } as any,
        actor,
      );
      expect(res).toMatchObject({ ok: true, id: 'ref1', status: 'ACCEPTED' });
      expect(referral.statusConceptId).toBe(CEXT.REFERRAL_ACCEPTED);
    });

    it('throws when the referral is missing', async () => {
      const d = build();
      d.referralsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.respond(
          'ref1',
          { decision: 'REJECT', rejectReason: 'Sin cupo' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects responding to a non-requested referral (precondition)', async () => {
      const d = build();
      d.referralsRepo.findById.mockResolvedValue({
        id: 'ref1',
        statusConceptId: CEXT.REFERRAL_ACCEPTED,
      });
      await expect(
        d.service.respond('ref1', { decision: 'ACCEPT' } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('listMine (CV-10)', () => {
    it('returns an empty list when the account has no linked person', async () => {
      const d = build();
      d.accountLinksRepo.findActiveByUser.mockResolvedValue(null);
      const res = await d.service.listMine(actor);
      expect(res).toEqual([]);
      expect(d.referralsRepo.findByPatient).not.toHaveBeenCalled();
    });

    it('returns an empty list when the person has no patient profile', async () => {
      const d = build();
      d.accountLinksRepo.findActiveByUser.mockResolvedValue({
        personId: 'person-1',
      });
      d.patientProfilesRepo.findById.mockResolvedValue(null);
      const res = await d.service.listMine(actor);
      expect(res).toEqual([]);
    });

    it('resolves the patient from the account, never from a caller-supplied id', async () => {
      const d = build();
      d.accountLinksRepo.findActiveByUser.mockResolvedValue({
        personId: 'person-1',
      });
      d.patientProfilesRepo.findById.mockResolvedValue({ profileId: 'pp-own' });
      d.referralsRepo.findByPatient.mockResolvedValue([{ id: 'r1' }]);
      const res = await d.service.listMine(actor);
      expect(d.referralsRepo.findByPatient).toHaveBeenCalledWith(
        expect.anything(),
        'pp-own',
        50,
      );
      expect(res).toHaveLength(1);
      expect(res[0]).toMatchObject({ id: 'r1' });
    });
  });

  describe('derivación tipada (v4263)', () => {
    it('creates a typed referral to an external destination with all fields', async () => {
      const d = build();
      d.referralsRepo.create.mockImplementation((_tx: any, data: any) => ({
        id: 'ref1',
        createdAt: new Date(),
        ...data,
      }));
      const res = await d.service.create(
        { ...typed, diagnosisText: 'M17.1', treatmentGivenText: 'AINE' } as any,
        actor,
      );
      expect(d.referralsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          referralType: 'THERAPY',
          targetExternalName: 'Centro de Fisioterapia San Martín',
          requestedServiceText: 'Fisioterapia de rodilla, 10 sesiones',
          clinicalSummary: 'Gonartrosis grado II, dolor mecánico',
          statusConceptId: CEXT.REFERRAL_REQUESTED,
        }),
      );
      expect(res).toMatchObject({
        status: 'PENDING',
        referralType: 'THERAPY',
        diagnosisText: 'M17.1',
      });
    });

    it('requires at least one destination', async () => {
      const d = build();
      await expectReason(
        d.service.create(
          { ...typed, targetExternalName: undefined } as any,
          actor,
        ),
        400,
        ReferralErrorReason.REFERRAL_TARGET_REQUIRED,
      );
      expect(d.referralsRepo.create).not.toHaveBeenCalled();
    });

    it('requires clinical summary and requested service', async () => {
      const d = build();
      await expect(
        d.service.create(
          {
            ...typed,
            clinicalSummary: ' ',
            requestedServiceText: undefined,
          } as any,
          actor,
        ),
      ).rejects.toMatchObject({
        status: 400,
        reason: ReferralErrorReason.REFERRAL_SERVICE_INFORMATION_INCOMPLETE,
        details: { fields: ['clinicalSummary', 'requestedServiceText'] },
      });
    });

    it('keeps legacy referrals (no referralType) working without the new rules', async () => {
      const d = build();
      d.referralsRepo.create.mockReturnValue({
        id: 'ref1',
        patientProfileId: 'p1',
        statusConceptId: CEXT.REFERRAL_REQUESTED,
        createdAt: new Date(),
      });
      const res = await d.service.create({ patientProfileId: 'p1' }, actor);
      expect(res.status).toBe('PENDING');
    });

    it('404 when the target branch does not exist', async () => {
      const d = build();
      d.tx.findOne.mockResolvedValue(null);
      await expectReason(
        d.service.create({ ...typed, targetBranchId: 'br-x' } as any, actor),
        404,
        ReferralErrorReason.REFERRAL_TARGET_BRANCH_NOT_FOUND,
      );
      expect(d.tx.findOne).toHaveBeenCalledWith(Branches, { id: 'br-x' });
    });

    describe('informedConsentId', () => {
      const consent = (over: Record<string, unknown> = {}) => ({
        id: 'c1',
        patientProfileId: 'p1',
        decisionConceptId: CONS.DECISION_ACCEPTED,
        ...over,
      });

      it('accepts an ACCEPTED, active consent of the same patient', async () => {
        const d = build();
        d.tx.findOne.mockResolvedValue(consent());
        d.referralsRepo.create.mockImplementation((_tx: any, data: any) => ({
          id: 'ref1',
          createdAt: new Date(),
          ...data,
        }));
        const res = await d.service.create(
          { ...typed, informedConsentId: 'c1' } as any,
          actor,
        );
        expect(d.tx.findOne).toHaveBeenCalledWith(TreatmentInformedConsents, {
          id: 'c1',
        });
        expect(res.informedConsentId).toBe('c1');
      });

      it('404 when the consent does not exist', async () => {
        const d = build();
        d.tx.findOne.mockResolvedValue(null);
        await expectReason(
          d.service.create({ ...typed, informedConsentId: 'c1' } as any, actor),
          404,
          ReferralErrorReason.REFERRAL_CONSENT_NOT_FOUND,
        );
      });

      it('400 when the consent is of another patient', async () => {
        const d = build();
        d.tx.findOne.mockResolvedValue(consent({ patientProfileId: 'p2' }));
        await expectReason(
          d.service.create({ ...typed, informedConsentId: 'c1' } as any, actor),
          400,
          ReferralErrorReason.REFERRAL_CONSENT_PATIENT_MISMATCH,
        );
        expect(d.referralsRepo.create).not.toHaveBeenCalled();
      });

      it('422 when the consent was declined', async () => {
        const d = build();
        d.tx.findOne.mockResolvedValue(
          consent({ decisionConceptId: CONS.DECISION_DECLINED }),
        );
        await expectReason(
          d.service.create({ ...typed, informedConsentId: 'c1' } as any, actor),
          422,
          ReferralErrorReason.REFERRAL_CONSENT_NOT_ACCEPTED,
        );
      });

      it('422 when the consent was withdrawn', async () => {
        const d = build();
        d.tx.findOne.mockResolvedValue(consent({ withdrawnAt: new Date() }));
        await expectReason(
          d.service.create({ ...typed, informedConsentId: 'c1' } as any, actor),
          422,
          ReferralErrorReason.REFERRAL_CONSENT_WITHDRAWN,
        );
      });
    });
  });

  describe('respond con motivo de rechazo (v4263)', () => {
    it('400 when rejecting without a reason', async () => {
      const d = build();
      await expectReason(
        d.service.respond('ref1', { decision: 'REJECT' } as any, actor),
        400,
        ReferralErrorReason.REFERRAL_REJECT_REASON_REQUIRED,
      );
      expect(d.referralsRepo.findById).not.toHaveBeenCalled();
    });

    it('stores the reject reason', async () => {
      const d = build();
      const referral: any = {
        id: 'ref1',
        statusConceptId: CEXT.REFERRAL_REQUESTED,
      };
      d.referralsRepo.findById.mockResolvedValue(referral);
      const res = await d.service.respond(
        'ref1',
        { decision: 'REJECT', rejectReason: 'Sin cupo este mes' },
        actor,
      );
      expect(referral.rejectReason).toBe('Sin cupo este mes');
      expect(res).toMatchObject({
        status: 'REJECTED',
        rejectReason: 'Sin cupo este mes',
      });
    });
  });

  describe('get', () => {
    it('lets the destination practitioner read without history access', async () => {
      const d = build();
      d.referralsRepo.findById.mockResolvedValue({
        id: 'ref1',
        patientProfileId: 'p1',
        targetProfileId: 'hp-9',
        statusConceptId: CEXT.REFERRAL_REQUESTED,
      });
      const res = await d.service.get('ref1', {
        id: 'u9',
        roles: ['CLINICIAN'],
        practitionerProfileId: 'hp-9',
      } as any);
      expect(d.clinicalRead.assertCanReadHistory).not.toHaveBeenCalled();
      expect(res.id).toBe('ref1');
    });

    it('otherwise requires read access to the history', async () => {
      const d = build();
      d.referralsRepo.findById.mockResolvedValue({
        id: 'ref1',
        patientProfileId: 'p1',
        targetTenantId: 'ten-dest',
        statusConceptId: CEXT.REFERRAL_REQUESTED,
      });
      d.clinicalRead.assertCanReadHistory.mockRejectedValue(
        new ForbiddenException(),
      );
      await expect(
        d.service.get('ref1', {
          id: 'u1',
          roles: ['CLINICIAN'],
          tenantIds: ['other'],
        } as any),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('resolves the target branch and tenant names', async () => {
      const d = build();
      d.referralsRepo.findById.mockResolvedValue({
        id: 'ref1',
        patientProfileId: 'p1',
        targetBranchId: 'br1',
        targetTenantId: 'ten1',
        statusConceptId: CEXT.REFERRAL_ACCEPTED,
      });
      d.tx.find.mockImplementation((entity: any) =>
        Promise.resolve(
          entity === Branches
            ? [{ id: 'br1', name: 'Sede Equipetrol' }]
            : [
                {
                  id: 'ten1',
                  legalName: 'Clínica SRL',
                  tradeName: 'Clínica Norte',
                },
              ],
        ),
      );
      const res = await d.service.get('ref1', actor);
      expect(res).toMatchObject({
        status: 'ACCEPTED',
        targetBranchName: 'Sede Equipetrol',
        targetTenantName: 'Clínica Norte',
      });
    });

    it('404 with a stable reason', async () => {
      const d = build();
      d.referralsRepo.findById.mockResolvedValue(null);
      await expectReason(
        d.service.get('ref1', actor),
        404,
        ReferralErrorReason.REFERRAL_NOT_FOUND,
      );
    });
  });

  describe('counter-referral', () => {
    it('the destination tenant closes an accepted referral', async () => {
      const d = build();
      const referral: any = {
        id: 'ref1',
        patientProfileId: 'p1',
        targetTenantId: 'ten-dest',
        statusConceptId: CEXT.REFERRAL_ACCEPTED,
      };
      d.referralsRepo.findById.mockResolvedValue(referral);
      const res = await d.service.counterReferral(
        'ref1',
        { counterReferralText: 'Completó 10 sesiones, alta' },
        { id: 'u2', roles: ['CLINICIAN'], tenantIds: ['ten-dest'] } as any,
      );
      expect(referral.statusConceptId).toBe(CEXT.REFERRAL_COMPLETED);
      expect(referral.counterReferralAt).toBeInstanceOf(Date);
      expect(res).toMatchObject({
        status: 'COMPLETED',
        counterReferralText: 'Completó 10 sesiones, alta',
      });
    });

    it('the destination branch tenant may record it', async () => {
      const d = build();
      d.referralsRepo.findById.mockResolvedValue({
        id: 'ref1',
        patientProfileId: 'p1',
        targetBranchId: 'br1',
        statusConceptId: CEXT.REFERRAL_ACCEPTED,
      });
      d.tx.findOne.mockResolvedValue({ id: 'br1', tenantId: 'ten-br' });
      const res = await d.service.counterReferral(
        'ref1',
        { counterReferralText: 'ok' },
        { id: 'u2', roles: ['CLINICIAN'], tenantIds: ['ten-br'] } as any,
      );
      expect(res.status).toBe('COMPLETED');
    });

    it('403 for someone who is not the destination', async () => {
      const d = build();
      d.referralsRepo.findById.mockResolvedValue({
        id: 'ref1',
        patientProfileId: 'p1',
        targetProfileId: 'hp-9',
        statusConceptId: CEXT.REFERRAL_ACCEPTED,
      });
      await expectReason(
        d.service.counterReferral('ref1', { counterReferralText: 'x' }, {
          id: 'u1',
          roles: ['CLINICIAN'],
          practitionerProfileId: 'hp-1',
        } as any),
        403,
        ReferralErrorReason.REFERRAL_COUNTER_REFERRAL_FORBIDDEN,
      );
    });

    it('external-only destination: transcribed by who can write the history, even while pending', async () => {
      const d = build();
      d.referralsRepo.findById.mockResolvedValue({
        id: 'ref1',
        patientProfileId: 'p1',
        targetExternalName: 'Dr. Externo',
        statusConceptId: CEXT.REFERRAL_REQUESTED,
      });
      const res = await d.service.counterReferral(
        'ref1',
        { counterReferralText: 'Informe en papel' },
        actor,
      );
      expect(d.clinicalRead.assertCanWriteHistory).toHaveBeenCalledWith(
        'p1',
        actor,
      );
      expect(res.status).toBe('COMPLETED');
    });

    it('422 when the referral is not accepted', async () => {
      const d = build();
      d.referralsRepo.findById.mockResolvedValue({
        id: 'ref1',
        patientProfileId: 'p1',
        targetTenantId: 'ten-dest',
        statusConceptId: CEXT.REFERRAL_REQUESTED,
      });
      await expectReason(
        d.service.counterReferral('ref1', { counterReferralText: 'x' }, {
          id: 'u2',
          roles: ['CLINICIAN'],
          tenantIds: ['ten-dest'],
        } as any),
        422,
        ReferralErrorReason.REFERRAL_COUNTER_REFERRAL_NOT_ALLOWED,
      );
    });
  });

  describe('cancel', () => {
    it('cancels a pending referral after checking write access', async () => {
      const d = build();
      const referral: any = {
        id: 'ref1',
        patientProfileId: 'p1',
        statusConceptId: CEXT.REFERRAL_REQUESTED,
      };
      d.referralsRepo.findById.mockResolvedValue(referral);
      const res = await d.service.cancel('ref1', actor);
      expect(d.clinicalRead.assertCanWriteHistory).toHaveBeenCalledWith(
        'p1',
        actor,
      );
      expect(res.status).toBe('CANCELLED');
    });

    it('422 when already closed', async () => {
      const d = build();
      d.referralsRepo.findById.mockResolvedValue({
        id: 'ref1',
        patientProfileId: 'p1',
        statusConceptId: CEXT.REFERRAL_COMPLETED,
      });
      await expectReason(
        d.service.cancel('ref1', actor),
        422,
        ReferralErrorReason.REFERRAL_ALREADY_CLOSED,
      );
    });
  });
});
