import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  MarketingCampaignsRepository,
  MarketingJourneysRepository,
} from '../repositories';
import {
  CHANNEL_CONCEPT,
  MEMBER_TYPE_CONCEPT,
} from './marketing-campaigns.service';
import {
  CreateJourneyDto,
  JourneyResponseDto,
  AddJourneyStepsDto,
  JourneyStepsResponseDto,
  ActivateJourneyDto,
  ActivateJourneyResponseDto,
  AdvanceEnrollmentDto,
  AdvanceEnrollmentResponseDto,
  ExitEnrollmentDto,
  ExitEnrollmentResponseDto,
  CreateTrackedLinkDto,
  TrackedLinkResponseDto,
  TrackedLinkClickResponseDto,
  RecordTouchpointDto,
  TouchpointResponseDto,
  ComputeAttributionDto,
  ComputeAttributionResponseDto,
  AttributionTouchDto,
  type JourneyTrigger,
  type JourneyStepType,
  type ExitReason,
  type TouchType,
  type AttributionModel,
} from '../dto';

const TRIGGER_CONCEPT: Readonly<Record<JourneyTrigger, string>> = {
  SEGMENT: CONCEPTS.JOURNEY_TRIGGER_SEGMENT,
  EVENT: CONCEPTS.JOURNEY_TRIGGER_EVENT,
};

const STEP_TYPE_CONCEPT: Readonly<Record<JourneyStepType, string>> = {
  SEND: CONCEPTS.STEP_SEND,
  WAIT: CONCEPTS.STEP_WAIT,
  BRANCH: CONCEPTS.STEP_BRANCH,
  GOAL: CONCEPTS.STEP_GOAL,
  UPDATE: CONCEPTS.STEP_UPDATE,
  EXIT: CONCEPTS.STEP_EXIT,
  WEBHOOK: CONCEPTS.STEP_WEBHOOK,
};

const EXIT_REASON_CONCEPT: Readonly<Record<ExitReason, string>> = {
  GOAL: CONCEPTS.EXIT_REASON_GOAL,
  UNSUBSCRIBE: CONCEPTS.EXIT_REASON_UNSUBSCRIBE,
  BOUNCE: CONCEPTS.EXIT_REASON_BOUNCE,
};

const TOUCH_TYPE_CONCEPT: Readonly<Record<TouchType, string>> = {
  IMPRESSION: CONCEPTS.TOUCH_IMPRESSION,
  OPEN: CONCEPTS.TOUCH_OPEN,
  CLICK: CONCEPTS.TOUCH_CLICK,
  VISIT: CONCEPTS.TOUCH_VISIT,
  CONVERSION: CONCEPTS.TOUCH_CONVERSION,
  REPLY: CONCEPTS.TOUCH_REPLY,
};

const ATTRIBUTION_MODEL_CONCEPT: Readonly<Record<AttributionModel, string>> = {
  LAST_TOUCH: CONCEPTS.ATTR_MODEL_LAST_TOUCH,
  FIRST_TOUCH: CONCEPTS.ATTR_MODEL_FIRST_TOUCH,
  LINEAR: CONCEPTS.ATTR_MODEL_LINEAR,
};

/**
 * Cómo se refleja en el miembro de campaña lo que le acaba de pasar. Un tipo de
 * contacto que no cambia su estado (impression, visit) no aparece aquí.
 */
const TOUCH_TO_MEMBER_STATUS: Readonly<Partial<Record<TouchType, string>>> = {
  OPEN: CONCEPTS.CAMPAIGN_MEMBER_OPENED,
  CLICK: CONCEPTS.CAMPAIGN_MEMBER_CLICKED,
  CONVERSION: CONCEPTS.CAMPAIGN_MEMBER_CONVERTED,
};

/** Estado al que pasa el miembro de campaña según por qué salió del journey. */
const EXIT_TO_MEMBER_STATUS: Readonly<Record<ExitReason, string>> = {
  GOAL: CONCEPTS.CAMPAIGN_MEMBER_CONVERTED,
  UNSUBSCRIBE: CONCEPTS.CAMPAIGN_MEMBER_UNSUBSCRIBED,
  BOUNCE: CONCEPTS.CAMPAIGN_MEMBER_BOUNCED,
};

/** Decimales del peso de atribución; la suma del reparto debe dar exactamente 1. */
const WEIGHT_SCALE = 6;

/**
 * Journeys, inscripciones, enlaces rastreables, touchpoints y atribución
 * (UC-50-06 … UC-50-12).
 */
@Injectable()
export class MarketingJourneysService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param journeysRepo - Valor de journeys repo requerido por la operación.
   * @param campaignsRepo - Valor de campaigns repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly journeysRepo: MarketingJourneysRepository,
    private readonly campaignsRepo: MarketingCampaignsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(MarketingJourneysService.name);
  }

  /** UC-50-06: crear el journey en borrador. */
  async createJourney(
    dto: CreateJourneyDto,
    actor: AuthenticatedUser,
  ): Promise<JourneyResponseDto> {
    this.logger.info(
      {
        operation: 'marketing.journey.create',
        tenantId: dto.tenantId,
        code: dto.code,
      },
      'Creating journey',
    );

    const duplicate = await this.journeysRepo.findJourneyByCode(
      this.em,
      dto.tenantId,
      dto.code,
    );
    if (duplicate) {
      throw new ConflictException('Ya existe un journey con ese código', {
        tenantId: dto.tenantId,
        code: dto.code,
      });
    }
    if (dto.entryTrigger === 'SEGMENT' && !dto.entrySegmentId) {
      throw new PreconditionFailedException(
        'Un journey con entrada por segmento necesita entrySegmentId',
        { code: dto.code },
      );
    }

    return this.em.transactional(async (tx) => {
      if (dto.entrySegmentId) {
        const segment = await this.campaignsRepo.findSegmentById(
          tx,
          dto.entrySegmentId,
        );
        if (!segment) {
          throw new ResourceNotFoundException(
            'Segmento de entrada no encontrado',
            {
              segmentId: dto.entrySegmentId,
            },
          );
        }
      }

      const journey = this.journeysRepo.createJourney(tx, {
        tenantId: dto.tenantId,
        code: dto.code,
        name: dto.name,
        entryTriggerConceptId: TRIGGER_CONCEPT[dto.entryTrigger],
        entrySegmentId: dto.entrySegmentId,
        goalMetricConceptId: dto.goalMetricConceptId,
        definitionJson: dto.definitionJson,
        stateConceptId: CONCEPTS.JOURNEY_DRAFT,
        actorUserId: actor.id,
      });

      return {
        id: journey.id,
        code: dto.code,
        stateConceptId: CONCEPTS.JOURNEY_DRAFT,
      };
    });
  }

  /**
   * UC-50-06: añadir pasos. Se encadenan en el orden recibido (`next_step_id`)
   * y se enganchan al último paso ya existente, de modo que el grafo queda
   * recorrible sin que el cliente tenga que resolver identificadores.
   */
  async addSteps(
    journeyId: string,
    dto: AddJourneyStepsDto,
    actor: AuthenticatedUser,
  ): Promise<JourneyStepsResponseDto> {
    this.logger.info(
      {
        operation: 'marketing.journey.add-steps',
        journeyId,
        steps: dto.steps.length,
      },
      'Adding journey steps',
    );

    return this.em.transactional(async (tx) => {
      const journey = await this.journeysRepo.findJourneyForUpdate(
        tx,
        journeyId,
      );
      if (!journey) {
        throw new ResourceNotFoundException('Journey no encontrado', {
          journeyId,
        });
      }
      // Cambiar el grafo de un journey activo desincronizaría a las inscripciones
      // que ya lo están recorriendo.
      if (journey.stateConceptId !== CONCEPTS.JOURNEY_DRAFT) {
        throw new PreconditionFailedException(
          'Sólo un journey en borrador admite nuevos pasos',
          {
            journeyId,
            stateConceptId: journey.stateConceptId,
          },
        );
      }

      for (const step of dto.steps) {
        if (step.stepType === 'SEND') {
          if (!step.contentTemplateId) {
            throw new PreconditionFailedException(
              'Un paso SEND necesita plantilla de contenido',
              {
                stepCode: step.stepCode,
              },
            );
          }
          const template = await this.campaignsRepo.findPublishedTemplate(
            tx,
            step.contentTemplateId,
            CONCEPTS.CONTENT_TEMPLATE_PUBLISHED,
          );
          if (!template) {
            throw new PreconditionFailedException(
              'La plantilla del paso SEND no existe o no está publicada',
              {
                stepCode: step.stepCode,
                contentTemplateId: step.contentTemplateId,
              },
            );
          }
        }
        if (step.stepType === 'WAIT' && !step.waitDurationMinutes) {
          throw new PreconditionFailedException(
            'Un paso WAIT necesita duración',
            {
              stepCode: step.stepCode,
            },
          );
        }
        if (step.stepType === 'BRANCH' && !step.conditionJson) {
          throw new PreconditionFailedException(
            'Un paso BRANCH necesita condición',
            {
              stepCode: step.stepCode,
            },
          );
        }
      }

      const last = await this.journeysRepo.findLastStep(tx, journeyId);
      let previous = last;
      let ordinal = (last?.ordinal ?? 0) + 1;
      const stepIds: string[] = [];

      for (const step of dto.steps) {
        const created = this.journeysRepo.createJourneyStep(tx, {
          journeyId,
          stepCode: step.stepCode,
          stepTypeConceptId: STEP_TYPE_CONCEPT[step.stepType],
          channelConceptId: step.channel
            ? CHANNEL_CONCEPT[step.channel]
            : undefined,
          contentTemplateId: step.contentTemplateId,
          waitDurationMinutes: step.waitDurationMinutes,
          conditionJson: step.conditionJson,
          ordinal,
          actorUserId: actor.id,
        });
        if (previous) {
          previous.nextStepId = created.id;
          touch(previous, actor.id);
        }
        previous = created;
        stepIds.push(created.id);
        ordinal += 1;
      }

      return { journeyId, stepIds };
    });
  }

  /** UC-50-07: activar el journey e inscribir la cohorte en su primer paso. */
  async activateJourney(
    journeyId: string,
    dto: ActivateJourneyDto,
    actor: AuthenticatedUser,
  ): Promise<ActivateJourneyResponseDto> {
    this.logger.info(
      {
        operation: 'marketing.journey.activate',
        journeyId,
        cohort: dto.cohort?.length ?? 0,
      },
      'Activating journey',
    );

    return this.em.transactional(async (tx) => {
      const journey = await this.journeysRepo.findJourneyForUpdate(
        tx,
        journeyId,
      );
      if (!journey) {
        throw new ResourceNotFoundException('Journey no encontrado', {
          journeyId,
        });
      }
      if (journey.stateConceptId !== CONCEPTS.JOURNEY_DRAFT) {
        throw new ConflictException('El journey ya no está en borrador', {
          journeyId,
          stateConceptId: journey.stateConceptId,
        });
      }

      const steps = await this.journeysRepo.findStepsByJourney(tx, journeyId);
      if (steps.length === 0) {
        throw new PreconditionFailedException(
          'Un journey sin pasos no puede activarse',
          {
            journeyId,
          },
        );
      }
      const firstStep = steps[0];

      let enrolled = 0;
      let skipped = 0;
      for (const member of dto.cohort ?? []) {
        const typeConceptId = MEMBER_TYPE_CONCEPT[member.memberType];
        // La UNIQUE parcial `WHERE status = active` prohíbe la doble inscripción:
        // se comprueba antes para devolver un conteo en vez de un error de base.
        const active = await this.journeysRepo.findActiveEnrollment(
          tx,
          journeyId,
          typeConceptId,
          member.memberRefId,
          CONCEPTS.ENROLLMENT_ACTIVE,
        );
        if (active) {
          skipped += 1;
          continue;
        }
        this.journeysRepo.createEnrollment(tx, {
          journeyId,
          memberTypeConceptId: typeConceptId,
          memberRefId: member.memberRefId,
          currentStepId: firstStep.id,
          statusConceptId: CONCEPTS.ENROLLMENT_ACTIVE,
          actorUserId: actor.id,
        });
        enrolled += 1;
      }

      journey.stateConceptId = CONCEPTS.JOURNEY_ACTIVE;
      touch(journey, actor.id);

      return {
        journeyId,
        stateConceptId: CONCEPTS.JOURNEY_ACTIVE,
        enrolled,
        skipped,
      };
    });
  }

  /**
   * UC-50-08: ejecutar el paso actual y avanzar. Un paso SEND deja touchpoint
   * (`impression`); un paso WAIT sólo avanza si su espera ya venció; un paso
   * BRANCH toma `branch_step_id` o `next_step_id` según el resultado de la
   * condición, que resuelve el orquestador. Sin siguiente paso, la inscripción
   * se completa.
   */
  async advanceEnrollment(
    enrollmentId: string,
    dto: AdvanceEnrollmentDto,
    actor: AuthenticatedUser,
  ): Promise<AdvanceEnrollmentResponseDto> {
    this.logger.info(
      { operation: 'marketing.enrollment.advance', enrollmentId },
      'Advancing journey enrollment',
    );

    return this.em.transactional(async (tx) => {
      const enrollment =
        await this.journeysRepo.findEnrollmentForUpdateSkipLocked(
          tx,
          enrollmentId,
        );
      if (!enrollment) {
        throw new ResourceNotFoundException(
          'Inscripción no encontrada o en curso',
          {
            enrollmentId,
          },
        );
      }
      if (enrollment.statusConceptId !== CONCEPTS.ENROLLMENT_ACTIVE) {
        throw new ConflictException('La inscripción ya no está activa', {
          enrollmentId,
          statusConceptId: enrollment.statusConceptId,
        });
      }
      if (!enrollment.currentStepId) {
        throw new PreconditionFailedException(
          'La inscripción no tiene paso actual',
          {
            enrollmentId,
          },
        );
      }

      const step = await this.journeysRepo.findStepById(
        tx,
        enrollment.currentStepId,
      );
      if (!step) {
        throw new ResourceNotFoundException('Paso actual no encontrado', {
          stepId: enrollment.currentStepId,
        });
      }

      // La espera se cuenta desde la última vez que la inscripción se movió.
      if (
        step.stepTypeConceptId === CONCEPTS.STEP_WAIT &&
        step.waitDurationMinutes
      ) {
        const since =
          enrollment.updatedAt ?? enrollment.enteredAt ?? new Date();
        const dueAt = new Date(
          since.getTime() + step.waitDurationMinutes * 60_000,
        );
        if (dueAt > new Date()) {
          throw new PreconditionFailedException(
            'La espera del paso aún no ha vencido',
            {
              enrollmentId,
              dueAt: dueAt.toISOString(),
            },
          );
        }
      }

      let touchpointId: string | undefined;
      if (step.stepTypeConceptId === CONCEPTS.STEP_SEND) {
        const touchpoint = this.journeysRepo.createTouchpoint(tx, {
          journeyId: enrollment.journeyId,
          memberTypeConceptId: enrollment.memberTypeConceptId,
          memberRefId: enrollment.memberRefId,
          touchTypeConceptId: CONCEPTS.TOUCH_IMPRESSION,
          channelConceptId: step.channelConceptId ?? CONCEPTS.CH_EMAIL,
          contentTemplateId: step.contentTemplateId,
          recordedByUserId: actor.id,
        });
        touchpointId = touchpoint.id;
      }

      const branchTaken =
        step.stepTypeConceptId === CONCEPTS.STEP_BRANCH &&
        dto.branchTaken === true;
      const nextStepId = branchTaken
        ? (step.branchStepId ?? step.nextStepId)
        : step.nextStepId;

      if (nextStepId) {
        enrollment.currentStepId = nextStepId;
      } else {
        // Fin del grafo: la inscripción se completa y libera la UNIQUE parcial.
        enrollment.currentStepId = undefined;
        enrollment.statusConceptId = CONCEPTS.ENROLLMENT_COMPLETED;
        enrollment.exitedAt = new Date();
        enrollment.exitReasonConceptId = CONCEPTS.EXIT_REASON_GOAL;
      }
      touch(enrollment, actor.id);

      return {
        enrollmentId,
        currentStepId: enrollment.currentStepId,
        statusConceptId: enrollment.statusConceptId,
        touchpointId,
      };
    });
  }

  /** UC-50-09: cerrar la inscripción por meta alcanzada, baja o rebote. */
  async exitEnrollment(
    enrollmentId: string,
    dto: ExitEnrollmentDto,
    actor: AuthenticatedUser,
  ): Promise<ExitEnrollmentResponseDto> {
    this.logger.info(
      {
        operation: 'marketing.enrollment.exit',
        enrollmentId,
        reason: dto.reason,
      },
      'Exiting journey enrollment',
    );

    return this.em.transactional(async (tx) => {
      const enrollment = await this.journeysRepo.findEnrollmentForUpdate(
        tx,
        enrollmentId,
      );
      if (!enrollment) {
        throw new ResourceNotFoundException('Inscripción no encontrada', {
          enrollmentId,
        });
      }
      if (enrollment.statusConceptId !== CONCEPTS.ENROLLMENT_ACTIVE) {
        throw new ConflictException('La inscripción ya no está activa', {
          enrollmentId,
          statusConceptId: enrollment.statusConceptId,
        });
      }

      // Alcanzar la meta se registra como completada; salir por baja o rebote,
      // como salida: la diferencia es lo que mide el embudo.
      const statusConceptId =
        dto.reason === 'GOAL'
          ? CONCEPTS.ENROLLMENT_COMPLETED
          : CONCEPTS.ENROLLMENT_EXITED;
      const exitReasonConceptId = EXIT_REASON_CONCEPT[dto.reason];

      enrollment.statusConceptId = statusConceptId;
      enrollment.exitReasonConceptId = exitReasonConceptId;
      enrollment.exitedAt = new Date();
      enrollment.currentStepId = undefined;
      touch(enrollment, actor.id);

      if (dto.campaignId) {
        const member =
          await this.campaignsRepo.findCampaignMemberByRefForUpdate(
            tx,
            dto.campaignId,
            enrollment.memberTypeConceptId,
            enrollment.memberRefId,
          );
        if (member) {
          member.memberStatusConceptId = EXIT_TO_MEMBER_STATUS[dto.reason];
          member.respondedAt = new Date();
          touch(member, actor.id);
        }
      }

      return { enrollmentId, statusConceptId, exitReasonConceptId };
    });
  }

  /** UC-50-10: crear el enlace rastreable con sus parámetros UTM. */
  async createTrackedLink(
    dto: CreateTrackedLinkDto,
    actor: AuthenticatedUser,
  ): Promise<TrackedLinkResponseDto> {
    this.logger.info(
      { operation: 'marketing.tracked-link.create', code: dto.code },
      'Creating tracked link',
    );

    const duplicate = await this.journeysRepo.findTrackedLinkByCode(
      this.em,
      dto.code,
    );
    if (duplicate) {
      throw new ConflictException('Ya existe un enlace con ese código', {
        code: dto.code,
      });
    }

    return this.em.transactional(async (tx) => {
      const link = this.journeysRepo.createTrackedLink(tx, {
        campaignId: dto.campaignId,
        code: dto.code,
        targetUrl: dto.targetUrl,
        utmSource: dto.utmSource,
        utmMedium: dto.utmMedium,
        utmCampaign: dto.utmCampaign,
        utmContent: dto.utmContent,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });

      return { id: link.id, code: dto.code, targetUrl: dto.targetUrl };
    });
  }

  /**
   * UC-50-10: resolver el enlace y contar el click. El contador se incrementa
   * bajo bloqueo para no perder clicks simultáneos; el touchpoint sólo se
   * registra si la petición identifica al miembro.
   */
  async registerClick(
    code: string,
    memberType: string | undefined,
    memberRefId: string | undefined,
  ): Promise<TrackedLinkClickResponseDto> {
    this.logger.info(
      { operation: 'marketing.tracked-link.click', code },
      'Registering link click',
    );

    return this.em.transactional(async (tx) => {
      const link = await this.journeysRepo.findTrackedLinkByCodeForUpdate(
        tx,
        code,
      );
      if (!link) {
        throw new ResourceNotFoundException('Enlace no encontrado', { code });
      }
      if (link.stateConceptId !== CONCEPTS.STATE_ACTIVE) {
        throw new PreconditionFailedException('El enlace no está activo', {
          code,
        });
      }

      const clickCount = String(BigInt(link.clickCount ?? '0') + 1n);
      link.clickCount = clickCount;
      touch(link, undefined);

      let touchpointId: string | undefined;
      if (memberRefId) {
        const touchpoint = this.journeysRepo.createTouchpoint(tx, {
          campaignId: link.campaignId,
          trackedLinkId: link.id,
          memberTypeConceptId:
            memberType === 'PATIENT'
              ? CONCEPTS.MEMBER_PATIENT
              : CONCEPTS.MEMBER_CONTACT,
          memberRefId,
          touchTypeConceptId: CONCEPTS.TOUCH_CLICK,
          channelConceptId: CONCEPTS.CH_EMAIL,
        });
        touchpointId = touchpoint.id;
      }

      return { targetUrl: link.targetUrl, clickCount, touchpointId };
    });
  }

  /**
   * UC-50-11: registrar el contacto. La tabla es un log inmutable; lo único que
   * cambia es el estado del miembro de campaña, cuando el contacto lo implica.
   */
  async recordTouchpoint(
    dto: RecordTouchpointDto,
    actor: AuthenticatedUser,
  ): Promise<TouchpointResponseDto> {
    this.logger.info(
      { operation: 'marketing.touchpoint.record', touchType: dto.touchType },
      'Recording marketing touchpoint',
    );

    if (!dto.campaignId && !dto.journeyId) {
      throw new PreconditionFailedException(
        'El touchpoint necesita campaña o journey de origen',
        { memberRefId: dto.memberRefId },
      );
    }

    return this.em.transactional(async (tx) => {
      const memberTypeConceptId = MEMBER_TYPE_CONCEPT[dto.memberType];
      const touchpoint = this.journeysRepo.createTouchpoint(tx, {
        campaignId: dto.campaignId,
        journeyId: dto.journeyId,
        trackedLinkId: dto.trackedLinkId,
        memberTypeConceptId,
        memberRefId: dto.memberRefId,
        touchTypeConceptId: TOUCH_TYPE_CONCEPT[dto.touchType],
        channelConceptId: CHANNEL_CONCEPT[dto.channel],
        contentTemplateId: dto.contentTemplateId,
        metadataJson: dto.metadataJson,
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : undefined,
        recordedByUserId: actor.id,
      });

      let memberStatusConceptId: string | undefined;
      const newStatus = TOUCH_TO_MEMBER_STATUS[dto.touchType];
      if (dto.campaignId && newStatus) {
        const member =
          await this.campaignsRepo.findCampaignMemberByRefForUpdate(
            tx,
            dto.campaignId,
            memberTypeConceptId,
            dto.memberRefId,
          );
        if (member) {
          member.memberStatusConceptId = newStatus;
          member.respondedAt = new Date();
          touch(member, actor.id);
          memberStatusConceptId = newStatus;
        }
      }

      return {
        id: touchpoint.id,
        touchTypeConceptId: TOUCH_TYPE_CONCEPT[dto.touchType],
        memberStatusConceptId,
      };
    });
  }

  /**
   * UC-50-12: repartir el crédito de la conversión entre los touchpoints del
   * miembro dentro de la ventana. Recalcular reemplaza el reparto anterior del
   * mismo modelo en bloque: dos repartos superpuestos romperían SUM(weight)=1.
   */
  async computeAttribution(
    dto: ComputeAttributionDto,
    actor: AuthenticatedUser,
  ): Promise<ComputeAttributionResponseDto> {
    this.logger.info(
      {
        operation: 'marketing.attribution.compute',
        conversionRefType: dto.conversionRefType,
        conversionRefId: dto.conversionRefId,
        model: dto.model,
      },
      'Computing multi-touch attribution',
    );

    const windowFrom = new Date(dto.windowFrom);
    const windowTo = new Date(dto.windowTo);
    if (windowTo <= windowFrom) {
      throw new PreconditionFailedException(
        'La ventana de atribución es inválida',
        {
          windowFrom: dto.windowFrom,
          windowTo: dto.windowTo,
        },
      );
    }

    const modelConceptId = ATTRIBUTION_MODEL_CONCEPT[dto.model];

    return this.em.transactional(async (tx) => {
      const touchpoints = await this.journeysRepo.findTouchpointsInWindow(
        tx,
        MEMBER_TYPE_CONCEPT[dto.memberType],
        dto.memberRefId,
        windowFrom,
        windowTo,
      );
      if (touchpoints.length === 0) {
        throw new PreconditionFailedException(
          'No hay touchpoints del miembro en la ventana de atribución',
          { memberRefId: dto.memberRefId },
        );
      }

      const previous = await this.journeysRepo.findAttributionTouches(
        tx,
        dto.conversionRefType,
        dto.conversionRefId,
        modelConceptId,
      );
      if (previous.length > 0) {
        this.journeysRepo.removeAttributionTouches(tx, previous);
      }

      const weights = this.distributeWeights(dto.model, touchpoints.length);
      const touches: AttributionTouchDto[] = [];

      for (const [index, touchpoint] of touchpoints.entries()) {
        const weight = weights[index];
        if (weight === '0') continue;

        const positionConceptId = this.positionOf(index, touchpoints.length);
        const attributedValue = dto.conversionValue
          ? this.multiply(dto.conversionValue, weight)
          : undefined;

        this.journeysRepo.createAttributionTouch(tx, {
          conversionRefType: dto.conversionRefType,
          conversionRefId: dto.conversionRefId,
          marketingTouchpointId: touchpoint.id,
          attributionModelConceptId: modelConceptId,
          weight,
          attributedValue,
          currencyConceptId: dto.currencyConceptId,
          positionConceptId,
          actorUserId: actor.id,
        });

        touches.push({
          touchpointId: touchpoint.id,
          weight,
          attributedValue,
          positionConceptId,
        });
      }

      return {
        conversionRefType: dto.conversionRefType,
        conversionRefId: dto.conversionRefId,
        attributionModelConceptId: modelConceptId,
        replaced: previous.length,
        touches,
      };
    });
  }

  /**
   * Reparto por modelo. En el lineal, el resto de la división cae en el último
   * touchpoint para que la suma dé exactamente 1 y no 0.999999.
   */
  private distributeWeights(model: AttributionModel, count: number): string[] {
    if (model === 'FIRST_TOUCH') {
      return Array.from({ length: count }, (_, i) => (i === 0 ? '1' : '0'));
    }
    if (model === 'LAST_TOUCH') {
      return Array.from({ length: count }, (_, i) =>
        i === count - 1 ? '1' : '0',
      );
    }

    const unit = Math.floor(10 ** WEIGHT_SCALE / count);
    const weights = Array.from({ length: count }, () => unit);
    weights[count - 1] += 10 ** WEIGHT_SCALE - unit * count;
    return weights.map((w) => (w / 10 ** WEIGHT_SCALE).toFixed(WEIGHT_SCALE));
  }

  /**
   * Ejecuta la operación position of.
   *
   * @param index - Valor de index requerido por la operación.
   * @param count - Valor de count requerido por la operación.
   * @returns Resultado de position of conforme al contrato `string`.
   */
  private positionOf(index: number, count: number): string {
    if (index === 0) return CONCEPTS.ATTR_POSITION_FIRST;
    if (index === count - 1) return CONCEPTS.ATTR_POSITION_LAST;
    return CONCEPTS.ATTR_POSITION_MIDDLE;
  }

  /** Producto en cadena decimal con 2 decimales: es dinero, no un flotante. */
  private multiply(amount: string, weight: string): string {
    return (Number(amount) * Number(weight)).toFixed(2);
  }
}
