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
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { CONS } from '../consent.concepts';

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

  const service = new HipaaAuthorizationsService(
    em as any,
    authRepo,
    eventsRepo,
    logger as any,
  );
  return { service, tx, authRepo, eventsRepo };
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
});
