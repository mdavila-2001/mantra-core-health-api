import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import { InsufficientRoleException } from '../../../common/errors/domain.exception';
import { PRAC } from '../../practice/practice.concepts';
import { ClinicalErrorReason } from '../clinical.error-reasons';
import { LEVELS_BY_BED_FUNCTION, LEVELS_OF_CARE } from '../domain/adt-catalog';
import {
  BLOCKING_RULES,
  OVERRIDABLE_RULES,
  evaluateCompatibility,
  splitViolations,
  type CompatibilityConfig,
  type CompatibilityViolation,
} from '../domain/bed-compatibility-rules';
import { BedCompatibilityDto, type AdtOverrideDto } from '../dto/adt.dto';
import { INFRA_F3_ACTIONS } from '../policies/infra-f3.policy';
import {
  CARE_SPACE_OPS_PORT,
  type CareSpaceOperationalState,
  type CareSpaceOpsPort,
} from '../ports/care-space-ops.port';
import {
  AdtRepository,
  isolationCodeOf,
  type AdtEncounterRow,
  type AdtSpaceRow,
} from '../repositories/adt.repository';
import { AdtAccessService, type AdtScope } from './adt-access.service';
import { AdtSettingsService } from './adt-settings.service';

/** Mínimo de caracteres de la justificación de un forzado (`ck_placement_incidents_justification_length`). */
export const OVERRIDE_MIN_LENGTH = 20;

/** Resultado de evaluar una cama para un encuentro. */
export interface BedEvaluation {
  /** Todas las incompatibilidades. */
  readonly violations: CompatibilityViolation[];
  /** La cama. */
  readonly space: AdtSpaceRow;
  /** Estado operativo que dio el puerto. */
  readonly ops: CareSpaceOperationalState;
}

/** Contexto de una evaluación. */
export interface EvaluationInput {
  /** Práctica de la sede (para leer ajustes). */
  readonly practiceId: string;
  /** Encuentro que se aloja. */
  readonly encounter: AdtEncounterRow;
  /** La cama ya bloqueada por quien llama. */
  readonly space: AdtSpaceRow;
  /** Instante de la asignación. */
  readonly at: Date;
  /** Encuentros que no cuentan como vecinos (el propio y, en el intercambio, su compañero). */
  readonly excludeEncounterIds: readonly string[];
  /** La reserva o la ocupación actual de la cama no impide (es del encuentro o de su compañero de intercambio). */
  readonly occupancyWaived: boolean;
}

/**
 * Compatibilidad de una cama con un encuentro (CONTRATO-F2-F5 F3.2).
 *
 * Reúne los hechos (paciente, encuentro, cama, habitación, vecinos, estado
 * operativo) y los pasa a las reglas puras de `bed-compatibility-rules`. Las
 * reglas bloqueantes (ciclo, disponibilidad, ocupación, higiene, aislamiento
 * aéreo) **nunca** se fuerzan; las demás se fuerzan con justificación e
 * incidente, y sólo por supervisión de enfermería.
 */
@Injectable()
export class BedCompatibilityService {
  /**
   * @param em - Contexto de persistencia.
   * @param repo - SQL de la internación.
   * @param access - Política de F3.
   * @param settings - Ajustes `infra.*`.
   * @param ops - Puerto de F2.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly repo: AdtRepository,
    private readonly access: AdtAccessService,
    private readonly settings: AdtSettingsService,
    @Inject(CARE_SPACE_OPS_PORT) private readonly ops: CareSpaceOpsPort,
  ) {}

  /**
   * `POST /clinical/encounters/:id/bed-compatibility`: consulta sin escribir.
   *
   * @param encounterId - Encuentro.
   * @param dto - Cama a evaluar.
   * @param actor - Quien consulta.
   */
  async check(
    encounterId: string,
    dto: BedCompatibilityDto,
    actor: AuthenticatedUser,
  ): Promise<{
    assignable: boolean;
    violations: CompatibilityViolation[];
  }> {
    return this.em.transactional(async (tx) => {
      const tenantId = requireTenantId();
      const encounter = await this.repo.findEncounter(tx, encounterId);
      if (!encounter || encounter.tenantId !== tenantId) throw this.notFound();
      const space = await this.repo.findSpace(tx, dto.careSpaceId);
      if (!space || space.tenantId !== tenantId) throw this.notFound();
      const scope = await this.access.forSpace(tx, space.id, actor);
      this.access.assertCan(scope, INFRA_F3_ACTIONS.COMPATIBILITY_CHECK);
      this.assertBed(space);
      const reservation = (await this.repo.reservations(tx, encounter.id)).some(
        (row) => row.careSpaceId === space.id,
      );
      const { violations } = await this.evaluate(tx, {
        practiceId: scope.practiceId,
        encounter,
        space,
        at: new Date(),
        excludeEncounterIds: [encounter.id],
        occupancyWaived: reservation,
      });
      return {
        assignable: violations.length === 0,
        violations,
      };
    });
  }

  /**
   * Evalúa una cama para un encuentro.
   *
   * @param tx - Transacción (con la fila de la cama ya bloqueada si se va a escribir).
   * @param input - Hechos de la evaluación.
   */
  async evaluate(
    tx: EntityManager,
    input: EvaluationInput,
  ): Promise<BedEvaluation> {
    const settings = await this.settings.forPractice(tx, input.practiceId);
    const patient = await this.repo.patientFacts(
      tx,
      input.encounter.patientProfileId,
    );
    if (!patient) throw this.notFound();
    const room = await this.repo.roomOf(tx, input.space);
    const occupants = room
      ? await this.repo.roomOccupants(tx, room.id, input.excludeEncounterIds)
      : [];
    const ops = await this.ops.getOperationalState(tx, input.space.id);
    const config: CompatibilityConfig = {
      ageThresholds: settings.ageThresholds,
      inspectionRequired: settings.inspectionRequired,
      hvacValidationMaxDays: settings.hvacValidationMaxDays,
      levelsByBedFunction: LEVELS_BY_BED_FUNCTION,
    };
    const violations = evaluateCompatibility(
      patient,
      {
        levelOfCareCode:
          LEVELS_OF_CARE.byConceptId(input.encounter.levelOfCareConceptId)
            ?.code ?? null,
        isolationCode: isolationCodeOf(
          input.encounter.isolationPrecautionConceptId,
        ),
        isolationOrganism: input.encounter.isolationOrganismText,
      },
      {
        functionCode:
          FUNCTION_CODE_BY_ID.get(input.space.functionConceptId) ?? null,
        bed: this.codes(input.space.attributes),
        room: room ? this.codes(room.attributes) : null,
        roomOccupants: occupants,
        ops,
        occupancyWaived: input.occupancyWaived,
      },
      config,
      input.at,
    );
    return { violations, space: input.space, ops };
  }

  /**
   * Resuelve qué se puede hacer con las incompatibilidades de una colocación.
   *
   * - Una **bloqueante** responde 409 `BED_NOT_ASSIGNABLE` (con `details.violations`),
   *   con o sin `override`: no se fuerza.
   * - Una forzable sin `override` responde 422 `BED_COMPATIBILITY_OVERRIDE_REQUIRED`.
   * - Con `override`: la justificación tiene al menos 20 caracteres, las reglas
   *   forzadas cubren todas las detectadas y sólo hay reglas forzables
   *   (422 `OVERRIDE_JUSTIFICATION_TOO_SHORT`, 422 `OVERRIDE_RULE_NOT_OVERRIDABLE`),
   *   el actor es supervisión de enfermería (403) y, si hay cohorte de
   *   aislamiento, además tiene el aval de control de infecciones (403).
   *
   * @param violations - Resultado de {@link evaluate}.
   * @param override - Forzado pedido, si lo hay.
   * @param scope - Alcance del actor sobre la cama.
   * @returns Las incompatibilidades forzadas (vacío si no había ninguna): hay que abrir un incidente con ellas.
   */
  resolveOverride(
    violations: readonly CompatibilityViolation[],
    override: AdtOverrideDto | undefined,
    scope: AdtScope,
  ): CompatibilityViolation[] {
    const { blocking, overridable } = splitViolations(violations);
    if (blocking.length > 0) {
      throw new ConflictException(
        'La cama no es asignable',
        { violations: blocking },
        ClinicalErrorReason.BED_NOT_ASSIGNABLE,
      );
    }
    if (overridable.length === 0) return [];
    if (!override) {
      throw new PreconditionFailedException(
        'La cama es incompatible; se puede forzar con justificación',
        { violations: overridable },
        ClinicalErrorReason.BED_COMPATIBILITY_OVERRIDE_REQUIRED,
      );
    }

    const forced = new Set<string>(
      override.ruleCodes.map((r) => r.trim().toUpperCase()),
    );
    const notForcible = [...forced].filter(
      (rule) => !(OVERRIDABLE_RULES as readonly string[]).includes(rule),
    );
    if (notForcible.length > 0) {
      throw new PreconditionFailedException(
        'Esa regla no se puede forzar',
        {
          ruleCodes: notForcible,
          blockingRules: [...BLOCKING_RULES],
        },
        ClinicalErrorReason.OVERRIDE_RULE_NOT_OVERRIDABLE,
      );
    }
    const missing = overridable.filter((v) => !forced.has(v.rule));
    if (missing.length > 0) {
      throw new PreconditionFailedException(
        'El forzado no cubre todas las incompatibilidades',
        { violations: missing },
        ClinicalErrorReason.BED_COMPATIBILITY_OVERRIDE_REQUIRED,
      );
    }
    if (override.justification.trim().length < OVERRIDE_MIN_LENGTH) {
      throw new PreconditionFailedException(
        `La justificación necesita al menos ${OVERRIDE_MIN_LENGTH} caracteres`,
        { minLength: OVERRIDE_MIN_LENGTH },
        ClinicalErrorReason.OVERRIDE_JUSTIFICATION_TOO_SHORT,
      );
    }
    this.access.assertCan(scope, INFRA_F3_ACTIONS.OVERRIDE);
    if (
      overridable.some((v) => v.rule === 'ISOLATION_COHORT') &&
      !this.access.canApproveCohort(scope)
    ) {
      throw new InsufficientRoleException(
        'La cohorte de aislamiento necesita el aval de control de infecciones',
        { requiredRoles: ['INFECTION_CONTROL'], rule: 'ISOLATION_COHORT' },
        ClinicalErrorReason.INFRA_ACTION_NOT_ALLOWED,
      );
    }
    return [...overridable];
  }

  /**
   * La forma del espacio tiene que ser cama.
   *
   * @param space - Espacio cargado.
   * @throws PreconditionFailedException (422 `SPACE_NOT_A_BED`).
   */
  assertBed(space: AdtSpaceRow): void {
    if (space.formConceptId !== PRAC.LOC_FORM_BED) {
      throw new PreconditionFailedException(
        'El espacio no es una cama',
        undefined,
        ClinicalErrorReason.SPACE_NOT_A_BED,
      );
    }
  }

  private codes(attributes: AdtSpaceRow['attributes']): {
    sexRestriction: string | null;
    ageGroup: string | null;
    pressure: string | null;
    hvacValidatedOn: string | null;
  } {
    return {
      sexRestriction:
        SEX_CODE_BY_ID.get(attributes.sexRestriction ?? '') ?? null,
      ageGroup: AGE_CODE_BY_ID.get(attributes.ageGroup ?? '') ?? null,
      pressure: PRESSURE_CODE_BY_ID.get(attributes.pressure ?? '') ?? null,
      hvacValidatedOn: attributes.hvacValidatedOn,
    };
  }

  private notFound(): ResourceNotFoundException {
    return new ResourceNotFoundException(
      'Recurso no encontrado',
      undefined,
      ClinicalErrorReason.ADT_RESOURCE_OUT_OF_SCOPE,
    );
  }
}

/** Códigos `SPACE_FN_*` de las funciones de cama conocidas, por id de concepto. */
const FUNCTION_CODE_BY_ID = new Map<string, string>(
  Object.keys(LEVELS_BY_BED_FUNCTION).map((code) => [
    (PRAC as Record<string, string>)[code],
    code,
  ]),
);
const SEX_CODE_BY_ID = new Map<string, string>([
  [PRAC.SEX_ANY, 'SEX_ANY'],
  [PRAC.SEX_FEMALE, 'SEX_FEMALE'],
  [PRAC.SEX_MALE, 'SEX_MALE'],
]);
const AGE_CODE_BY_ID = new Map<string, string>([
  [PRAC.AGE_ANY, 'AGE_ANY'],
  [PRAC.AGE_ADULT, 'AGE_ADULT'],
  [PRAC.AGE_PEDIATRIC, 'AGE_PEDIATRIC'],
  [PRAC.AGE_NEONATAL, 'AGE_NEONATAL'],
]);
const PRESSURE_CODE_BY_ID = new Map<string, string>([
  [PRAC.PRESSURE_NEUTRAL, 'PRESSURE_NEUTRAL'],
  [PRAC.PRESSURE_POSITIVE, 'PRESSURE_POSITIVE'],
  [PRAC.PRESSURE_NEGATIVE, 'PRESSURE_NEGATIVE'],
]);
