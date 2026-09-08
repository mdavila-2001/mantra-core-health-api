import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { SurveysTemplatesService } from './surveys-templates.service';
import { SURVEYS, ANSWER_TYPE_BY_CODE } from '../surveys.concepts';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';

const TENANT = 'ten-1';
const OWNER = 'hp-1';
const OTHER_OWNER = 'hp-2';

const actor = {
  id: 'usr-1',
  roles: ['PRACTITIONER'],
  practitionerProfileId: OWNER,
} as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const templatesRepo = {
    findTemplateById: mockFn(),
    listTemplatesByOwner: mockFn().mockResolvedValue([]),
    createTemplate: mockFn(),
    findVersionById: mockFn(),
    findLatestVersion: mockFn(),
    findVersionByNumber: mockFn(),
    createVersion: mockFn(),
    listQuestions: mockFn().mockResolvedValue([]),
    countQuestions: mockFn().mockResolvedValue(0),
    createQuestion: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new SurveysTemplatesService(
    em as any,
    templatesRepo as any,
    logger as any,
  );
  return { service, tx, templatesRepo };
}

/** Plantilla del profesional dueño, en el tenant de la prueba. */
function ownedTemplate(overrides: Record<string, unknown> = {}) {
  return {
    id: 'tpl-1',
    tenantId: TENANT,
    ownerPractitionerId: OWNER,
    title: 'Satisfacción post-consulta',
    statusConceptId: SURVEYS.TEMPLATE_DRAFT,
    ...overrides,
  };
}

/** Ejecuta dentro del contexto de tenant que exigen las lecturas. */
function withTenant<T>(fn: () => Promise<T>): Promise<T> {
  return runWithTenant(TENANT, fn);
}

describe('SurveysTemplatesService', () => {
  describe('createTemplate', () => {
    it('crea la plantilla junto con su versión 1 en borrador', async () => {
      const d = build();
      d.templatesRepo.createTemplate.mockReturnValue({ id: 'tpl-1' });
      d.templatesRepo.createVersion.mockReturnValue({
        id: 'ver-1',
        versionNumber: 1,
      });

      const res = await withTenant(() =>
        d.service.createTemplate({ title: 'Satisfacción' } as any, actor),
      );

      expect(res).toEqual({
        id: 'tpl-1',
        versionId: 'ver-1',
        versionNumber: 1,
      });
      expect(d.templatesRepo.createVersion).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          versionNumber: 1,
          publicationStatusConceptId: SURVEYS.VERSION_DRAFT,
          responseWindowDays: 30,
        }),
      );
    });

    it('rechaza a una sesión sin perfil profesional', async () => {
      const d = build();
      await expect(
        withTenant(() =>
          d.service.createTemplate(
            { title: 'X' } as any,
            {
              id: 'u',
              roles: [],
            } as any,
          ),
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('addQuestion', () => {
    it('agrega la pregunta a la versión en borrador con su posición', async () => {
      const d = build();
      d.templatesRepo.findTemplateById.mockResolvedValue(ownedTemplate());
      d.templatesRepo.findLatestVersion.mockResolvedValue({
        id: 'ver-1',
        publicationStatusConceptId: SURVEYS.VERSION_DRAFT,
        versionNumber: 1,
      });
      d.templatesRepo.countQuestions.mockResolvedValue(2);
      d.templatesRepo.createQuestion.mockReturnValue({
        id: 'q-3',
        position: 3,
        questionText: '¿Volvería?',
        answerTypeConceptId: ANSWER_TYPE_BY_CODE.BOOLEAN,
        required: true,
      });

      const res = await withTenant(() =>
        d.service.addQuestion(
          'tpl-1',
          { questionText: '¿Volvería?', answerType: 'BOOLEAN', required: true },
          actor,
        ),
      );

      expect(res.position).toBe(3);
      expect(res.answerType).toBe('BOOLEAN');
    });

    it('no deja tocar una versión ya publicada', async () => {
      const d = build();
      d.templatesRepo.findTemplateById.mockResolvedValue(ownedTemplate());
      d.templatesRepo.findLatestVersion.mockResolvedValue({
        id: 'ver-1',
        publicationStatusConceptId: SURVEYS.VERSION_PUBLISHED,
        versionNumber: 1,
      });

      await expect(
        withTenant(() =>
          d.service.addQuestion(
            'tpl-1',
            { questionText: 'X', answerType: 'TEXT' } as any,
            actor,
          ),
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('exige al menos dos opciones en una pregunta de elección', async () => {
      const d = build();
      await expect(
        withTenant(() =>
          d.service.addQuestion(
            'tpl-1',
            {
              questionText: 'X',
              answerType: 'SINGLE_CHOICE',
              options: ['Sí'],
            } as any,
            actor,
          ),
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rechaza opciones en una pregunta que no las admite', async () => {
      const d = build();
      await expect(
        withTenant(() =>
          d.service.addQuestion(
            'tpl-1',
            {
              questionText: 'X',
              answerType: 'TEXT',
              options: ['a', 'b'],
            } as any,
            actor,
          ),
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rechaza una escala con máximo menor o igual al mínimo', async () => {
      const d = build();
      await expect(
        withTenant(() =>
          d.service.addQuestion(
            'tpl-1',
            {
              questionText: 'X',
              answerType: 'SCALE',
              scaleMin: 5,
              scaleMax: 5,
            } as any,
            actor,
          ),
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('esconde con 404 la plantilla de otro profesional', async () => {
      const d = build();
      d.templatesRepo.findTemplateById.mockResolvedValue(
        ownedTemplate({ ownerPractitionerId: OTHER_OWNER }),
      );
      await expect(
        withTenant(() =>
          d.service.addQuestion(
            'tpl-1',
            { questionText: 'X', answerType: 'TEXT' } as any,
            actor,
          ),
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('esconde con 404 la plantilla de otra organización', async () => {
      const d = build();
      d.templatesRepo.findTemplateById.mockResolvedValue(
        ownedTemplate({ tenantId: 'ten-otro' }),
      );
      await expect(
        withTenant(() =>
          d.service.addQuestion(
            'tpl-1',
            { questionText: 'X', answerType: 'TEXT' } as any,
            actor,
          ),
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('publishVersion', () => {
    it('publica, fija vigencia y activa la plantilla', async () => {
      const d = build();
      const template = ownedTemplate();
      const version = {
        id: 'ver-1',
        versionNumber: 1,
        publicationStatusConceptId: SURVEYS.VERSION_DRAFT,
        updatedAt: new Date(),
      };
      d.templatesRepo.findTemplateById.mockResolvedValue(template);
      d.templatesRepo.findVersionByNumber.mockResolvedValue(version);
      d.templatesRepo.countQuestions.mockResolvedValue(3);

      const res = await withTenant(() =>
        d.service.publishVersion('tpl-1', 1, {}, actor),
      );

      expect(res).toEqual({ ok: true });
      expect(version.publicationStatusConceptId).toBe(
        SURVEYS.VERSION_PUBLISHED,
      );
      expect(template.statusConceptId).toBe(SURVEYS.TEMPLATE_ACTIVE);
    });

    it('no publica un cuestionario sin preguntas', async () => {
      const d = build();
      d.templatesRepo.findTemplateById.mockResolvedValue(ownedTemplate());
      d.templatesRepo.findVersionByNumber.mockResolvedValue({
        id: 'ver-1',
        versionNumber: 1,
        publicationStatusConceptId: SURVEYS.VERSION_DRAFT,
      });
      d.templatesRepo.countQuestions.mockResolvedValue(0);

      await expect(
        withTenant(() => d.service.publishVersion('tpl-1', 1, {}, actor)),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('no publica dos veces la misma versión', async () => {
      const d = build();
      d.templatesRepo.findTemplateById.mockResolvedValue(ownedTemplate());
      d.templatesRepo.findVersionByNumber.mockResolvedValue({
        id: 'ver-1',
        versionNumber: 1,
        publicationStatusConceptId: SURVEYS.VERSION_PUBLISHED,
      });

      await expect(
        withTenant(() => d.service.publishVersion('tpl-1', 1, {}, actor)),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rechaza una vigencia que termina antes de empezar', async () => {
      const d = build();
      d.templatesRepo.findTemplateById.mockResolvedValue(ownedTemplate());
      d.templatesRepo.findVersionByNumber.mockResolvedValue({
        id: 'ver-1',
        versionNumber: 1,
        publicationStatusConceptId: SURVEYS.VERSION_DRAFT,
      });
      d.templatesRepo.countQuestions.mockResolvedValue(1);

      await expect(
        withTenant(() =>
          d.service.publishVersion(
            'tpl-1',
            1,
            {
              effectiveFrom: '2026-09-01T00:00:00.000Z',
              effectiveTo: '2026-08-01T00:00:00.000Z',
            },
            actor,
          ),
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('createNextVersion (FT-31)', () => {
    it('abre la versión 2 en borrador cuando la 1 ya está publicada', async () => {
      const d = build();
      d.templatesRepo.findTemplateById.mockResolvedValue(ownedTemplate());
      d.templatesRepo.findLatestVersion.mockResolvedValue({
        id: 'ver-1',
        versionNumber: 1,
        publicationStatusConceptId: SURVEYS.VERSION_PUBLISHED,
        responseWindowDays: 45,
      });
      d.templatesRepo.createVersion.mockReturnValue({
        id: 'ver-2',
        versionNumber: 2,
      });

      const res = await withTenant(() =>
        d.service.createNextVersion('tpl-1', actor),
      );

      expect(res).toEqual({
        id: 'tpl-1',
        versionId: 'ver-2',
        versionNumber: 2,
      });
      expect(d.templatesRepo.createVersion).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          versionNumber: 2,
          publicationStatusConceptId: SURVEYS.VERSION_DRAFT,
          // Hereda el plazo de la versión anterior en vez de volver al default.
          responseWindowDays: 45,
        }),
      );
    });

    it('no abre una segunda versión en borrador si ya hay una sin publicar', async () => {
      const d = build();
      d.templatesRepo.findTemplateById.mockResolvedValue(ownedTemplate());
      d.templatesRepo.findLatestVersion.mockResolvedValue({
        id: 'ver-1',
        versionNumber: 1,
        publicationStatusConceptId: SURVEYS.VERSION_DRAFT,
      });

      await expect(
        withTenant(() => d.service.createNextVersion('tpl-1', actor)),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(d.templatesRepo.createVersion).not.toHaveBeenCalled();
    });

    it('una plantilla sin ninguna versión es 404', async () => {
      const d = build();
      d.templatesRepo.findTemplateById.mockResolvedValue(ownedTemplate());
      d.templatesRepo.findLatestVersion.mockResolvedValue(null);

      await expect(
        withTenant(() => d.service.createNextVersion('tpl-1', actor)),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('una plantilla ajena es 404, igual que en el resto del servicio', async () => {
      const d = build();
      d.templatesRepo.findTemplateById.mockResolvedValue(
        ownedTemplate({ ownerPractitionerId: OTHER_OWNER }),
      );

      await expect(
        withTenant(() => d.service.createNextVersion('tpl-1', actor)),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('deactivateTemplate', () => {
    it('desactiva la plantilla', async () => {
      const d = build();
      const template = ownedTemplate({
        statusConceptId: SURVEYS.TEMPLATE_ACTIVE,
        updatedAt: new Date(),
      });
      d.templatesRepo.findTemplateById.mockResolvedValue(template);

      const res = await withTenant(() =>
        d.service.deactivateTemplate('tpl-1', actor),
      );

      expect(res).toEqual({ ok: true });
      expect(template.statusConceptId).toBe(SURVEYS.TEMPLATE_INACTIVE);
    });

    it('no desactiva dos veces', async () => {
      const d = build();
      d.templatesRepo.findTemplateById.mockResolvedValue(
        ownedTemplate({ statusConceptId: SURVEYS.TEMPLATE_INACTIVE }),
      );
      await expect(
        withTenant(() => d.service.deactivateTemplate('tpl-1', actor)),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
