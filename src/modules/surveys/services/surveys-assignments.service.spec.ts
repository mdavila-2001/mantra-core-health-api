import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { LockMode, UniqueConstraintViolationException } from '@mikro-orm/core';
import { SurveysAssignmentsService } from './surveys-assignments.service';
import { SurveysErrorReason } from '../surveys.error-reasons';
import { SURVEYS, TARGET_TYPE_BY_CODE } from '../surveys.concepts';
import { DomainException } from '../../../common';
import { SCHED } from '../../scheduling/domain/scheduling.concepts';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';

const TENANT = 'ten-1';
const OWNER = 'hp-1';
const PATIENT = 'pat-1';

/** La encuesta base del tenant que devuelve `ensureSystemTemplate`. */
const BASE = {
  kind: 'CONSULTATION' as const,
  templateId: 'tpl-base',
  versionId: 'ver-base',
  assignmentId: 'asg-base',
  responseWindowDays: 30,
};

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
  const em: any = { transactional: mockFn((cb: any) => cb(tx)) };
  em.fork = mockFn(() => em);
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
    lockVersion: mockFn().mockResolvedValue(undefined),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const systemTemplates = {
    ensureSystemTemplate: mockFn().mockResolvedValue(BASE),
  };
  // Por omisión todo destino es válido y lo atiende `OWNER`; cada prueba
  // sobreescribe lo que quiere romper.
  const targetsRepo = {
    // La lectura previa a la transacción ve lo mismo que la reservada; sin una
    // reserva armada por la prueba, una cualquiera del tenant (destino de
    // `createAssignment`).
    findBooking: mockFn(
      async (_em: unknown, id: string) =>
        (await tx.findOne(null, { id })) ?? { id: 'bkg-9', tenantId: TENANT },
    ),
    listCompletedBookingsWithoutInvitation: mockFn().mockResolvedValue([]),
    findPractitionerOfBooking: mockFn().mockResolvedValue(OWNER),
    findOffering: mockFn().mockResolvedValue(null),
    findOfferingOf: mockFn().mockResolvedValue({ id: 'off-1' }),
    findServiceCatalog: mockFn().mockResolvedValue({
      id: 'svc-1',
      practiceId: 'pr-1',
    }),
    findTenantOfPractice: mockFn().mockResolvedValue(TENANT),
  };
  const service = new SurveysAssignmentsService(
    em as any,
    assignmentsRepo as any,
    invitationsRepo as any,
    templatesRepo as any,
    logger as any,
    systemTemplates as any,
    targetsRepo as any,
  );
  return {
    service,
    tx,
    assignmentsRepo,
    invitationsRepo,
    templatesRepo,
    systemTemplates,
    targetsRepo,
    em,
  };
}

/** Versión publicada y vigente. */
function publishedVersion(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ver-1',
    surveyTemplateId: 'tpl-1',
    versionNumber: 1,
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

    it('es idempotente: no reemite lo ya emitido para la misma reserva (base y extensión)', async () => {
      const d = build();
      d.tx.findOne.mockResolvedValue(completedBooking());
      d.assignmentsRepo.listActiveByTargets.mockResolvedValue([
        { id: 'asg-1', surveyVersionId: 'ver-1' },
      ]);
      d.templatesRepo.findVersionById.mockResolvedValue(publishedVersion());
      d.templatesRepo.findTemplateById.mockResolvedValue(activeTemplate());
      // La invitación única ya emitida: la base con la versión del profesional detrás.
      d.invitationsRepo.listByBooking.mockResolvedValue([
        {
          id: 'inv-previa',
          surveyVersionId: BASE.versionId,
          extensionSurveyVersionId: 'ver-1',
        },
      ]);

      const res = await withTenant(() =>
        d.service.issueForBooking({ appointmentBookingId: 'bkg-1' }, actor),
      );

      expect(res.ids).toHaveLength(0);
      expect(res.alreadyIssued).toBe(2);
      expect(d.invitationsRepo.create).not.toHaveBeenCalled();
    });

    it('una versión del profesional ya emitida suelta no se repite; la base sí sale', async () => {
      const d = build();
      d.tx.findOne.mockResolvedValue(completedBooking());
      d.assignmentsRepo.listActiveByTargets.mockResolvedValue([
        { id: 'asg-1', surveyVersionId: 'ver-1' },
      ]);
      d.templatesRepo.findVersionById.mockResolvedValue(publishedVersion());
      d.templatesRepo.findTemplateById.mockResolvedValue(activeTemplate());
      d.invitationsRepo.listByBooking.mockResolvedValue([
        { id: 'inv-previa', surveyVersionId: 'ver-1' },
      ]);

      const res = await withTenant(() =>
        d.service.issueForBooking({ appointmentBookingId: 'bkg-1' }, actor),
      );

      expect(res.ids).toHaveLength(1);
      expect(res.alreadyIssued).toBe(1);
      expect(d.invitationsRepo.create).toHaveBeenCalledTimes(1);
      const [, data] = d.invitationsRepo.create.mock.calls[0];
      expect(data.surveyVersionId).toBe(BASE.versionId);
      expect(data.extensionSurveyVersionId).toBeUndefined();
    });

    it('no emite la encuesta del profesional si la vigencia de la versión ya terminó (la base sí)', async () => {
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

      expect(res.ids).toHaveLength(1);
      expect(d.invitationsRepo.create).toHaveBeenCalledTimes(1);
      const [, data] = d.invitationsRepo.create.mock.calls[0];
      expect(data.surveyVersionId).toBe(BASE.versionId);
      expect(data.extensionSurveyVersionId).toBeUndefined();
    });

    it('no emite la encuesta del profesional si la plantilla está desactivada (la base sí)', async () => {
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

      expect(res.ids).toHaveLength(1);
      expect(d.invitationsRepo.create).toHaveBeenCalledTimes(1);
      const [, data] = d.invitationsRepo.create.mock.calls[0];
      expect(data.surveyVersionId).toBe(BASE.versionId);
      expect(data.extensionSurveyVersionId).toBeUndefined();
    });

    it('congela el plazo de respuesta al emitir', async () => {
      const d = build();
      d.tx.findOne.mockResolvedValue(completedBooking());
      d.assignmentsRepo.listActiveByTargets.mockResolvedValue([
        { id: 'asg-1', surveyVersionId: 'ver-1' },
      ]);
      d.systemTemplates.ensureSystemTemplate.mockResolvedValue({
        ...BASE,
        responseWindowDays: 7,
      });
      d.templatesRepo.findVersionById.mockResolvedValue(publishedVersion());
      d.templatesRepo.findTemplateById.mockResolvedValue(activeTemplate());

      await withTenant(() =>
        d.service.issueForBooking({ appointmentBookingId: 'bkg-1' }, actor),
      );

      const [, data] = d.invitationsRepo.create.mock.calls[0];
      const days =
        (data.expiresAt.getTime() - data.issuedAt.getTime()) /
        (24 * 60 * 60 * 1000);
      expect(days).toBeCloseTo(7, 5);
    });
  });

  describe('unicidad e idempotencia bajo concurrencia (SURV-02)', () => {
    const uniqueViolation = () =>
      new UniqueConstraintViolationException(
        new Error('duplicate key value violates unique constraint'),
      );

    it('Correcto: emite una vez para una reserva completada y bloquea la reserva antes de leer lo ya emitido', async () => {
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
      expect(d.tx.findOne).toHaveBeenCalledWith(
        expect.anything(),
        { id: 'bkg-1' },
        { lockMode: LockMode.PESSIMISTIC_WRITE },
      );
      const lockCall = d.tx.findOne.mock.calls.findIndex(
        (call: any[]) => call[2]?.lockMode === LockMode.PESSIMISTIC_WRITE,
      );
      const lockOrder = d.tx.findOne.mock.invocationCallOrder[lockCall];
      const readOrder =
        d.invitationsRepo.listByBooking.mock.invocationCallOrder[0];
      expect(lockOrder).toBeLessThan(readOrder);
    });

    it('Límite: perder la carrera de la emisión responde como emisión previa, sin error', async () => {
      const d = build();
      d.tx.findOne.mockResolvedValue(completedBooking());
      d.assignmentsRepo.listActiveByTargets.mockResolvedValue([
        { id: 'asg-1', surveyVersionId: 'ver-1' },
      ]);
      d.templatesRepo.findVersionById.mockResolvedValue(publishedVersion());
      d.templatesRepo.findTemplateById.mockResolvedValue(activeTemplate());
      d.tx.flush.mockRejectedValueOnce(uniqueViolation());
      // Tras perder, la lectura ve la invitación que ganó la carrera.
      d.invitationsRepo.listByBooking
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { id: 'inv-ganadora', surveyVersionId: 'ver-1' },
        ]);

      const res = await withTenant(() =>
        d.service.issueForBooking({ appointmentBookingId: 'bkg-1' }, actor),
      );

      expect(res).toEqual({ ids: [], alreadyIssued: 1 });
    });

    it('un error que no es de unicidad sigue subiendo', async () => {
      const d = build();
      d.tx.findOne.mockResolvedValue(completedBooking());
      d.assignmentsRepo.listActiveByTargets.mockResolvedValue([
        { id: 'asg-1', surveyVersionId: 'ver-1' },
      ]);
      d.templatesRepo.findVersionById.mockResolvedValue(publishedVersion());
      d.templatesRepo.findTemplateById.mockResolvedValue(activeTemplate());
      d.tx.flush.mockRejectedValueOnce(new Error('connection refused'));

      await expect(
        withTenant(() =>
          d.service.issueForBooking({ appointmentBookingId: 'bkg-1' }, actor),
        ),
      ).rejects.toThrow('connection refused');
    });

    it('la asignación bloquea la versión antes de buscar un duplicado activo', async () => {
      const d = build();
      d.templatesRepo.findVersionById.mockResolvedValue(publishedVersion());
      d.templatesRepo.findTemplateById.mockResolvedValue(activeTemplate());

      await withTenant(() =>
        d.service.createAssignment(
          {
            surveyVersionId: 'ver-1',
            targetType: 'SERVICE',
            targetId: 'svc-1',
          },
          actor,
        ),
      );

      expect(d.templatesRepo.lockVersion).toHaveBeenCalledWith(d.tx, 'ver-1');
      expect(
        d.templatesRepo.lockVersion.mock.invocationCallOrder[0],
      ).toBeLessThan(
        d.assignmentsRepo.findActiveDuplicate.mock.invocationCallOrder[0],
      );
    });

    it('Falla catalogada: el duplicado activo es 409 con su reason, también si lo detecta el modelo', async () => {
      const previa = build();
      previa.templatesRepo.findVersionById.mockResolvedValue(
        publishedVersion(),
      );
      previa.templatesRepo.findTemplateById.mockResolvedValue(activeTemplate());
      previa.assignmentsRepo.findActiveDuplicate.mockResolvedValue({
        id: 'asg-0',
      });
      const carrera = build();
      carrera.templatesRepo.findVersionById.mockResolvedValue(
        publishedVersion(),
      );
      carrera.templatesRepo.findTemplateById.mockResolvedValue(
        activeTemplate(),
      );
      carrera.tx.flush.mockRejectedValueOnce(uniqueViolation());

      for (const d of [previa, carrera]) {
        const error = await withTenant(() =>
          d.service.createAssignment(
            {
              surveyVersionId: 'ver-1',
              targetType: 'SERVICE',
              targetId: 'svc-1',
            },
            actor,
          ),
        ).catch((e) => e);
        expect(error).toBeInstanceOf(ConflictException);
        expect(error.getStatus()).toBe(409);
        expect(error.reason).toBe(SurveysErrorReason.ASSIGNMENT_ALREADY_ACTIVE);
      }
    });
  });
});

describe('SurveysAssignmentsService · encuesta base y extensión del profesional (F3)', () => {
  /** Reserva de servicio: lleva oferta y la copia congelada del servicio. */
  function serviceBooking(overrides: Record<string, unknown> = {}) {
    return completedBooking({
      practitionerServiceOfferingId: 'off-1',
      serviceSnapshot: { offeringId: 'off-1', serviceCatalogId: 'cat-1' },
      ...overrides,
    });
  }

  /** Prepara una asignación activa de una versión del profesional. */
  function withAssignment(
    d: ReturnType<typeof build>,
    assignment: Record<string, unknown> = {},
  ) {
    d.assignmentsRepo.listActiveByTargets.mockResolvedValue([
      { id: 'asg-1', surveyVersionId: 'ver-1', ...assignment },
    ]);
    d.templatesRepo.findVersionById.mockResolvedValue(publishedVersion());
    d.templatesRepo.findTemplateById.mockResolvedValue(activeTemplate());
  }

  describe('qué encuesta base se emite', () => {
    it('una reserva sin servicio es una consulta', async () => {
      const d = build();
      d.tx.findOne.mockResolvedValue(completedBooking());

      await withTenant(() =>
        d.service.issueForBooking({ appointmentBookingId: 'bkg-1' }, actor),
      );

      expect(d.systemTemplates.ensureSystemTemplate).toHaveBeenCalledWith(
        TENANT,
        'CONSULTATION',
        actor.id,
      );
    });

    it('una reserva con oferta de servicio es un servicio', async () => {
      const d = build();
      d.tx.findOne.mockResolvedValue(serviceBooking());

      await withTenant(() =>
        d.service.issueForBooking({ appointmentBookingId: 'bkg-1' }, actor),
      );

      expect(d.systemTemplates.ensureSystemTemplate).toHaveBeenCalledWith(
        TENANT,
        'SERVICE',
        actor.id,
      );
    });

    it('sin encuesta del profesional emite sólo la base, colgada de la asignación de sistema', async () => {
      const d = build();
      d.tx.findOne.mockResolvedValue(completedBooking());

      const res = await withTenant(() =>
        d.service.issueForBooking({ appointmentBookingId: 'bkg-1' }, actor),
      );

      expect(res.ids).toHaveLength(1);
      expect(d.invitationsRepo.create).toHaveBeenCalledTimes(1);
      const [, data] = d.invitationsRepo.create.mock.calls[0];
      expect(data).toEqual(
        expect.objectContaining({
          surveyVersionId: BASE.versionId,
          surveyAssignmentId: BASE.assignmentId,
          patientProfileId: PATIENT,
          appointmentBookingId: 'bkg-1',
        }),
      );
      expect(data.extensionSurveyVersionId).toBeUndefined();
    });

    it('con encuesta del profesional emite UNA invitación: la base y la del médico detrás', async () => {
      const d = build();
      d.tx.findOne.mockResolvedValue(completedBooking());
      withAssignment(d);

      const res = await withTenant(() =>
        d.service.issueForBooking({ appointmentBookingId: 'bkg-1' }, actor),
      );

      expect(res.ids).toHaveLength(1);
      expect(d.invitationsRepo.create).toHaveBeenCalledTimes(1);
      const [, data] = d.invitationsRepo.create.mock.calls[0];
      expect(data.surveyVersionId).toBe(BASE.versionId);
      expect(data.extensionSurveyVersionId).toBe('ver-1');
    });

    it('si aplican varias, la más específica viaja detrás de la base y las demás salen sueltas', async () => {
      const d = build();
      d.tx.findOne.mockResolvedValue(serviceBooking());
      d.assignmentsRepo.listActiveByTargets.mockResolvedValue([
        {
          id: 'asg-care',
          surveyVersionId: 'ver-care',
          targetTypeConceptId: SURVEYS.TARGET_CARE_TYPE,
          createdAt: new Date(1),
        },
        {
          id: 'asg-svc',
          surveyVersionId: 'ver-svc',
          targetTypeConceptId: SURVEYS.TARGET_SERVICE,
          createdAt: new Date(2),
        },
      ]);
      d.templatesRepo.findVersionById.mockImplementation(
        async (_: unknown, id: string) => publishedVersion({ id }),
      );
      d.templatesRepo.findTemplateById.mockResolvedValue(activeTemplate());

      const res = await withTenant(() =>
        d.service.issueForBooking({ appointmentBookingId: 'bkg-1' }, actor),
      );

      expect(res.ids).toHaveLength(2);
      const [[, base], [, loose]] = d.invitationsRepo.create.mock.calls;
      expect(base.surveyVersionId).toBe(BASE.versionId);
      expect(base.extensionSurveyVersionId).toBe('ver-svc');
      expect(loose.surveyVersionId).toBe('ver-care');
      expect(loose.surveyAssignmentId).toBe('asg-care');
      expect(loose.extensionSurveyVersionId).toBeUndefined();
    });

    it('no reparte la encuesta de otro profesional aunque la asignación coincida con el destino', async () => {
      const d = build();
      d.tx.findOne.mockResolvedValue(completedBooking());
      withAssignment(d);
      d.templatesRepo.findTemplateById.mockResolvedValue(
        activeTemplate({ ownerPractitionerId: 'hp-otro' }),
      );

      await withTenant(() =>
        d.service.issueForBooking({ appointmentBookingId: 'bkg-1' }, actor),
      );

      expect(d.invitationsRepo.create).toHaveBeenCalledTimes(1);
      const [, data] = d.invitationsRepo.create.mock.calls[0];
      expect(data.extensionSurveyVersionId).toBeUndefined();
    });

    it('si no se puede saber quién atendió, sólo sale la base', async () => {
      const d = build();
      d.tx.findOne.mockResolvedValue(completedBooking());
      withAssignment(d);
      d.targetsRepo.findPractitionerOfBooking.mockResolvedValue(null);

      await withTenant(() =>
        d.service.issueForCompletedBooking('bkg-1', actor),
      );

      expect(d.invitationsRepo.create).toHaveBeenCalledTimes(1);
      const [, data] = d.invitationsRepo.create.mock.calls[0];
      expect(data.extensionSurveyVersionId).toBeUndefined();
    });

    it('ignora la plantilla de sistema entre las asignaciones del profesional', async () => {
      const d = build();
      d.tx.findOne.mockResolvedValue(completedBooking());
      withAssignment(d);
      d.templatesRepo.findTemplateById.mockResolvedValue(
        activeTemplate({
          ownerPractitionerId: undefined,
          ownerTypeConceptId: SURVEYS.SYSTEM_BASE_CONSULTATION,
        }),
      );

      await withTenant(() =>
        d.service.issueForBooking({ appointmentBookingId: 'bkg-1' }, actor),
      );

      const [, data] = d.invitationsRepo.create.mock.calls[0];
      expect(data.extensionSurveyVersionId).toBeUndefined();
    });
  });

  describe('resolveTargets: la identidad canónica del servicio es billing.service_catalog.id', () => {
    /** Los destinos candidatos con los que se buscaron asignaciones. */
    function searchedTargets(d: ReturnType<typeof build>): string[] {
      return d.assignmentsRepo.listActiveByTargets.mock.calls[0][2];
    }

    it('una reserva de servicio busca por la reserva, el servicio del catálogo y el concepto de servicio', async () => {
      const d = build();
      d.tx.findOne.mockResolvedValue(serviceBooking());

      await withTenant(() =>
        d.service.issueForBooking({ appointmentBookingId: 'bkg-1' }, actor),
      );

      expect(searchedTargets(d)).toEqual(
        expect.arrayContaining(['bkg-1', 'cat-1', 'svc-1']),
      );
    });

    it('no incluye «todas mis consultas» cuando la reserva es de un servicio', async () => {
      const d = build();
      d.tx.findOne.mockResolvedValue(serviceBooking());

      await withTenant(() =>
        d.service.issueForBooking({ appointmentBookingId: 'bkg-1' }, actor),
      );

      expect(searchedTargets(d)).not.toContain(SURVEYS.CARE_TYPE_CONSULTATION);
    });

    it('una consulta busca también «todas mis consultas» y no un servicio del catálogo', async () => {
      const d = build();
      d.tx.findOne.mockResolvedValue(completedBooking());

      await withTenant(() =>
        d.service.issueForBooking({ appointmentBookingId: 'bkg-1' }, actor),
      );

      expect(searchedTargets(d)).toEqual(
        expect.arrayContaining(['bkg-1', SURVEYS.CARE_TYPE_CONSULTATION]),
      );
      expect(d.targetsRepo.findOffering).not.toHaveBeenCalled();
    });

    it('sin copia congelada toma el servicio de la oferta reservada', async () => {
      const d = build();
      d.tx.findOne.mockResolvedValue(
        serviceBooking({ serviceSnapshot: undefined }),
      );
      d.targetsRepo.findOffering.mockResolvedValue({
        id: 'off-1',
        serviceCatalogId: 'cat-oferta',
      });

      await withTenant(() =>
        d.service.issueForBooking({ appointmentBookingId: 'bkg-1' }, actor),
      );

      expect(searchedTargets(d)).toContain('cat-oferta');
    });
  });

  describe('createAssignment: validación del destino', () => {
    const base = { surveyVersionId: 'ver-1' };

    /** Un `d` con una versión del profesional lista para asignar. */
    function ready() {
      const d = build();
      d.templatesRepo.findVersionById.mockResolvedValue(publishedVersion());
      d.templatesRepo.findTemplateById.mockResolvedValue(activeTemplate());
      return d;
    }

    it('la plantilla de sistema no se asigna: 403 con su reason', async () => {
      const d = ready();
      d.templatesRepo.findTemplateById.mockResolvedValue(
        activeTemplate({
          ownerPractitionerId: undefined,
          ownerTypeConceptId: SURVEYS.SYSTEM_BASE_CONSULTATION,
        }),
      );

      const error = await withTenant(() =>
        d.service.createAssignment(
          { ...base, targetType: 'SERVICE', targetId: 'svc-1' },
          actor,
        ),
      ).catch((e) => e);

      expect(error).toBeInstanceOf(DomainException);
      expect(error.getStatus()).toBe(403);
      expect(error.reason).toBe(SurveysErrorReason.SYSTEM_TEMPLATE_IMMUTABLE);
      expect(d.assignmentsRepo.create).not.toHaveBeenCalled();
    });

    it('SERVICE: un servicio inexistente responde 404', async () => {
      const d = ready();
      d.targetsRepo.findServiceCatalog.mockResolvedValue(null);

      const error = await withTenant(() =>
        d.service.createAssignment(
          { ...base, targetType: 'SERVICE', targetId: 'svc-x' },
          actor,
        ),
      ).catch((e) => e);

      expect(error).toBeInstanceOf(ResourceNotFoundException);
      expect(error.reason).toBe(SurveysErrorReason.ASSIGNMENT_TARGET_NOT_FOUND);
    });

    it('SERVICE: un servicio de otra organización responde 404', async () => {
      const d = ready();
      d.targetsRepo.findTenantOfPractice.mockResolvedValue('ten-otro');

      await expect(
        withTenant(() =>
          d.service.createAssignment(
            { ...base, targetType: 'SERVICE', targetId: 'svc-1' },
            actor,
          ),
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.assignmentsRepo.create).not.toHaveBeenCalled();
    });

    it('SERVICE: un servicio que el profesional no ofrece responde 412', async () => {
      const d = ready();
      d.targetsRepo.findOfferingOf.mockResolvedValue(null);

      const error = await withTenant(() =>
        d.service.createAssignment(
          { ...base, targetType: 'SERVICE', targetId: 'svc-1' },
          actor,
        ),
      ).catch((e) => e);

      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect(error.reason).toBe(
        SurveysErrorReason.ASSIGNMENT_SERVICE_NOT_OFFERED,
      );
      expect(d.targetsRepo.findOfferingOf).toHaveBeenCalledWith(
        d.tx,
        OWNER,
        'svc-1',
      );
    });

    it('CARE_TYPE: «todas mis consultas» se acepta, también sin targetId', async () => {
      const d = ready();

      const res = await withTenant(() =>
        d.service.createAssignment({ ...base, targetType: 'CARE_TYPE' }, actor),
      );

      expect(res).toEqual({ id: 'asg-1' });
      expect(d.assignmentsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          targetTypeConceptId: TARGET_TYPE_BY_CODE.CARE_TYPE,
          targetId: SURVEYS.CARE_TYPE_CONSULTATION,
        }),
      );
    });

    it('CARE_TYPE: el id explícito de consulta también vale', async () => {
      const d = ready();

      await withTenant(() =>
        d.service.createAssignment(
          {
            ...base,
            targetType: 'CARE_TYPE',
            targetId: SURVEYS.CARE_TYPE_CONSULTATION,
          },
          actor,
        ),
      );

      expect(d.assignmentsRepo.create).toHaveBeenCalledTimes(1);
    });

    it('CARE_TYPE: cualquier otro tipo de atención sigue respondiendo 412', async () => {
      const d = ready();

      const error = await withTenant(() =>
        d.service.createAssignment(
          { ...base, targetType: 'CARE_TYPE', targetId: 'otro-tipo' },
          actor,
        ),
      ).catch((e) => e);

      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect(error.reason).toBe(
        SurveysErrorReason.ASSIGNMENT_CARE_TYPE_UNSUPPORTED,
      );
    });

    it('APPOINTMENT: una cita de otra organización responde 404', async () => {
      const d = ready();
      d.targetsRepo.findBooking.mockResolvedValue({
        id: 'bkg-9',
        tenantId: 'ten-otro',
      });

      await expect(
        withTenant(() =>
          d.service.createAssignment(
            { ...base, targetType: 'APPOINTMENT', targetId: 'bkg-9' },
            actor,
          ),
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('APPOINTMENT: una cita que atendió otro profesional responde 404', async () => {
      const d = ready();
      d.targetsRepo.findPractitionerOfBooking.mockResolvedValue('hp-otro');

      await expect(
        withTenant(() =>
          d.service.createAssignment(
            { ...base, targetType: 'APPOINTMENT', targetId: 'bkg-9' },
            actor,
          ),
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.assignmentsRepo.create).not.toHaveBeenCalled();
    });

    it('APPOINTMENT: una cita propia de la organización se acepta', async () => {
      const d = ready();

      await withTenant(() =>
        d.service.createAssignment(
          { ...base, targetType: 'APPOINTMENT', targetId: 'bkg-9' },
          actor,
        ),
      );

      expect(d.assignmentsRepo.create).toHaveBeenCalledTimes(1);
    });
  });
});

describe('SurveysAssignmentsService · revisión adversarial de F3', () => {
  /** Reserva de servicio. */
  const svcBooking = () =>
    completedBooking({
      practitionerServiceOfferingId: 'off-1',
      serviceSnapshot: { offeringId: 'off-1', serviceCatalogId: 'cat-1' },
    });

  describe('I-2: entre dos asignaciones gana la más específica y, a igual especificidad, la más reciente', () => {
    it('dos asignaciones SERVICE: la creada más tarde viaja detrás de la base y la anterior sale suelta', async () => {
      const d = build();
      d.tx.findOne.mockResolvedValue(svcBooking());
      d.assignmentsRepo.listActiveByTargets.mockResolvedValue([
        {
          id: 'asg-vieja',
          surveyVersionId: 'ver-vieja',
          targetTypeConceptId: SURVEYS.TARGET_SERVICE,
          createdAt: new Date('2026-01-01'),
        },
        {
          id: 'asg-nueva',
          surveyVersionId: 'ver-nueva',
          targetTypeConceptId: SURVEYS.TARGET_SERVICE,
          createdAt: new Date('2026-06-01'),
        },
      ]);
      // Dos plantillas distintas del mismo médico.
      d.templatesRepo.findVersionById.mockImplementation(
        async (_: unknown, id: string) =>
          publishedVersion({ id, surveyTemplateId: `tpl-${id}` }),
      );
      d.templatesRepo.findTemplateById.mockResolvedValue(activeTemplate());

      await withTenant(() =>
        d.service.issueForBooking({ appointmentBookingId: 'bkg-1' }, actor),
      );

      const [[, base], [, loose]] = d.invitationsRepo.create.mock.calls;
      expect(base.extensionSurveyVersionId).toBe('ver-nueva');
      expect(loose.surveyVersionId).toBe('ver-vieja');
    });
  });

  describe('I-3: la base ya emitida se reconoce por plantilla de sistema, no por versión exacta', () => {
    it('tras subir SYSTEM_BASE_SURVEY_VERSION un reintento no emite otra base', async () => {
      const d = build();
      d.tx.findOne.mockResolvedValue(completedBooking());
      // La base vigente es la versión 2; la invitación previa quedó en la 1.
      d.systemTemplates.ensureSystemTemplate.mockResolvedValue({
        ...BASE,
        versionId: 'ver-base-2',
      });
      d.invitationsRepo.listByBooking.mockResolvedValue([
        { id: 'inv-previa', surveyVersionId: 'ver-base-1' },
      ]);
      d.templatesRepo.findVersionById.mockResolvedValue(
        publishedVersion({
          id: 'ver-base-1',
          surveyTemplateId: BASE.templateId,
        }),
      );

      const res = await withTenant(() =>
        d.service.issueForBooking({ appointmentBookingId: 'bkg-1' }, actor),
      );

      expect(res).toEqual({ ids: [], alreadyIssued: 1 });
      expect(d.invitationsRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('M-1: de una plantilla sólo se reparte su versión más alta', () => {
    it('dos versiones de la misma plantilla asignadas: sólo la más alta viaja', async () => {
      const d = build();
      d.tx.findOne.mockResolvedValue(completedBooking());
      d.assignmentsRepo.listActiveByTargets.mockResolvedValue([
        {
          id: 'asg-v1',
          surveyVersionId: 'ver-1',
          targetTypeConceptId: SURVEYS.TARGET_CARE_TYPE,
          createdAt: new Date('2026-01-01'),
        },
        {
          id: 'asg-v2',
          surveyVersionId: 'ver-2',
          targetTypeConceptId: SURVEYS.TARGET_CARE_TYPE,
          createdAt: new Date('2026-02-01'),
        },
      ]);
      d.templatesRepo.findVersionById.mockImplementation(
        async (_: unknown, id: string) =>
          publishedVersion({ id, versionNumber: id === 'ver-2' ? 2 : 1 }),
      );
      d.templatesRepo.findTemplateById.mockResolvedValue(activeTemplate());

      const res = await withTenant(() =>
        d.service.issueForBooking({ appointmentBookingId: 'bkg-1' }, actor),
      );

      expect(res.ids).toHaveLength(1);
      const [, data] = d.invitationsRepo.create.mock.calls[0];
      expect(data.extensionSurveyVersionId).toBe('ver-2');
    });
  });

  describe('M-3: la emisión manual exige haber atendido la reserva', () => {
    it('un profesional no emite sobre la reserva que atendió otro (404)', async () => {
      const d = build();
      d.tx.findOne.mockResolvedValue(completedBooking());
      d.targetsRepo.findPractitionerOfBooking.mockResolvedValue('hp-otro');

      await expect(
        withTenant(() =>
          d.service.issueForBooking({ appointmentBookingId: 'bkg-1' }, actor),
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.invitationsRepo.create).not.toHaveBeenCalled();
    });

    it('si no se sabe quién atendió, un profesional tampoco emite', async () => {
      const d = build();
      d.tx.findOne.mockResolvedValue(completedBooking());
      d.targetsRepo.findPractitionerOfBooking.mockResolvedValue(null);

      await expect(
        withTenant(() =>
          d.service.issueForBooking({ appointmentBookingId: 'bkg-1' }, actor),
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('la administración de agenda emite sobre cualquier reserva', async () => {
      const d = build();
      d.tx.findOne.mockResolvedValue(completedBooking());
      d.targetsRepo.findPractitionerOfBooking.mockResolvedValue('hp-otro');
      const admin = { id: 'usr-adm', roles: ['SCHEDULING_ADMIN'] } as any;

      const res = await withTenant(() =>
        d.service.issueForBooking({ appointmentBookingId: 'bkg-1' }, admin),
      );

      expect(res.ids).toHaveLength(1);
    });

    it('la emisión automática del cierre no aplica esa regla', async () => {
      const d = build();
      d.tx.findOne.mockResolvedValue(completedBooking());
      d.targetsRepo.findPractitionerOfBooking.mockResolvedValue('hp-otro');

      const res = await withTenant(() =>
        d.service.issueForCompletedBooking('bkg-1', actor),
      );

      expect(res.ids).toHaveLength(1);
    });
  });

  describe('B-2: la base se materializa antes de abrir la transacción y el candado de la reserva', () => {
    it('ensureSystemTemplate corre antes de transactional y de bloquear la reserva', async () => {
      const d = build();
      d.tx.findOne.mockResolvedValue(completedBooking());

      await withTenant(() =>
        d.service.issueForBooking({ appointmentBookingId: 'bkg-1' }, actor),
      );

      const ensureOrder =
        d.systemTemplates.ensureSystemTemplate.mock.invocationCallOrder[0];
      expect(ensureOrder).toBeLessThan(
        d.em.transactional.mock.invocationCallOrder[0],
      );
      const lockCall = d.tx.findOne.mock.calls.findIndex(
        (call: any[]) => call[2]?.lockMode === LockMode.PESSIMISTIC_WRITE,
      );
      expect(ensureOrder).toBeLessThan(
        d.tx.findOne.mock.invocationCallOrder[lockCall],
      );
    });

    it('una reserva ajena o sin completar se rechaza sin materializar nada', async () => {
      const d = build();
      d.tx.findOne.mockResolvedValue(
        completedBooking({ statusConceptId: SCHED.BOOKING_IN_PROGRESS }),
      );

      await expect(
        withTenant(() =>
          d.service.issueForBooking({ appointmentBookingId: 'bkg-1' }, actor),
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.systemTemplates.ensureSystemTemplate).not.toHaveBeenCalled();
      expect(d.em.transactional).not.toHaveBeenCalled();
    });
  });

  describe('I-4: reservas completadas sin invitación (runbook)', () => {
    it('lista las del tenant activo con el estado completada y el tope pedido', async () => {
      const d = build();
      d.targetsRepo.listCompletedBookingsWithoutInvitation.mockResolvedValue([
        'bkg-a',
        'bkg-b',
      ]);

      const ids = await withTenant(() =>
        d.service.listCompletedBookingsWithoutInvitation(25),
      );

      expect(ids).toEqual(['bkg-a', 'bkg-b']);
      expect(
        d.targetsRepo.listCompletedBookingsWithoutInvitation,
      ).toHaveBeenCalledWith(
        expect.anything(),
        TENANT,
        SCHED.BOOKING_COMPLETED,
        25,
      );
    });
  });
});
