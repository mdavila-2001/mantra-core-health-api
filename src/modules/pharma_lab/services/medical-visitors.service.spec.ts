import { jest } from '@jest/globals';

/**
 * Crea una función simulada con la implementación dada.
 *
 * @param impl - Implementación que ejecuta el doble.
 * @returns La función simulada.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { MedicalVisitorsService } from './medical-visitors.service';
import { PHL } from '../pharma_lab.concepts';
import { CONCEPTS } from '../../../common';

const LAB = '11111111-1111-1111-1111-111111111111';
const TENANT = '22222222-2222-2222-2222-222222222222';
const VISITOR = '33333333-3333-3333-3333-333333333333';
const USER = '44444444-4444-4444-4444-444444444444';
const DOCTOR = '55555555-5555-5555-5555-555555555555';

const ACTOR = { id: '99999999-9999-9999-9999-999999999999' } as any;

/** Laboratorio activo por defecto. */
function lab(overrides: Record<string, unknown> = {}): Record<string, any> {
  return {
    id: LAB,
    tenantId: TENANT,
    legalName: 'Laboratorios Andes S.A.',
    statusConceptId: PHL.LAB_ACTIVE,
    ...overrides,
  };
}

/** Visitador con vinculación activa por defecto. */
function visitor(overrides: Record<string, unknown> = {}): Record<string, any> {
  return {
    id: VISITOR,
    pharmaLabId: LAB,
    userId: USER,
    fullName: 'Ana Quiroga',
    internalCode: 'VM-001',
    startedOn: '2026-01-05',
    statusConceptId: PHL.LINK_ACTIVE,
    publiclyListed: true,
    updatedAt: new Date(),
    ...overrides,
  };
}

/** Solicitud de visita viva. */
function openRequest(
  overrides: Record<string, unknown> = {},
): Record<string, any> {
  return {
    id: '66666666-6666-6666-6666-666666666666',
    doctorUserId: DOCTOR,
    doctorTenantId: TENANT,
    medicalVisitorId: VISITOR,
    statusConceptId: PHL.VISIT_CONFIRMED,
    requestedStartAt: new Date('2026-09-01T15:00:00Z'),
    durationMinutes: 30,
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 *
 * @param options - Estado inicial de los dobles.
 * @returns El servicio y los dobles, para poder afirmar sobre ellos.
 */
function build(
  options: {
    /** Laboratorio devuelto por el repositorio. */
    labRow?: Record<string, any>;
    /** Visitador devuelto por el repositorio. */
    visitorRow?: Record<string, any>;
    /** Solicitudes vivas del visitador. */
    openRequests?: Record<string, any>[];
    /** Cuenta devuelta por `iam.users`. */
    userRow?: Record<string, any> | null;
  } = {},
) {
  const labRow = options.labRow ?? lab();
  const visitorRow = options.visitorRow ?? visitor();
  const userRow =
    options.userRow === undefined
      ? {
          id: USER,
          statusConceptId: CONCEPTS.USER_ACTIVE,
          updatedAt: new Date(),
        }
      : options.userRow;

  const repo = {
    findVisitor: mockFn(async () => visitorRow),
    findVisitorByUser: mockFn(async () => visitorRow),
    findVisitorByCode: mockFn(async () => null),
    listVisitors: mockFn(async () => [visitorRow]),
    createVisitor: mockFn(() => visitorRow),
    replaceSpecialties: mockFn(async () => undefined),
    replaceProducts: mockFn(async () => undefined),
    listSpecialties: mockFn(async () => []),
    listAuthorizedProducts: mockFn(async () => []),
    revokeSessions: mockFn(async () => 3),
    revokeRefreshTokens: mockFn(async () => 2),
  };
  const orgRepo = {
    findLab: mockFn(async () => labRow),
    findStaffByUser: mockFn(async () => null),
    appendLinkEvent: mockFn(() => ({ id: 'evt' })),
  };
  const visitsRepo = {
    listOpenRequestsOfVisitor: mockFn(async () => options.openRequests ?? []),
    appendRequestEvent: mockFn(() => ({ id: 'evt' })),
  };
  const catalog = { findProductsByIds: mockFn(async () => []) };
  const notifications = { notify: mockFn(), notifyAll: mockFn() };
  const audit = { record: mockFn(async () => undefined) };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const em: any = {
    transactional: mockFn((cb: any) => cb(em)),
    flush: mockFn(async () => undefined),
    findOne: mockFn(async () => userRow),
  };

  const access = {
    requireLab: mockFn(async () => labRow),
    requireActiveLab: mockFn(async () => {
      if (labRow.statusConceptId !== PHL.LAB_ACTIVE) {
        throw new Error('El laboratorio no está activo');
      }
      return labRow;
    }),
    requireVisitorOfLab: mockFn(async () => visitorRow),
  };

  const service = new MedicalVisitorsService(
    em,
    repo as any,
    orgRepo as any,
    visitsRepo as any,
    catalog as any,
    access as any,
    notifications as any,
    audit as any,
    logger as any,
  );

  return {
    service,
    repo,
    orgRepo,
    visitsRepo,
    notifications,
    audit,
    labRow,
    visitorRow,
    userRow,
  };
}

describe('MedicalVisitorsService', () => {
  describe('alta', () => {
    it('rechaza registrar un visitador si el laboratorio no está activo', async () => {
      const { service } = build({
        labRow: lab({ statusConceptId: PHL.LAB_SUSPENDED }),
      });

      await expect(
        service.createVisitor(
          LAB,
          {
            userId: USER,
            fullName: 'Ana Quiroga',
            internalCode: 'VM-001',
            startedOn: '2026-01-05',
          } as any,
          ACTOR,
        ),
      ).rejects.toThrow('El laboratorio no está activo');
    });
  });

  describe('desvinculación', () => {
    it('cierra sesiones, revoca tokens y bloquea la cuenta', async () => {
      const { service, repo, userRow } = build();

      const result = await service.unlinkVisitor(
        LAB,
        VISITOR,
        { reason: 'Fin de contrato' },
        ACTOR,
      );

      expect(result.statusConceptId).toBe(PHL.LINK_TERMINATED);
      expect(result.revokedSessions).toBe(3);
      expect(result.revokedRefreshTokens).toBe(2);
      expect(repo.revokeSessions).toHaveBeenCalledWith(expect.anything(), USER);
      // La cuenta queda bloqueada: `iam` exige USER_ACTIVE para autenticar.
      expect((userRow as any).statusConceptId).toBe(CONCEPTS.USER_LOCKED);
    });

    it('deja de mostrar el perfil públicamente y guarda el motivo', async () => {
      const { service, visitorRow } = build();

      await service.unlinkVisitor(
        LAB,
        VISITOR,
        { reason: 'Incumplimiento' },
        ACTOR,
      );

      expect(visitorRow.publiclyListed).toBe(false);
      expect(visitorRow.unlinkReason).toBe('Incumplimiento');
      expect(visitorRow.unlinkedAt).toBeInstanceOf(Date);
    });

    it('retira las autorizaciones de producto', async () => {
      const { service, repo } = build();

      await service.unlinkVisitor(LAB, VISITOR, { reason: 'Baja' }, ACTOR);

      expect(repo.replaceProducts).toHaveBeenCalledWith(
        expect.anything(),
        VISITOR,
        [],
        expect.any(String),
        ACTOR.id,
      );
    });

    it('cancela las visitas vivas y avisa al doctor', async () => {
      const request = openRequest();
      const { service, notifications } = build({ openRequests: [request] });

      const result = await service.unlinkVisitor(
        LAB,
        VISITOR,
        { reason: 'Baja' },
        ACTOR,
      );

      expect(result.cancelledVisitRequests).toBe(1);
      expect(request.statusConceptId).toBe(PHL.VISIT_CANCELLED_BY_VISITOR);
      expect(notifications.notify).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          recipientUserId: DOCTOR,
          relatedResourceType: 'visit_request',
        }),
        ACTOR.id,
      );
    });

    it('conserva la ficha del visitador: no la borra', async () => {
      const { service, repo, visitorRow } = build();

      await service.unlinkVisitor(LAB, VISITOR, { reason: 'Baja' }, ACTOR);

      expect(repo).not.toHaveProperty('deleteVisitor');
      expect(visitorRow.id).toBe(VISITOR);
      expect(visitorRow.fullName).toBe('Ana Quiroga');
    });

    it('sella la desvinculación en la cadena de auditoría', async () => {
      const { service, audit } = build();

      await service.unlinkVisitor(LAB, VISITOR, { reason: 'Baja' }, ACTOR);

      expect(audit.record).toHaveBeenCalledWith(
        expect.anything(),
        ACTOR,
        expect.objectContaining({
          action: 'MEDICAL_VISITOR_UNLINKED',
          entity: 'medical_visitors',
          entityId: VISITOR,
        }),
      );
    });

    it('no admite desvincular dos veces', async () => {
      const { service } = build({
        visitorRow: visitor({ statusConceptId: PHL.LINK_TERMINATED }),
      });

      await expect(
        service.unlinkVisitor(LAB, VISITOR, { reason: 'Baja' }, ACTOR),
      ).rejects.toThrow('ya está desvinculado');
    });
  });

  describe('revinculación', () => {
    it('reabre la cuenta y vuelve a exigir la verificación del contrato', async () => {
      const visitorRow = visitor({
        statusConceptId: PHL.LINK_TERMINATED,
        publiclyListed: false,
        contractVerificationConceptId: PHL.VERIFICATION_VERIFIED,
      });
      const userRow = {
        id: USER,
        statusConceptId: CONCEPTS.USER_LOCKED,
        updatedAt: new Date(),
      };
      const { service } = build({ visitorRow, userRow });

      const result = await service.relinkVisitor(
        LAB,
        VISITOR,
        { startedOn: '2026-09-01', authorization: 'Acta 12/2026' },
        ACTOR,
      );

      expect(result.statusConceptId).toBe(PHL.LINK_ACTIVE);
      expect(visitorRow.publiclyListed).toBe(true);
      expect(visitorRow.contractVerificationConceptId).toBe(
        PHL.VERIFICATION_PENDING,
      );
      expect(userRow.statusConceptId).toBe(CONCEPTS.USER_ACTIVE);
    });

    it('no revincula a quien ya está vinculado', async () => {
      const { service } = build();

      await expect(
        service.relinkVisitor(
          LAB,
          VISITOR,
          { startedOn: '2026-09-01', authorization: 'Acta' },
          ACTOR,
        ),
      ).rejects.toThrow('ya está vinculado');
    });
  });
});
