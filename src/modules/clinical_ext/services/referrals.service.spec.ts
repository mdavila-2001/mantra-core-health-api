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
import { SCHED } from '../../scheduling/domain/scheduling.concepts';
import { ClinicalExtErrorReason } from '../clinical_ext.error-reasons';
import { ACTIVE_TENANT, inTenant, thrown } from './clinical-ext-tenant.testing';

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
  const encountersRepo = { findById: mockFn() };
  const notifier = { notifyRecommended: mockFn(() => Promise.resolve(true)) };
  const practitionersRepo = {
    findById: mockFn(() => Promise.resolve({ profileId: 'hp-2' })),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const targetsRepo = {
    searchPractitioners: mockFn(() => Promise.resolve([])),
  };
  const offeringsRepo = {
    findOfferingOf: mockFn(() =>
      Promise.resolve({ statusConceptId: SCHED.OFFERING_ACTIVE }),
    ),
    listOfferings: mockFn(() => Promise.resolve([])),
    findCatalogItems: mockFn(() => Promise.resolve([])),
  };
  const serviceCatalogRepo = {
    findById: mockFn(() => Promise.resolve(null)),
    searchPage: mockFn(() => Promise.resolve([])),
  };
  const practicesRepo = {
    findById: mockFn(() => Promise.resolve(null)),
    findByTenant: mockFn(() => Promise.resolve([])),
  };
  const tenantsRepo = {
    findById: mockFn(() => Promise.resolve(null)),
    searchPage: mockFn(() => Promise.resolve([])),
  };
  const conceptsRepo = { findByIds: mockFn(() => Promise.resolve(new Map())) };
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
    targetsRepo as any,
    offeringsRepo as any,
    serviceCatalogRepo as any,
    practicesRepo as any,
    tenantsRepo as any,
    conceptsRepo as any,
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
    targetsRepo,
    offeringsRepo,
    serviceCatalogRepo,
    practicesRepo,
    tenantsRepo,
    conceptsRepo,
    em,
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
      // Derivar exige un destino (profesional, organización o servicio).
      const res = await d.service.create(
        { patientProfileId: 'p1', targetTenantId: 'ten-dest' },
        actor,
      );
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
          {
            patientProfileId: 'p1',
            sourceEncounterId: 'e1',
            targetTenantId: 'ten-dest',
          } as any,
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
          {
            patientProfileId: 'p1',
            referringProfileId: 'falsificado',
            targetTenantId: 'ten-dest',
          } as any,
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
          {
            patientProfileId: 'p1',
            referringProfileId: 'falsificado',
            targetTenantId: 'ten-dest',
          } as any,
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
      expect(res).toEqual({ ok: true });
      expect(referral.statusConceptId).toBe(CEXT.REFERRAL_ACCEPTED);
    });

    it('throws when the referral is missing', async () => {
      const d = build();
      d.referralsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.respond('ref1', { decision: 'REJECT' } as any, destActor),
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
      expect(res).toEqual([
        {
          id: 'r1',
          referralType: null,
          targetServiceCatalogId: null,
          targetDisplayName: null,
          targetServiceName: null,
        },
      ]);
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
      await d.service.respond('ref1', { decision: 'REJECT' } as any, destActor);
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
      expect(res).toEqual([
        {
          id: 'r1',
          referralType: null,
          targetServiceCatalogId: null,
          targetDisplayName: null,
          targetServiceName: null,
        },
      ]);
    });
  });
  describe('derivación a servicio específico con tipo', () => {
    const created = {
      id: 'ref1',
      patientProfileId: 'p1',
      statusConceptId: CEXT.REFERRAL_REQUESTED,
      createdAt: new Date(),
    };
    const activeService = {
      id: 'svc-1',
      practiceId: 'pr-1',
      code: 'FISIO',
      name: 'Fisioterapia',
      isActive: true,
      defaultPrice: '150.00',
      currencyConceptId: 'cur-bob',
    };

    it('persiste el tipo pedido como concepto y el servicio destino', async () => {
      const d = build();
      d.serviceCatalogRepo.findById.mockResolvedValue(activeService);
      d.practicesRepo.findById.mockResolvedValue({
        id: 'pr-1',
        tenantId: 'ten-dest',
      });
      d.referralsRepo.create.mockReturnValue(created);

      await d.service.create(
        {
          patientProfileId: 'p1',
          targetProfileId: 'hp-2',
          targetServiceCatalogId: 'svc-1',
          referralType: 'TREATMENT',
        } as any,
        doctor,
      );

      const data = d.referralsRepo.create.mock.calls[0][1];
      expect(data.referralTypeConceptId).toBe(CEXT.REFERRAL_TYPE_TREATMENT);
      expect(data.targetServiceCatalogId).toBe('svc-1');
      // Sin targetTenantId, el tenant destino sale del servicio.
      expect(data.targetTenantId).toBe('ten-dest');
      expect(d.offeringsRepo.findOfferingOf).toHaveBeenCalledWith(
        expect.anything(),
        'hp-2',
        'svc-1',
      );
    });

    it('sin tipo, persiste CONSULTATION', async () => {
      const d = build();
      d.referralsRepo.create.mockReturnValue(created);
      await d.service.create(
        { patientProfileId: 'p1', targetTenantId: 'ten-dest' } as any,
        actor,
      );
      expect(
        d.referralsRepo.create.mock.calls[0][1].referralTypeConceptId,
      ).toBe(CEXT.REFERRAL_TYPE_CONSULTATION);
    });

    it('sin ningún destino responde 422 y no crea nada', async () => {
      const d = build();
      const err = await thrown(
        d.service.create(
          { patientProfileId: 'p1', specialtyConceptId: 's1' } as any,
          doctor,
        ),
      );
      expect(err).toBeInstanceOf(PreconditionFailedException);
      expect(err.getStatus()).toBe(422);
      expect(d.referralsRepo.create).not.toHaveBeenCalled();
    });

    it('un servicio de OTRA organización que la destino responde 422', async () => {
      const d = build();
      d.serviceCatalogRepo.findById.mockResolvedValue(activeService);
      d.practicesRepo.findById.mockResolvedValue({
        id: 'pr-1',
        tenantId: 'ten-otra',
      });
      const err = await thrown(
        d.service.create(
          {
            patientProfileId: 'p1',
            targetTenantId: 'ten-dest',
            targetServiceCatalogId: 'svc-1',
          } as any,
          doctor,
        ),
      );
      expect(err).toBeInstanceOf(PreconditionFailedException);
      expect(d.referralsRepo.create).not.toHaveBeenCalled();
    });

    it('un servicio que el profesional destino no ofrece responde 422', async () => {
      const d = build();
      d.serviceCatalogRepo.findById.mockResolvedValue(activeService);
      d.practicesRepo.findById.mockResolvedValue({
        id: 'pr-1',
        tenantId: 'ten-dest',
      });
      d.offeringsRepo.findOfferingOf.mockResolvedValue(null);
      const err = await thrown(
        d.service.create(
          {
            patientProfileId: 'p1',
            targetProfileId: 'hp-2',
            targetServiceCatalogId: 'svc-1',
          } as any,
          doctor,
        ),
      );
      expect(err).toBeInstanceOf(PreconditionFailedException);
      expect(d.referralsRepo.create).not.toHaveBeenCalled();
    });

    it('una oferta inactiva del profesional también responde 422', async () => {
      const d = build();
      d.serviceCatalogRepo.findById.mockResolvedValue(activeService);
      d.practicesRepo.findById.mockResolvedValue({
        id: 'pr-1',
        tenantId: 'ten-dest',
      });
      d.offeringsRepo.findOfferingOf.mockResolvedValue({
        statusConceptId: SCHED.OFFERING_INACTIVE,
      });
      await expect(
        d.service.create(
          {
            patientProfileId: 'p1',
            targetProfileId: 'hp-2',
            targetServiceCatalogId: 'svc-1',
          } as any,
          doctor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('un servicio inexistente responde 404 y uno inactivo 422', async () => {
      const d = build();
      d.serviceCatalogRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.create(
          { patientProfileId: 'p1', targetServiceCatalogId: 'svc-x' } as any,
          doctor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);

      d.serviceCatalogRepo.findById.mockResolvedValue({
        ...activeService,
        isActive: false,
      });
      await expect(
        d.service.create(
          { patientProfileId: 'p1', targetServiceCatalogId: 'svc-1' } as any,
          doctor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.referralsRepo.create).not.toHaveBeenCalled();
    });

    it('el duplicado con servicio compara encuentro, servicio y tipo', async () => {
      const d = build();
      d.encountersRepo.findById.mockResolvedValue({
        id: 'e1',
        patientProfileId: 'p1',
        tenantId: 't-1',
      });
      d.serviceCatalogRepo.findById.mockResolvedValue(activeService);
      d.practicesRepo.findById.mockResolvedValue({
        id: 'pr-1',
        tenantId: 'ten-dest',
      });
      d.referralsRepo.findDuplicate.mockResolvedValue({ id: 'ref0' });
      const err = await thrown(
        d.service.create(
          {
            patientProfileId: 'p1',
            sourceEncounterId: 'e1',
            targetServiceCatalogId: 'svc-1',
            referralType: 'PROCEDURE',
          } as any,
          doctor,
        ),
      );
      expect(err).toBeInstanceOf(ConflictException);
      expect(d.referralsRepo.findDuplicate).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          sourceEncounterId: 'e1',
          targetServiceCatalogId: 'svc-1',
          referralTypeConceptId: CEXT.REFERRAL_TYPE_PROCEDURE,
          treatNullTypeAsSame: false,
        }),
      );
    });

    describe('searchTargets', () => {
      it('menos de dos caracteres útiles responde 422 sin consultar', async () => {
        const d = build();
        await expect(
          d.service.searchTargets({ q: ' a ' } as any),
        ).rejects.toBeInstanceOf(PreconditionFailedException);
        expect(d.targetsRepo.searchPractitioners).not.toHaveBeenCalled();
        expect(d.tenantsRepo.searchPage).not.toHaveBeenCalled();
      });

      it('ORGANIZATION busca tenants activos y devuelve la forma del contrato', async () => {
        const d = build();
        d.tenantsRepo.searchPage.mockResolvedValue([
          {
            id: 'ten-1',
            code: 'CLI-1',
            legalName: 'Clínica Norte S.R.L.',
            tradeName: 'Clínica Norte',
          },
        ]);
        const res = await d.service.searchTargets({
          q: 'norte',
          kind: 'ORGANIZATION',
        });
        expect(d.tenantsRepo.searchPage).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({ query: 'norte' }),
          20,
        );
        expect(d.targetsRepo.searchPractitioners).not.toHaveBeenCalled();
        expect(res).toEqual({
          items: [
            {
              kind: 'ORGANIZATION',
              id: 'ten-1',
              displayName: 'Clínica Norte',
              tenantId: 'ten-1',
              subtitle: 'Clínica Norte S.R.L.',
            },
          ],
        });
      });

      it('PRACTITIONER devuelve el perfil con su nombre, tenant y subtítulo', async () => {
        const d = build();
        d.targetsRepo.searchPractitioners.mockResolvedValue([
          {
            profileId: 'hp-2',
            professionalTitle: 'Cardióloga',
            tenantId: 'ten-1',
            practiceName: 'Consultorio Sur',
          },
        ]);
        d.em.find = mockFn((entity: any) =>
          Promise.resolve(
            entity.name === 'HealthPractitionerProfiles'
              ? [{ profileId: 'hp-2' }]
              : [{ id: 'hp-2', displayName: 'Ana Pérez' }],
          ),
        );
        const res = await d.service.searchTargets({
          q: 'ana',
          kind: 'PRACTITIONER',
        });
        expect(d.tenantsRepo.searchPage).not.toHaveBeenCalled();
        expect(res.items).toEqual([
          {
            kind: 'PRACTITIONER',
            id: 'hp-2',
            displayName: 'Ana Pérez',
            tenantId: 'ten-1',
            subtitle: 'Cardióloga · Consultorio Sur',
          },
        ]);
      });
    });

    describe('listTargetServices', () => {
      it('sin destino responde 422', async () => {
        const d = build();
        await expect(d.service.listTargetServices({})).rejects.toBeInstanceOf(
          PreconditionFailedException,
        );
      });

      it('de un profesional: sólo ofertas activas y servicios activos', async () => {
        const d = build();
        d.offeringsRepo.listOfferings.mockResolvedValue([
          { serviceCatalogId: 'svc-1' },
          { serviceCatalogId: 'svc-2' },
        ]);
        d.offeringsRepo.findCatalogItems.mockResolvedValue([
          activeService,
          { ...activeService, id: 'svc-2', name: 'Otro', isActive: false },
        ]);
        d.practicesRepo.findById.mockResolvedValue({
          id: 'pr-1',
          tenantId: 'ten-dest',
          name: 'Consultorio Sur',
        });
        d.conceptsRepo.findByIds.mockResolvedValue(
          new Map([['cur-bob', { code: 'BOB' }]]),
        );
        const res = await d.service.listTargetServices({
          targetProfileId: 'hp-2',
        });
        expect(d.offeringsRepo.listOfferings).toHaveBeenCalledWith(
          expect.anything(),
          'hp-2',
          { statusConceptId: SCHED.OFFERING_ACTIVE },
        );
        expect(res).toEqual({
          items: [
            {
              id: 'svc-1',
              code: 'FISIO',
              name: 'Fisioterapia',
              description: null,
              price: 150,
              currency: 'BOB',
              tenantId: 'ten-dest',
              practiceName: 'Consultorio Sur',
            },
          ],
        });
      });

      it('de una organización: servicios activos de sus prácticas activas', async () => {
        const d = build();
        d.practicesRepo.findByTenant.mockResolvedValue([{ id: 'pr-1' }]);
        d.serviceCatalogRepo.searchPage.mockResolvedValue([activeService]);
        d.practicesRepo.findById.mockResolvedValue({
          id: 'pr-1',
          tenantId: 'ten-dest',
          name: 'Clínica Norte',
        });
        const res = await d.service.listTargetServices({
          targetTenantId: 'ten-dest',
        });
        expect(d.serviceCatalogRepo.searchPage).toHaveBeenCalledWith(
          expect.anything(),
          { practiceId: 'pr-1', isActive: true },
          200,
        );
        expect(res.items.map((item) => item.id)).toEqual(['svc-1']);
        expect(res.items[0].practiceName).toBe('Clínica Norte');
        expect(res.items[0].currency).toBeNull();
      });
    });

    it('los listados exponen tipo, servicio y nombres legibles', async () => {
      const d = build();
      d.referralsRepo.findByPatient.mockResolvedValue([
        {
          id: 'r1',
          targetTenantId: 'ten-dest',
          targetServiceCatalogId: 'svc-1',
          referralTypeConceptId: CEXT.REFERRAL_TYPE_TREATMENT,
        },
      ]);
      d.tenantsRepo.findById.mockResolvedValue({
        id: 'ten-dest',
        legalName: 'Clínica Norte S.R.L.',
        tradeName: 'Clínica Norte',
      });
      d.offeringsRepo.findCatalogItems.mockResolvedValue([activeService]);
      const res = await d.service.listByPatient('p1', actor);
      expect(res).toEqual([
        {
          id: 'r1',
          targetTenantId: 'ten-dest',
          referralTypeConceptId: CEXT.REFERRAL_TYPE_TREATMENT,
          referralType: 'TREATMENT',
          targetServiceCatalogId: 'svc-1',
          targetDisplayName: 'Clínica Norte',
          targetServiceName: 'Fisioterapia',
        },
      ]);
    });
  });
});
