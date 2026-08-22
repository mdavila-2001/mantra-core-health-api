import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { SurveysAssignmentsService } from './surveys-assignments.service';
import { SURVEYS, TARGET_TYPE_BY_CODE } from '../surveys.concepts';
import { SCHED } from '../../scheduling/scheduling.concepts';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';

const TENANT = 'ten-1';
const OWNER = 'hp-1';
const PATIENT = 'pat-1';

const actor = {
  id: 'usr-doc',
  roles: ['PRACTITIONER'],
  practitionerProfileId: OWNER,
} as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 *
 * `tx.findOne` sirve las lecturas cross-módulo (reserva y cupo de agenda), que
 * el servicio hace por `EntityManager` y no por un repositorio propio.
 *
 * @returns Resultado de build.
 */
function build() {
  const tx = {
    flush: mockFn().mockResolvedValue(undefined),
    findOne: mockFn().mockResolvedValue(null),
  };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const assignmentsRepo = {
    findById: mockFn(),
    findActiveDuplicate: mockFn().mockResolvedValue(null),
    listActiveByTargets: mockFn().mockResolvedValue([]),
    listByVersion: mockFn().mockResolvedValue([]),
    create: mockFn().mockReturnValue({ id: 'asg-1' }),
  };
  const invitationsRepo = {
    listByBooking: mockFn().mockResolvedValue([]),
    create: mockFn((_: unknown, data: any) => ({
      id: `inv-${data.surveyVersionId}`,
    })),
  };
  const templatesRepo = {
    findTemplateById: mockFn(),
    findVersionById: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new SurveysAssignmentsService(
    em as any,
    assignmentsRepo as any,
    invitationsRepo as any,
    templatesRepo as any,
    logger as any,
  );
  return { service, tx, assignmentsRepo, invitationsRepo, templatesRepo };
}

/** Versión publicada y vigente. */
function publishedVersion(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ver-1',
    surveyTemplateId: 'tpl-1',
    publicationStatusConceptId: SURVEYS.VERSION_PUBLISHED,
    responseWindowDays: 30,
    effectiveFrom: new Date(Date.now() - 1000),
    effectiveTo: undefined as Date | undefined,
    ...overrides,
  };
}

/** Plantilla activa del profesional dueño. */
function activeTemplate(overrides: Record<string, unknown> = {}) {
  return {
    id: 'tpl-1',
    tenantId: TENANT,
    ownerPractitionerId: OWNER,
    statusConceptId: SURVEYS.TEMPLATE_ACTIVE,
    ...overrides,
  };
}

/** Reserva completada. */
function completedBooking(overrides: Record<string, unknown> = {}) {
  return {
    id: 'bkg-1',
    tenantId: TENANT,
    patientProfileId: PATIENT,
    bookableSlotId: 'slot-1',
    serviceConceptId: 'svc-1',
    statusConceptId: SCHED.BOOKING_COMPLETED,
    ...overrides,
  };
}

/** Ejecuta dentro del contexto de tenant que exigen las escrituras. */
function withTenant<T>(fn: () => Promise<T>): Promise<T> {
  return runWithTenant(TENANT, fn);
}

describe('SurveysAssignmentsService', () => {
  describe('createAssignment', () => {
    it('asocia una versión publicada a un servicio', async () => {
      const d = build();
      d.templatesRepo.findVersionById.mockResolvedValue(publishedVersion());
      d.templatesRepo.findTemplateById.mockResolvedValue(activeTemplate());

      const res = await withTenant(() =>
        d.service.createAssignment(
          {
            surveyVersionId: 'ver-1',
            targetType: 'SERVICE',
            targetId: 'svc-1',
          },
          actor,
        ),
      );

      expect(res).toEqual({ id: 'asg-1' });
      expect(d.assignmentsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          targetTypeConceptId: TARGET_TYPE_BY_CODE.SERVICE,
          active: true,
        }),
      );
    });

    it('no asigna una versión en borrador', async () => {
      const d = build();
      d.templatesRepo.findVersionById.mockResolvedValue(
        publishedVersion({
          publicationStatusConceptId: SURVEYS.VERSION_DRAFT,
        }),
      );

      await expect(
        withTenant(() =>
          d.service.createAssignment(
            {
              surveyVersionId: 'ver-1',
              targetType: 'SERVICE',
              targetId: 'svc-1',
            },
            actor,
          ),
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rechaza el tipo de atención, que la agenda no sabe resolver', async () => {
      const d = build();
      await expect(
        withTenant(() =>
          d.service.createAssignment(
            {
              surveyVersionId: 'ver-1',
              targetType: 'CARE_TYPE',
              targetId: 'care-1',
            },
            actor,
          ),
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('no duplica una asignación activa idéntica', async () => {
      const d = build();
      d.templatesRepo.findVersionById.mockResolvedValue(publishedVersion());
      d.templatesRepo.findTemplateById.mockResolvedValue(activeTemplate());
      d.assignmentsRepo.findActiveDuplicate.mockResolvedValue({ id: 'asg-0' });

      await expect(
        withTenant(() =>
          d.service.createAssignment(
            {
              surveyVersionId: 'ver-1',
              targetType: 'SERVICE',
              targetId: 'svc-1',
            },
            actor,
          ),
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('esconde con 404 la versión de otro profesional', async () => {
      const d = build();
      d.templatesRepo.findVersionById.mockResolvedValue(publishedVersion());
      d.templatesRepo.findTemplateById.mockResolvedValue(
        activeTemplate({ ownerPractitionerId: 'hp-otro' }),
      );

      await expect(
        withTenant(() =>
          d.service.createAssignment(
            {
              surveyVersionId: 'ver-1',
              targetType: 'SERVICE',
              targetId: 'svc-1',
            },
            actor,
          ),
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('issueForBooking', () => {
    it('emite la invitación de una atención completada', async () => {
      const d = build();
      d.tx.findOne.mockResolvedValue(completedBooking());
      d.assignmentsRepo.listActiveByTargets.mockResolvedValue([
        { id: 'asg-1', surveyVersionId: 'ver-1' },
      ]);
      d.templatesRepo.findVersionById.mockResolvedValue(publishedVersion());
      d.templatesRepo.findTemplateById.mockResolvedValue(activeTemplate());

      const res = await withTenant(() =>
        d.service.issueForBooking({ appointmentBookingId: 'bkg-1' }, actor),
      );

      expect(res.ids).toHaveLength(1);
      expect(res.alreadyIssued).toBe(0);
      expect(d.invitationsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          patientProfileId: PATIENT,
          appointmentBookingId: 'bkg-1',
          statusConceptId: SURVEYS.INVITATION_PENDING,
        }),
      );
    });

    it('rechaza una atención que no está completada', async () => {
      const d = build();
      d.tx.findOne.mockResolvedValue(
        completedBooking({ statusConceptId: SCHED.BOOKING_IN_PROGRESS }),
      );

      await expect(
        withTenant(() =>
          d.service.issueForBooking({ appointmentBookingId: 'bkg-1' }, actor),
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('esconde con 404 la reserva de otra organización', async () => {
      const d = build();
      d.tx.findOne.mockResolvedValue(
        completedBooking({ tenantId: 'ten-otro' }),
      );

      await expect(
        withTenant(() =>
          d.service.issueForBooking({ appointmentBookingId: 'bkg-1' }, actor),
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('es idempotente: no reemite lo ya emitido para la misma reserva', async () => {
      const d = build();
      d.tx.findOne.mockResolvedValue(completedBooking());
      d.assignmentsRepo.listActiveByTargets.mockResolvedValue([
        { id: 'asg-1', surveyVersionId: 'ver-1' },
      ]);
      d.invitationsRepo.listByBooking.mockResolvedValue([
        { id: 'inv-previa', surveyVersionId: 'ver-1' },
      ]);

      const res = await withTenant(() =>
        d.service.issueForBooking({ appointmentBookingId: 'bkg-1' }, actor),
      );

      expect(res.ids).toHaveLength(0);
      expect(res.alreadyIssued).toBe(1);
      expect(d.invitationsRepo.create).not.toHaveBeenCalled();
    });

    it('no emite si la vigencia de la versión ya terminó', async () => {
      const d = build();
      d.tx.findOne.mockResolvedValue(completedBooking());
      d.assignmentsRepo.listActiveByTargets.mockResolvedValue([
        { id: 'asg-1', surveyVersionId: 'ver-1' },
      ]);
      d.templatesRepo.findVersionById.mockResolvedValue(
        publishedVersion({
          effectiveTo: new Date(Date.now() - 1000),
        }),
      );

      const res = await withTenant(() =>
        d.service.issueForBooking({ appointmentBookingId: 'bkg-1' }, actor),
      );

      expect(res.ids).toHaveLength(0);
      expect(d.invitationsRepo.create).not.toHaveBeenCalled();
    });

    it('no emite si la plantilla está desactivada', async () => {
      const d = build();
      d.tx.findOne.mockResolvedValue(completedBooking());
      d.assignmentsRepo.listActiveByTargets.mockResolvedValue([
        { id: 'asg-1', surveyVersionId: 'ver-1' },
      ]);
      d.templatesRepo.findVersionById.mockResolvedValue(publishedVersion());
      d.templatesRepo.findTemplateById.mockResolvedValue(
        activeTemplate({ statusConceptId: SURVEYS.TEMPLATE_INACTIVE }),
      );

      const res = await withTenant(() =>
        d.service.issueForBooking({ appointmentBookingId: 'bkg-1' }, actor),
      );

      expect(res.ids).toHaveLength(0);
      expect(d.invitationsRepo.create).not.toHaveBeenCalled();
    });

    it('congela el plazo de respuesta al emitir', async () => {
      const d = build();
      d.tx.findOne.mockResolvedValue(completedBooking());
      d.assignmentsRepo.listActiveByTargets.mockResolvedValue([
        { id: 'asg-1', surveyVersionId: 'ver-1' },
      ]);
      d.templatesRepo.findVersionById.mockResolvedValue(
        publishedVersion({ responseWindowDays: 7 }),
      );
      d.templatesRepo.findTemplateById.mockResolvedValue(activeTemplate());

      await withTenant(() =>
        d.service.issueForBooking({ appointmentBookingId: 'bkg-1' }, actor),
      );

      const [, data] = d.invitationsRepo.create.mock.calls[0];
      const dias =
        (data.expiresAt.getTime() - data.issuedAt.getTime()) /
        (24 * 60 * 60 * 1000);
      expect(dias).toBeCloseTo(7, 5);
    });
  });
});
