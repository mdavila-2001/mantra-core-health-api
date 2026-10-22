import { CONCEPTS } from '../../../common/constants/concepts';
import { SYSOPS } from '../system_ops.concepts';
import { LegalHoldRepository } from '../repositories/legal-hold.repository';
import {
  IdentityEvidenceHoldResolver,
  type IdentityHoldGraph,
} from './identity-evidence-hold-resolver.service';

const now = new Date('2030-01-01T00:00:00Z');
const graph: IdentityHoldGraph = {
  tenantId: 'synthetic-tenant',
  recordIds: ['subject', 'case', 'evidence', 'file'],
  registryIds: ['registry'],
  fileHoldUntil: [null],
  objectHolds: [],
  objectRetentionLocks: [],
  coverage: 'PROVEN',
};
const hold = {
  tenantId: graph.tenantId,
  targetId: 'case',
  targetTypeConceptId: SYSOPS.HOLD_TARGET_RECORD,
  statusConceptId: CONCEPTS.STATE_ACTIVE,
  startsAt: new Date('2020-01-01'),
  endsAt: new Date('2021-01-01'),
};
const resolver = new IdentityEvidenceHoldResolver(new LegalHoldRepository());
describe('identity hold resolver — synthetic records only', () => {
  it('active generic hold blocks even when ends_at is past', () => {
    expect(resolver.evaluate(graph, [hold], now).state).toBe('ACTIVE');
  });
  it.each(graph.recordIds)('a %s hold covers the graph', (targetId) => {
    expect(resolver.evaluate(graph, [{ ...hold, targetId }], now).state).toBe(
      'ACTIVE',
    );
  });
  it('only coherent persisted REVOKED releases a generic hold', () => {
    expect(
      resolver.evaluate(
        graph,
        [{ ...hold, statusConceptId: CONCEPTS.STATE_REVOKED }],
        now,
      ).state,
    ).toBe('CLEAR');
    expect(
      resolver.evaluate(graph, [{ ...hold, statusConceptId: 'RELEASED' }], now)
        .state,
    ).toBe('UNKNOWN');
    expect(
      resolver.evaluate(
        graph,
        [
          {
            ...hold,
            statusConceptId: CONCEPTS.STATE_REVOKED,
            endsAt: undefined,
          },
        ],
        now,
      ).state,
    ).toBe('UNKNOWN');
  });
  it('does not omit foreign tenant, unknown target or incomplete coverage', () => {
    expect(
      resolver.evaluate(graph, [{ ...hold, tenantId: 'other' }], now).state,
    ).toBe('UNKNOWN');
    expect(
      resolver.evaluate(
        graph,
        [{ ...hold, targetTypeConceptId: 'unknown' }],
        now,
      ).state,
    ).toBe('UNKNOWN');
    expect(
      resolver.evaluate({ ...graph, coverage: 'UNKNOWN' }, [], now).state,
    ).toBe('UNKNOWN');
  });
  it('combines file, table, object and retention locks', () => {
    expect(
      resolver.evaluate(
        { ...graph, fileHoldUntil: [new Date('2031-01-01')] },
        [],
        now,
      ).state,
    ).toBe('ACTIVE');
    expect(
      resolver.evaluate(
        graph,
        [
          {
            ...hold,
            targetId: 'registry',
            targetTypeConceptId: SYSOPS.HOLD_TARGET_TABLE,
          },
        ],
        now,
      ).state,
    ).toBe('ACTIVE');
    expect(
      resolver.evaluate(
        { ...graph, objectHolds: [{ holdState: 'ACTIVE', placedAt: now }] },
        [],
        now,
      ).state,
    ).toBe('ACTIVE');
    expect(
      resolver.evaluate(
        {
          ...graph,
          objectRetentionLocks: [{ retainUntil: new Date('2031-01-01') }],
        },
        [],
        now,
      ).state,
    ).toBe('ACTIVE');
  });
  it('invalid dates are unknown, never expired', () => {
    expect(
      resolver.evaluate(
        { ...graph, fileHoldUntil: [new Date('invalid')] },
        [],
        now,
      ).state,
    ).toBe('UNKNOWN');
  });
});
