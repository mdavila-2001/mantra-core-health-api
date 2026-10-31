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
import { Branches } from '../../directory/entities';
import { AllExceptionsFilter } from '../../../common/filters/all-exceptions.filter';

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
  // `em` y `tx` comparten por defecto los mismos mocks de lectura: según el
  // método, el servicio lee con `em.fork()` o dentro de la transacción, y cada
  // test puede ajustar `d.tx.find` o sobrescribir `d.em.find`.
  const em: any = {
    transactional: mockFn((cb: any) => cb(tx)),
    flush: tx.flush,
    execute: tx.execute,
    findOne: tx.findOne,
    find: tx.find,
  };
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
    searchOrganizations: mockFn(() => Promise.resolve([])),
    isListablePractitioner: mockFn(() => Promise.resolve(true)),
    isListableOrganization: mockFn(() => Promise.resolve(true)),
    isActiveTenant: mockFn(() => Promise.resolve(true)),
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
    raw,
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

      it('a una organización (sin profesional) con encuentro también avisa', async () => {
        const d = build();
        d.encountersRepo.findById.mockResolvedValue(encounter);
        d.referralsRepo.create.mockImplementation(
          (_tx: unknown, data: any) => ({
            ...created,
            targetTenantId: data.targetTenantId,
          }),
        );

        await d.service.create(
          {
            patientProfileId: 'p1',
            sourceEncounterId: 'e1',
            targetTenantId: 'ten-dest',
          } as any,
          doctor,
        );

        expect(d.notifier.notifyRecommended).toHaveBeenCalledWith('ref1');
        expect(d.referralsRepo.create.mock.invocationCallOrder[0]).toBeLessThan(
          d.notifier.notifyRecommended.mock.invocationCallOrder[0],
        );
      });

      it('a un servicio sin tenant explícito avisa: el tenant destino sale del servicio', async () => {
        const d = build();
        d.encountersRepo.findById.mockResolvedValue(encounter);
        d.serviceCatalogRepo.findById.mockResolvedValue({
          id: 'svc-1',
          practiceId: 'pr-1',
          isActive: true,
        });
        d.practicesRepo.findById.mockResolvedValue({
          id: 'pr-1',
          tenantId: 'ten-dest',
        });
        d.referralsRepo.findDuplicate.mockResolvedValue(null);
        d.referralsRepo.create.mockImplementation(
          (_tx: unknown, data: any) => ({
            ...created,
            targetTenantId: data.targetTenantId,
            targetServiceCatalogId: data.targetServiceCatalogId,
          }),
        );

        await d.service.create(
          {
            patientProfileId: 'p1',
            sourceEncounterId: 'e1',
            targetServiceCatalogId: 'svc-1',
          } as any,
          doctor,
        );

        expect(d.notifier.notifyRecommended).toHaveBeenCalledWith('ref1');
      });

      it('a una organización SIN encuentro NO avisa', async () => {
        const d = build();
        d.referralsRepo.create.mockImplementation(
          (_tx: unknown, data: any) => ({
            ...created,
            targetTenantId: data.targetTenantId,
          }),
        );

        await d.service.create(
          { patientProfileId: 'p1', targetTenantId: 'ten-dest' } as any,
          doctor,
        );

        expect(d.referralsRepo.create).toHaveBeenCalled();
        expect(d.notifier.notifyRecommended).not.toHaveBeenCalled();
      });

      it('sin profesional ni organización destino (sede o externo) NO avisa', async () => {
        const d = build();
        d.encountersRepo.findById.mockResolvedValue(encounter);
        d.tx.findOne.mockResolvedValue({ id: 'br-1' });
        d.referralsRepo.create.mockReturnValue(created);

        await d.service.create(
          {
            patientProfileId: 'p1',
            sourceEncounterId: 'e1',
            targetExternalName: 'Hospital de Clínicas',
          } as any,
          doctor,
        );

        expect(d.referralsRepo.create).toHaveBeenCalled();
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

  describe('razones de error de POST /referrals', () => {
    const service = {
      id: 'svc-1',
      practiceId: 'pr-1',
      isActive: true,
    };
    const encounter = { id: 'e1', patientProfileId: 'p1', tenantId: 't-1' };

    /** Pasa el error por el filtro global y devuelve el cuerpo HTTP. */
    function httpBody(error: unknown): Record<string, unknown> {
      const response: any = {
        headersSent: false,
        setHeader: mockFn(),
        status: mockFn(),
        json: mockFn(),
      };
      response.status.mockReturnValue(response);
      const host: any = {
        switchToHttp: () => ({
          getResponse: () => response,
          getRequest: () => ({
            headers: {},
            url: '/referrals',
            method: 'POST',
          }),
        }),
      };
      const filter = new AllExceptionsFilter(
        { setContext: mockFn(), warn: mockFn(), error: mockFn() } as any,
        {
          setAttribute: mockFn(),
          recordException: mockFn(),
          addEvent: mockFn(),
        } as any,
      );
      filter.catch(error, host);
      return response.json.mock.calls[0][0];
    }

    it('404 REFERRAL_TARGET_NOT_FOUND: el profesional destino no existe', async () => {
      const d = build();
      d.practitionersRepo.findById.mockResolvedValue(null);
      const err = await thrown(
        d.service.create(
          { patientProfileId: 'p1', targetProfileId: 'hp-x' } as any,
          doctor,
        ),
      );
      expect(err).toMatchObject({
        status: 404,
        reason: ClinicalExtErrorReason.REFERRAL_TARGET_NOT_FOUND,
      });
      expect(httpBody(err)).toMatchObject({
        code: 'NOT_FOUND',
        reason: 'REFERRAL_TARGET_NOT_FOUND',
        details: { targetProfileId: 'hp-x' },
      });
    });

    it('404 REFERRAL_SERVICE_NOT_FOUND: el servicio destino no existe', async () => {
      const d = build();
      d.serviceCatalogRepo.findById.mockResolvedValue(null);
      const err = await thrown(
        d.service.create(
          { patientProfileId: 'p1', targetServiceCatalogId: 'svc-x' } as any,
          doctor,
        ),
      );
      expect(err).toMatchObject({
        status: 404,
        reason: ClinicalExtErrorReason.REFERRAL_SERVICE_NOT_FOUND,
      });
      expect(httpBody(err)).toMatchObject({
        code: 'NOT_FOUND',
        reason: 'REFERRAL_SERVICE_NOT_FOUND',
        details: { targetServiceCatalogId: 'svc-x' },
      });
    });

    it('404 REFERRAL_ENCOUNTER_NOT_FOUND: el encuentro no existe o no es del paciente', async () => {
      const d = build();
      d.encountersRepo.findById.mockResolvedValue(null);
      await expectReason(
        d.service.create(
          {
            patientProfileId: 'p1',
            sourceEncounterId: 'e-x',
            targetTenantId: 'ten-dest',
          } as any,
          doctor,
        ),
        404,
        ClinicalExtErrorReason.REFERRAL_ENCOUNTER_NOT_FOUND,
      );

      d.encountersRepo.findById.mockResolvedValue({
        ...encounter,
        patientProfileId: 'otro',
      });
      const err = await thrown(
        d.service.create(
          {
            patientProfileId: 'p1',
            sourceEncounterId: 'e1',
            targetTenantId: 'ten-dest',
          } as any,
          doctor,
        ),
      );
      expect(err.reason).toBe(
        ClinicalExtErrorReason.REFERRAL_ENCOUNTER_NOT_FOUND,
      );
      expect(httpBody(err)).toMatchObject({
        code: 'NOT_FOUND',
        reason: 'REFERRAL_ENCOUNTER_NOT_FOUND',
        details: { encounterId: 'e1' },
      });
    });

    it('409 REFERRAL_ALREADY_EXISTS va en el mismo lugar: reason de primer nivel', async () => {
      const d = build();
      d.encountersRepo.findById.mockResolvedValue(encounter);
      d.referralsRepo.findDuplicate.mockResolvedValue({ id: 'ref0' });
      const err = await thrown(
        d.service.create(
          {
            patientProfileId: 'p1',
            sourceEncounterId: 'e1',
            targetProfileId: 'hp-2',
            specialtyConceptId: 's1',
          } as any,
          doctor,
        ),
      );
      expect(httpBody(err)).toMatchObject({
        code: 'CONFLICT',
        reason: 'REFERRAL_ALREADY_EXISTS',
        details: { sourceEncounterId: 'e1' },
      });
    });

    it('422 REFERRAL_TARGET_REQUIRED: reason de primer nivel y, como antes, en details', async () => {
      const d = build();
      const err = await thrown(
        d.service.create(
          { patientProfileId: 'p1', specialtyConceptId: 's1' } as any,
          doctor,
        ),
      );
      expect(err.reason).toBe(ClinicalExtErrorReason.REFERRAL_TARGET_REQUIRED);
      expect(httpBody(err)).toMatchObject({
        code: 'PRECONDITION_FAILED',
        reason: 'REFERRAL_TARGET_REQUIRED',
        details: { reason: 'REFERRAL_TARGET_REQUIRED' },
      });
    });

    it('422 REFERRAL_SERVICE_INACTIVE: reason de primer nivel y en details', async () => {
      const d = build();
      d.serviceCatalogRepo.findById.mockResolvedValue({
        ...service,
        isActive: false,
      });
      const err = await thrown(
        d.service.create(
          { patientProfileId: 'p1', targetServiceCatalogId: 'svc-1' } as any,
          doctor,
        ),
      );
      expect(err.reason).toBe(ClinicalExtErrorReason.REFERRAL_SERVICE_INACTIVE);
      expect(httpBody(err)).toMatchObject({
        code: 'PRECONDITION_FAILED',
        reason: 'REFERRAL_SERVICE_INACTIVE',
        details: {
          targetServiceCatalogId: 'svc-1',
          reason: 'REFERRAL_SERVICE_INACTIVE',
        },
      });
    });

    it('422 REFERRAL_SERVICE_TARGET_MISMATCH: organización ajena y profesional que no lo ofrece', async () => {
      const d = build();
      d.serviceCatalogRepo.findById.mockResolvedValue(service);
      d.practicesRepo.findById.mockResolvedValue({
        id: 'pr-1',
        tenantId: 'ten-otra',
      });
      const foreign = await thrown(
        d.service.create(
          {
            patientProfileId: 'p1',
            targetTenantId: 'ten-dest',
            targetServiceCatalogId: 'svc-1',
          } as any,
          doctor,
        ),
      );
      expect(foreign.reason).toBe(
        ClinicalExtErrorReason.REFERRAL_SERVICE_TARGET_MISMATCH,
      );

      d.practicesRepo.findById.mockResolvedValue({
        id: 'pr-1',
        tenantId: 'ten-dest',
      });
      d.offeringsRepo.findOfferingOf.mockResolvedValue(null);
      const notOffered = await thrown(
        d.service.create(
          {
            patientProfileId: 'p1',
            targetProfileId: 'hp-2',
            targetServiceCatalogId: 'svc-1',
          } as any,
          doctor,
        ),
      );
      expect(notOffered.reason).toBe(
        ClinicalExtErrorReason.REFERRAL_SERVICE_TARGET_MISMATCH,
      );
      expect(httpBody(notOffered)).toMatchObject({
        code: 'PRECONDITION_FAILED',
        reason: 'REFERRAL_SERVICE_TARGET_MISMATCH',
        details: {
          targetServiceCatalogId: 'svc-1',
          reason: 'REFERRAL_SERVICE_TARGET_MISMATCH',
        },
      });
    });

    it('GET /referrals/targets y /target-services usan el mismo catálogo', async () => {
      const d = build();
      await expectReason(
        d.raw.searchTargets({ q: 'a' } as any),
        422,
        ClinicalExtErrorReason.REFERRAL_TARGET_QUERY_TOO_SHORT,
      );
      await expectReason(
        d.raw.listTargetServices({} as any),
        422,
        ClinicalExtErrorReason.REFERRAL_TARGET_REQUIRED,
      );
      d.targetsRepo.isListableOrganization.mockResolvedValue(false);
      await expectReason(
        d.raw.listTargetServices({ targetTenantId: 'ten-x' } as any),
        404,
        ClinicalExtErrorReason.REFERRAL_TARGET_NOT_FOUND,
      );
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
      expect(res).toEqual([
        {
          id: 'r1',
          status: 'PENDING',
          referralType: null,
          targetServiceCatalogId: null,
          targetDisplayName: null,
          targetServiceName: null,
          transfer: null,
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
      expect(res).toEqual([
        {
          id: 'r1',
          status: 'PENDING',
          referralType: null,
          targetServiceCatalogId: null,
          targetDisplayName: null,
          targetServiceName: null,
          transfer: null,
        },
      ]);
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
          referralTypeConceptId: CEXT.REFERRAL_TYPE_THERAPY,
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
      const res = await d.service.create(
        { patientProfileId: 'p1', targetTenantId: 'ten-1' },
        actor,
      );
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

    it('el mismo servicio con OTRO tipo no es duplicado: crea la derivación', async () => {
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
      // Ya hay una derivación CONSULTATION a ese servicio desde ese encuentro:
      // el repositorio la devuelve sólo si el tipo pedido coincide.
      const existing = {
        sourceEncounterId: 'e1',
        targetServiceCatalogId: 'svc-1',
        referralTypeConceptId: CEXT.REFERRAL_TYPE_CONSULTATION,
      };
      d.referralsRepo.findDuplicate.mockImplementation(
        async (_tx: unknown, criteria: any) =>
          criteria.referralTypeConceptId === existing.referralTypeConceptId
            ? existing
            : null,
      );
      d.referralsRepo.create.mockReturnValue(created);

      await d.service.create(
        {
          patientProfileId: 'p1',
          sourceEncounterId: 'e1',
          targetServiceCatalogId: 'svc-1',
          referralType: 'TREATMENT',
        } as any,
        doctor,
      );

      expect(d.referralsRepo.create).toHaveBeenCalled();
      // La clave lógica también separa por tipo: dos tipos al mismo servicio no
      // se serializan como si fueran el mismo pedido.
      expect(d.tx.execute.mock.calls[0][1]).toEqual([
        'clinical_ext.referral:e1:-:svc-1:TREATMENT',
      ]);
    });

    describe('duplicado de una derivación sólo a la organización', () => {
      const encounter = { id: 'e1', patientProfileId: 'p1', tenantId: 't-1' };

      it('con encuentro, toma la clave lógica y busca por organización y tipo', async () => {
        const d = build();
        d.encountersRepo.findById.mockResolvedValue(encounter);
        d.referralsRepo.findDuplicate.mockResolvedValue(null);
        d.referralsRepo.create.mockReturnValue(created);

        await d.service.create(
          {
            patientProfileId: 'p1',
            sourceEncounterId: 'e1',
            targetTenantId: 'ten-dest',
          } as any,
          doctor,
        );

        expect(d.tx.execute.mock.calls[0][1]).toEqual([
          'clinical_ext.referral:e1:org:ten-dest:CONSULTATION',
        ]);
        expect(d.referralsRepo.findDuplicate).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            sourceEncounterId: 'e1',
            targetTenantId: 'ten-dest',
            referralTypeConceptId: CEXT.REFERRAL_TYPE_CONSULTATION,
            treatNullTypeAsSame: true,
          }),
        );
        expect(d.tx.execute.mock.invocationCallOrder[0]).toBeLessThan(
          d.referralsRepo.findDuplicate.mock.invocationCallOrder[0],
        );
      });

      it('un doble envío responde 409 REFERRAL_ALREADY_EXISTS, sin crear ni avisar', async () => {
        const d = build();
        d.encountersRepo.findById.mockResolvedValue(encounter);
        d.referralsRepo.findDuplicate.mockResolvedValue({ id: 'ref0' });

        await expectReason(
          d.service.create(
            {
              patientProfileId: 'p1',
              sourceEncounterId: 'e1',
              targetTenantId: 'ten-dest',
            } as any,
            doctor,
          ),
          409,
          ClinicalExtErrorReason.REFERRAL_ALREADY_EXISTS,
        );
        expect(d.referralsRepo.create).not.toHaveBeenCalled();
        expect(d.notifier.notifyRecommended).not.toHaveBeenCalled();
      });

      it('con profesional o con servicio no usa la rama de organización', async () => {
        const d = build();
        d.encountersRepo.findById.mockResolvedValue(encounter);
        d.referralsRepo.findDuplicate.mockResolvedValue(null);
        d.referralsRepo.create.mockReturnValue(created);

        await d.service.create(
          {
            patientProfileId: 'p1',
            sourceEncounterId: 'e1',
            targetProfileId: 'hp-2',
            specialtyConceptId: 's1',
            targetTenantId: 'ten-dest',
          } as any,
          doctor,
        );

        expect(d.tx.execute.mock.calls[0][1]).toEqual([
          'clinical_ext.referral:e1:hp-2:s1:CONSULTATION',
        ]);
        expect(
          d.referralsRepo.findDuplicate.mock.calls[0][1].targetTenantId,
        ).toBeUndefined();
      });

      it('sin encuentro no hay comprobación de duplicado', async () => {
        const d = build();
        d.referralsRepo.create.mockReturnValue(created);

        await d.service.create(
          { patientProfileId: 'p1', targetTenantId: 'ten-dest' } as any,
          doctor,
        );

        expect(d.referralsRepo.findDuplicate).not.toHaveBeenCalled();
        expect(d.referralsRepo.create).toHaveBeenCalled();
      });
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
        expect(d.targetsRepo.searchOrganizations).not.toHaveBeenCalled();
      });

      it('ORGANIZATION busca tenants activos y devuelve la forma del contrato', async () => {
        const d = build();
        d.targetsRepo.searchOrganizations.mockResolvedValue([
          {
            tenantId: 'ten-1',
            legalName: 'Clínica Norte S.R.L.',
            tradeName: 'Clínica Norte',
          },
        ]);
        const res = await d.service.searchTargets({
          q: 'norte',
          kind: 'ORGANIZATION',
        });
        expect(d.targetsRepo.searchOrganizations).toHaveBeenCalledWith(
          expect.anything(),
          'norte',
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
        expect(d.targetsRepo.searchOrganizations).not.toHaveBeenCalled();
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
        expect(d.targetsRepo.isListableOrganization).toHaveBeenCalledWith(
          expect.anything(),
          'ten-dest',
        );
      });

      describe('sólo de destinos listables (#1058)', () => {
        it('un profesional sin vitrina pública activa responde 404 y no lee su catálogo', async () => {
          const d = build();
          d.targetsRepo.isListablePractitioner.mockResolvedValue(false);
          await expect(
            d.service.listTargetServices({ targetProfileId: 'hp-oculto' }),
          ).rejects.toBeInstanceOf(ResourceNotFoundException);
          expect(d.targetsRepo.isListablePractitioner).toHaveBeenCalledWith(
            expect.anything(),
            'hp-oculto',
          );
          expect(d.offeringsRepo.listOfferings).not.toHaveBeenCalled();
          expect(d.offeringsRepo.findCatalogItems).not.toHaveBeenCalled();
        });

        it('una organización no listable (perfil no público o tenant inactivo) responde 404 y no lee sus prácticas', async () => {
          const d = build();
          d.targetsRepo.isListableOrganization.mockResolvedValue(false);
          await expect(
            d.service.listTargetServices({ targetTenantId: 'ten-inactivo' }),
          ).rejects.toBeInstanceOf(ResourceNotFoundException);
          expect(d.practicesRepo.findByTenant).not.toHaveBeenCalled();
          expect(d.serviceCatalogRepo.searchPage).not.toHaveBeenCalled();
        });

        it('con profesional y tenant, un tenant inactivo responde 404', async () => {
          const d = build();
          d.targetsRepo.isActiveTenant.mockResolvedValue(false);
          await expect(
            d.service.listTargetServices({
              targetProfileId: 'hp-2',
              targetTenantId: 'ten-inactivo',
            }),
          ).rejects.toBeInstanceOf(ResourceNotFoundException);
          expect(d.offeringsRepo.listOfferings).not.toHaveBeenCalled();
        });

        it('con profesional y tenant, la organización no necesita vitrina propia', async () => {
          const d = build();
          d.targetsRepo.isListableOrganization.mockResolvedValue(false);
          d.offeringsRepo.listOfferings.mockResolvedValue([
            { serviceCatalogId: 'svc-1' },
          ]);
          d.offeringsRepo.findCatalogItems.mockResolvedValue([activeService]);
          d.practicesRepo.findById.mockResolvedValue({
            id: 'pr-1',
            tenantId: 'ten-dest',
            name: 'Consultorio Sur',
          });
          const res = await d.service.listTargetServices({
            targetProfileId: 'hp-2',
            targetTenantId: 'ten-dest',
          });
          expect(d.targetsRepo.isActiveTenant).toHaveBeenCalledWith(
            expect.anything(),
            'ten-dest',
          );
          expect(d.targetsRepo.isListableOrganization).not.toHaveBeenCalled();
          expect(res.items.map((item) => item.id)).toEqual(['svc-1']);
        });

        it('con profesional y tenant, un profesional no listable responde 404', async () => {
          const d = build();
          d.targetsRepo.isListablePractitioner.mockResolvedValue(false);
          await expect(
            d.service.listTargetServices({
              targetProfileId: 'hp-oculto',
              targetTenantId: 'ten-dest',
            }),
          ).rejects.toBeInstanceOf(ResourceNotFoundException);
          expect(d.offeringsRepo.listOfferings).not.toHaveBeenCalled();
        });

        it('un profesional listable devuelve sus servicios', async () => {
          const d = build();
          d.offeringsRepo.listOfferings.mockResolvedValue([
            { serviceCatalogId: 'svc-1' },
          ]);
          d.offeringsRepo.findCatalogItems.mockResolvedValue([activeService]);
          d.practicesRepo.findById.mockResolvedValue({
            id: 'pr-1',
            tenantId: 'ten-dest',
            name: 'Consultorio Sur',
          });
          const res = await d.service.listTargetServices({
            targetProfileId: 'hp-2',
          });
          expect(d.targetsRepo.isListablePractitioner).toHaveBeenCalledWith(
            expect.anything(),
            'hp-2',
          );
          expect(d.targetsRepo.isListableOrganization).not.toHaveBeenCalled();
          expect(res.items.map((item) => item.id)).toEqual(['svc-1']);
        });
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
          status: 'PENDING',
          referralType: 'TREATMENT',
          targetServiceCatalogId: 'svc-1',
          targetDisplayName: 'Clínica Norte',
          targetServiceName: 'Fisioterapia',
          transfer: null,
        },
      ]);
    });
  });

  describe('traslado (v4274)', () => {
    const critical = {
      required: true,
      transportMode: 'AMBULANCE_ADVANCED' as const,
      departureCondition: 'CRITICAL' as const,
      escortProfessionalName: 'Lic. Enf. Ana Rojas',
      receiverContacted: true,
      receiverContactName: 'Dr. Guardia',
      departedAt: '2026-10-31T10:00:00Z',
    };
    /** Profesional del tenant destino. */
    const destTenantActor = {
      id: 'u2',
      roles: ['CLINICIAN'],
      tenantIds: [ACTIVE_TENANT],
    } as any;

    describe('create', () => {
      it('persists the transfer object and returns it', async () => {
        const d = build();
        const row: any = {
          id: 'ref1',
          patientProfileId: 'p1',
          statusConceptId: CEXT.REFERRAL_REQUESTED,
          createdAt: new Date(),
        };
        d.referralsRepo.create.mockReturnValue(row);
        const res = await d.service.create(
          {
            patientProfileId: 'p1',
            targetTenantId: 'ten-dest',
            transfer: {
              ...critical,
              vitals: { systolicBp: 85, diastolicBp: 50, glasgow: 12 },
            },
          },
          actor,
        );
        expect(row.transportMode).toBe('AMBULANCE_ADVANCED');
        expect(row.vitalGlasgow).toBe(12);
        expect(row.departedAt).toEqual(new Date('2026-10-31T10:00:00Z'));
        expect(res.transfer).toMatchObject({
          required: true,
          departureCondition: 'CRITICAL',
          vitals: { systolicBp: 85, diastolicBp: 50, glasgow: 12 },
          arrivedAt: null,
        });
      });

      it('returns transfer=null when none was sent', async () => {
        const d = build();
        d.referralsRepo.create.mockReturnValue({
          id: 'ref1',
          patientProfileId: 'p1',
          statusConceptId: CEXT.REFERRAL_REQUESTED,
          createdAt: new Date(),
        });
        const res = await d.service.create(
          { patientProfileId: 'p1', targetTenantId: 'ten-dest' },
          actor,
        );
        expect(res.transfer).toBeNull();
      });

      it('400 TRANSFER_UNSAFE_TRANSPORT before creating anything', async () => {
        const d = build();
        await expectReason(
          d.service.create(
            {
              patientProfileId: 'p1',
              targetTenantId: 'ten-dest',
              transfer: { ...critical, transportMode: 'PRIVATE_VEHICLE' },
            },
            actor,
          ),
          400,
          ClinicalExtErrorReason.TRANSFER_UNSAFE_TRANSPORT,
        );
        expect(d.referralsRepo.create).not.toHaveBeenCalled();
      });

      it('validates the transfer only after the write authorization', async () => {
        const d = build();
        d.clinicalRead.assertCanWriteHistory.mockRejectedValue(
          new ForbiddenException(),
        );
        await expect(
          d.service.create(
            {
              patientProfileId: 'p1',
              targetTenantId: 'ten-dest',
              transfer: { required: true },
            },
            actor,
          ),
        ).rejects.toBeInstanceOf(ForbiddenException);
      });
    });

    describe('PATCH transfer (quien deriva)', () => {
      it('completes the departure after checking write access', async () => {
        const d = build();
        const referral: any = {
          id: 'ref1',
          patientProfileId: 'p1',
          statusConceptId: CEXT.REFERRAL_ACCEPTED,
          transferRequired: true,
          transportMode: 'AMBULANCE_BASIC',
          departureCondition: 'STABLE',
        };
        d.referralsRepo.findById.mockResolvedValue(referral);
        const res = await d.service.updateTransfer(
          'ref1',
          { companionName: 'María Pérez', departedAt: '2026-10-31T10:00:00Z' },
          actor,
        );
        expect(d.clinicalRead.assertCanWriteHistory).toHaveBeenCalledWith(
          'p1',
          actor,
        );
        expect(referral.transportMode).toBe('AMBULANCE_BASIC');
        expect(res.transfer).toMatchObject({
          companionName: 'María Pérez',
          transportMode: 'AMBULANCE_BASIC',
        });
      });

      it('evaluates the rules on the merged transfer', async () => {
        const d = build();
        d.referralsRepo.findById.mockResolvedValue({
          id: 'ref1',
          patientProfileId: 'p1',
          statusConceptId: CEXT.REFERRAL_REQUESTED,
          transferRequired: true,
          transportMode: 'PRIVATE_VEHICLE',
          departureCondition: 'STABLE',
        });
        await expectReason(
          d.service.updateTransfer(
            'ref1',
            { departureCondition: 'UNSTABLE' },
            actor,
          ),
          400,
          ClinicalExtErrorReason.TRANSFER_UNSAFE_TRANSPORT,
        );
      });

      it('403 for who cannot write the history', async () => {
        const d = build();
        d.referralsRepo.findById.mockResolvedValue({
          id: 'ref1',
          patientProfileId: 'p1',
          statusConceptId: CEXT.REFERRAL_REQUESTED,
        });
        d.clinicalRead.assertCanWriteHistory.mockRejectedValue(
          new ForbiddenException(),
        );
        await expect(
          d.service.updateTransfer('ref1', { required: false }, actor),
        ).rejects.toBeInstanceOf(ForbiddenException);
      });

      it.each([
        ['REJECTED', CEXT.REFERRAL_REJECTED],
        ['CANCELLED', CEXT.REFERRAL_CANCELLED],
        ['COMPLETED', CEXT.REFERRAL_COMPLETED],
      ])('422 REFERRAL_ALREADY_CLOSED when %s', async (_name, status) => {
        const d = build();
        d.referralsRepo.findById.mockResolvedValue({
          id: 'ref1',
          patientProfileId: 'p1',
          statusConceptId: status,
        });
        await expectReason(
          d.service.updateTransfer('ref1', { required: false }, actor),
          422,
          ClinicalExtErrorReason.REFERRAL_ALREADY_CLOSED,
        );
      });

      it('422 REFERRAL_ARRIVAL_ALREADY_RECORDED once the patient arrived', async () => {
        const d = build();
        d.referralsRepo.findById.mockResolvedValue({
          id: 'ref1',
          patientProfileId: 'p1',
          statusConceptId: CEXT.REFERRAL_ACCEPTED,
          arrivedAt: new Date(),
        });
        await expectReason(
          d.service.updateTransfer('ref1', { required: false }, actor),
          422,
          ClinicalExtErrorReason.REFERRAL_ARRIVAL_ALREADY_RECORDED,
        );
      });

      it('404 for an unknown referral', async () => {
        const d = build();
        d.referralsRepo.findById.mockResolvedValue(null);
        await expectReason(
          d.service.updateTransfer('ref1', { required: false }, actor),
          404,
          ClinicalExtErrorReason.REFERRAL_NOT_FOUND,
        );
      });
    });

    describe('PATCH arrival (sólo el destino)', () => {
      const arrival = {
        arrivedAt: '2026-10-31T11:30:00Z',
        arrivalCondition: 'STABLE' as const,
        arrivalNotes: 'Ingresa a emergencias',
      };

      it('the destination tenant records the arrival', async () => {
        const d = build();
        const referral: any = {
          id: 'ref1',
          patientProfileId: 'p1',
          targetTenantId: ACTIVE_TENANT,
          statusConceptId: CEXT.REFERRAL_ACCEPTED,
          departedAt: new Date('2026-10-31T10:00:00Z'),
        };
        d.referralsRepo.findById.mockResolvedValue(referral);
        const res = await d.service.recordArrival(
          'ref1',
          arrival,
          destTenantActor,
        );
        expect(referral.arrivedAt).toEqual(new Date(arrival.arrivedAt));
        expect(res.transfer).toMatchObject({
          arrivalCondition: 'STABLE',
          arrivalNotes: 'Ingresa a emergencias',
        });
        expect(d.clinicalRead.assertCanWriteHistory).not.toHaveBeenCalled();
      });

      it('the destination practitioner records it', async () => {
        const d = build();
        d.referralsRepo.findById.mockResolvedValue({
          id: 'ref1',
          patientProfileId: 'p1',
          targetProfileId: 'pr-dest',
          statusConceptId: CEXT.REFERRAL_REQUESTED,
        });
        const res = await d.service.recordArrival('ref1', arrival, destActor);
        expect(res.transfer?.arrivalCondition).toBe('STABLE');
      });

      it('the destination branch tenant records it', async () => {
        const d = build();
        d.referralsRepo.findById.mockResolvedValue({
          id: 'ref1',
          patientProfileId: 'p1',
          targetBranchId: 'br1',
          statusConceptId: CEXT.REFERRAL_ACCEPTED,
        });
        d.tx.findOne.mockResolvedValue({ id: 'br1', tenantId: ACTIVE_TENANT });
        const res = await d.service.recordArrival(
          'ref1',
          arrival,
          destTenantActor,
        );
        expect(res.transfer?.arrivalCondition).toBe('STABLE');
      });

      it('404 (como inexistente) for whoever deriva or any other clinician', async () => {
        const d = build();
        d.referralsRepo.findById.mockResolvedValue({
          id: 'ref1',
          patientProfileId: 'p1',
          targetProfileId: 'pr-dest',
          statusConceptId: CEXT.REFERRAL_ACCEPTED,
        });
        await expectReason(
          d.service.recordArrival('ref1', arrival, doctor),
          404,
          ClinicalExtErrorReason.REFERRAL_NOT_FOUND,
        );
      });

      it('404 for the destination tenant actor without X-Tenant-Id', async () => {
        const d = build();
        d.referralsRepo.findById.mockResolvedValue({
          id: 'ref1',
          patientProfileId: 'p1',
          targetTenantId: ACTIVE_TENANT,
          statusConceptId: CEXT.REFERRAL_ACCEPTED,
        });
        await expectReason(
          d.raw.recordArrival('ref1', arrival, destTenantActor),
          404,
          ClinicalExtErrorReason.REFERRAL_NOT_FOUND,
        );
      });

      it('404 for an actor of another tenant', async () => {
        const d = build();
        d.referralsRepo.findById.mockResolvedValue({
          id: 'ref1',
          patientProfileId: 'p1',
          targetTenantId: 'ten-other',
          statusConceptId: CEXT.REFERRAL_ACCEPTED,
        });
        await expectReason(
          d.service.recordArrival('ref1', arrival, destTenantActor),
          404,
          ClinicalExtErrorReason.REFERRAL_NOT_FOUND,
        );
      });

      it('external-only destination: recorded by who can write the history', async () => {
        const d = build();
        d.referralsRepo.findById.mockResolvedValue({
          id: 'ref1',
          patientProfileId: 'p1',
          targetExternalName: 'Hospital Externo',
          statusConceptId: CEXT.REFERRAL_REQUESTED,
        });
        const res = await d.service.recordArrival('ref1', arrival, actor);
        expect(d.clinicalRead.assertCanWriteHistory).toHaveBeenCalledWith(
          'p1',
          actor,
        );
        expect(res.transfer?.arrivalCondition).toBe('STABLE');
      });

      it('external-only destination: 403 without write access', async () => {
        const d = build();
        d.referralsRepo.findById.mockResolvedValue({
          id: 'ref1',
          patientProfileId: 'p1',
          targetExternalName: 'Hospital Externo',
          statusConceptId: CEXT.REFERRAL_REQUESTED,
        });
        d.clinicalRead.assertCanWriteHistory.mockRejectedValue(
          new ForbiddenException(),
        );
        await expect(
          d.service.recordArrival('ref1', arrival, actor),
        ).rejects.toBeInstanceOf(ForbiddenException);
      });

      it('400 TRANSFER_ARRIVAL_BEFORE_DEPARTURE', async () => {
        const d = build();
        d.referralsRepo.findById.mockResolvedValue({
          id: 'ref1',
          patientProfileId: 'p1',
          targetTenantId: ACTIVE_TENANT,
          statusConceptId: CEXT.REFERRAL_ACCEPTED,
          departedAt: new Date('2026-10-31T12:00:00Z'),
        });
        await expectReason(
          d.service.recordArrival('ref1', arrival, destTenantActor),
          400,
          ClinicalExtErrorReason.TRANSFER_ARRIVAL_BEFORE_DEPARTURE,
        );
      });

      it.each([
        ['REJECTED', CEXT.REFERRAL_REJECTED],
        ['CANCELLED', CEXT.REFERRAL_CANCELLED],
      ])('422 REFERRAL_ALREADY_CLOSED when %s', async (_name, status) => {
        const d = build();
        d.referralsRepo.findById.mockResolvedValue({
          id: 'ref1',
          patientProfileId: 'p1',
          targetTenantId: ACTIVE_TENANT,
          statusConceptId: status,
        });
        await expectReason(
          d.service.recordArrival('ref1', arrival, destTenantActor),
          422,
          ClinicalExtErrorReason.REFERRAL_ALREADY_CLOSED,
        );
      });

      it('accepts the arrival of a completed referral (counter-referral first)', async () => {
        const d = build();
        d.referralsRepo.findById.mockResolvedValue({
          id: 'ref1',
          patientProfileId: 'p1',
          targetTenantId: ACTIVE_TENANT,
          statusConceptId: CEXT.REFERRAL_COMPLETED,
        });
        const res = await d.service.recordArrival(
          'ref1',
          arrival,
          destTenantActor,
        );
        expect(res.status).toBe('COMPLETED');
        expect(res.transfer?.arrivedAt).toEqual(new Date(arrival.arrivedAt));
      });

      it('422 REFERRAL_ARRIVAL_ALREADY_RECORDED', async () => {
        const d = build();
        d.referralsRepo.findById.mockResolvedValue({
          id: 'ref1',
          patientProfileId: 'p1',
          targetTenantId: ACTIVE_TENANT,
          statusConceptId: CEXT.REFERRAL_ACCEPTED,
          arrivedAt: new Date('2026-10-31T11:00:00Z'),
        });
        await expectReason(
          d.service.recordArrival('ref1', arrival, destTenantActor),
          422,
          ClinicalExtErrorReason.REFERRAL_ARRIVAL_ALREADY_RECORDED,
        );
      });
    });
  });
});
