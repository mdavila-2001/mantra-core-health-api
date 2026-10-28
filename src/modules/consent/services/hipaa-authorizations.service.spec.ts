import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { HipaaAuthorizationsService } from './hipaa-authorizations.service';
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
  const authRepo = {
    create: mockFn(),
    findById: mockFn(),
    findExpirable: mockFn().mockResolvedValue([]),
  };
  const eventsRepo = { record: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const scope = buildScope();
  const raw = new HipaaAuthorizationsService(
    em as any,
    authRepo,
    eventsRepo,
    scope.scope,
    logger as any,
  );
  return {
    service: inTenant(raw),
    raw,
    scope,
    logger,
    tx,
    authRepo,
    eventsRepo,
  };
}

describe('HipaaAuthorizationsService', () => {
  describe('grant (UC-07-04)', () => {
    it('rejects DATE expiration without expiresAt', async () => {
      const d = build();
      await expect(
        d.service.grant(
          {
            patientProfileId: 'p1',
            processingPurposeId: 'pp1',
            expirationType: 'DATE',
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('grants an authorization and records the authorized event', async () => {
      const d = build();
      const created = {
        id: 'h1',
        patientProfileId: 'p1',
        statusConceptId: CONS.HIPAA_ACTIVE,
        createdAt: new Date(),
      };
      d.authRepo.create.mockReturnValue(created);

      const res = await d.service.grant(
        {
          patientProfileId: 'p1',
          processingPurposeId: 'pp1',
          recipientDescription: 'Dr X',
          informationDescription: 'labs',
          expirationType: 'DATE',
          expiresAt: '2027-01-01T00:00:00.000Z',
        } as any,
        actor,
      );

      expect(res).toEqual({
        id: 'h1',
        patientProfileId: 'p1',
        status: CONS.HIPAA_ACTIVE,
        createdAt: created.createdAt,
      });
      expect(d.tx.flush).toHaveBeenCalled();
      expect(d.eventsRepo.record).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ eventTypeConceptId: CONS.EVENT_AUTHORIZED }),
      );
    });
  });

  describe('revoke (UC-07-05)', () => {
    it('throws when the authorization does not exist', async () => {
      const d = build();
      d.authRepo.findById.mockResolvedValue(null);
      await expect(d.service.revoke('missing', actor)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });

    it('rejects revoking an authorization that is not active', async () => {
      const d = build();
      d.authRepo.findById.mockResolvedValue({
        id: 'h1',
        tenantId: ACTIVE_TENANT,
        statusConceptId: CONS.HIPAA_REVOKED,
      });
      await expect(d.service.revoke('h1', actor)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('revokes an active authorization', async () => {
      const d = build();
      const auth = {
        id: 'h1',
        tenantId: ACTIVE_TENANT,
        statusConceptId: CONS.HIPAA_ACTIVE,
        updatedAt: new Date(),
      };
      d.authRepo.findById.mockResolvedValue(auth);

      const res = await d.service.revoke('h1', actor);

      expect(res).toEqual({ ok: true });
      expect(auth.statusConceptId).toBe(CONS.HIPAA_REVOKED);
      expect(d.eventsRepo.record).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ eventTypeConceptId: CONS.EVENT_REVOKED }),
      );
    });
  });

  describe('tenant y referencias de la autorización (CON-01)', () => {
    const body = {
      patientProfileId: 'p1',
      processingPurposeId: 'pp1',
      recipientDescription: 'Dr X',
      informationDescription: 'labs',
      expirationType: 'DATE',
      expiresAt: '2027-01-01T00:00:00.000Z',
    } as any;

    it('la autorización nace en el tenant del contexto', async () => {
      const d = build();
      d.authRepo.create.mockReturnValue({
        id: 'h1',
        patientProfileId: 'p1',
        statusConceptId: CONS.HIPAA_ACTIVE,
        createdAt: new Date(),
      });
      await d.service.grant(body, actor);
      expect(d.authRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ tenantId: ACTIVE_TENANT }),
      );
    });

    it('un tenantId del cuerpo ajeno da 403 CONSENT_TENANT_SCOPE_REQUIRED y no persiste', async () => {
      const d = build();
      const err = await thrown(
        d.service.grant({ ...body, tenantId: 'ten-otro' }, actor),
      );
      expect(err.getStatus()).toBe(403);
      expect(err.reason).toBe(ConsentErrorReason.CONSENT_TENANT_SCOPE_REQUIRED);
      expect(d.authRepo.create).not.toHaveBeenCalled();
    });

    it('un paciente o un propósito inexistentes dan 404 y no persisten', async () => {
      const d = build();
      d.scope.patientProfilesRepo.findById.mockResolvedValue(null);
      await expect(d.service.grant(body, actor)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
      d.scope.patientProfilesRepo.findById.mockResolvedValue({
        profileId: 'p1',
      });
      d.scope.purposesRepo.findById.mockResolvedValue(null);
      const err = await thrown(d.service.grant(body, actor));
      expect(err.reason).toBe(ConsentErrorReason.PROCESSING_PURPOSE_NOT_FOUND);
      expect(d.authRepo.create).not.toHaveBeenCalled();
    });

    it('sin tenant en el contexto no hay tenant por defecto', async () => {
      const d = build();
      await expect(d.raw.grant(body, actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
      expect(d.authRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('alcance por tenant de la revocación (CON-02)', () => {
    it('una autorización de otro tenant responde igual que una inexistente y no cambia', async () => {
      const d = build();
      d.authRepo.findById.mockResolvedValue(null);
      const missing = await thrown(d.service.revoke('h1', actor));
      const auth = {
        id: 'h1',
        tenantId: 'ten-otro',
        statusConceptId: CONS.HIPAA_ACTIVE,
      };
      d.authRepo.findById.mockResolvedValue(auth);
      const foreign = await thrown(d.service.revoke('h1', actor));
      expect(foreign).toBeInstanceOf(ResourceNotFoundException);
      expect(foreign.getResponse()).toEqual(missing.getResponse());
      expect(foreign.reason).toBe(
        ConsentErrorReason.HIPAA_AUTHORIZATION_NOT_FOUND,
      );
      expect(foreign.details).toBeUndefined();
      expect(auth.statusConceptId).toBe(CONS.HIPAA_ACTIVE);
      expect(d.eventsRepo.record).not.toHaveBeenCalled();
      expect(d.logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'consent.hipaa.revoke',
          authId: 'h1',
        }),
        expect.any(String),
      );
    });

    it('sin tenant en el contexto falla antes de consultar', async () => {
      const d = build();
      await expect(d.raw.revoke('h1', actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
      expect(d.authRepo.findById).not.toHaveBeenCalled();
    });
  });
});
