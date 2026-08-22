import { jest } from '@jest/globals';

/**
 * Crea una función simulada con la implementación dada.
 *
 * @param impl - Implementación que ejecuta el doble.
 * @returns La función simulada.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { VisitRecordsService } from './visit-records.service';
import { PHL } from '../pharma_lab.concepts';

const LAB = '11111111-1111-1111-1111-111111111111';
const TENANT = '22222222-2222-2222-2222-222222222222';
const VISITOR = '33333333-3333-3333-3333-333333333333';
const DOCTOR = '44444444-4444-4444-4444-444444444444';
const REQUEST = '55555555-5555-5555-5555-555555555555';
const RECORD = '66666666-6666-6666-6666-666666666666';
const MATERIAL = '77777777-7777-7777-7777-777777777777';

const DOCTOR_ACTOR = { id: DOCTOR } as any;
const VISITOR_ACTOR = { id: '88888888-8888-8888-8888-888888888888' } as any;

const OCCURRED_AT = '2026-09-01T15:00:00.000Z';

/** Solicitud confirmada. */
function request(overrides: Record<string, unknown> = {}): Record<string, any> {
  return {
    id: REQUEST,
    medicalVisitorId: VISITOR,
    doctorUserId: DOCTOR,
    doctorTenantId: TENANT,
    modalityConceptId: PHL.MODALITY_IN_PERSON,
    statusConceptId: PHL.VISIT_CONFIRMED,
    location: 'Consultorio 3',
    updatedAt: new Date(),
    ...overrides,
  };
}

/** Registro de visita. */
function record(overrides: Record<string, unknown> = {}): Record<string, any> {
  return {
    id: RECORD,
    visitRequestId: REQUEST,
    doctorUserId: DOCTOR,
    medicalVisitorId: VISITOR,
    pharmaLabId: LAB,
    occurredAt: new Date(OCCURRED_AT),
    confirmationConceptId: PHL.RECORD_PENDING_DOCTOR_CONFIRMATION,
    updatedAt: new Date(),
    ...overrides,
  };
}

/** Material informativo aprobado y vigente. */
function material(
  overrides: Record<string, unknown> = {},
): Record<string, any> {
  return {
    id: MATERIAL,
    pharmaLabId: LAB,
    version: 'v1.0',
    statusConceptId: PHL.MATERIAL_APPROVED,
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
    requestRow?: Record<string, any>;
    /** Registro devuelto por el repositorio. */
    recordRow?: Record<string, any>;
    /** Registro ya existente para esa solicitud. */
    existingRecord?: Record<string, any> | null;
    /** Material devuelto por el catálogo. */
    materialRow?: Record<string, any>;
    /** Calificación ya emitida. */
    existingRating?: Record<string, any> | null;
    /** Encuesta aplicable a la visita. */
    survey?: Record<string, any> | null;
  } = {},
) {
  const requestRow = options.requestRow ?? request();
  const recordRow = options.recordRow ?? record();
  const materialRow = options.materialRow ?? material();

  const repo = {
    findRequest: mockFn(async () => requestRow),
    findRecord: mockFn(async () => recordRow),
    findRecordByRequest: mockFn(async () => options.existingRecord ?? null),
    createRecord: mockFn(() => recordRow),
    createRecordMaterial: mockFn(() => ({ id: 'rm' })),
    appendRequestEvent: mockFn(() => ({ id: 'evt' })),
    findRating: mockFn(async () => options.existingRating ?? null),
    createRating: mockFn(() => ({ id: 'rating' })),
    listRecordsByLab: mockFn(async () => [recordRow]),
    listRecordsByDoctor: mockFn(async () => [recordRow]),
    listInternalRatings: mockFn(async () => [
      { punctuality: 5, overallSatisfaction: 4 },
      { punctuality: 3, overallSatisfaction: 5 },
    ]),
  };
  const visitorsRepo = {
    findVisitor: mockFn(async () => ({
      id: VISITOR,
      userId: VISITOR_ACTOR.id,
    })),
  };
  const catalog = { findMaterialsByIds: mockFn(async () => [materialRow]) };
  const surveys = {
    findApplicableSurvey: mockFn(async () => options.survey ?? null),
    createResponse: mockFn(() => ({ id: 'resp' })),
  };
  const access = {
    requireLab: mockFn(async () => ({ id: LAB, tenantId: TENANT })),
    requireOperatingVisitor: mockFn(async () => ({
      visitor: { id: VISITOR, userId: VISITOR_ACTOR.id },
      lab: { id: LAB, tenantId: TENANT },
    })),
  };
  const notifications = { notify: mockFn(), notifyAll: mockFn() };
  const audit = { record: mockFn(async () => undefined) };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const em: any = {
    transactional: mockFn((cb: any) => cb(em)),
    flush: mockFn(async () => undefined),
  };

  const service = new VisitRecordsService(
    em,
    repo as any,
    visitorsRepo as any,
    catalog as any,
    surveys as any,
    access as any,
    notifications as any,
    audit as any,
    logger as any,
  );
  return { service, repo, surveys, notifications, requestRow, recordRow };
}

/** Cuerpo mínimo de un registro de visita con asistencia de ambas partes. */
function createDto(overrides: Record<string, unknown> = {}) {
  return {
    visitRequestId: REQUEST,
    occurredAt: OCCURRED_AT,
    visitorAttendanceConceptId: PHL.ATTENDANCE_ATTENDED,
    doctorAttendanceConceptId: PHL.ATTENDANCE_ATTENDED,
    ...overrides,
  } as any;
}

describe('VisitRecordsService', () => {
  describe('registro de la visita', () => {
    it('deja la solicitud completada cuando ambas partes asistieron', async () => {
      const { service, requestRow } = build();

      await service.createRecord(createDto(), VISITOR_ACTOR);

      expect(requestRow.statusConceptId).toBe(PHL.VISIT_COMPLETED);
    });

    it('distingue la inasistencia del visitador', async () => {
      const { service, requestRow } = build();

      await service.createRecord(
        createDto({
          visitorAttendanceConceptId: PHL.ATTENDANCE_MISSED,
        }),
        VISITOR_ACTOR,
      );

      expect(requestRow.statusConceptId).toBe(PHL.VISIT_VISITOR_NO_SHOW);
    });

    it('distingue la inasistencia del doctor', async () => {
      const { service, requestRow } = build();

      await service.createRecord(
        createDto({
          doctorAttendanceConceptId: PHL.ATTENDANCE_MISSED,
        }),
        VISITOR_ACTOR,
      );

      expect(requestRow.statusConceptId).toBe(PHL.VISIT_DOCTOR_NO_SHOW);
    });

    it('no registra una visita que no estaba confirmada', async () => {
      const { service } = build({
        requestRow: request({
          statusConceptId: PHL.VISIT_PENDING_CONFIRMATION,
        }),
      });

      await expect(
        service.createRecord(createDto(), VISITOR_ACTOR),
      ).rejects.toThrow('visita confirmada');
    });

    it('no registra dos veces la misma visita', async () => {
      const { service } = build({ existingRecord: record() });

      await expect(
        service.createRecord(createDto(), VISITOR_ACTOR),
      ).rejects.toThrow('ya fue registrada');
    });
  });

  describe('material presentado', () => {
    it('rechaza material que no está aprobado', async () => {
      const { service } = build({
        materialRow: material({ statusConceptId: PHL.MATERIAL_IN_REVIEW }),
      });

      await expect(
        service.createRecord(
          createDto({
            materials: [{ informationalMaterialId: MATERIAL }],
          }),
          VISITOR_ACTOR,
        ),
      ).rejects.toThrow('no está aprobado');
    });

    it('rechaza material fuera de vigencia en la fecha de la visita', async () => {
      const { service } = build({
        materialRow: material({ validTo: '2026-08-01' }),
      });

      await expect(
        service.createRecord(
          createDto({
            materials: [{ informationalMaterialId: MATERIAL }],
          }),
          VISITOR_ACTOR,
        ),
      ).rejects.toThrow('no estaba vigente');
    });

    it('congela la versión del material aprobado en la evidencia', async () => {
      const { service, repo } = build();

      await service.createRecord(
        createDto({
          materials: [
            { informationalMaterialId: MATERIAL, wasHandedOver: true },
          ],
        }),
        VISITOR_ACTOR,
      );

      expect(repo.createRecordMaterial).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          informationalMaterialId: MATERIAL,
          materialVersion: 'v1.0',
          wasHandedOver: true,
        }),
      );
    });
  });

  describe('encuesta posterior', () => {
    it('emite la encuesta aplicable cuando la visita se completó', async () => {
      const { service, surveys } = build({
        survey: {
          id: 'survey',
          title: 'Encuesta de visita',
          sendDelayHours: 24,
        },
      });

      await service.createRecord(createDto(), VISITOR_ACTOR);

      expect(surveys.createResponse).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          doctorUserId: DOCTOR,
          statusConceptId: PHL.RESPONSE_PENDING,
        }),
      );
    });

    it('no la emite si el doctor no asistió', async () => {
      const { service, surveys } = build({
        survey: { id: 'survey', title: 'Encuesta', sendDelayHours: 24 },
      });

      await service.createRecord(
        createDto({ doctorAttendanceConceptId: PHL.ATTENDANCE_MISSED }),
        VISITOR_ACTOR,
      );

      expect(surveys.createResponse).not.toHaveBeenCalled();
    });
  });

  describe('confirmación y calificación', () => {
    it('el doctor confirma que la visita ocurrió', async () => {
      const { service, recordRow } = build();

      const result = await service.confirmRecord(
        RECORD,
        { occurred: true },
        DOCTOR_ACTOR,
      );

      expect(result.statusConceptId).toBe(PHL.RECORD_CONFIRMED);
      expect(recordRow.confirmedAt).toBeInstanceOf(Date);
    });

    it('el doctor puede desconocer la visita', async () => {
      const { service } = build();

      const result = await service.confirmRecord(
        RECORD,
        { occurred: false, note: 'No se presentó' },
        DOCTOR_ACTOR,
      );

      expect(result.statusConceptId).toBe(PHL.RECORD_DISPUTED);
    });

    it('no califica una visita que no está completada', async () => {
      const { service } = build({
        requestRow: request({ statusConceptId: PHL.VISIT_CONFIRMED }),
      });

      await expect(
        service.rateVisit(
          RECORD,
          { kindConceptId: PHL.RATING_INTERNAL, punctuality: 5 },
          DOCTOR_ACTOR,
        ),
      ).rejects.toThrow('visita completada');
    });

    it('califica una visita completada', async () => {
      const { service, repo } = build({
        requestRow: request({ statusConceptId: PHL.VISIT_COMPLETED }),
      });

      await service.rateVisit(
        RECORD,
        { kindConceptId: PHL.RATING_INTERNAL, punctuality: 5 },
        DOCTOR_ACTOR,
      );

      expect(repo.createRating).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ punctuality: 5, doctorUserId: DOCTOR }),
      );
    });

    it('no admite dos calificaciones de la misma naturaleza', async () => {
      const { service } = build({
        requestRow: request({ statusConceptId: PHL.VISIT_COMPLETED }),
        existingRating: { id: 'r1' },
      });

      await expect(
        service.rateVisit(
          RECORD,
          { kindConceptId: PHL.RATING_INTERNAL },
          DOCTOR_ACTOR,
        ),
      ).rejects.toThrow('Ya existe una calificación');
    });
  });

  describe('resultados para la organización', () => {
    it('devuelve promedios, no calificaciones individuales', async () => {
      const { service } = build();

      const summary = await service.getRatingAggregate(LAB);

      expect(summary.sampleSize).toBe(2);
      expect(summary.punctuality).toBe(4);
      expect(summary.overallSatisfaction).toBe(4.5);
      expect(summary.clarity).toBeNull();
      expect(summary).not.toHaveProperty('comments');
    });
  });
});
