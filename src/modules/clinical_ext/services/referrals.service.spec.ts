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
import { Branches } from '../../directory/entities';

const actor = { id: 'md-1', roles: ['USER'] } as any;
/** Destinatario de la referencia: profesional con su perfil en el token. */
const destActor = {
  id: 'md-1',
  roles: ['PRACTITIONER'],
  practitionerProfileId: 'pr-dest',
} as any;
/** Un profesional de la organización del encuentro, con su perfil en el token. */
const doctor = {
  id: 'md-1',
  roles: ['PRACTITIONER'],
  practitionerProfileId: 'hp-1',
  tenantIds: ['t-1'],
} as any;

/** Derivación tipada mínima válida (v4266). */
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
  reason: ClinicalExtErrorReason,
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
    execute: mockFn().mockResolvedValue(undefined),
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
    assertCanReadHistory: mockFn().mockResolvedValue(undefined),
    assertCanWriteHistory: mockFn().mockResolvedValue(undefined),
  };
  const encountersRepo = { findById: mockFn() };
  const notifier = { notifyRecommended: mockFn(() => Promise.resolve(true)) };
  const practitionersRepo = {
    findById: mockFn(() => Promise.resolve({ profileId: 'hp-2' })),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const raw = new ReferralsService(
    em as any,
    referralsRepo,
    accountLinksRepo as any,
    patientProfilesRepo as any,
    clinicalRead as any,
    encountersRepo as any,
    notifier as any,
    practitionersRepo as any,
    logger as any,
  );
  return {
    service: inTenant(raw),
    tx,
    referralsRepo,
    accountLinksRepo,
    patientProfilesRepo,
    clinicalRead,
    encountersRepo,
    notifier,
    practitionersRepo,
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
      d.encountersRepo.findById.mockResolvedValue({
        id: 'e1',
        patientProfileId: 'p1',
        tenantId: 't-1',
      });
      d.referralsRepo.findDuplicate.mockResolvedValue({ id: 'ref0' });
      await expect(
        d.service.create(
          {
            patientProfileId: 'p1',
            sourceEncounterId: 'e1',
            targetProfileId: 't1',
            specialtyConceptId: 's1',
          } as any,
          doctor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(d.notifier.notifyRecommended).not.toHaveBeenCalled();
    });

    /**
     * Derivar avisa a la paciente (pedido del propietario, 24/10/2026). El
     * aviso sólo sale si hay un encuentro verificado: sin él no hay relación
     * asistencial demostrada y «su médico le recomienda…» podría mandárselo
     * cualquiera a cualquiera.
     */
    describe('el aviso a la paciente', () => {
      const created = {
        id: 'ref1',
        patientProfileId: 'p1',
        statusConceptId: CEXT.REFERRAL_REQUESTED,
        createdAt: new Date(),
      };
      const encounter = { id: 'e1', patientProfileId: 'p1', tenantId: 't-1' };

      it('con encuentro verificado y profesional destino, avisa DESPUÉS de crear', async () => {
        const d = build();
        d.encountersRepo.findById.mockResolvedValue(encounter);
        d.referralsRepo.findDuplicate.mockResolvedValue(null);
        d.referralsRepo.create.mockReturnValue(created);

        await d.service.create(
          {
            patientProfileId: 'p1',
            sourceEncounterId: 'e1',
            targetProfileId: 't9',
          } as any,
          doctor,
        );

        expect(d.notifier.notifyRecommended).toHaveBeenCalledWith('ref1');
      });

      it('sin encuentro NO avisa: no hay relación asistencial demostrada', async () => {
        const d = build();
        d.referralsRepo.create.mockReturnValue(created);

        await d.service.create(
          { patientProfileId: 'p1', targetProfileId: 't9' } as any,
          doctor,
        );

        expect(d.referralsRepo.create).toHaveBeenCalled();
        expect(d.notifier.notifyRecommended).not.toHaveBeenCalled();
      });

      it('sin profesional destino NO avisa: no hay a quién recomendar', async () => {
        const d = build();
        d.encountersRepo.findById.mockResolvedValue(encounter);
        d.referralsRepo.create.mockReturnValue(created);

        await d.service.create(
          { patientProfileId: 'p1', sourceEncounterId: 'e1' } as any,
          doctor,
        );

        expect(d.notifier.notifyRecommended).not.toHaveBeenCalled();
      });
    });

    describe('quién deriva y sobre qué encuentro', () => {
      it('un encuentro de OTRO paciente responde 404 y no crea nada ni avisa', async () => {
        const d = build();
        d.encountersRepo.findById.mockResolvedValue({
          id: 'e1',
          patientProfileId: 'otro-paciente',
          tenantId: 't-1',
        });

        await expect(
          d.service.create(
            {
              patientProfileId: 'p1',
              sourceEncounterId: 'e1',
              targetProfileId: 't9',
            } as any,
            doctor,
          ),
        ).rejects.toBeInstanceOf(ResourceNotFoundException);
        expect(d.referralsRepo.create).not.toHaveBeenCalled();
        expect(d.notifier.notifyRecommended).not.toHaveBeenCalled();
      });

      it('un encuentro de OTRA organización responde 404, igual que uno inexistente', async () => {
        const d = build();
        d.encountersRepo.findById.mockResolvedValue({
          id: 'e1',
          patientProfileId: 'p1',
          tenantId: 'otra-organizacion',
        });

        await expect(
          d.service.create(
            {
              patientProfileId: 'p1',
              sourceEncounterId: 'e1',
              targetProfileId: 't9',
            } as any,
            doctor,
          ),
        ).rejects.toBeInstanceOf(ResourceNotFoundException);

        d.encountersRepo.findById.mockResolvedValue(null);
        await expect(
          d.service.create(
            {
              patientProfileId: 'p1',
              sourceEncounterId: 'e2',
              targetProfileId: 't9',
            } as any,
            doctor,
          ),
        ).rejects.toBeInstanceOf(ResourceNotFoundException);
      });

      it('quien deriva sale del token, no del cuerpo que manda el cliente', async () => {
        const d = build();
        d.referralsRepo.create.mockReturnValue({
          id: 'ref1',
          patientProfileId: 'p1',
          statusConceptId: CEXT.REFERRAL_REQUESTED,
          createdAt: new Date(),
        });

        await d.service.create(
          { patientProfileId: 'p1', referringProfileId: 'falsificado' } as any,
          doctor,
        );

        expect(d.referralsRepo.create.mock.calls[0][1].referringProfileId).toBe(
          'hp-1',
        );
      });

      it('sin perfil profesional en el token, el cuerpo no puede poner quién deriva', async () => {
        const d = build();
        d.referralsRepo.create.mockReturnValue({
          id: 'ref1',
          patientProfileId: 'p1',
          statusConceptId: CEXT.REFERRAL_REQUESTED,
          createdAt: new Date(),
        });

        await d.service.create(
          { patientProfileId: 'p1', referringProfileId: 'falsificado' } as any,
          actor,
        );

        expect(
          d.referralsRepo.create.mock.calls[0][1].referringProfileId,
        ).toBeUndefined();
      });

      it('un destino que no es un perfil profesional responde 404 y no crea nada', async () => {
        const d = build();
        d.practitionersRepo.findById.mockResolvedValue(null);

        await expect(
          d.service.create(
            { patientProfileId: 'p1', targetProfileId: 'no-existe' } as any,
            doctor,
          ),
        ).rejects.toBeInstanceOf(ResourceNotFoundException);
        expect(d.referralsRepo.create).not.toHaveBeenCalled();
        expect(d.notifier.notifyRecommended).not.toHaveBeenCalled();
      });
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
        destActor,
      );
      // v4266: además del `ok`, la derivación actualizada.
      expect(res).toMatchObject({ ok: true, id: 'ref1', status: 'ACCEPTED' });
      expect(referral.statusConceptId).toBe(CEXT.REFERRAL_ACCEPTED);
    });

    it('throws when the referral is missing', async () => {
      const d = build();
      d.referralsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.respond(
          'ref1',
          // v4266: REJECT exige motivo (sin él, 400 antes de buscar).
          { decision: 'REJECT', rejectReason: 'Sin cupo' } as any,
          destActor,
        ),
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
        d.service.respond('ref1', { decision: 'ACCEPT' } as any, destActor),
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
      // v4266: la respuesta es la proyección pública de cada fila.
      expect(res).toHaveLength(1);
      expect(res[0]).toMatchObject({ id: 'r1' });
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
      d.encountersRepo.findById.mockResolvedValue({
        id: 'e1',
        patientProfileId: 'p1',
        tenantId: 't-1',
      });
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
        doctor,
      );
      expect(d.tx.execute).toHaveBeenCalledTimes(1);
      expect(d.tx.execute.mock.invocationCallOrder[0]).toBeLessThan(
        d.referralsRepo.findDuplicate.mock.invocationCallOrder[0],
      );
    });

    it('create: el duplicado lleva reason catalogado', async () => {
      const d = build();
      d.encountersRepo.findById.mockResolvedValue({
        id: 'e1',
        patientProfileId: 'p1',
        tenantId: 't-1',
      });
      d.referralsRepo.findDuplicate.mockResolvedValue({ id: 'ref0' });
      const err = await thrown(
        d.service.create(
          {
            patientProfileId: 'p1',
            sourceEncounterId: 'e1',
            targetProfileId: 't1',
            specialtyConceptId: 's1',
          } as any,
          doctor,
        ),
      );
      expect(err.reason).toBe(ClinicalExtErrorReason.REFERRAL_ALREADY_EXISTS);
    });

    it('respond: el profesional destino responde', async () => {
      const d = build();
      const referral = requested({ targetProfileId: 'pr-dest' });
      d.referralsRepo.findById.mockResolvedValue(referral);
      await d.service.respond(
        'ref1',
        { decision: 'REJECT', rejectReason: 'Sin cupo' } as any,
        destActor,
      );
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
          d.service.respond('ref1', { decision: 'ACCEPT' } as any, destActor),
        );
        const referral = requested(target);
        d.referralsRepo.findById.mockResolvedValue(referral);
        const foreign = await thrown(
          d.service.respond('ref1', { decision: 'ACCEPT' } as any, destActor),
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
      expect(res).toHaveLength(1);
      expect(res[0]).toMatchObject({ id: 'r1' });
    });
  });

  describe('derivación tipada (v4266)', () => {
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
        ClinicalExtErrorReason.REFERRAL_TARGET_REQUIRED,
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
        reason: ClinicalExtErrorReason.REFERRAL_SERVICE_INFORMATION_INCOMPLETE,
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
        ClinicalExtErrorReason.REFERRAL_TARGET_BRANCH_NOT_FOUND,
      );
      expect(d.tx.findOne).toHaveBeenCalledWith(Branches, { id: 'br-x' });
    });

    it('rejects informedConsentId: the link is written by the consent', async () => {
      const d = build();
      await expectReason(
        d.service.create({ ...typed, informedConsentId: 'c1' } as any, actor),
        400,
        ClinicalExtErrorReason.REFERRAL_CONSENT_LINK_NOT_ALLOWED,
      );
      expect(d.clinicalRead.assertCanWriteHistory).not.toHaveBeenCalled();
      expect(d.referralsRepo.create).not.toHaveBeenCalled();
    });

    it('requires write access to the patient history', async () => {
      const d = build();
      d.clinicalRead.assertCanWriteHistory.mockRejectedValue(
        new ForbiddenException(),
      );
      await expect(
        d.service.create(typed as any, actor),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(d.clinicalRead.assertCanWriteHistory).toHaveBeenCalledWith(
        'p1',
        actor,
      );
      expect(d.referralsRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('respond con motivo de rechazo (v4266)', () => {
    it('400 when rejecting without a reason', async () => {
      const d = build();
      await expectReason(
        d.service.respond('ref1', { decision: 'REJECT' } as any, actor),
        400,
        ClinicalExtErrorReason.REFERRAL_REJECT_REASON_REQUIRED,
      );
      expect(d.referralsRepo.findById).not.toHaveBeenCalled();
    });

    it('stores the reject reason', async () => {
      const d = build();
      const referral: any = {
        id: 'ref1',
        targetProfileId: 'pr-dest',
        statusConceptId: CEXT.REFERRAL_REQUESTED,
      };
      d.referralsRepo.findById.mockResolvedValue(referral);
      const res = await d.service.respond(
        'ref1',
        { decision: 'REJECT', rejectReason: 'Sin cupo este mes' },
        destActor,
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
        ClinicalExtErrorReason.REFERRAL_NOT_FOUND,
      );
    });
  });

  describe('counter-referral', () => {
    it('the destination tenant closes an accepted referral', async () => {
      const d = build();
      const referral: any = {
        id: 'ref1',
        patientProfileId: 'p1',
        targetTenantId: ACTIVE_TENANT,
        statusConceptId: CEXT.REFERRAL_ACCEPTED,
      };
      d.referralsRepo.findById.mockResolvedValue(referral);
      const res = await d.service.counterReferral(
        'ref1',
        { counterReferralText: 'Completó 10 sesiones, alta' },
        { id: 'u2', roles: ['CLINICIAN'], tenantIds: [ACTIVE_TENANT] } as any,
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
      d.tx.findOne.mockResolvedValue({ id: 'br1', tenantId: ACTIVE_TENANT });
      const res = await d.service.counterReferral(
        'ref1',
        { counterReferralText: 'ok' },
        { id: 'u2', roles: ['CLINICIAN'], tenantIds: [ACTIVE_TENANT] } as any,
      );
      expect(res.status).toBe('COMPLETED');
    });

    it('404 (como inexistente) for someone who is not the destination', async () => {
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
        404,
        ClinicalExtErrorReason.REFERRAL_NOT_FOUND,
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
        targetTenantId: ACTIVE_TENANT,
        statusConceptId: CEXT.REFERRAL_REQUESTED,
      });
      await expectReason(
        d.service.counterReferral('ref1', { counterReferralText: 'x' }, {
          id: 'u2',
          roles: ['CLINICIAN'],
          tenantIds: [ACTIVE_TENANT],
        } as any),
        422,
        ClinicalExtErrorReason.REFERRAL_COUNTER_REFERRAL_NOT_ALLOWED,
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
        ClinicalExtErrorReason.REFERRAL_ALREADY_CLOSED,
      );
    });
  });
});
