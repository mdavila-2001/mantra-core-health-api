import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { ProfilesErrorReason } from '../../profiles/profiles.error-reasons';
import { AUTHZ } from '../authz.concepts';
import { AuthzPrimaryCareService } from './authz-primary-care.service';
import { AuthzPrimaryCareSyncService } from './authz-primary-care-sync.service';
import {
  ACTIVE_TENANT,
  buildClinicalScope,
  inTenant,
  thrown,
} from './authz-clinical-scope.testing';

const patient = {
  id: 'u-pat',
  roles: ['PATIENT'],
  patientProfileId: 'pat-1',
} as any;
const doctor = {
  id: 'u-doc',
  roles: ['CLINICIAN'],
  practitionerProfileId: 'prac-1',
} as any;

/** Builds the service under test with controlled dependencies. */
function build() {
  const calls: string[] = [];
  const tx = {
    flush: mockFn(async () => {
      calls.push('flush');
    }),
  };
  const em = {
    transactional: mockFn(async (cb: any) => {
      const result = await cb(tx);
      calls.push('commit');
      return result;
    }),
    fork: mockFn(() => ({})),
  };
  const careRepo = {
    findOpenPrimaryOfPair: mockFn().mockResolvedValue(null),
    findById: mockFn(),
    findActivePrimaryInTenant: mockFn().mockResolvedValue([]),
    create: mockFn(() => ({ id: 'cr-new', createdAt: new Date() })),
  };
  const practitionersRepo = {
    findById: mockFn().mockResolvedValue({ acceptsNewPatients: true }),
  };
  const accountLinksRepo = {
    findActiveByPerson: mockFn(async (_em: any, personId: string) =>
      personId === 'pat-1' ? { userId: 'u-pat' } : { userId: 'u-doc' },
    ),
  };
  const primaryRepo = {
    findCurrentByPatient: mockFn().mockResolvedValue(null),
    close: mockFn(() => calls.push('close-c')),
    open: mockFn(() => calls.push('open-c')),
  };
  const auditTrail = { record: mockFn().mockResolvedValue(undefined) };
  const outbox = { publishDomainEvent: mockFn().mockResolvedValue(undefined) };
  const notifications = {
    emitInApp: mockFn(async () => {
      calls.push('notice');
      return { suppressed: false };
    }),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const { scope } = buildClinicalScope();
  const sync = new AuthzPrimaryCareSyncService(
    careRepo as any,
    primaryRepo as any,
    auditTrail as any,
  );
  const service = new AuthzPrimaryCareService(
    em as any,
    scope,
    careRepo as any,
    practitionersRepo as any,
    accountLinksRepo as any,
    sync,
    auditTrail as any,
    outbox as any,
    notifications as any,
    logger as any,
  );
  return {
    service: inTenant(service),
    calls,
    tx,
    careRepo,
    practitionersRepo,
    accountLinksRepo,
    primaryRepo,
    auditTrail,
    outbox,
    notifications,
  };
}

describe('AuthzPrimaryCareService', () => {
  describe('requestAsPatient', () => {
    it('crea la solicitud PENDING de cabecera con el paciente como quien la inició y avisa al médico después del commit', async () => {
      const d = build();

      const res = await d.service.requestAsPatient(
        { practitionerProfileId: 'prac-1' } as any,
        patient,
      );

      expect(res).toMatchObject({
        id: 'cr-new',
        status: CONCEPTS.STATE_PENDING,
      });
      expect(d.careRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          tenantId: ACTIVE_TENANT,
          patientProfileId: 'pat-1',
          practitionerProfileId: 'prac-1',
          relationshipTypeConceptId: AUTHZ.CARE_REL_PRIMARY,
          statusConceptId: CONCEPTS.STATE_PENDING,
          actorUserId: 'u-pat',
        }),
      );
      expect(d.auditTrail.record).toHaveBeenCalledWith(
        d.tx,
        patient,
        expect.objectContaining({
          action: 'CARE_RELATIONSHIP_REQUESTED',
          entityId: 'cr-new',
        }),
      );
      expect(d.notifications.emitInApp).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientUserId: 'u-doc',
          category: 'CLINICAL',
        }),
      );
      expect(d.calls.indexOf('notice')).toBeGreaterThan(
        d.calls.indexOf('commit'),
      );
    });

    it('409 si el par ya tiene una cabecera activa o pendiente en el tenant, sin crear nada', async () => {
      const d = build();
      d.careRepo.findOpenPrimaryOfPair.mockResolvedValue({ id: 'cr-previa' });

      const error = await thrown(
        d.service.requestAsPatient(
          { practitionerProfileId: 'prac-1' } as any,
          patient,
        ),
      );

      expect(error).toBeInstanceOf(ConflictException);
      expect(d.careRepo.findOpenPrimaryOfPair).toHaveBeenCalledWith(
        d.tx,
        'pat-1',
        'prac-1',
        ACTIVE_TENANT,
      );
      expect(d.careRepo.create).not.toHaveBeenCalled();
      expect(d.notifications.emitInApp).not.toHaveBeenCalled();
    });

    it('422 si el profesional no acepta pacientes nuevos', async () => {
      const d = build();
      d.practitionersRepo.findById.mockResolvedValue({
        acceptsNewPatients: false,
      });

      await expect(
        d.service.requestAsPatient(
          { practitionerProfileId: 'prac-1' } as any,
          patient,
        ),
      ).rejects.toMatchObject({
        status: 422,
        reason: ProfilesErrorReason.PRIMARY_PRACTITIONER_NOT_ACCEPTING_PATIENTS,
      });
      expect(d.careRepo.create).not.toHaveBeenCalled();
    });

    it('sin declarar si acepta pacientes nuevos, no se le cierra la puerta', async () => {
      const d = build();
      d.practitionersRepo.findById.mockResolvedValue({
        acceptsNewPatients: undefined,
      });

      await d.service.requestAsPatient(
        { practitionerProfileId: 'prac-1' } as any,
        patient,
      );

      expect(d.careRepo.create).toHaveBeenCalledTimes(1);
    });

    it('422 si el paciente se elige a sí mismo', async () => {
      const d = build();

      await expect(
        d.service.requestAsPatient(
          { practitionerProfileId: 'pat-1' } as any,
          patient,
        ),
      ).rejects.toMatchObject({
        status: 422,
        reason: ProfilesErrorReason.PRIMARY_PRACTITIONER_SELF,
      });
      expect(d.careRepo.create).not.toHaveBeenCalled();
    });

    it('404 si el profesional no existe', async () => {
      const d = build();
      d.practitionersRepo.findById.mockResolvedValue(null);

      await expect(
        d.service.requestAsPatient(
          { practitionerProfileId: 'prac-x' } as any,
          patient,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('404 si la cuenta no tiene perfil de paciente', async () => {
      const d = build();

      await expect(
        d.service.requestAsPatient(
          { practitionerProfileId: 'prac-1' } as any,
          { id: 'u-x', roles: ['PATIENT'] } as any,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('si el médico no tiene cuenta activa, la solicitud queda creada sin aviso', async () => {
      const d = build();
      d.accountLinksRepo.findActiveByPerson.mockResolvedValue(null);

      const res = await d.service.requestAsPatient(
        { practitionerProfileId: 'prac-1' } as any,
        patient,
      );

      expect(res.id).toBe('cr-new');
      expect(d.notifications.emitInApp).not.toHaveBeenCalled();
    });
  });

  describe('respondAsPractitioner', () => {
    const pending = (): any => ({
      id: 'cr-1',
      tenantId: ACTIVE_TENANT,
      patientProfileId: 'pat-1',
      practitionerProfileId: 'prac-1',
      relationshipTypeConceptId: AUTHZ.CARE_REL_PRIMARY,
      statusConceptId: CONCEPTS.STATE_PENDING,
      establishedByUserId: 'u-pat',
      updatedAt: new Date(),
    });

    it('aceptar activa la cabecera, reemplaza la anterior y abre C con el flush entre medio', async () => {
      const d = build();
      const rel = pending();
      const previous: any = {
        id: 'cr-vieja',
        tenantId: ACTIVE_TENANT,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
      };
      d.careRepo.findById.mockResolvedValue(rel);
      d.careRepo.findActivePrimaryInTenant.mockResolvedValue([previous]);
      d.primaryRepo.findCurrentByPatient.mockResolvedValue({
        practitionerProfileId: 'prac-9',
      });

      const res = await d.service.respondAsPractitioner(
        'cr-1',
        { decision: 'ACCEPT' } as any,
        doctor,
      );

      expect(res).toEqual({ ok: true, affected: 1 });
      expect(previous.statusConceptId).toBe(CONCEPTS.STATE_REVOKED);
      expect(rel.statusConceptId).toBe(CONCEPTS.STATE_ACTIVE);
      expect(d.calls.slice(0, 3)).toEqual(['close-c', 'flush', 'open-c']);
      expect(d.primaryRepo.open).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          patientProfileId: 'pat-1',
          practitionerProfileId: 'prac-1',
          actorUserId: 'u-doc',
        }),
        expect.any(Date),
      );
      expect(d.auditTrail.record).toHaveBeenCalledWith(
        d.tx,
        doctor,
        expect.objectContaining({ action: 'CARE_RELATIONSHIP_ACCEPTED' }),
      );
      expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventType: 'authz.care_relationship.responded',
        }),
      );
    });

    it('rechazar deja la solicitud DECLINED y no toca B anterior ni C', async () => {
      const d = build();
      const rel = pending();
      d.careRepo.findById.mockResolvedValue(rel);

      await d.service.respondAsPractitioner(
        'cr-1',
        { decision: 'REJECT' } as any,
        doctor,
      );

      expect(rel.statusConceptId).toBe(AUTHZ.CARE_REL_STATUS_DECLINED);
      expect(rel.validTo).toBeInstanceOf(Date);
      expect(d.careRepo.findActivePrimaryInTenant).not.toHaveBeenCalled();
      expect(d.primaryRepo.open).not.toHaveBeenCalled();
      expect(d.auditTrail.record).toHaveBeenCalledWith(
        d.tx,
        doctor,
        expect.objectContaining({ action: 'CARE_RELATIONSHIP_REJECTED' }),
      );
    });

    it('la solicitud dirigida a otro profesional responde 404 y no se modifica', async () => {
      const d = build();
      const rel = pending();
      d.careRepo.findById.mockResolvedValue(rel);

      await expect(
        d.service.respondAsPractitioner('cr-1', { decision: 'ACCEPT' } as any, {
          ...doctor,
          practitionerProfileId: 'prac-AJENO',
        }),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(rel.statusConceptId).toBe(CONCEPTS.STATE_PENDING);
      expect(d.primaryRepo.open).not.toHaveBeenCalled();
    });

    it('una cuenta sin perfil profesional tampoco la ve', async () => {
      const d = build();
      d.careRepo.findById.mockResolvedValue(pending());

      await expect(
        d.service.respondAsPractitioner(
          'cr-1',
          { decision: 'ACCEPT' } as any,
          { id: 'u-x', roles: ['CLINICIAN'] } as any,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('422 si no es una cabecera pendiente', async () => {
      const d = build();
      d.careRepo.findById.mockResolvedValue({
        ...pending(),
        relationshipTypeConceptId: AUTHZ.CARE_REL_TREATING,
      });
      await expect(
        d.service.respondAsPractitioner(
          'cr-1',
          { decision: 'ACCEPT' } as any,
          doctor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);

      d.careRepo.findById.mockResolvedValue({
        ...pending(),
        statusConceptId: CONCEPTS.STATE_ACTIVE,
      });
      await expect(
        d.service.respondAsPractitioner(
          'cr-1',
          { decision: 'ACCEPT' } as any,
          doctor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('422 si la cabecera no la inició el paciente (la pidió el propio médico)', async () => {
      const d = build();
      const rel = { ...pending(), establishedByUserId: 'u-doc' };
      d.careRepo.findById.mockResolvedValue(rel);

      await expect(
        d.service.respondAsPractitioner(
          'cr-1',
          { decision: 'ACCEPT' } as any,
          doctor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(rel.statusConceptId).toBe(CONCEPTS.STATE_PENDING);
    });
  });
});
