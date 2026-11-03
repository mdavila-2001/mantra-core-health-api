import { jest } from '@jest/globals';

// Fábrica de mocks laxa: mantiene el 'jest' de runtime pero evita el tipado estricto Mock<never>.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ConsentsService } from './consents.service';
import {
  ConflictException,
  DomainException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { CONS } from '../consent.concepts';
import { ConsentErrorReason } from '../consent.error-reasons';
import {
  ACTIVE_TENANT,
  buildScope,
  inTenant,
  thrown,
} from './consent-scope.testing';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const consentsRepo = {
    findActiveByPurpose: mockFn(),
    findById: mockFn(),
    create: mockFn(),
    findExpirable: mockFn().mockResolvedValue([]),
    // Las dos lecturas de FT-07-R05. `ConsentsService` no las usa —son de
    // `PractitionerAccessRequestsService`— pero el doble se pasa tipado como
    // `ConsentsRepository`, así que el contrato tiene que estar completo o
    // `yarn typecheck` no compila.
    findByPatientCreatorCategory: mockFn().mockResolvedValue([]),
    findPendingForPatient: mockFn().mockResolvedValue([]),
  };
  const provisionsRepo = {
    findOpenByConsent: mockFn().mockResolvedValue([]),
    create: mockFn(),
  };
  const eventsRepo = { record: mockFn() };
  const clinicalGrantsRepo = {
    revokeForConsent: mockFn().mockResolvedValue(0),
  };
  const auditTrail = { record: mockFn().mockResolvedValue(undefined) };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const scope = buildScope();

  const raw = new ConsentsService(
    em as any,
    consentsRepo,
    provisionsRepo,
    eventsRepo,
    clinicalGrantsRepo as any,
    auditTrail as any,
    scope.scope,
    logger as any,
  );
  return {
    service: inTenant(raw),
    raw,
    scope,
    logger,
    tx,
    consentsRepo,
    provisionsRepo,
    eventsRepo,
    clinicalGrantsRepo,
    auditTrail,
  };
}

describe('ConsentsService', () => {
  describe('capture (UC-07-01)', () => {
    it('creates consent, flushes parent before children and records the granted event', async () => {
      const d = build();
      d.consentsRepo.findActiveByPurpose.mockResolvedValue(null);
      const created = {
        id: 'c1',
        patientProfileId: 'p1',
        statusConceptId: CONS.CONSENT_ACTIVE,
        processingPurposeId: 'pp1',
        createdAt: new Date('2026-01-01'),
      };
      d.consentsRepo.create.mockReturnValue(created);

      const res = await d.service.capture(
        {
          patientProfileId: 'p1',
          processingPurposeId: 'pp1',
          provisions: [{ action: 'PERMIT' }],
        } as any,
        actor,
      );

      expect(res).toEqual({
        id: 'c1',
        patientProfileId: 'p1',
        status: CONS.CONSENT_ACTIVE,
        processingPurposeId: 'pp1',
        createdAt: created.createdAt,
      });
      expect(d.tx.flush).toHaveBeenCalledTimes(1);
      expect(d.provisionsRepo.create).toHaveBeenCalledTimes(1);
      expect(d.eventsRepo.record).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ eventTypeConceptId: CONS.EVENT_GRANTED }),
      );
    });

    it('rejects when an active consent already exists for the purpose', async () => {
      const d = build();
      d.consentsRepo.findActiveByPurpose.mockResolvedValue({ id: 'existing' });

      await expect(
        d.service.capture(
          { patientProfileId: 'p1', processingPurposeId: 'pp1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(d.consentsRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('withdraw (UC-07-02)', () => {
    it('throws when the consent does not exist', async () => {
      const d = build();
      d.consentsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.withdraw('missing', {} as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects withdrawing a consent that is not active', async () => {
      const d = build();
      d.consentsRepo.findById.mockResolvedValue({
        id: 'c1',
        tenantId: ACTIVE_TENANT,
        statusConceptId: CONS.CONSENT_WITHDRAWN,
      });
      await expect(
        d.service.withdraw('c1', {} as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('withdraws an active consent and records the withdrawn event', async () => {
      const d = build();
      const consent = {
        id: 'c1',
        tenantId: ACTIVE_TENANT,
        statusConceptId: CONS.CONSENT_ACTIVE,
        updatedAt: new Date(),
      };
      d.consentsRepo.findById.mockResolvedValue(consent);

      const res = await d.service.withdraw(
        'c1',
        { withdrawalReasonConceptId: 'r1' },
        actor,
      );

      expect(res).toEqual({ ok: true });
      expect(consent.statusConceptId).toBe(CONS.CONSENT_WITHDRAWN);
      expect(d.eventsRepo.record).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ eventTypeConceptId: CONS.EVENT_WITHDRAWN }),
      );
      // C-20: propaga la revocación a los accesos clínicos dependientes.
      expect(d.clinicalGrantsRepo.revokeForConsent).toHaveBeenCalledWith(
        d.tx,
        'c1',
        actor.id,
        expect.any(Date),
      );
      // CAN-AUDIT-001: sella el retiro en la cadena WORM.
      expect(d.auditTrail.record).toHaveBeenCalledWith(
        d.tx,
        actor,
        expect.objectContaining({ action: 'CONSENT_WITHDRAWN' }),
      );
    });
  });

  describe('amendProvisions (UC-07-09)', () => {
    it('soft-closes open provisions and inserts the new ones', async () => {
      const d = build();
      d.consentsRepo.findById.mockResolvedValue({
        id: 'c1',
        tenantId: ACTIVE_TENANT,
        statusConceptId: CONS.CONSENT_ACTIVE,
        updatedAt: new Date(),
      });
      const open = { id: 'pr-old', updatedAt: new Date() };
      d.provisionsRepo.findOpenByConsent.mockResolvedValue([open]);

      const res = await d.service.amendProvisions(
        'c1',
        { provisions: [{ action: 'DENY' }, { action: 'PERMIT' }] } as any,
        actor,
      );

      expect(res).toEqual({ ok: true });
      expect((open as any).validTo).toBeInstanceOf(Date);
      expect(d.provisionsRepo.create).toHaveBeenCalledTimes(2);
      expect(d.eventsRepo.record).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventTypeConceptId: CONS.EVENT_PROVISIONS_AMENDED,
        }),
      );
    });
  });

  describe('tenant y referencias de la decisión (CON-01)', () => {
    const body = { patientProfileId: 'p1', processingPurposeId: 'pp1' } as any;
    const created = {
      id: 'c1',
      patientProfileId: 'p1',
      statusConceptId: CONS.CONSENT_ACTIVE,
      processingPurposeId: 'pp1',
      createdAt: new Date('2026-01-01'),
    };

    it('Correcto: el consentimiento nace en el tenant del contexto aunque el cuerpo no lo traiga', async () => {
      const d = build();
      d.consentsRepo.findActiveByPurpose.mockResolvedValue(null);
      d.consentsRepo.create.mockReturnValue(created);
      await d.service.capture(body, actor);
      expect(d.consentsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ tenantId: ACTIVE_TENANT }),
      );
    });

    it('Límite: un tenantId del cuerpo igual al activo se acepta', async () => {
      const d = build();
      d.consentsRepo.findActiveByPurpose.mockResolvedValue(null);
      d.consentsRepo.create.mockReturnValue(created);
      await expect(
        d.service.capture({ ...body, tenantId: ACTIVE_TENANT }, actor),
      ).resolves.toMatchObject({ id: 'c1' });
    });

    it('Falla catalogada: un tenantId del cuerpo ajeno da 403 CONSENT_TENANT_SCOPE_REQUIRED y no persiste', async () => {
      const d = build();
      const err = await thrown(
        d.service.capture({ ...body, tenantId: 'ten-otro' }, actor),
      );
      expect(err.getStatus()).toBe(403);
      expect(err.reason).toBe(ConsentErrorReason.CONSENT_TENANT_SCOPE_REQUIRED);
      expect(d.consentsRepo.create).not.toHaveBeenCalled();
      expect(d.eventsRepo.record).not.toHaveBeenCalled();
    });

    it('Error: sin tenant en el contexto no hay tenant por defecto: falla sin persistir', async () => {
      const d = build();
      await expect(d.raw.capture(body, actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
      expect(d.consentsRepo.create).not.toHaveBeenCalled();
    });

    it('Error: un paciente inexistente da 404 y no persiste', async () => {
      const d = build();
      d.scope.patientProfilesRepo.findById.mockResolvedValue(null);
      const err = await thrown(d.service.capture(body, actor));
      expect(err).toBeInstanceOf(ResourceNotFoundException);
      expect(err.reason).toBe(ConsentErrorReason.PATIENT_PROFILE_NOT_FOUND);
      expect(d.consentsRepo.create).not.toHaveBeenCalled();
    });

    it('Error: un propósito inexistente da 404 y no persiste', async () => {
      const d = build();
      d.scope.purposesRepo.findById.mockResolvedValue(null);
      const err = await thrown(d.service.capture(body, actor));
      expect(err.reason).toBe(ConsentErrorReason.PROCESSING_PURPOSE_NOT_FOUND);
      expect(d.consentsRepo.create).not.toHaveBeenCalled();
    });

    it('Error: una base legal de otro tenant responde igual que una inexistente', async () => {
      const d = build();
      d.scope.legalBasesRepo.findById.mockResolvedValue(null);
      const missing = await thrown(
        d.service.capture({ ...body, processingLegalBasisId: 'lb1' }, actor),
      );
      d.scope.legalBasesRepo.findById.mockResolvedValue({
        id: 'lb1',
        tenantId: 'ten-otro',
        processingPurposeId: 'pp1',
      });
      const foreign = await thrown(
        d.service.capture({ ...body, processingLegalBasisId: 'lb1' }, actor),
      );
      expect(foreign).toBeInstanceOf(ResourceNotFoundException);
      expect(foreign.getResponse()).toEqual(missing.getResponse());
      expect(foreign.details).toBeUndefined();
      expect(d.consentsRepo.create).not.toHaveBeenCalled();
    });

    it('Falla catalogada: una base legal de otro propósito da 422 CONSENT_LEGAL_BASIS_PURPOSE_MISMATCH', async () => {
      const d = build();
      d.scope.legalBasesRepo.findById.mockResolvedValue({
        id: 'lb1',
        tenantId: ACTIVE_TENANT,
        processingPurposeId: 'pp-otro',
      });
      const err = await thrown(
        d.service.capture({ ...body, processingLegalBasisId: 'lb1' }, actor),
      );
      expect(err).toBeInstanceOf(PreconditionFailedException);
      expect(err.reason).toBe(
        ConsentErrorReason.CONSENT_LEGAL_BASIS_PURPOSE_MISMATCH,
      );
      expect(d.consentsRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('alcance por tenant de las mutaciones (CON-02)', () => {
    const foreignConsent = () => ({
      id: 'c1',
      tenantId: 'ten-otro',
      patientProfileId: 'p1',
      statusConceptId: CONS.CONSENT_ACTIVE,
    });

    it('withdraw: un consentimiento de otro tenant responde igual que uno inexistente y no cambia nada', async () => {
      const d = build();
      d.consentsRepo.findById.mockResolvedValue(null);
      const missing = await thrown(d.service.withdraw('c1', {} as any, actor));
      const consent = foreignConsent();
      d.consentsRepo.findById.mockResolvedValue(consent);
      const foreign = await thrown(d.service.withdraw('c1', {} as any, actor));

      expect(foreign).toBeInstanceOf(ResourceNotFoundException);
      expect(foreign.getStatus()).toBe(404);
      expect(foreign.getResponse()).toEqual(missing.getResponse());
      expect(foreign.reason).toBe(ConsentErrorReason.CONSENT_NOT_FOUND);
      expect(foreign.details).toBeUndefined();
      expect(consent.statusConceptId).toBe(CONS.CONSENT_ACTIVE);
      expect(d.eventsRepo.record).not.toHaveBeenCalled();
      expect(d.clinicalGrantsRepo.revokeForConsent).not.toHaveBeenCalled();
      expect(d.auditTrail.record).not.toHaveBeenCalled();
      // La denegación queda registrada con ids, sin contenido clínico.
      expect(d.logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'consent.consent.withdraw',
          consentId: 'c1',
        }),
        expect.any(String),
      );
    });

    it('withdraw: un consentimiento sin tenant (legado) tampoco se mutua', async () => {
      const d = build();
      d.consentsRepo.findById.mockResolvedValue({
        ...foreignConsent(),
        tenantId: undefined,
      });
      await expect(
        d.service.withdraw('c1', {} as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.clinicalGrantsRepo.revokeForConsent).not.toHaveBeenCalled();
    });

    it('amendProvisions: un consentimiento de otro tenant responde 404 uniforme y no toca las provisiones', async () => {
      const d = build();
      d.consentsRepo.findById.mockResolvedValue(null);
      const missing = await thrown(
        d.service.amendProvisions('c1', { provisions: [] } as any, actor),
      );
      d.consentsRepo.findById.mockResolvedValue(foreignConsent());
      const foreign = await thrown(
        d.service.amendProvisions(
          'c1',
          { provisions: [{ action: 'DENY' }] } as any,
          actor,
        ),
      );
      expect(foreign.getResponse()).toEqual(missing.getResponse());
      expect(d.provisionsRepo.findOpenByConsent).not.toHaveBeenCalled();
      expect(d.provisionsRepo.create).not.toHaveBeenCalled();
      expect(d.eventsRepo.record).not.toHaveBeenCalled();
    });

    it('withdraw/amend sin tenant en el contexto fallan antes de consultar', async () => {
      const d = build();
      await expect(
        d.raw.withdraw('c1', {} as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      await expect(
        d.raw.amendProvisions('c1', { provisions: [] } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.consentsRepo.findById).not.toHaveBeenCalled();
    });

    describe('withdrawAsOwner (titular)', () => {
      it('retira el consentimiento propio sin depender del tenant del contexto', async () => {
        const d = build();
        const consent = {
          id: 'c1',
          tenantId: 'ten-otro',
          patientProfileId: 'p1',
          statusConceptId: CONS.CONSENT_ACTIVE,
          updatedAt: new Date(),
        };
        d.consentsRepo.findById.mockResolvedValue(consent);
        // `raw`: la sesión del titular no fija tenant.
        await expect(
          d.raw.withdrawAsOwner('c1', 'p1', {} as any, actor),
        ).resolves.toEqual({ ok: true });
        expect(consent.statusConceptId).toBe(CONS.CONSENT_WITHDRAWN);
      });

      it('el consentimiento de otra persona responde 404 uniforme y no cambia nada', async () => {
        const d = build();
        const consent = {
          id: 'c1',
          tenantId: ACTIVE_TENANT,
          patientProfileId: 'p-otro',
          statusConceptId: CONS.CONSENT_ACTIVE,
        };
        d.consentsRepo.findById.mockResolvedValue(consent);
        const err = await thrown(
          d.raw.withdrawAsOwner('c1', 'p1', {} as any, actor),
        );
        expect(err).toBeInstanceOf(ResourceNotFoundException);
        expect(err.reason).toBe(ConsentErrorReason.CONSENT_NOT_FOUND);
        expect(err.details).toBeUndefined();
        expect(consent.statusConceptId).toBe(CONS.CONSENT_ACTIVE);
        expect(d.clinicalGrantsRepo.revokeForConsent).not.toHaveBeenCalled();
      });
    });
  });
});
