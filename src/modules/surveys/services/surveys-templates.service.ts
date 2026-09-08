import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  requireTenantId,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { TemplatesRepository } from '../repositories';
import {
  AddQuestionDto,
  CreateTemplateDto,
  PublishVersionDto,
  QuestionDto,
  TemplateCreatedDto,
  TemplateDetailDto,
  TemplateSummaryDto,
  OkResultDto,
} from '../dto';
import {
  ANSWER_TYPE_BY_CODE,
  ANSWER_TYPE_CODE_BY_ID,
  ANSWER_TYPES_REQUIRING_OPTIONS,
  SURVEYS,
} from '../surveys.concepts';
import type { SurveyQuestions, SurveyTemplates } from '../entities';

/** Plazo por defecto, en días, para responder una encuesta. */
const DEFAULT_RESPONSE_WINDOW_DAYS = 30;

/** Estado de plantilla expuesto por el contrato → concept id que lo respalda. */
const TEMPLATE_STATUS_CODE_BY_ID: Readonly<
  Record<string, 'DRAFT' | 'ACTIVE' | 'INACTIVE'>
> = {
  [SURVEYS.TEMPLATE_DRAFT]: 'DRAFT',
  [SURVEYS.TEMPLATE_ACTIVE]: 'ACTIVE',
  [SURVEYS.TEMPLATE_INACTIVE]: 'INACTIVE',
};

/**
 * Autoría del instrumento: crear la plantilla, componer su cuestionario,
 * publicarlo con vigencia y retirarlo.
 *
 * El eje de todo el servicio es que **publicar congela**. Mientras la versión
 * es borrador se le agregan preguntas; una vez publicada no se toca más, y
 * corregir el instrumento significa crear la versión siguiente. Sin esa regla,
 * una respuesta guardada hace meses no se podría interpretar: no habría forma
 * de saber qué preguntaba exactamente el cuestionario que la persona vio.
 */
@Injectable()
export class SurveysTemplatesService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param templatesRepo - Acceso a plantillas, versiones y preguntas.
   * @param logger - Registro estructurado del módulo.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly templatesRepo: TemplatesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SurveysTemplatesService.name);
  }

  /** Crea la plantilla junto con su versión 1 en borrador. */
  async createTemplate(
    dto: CreateTemplateDto,
    actor: AuthenticatedUser,
  ): Promise<TemplateCreatedDto> {
    const tenantId = requireTenantId();
    const ownerPractitionerId = this.resolveOwner(
      dto.ownerPractitionerId,
      actor,
    );

    return this.em.transactional(async (tx) => {
      const template = this.templatesRepo.createTemplate(tx, {
        tenantId,
        ownerPractitionerId,
        title: dto.title,
        description: dto.description,
        statusConceptId: SURVEYS.TEMPLATE_DRAFT,
        actorUserId: actor.id,
      });
      // Padre antes que hijo: la versión referencia la plantilla por columna
      // uuid plana, así que necesita el id ya materializado.
      await tx.flush();

      const version = this.templatesRepo.createVersion(tx, {
        surveyTemplateId: template.id,
        versionNumber: 1,
        publicationStatusConceptId: SURVEYS.VERSION_DRAFT,
        responseWindowDays:
          dto.responseWindowDays ?? DEFAULT_RESPONSE_WINDOW_DAYS,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        { operation: 'surveys.template.create', templateId: template.id },
        'Survey template created',
      );
      return {
        id: template.id,
        versionId: version.id,
        versionNumber: version.versionNumber,
      };
    });
  }

  /**
   * Abre una versión nueva, en borrador, para corregir el cuestionario de una
   * plantilla ya publicada (FT-31).
   *
   * Publicar congela a propósito (ver la nota de la clase): esta es la única
   * puerta para volver a tocar las preguntas sin desconocer lo que respondió
   * alguien con la versión anterior. La versión vieja no se toca — sigue
   * siendo la que interpretan sus respuestas ya guardadas — y la asignación al
   * servicio/consulta actual sigue apuntando a ella hasta que la nueva versión
   * se publique y alguien la vuelva a asociar; no se reasigna sola.
   */
  async createNextVersion(
    templateId: string,
    actor: AuthenticatedUser,
  ): Promise<TemplateCreatedDto> {
    return this.em.transactional(async (tx) => {
      const template = await this.loadOwnedTemplate(tx, templateId, actor);
      const latest = await this.templatesRepo.findLatestVersion(
        tx,
        template.id,
      );
      if (!latest) {
        throw new ResourceNotFoundException('La plantilla no tiene versiones', {
          templateId,
        });
      }
      if (latest.publicationStatusConceptId === SURVEYS.VERSION_DRAFT) {
        throw new ConflictException(
          'Ya hay una versión en borrador: termine de editarla o publíquela antes de abrir otra',
          { templateId, versionNumber: latest.versionNumber },
        );
      }

      const version = this.templatesRepo.createVersion(tx, {
        surveyTemplateId: template.id,
        versionNumber: latest.versionNumber + 1,
        publicationStatusConceptId: SURVEYS.VERSION_DRAFT,
        responseWindowDays: latest.responseWindowDays,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        {
          operation: 'surveys.version.createNext',
          templateId,
          versionNumber: version.versionNumber,
        },
        'Survey next version opened as draft',
      );
      return {
        id: template.id,
        versionId: version.id,
        versionNumber: version.versionNumber,
      };
    });
  }

  /** Agrega una pregunta a la versión en borrador de la plantilla. */
  async addQuestion(
    templateId: string,
    dto: AddQuestionDto,
    actor: AuthenticatedUser,
  ): Promise<QuestionDto> {
    this.validateQuestionShape(dto);

    return this.em.transactional(async (tx) => {
      const template = await this.loadOwnedTemplate(tx, templateId, actor);
      const version = await this.templatesRepo.findLatestVersion(
        tx,
        template.id,
      );
      if (!version) {
        throw new ResourceNotFoundException('La plantilla no tiene versiones', {
          templateId,
        });
      }
      if (version.publicationStatusConceptId !== SURVEYS.VERSION_DRAFT) {
        throw new PreconditionFailedException(
          'La versión ya está publicada: cree una versión nueva para modificar el cuestionario',
          { templateId, versionNumber: version.versionNumber },
        );
      }

      const position =
        (await this.templatesRepo.countQuestions(tx, version.id)) + 1;
      const question = this.templatesRepo.createQuestion(tx, {
        surveyVersionId: version.id,
        position,
        questionText: dto.questionText,
        answerTypeConceptId: ANSWER_TYPE_BY_CODE[dto.answerType],
        required: dto.required ?? false,
        options: dto.answerType === 'TEXT' ? undefined : dto.options,
        scaleMin: dto.answerType === 'SCALE' ? (dto.scaleMin ?? 1) : undefined,
        scaleMax: dto.answerType === 'SCALE' ? (dto.scaleMax ?? 5) : undefined,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        {
          operation: 'surveys.question.add',
          templateId,
          questionId: question.id,
        },
        'Survey question added',
      );
      return this.toQuestionDto(question);
    });
  }

  /** Publica la versión indicada y le fija vigencia. */
  async publishVersion(
    templateId: string,
    versionNumber: number,
    dto: PublishVersionDto,
    actor: AuthenticatedUser,
  ): Promise<OkResultDto> {
    return this.em.transactional(async (tx) => {
      const template = await this.loadOwnedTemplate(tx, templateId, actor);
      const version = await this.templatesRepo.findVersionByNumber(
        tx,
        template.id,
        versionNumber,
      );
      if (!version) {
        throw new ResourceNotFoundException('Versión no encontrada', {
          templateId,
          versionNumber,
        });
      }
      if (version.publicationStatusConceptId !== SURVEYS.VERSION_DRAFT) {
        throw new ConflictException('La versión ya fue publicada', {
          templateId,
          versionNumber,
        });
      }

      // Publicar un cuestionario sin preguntas produciría invitaciones que no
      // se pueden responder: el paciente vería una pantalla vacía y el
      // profesional esperaría respuestas que nunca pueden llegar.
      const questionCount = await this.templatesRepo.countQuestions(
        tx,
        version.id,
      );
      if (questionCount === 0) {
        throw new PreconditionFailedException(
          'No se puede publicar un cuestionario sin preguntas',
          { templateId, versionNumber },
        );
      }

      const effectiveFrom = dto.effectiveFrom
        ? new Date(dto.effectiveFrom)
        : new Date();
      const effectiveTo = dto.effectiveTo
        ? new Date(dto.effectiveTo)
        : undefined;
      if (effectiveTo && effectiveTo <= effectiveFrom) {
        throw new PreconditionFailedException(
          'El fin de vigencia debe ser posterior al inicio',
          { effectiveFrom, effectiveTo },
        );
      }

      version.publicationStatusConceptId = SURVEYS.VERSION_PUBLISHED;
      version.effectiveFrom = effectiveFrom;
      version.effectiveTo = effectiveTo;
      version.publishedAt = new Date();
      touch(version, actor.id);

      template.statusConceptId = SURVEYS.TEMPLATE_ACTIVE;
      touch(template, actor.id);

      this.logger.info(
        { operation: 'surveys.version.publish', templateId, versionNumber },
        'Survey version published',
      );
      return { ok: true };
    });
  }

  /**
   * Desactiva la plantilla.
   *
   * No borra nada: las invitaciones ya emitidas siguen siendo contestables y
   * las respuestas dadas siguen siendo legibles. Lo que se corta es la emisión
   * de invitaciones nuevas — que es lo que ALOVIDA pide con «modificar o
   * desactivar encuestas».
   */
  async deactivateTemplate(
    templateId: string,
    actor: AuthenticatedUser,
  ): Promise<OkResultDto> {
    return this.em.transactional(async (tx) => {
      const template = await this.loadOwnedTemplate(tx, templateId, actor);
      if (template.statusConceptId === SURVEYS.TEMPLATE_INACTIVE) {
        throw new ConflictException('La plantilla ya está desactivada', {
          templateId,
        });
      }
      template.statusConceptId = SURVEYS.TEMPLATE_INACTIVE;
      touch(template, actor.id);

      this.logger.info(
        { operation: 'surveys.template.deactivate', templateId },
        'Survey template deactivated',
      );
      return { ok: true };
    });
  }

  /** Lista las plantillas del profesional dueño. */
  async listTemplates(actor: AuthenticatedUser): Promise<TemplateSummaryDto[]> {
    const tenantId = requireTenantId();
    const ownerPractitionerId = this.resolveOwner(undefined, actor);
    const templates = await this.templatesRepo.listTemplatesByOwner(
      this.em,
      tenantId,
      ownerPractitionerId,
    );

    const summaries: TemplateSummaryDto[] = [];
    for (const template of templates) {
      const version = await this.templatesRepo.findLatestVersion(
        this.em,
        template.id,
      );
      summaries.push({
        id: template.id,
        title: template.title,
        description: template.description,
        status: TEMPLATE_STATUS_CODE_BY_ID[template.statusConceptId] ?? 'DRAFT',
        latestVersionNumber: version?.versionNumber ?? 0,
        published:
          version?.publicationStatusConceptId === SURVEYS.VERSION_PUBLISHED,
        questionCount: version
          ? await this.templatesRepo.countQuestions(this.em, version.id)
          : 0,
      });
    }
    return summaries;
  }

  /** Devuelve la plantilla con el cuestionario de su última versión. */
  async getTemplate(
    templateId: string,
    actor: AuthenticatedUser,
  ): Promise<TemplateDetailDto> {
    const template = await this.loadOwnedTemplate(this.em, templateId, actor);
    const version = await this.templatesRepo.findLatestVersion(
      this.em,
      template.id,
    );
    if (!version) {
      throw new ResourceNotFoundException('La plantilla no tiene versiones', {
        templateId,
      });
    }
    const questions = await this.templatesRepo.listQuestions(
      this.em,
      version.id,
    );

    return {
      id: template.id,
      title: template.title,
      description: template.description,
      status: TEMPLATE_STATUS_CODE_BY_ID[template.statusConceptId] ?? 'DRAFT',
      latestVersionId: version.id,
      latestVersionNumber: version.versionNumber,
      published:
        version.publicationStatusConceptId === SURVEYS.VERSION_PUBLISHED,
      questionCount: questions.length,
      responseWindowDays: version.responseWindowDays,
      effectiveFrom: version.effectiveFrom,
      effectiveTo: version.effectiveTo,
      questions: questions.map((q) => this.toQuestionDto(q)),
    };
  }

  /**
   * Carga la plantilla comprobando que el actor sea su dueño.
   *
   * La autorización sale del **dueño del instrumento**, no del rol: dos
   * profesionales de la misma organización tienen los mismos roles, y las
   * respuestas de la encuesta de uno no son del otro.
   */
  private async loadOwnedTemplate(
    em: EntityManager,
    templateId: string,
    actor: AuthenticatedUser,
  ): Promise<SurveyTemplates> {
    const template = await this.templatesRepo.findTemplateById(em, templateId);
    if (!template) {
      throw new ResourceNotFoundException('Plantilla no encontrada', {
        templateId,
      });
    }
    const tenantId = requireTenantId();
    // Se responde 404 y no 403 a propósito: confirmar que el identificador
    // existe pero es de otro ya es filtrar información sobre otra organización.
    if (template.tenantId !== tenantId) {
      throw new ResourceNotFoundException('Plantilla no encontrada', {
        templateId,
      });
    }
    if (template.ownerPractitionerId !== this.resolveOwner(undefined, actor)) {
      throw new ResourceNotFoundException('Plantilla no encontrada', {
        templateId,
      });
    }
    return template;
  }

  /** Resuelve el profesional dueño, exigiendo que la sesión tenga perfil. */
  private resolveOwner(
    explicitOwner: string | undefined,
    actor: AuthenticatedUser,
  ): string {
    const owner = explicitOwner ?? actor.practitionerProfileId;
    if (!owner) {
      throw new PreconditionFailedException(
        'La sesión no tiene perfil profesional asociado',
        { userId: actor.id },
      );
    }
    return owner;
  }

  /**
   * Comprueba que el tipo de respuesta y sus parámetros sean coherentes.
   *
   * Se valida acá y no en el DTO porque la regla cruza campos: `options` es
   * obligatorio u prohibido **según** `answerType`, y class-validator no
   * expresa esa dependencia sin un validador a medida.
   */
  private validateQuestionShape(dto: AddQuestionDto): void {
    const needsOptions = ANSWER_TYPES_REQUIRING_OPTIONS.includes(
      dto.answerType,
    );
    if (needsOptions && (!dto.options || dto.options.length < 2)) {
      throw new PreconditionFailedException(
        'Las preguntas de elección requieren al menos dos opciones',
        { answerType: dto.answerType },
      );
    }
    if (!needsOptions && dto.options && dto.options.length > 0) {
      throw new PreconditionFailedException(
        'Este tipo de pregunta no admite opciones',
        { answerType: dto.answerType },
      );
    }
    if (needsOptions && dto.options) {
      const unique = new Set(dto.options);
      if (unique.size !== dto.options.length) {
        throw new PreconditionFailedException(
          'Las opciones no pueden repetirse',
          { answerType: dto.answerType },
        );
      }
    }
    if (dto.answerType === 'SCALE') {
      const min = dto.scaleMin ?? 1;
      const max = dto.scaleMax ?? 5;
      if (max <= min) {
        throw new PreconditionFailedException(
          'El máximo de la escala debe ser mayor que el mínimo',
          { scaleMin: min, scaleMax: max },
        );
      }
    }
  }

  /** Proyecta la entidad de pregunta al contrato HTTP. */
  private toQuestionDto(question: SurveyQuestions): QuestionDto {
    return {
      id: question.id,
      position: question.position,
      questionText: question.questionText,
      answerType: ANSWER_TYPE_CODE_BY_ID[question.answerTypeConceptId],
      required: question.required,
      options: question.options,
      scaleMin: question.scaleMin,
      scaleMax: question.scaleMax,
    };
  }
}
