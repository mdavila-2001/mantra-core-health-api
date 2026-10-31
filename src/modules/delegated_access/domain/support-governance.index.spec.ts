import * as domain from './index';
import { DelegatedAccessErrorReason } from '../delegated_access.error-reasons';

/**
 * El dominio de gobierno (IGA) se consume solo por `index.ts`: esta prueba
 * falla si una pieza deja de exportarse o cambia de nombre.
 */
describe('domain/index · gobierno de usuarios (IGA)', () => {
  const functions = [
    // base
    'canonicalJson',
    'sha256Hex',
    'targetCells',
    'locationRelation',
    'grantsOverlap',
    'targetWithin',
    'isGrantLive',
    'atomsOfGrant',
    'effectiveAtoms',
    // SoD
    'evaluateSod',
    'summarizeSod',
    'checkSodTransaction',
    'ruleAdmitsException',
    'sodActionRank',
    'validateSodRuleDerivation',
    'mergeSodRules',
    'validateSodExceptionRequest',
    'expiredSodExceptions',
    'selectRemediationGrant',
    // puntaje
    'privilegeScore',
    'privilegeScoreOfGrants',
    'templateBaselineScore',
    'privilegeCreep',
    'countGrantsSinceCertification',
    'privilegeDelta',
    // revisores
    'resolveReviewer',
    'escalationTargets',
    // ciclo de vida
    'checklistFor',
    'evaluateJoinerChecklist',
    'pendingRequired',
    'canComplete',
    'completeChecklistItem',
    'onboardingDueAt',
    'onboardingGate',
    'moveRequiresFourEyes',
    'planMove',
    'leaverCaseStatus',
    'planHandover',
    'verifyRevokeBeforeReassign',
    'canSuspend',
    'canReactivate',
    'reactivationReview',
    'assessInactivity',
    'ownerEligibility',
    'ownerlessReasons',
    // cuatro ojos
    'canTransition',
    'hashPayload',
    'payloadMatches',
    'actionPayload',
    'pendingExpiryFor',
    'approvedUntilFor',
    'approverKindForAtom',
    'eligibleApprovers',
    'checkApproverEligibility',
    'decideFourEyes',
    'consumeFourEyes',
    'sweepAction',
    'expireFourEyes',
    'cancelFourEyes',
    'isDuplicatePending',
    // anomalías
    'percentile',
    'mean',
    'detectSearchSpike',
    'detectCancelSpike',
    'detectOffHours',
    'detectDeniedBurst',
    'detectBrowsePatients',
    'detectInactiveAccount',
    'detectPrivilegeCreep',
    'anomalyWindow',
    // campañas
    'normalizeSensitivity',
    'maxSensitivityOf',
    'sensitivityRank',
    'isGrantUnused',
    'grantInCampaignScope',
    'selectCampaignItems',
    'buildReviewEvidence',
    'hashEvidence',
    'summarizeCampaignResults',
    'canDecideReviewItem',
    'adjustmentOnlyReduces',
    'validateReviewDecision',
    'evaluateBulkDecision',
    'reminderDue',
    'escalationDue',
    'campaignCloseAt',
    'planCampaignClosure',
    'planRecertificationItems',
    'reviewCadenceMonthsFor',
    'nextPeriodicReviewDue',
    // administración delegada
    'effectiveDelegationCeiling',
    'checkDelegatedGrant',
    'partitionByScope',
    'checkWholePersonScope',
  ] as const;

  it.each(functions)('exporta la función %s', (name) => {
    expect(typeof (domain as Record<string, unknown>)[name]).toBe('function');
  });

  it('exporta los datos del contrato', () => {
    expect(domain.SOD_PLATFORM_RULES).toHaveLength(11);
    expect(domain.FOUR_EYES_KINDS).toHaveLength(5);
    expect(domain.ANOMALY_KINDS).toHaveLength(7);
    expect(domain.JOINER_ITEM_CODES).toHaveLength(7);
    expect(domain.REVIEW_DEFAULTS.unusedDays).toBe(60);
    expect(domain.DEFAULT_CREEP_THRESHOLD).toBe(15);
    expect(domain.TEAM_ADMIN_PRESET_CEILING.maxValidDays).toBe(180);
  });

  it('los nombres exportados por el dominio no chocan con los de B2 (el índice sigue siendo único)', () => {
    // Si dos módulos exportaran el mismo nombre con distinto contenido, TypeScript
    // lo rechazaría al compilar; aquí se deja constancia de lo que no se pisa.
    expect(typeof domain.evaluateSupportAccessV2).toBe('function');
    expect(typeof domain.validateGrantsAgainstGuardrails).toBe('function');
    expect(typeof domain.evaluateConditions).toBe('function');
  });

  it('CONDITION_VALUE_INVALID es el 13.º código de condiciones de DelegatedAccessErrorReason', () => {
    expect(DelegatedAccessErrorReason.CONDITION_VALUE_INVALID).toBe(
      'CONDITION_VALUE_INVALID',
    );
  });
});
