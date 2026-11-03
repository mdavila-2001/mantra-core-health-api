import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { PrivacyRestrictionsService } from './privacy-restrictions.service';
import {
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
  const restrictionsRepo = { create: mockFn() };
  const eventsRepo = { record: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const scope = buildScope();
  const raw = new PrivacyRestrictionsService(
    em as any,
    restrictionsRepo as any,
    eventsRepo,
    scope.scope,
    logger as any,
  );
  return {
    service: inTenant(raw),
    raw,
    scope,
    tx,
    restrictionsRepo,
    eventsRepo,
  };
}

describe('PrivacyRestrictionsService', () => {
  it('apply (UC-07-07) creates an active restriction and records the applied event', async () => {
    const d = build();
    const created = {
      id: 'r1',
      patientProfileId: 'p1',
      statusConceptId: CONS.RESTRICTION_ACTIVE,
      createdAt: new Date(),
    };
    d.restrictionsRepo.create.mockReturnValue(created);

    const res = await d.service.apply(
      { patientProfileId: 'p1', dataClassConceptId: 'dc1' },
      actor,
    );

    expect(res).toEqual({
      id: 'r1',
      patientProfileId: 'p1',
      status: CONS.RESTRICTION_ACTIVE,
      createdAt: created.createdAt,
    });
    expect(d.tx.flush).toHaveBeenCalled();
    expect(d.eventsRepo.record).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        eventTypeConceptId: CONS.EVENT_RESTRICTION_APPLIED,
      }),
    );
  });

  describe('tenant y paciente de la restricción (CON-01)', () => {
    const body = { patientProfileId: 'p1', dataClassConceptId: 'dc1' } as any;

    it('la restricción nace en el tenant del contexto', async () => {
      const d = build();
      d.restrictionsRepo.create.mockReturnValue({
        id: 'r1',
        patientProfileId: 'p1',
        statusConceptId: CONS.RESTRICTION_ACTIVE,
        createdAt: new Date(),
      });
      await d.service.apply(body, actor);
      expect(d.restrictionsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ tenantId: ACTIVE_TENANT }),
      );
    });

    it('un tenantId del cuerpo ajeno da 403 CONSENT_TENANT_SCOPE_REQUIRED y no persiste', async () => {
      const d = build();
      const err = await thrown(
        d.service.apply({ ...body, tenantId: 'ten-otro' }, actor),
      );
      expect(err.getStatus()).toBe(403);
      expect(err.reason).toBe(ConsentErrorReason.CONSENT_TENANT_SCOPE_REQUIRED);
      expect(d.restrictionsRepo.create).not.toHaveBeenCalled();
      expect(d.eventsRepo.record).not.toHaveBeenCalled();
    });

    it('un paciente inexistente da 404 y no persiste', async () => {
      const d = build();
      d.scope.patientProfilesRepo.findById.mockResolvedValue(null);
      await expect(d.service.apply(body, actor)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
      expect(d.restrictionsRepo.create).not.toHaveBeenCalled();
    });

    it('sin tenant en el contexto no hay tenant por defecto', async () => {
      const d = build();
      await expect(d.raw.apply(body, actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
      expect(d.restrictionsRepo.create).not.toHaveBeenCalled();
    });
  });
});
