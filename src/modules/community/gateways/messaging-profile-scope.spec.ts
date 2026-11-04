import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { rlsFixture } from '../../../common/tenant/rls-transaction.testing';
import { COMM } from '../community.concepts';
import { PublicProfiles } from '../entities';
import { withMessagingProfileScope } from './messaging-profile-scope';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const PROFILE = 'pppppppp-0000-0000-0000-000000000001';
const TENANT = 'aaaaaaaa-1111-1111-1111-111111111111';
const SYSTEM = "select set_config('app.system_context', 'true', true)";
const user = (over: object = {}) =>
  ({ id: 'u1', roles: [], practitionerProfileId: 'pp-1', ...over }) as any;

function build(claim: object | null) {
  const findOne = mockFn(async () => claim);
  const f = rlsFixture({ findOne });
  const work = mockFn(async () => 'HOLDER');
  return { f, findOne, work };
}

describe('withMessagingProfileScope', () => {
  const previous = process.env.RLS_ENFORCE;
  beforeEach(() => {
    process.env.RLS_ENFORCE = 'true';
  });
  afterEach(() => {
    if (previous === undefined) delete process.env.RLS_ENFORCE;
    else process.env.RLS_ENFORCE = previous;
  });

  it('probes the profile read-only in system with the actor predicate inside the query', async () => {
    const { f, findOne, work } = build(null);
    await withMessagingProfileScope(
      f.em,
      user({ tenantIds: [TENANT] }),
      PROFILE,
      work,
    );
    expect(f.transactional.mock.calls[0][1]).toEqual({ readOnly: true });
    expect(f.calls[0]).toBe(SYSTEM);
    expect(findOne).toHaveBeenCalledWith(PublicProfiles, {
      id: PROFILE,
      $or: [
        { targetId: { $in: ['pp-1', 'u1'] } },
        { createdByUserId: 'u1' },
        { targetId: { $in: [TENANT] } },
      ],
    });
  });

  it('leaves out the tenant claim when the token has no tenants', async () => {
    const { f, findOne, work } = build(null);
    await withMessagingProfileScope(f.em, user(), PROFILE, work);
    expect(findOne.mock.calls[0][1].$or).toEqual([
      { targetId: { $in: ['pp-1', 'u1'] } },
      { createdByUserId: 'u1' },
    ]);
  });

  it('a profile the actor has no claim on is checked on a plain fork: nothing is opened', async () => {
    const { f, work } = build(null);
    await expect(
      withMessagingProfileScope(f.em, user(), PROFILE, work),
    ).resolves.toBe('HOLDER');
    expect(f.transactional).toHaveBeenCalledTimes(1);
    expect(work).toHaveBeenCalledWith(f.scoped);
  });

  it('a personal profile is checked read-only in system context', async () => {
    const { f, work } = build({
      targetId: 'u1',
      targetTypeConceptId: COMM.PROFILE_TARGET_USER,
    });
    await withMessagingProfileScope(f.em, user(), PROFILE, work);
    expect(f.transactional).toHaveBeenCalledTimes(2);
    expect(f.transactional.mock.calls[1][1]).toEqual({ readOnly: true });
    expect(f.calls).toEqual([SYSTEM, SYSTEM]);
    expect(work).toHaveBeenCalledWith(f.tx);
  });

  it('the showcase of a tenant in the token is checked under that tenant', async () => {
    const { f, work } = build({
      targetId: TENANT,
      targetTypeConceptId: COMM.PROFILE_TARGET_ORGANIZATION,
    });
    await withMessagingProfileScope(
      f.em,
      user({ tenantIds: [TENANT] }),
      PROFILE,
      work,
    );
    expect(f.calls.slice(1)).toEqual([
      "select set_config('app.system_context', 'false', true)",
      `select set_config('app.current_tenant_id', ?, true) <- ${TENANT}`,
    ]);
    expect(f.transactional.mock.calls[1][1]).toEqual({ readOnly: true });
    expect(work).toHaveBeenCalledWith(f.tx);
  });

  it('an organization profile whose tenant is not in the token is not widened', async () => {
    const { f, work } = build({
      targetId: TENANT,
      targetTypeConceptId: COMM.PROFILE_TARGET_ORGANIZATION,
    });
    await withMessagingProfileScope(f.em, user(), PROFILE, work);
    expect(f.transactional).toHaveBeenCalledTimes(1);
    expect(work).toHaveBeenCalledWith(f.scoped);
  });

  it('without RLS it reads on a plain fork, as before', async () => {
    process.env.RLS_ENFORCE = 'false';
    const { f, findOne, work } = build(null);
    await withMessagingProfileScope(f.em, user(), PROFILE, work);
    expect(findOne).not.toHaveBeenCalled();
    expect(f.transactional).not.toHaveBeenCalled();
    expect(work).toHaveBeenCalledWith(f.scoped);
  });
});
