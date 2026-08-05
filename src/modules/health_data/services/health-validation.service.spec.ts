import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { HealthValidationService } from './health-validation.service';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'user-1', roles: ['DATA_STEWARD'] };
const VERSION = '11111111-1111-1111-1111-111111111111';
const RESOURCE = '22222222-2222-2222-2222-222222222222';
const PROFILE_VERSION = '33333333-3333-3333-3333-333333333333';
const RULE_SET = '44444444-4444-4444-4444-444444444444';
const RULE = '55555555-5555-5555-5555-555555555555';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const validationRepo = {
    findProfileVersionById: mockFn(),
    createValidationRun: mockFn(() => ({ id: 'run-1' })),
    findValidationRun: mockFn(() => Promise.resolve(null)),
    createValidationIssue: mockFn(() => ({ id: 'issue-1' })),
    findRuleSetById: mockFn(),
    findActiveRules: mockFn(() => Promise.resolve([])),
    createQualityRun: mockFn(() => ({ id: 'quality-run-1' })),
    createQualityIssue: mockFn(() => ({ id: 'quality-issue-1' })),
    findOpenIssue: mockFn(() => Promise.resolve(null)),
  };
  const resourcesRepo = {
    findVersionById: mockFn(),
    findResourceForUpdate: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new HealthValidationService(
    em as any,
    validationRepo,
    resourcesRepo as any,
    logger as any,
  );
  return { service, tx, validationRepo, resourcesRepo, logger };
}

describe('HealthValidationService', () => {
  describe('validateVersion (UC-52-07)', () => {
    const dto: any = {
      fhirProfileVersionId: PROFILE_VERSION,
      validatorVersion: 'hapi-7.2.0',
      startedAt: '2026-07-20T10:00:00.000Z',
    };

    /**
     * Ejecuta la operación wire.
     *
     * @param d - Valor de d requerido por la operación.
     * @param resourceOverrides - Valor de resource overrides requerido por la operación.
     * @returns Resultado de wire.
     */
    function wire(
      d: ReturnType<typeof build>,
      resourceOverrides: Record<string, unknown> = {},
    ) {
      d.resourcesRepo.findVersionById.mockResolvedValue({
        id: VERSION,
        canonicalHealthResourceId: RESOURCE,
      });
      d.validationRepo.findProfileVersionById.mockResolvedValue({
        id: PROFILE_VERSION,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      });
      const resource: any = {
        id: RESOURCE,
        lifecycleStatusConceptId: CONCEPTS.RESOURCE_ACTIVE,
        ...resourceOverrides,
      };
      d.resourcesRepo.findResourceForUpdate.mockResolvedValue(resource);
      return resource;
    }

    it('passes when the validator found nothing', async () => {
      const d = build();
      wire(d);

      const res = await d.service.validateVersion(VERSION, dto);

      expect(res).toEqual({
        id: 'run-1',
        resultConceptId: CONCEPTS.VALIDATION_RESULT_PASS,
        issueCount: 0,
        quarantined: false,
        duplicate: false,
      });
    });

    it('reports warnings without quarantining', async () => {
      const d = build();
      const resource = wire(d);

      const res = await d.service.validateVersion(VERSION, {
        ...dto,
        issues: [{ severity: 'WARNING' }, { severity: 'INFORMATION' }],
      });

      expect(res.resultConceptId).toBe(CONCEPTS.VALIDATION_RESULT_WARNING);
      expect(res.issueCount).toBe(2);
      expect(res.quarantined).toBe(false);
      expect(resource.lifecycleStatusConceptId).toBe(CONCEPTS.RESOURCE_ACTIVE);
    });

    it('quarantines the resource on an error', async () => {
      const d = build();
      const resource = wire(d);

      const res = await d.service.validateVersion(VERSION, {
        ...dto,
        issues: [
          { severity: 'WARNING' },
          { severity: 'ERROR', issueCode: 'required' },
        ],
      });

      expect(res.resultConceptId).toBe(CONCEPTS.VALIDATION_RESULT_ERROR);
      expect(res.quarantined).toBe(true);
      expect(resource.lifecycleStatusConceptId).toBe(
        CONCEPTS.RESOURCE_QUARANTINED,
      );
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('treats a fatal issue as blocking too', async () => {
      const d = build();
      wire(d);

      const res = await d.service.validateVersion(VERSION, {
        ...dto,
        issues: [{ severity: 'FATAL' }],
      });

      expect(res.resultConceptId).toBe(CONCEPTS.VALIDATION_RESULT_ERROR);
    });

    it('does not quarantine a resource that is already retired', async () => {
      const d = build();
      const resource = wire(d, {
        lifecycleStatusConceptId: CONCEPTS.RESOURCE_RETIRED,
      });

      const res = await d.service.validateVersion(VERSION, {
        ...dto,
        issues: [{ severity: 'ERROR' }],
      });

      expect(res.quarantined).toBe(false);
      expect(resource.lifecycleStatusConceptId).toBe(CONCEPTS.RESOURCE_RETIRED);
    });

    it('returns the previous run when the same validation already happened', async () => {
      const d = build();
      wire(d);
      d.validationRepo.findValidationRun.mockResolvedValue({
        id: 'run-prev',
        resultConceptId: CONCEPTS.VALIDATION_RESULT_PASS,
        issueCount: 0,
      });

      const res = await d.service.validateVersion(VERSION, dto);

      expect(res.duplicate).toBe(true);
      expect(d.validationRepo.createValidationRun).not.toHaveBeenCalled();
    });

    it('refuses validating against a profile version that is not active', async () => {
      const d = build();
      wire(d);
      d.validationRepo.findProfileVersionById.mockResolvedValue({
        id: PROFILE_VERSION,
        stateConceptId: CONCEPTS.STATE_REVOKED,
      });

      await expect(
        d.service.validateVersion(VERSION, dto),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the version does not exist', async () => {
      const d = build();
      d.resourcesRepo.findVersionById.mockResolvedValue(null);

      await expect(
        d.service.validateVersion(VERSION, dto),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('recordQualityRun (UC-52-08)', () => {
    const dto: any = {
      healthDataQualityRuleSetId: RULE_SET,
      startedAt: '2026-07-20T10:00:00.000Z',
      recordsEvaluated: '1200',
      healthIngestionBatchId: '66666666-6666-6666-6666-666666666666',
    };

    /**
     * Ejecuta la operación wire.
     *
     * @param d - Valor de d requerido por la operación.
     * @param severity - Valor de severity requerido por la operación.
     * @returns Resultado de wire.
     */
    function wire(
      d: ReturnType<typeof build>,
      severity = CONCEPTS.ISSUE_SEV_WARNING,
    ) {
      d.validationRepo.findRuleSetById.mockResolvedValue({
        id: RULE_SET,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      });
      d.validationRepo.findActiveRules.mockResolvedValue([
        { id: RULE, severityConceptId: severity },
      ]);
    }

    it('passes a run with no findings', async () => {
      const d = build();
      wire(d);

      const res = await d.service.recordQualityRun(dto, actor);

      expect(res).toEqual({
        id: 'quality-run-1',
        resultConceptId: CONCEPTS.QUALITY_RESULT_PASS,
        issuesDetected: 0,
        duplicatesSkipped: 0,
      });
    });

    it('warns when the broken rules are only warnings', async () => {
      const d = build();
      wire(d);

      const res = await d.service.recordQualityRun(
        {
          ...dto,
          findings: [
            { healthDataQualityRuleId: RULE, fieldPath: 'Patient.birthDate' },
          ],
        },
        actor,
      );

      expect(res.resultConceptId).toBe(CONCEPTS.QUALITY_RESULT_WARNING);
      expect(res.issuesDetected).toBe(1);
    });

    it('fails when a broken rule is an error', async () => {
      const d = build();
      wire(d, CONCEPTS.ISSUE_SEV_ERROR);

      const res = await d.service.recordQualityRun(
        { ...dto, findings: [{ healthDataQualityRuleId: RULE }] },
        actor,
      );

      expect(res.resultConceptId).toBe(CONCEPTS.QUALITY_RESULT_FAIL);
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('does not duplicate an identical open issue', async () => {
      const d = build();
      wire(d);
      d.validationRepo.findOpenIssue.mockResolvedValue({
        id: 'quality-issue-prev',
      });

      const res = await d.service.recordQualityRun(
        { ...dto, findings: [{ healthDataQualityRuleId: RULE }] },
        actor,
      );

      expect(res.issuesDetected).toBe(0);
      expect(res.duplicatesSkipped).toBe(1);
      expect(d.validationRepo.createQualityIssue).not.toHaveBeenCalled();
    });

    it('refuses a finding on a rule that is not active in the set', async () => {
      const d = build();
      wire(d);

      await expect(
        d.service.recordQualityRun(
          { ...dto, findings: [{ healthDataQualityRuleId: 'regla-ajena' }] },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses a run with no scope', async () => {
      const d = build();

      await expect(
        d.service.recordQualityRun(
          { ...dto, healthIngestionBatchId: undefined },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses a rule set that is not active', async () => {
      const d = build();
      d.validationRepo.findRuleSetById.mockResolvedValue({
        id: RULE_SET,
        stateConceptId: CONCEPTS.STATE_REVOKED,
      });

      await expect(
        d.service.recordQualityRun(dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the rule set does not exist', async () => {
      const d = build();
      d.validationRepo.findRuleSetById.mockResolvedValue(null);

      await expect(
        d.service.recordQualityRun(dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });
});
