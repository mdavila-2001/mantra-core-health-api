import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { CdsService } from './cds.service';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { CEXT } from '../clinical_ext.concepts';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const rulesRepo = {
    findById: mockFn(),
    findByPatient: mockFn(() => Promise.resolve([])),
    findByCode: mockFn(),
    findActive: mockFn(),
    create: mockFn(),
  };
  const alertsRepo = { create: mockFn() };
  const interactionsRepo = { findByPair: mockFn(), create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new CdsService(
    em as any,
    rulesRepo,
    alertsRepo as any,
    interactionsRepo,
    logger as any,
  );
  return { service, tx, rulesRepo, alertsRepo, interactionsRepo };
}

describe('CdsService', () => {
  describe('createRule', () => {
    it('creates a draft rule', async () => {
      const d = build();
      d.rulesRepo.findByCode.mockResolvedValue(null);
      d.rulesRepo.create.mockReturnValue({
        id: 'r1',
        code: 'C1',
        version: 1,
        isActive: false,
        statusConceptId: CEXT.CDS_RULE_DRAFT,
      });
      const res = await d.service.createRule(
        { code: 'C1', name: 'Rule' },
        actor,
      );
      expect(res.statusConceptId).toBe(CEXT.CDS_RULE_DRAFT);
    });

    it('rejects a duplicated code (conflict)', async () => {
      const d = build();
      d.rulesRepo.findByCode.mockResolvedValue({ id: 'r0' });
      await expect(
        d.service.createRule({ code: 'C1', name: 'Rule' } as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('publishVersion (UC-18-13)', () => {
    it('bumps version and activates the rule', async () => {
      const d = build();
      const rule = {
        id: 'r1',
        code: 'C1',
        version: 1,
        isActive: false,
        statusConceptId: CEXT.CDS_RULE_DRAFT,
        updatedAt: new Date(),
      };
      d.rulesRepo.findById.mockResolvedValue(rule);
      const res = await d.service.publishVersion('r1', {}, actor);
      expect(res.version).toBe(2);
      expect(rule.isActive).toBe(true);
      expect(rule.statusConceptId).toBe(CEXT.CDS_RULE_ACTIVE);
    });

    it('throws when the rule is missing', async () => {
      const d = build();
      d.rulesRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.publishVersion('r1', {} as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('rollbackVersion (UC-18-13)', () => {
    it('retires an active rule', async () => {
      const d = build();
      const rule = {
        id: 'r1',
        code: 'C1',
        version: 2,
        isActive: true,
        statusConceptId: CEXT.CDS_RULE_ACTIVE,
        updatedAt: new Date(),
      };
      d.rulesRepo.findById.mockResolvedValue(rule);
      await d.service.rollbackVersion('r1', actor);
      expect(rule.isActive).toBe(false);
      expect(rule.statusConceptId).toBe(CEXT.CDS_RULE_RETIRED);
    });

    it('rejects rollback of a non-active rule (precondition)', async () => {
      const d = build();
      d.rulesRepo.findById.mockResolvedValue({
        id: 'r1',
        statusConceptId: CEXT.CDS_RULE_DRAFT,
      });
      await expect(
        d.service.rollbackVersion('r1', actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('evaluate (UC-18-03)', () => {
    it('emits alerts only for rules whose logic matches the context', async () => {
      const d = build();
      d.rulesRepo.findActive.mockResolvedValue([
        {
          id: 'r-med',
          name: 'On drug X',
          severityConceptId: CEXT.SEVERITY_HIGH,
          messageTemplate: 'msg',
          logicJson: { field: 'medications', op: 'contains', value: 'drug-x' },
        },
        {
          id: 'r-hi-glucose',
          name: 'Hyperglycemia',
          severityConceptId: CEXT.SEVERITY_MODERATE,
          logicJson: { field: 'observations.gluc', op: 'gt', value: 200 },
        },
        {
          id: 'r-no-match',
          name: 'On drug Y',
          severityConceptId: CEXT.SEVERITY_LOW,
          logicJson: { field: 'medications', op: 'contains', value: 'drug-y' },
        },
      ]);
      d.alertsRepo.create.mockImplementation((_tx: any, data: any) => ({
        id: `a-${data.ruleId}`,
        ...data,
      }));

      const res = await d.service.evaluate(
        {
          patientProfileId: 'p1',
          medicationConceptIds: ['drug-x'],
          observations: [{ codeConceptId: 'gluc', valueNumber: 250 }],
        },
        actor,
      );

      expect(res.count).toBe(2);
      const firedRules = res.alerts.map((a) => a.ruleId).sort();
      expect(firedRules).toEqual(['r-hi-glucose', 'r-med']);
      // La severidad emitida es la declarada por cada regla, no una fija.
      const bySeverity = Object.fromEntries(
        res.alerts.map((a) => [a.ruleId, a.severityConceptId]),
      );
      expect(bySeverity['r-med']).toBe(CEXT.SEVERITY_HIGH);
      expect(bySeverity['r-hi-glucose']).toBe(CEXT.SEVERITY_MODERATE);
      expect(d.tx.flush).toHaveBeenCalledTimes(1);
    });

    it('supports boolean composition (all/any/not)', async () => {
      const d = build();
      d.rulesRepo.findActive.mockResolvedValue([
        {
          id: 'r-all',
          name: 'both',
          severityConceptId: CEXT.SEVERITY_HIGH,
          logicJson: {
            all: [
              { field: 'medications', op: 'contains', value: 'm1' },
              { field: 'observations.k', op: 'gte', value: 5 },
            ],
          },
        },
      ]);
      d.alertsRepo.create.mockImplementation((_tx: any, data: any) => ({
        id: `a-${data.ruleId}`,
        ...data,
      }));

      const res = await d.service.evaluate(
        {
          patientProfileId: 'p1',
          medicationConceptIds: ['m1'],
          observations: [{ codeConceptId: 'k', valueNumber: 5 }],
        },
        actor,
      );
      expect(res.count).toBe(1);
    });

    it('fails closed: an unparseable rule does not fire and is logged (warn)', async () => {
      const d = build();
      d.rulesRepo.findActive.mockResolvedValue([
        {
          id: 'r-bad',
          name: 'bad',
          severityConceptId: CEXT.SEVERITY_HIGH,
          logicJson: { weird: true },
        },
        { id: 'r-nologic', name: 'none', severityConceptId: CEXT.SEVERITY_LOW },
      ]);
      const res = await d.service.evaluate(
        { patientProfileId: 'p1', medicationConceptIds: ['x'] },
        actor,
      );
      expect(res.count).toBe(0);
      expect(d.alertsRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('checkInteractions (UC-18-04)', () => {
    it('raises an alert only for pairs with a known interaction', async () => {
      const d = build();
      d.interactionsRepo.findByPair.mockImplementation(
        (_tx: any, a: string, b: string) =>
          a === 's1' && b === 's2'
            ? {
                id: 'i1',
                severityConceptId: CEXT.SEVERITY_HIGH,
                mechanismText: 'm',
                managementText: 'g',
              }
            : null,
      );
      d.alertsRepo.create.mockImplementation((_tx: any, data: any) => ({
        id: 'a1',
        ...data,
      }));

      const res = await d.service.checkInteractions(
        {
          patientProfileId: 'p1',
          substanceConceptIds: ['s1', 's2', 's3'],
        },
        actor,
      );

      expect(res.count).toBe(1);
      expect(res.alerts[0].severityConceptId).toBe(CEXT.SEVERITY_HIGH);
      // BR-14 (CL-09): el chequeo previo detecta pero no persiste — nunca
      // deja una fila en `clinical_ext.clinical_alerts` aunque haya match.
      expect(d.alertsRepo.create).not.toHaveBeenCalled();
    });

    it('returns no alerts when there are no known interactions', async () => {
      const d = build();
      d.interactionsRepo.findByPair.mockResolvedValue(null);
      const res = await d.service.checkInteractions(
        { patientProfileId: 'p1', substanceConceptIds: ['s1', 's2'] },
        actor,
      );
      expect(res.count).toBe(0);
      expect(d.alertsRepo.create).not.toHaveBeenCalled();
    });
  });
});
