import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ForbiddenException } from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import {
  ConflictException,
  DomainException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { CEXT } from '../clinical_ext.concepts';
import { ClinicalExtErrorReason } from '../clinical_ext.error-reasons';
import { ACTIVE_TENANT, inTenant, thrown } from './clinical-ext-tenant.testing';

const actor = {
  id: 'md-1',
  roles: ['PRACTITIONER'],
  practitionerProfileId: 'pr-dest',
} as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = {
    flush: mockFn().mockResolvedValue(undefined),
    execute: mockFn().mockResolvedValue(undefined),
  };
  const em: any = { transactional: mockFn((cb: any) => cb(tx)) };
  em.fork = mockFn(() => em);
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
    assertCanReadHistory: mockFn().mockResolvedValue(undefined),
    assertCanWriteHistory: mockFn().mockResolvedValue(undefined),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const raw = new ReferralsService(
    em as any,
    referralsRepo,
    accountLinksRepo as any,
    patientProfilesRepo as any,
    clinicalRead as any,
    logger as any,
  );
  return {
    service: inTenant(raw),
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
        patientProfileId: 'p1',
        targetProfileId: 'pr-dest',
        statusConceptId: CEXT.REFERRAL_REQUESTED,
        updatedAt: new Date(),
      };
      d.referralsRepo.findById.mockResolvedValue(referral);
      const res = await d.service.respond(
        'ref1',
        { decision: 'ACCEPT' } as any,
        actor,
      );
      expect(res).toEqual({ ok: true });
      expect(referral.statusConceptId).toBe(CEXT.REFERRAL_ACCEPTED);
    });

    it('throws when the referral is missing', async () => {
      const d = build();
      d.referralsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.respond('ref1', { decision: 'REJECT' } as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects responding to a non-requested referral (precondition)', async () => {
      const d = build();
      d.referralsRepo.findById.mockResolvedValue({
        id: 'ref1',
        targetProfileId: 'pr-dest',
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
      expect(res).toEqual([{ id: 'r1' }]);
    });
  });

  describe('autorización clínica (CE-01)', () => {
    const requested = (extra: object = {}) => ({
      id: 'ref1',
      patientProfileId: 'p1',
      statusConceptId: CEXT.REFERRAL_REQUESTED,
      updatedAt: new Date(),
      ...extra,
    });

    it('create exige escritura sobre el paciente y no persiste si se niega', async () => {
      const d = build();
      d.clinicalRead.assertCanWriteHistory.mockRejectedValue(
        new ForbiddenException('sin acceso'),
      );
      await expect(
        d.service.create({ patientProfileId: 'p-ajeno' } as any, actor),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(d.clinicalRead.assertCanWriteHistory).toHaveBeenCalledWith(
        'p-ajeno',
        actor,
      );
      expect(d.referralsRepo.create).not.toHaveBeenCalled();
    });

    it('create serializa la clave lógica antes de buscar el duplicado', async () => {
      const d = build();
      d.referralsRepo.findDuplicate.mockResolvedValue(null);
      d.referralsRepo.create.mockReturnValue({
        id: 'ref1',
        patientProfileId: 'p1',
        statusConceptId: CEXT.REFERRAL_REQUESTED,
        createdAt: new Date(),
      });
      await d.service.create(
        {
          patientProfileId: 'p1',
          sourceEncounterId: 'e1',
          targetProfileId: 't1',
          specialtyConceptId: 's1',
        } as any,
        actor,
      );
      expect(d.tx.execute).toHaveBeenCalledTimes(1);
      expect(d.tx.execute.mock.invocationCallOrder[0]).toBeLessThan(
        d.referralsRepo.findDuplicate.mock.invocationCallOrder[0],
      );
    });

    it('create: el duplicado lleva reason catalogado', async () => {
      const d = build();
      d.referralsRepo.findDuplicate.mockResolvedValue({ id: 'ref0' });
      const err = await thrown(
        d.service.create(
          {
            patientProfileId: 'p1',
            sourceEncounterId: 'e1',
            targetProfileId: 't1',
            specialtyConceptId: 's1',
          } as any,
          actor,
        ),
      );
      expect(err.reason).toBe(ClinicalExtErrorReason.REFERRAL_ALREADY_EXISTS);
    });

    it('respond: el profesional destino responde', async () => {
      const d = build();
      const referral = requested({ targetProfileId: 'pr-dest' });
      d.referralsRepo.findById.mockResolvedValue(referral);
      await d.service.respond('ref1', { decision: 'REJECT' } as any, actor);
      expect(referral.statusConceptId).toBe(CEXT.REFERRAL_REJECTED);
    });

    it('respond: sin profesional concreto basta el tenant destino', async () => {
      const d = build();
      const referral = requested({ targetTenantId: ACTIVE_TENANT });
      d.referralsRepo.findById.mockResolvedValue(referral);
      await d.service.respond('ref1', { decision: 'ACCEPT' } as any, {
        ...actor,
        practitionerProfileId: 'otro',
      });
      expect(referral.statusConceptId).toBe(CEXT.REFERRAL_ACCEPTED);
    });

    it.each([
      ['otro profesional', { targetProfileId: 'pr-otro' }],
      ['tenant destino ajeno', { targetTenantId: 'ten-ajeno' }],
      [
        'profesional correcto pero tenant destino ajeno',
        { targetProfileId: 'pr-dest', targetTenantId: 'ten-ajeno' },
      ],
      ['sin destino alguno', {}],
    ])(
      'respond: %s responde 404 idéntico a inexistente y no cambia el estado',
      async (_label, target) => {
        const d = build();
        d.referralsRepo.findById.mockResolvedValue(null);
        const missing = await thrown(
          d.service.respond('ref1', { decision: 'ACCEPT' } as any, actor),
        );
        const referral = requested(target);
        d.referralsRepo.findById.mockResolvedValue(referral);
        const foreign = await thrown(
          d.service.respond('ref1', { decision: 'ACCEPT' } as any, actor),
        );
        expect(foreign).toBeInstanceOf(ResourceNotFoundException);
        expect(foreign.getResponse()).toEqual(missing.getResponse());
        expect(foreign.reason).toBe(ClinicalExtErrorReason.REFERRAL_NOT_FOUND);
        expect(foreign.details).toBeUndefined();
        expect(referral.statusConceptId).toBe(CEXT.REFERRAL_REQUESTED);
      },
    );

    it('listByPatient exige lectura de la historia antes de consultar', async () => {
      const d = build();
      d.clinicalRead.assertCanReadHistory.mockRejectedValue(
        new ForbiddenException('sin acceso'),
      );
      await expect(
        d.service.listByPatient('p-ajeno', actor),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(d.referralsRepo.findByPatient).not.toHaveBeenCalled();
    });

    it('listByPatient devuelve las filas del paciente autorizado', async () => {
      const d = build();
      d.referralsRepo.findByPatient.mockResolvedValue([{ id: 'r1' }]);
      const res = await d.service.listByPatient('p1', actor);
      expect(d.clinicalRead.assertCanReadHistory).toHaveBeenCalledWith(
        'p1',
        actor,
      );
      expect(res).toEqual([{ id: 'r1' }]);
    });
  });
});
