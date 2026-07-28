import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  CdsRulesRepository,
  ClinicalAlertsRepository,
  DrugInteractionsRepository,
} from '../repositories';
import {
  CreateCdsRuleDto,
  PublishRuleVersionDto,
  EvaluateCdsDto,
  CheckInteractionsDto,
  CreateDrugInteractionDto,
  CdsRuleResponseDto,
  AlertBatchResponseDto,
} from '../dto';
import { CEXT } from '../clinical_ext.concepts';

/** Contexto contra el que se evalúa una regla CDS (armado desde el DTO). */
interface CdsEvalContext {
  /** Concept ids de los medicamentos activos del paciente. */
  medications: string[];
  /** Observaciones indexadas por concept id → valor numérico. */
  observations: Record<string, number | undefined>;
}

/**
 * Se lanza cuando la lógica de una regla no encaja en la gramática soportada.
 * El evaluador la captura para **fallar cerrado**: la regla no dispara y se
 * loguea. Es un detalle interno; nunca sale del servicio.
 */
class UnparseableCdsRuleError extends Error {}

/**
 * Motor de decisión clínica (CDS): gobernanza de reglas (crear/publicar/rollback,
 * UC-18-13), evaluación de reglas activas para generar alertas (UC-18-03) y chequeo
 * de interacciones medicamentosas al prescribir (UC-18-04).
 *
 * Todas las alertas de una misma evaluación se insertan en la MISMA transacción,
 * de modo que el paciente ve el conjunto completo de alertas de forma atómica.
 */
@Injectable()
export class CdsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param rulesRepo - Valor de rules repo requerido por la operación.
   * @param alertsRepo - Valor de alerts repo requerido por la operación.
   * @param interactionsRepo - Valor de interactions repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly rulesRepo: CdsRulesRepository,
    private readonly alertsRepo: ClinicalAlertsRepository,
    private readonly interactionsRepo: DrugInteractionsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CdsService.name);
  }

  /** Crea una regla CDS en borrador (precondición de la publicación, UC-18-13). */
  async createRule(
    dto: CreateCdsRuleDto,
    actor: AuthenticatedUser,
  ): Promise<CdsRuleResponseDto> {
    this.logger.info(
      { operation: 'clinical_ext.cds_rule.create', code: dto.code },
      'Creating CDS rule',
    );
    return this.em.transactional(async (tx) => {
      const clash = await this.rulesRepo.findByCode(tx, dto.code);
      if (clash)
        throw new ConflictException('El código de regla ya existe', {
          code: dto.code,
        });

      const rule = this.rulesRepo.create(tx, {
        tenantId: dto.tenantId,
        code: dto.code,
        name: dto.name,
        ruleTypeConceptId: dto.ruleTypeConceptId ?? CEXT.CDS_RULE_TYPE_ALERT,
        severityConceptId: dto.severityConceptId ?? CEXT.SEVERITY_MODERATE,
        logicJson: dto.logicJson,
        messageTemplate: dto.messageTemplate,
        isActive: false,
        version: 1,
        statusConceptId: CEXT.CDS_RULE_DRAFT,
        actorUserId: actor.id,
      });
      await tx.flush();
      return this.toRuleResponse(rule);
    });
  }

  /** UC-18-13: publica una nueva versión de la regla (draft/retired -> active). */
  async publishVersion(
    ruleId: string,
    dto: PublishRuleVersionDto,
    actor: AuthenticatedUser,
  ): Promise<CdsRuleResponseDto> {
    this.logger.info(
      { operation: 'clinical_ext.cds_rule.publish', ruleId },
      'Publishing CDS rule version',
    );
    return this.em.transactional(async (tx) => {
      const rule = await this.rulesRepo.findById(tx, ruleId);
      if (!rule)
        throw new ResourceNotFoundException('Regla CDS no encontrada', {
          ruleId,
        });

      rule.version = (rule.version ?? 1) + 1;
      if (dto.logicJson !== undefined) rule.logicJson = dto.logicJson;
      if (dto.messageTemplate !== undefined)
        rule.messageTemplate = dto.messageTemplate;
      if (dto.severityConceptId !== undefined)
        rule.severityConceptId = dto.severityConceptId;
      rule.isActive = true;
      rule.statusConceptId = CEXT.CDS_RULE_ACTIVE;
      touch(rule, actor.id);

      return this.toRuleResponse(rule);
    });
  }

  /** UC-18-13: rollback — retira la versión activa. */
  async rollbackVersion(
    ruleId: string,
    actor: AuthenticatedUser,
  ): Promise<CdsRuleResponseDto> {
    this.logger.info(
      { operation: 'clinical_ext.cds_rule.rollback', ruleId },
      'Rolling back CDS rule',
    );
    return this.em.transactional(async (tx) => {
      const rule = await this.rulesRepo.findById(tx, ruleId);
      if (!rule)
        throw new ResourceNotFoundException('Regla CDS no encontrada', {
          ruleId,
        });
      if (rule.statusConceptId !== CEXT.CDS_RULE_ACTIVE) {
        throw new PreconditionFailedException(
          'Solo se puede hacer rollback de una regla activa',
          {
            ruleId,
          },
        );
      }

      rule.isActive = false;
      rule.statusConceptId = CEXT.CDS_RULE_RETIRED;
      touch(rule, actor.id);

      return this.toRuleResponse(rule);
    });
  }

  /**
   * UC-18-03: evalúa las reglas activas contra el contexto del paciente
   * (medicamentos + observaciones del DTO) y genera una alerta **solo** por cada
   * regla que realmente matchea, con su severidad declarada.
   *
   * La lógica de la regla vive en `logic_json` y se interpreta con una gramática
   * mínima ({@link evaluateLogic}). El evaluador **falla cerrado**: una regla cuya
   * lógica no se entiende NO dispara y se loguea `warn`. Una regla de decisión
   * clínica que se disparara "por si acaso" cuando no se sabe leerla generaría
   * alertas falsas y erosionaría la confianza en el sistema.
   */
  async evaluate(
    dto: EvaluateCdsDto,
    actor: AuthenticatedUser,
  ): Promise<AlertBatchResponseDto> {
    this.logger.info(
      {
        operation: 'clinical_ext.cds.evaluate',
        patientProfileId: dto.patientProfileId,
      },
      'Evaluating CDS rules',
    );
    return this.em.transactional(async (tx) => {
      const rules = await this.rulesRepo.findActive(
        tx,
        CEXT.CDS_RULE_ACTIVE,
        dto.tenantId,
      );
      const context = this.buildContext(dto);
      const matched = rules.filter((rule) => this.ruleMatches(rule, context));

      const now = new Date();
      const alerts = matched.map((rule) =>
        this.alertsRepo.create(tx, {
          patientProfileId: dto.patientProfileId,
          encounterId: dto.encounterId,
          alertTypeConceptId: CEXT.ALERT_TYPE_CDS,
          severityConceptId: rule.severityConceptId,
          sourceResourceType: dto.sourceResourceType,
          sourceResourceId: dto.sourceResourceId,
          triggerConceptId: CEXT.TRIGGER_CLINICAL_EVENT,
          ruleId: rule.id,
          detailText: rule.messageTemplate ?? rule.name,
          statusConceptId: CEXT.ALERT_ACTIVE,
          detectedAt: now,
          actorUserId: actor.id,
        }),
      );
      await tx.flush();

      this.logger.info(
        {
          operation: 'clinical_ext.cds.evaluate',
          evaluated: rules.length,
          generated: alerts.length,
        },
        'CDS evaluation completed',
      );
      return {
        alerts: alerts.map((a) => ({
          id: a.id,
          alertTypeConceptId: a.alertTypeConceptId,
          severityConceptId: a.severityConceptId,
          ruleId: a.ruleId,
        })),
        count: alerts.length,
      };
    });
  }

  /** UC-18-04: detecta interacciones entre las sustancias y levanta alertas. */
  async checkInteractions(
    dto: CheckInteractionsDto,
    actor: AuthenticatedUser,
  ): Promise<AlertBatchResponseDto> {
    this.logger.info(
      {
        operation: 'clinical_ext.cds.check_interactions',
        pairs: dto.substanceConceptIds.length,
      },
      'Checking drug interactions',
    );
    return this.em.transactional(async (tx) => {
      const substances = dto.substanceConceptIds;
      const now = new Date();
      const alerts = [];

      for (let i = 0; i < substances.length; i++) {
        for (let j = i + 1; j < substances.length; j++) {
          const interaction = await this.interactionsRepo.findByPair(
            tx,
            substances[i],
            substances[j],
          );
          if (!interaction) continue;
          const alert = this.alertsRepo.create(tx, {
            patientProfileId: dto.patientProfileId,
            encounterId: dto.encounterId,
            alertTypeConceptId: CEXT.ALERT_TYPE_DRUG_INTERACTION,
            severityConceptId: interaction.severityConceptId,
            sourceResourceType: 'medication_request',
            sourceResourceId: dto.medicationRequestId,
            triggerConceptId: CEXT.TRIGGER_CLINICAL_EVENT,
            detailText: [interaction.mechanismText, interaction.managementText]
              .filter(Boolean)
              .join(' — '),
            statusConceptId: CEXT.ALERT_ACTIVE,
            detectedAt: now,
            actorUserId: actor.id,
          });
          alerts.push(alert);
        }
      }
      await tx.flush();

      return {
        alerts: alerts.map((a) => ({
          id: a.id,
          alertTypeConceptId: a.alertTypeConceptId,
          severityConceptId: a.severityConceptId,
          ruleId: a.ruleId,
        })),
        count: alerts.length,
      };
    });
  }

  /** Registra un par de interacción medicamentosa (dato de referencia para UC-18-04). */
  async createDrugInteraction(
    dto: CreateDrugInteractionDto,
    actor: AuthenticatedUser,
  ): Promise<{
    /**
     * Identificador único de la instancia.
     */
    id: string;
  }> {
    return this.em.transactional(async (tx) => {
      const interaction = this.interactionsRepo.create(tx, {
        substanceAConceptId: dto.substanceAConceptId,
        substanceBConceptId: dto.substanceBConceptId,
        severityConceptId: dto.severityConceptId ?? CEXT.SEVERITY_HIGH,
        mechanismText: dto.mechanismText,
        managementText: dto.managementText,
        actorUserId: actor.id,
      });
      await tx.flush();
      return { id: interaction.id };
    });
  }

  // --- Evaluación de reglas (UC-18-03) ------------------------------------

  /**
   * Arma el contexto de evaluación desde el DTO: la lista de medicamentos y un
   * mapa `codeConceptId → valor` de las observaciones, que es lo que la gramática
   * de `logic_json` sabe consultar por ruta con puntos (`observations.<id>`).
   */
  private buildContext(dto: EvaluateCdsDto): CdsEvalContext {
    const observations: Record<string, number | undefined> = {};
    for (const obs of dto.observations ?? []) {
      observations[obs.codeConceptId] = obs.valueNumber;
    }
    return {
      medications: dto.medicationConceptIds ?? [],
      observations,
    };
  }

  /**
   * ¿Matchea la regla el contexto? Envuelve al evaluador y **falla cerrado**: si
   * la lógica no se entiende (o la regla no trae lógica), no dispara y se loguea.
   */
  private ruleMatches(
    rule: {
      /**
       * Identificador único de la instancia.
       */
      id: string; /**
       * Valor de logic json mantenido por la instancia.
       */
      logicJson?: unknown;
    },
    context: CdsEvalContext,
  ): boolean {
    try {
      return this.evaluateLogic(rule.logicJson, context);
    } catch (err) {
      this.logger.warn(
        {
          operation: 'clinical_ext.cds.evaluate',
          ruleId: rule.id,
          reason: err instanceof Error ? err.message : String(err),
        },
        'Regla CDS ignorada: lógica no interpretable (fail-closed)',
      );
      return false;
    }
  }

  /**
   * Evaluador de `logic_json`. Gramática mínima, inspirada en el evaluador de
   * guardas de workflow, con composición booleana:
   *
   * - Hoja: `{ field, op, value? }`, donde `field` es una ruta con puntos dentro
   *   del contexto (`medications`, `observations.<conceptId>`).
   *   Operadores: `exists`, `eq`, `ne`, `in`, `contains`, `gt`, `lt`, `gte`, `lte`.
   * - Compuestos: `{ all: [...] }` (Y), `{ any: [...] }` (O), `{ not: {...} }`.
   *
   * Cualquier nodo que no encaje en esta gramática lanza
   * {@link UnparseableCdsRuleError} para que la regla falle cerrado.
   */
  private evaluateLogic(logic: unknown, context: CdsEvalContext): boolean {
    if (logic === null || typeof logic !== 'object') {
      throw new UnparseableCdsRuleError('logic_json no es un objeto');
    }
    const node = logic as Record<string, unknown>;

    if (Array.isArray(node.all)) {
      return node.all.every((child) => this.evaluateLogic(child, context));
    }
    if (Array.isArray(node.any)) {
      return node.any.some((child) => this.evaluateLogic(child, context));
    }
    if ('not' in node) {
      return !this.evaluateLogic(node.not, context);
    }
    if (typeof node.field === 'string' && typeof node.op === 'string') {
      return this.evaluateLeaf(node.field, node.op, node.value, context);
    }

    throw new UnparseableCdsRuleError('nodo de lógica no reconocido');
  }

  /**
   * Evalúa una hoja `{ field, op, value }`.
   *
   * Se distingue entre lógica malformada (la regla declara mal el operador o el
   * `value` requerido → `UnparseableCdsRuleError`, falla cerrado) y datos ausentes
   * en tiempo de ejecución (la observación no está o no es numérica → simplemente
   * no matchea, `false`). No entender la regla no es lo mismo que la regla no se
   * cumpla.
   */
  private evaluateLeaf(
    field: string,
    op: string,
    value: unknown,
    context: CdsEvalContext,
  ): boolean {
    const actual = this.readPath(
      context as unknown as Record<string, unknown>,
      field,
    );

    switch (op) {
      case 'exists':
        return actual !== undefined && actual !== null;
      case 'eq':
        return actual === value;
      case 'ne':
        return actual !== value;
      case 'in':
        if (!Array.isArray(value)) {
          throw new UnparseableCdsRuleError("op 'in' exige un array en value");
        }
        return value.includes(actual);
      case 'contains':
        // `field` apunta a un array del contexto (p.ej. medications) y `value`
        // es el elemento buscado.
        return Array.isArray(actual) && actual.includes(value);
      case 'gt':
      case 'lt':
      case 'gte':
      case 'lte': {
        if (typeof value !== 'number') {
          throw new UnparseableCdsRuleError(
            `op '${op}' exige un número en value`,
          );
        }
        if (typeof actual !== 'number') return false;
        if (op === 'gt') return actual > value;
        if (op === 'lt') return actual < value;
        if (op === 'gte') return actual >= value;
        return actual <= value;
      }
      default:
        throw new UnparseableCdsRuleError(`operador no soportado: ${op}`);
    }
  }

  /** Lee una ruta con puntos dentro del contexto; ausente ⇒ `undefined`. */
  private readPath(source: Record<string, unknown>, path: string): unknown {
    let current: unknown = source;
    for (const segment of path.split('.')) {
      if (current === null || typeof current !== 'object') return undefined;
      current = (current as Record<string, unknown>)[segment];
    }
    return current;
  }

  /**
   * Transforma to rule response.
   *
   * @param rule - Valor de rule requerido por la operación.
   * @returns Resultado de to rule response conforme al contrato `CdsRuleResponseDto`.
   */
  private toRuleResponse(rule: {
    /**
     * Identificador único de la instancia.
     */
    id: string;
    /**
     * Valor de code mantenido por la instancia.
     */
    code: string;
    /**
     * Valor de version mantenido por la instancia.
     */
    version?: number;
    /**
     * Valor de is active mantenido por la instancia.
     */
    isActive: boolean;
    /**
     * Identificador asociado a status concept.
     */
    statusConceptId: string;
  }): CdsRuleResponseDto {
    return {
      id: rule.id,
      code: rule.code,
      version: rule.version ?? 1,
      isActive: rule.isActive,
      statusConceptId: rule.statusConceptId,
    };
  }
}
