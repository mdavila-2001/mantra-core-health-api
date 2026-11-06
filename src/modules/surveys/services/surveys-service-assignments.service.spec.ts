import { jest } from '@jest/globals';
import { UniqueConstraintViolationException } from '@mikro-orm/core';
import {
  SurveysServiceAssignmentsService,
  standardSurveyIds,
} from './surveys-service-assignments.service';
import { ServiceSurveyOwnership } from './service-survey-ownership';
import { StandardSurveyMaterializer } from './standard-survey-materializer';
import { SurveysErrorReason } from '../surveys.error-reasons';
import { ANSWER_TYPE_BY_CODE, SURVEYS } from '../surveys.concepts';
import { SYSTEM_BASE_SURVEYS } from '../surveys.base-definitions';
import {
  STANDARD_SURVEY_CATALOG,
  findStandardSurvey,
} from '../surveys-standard.catalog';
import { SCHED } from '../../scheduling/domain/scheduling.concepts';
import {
  ConflictException,
  DomainException,
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Implementación opcional.
 * @returns El mock.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = 'ten-1';
const OTHER_TENANT = 'ten-2';
const DOCTOR = 'hp-1';
const SERVICE = 'svc-1';
const CODE = 'STD_IMAGING_V1';

const actor = {
  id: 'usr-doc',
  roles: ['PRACTITIONER'],
  practitionerProfileId: DOCTOR,
} as any;

/** Oferta activa del médico para `SERVICE`. */
const offering = {
  id: 'off-1',
  practitionerProfileId: DOCTOR,
  serviceCatalogId: SERVICE,
  statusConceptId: SCHED.OFFERING_ACTIVE,
};

/**
 * Sistema bajo prueba con dobles. Las escrituras quedan registradas en
 * `writes`, en orden, para comprobar baja-antes-que-alta.
 */
function build() {
  const writes: string[] = [];
  const tx: any = {
    flush: mockFn(async () => {
      writes.push('flush');
    }),
  };
  const em: any = { transactional: mockFn((cb: any) => cb(tx)) };
  em.fork = mockFn(() => em);

  const imported = {
    template: null as any,
    versions: [] as any[],
  };
  const templatesRepo = {
    findPractitionerTemplateByCatalogCode: mockFn(
      async () => imported.template,
    ),
    listVersions: mockFn(async () => imported.versions),
    findTemplateById: mockFn(async () => imported.template),
    findVersionById: mockFn(async () => null),
    findQuestionById: mockFn(async () => null),
    findTemplatesByIds: mockFn(async () => []),
    findVersionsByIds: mockFn(async () => []),
    createTemplate: mockFn((_: unknown, data: any) => {
      imported.template = { ...data, statusConceptId: data.statusConceptId };
      writes.push('template');
      return imported.template;
    }),
    createVersion: mockFn((_: unknown, data: any) => {
      imported.versions = [{ ...data }];
      writes.push('version');
      return imported.versions[0];
    }),
    createQuestion: mockFn((_: unknown, data: any) => {
      writes.push('question');
      return data;
    }),
  };
  const assignmentsRepo = {
    listActiveByTypeAndTargets: mockFn(async () => []),
    create: mockFn((_: unknown, data: any) => {
      writes.push('assignment');
      return {
        id: 'asg-new',
        createdAt: new Date('2026-11-06T12:00:00Z'),
        ...data,
      };
    }),
  };
  const targetsRepo = {
    listOfferingsOf: mockFn(async () => [offering]),
    lockOfferingsOf: mockFn(async () => [offering]),
    findServiceCatalog: mockFn(async (_: unknown, id: string) => ({
      id,
      practiceId: 'pr-1',
      name: 'Ecografía abdominal',
    })),
    findServiceCatalogs: mockFn(async (_: unknown, ids: string[]) =>
      ids.map((id) => ({ id, practiceId: 'pr-1', name: `Servicio ${id}` })),
    ),
    findTenantOfPractice: mockFn(async () => TENANT),
    findTenantsOfPractices: mockFn(
      async () =>
        new Map([
          ['pr-1', TENANT],
          ['pr-2', OTHER_TENANT],
        ]),
    ),
  };
  // Las plantillas importadas se leen y crean por su repositorio propio; los
  // dobles comparten estado con los de plantillas para mirar una sola lista.
  const standardRepo = {
    findByCatalogCode: templatesRepo.findPractitionerTemplateByCatalogCode,
    create: templatesRepo.createTemplate,
    findTemplatesByIds: templatesRepo.findTemplatesByIds,
    findVersionsByIds: templatesRepo.findVersionsByIds,
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new SurveysServiceAssignmentsService(
    em,
    templatesRepo as any,
    assignmentsRepo as any,
    new ServiceSurveyOwnership(
      assignmentsRepo as any,
      standardRepo as any,
      targetsRepo as any,
    ),
    new StandardSurveyMaterializer(
      em,
      templatesRepo as any,
      standardRepo as any,
      logger as any,
    ),
    logger as any,
  );
  return {
    service,
    em,
    tx,
    writes,
    imported,
    templatesRepo,
    assignmentsRepo,
    targetsRepo,
  };
}

/** Ejecuta dentro del tenant activo. */
function inTenant<T>(fn: () => Promise<T>): Promise<T> {
  return runWithTenant(TENANT, fn);
}

/** Una asignación activa del médico de una plantilla importada. */
function ownedAssignment(d: ReturnType<typeof build>, overrides: any = {}) {
  const assignment = {
    id: 'asg-old',
    surveyVersionId: 'ver-old',
    targetId: SERVICE,
    targetTypeConceptId: SURVEYS.TARGET_SERVICE,
    active: true,
    createdAt: new Date('2026-11-01T10:00:00Z'),
    ...overrides,
  };
  d.assignmentsRepo.listActiveByTypeAndTargets.mockResolvedValue([assignment]);
  d.templatesRepo.findVersionsByIds.mockResolvedValue([
    { id: assignment.surveyVersionId, surveyTemplateId: 'tpl-old' },
  ]);
  d.templatesRepo.findTemplatesByIds.mockResolvedValue([
    {
      id: 'tpl-old',
      title: 'Encuesta de su análisis de laboratorio',
      ownerPractitionerId: DOCTOR,
      standardCatalogCode: 'STD_LAB_V1',
    },
  ]);
  return assignment;
}

describe('SurveysServiceAssignmentsService', () => {
  describe('GET /surveys/catalog', () => {
    it('devuelve el catálogo estándar entero, con fuentes y dimensiones', () => {
      const { items } = build().service.getCatalog();
      expect(items.map((i) => i.code)).toEqual(
        STANDARD_SURVEY_CATALOG.map((s) => s.code),
      );
      const imaging = items.find((i) => i.code === CODE)!;
      const source = findStandardSurvey(CODE)!;
      expect(imaging.additionalSources).toEqual(source.additionalSources);
      expect(imaging.questions).toHaveLength(source.questions.length);
      expect(imaging.questions[0].dimension).toBe(
        source.questions[0].dimension,
      );
    });
  });

  describe('GET /surveys/service-assignments', () => {
    it('trae la cita médica fija (no reemplazable) y los servicios del médico con su encuesta', async () => {
      const d = build();
      ownedAssignment(d);

      const res = await inTenant(() => d.service.listServiceAssignments(actor));

      expect(res.consultation).toEqual({
        system: true,
        title: 'Cita médica',
        templateTitle: SYSTEM_BASE_SURVEYS.CONSULTATION.title,
        questionCount: SYSTEM_BASE_SURVEYS.CONSULTATION.questions.length,
        replaceable: false,
        questions: SYSTEM_BASE_SURVEYS.CONSULTATION.questions.map((q) => ({
          position: q.position,
          text: q.text,
          answerType: q.answerType,
          required: q.required,
          ...(q.options ? { options: [...q.options] } : {}),
          ...(q.scaleMin !== undefined ? { scaleMin: q.scaleMin } : {}),
          ...(q.scaleMax !== undefined ? { scaleMax: q.scaleMax } : {}),
        })),
      });
      // La base de consulta vigente: 12 preguntas, la primera una escala 1-5.
      expect(res.consultation.questions).toHaveLength(12);
      expect(res.consultation.questions[0]).toMatchObject({
        position: 1,
        answerType: 'SCALE',
        required: true,
        scaleMin: 1,
        scaleMax: 5,
      });
      expect(res.consultation.questions[0]).not.toHaveProperty('dimension');
      expect(res.services).toEqual([
        {
          serviceId: SERVICE,
          serviceName: `Servicio ${SERVICE}`,
          serviceKind: 'OTHER',
          assignment: {
            assignmentId: 'asg-old',
            catalogCode: 'STD_LAB_V1',
            title: 'Encuesta de su análisis de laboratorio',
            templateId: 'tpl-old',
            versionId: 'ver-old',
            assignedAt: '2026-11-01T10:00:00.000Z',
          },
        },
      ]);
      // Sólo ofertas activas.
      expect(d.targetsRepo.listOfferingsOf).toHaveBeenCalledWith(
        expect.anything(),
        DOCTOR,
        SCHED.OFFERING_ACTIVE,
      );
    });

    it('lee sobre la transacción de la petición (RLS), nunca con un fork plano', async () => {
      const d = build();
      await inTenant(() => d.service.listServiceAssignments(actor));
      expect(d.em.fork).toHaveBeenCalledWith({ keepTransactionContext: true });
      expect(d.em.fork).not.toHaveBeenCalledWith();
    });

    it('un servicio sin encuesta propia sale con assignment = null', async () => {
      const d = build();
      const res = await inTenant(() => d.service.listServiceAssignments(actor));
      expect(res.services).toEqual([
        {
          serviceId: SERVICE,
          serviceName: `Servicio ${SERVICE}`,
          serviceKind: 'OTHER',
          assignment: null,
        },
      ]);
    });

    it('cada servicio lleva su tipo, derivado en el servidor de su nombre', async () => {
      const d = build();
      d.targetsRepo.findServiceCatalogs.mockResolvedValue([
        { id: SERVICE, practiceId: 'pr-1', name: 'Hemograma completo' },
      ]);
      const res = await inTenant(() => d.service.listServiceAssignments(actor));
      expect(res.services[0].serviceKind).toBe('LAB');
    });

    it('omite los servicios de prácticas de otra organización', async () => {
      const d = build();
      d.targetsRepo.findServiceCatalogs.mockResolvedValue([
        { id: SERVICE, practiceId: 'pr-2', name: 'Ajeno' },
      ]);
      const res = await inTenant(() => d.service.listServiceAssignments(actor));
      expect(res.services).toEqual([]);
    });

    it('no cuenta la asignación de otro profesional al mismo servicio', async () => {
      const d = build();
      ownedAssignment(d);
      d.templatesRepo.findTemplatesByIds.mockResolvedValue([
        { id: 'tpl-old', title: 'X', ownerPractitionerId: 'hp-otro' },
      ]);
      const res = await inTenant(() => d.service.listServiceAssignments(actor));
      expect(res.services[0].assignment).toBeNull();
    });

    it('una asignación escrita a mano (no del catálogo) no cuenta: la emisión no la manda, el servicio usa la base', async () => {
      const d = build();
      ownedAssignment(d);
      d.templatesRepo.findTemplatesByIds.mockResolvedValue([
        {
          id: 'tpl-old',
          title: 'Satisfacción con el servicio',
          ownerPractitionerId: DOCTOR,
          standardCatalogCode: undefined,
        },
      ]);
      const res = await inTenant(() => d.service.listServiceAssignments(actor));
      expect(res.services[0].assignment).toBeNull();
    });

    it('una del catálogo con la plantilla desactivada tampoco cuenta', async () => {
      const d = build();
      ownedAssignment(d);
      d.templatesRepo.findTemplatesByIds.mockResolvedValue([
        {
          id: 'tpl-old',
          title: 'X',
          ownerPractitionerId: DOCTOR,
          standardCatalogCode: 'STD_LAB_V1',
          statusConceptId: SURVEYS.TEMPLATE_INACTIVE,
        },
      ]);
      const res = await inTenant(() => d.service.listServiceAssignments(actor));
      expect(res.services[0].assignment).toBeNull();
    });

    it('sin perfil profesional responde 412', async () => {
      const d = build();
      await expect(
        inTenant(() =>
          d.service.listServiceAssignments({
            id: 'u',
            roles: ['CLINICIAN'],
          } as any),
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('PUT /surveys/service-assignments/:serviceId', () => {
    it('materializa la plantilla del catálogo (publicada, preguntas opcionales) y la asocia', async () => {
      const d = build();
      const entry = findStandardSurvey(CODE)!;
      const ids = standardSurveyIds(TENANT, DOCTOR, CODE);

      const row = await inTenant(() =>
        d.service.importServiceSurvey(SERVICE, { catalogCode: CODE }, actor),
      );

      expect(d.templatesRepo.createTemplate).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          id: ids.templateId,
          tenantId: TENANT,
          ownerPractitionerId: DOCTOR,
          standardCatalogCode: CODE,
          title: entry.title,
          statusConceptId: SURVEYS.TEMPLATE_ACTIVE,
        }),
      );
      expect(d.templatesRepo.createVersion).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          id: ids.versionId,
          versionNumber: 1,
          publicationStatusConceptId: SURVEYS.VERSION_PUBLISHED,
        }),
      );
      expect(d.templatesRepo.createQuestion).toHaveBeenCalledTimes(
        entry.questions.length,
      );
      const [, first] = d.templatesRepo.createQuestion.mock.calls[0];
      expect(first).toEqual(
        expect.objectContaining({
          position: 1,
          questionText: entry.questions[0].text,
          answerTypeConceptId:
            ANSWER_TYPE_BY_CODE[entry.questions[0].answerType],
          required: false,
        }),
      );
      expect(d.assignmentsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          surveyVersionId: ids.versionId,
          tenantId: TENANT,
          targetTypeConceptId: SURVEYS.TARGET_SERVICE,
          targetId: SERVICE,
          ownerPractitionerId: DOCTOR,
          active: true,
        }),
      );
      expect(row).toEqual({
        serviceId: SERVICE,
        serviceName: 'Ecografía abdominal',
        serviceKind: 'IMAGING',
        assignment: {
          assignmentId: 'asg-new',
          catalogCode: CODE,
          title: entry.title,
          templateId: ids.templateId,
          versionId: ids.versionId,
          assignedAt: '2026-11-06T12:00:00.000Z',
        },
      });
    });

    it('reutiliza la plantilla ya importada (idempotente): no crea otra', async () => {
      const d = build();
      d.imported.template = {
        id: 'tpl-imp',
        title: 'Encuesta de su estudio de imagen',
        statusConceptId: SURVEYS.TEMPLATE_ACTIVE,
      };
      d.imported.versions = [
        {
          id: 'ver-imp',
          publicationStatusConceptId: SURVEYS.VERSION_PUBLISHED,
        },
      ];

      const row = await inTenant(() =>
        d.service.importServiceSurvey(SERVICE, { catalogCode: CODE }, actor),
      );

      expect(d.templatesRepo.createTemplate).not.toHaveBeenCalled();
      expect(row.assignment?.versionId).toBe('ver-imp');
    });

    it('desactiva la asociación anterior y la baja llega a la base antes del alta', async () => {
      const d = build();
      const old = ownedAssignment(d);

      await inTenant(() =>
        d.service.importServiceSurvey(SERVICE, { catalogCode: CODE }, actor),
      );

      expect(old.active).toBe(false);
      const assignmentAt = d.writes.lastIndexOf('assignment');
      expect(assignmentAt).toBeGreaterThan(0);
      // Hubo un flush entre el último cambio previo y el alta.
      expect(d.writes[assignmentAt - 1]).toBe('flush');
      expect(d.targetsRepo.lockOfferingsOf).toHaveBeenCalledWith(
        d.tx,
        DOCTOR,
        SERVICE,
      );
    });

    it('importar reemplaza una escrita a mano activa en el servicio, y la respuesta trae la del catálogo', async () => {
      const d = build();
      const legacy = ownedAssignment(d);
      d.templatesRepo.findTemplatesByIds.mockResolvedValue([
        {
          id: 'tpl-old',
          title: 'Satisfacción con el servicio',
          ownerPractitionerId: DOCTOR,
          standardCatalogCode: undefined,
        },
      ]);

      const row = await inTenant(() =>
        d.service.importServiceSurvey(SERVICE, { catalogCode: CODE }, actor),
      );

      expect(legacy.active).toBe(false);
      expect(d.assignmentsRepo.create).toHaveBeenCalledTimes(1);
      expect(row.assignment).toMatchObject({ catalogCode: CODE });
    });

    it('si el servicio ya tiene esa misma encuesta, no la reemplaza', async () => {
      const d = build();
      const ids = standardSurveyIds(TENANT, DOCTOR, CODE);
      d.imported.template = {
        id: ids.templateId,
        title: 'Imagen',
        statusConceptId: SURVEYS.TEMPLATE_ACTIVE,
      };
      d.imported.versions = [
        {
          id: ids.versionId,
          publicationStatusConceptId: SURVEYS.VERSION_PUBLISHED,
        },
      ];
      const current = ownedAssignment(d, { surveyVersionId: ids.versionId });

      const row = await inTenant(() =>
        d.service.importServiceSurvey(SERVICE, { catalogCode: CODE }, actor),
      );

      expect(current.active).toBe(true);
      expect(d.assignmentsRepo.create).not.toHaveBeenCalled();
      expect(row.assignment?.assignmentId).toBe('asg-old');
    });

    it('un servicio que el médico no ofrece responde 403 SURVEY_SERVICE_NOT_OWNED, sin escribir', async () => {
      const d = build();
      d.targetsRepo.listOfferingsOf.mockResolvedValue([]);

      const error = await inTenant(() =>
        d.service.importServiceSurvey(SERVICE, { catalogCode: CODE }, actor),
      ).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(DomainException);
      expect((error as DomainException).getStatus()).toBe(403);
      expect((error as any).reason).toBe(SurveysErrorReason.SERVICE_NOT_OWNED);
      expect(d.templatesRepo.createTemplate).not.toHaveBeenCalled();
    });

    it('una oferta inactiva tampoco cuenta como servicio del médico (403)', async () => {
      const d = build();
      d.targetsRepo.listOfferingsOf.mockResolvedValue([
        { ...offering, statusConceptId: SCHED.OFFERING_INACTIVE },
      ]);
      await expect(
        inTenant(() =>
          d.service.importServiceSurvey(SERVICE, { catalogCode: CODE }, actor),
        ),
      ).rejects.toBeInstanceOf(DomainException);
    });

    it('un servicio de una práctica de otra organización responde 403', async () => {
      const d = build();
      d.targetsRepo.findTenantOfPractice.mockResolvedValue(OTHER_TENANT);
      const error = await inTenant(() =>
        d.service.importServiceSurvey(SERVICE, { catalogCode: CODE }, actor),
      ).catch((e: unknown) => e);
      expect((error as DomainException).getStatus()).toBe(403);
    });

    it('un código que no está en el catálogo responde 404 SURVEY_CATALOG_CODE_UNKNOWN', async () => {
      const d = build();
      const error = await inTenant(() =>
        d.service.importServiceSurvey(
          SERVICE,
          { catalogCode: 'STD_NO_EXISTE_V9' },
          actor,
        ),
      ).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(ResourceNotFoundException);
      expect((error as any).reason).toBe(
        SurveysErrorReason.CATALOG_CODE_UNKNOWN,
      );
    });

    it('perder la carrera del índice de una activa por servicio responde 409', async () => {
      const d = build();
      d.assignmentsRepo.create.mockImplementation(() => {
        throw new UniqueConstraintViolationException(new Error('23505'));
      });
      const error = await inTenant(() =>
        d.service.importServiceSurvey(SERVICE, { catalogCode: CODE }, actor),
      ).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(ConflictException);
      expect((error as any).reason).toBe(
        SurveysErrorReason.ASSIGNMENT_ALREADY_ACTIVE,
      );
    });

    it('perder la carrera de la materialización relee la plantilla ganadora', async () => {
      const d = build();
      let attempts = 0;
      d.em.transactional.mockImplementation(async (cb: any) => {
        attempts += 1;
        if (attempts === 1) {
          // La otra importación escribió la plantilla mientras tanto.
          d.imported.template = {
            id: 'tpl-win',
            title: 'X',
            statusConceptId: SURVEYS.TEMPLATE_ACTIVE,
          };
          d.imported.versions = [
            {
              id: 'ver-win',
              publicationStatusConceptId: SURVEYS.VERSION_PUBLISHED,
            },
          ];
          throw new UniqueConstraintViolationException(new Error('23505'));
        }
        return cb(d.tx);
      });

      const row = await inTenant(() =>
        d.service.importServiceSurvey(SERVICE, { catalogCode: CODE }, actor),
      );
      expect(row.assignment?.versionId).toBe('ver-win');
    });
  });

  describe('DELETE /surveys/service-assignments/:serviceId', () => {
    it('desactiva la encuesta del servicio (vuelve a la base de servicio)', async () => {
      const d = build();
      const old = ownedAssignment(d);
      await inTenant(() => d.service.removeServiceSurvey(SERVICE, actor));
      expect(old.active).toBe(false);
      expect(d.tx.flush).toHaveBeenCalled();
    });

    it('es idempotente sin encuesta asociada', async () => {
      const d = build();
      await expect(
        inTenant(() => d.service.removeServiceSurvey(SERVICE, actor)),
      ).resolves.toBeUndefined();
    });

    it('un servicio ajeno responde 403', async () => {
      const d = build();
      d.targetsRepo.lockOfferingsOf.mockResolvedValue([]);
      await expect(
        inTenant(() => d.service.removeServiceSurvey(SERVICE, actor)),
      ).rejects.toBeInstanceOf(DomainException);
    });
  });
});
