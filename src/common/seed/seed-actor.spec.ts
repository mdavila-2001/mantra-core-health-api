import { describe, it, expect, jest } from '@jest/globals';
import { SEED_ACTOR_ID, ensureSeedActor } from './seed-actor';
import { Users } from '../../modules/iam/entities';

function buildEm(existing: unknown) {
  return {
    findOne: jest.fn(() => Promise.resolve(existing)),
    create: jest.fn(),
    flush: jest.fn(() => Promise.resolve()),
  } as any;
}

describe('ensureSeedActor', () => {
  it('crea al actor autorreferenciado cuando falta', async () => {
    const em = buildEm(null);

    await ensureSeedActor(em);

    expect(em.create).toHaveBeenCalledTimes(1);
    const [entity, data] = em.create.mock.calls[0] as [unknown, any];
    expect(entity).toBe(Users);
    expect(data.id).toBe(SEED_ACTOR_ID);
    expect(data.createdByUserId).toBe(SEED_ACTOR_ID);
    expect(em.flush).toHaveBeenCalledTimes(1);
  });

  it('no crea credencial ni rol alguno: nadie puede entrar como el actor', async () => {
    const em = buildEm(null);

    await ensureSeedActor(em);

    const entities = em.create.mock.calls.map((call: unknown[]) => call[0]);
    expect(entities).toEqual([Users]);
  });

  it('es idempotente: si el actor existe no escribe nada', async () => {
    const em = buildEm({ id: SEED_ACTOR_ID });

    await ensureSeedActor(em);

    expect(em.create).not.toHaveBeenCalled();
    expect(em.flush).not.toHaveBeenCalled();
  });

  it('el id es el mismo que usan los demás seeds', () => {
    expect(SEED_ACTOR_ID).toMatch(/^[0-9a-f-]{36}$/);
  });
});
