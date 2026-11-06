import { randomUUID } from 'node:crypto';
import pg from 'pg';
import request from 'supertest';
import { SEED } from '../../src/common';
import { AFF_INV } from '../../src/modules/directory/affiliation-invitation.concepts';
import { bootstrapTestApp, type TestContext } from './harness';

/**
 * Revoking affiliation codes against a real Postgres: the route turns the code
 * off inside the active tenant, answers the same 404 for an unknown id and for
 * another organization's id, seals the audit trail, and (F3) every response
 * leaves the app with `Cache-Control: no-store`.
 */
const DB = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5434),
  user: process.env.DB_USER ?? 'mantra',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'mantra_redesa_health',
};

describe('POST /org/affiliation-invitations/:id/revoke (DB real)', () => {
  let ctx: TestContext;
  let db: pg.Client;
  const otherTenant = randomUUID();
  const createdIds: string[] = [];

  const http = () => request(ctx.app.getHttpServer());
  const auth = () => ({
    Authorization: `Bearer ${ctx.adminToken}`,
    'X-Tenant-Id': SEED.tenantId,
  });
  const status = async (id: string): Promise<string> =>
    (
      await db.query<{ status_concept_id: string }>(
        'select status_concept_id from directory.affiliation_invitations where id = $1',
        [id],
      )
    ).rows[0].status_concept_id;

  async function issueCode(): Promise<{ id: string; code: string }> {
    const res = await http()
      .post('/org/affiliation-invitations')
      .set(auth())
      .send({ kind: 'SUPPORT_STAFF', maxUses: 3, expiresInDays: 7 })
      .expect(201);
    const body = res.body as { id: string; code: string };
    createdIds.push(body.id);
    return body;
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    db = new pg.Client(DB);
    await db.connect();
    const any = AFF_INV.STATUS_ACTIVE;
    await db.query(
      `insert into directory.tenants
         (id, code, tenant_type_concept_id, legal_name, legal_entity_type_concept_id,
          status_concept_id, verification_status_concept_id, created_at, updated_at)
       values ($1, $2, $3, $2, $3, $3, $3, now(), now())`,
      [otherTenant, `rev-${otherTenant.slice(0, 8)}`, any],
    );
  });

  afterAll(async () => {
    await db.query(
      'delete from directory.affiliation_invitations where id = any($1::uuid[]) or tenant_id = $2',
      [createdIds, otherTenant],
    );
    await db.query('delete from directory.tenants where id = $1', [
      otherTenant,
    ]);
    await db.end();
    await ctx.app.close();
  });

  it('turns the code off, is idempotent, hides the plain code and seals the audit trail', async () => {
    const { id } = await issueCode();
    expect(await status(id)).toBe(AFF_INV.STATUS_ACTIVE);

    const first = await http()
      .post(`/org/affiliation-invitations/${id}/revoke`)
      .set(auth())
      .expect(200);
    expect(first.body).toMatchObject({ id, status: 'REVOKED', usesCount: 0 });
    expect(first.body).not.toHaveProperty('code');
    expect(first.headers['cache-control']).toBe('no-store');
    expect(await status(id)).toBe(AFF_INV.STATUS_REVOKED);

    await http()
      .post(`/org/affiliation-invitations/${id}/revoke`)
      .set(auth())
      .expect(200);

    const list = await http()
      .get('/org/affiliation-invitations')
      .set(auth())
      .expect(200);
    const listed = (
      list.body as { items: { id: string; status: string }[] }
    ).items.find((item) => item.id === id);
    expect(listed?.status).toBe('REVOKED');

    const { rows } = await db.query<{ action: string; entity: string }>(
      `select action, entity from audit.audit_log
        where entity_id = $1 and action = 'AFFILIATION_INVITATION_REVOKED'`,
      [id],
    );
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows[0].entity).toBe('affiliation_invitation');
  });

  it('answers the same 404 for an unknown id and for another organization code, and leaves the latter active', async () => {
    const foreign = randomUUID();
    await db.query(
      `insert into directory.affiliation_invitations
         (id, tenant_id, kind_concept_id, token_hash, max_uses, uses_count, expires_at,
          status_concept_id, created_by_user_id, created_at, updated_at)
       values ($1, $2, $3, $4, 1, 0, now() + interval '1 day', $5, $6, now(), now())`,
      [
        foreign,
        otherTenant,
        AFF_INV.KIND_SUPPORT_STAFF,
        `hash-${foreign}`,
        AFF_INV.STATUS_ACTIVE,
        ctx.adminUserId,
      ],
    );

    const unknown = await http()
      .post(`/org/affiliation-invitations/${randomUUID()}/revoke`)
      .set(auth())
      .expect(404);
    const cross = await http()
      .post(`/org/affiliation-invitations/${foreign}/revoke`)
      .set(auth())
      .expect(404);

    // Only the per-request fields (correlation id, echoed path, timestamp) may differ.
    const strip = (body: Record<string, unknown>) => {
      const { correlationId, path, timestamp, ...rest } = body;
      void correlationId;
      void path;
      void timestamp;
      return rest;
    };
    expect(strip(cross.body as Record<string, unknown>)).toEqual(
      strip(unknown.body as Record<string, unknown>),
    );
    expect(await status(foreign)).toBe(AFF_INV.STATUS_ACTIVE);
  });

  it('rejects a malformed id with 400 and sends no-store on errors too', async () => {
    const res = await http()
      .post('/org/affiliation-invitations/not-a-uuid/revoke')
      .set(auth())
      .expect(400);
    expect(res.headers['cache-control']).toBe('no-store');
  });
});
