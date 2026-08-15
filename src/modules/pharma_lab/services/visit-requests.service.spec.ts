import { jest } from '@jest/globals';

/**
 * Crea una función simulada con la implementación dada.
 *
 * @param impl - Implementación que ejecuta el doble.
 * @returns La función simulada.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { VisitRequestsService } from './visit-requests.service';
import { PHL } from '../pharma_lab.concepts';

const LAB = '11111111-1111-1111-1111-111111111111';
const TENANT = '22222222-2222-2222-2222-222222222222';
const VISITOR = '33333333-3333-3333-3333-333333333333';
const VISITOR_USER = '44444444-4444-4444-4444-444444444444';
const DOCTOR = '55555555-5555-5555-5555-555555555555';
const PRODUCT = '66666666-6666-6666-6666-666666666666';
const REQUEST = '77777777-7777-7777-7777-777777777777';

const DOCTOR_ACTOR = { id: DOCTOR } as any;
const VISITOR_ACTOR = { id: VISITOR_USER } as any;

/** Solicitud en el estado indicado. */
function request(overrides: Record<string, unknown> = {}): Record<string, any> {
  return {
    id: REQUEST,
    medicalVisitorId: VISITOR,
    pharmaLabId: LAB,
    doctorUserId: DOCTOR,
    doctorTenantId: TENANT,
    reason: 'Presentación de producto',
    requestedStartAt: new Date(Date.now() + 72 * 3_600_000),
    durationMinutes: 30,
    timeZone: 'America/La_Paz',
    modalityConceptId: PHL.MODALITY_IN_PERSON,
    statusConceptId: PHL.VISIT_PENDING_CONFIRMATION,
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 *
 * @param options - Estado inicial de los dobles.
 * @returns El servicio y los dobles.
 */
function build(
  options: {
    /** Solicitud devuelta por el repositorio. */
    requestRow?: Record<string, any> | null;
    /** Productos autorizados del visitador. */
    authorizedProducts?: string[];
    /** Estado regulatorio del producto del temario. */
    productStatus?: string;
    /** Si el doctor bloqueó al laboratorio o al visitador. */
    blocked?: boolean;
    /** Si la política confirma automáticamente. */
    autoConfirm?: boolean;
  } = {},
) {
  const requestRow =
    options.requestRow === undefined ? request() : options.requestRow;

  const repo = {
    findRequest: mockFn(async () => requestRow),
    createRequest: mockFn(() => request({ statusConceptId: undefined })),
    createTopic: mockFn(() => ({ id: 'topic' })),
    appendRequestEvent: mockFn(() => ({ id: 'evt' })),
    listTopics: mockFn(async () => []),
    listRequestEvents: mockFn(async () => []),
    listRequestsByVisitor: mockFn(async () => []),
    listRequestsByDoctor: mockFn(async () => []),
  };
  const visitorsRepo = {
    // Solo la cuenta del visitador resuelve a una ficha de visitador: es lo que
    // distingue quién ejecuta una cancelación, y con un doble que devuelve
    // siempre la ficha el doctor quedaría sujeto al plazo del visitador.
    findVisitorByUser: mockFn(async (_em: unknown, userId: string) =>
      userId === VISITOR_USER
        ? {
            id: VISITOR,
            userId: VISITOR_USER,
            pharmaLabId: LAB,
            fullName: 'Ana Quiroga',
            statusConceptId: PHL.LINK_ACTIVE,
          }
        : null,
    ),
    findVisitor: mockFn(async () => ({
      id: VISITOR,
      userId: VISITOR_USER,
      fullName: 'Ana Quiroga',
    })),
    listSpecialties: mockFn(async () => []),
    listAuthorizedProducts: mockFn(async () =>
      (options.authorizedProducts ?? [PRODUCT]).map((id) => ({
        pharmaProductId: id,
      })),
    ),
  };
  const catalog = {
    findProductsByIds: mockFn(async () => [
      {
        id: PRODUCT,
        regulatoryStatusConceptId:
          options.productStatus ?? PHL.PRODUCT_MARKETED,
      },
    ]),
  };
  const agenda = {
    assertVisitorAccepted: mockFn(async () => {
      if (options.blocked) {
        throw new Error('El doctor bloqueó las visitas de este laboratorio');
      }
    }),
    assertSlotAvailable: mockFn(async () => ({
      window: { location: 'Consultorio 3' },
      timeZone: 'America/La_Paz',
      autoConfirm: options.autoConfirm ?? false,
      rescheduleCutoffHours: 12,
    })),
    getPublishedAgenda: mockFn(async () => ({ rescheduleCutoffHours: 12 })),
  };
  const access = {
    requireOperatingVisitor: mockFn(async () => ({
      visitor: {
        id: VISITOR,
        userId: VISITOR_USER,
        fullName: 'Ana Quiroga',
        pharmaLabId: LAB,
      },
      lab: { id: LAB, tenantId: TENANT, legalName: 'Laboratorios Andes' },
    })),
  };
  const notifications = { notify: mockFn(), notifyAll: mockFn() };
  const audit = { record: mockFn(async () => undefined) };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const em: any = {
    transactional: mockFn((cb: any) => cb(em)),
    flush: mockFn(async () => undefined),
  };

  const service = new VisitRequestsService(
    em,
    repo as any,
    visitorsRepo as any,
    catalog as any,
    agenda as any,
    access as any,
    notifications as any,
    audit as any,
    logger as any,
  );

  return { service, repo, agenda, notifications, audit, requestRow };
}

const TOPICS = [{ pharmaProductId: PRODUCT }];

/** Cuerpo mínimo de una solicitud válida. */
function createDto(overrides: Record<string, unknown> = {}) {
  return {
    doctorUserId: DOCTOR,
    doctorTenantId: TENANT,
    reason: 'Presentación de producto',
    requestedStartAt: new Date(Date.now() + 72 * 3_600_000).toISOString(),
    durationMinutes: 30,
    modalityConceptId: PHL.MODALITY_IN_PERSON,
    topics: TOPICS,
    ...overrides,
  } as any;
}

describe('VisitRequestsService', () => {
  describe('solicitud', () => {
    it('queda pendiente de confirmación cuando la agenda no confirma sola', async () => {
      const { service, repo } = build();

      await service.createRequest(createDto(), VISITOR_ACTOR);

      expect(repo.createRequest).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          statusConceptId: PHL.VISIT_PENDING_CONFIRMATION,
        }),
      );
    });

    it('queda confirmada cuando la agenda del doctor confirma automáticamente', async () => {
      const { service, repo } = build({ autoConfirm: true });

      await service.createRequest(createDto(), VISITOR_ACTOR);

      expect(repo.createRequest).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ statusConceptId: PHL.VISIT_CONFIRMED }),
      );
    });

    it('avisa al doctor', async () => {
      const { service, notifications } = build();

      await service.createRequest(createDto(), VISITOR_ACTOR);

      expect(notifications.notify).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ recipientUserId: DOCTOR }),
        VISITOR_ACTOR.id,
      );
    });

    it('rechaza un temario con un producto que el visitador no representa', async () => {
      const { service } = build({ authorizedProducts: [] });

      await expect(
        service.createRequest(createDto(), VISITOR_ACTOR),
      ).rejects.toThrow('no está autorizado a representar');
    });

    it('rechaza un temario con un producto retirado', async () => {
      const { service } = build({ productStatus: PHL.PRODUCT_WITHDRAWN });

      await expect(
        service.createRequest(createDto(), VISITOR_ACTOR),
      ).rejects.toThrow('suspendido o retirado');
    });

    it('rechaza la solicitud si el doctor bloqueó al laboratorio', async () => {
      const { service } = build({ blocked: true });

      await expect(
        service.createRequest(createDto(), VISITOR_ACTOR),
      ).rejects.toThrow('bloqueó las visitas');
    });
  });

  describe('máquina de estados', () => {
    it('acepta una solicitud pendiente y la deja confirmada', async () => {
      const { service, requestRow } = build();

      const result = await service.accept(REQUEST, {}, DOCTOR_ACTOR);

      expect(result.statusConceptId).toBe(PHL.VISIT_CONFIRMED);
      expect(requestRow!.confirmedAt).toBeInstanceOf(Date);
    });

    it('no permite aceptar una solicitud ya rechazada', async () => {
      const { service } = build({
        requestRow: request({ statusConceptId: PHL.VISIT_REJECTED }),
      });

      await expect(service.accept(REQUEST, {}, DOCTOR_ACTOR)).rejects.toThrow(
        'estado final',
      );
    });

    it('no permite aceptar una visita ya completada', async () => {
      const { service } = build({
        requestRow: request({ statusConceptId: PHL.VISIT_COMPLETED }),
      });

      await expect(service.accept(REQUEST, {}, DOCTOR_ACTOR)).rejects.toThrow(
        'estado final',
      );
    });

    it('registra la transición en la bitácora', async () => {
      const { service, repo } = build();

      await service.reject(REQUEST, { note: 'Sin agenda' }, DOCTOR_ACTOR);

      expect(repo.appendRequestEvent).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          previousStatusConceptId: PHL.VISIT_PENDING_CONFIRMATION,
          newStatusConceptId: PHL.VISIT_REJECTED,
          note: 'Sin agenda',
        }),
      );
    });

    it('la propuesta de otro horario deja la solicitud reprogramada', async () => {
      const { service, requestRow } = build();

      const result = await service.proposeTime(
        REQUEST,
        {
          proposedStartAt: new Date(Date.now() + 96 * 3_600_000).toISOString(),
        },
        DOCTOR_ACTOR,
      );

      expect(result.statusConceptId).toBe(PHL.VISIT_RESCHEDULED);
      expect(requestRow!.proposedStartAt).toBeInstanceOf(Date);
    });

    it('la petición de información no cambia el estado pero queda registrada', async () => {
      const { service, repo, requestRow } = build();

      const result = await service.requestInfo(
        REQUEST,
        { note: '¿Qué estudios trae?' },
        DOCTOR_ACTOR,
      );

      expect(result.statusConceptId).toBe(PHL.VISIT_PENDING_CONFIRMATION);
      expect(requestRow!.statusConceptId).toBe(PHL.VISIT_PENDING_CONFIRMATION);
      expect(repo.appendRequestEvent).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          actionConceptId: PHL.VISIT_ACTION_REQUEST_INFO,
        }),
      );
    });
  });

  describe('plazos', () => {
    it('no deja al visitador cancelar dentro del plazo de corte', async () => {
      const { service } = build({
        requestRow: request({
          requestedStartAt: new Date(Date.now() + 2 * 3_600_000),
        }),
      });

      await expect(
        service.cancel(REQUEST, { reason: 'Imprevisto' }, VISITOR_ACTOR),
      ).rejects.toThrow('El plazo para reprogramar o cancelar venció');
    });

    it('el doctor sí puede cancelar dentro del plazo de corte', async () => {
      const { service } = build({
        requestRow: request({
          requestedStartAt: new Date(Date.now() + 2 * 3_600_000),
        }),
      });

      const result = await service.cancel(
        REQUEST,
        { reason: 'Urgencia clínica' },
        DOCTOR_ACTOR,
      );

      expect(result.statusConceptId).toBe(PHL.VISIT_CANCELLED_BY_DOCTOR);
    });

    it('distingue quién canceló', async () => {
      const { service } = build();

      const result = await service.cancel(
        REQUEST,
        { reason: 'Viaje' },
        VISITOR_ACTOR,
      );

      expect(result.statusConceptId).toBe(PHL.VISIT_CANCELLED_BY_VISITOR);
    });
  });
});
