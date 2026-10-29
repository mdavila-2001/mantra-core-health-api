import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bearer,
  bootstrapTestApp,
  ensureTestSession,
  type TestContext,
} from './harness';
import { CONCEPTS, TokenService } from '../../src/common';
import { COMM } from '../../src/modules/community/community.concepts';
import { PHARM } from '../../src/modules/pharmacy/pharmacy.concepts';

/**
 * P34 · farmacias abiertas 24 h y de turno, por HTTP real contra PostgreSQL.
 *
 * Se levanta la aplicación completa (`bootstrapTestApp`: JWT, `RolesGuard`,
 * `PharmacyTenantScopeGuard`, contexto de tenant, auditoría) y se pega a:
 *
 * - `PUT /pharmacies/:id/sites/:siteId/open-24h`;
 * - `POST /pharmacies/:id/sites/:siteId/on-call-shifts` y su cancelación;
 * - `GET /pharmacies/:id/opening-hours`;
 * - `GET /public/pharmacies/open-now`, **sin sesión**.
 *
 * Lo que sólo la base puede probar: el EXCLUDE de solape
 * (`ex_pharmacy_on_call_shifts_site_overlap`), el CHECK de 72 h y que la lectura
 * pública filtre por `starts_at <= now < ends_at` en la consulta. Un turno
 * vencido se escribe directo en la base (la API no lo acepta) para comprobar que
 * no se publica.
 *
 * Datos: sólo sintéticos, marcados `P34-<sufijo>`, creados y retirados por la
 * prueba. Los conceptos de tipo que no son de este módulo se copian de una fila
 * existente de la misma tabla (son FKs de catálogo, no significado de la prueba).
 * Queda historial en `audit.*` (WORM), como en el resto de las suites HTTP.
 */
describe('P34 · farmacias 24 h y de turno · HTTP real', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());
  const sufijo = randomUUID().slice(0, 8);
  const mark = `P34-${sufijo}`;

  const sql = <T = Record<string, unknown>>(
    text: string,
    params: unknown[] = [],
  ): Promise<T[]> =>
    ctx.orm.em.fork().getConnection().execute<T[]>(text, params);

  interface Farmacia {
    tenantId: string;
    pharmacyId: string;
    siteId: string;
    slug: string;
    token: string;
  }

  const creados: Farmacia[] = [];
  const extras: { practiceIds: string[]; practiceSiteIds: string[] } = {
    practiceIds: [],
    practiceSiteIds: [],
  };

  async function tokenDe(roles: string[], tenants: string[]): Promise<string> {
    const sid = `p34-${randomUUID()}`;
    await ensureTestSession(ctx.orm, ctx.adminUserId, sid);
    return ctx.app
      .get(TokenService)
      .signAccessToken(ctx.adminUserId, sid, roles, tenants);
  }

  /** Una farmacia publicada (activa, verificada, perfil público visible) con una sede. */
  async function crearFarmacia(etiqueta: string): Promise<Farmacia> {
    const tenantId = randomUUID();
    const practiceId = randomUUID();
    const practiceSiteId = randomUUID();
    const addressId = randomUUID();
    const profileId = randomUUID();
    const pharmacyId = randomUUID();
    const siteId = randomUUID();
    const slug = `p34-${etiqueta}-${sufijo}`;

    await sql(
      `insert into directory.tenants (id, code, tenant_type_concept_id, legal_name,
              legal_entity_type_concept_id, status_concept_id, verification_status_concept_id,
              created_at, updated_at)
       select ?, ?, tenant_type_concept_id, ?, legal_entity_type_concept_id,
              status_concept_id, verification_status_concept_id, now(), now()
         from directory.tenants limit 1`,
      [tenantId, `${mark}-${etiqueta}`, `Farmacia ${mark} ${etiqueta}`],
    );
    await sql(
      `insert into practice.practices (id, tenant_id, code, name, type_concept_id,
              admin_user_id, status_concept_id, created_at, updated_at)
       select ?, ?, ?, ?, type_concept_id, ?, status_concept_id, now(), now()
         from practice.practices limit 1`,
      [
        practiceId,
        tenantId,
        `${mark}-${etiqueta}`,
        `Práctica ${mark}`,
        ctx.adminUserId,
      ],
    );
    await sql(
      `insert into common.addresses (id, owner_type_concept_id, owner_id, country_concept_id,
              lines, city, latitude, longitude, created_at, updated_at)
       select ?, owner_type_concept_id, ?, country_concept_id,
              'Calle sintética 1', 'Ciudad P34 ${sufijo}', -16.5, -68.15, now(), now()
         from common.addresses limit 1`,
      [addressId, practiceSiteId],
    );
    await sql(
      `insert into practice.practice_sites (id, tenant_id, practice_id, code, name, site_type_concept_id,
              time_zone, address_id, status_concept_id, created_at, updated_at)
       select ?, ?, ?, ?, ?, site_type_concept_id, 'America/La_Paz', ?, status_concept_id, now(), now()
         from practice.practice_sites limit 1`,
      [
        practiceSiteId,
        tenantId,
        practiceId,
        `${mark}-${etiqueta}`,
        'Sede',
        addressId,
      ],
    );
    await sql(
      `insert into community.public_profiles (id, tenant_id, target_type_concept_id, target_id,
              slug, display_name, visibility_concept_id, status_concept_id, created_at, updated_at)
       select ?, ?, target_type_concept_id, ?, ?, ?, ?, ?, now(), now()
         from community.public_profiles limit 1`,
      [
        profileId,
        tenantId,
        tenantId,
        slug,
        `Farmacia ${mark} ${etiqueta}`,
        COMM.PROFILE_VISIBILITY_PUBLIC,
        CONCEPTS.STATE_ACTIVE,
      ],
    );
    await sql(
      `insert into pharmacy.pharmacies (id, tenant_id, code, legal_name, trade_name,
              public_profile_id, verification_status_concept_id, status_concept_id,
              created_at, updated_at)
       values (?, ?, ?, ?, ?, ?, ?, ?, now(), now())`,
      [
        pharmacyId,
        tenantId,
        `${mark}-${etiqueta}`,
        `Farmacia ${mark} ${etiqueta} S.R.L.`,
        `Farmacia ${mark} ${etiqueta}`,
        profileId,
        PHARM.VERIFICATION_VERIFIED,
        PHARM.PHARMACY_ACTIVE,
      ],
    );
    await sql(
      `insert into pharmacy.pharmacy_sites (id, pharmacy_id, practice_site_id, code, name,
              status_concept_id, created_at, updated_at)
       values (?, ?, ?, ?, ?, ?, now(), now())`,
      [
        siteId,
        pharmacyId,
        practiceSiteId,
        `${mark}-${etiqueta}`,
        `Sede ${etiqueta}`,
        PHARM.SITE_ACTIVE,
      ],
    );
    extras.practiceIds.push(practiceId);
    extras.practiceSiteIds.push(practiceSiteId);
    const farmacia: Farmacia = {
      tenantId,
      pharmacyId,
      siteId,
      slug,
      token: await tokenDe(['PHARMACY_STAFF'], [tenantId]),
    };
    creados.push(farmacia);
    return farmacia;
  }

  const como = (f: Farmacia) => ({
    ...bearer(f.token),
    'X-Tenant-Id': f.tenantId,
  });

  /** Un turno que empezó hace una hora y termina en `horas` horas. */
  const vigente = (horas = 6) => ({
    startsAt: new Date(Date.now() - 3_600_000).toISOString(),
    endsAt: new Date(Date.now() + horas * 3_600_000).toISOString(),
  });

  const ciudad = `Ciudad P34 ${sufijo}`;
  const abiertas = (query: Record<string, string> = {}) =>
    http()
      .get('/public/pharmacies/open-now')
      .query({ city: ciudad, ...query });

  let a: Farmacia;
  let b: Farmacia;

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    a = await crearFarmacia('a');
    b = await crearFarmacia('b');
  });

  afterAll(async () => {
    const limpiar = (text: string, params: unknown[] = []) =>
      sql(text, params).catch(() => undefined);
    for (const f of creados) {
      await limpiar(
        `delete from pharmacy.pharmacy_on_call_shifts where pharmacy_site_id = ?`,
        [f.siteId],
      );
      await limpiar(`delete from pharmacy.pharmacy_sites where id = ?`, [
        f.siteId,
      ]);
      await limpiar(`delete from pharmacy.pharmacies where id = ?`, [
        f.pharmacyId,
      ]);
      await limpiar(
        `delete from community.public_profiles where tenant_id = ?`,
        [f.tenantId],
      );
    }
    for (const id of extras.practiceSiteIds) {
      await limpiar(`delete from practice.practice_sites where id = ?`, [id]);
      await limpiar(`delete from common.addresses where owner_id = ?`, [id]);
    }
    for (const id of extras.practiceIds) {
      await limpiar(`delete from practice.practices where id = ?`, [id]);
    }
    for (const f of creados) {
      await limpiar(`delete from directory.tenants where id = ?`, [f.tenantId]);
    }
    await ctx.app.close();
  });

  it('sin nada declarado, open-now no inventa farmacias abiertas', async () => {
    const res = await abiertas().expect(200);
    expect(res.body.items).toEqual([]);
    expect(res.body.timeZone).toBe('America/La_Paz');
    expect(res.body.asOfLocal).toMatch(/-04:00$/);
  });

  it('autorización: sin token 401, paciente 403, personal de otra farmacia 403', async () => {
    const ruta = `/pharmacies/${a.pharmacyId}/sites/${a.siteId}/open-24h`;
    await http().put(ruta).send({ open24h: true }).expect(401);
    const paciente = await tokenDe(['PATIENT'], [a.tenantId]);
    await http()
      .put(ruta)
      .set({ ...bearer(paciente), 'X-Tenant-Id': a.tenantId })
      .send({ open24h: true })
      .expect(403);
    await http().put(ruta).set(como(b)).send({ open24h: true }).expect(403);
    await http()
      .post(`/pharmacies/${a.pharmacyId}/sites/${a.siteId}/on-call-shifts`)
      .set(como(b))
      .send(vigente())
      .expect(403);
    // Nada quedó escrito por los intentos rechazados.
    const [fila] = await sql<{ open_24h: boolean | null }>(
      `select open_24h from pharmacy.pharmacy_sites where id = ?`,
      [a.siteId],
    );
    expect(fila.open_24h).toBeNull();
  });

  it('la sede de otra farmacia, pedida desde la propia ruta, es 404 como una inexistente', async () => {
    const ajena = await http()
      .put(`/pharmacies/${a.pharmacyId}/sites/${b.siteId}/open-24h`)
      .set(como(a))
      .send({ open24h: true })
      .expect(404);
    const inexistente = await http()
      .put(`/pharmacies/${a.pharmacyId}/sites/${randomUUID()}/open-24h`)
      .set(como(a))
      .send({ open24h: true })
      .expect(404);
    expect(ajena.body.reason).toBe(inexistente.body.reason);
  });

  it('24 h: se declara, persiste, se publica, y null la retira', async () => {
    const put = await http()
      .put(`/pharmacies/${a.pharmacyId}/sites/${a.siteId}/open-24h`)
      .set(como(a))
      .send({ open24h: true })
      .expect(200);
    expect(put.body).toMatchObject({ siteId: a.siteId, open24h: true });

    const [fila] = await sql<{ open_24h: boolean | null }>(
      `select open_24h from pharmacy.pharmacy_sites where id = ?`,
      [a.siteId],
    );
    expect(fila.open_24h).toBe(true);

    const publica = await abiertas({ mode: '24h' }).expect(200);
    expect(publica.body.items).toHaveLength(1);
    expect(publica.body.items[0]).toMatchObject({
      siteId: a.siteId,
      pharmacySlug: a.slug,
      open24h: true,
      onCall: null,
      timeZone: 'America/La_Paz',
    });

    await http()
      .put(`/pharmacies/${a.pharmacyId}/sites/${a.siteId}/open-24h`)
      .set(como(a))
      .send({ open24h: null })
      .expect(200);
    const [despues] = await sql<{ open_24h: boolean | null }>(
      `select open_24h from pharmacy.pharmacy_sites where id = ?`,
      [a.siteId],
    );
    expect(despues.open_24h).toBeNull();
    expect((await abiertas().expect(200)).body.items).toEqual([]);
  });

  it('un cuerpo sin open24h es 400 (vacío no es «no»)', async () => {
    await http()
      .put(`/pharmacies/${a.pharmacyId}/sites/${a.siteId}/open-24h`)
      .set(como(a))
      .send({})
      .expect(400);
  });

  it('turno: se registra, se publica con su fin en hora de Bolivia, y la recarga lo trae', async () => {
    const alta = await http()
      .post(`/pharmacies/${b.pharmacyId}/sites/${b.siteId}/on-call-shifts`)
      .set(como(b))
      .send(vigente(6))
      .expect(201);
    expect(alta.body).toMatchObject({
      siteId: b.siteId,
      source: 'PHARMACY',
      status: 'ACTIVE',
      current: true,
      timeZone: 'America/La_Paz',
    });
    expect(alta.body.endsAtLocal).toMatch(/-04:00$/);

    const [fila] = await sql<{ status_concept_id: string; source: string }>(
      `select status_concept_id, source_concept_id as source
         from pharmacy.pharmacy_on_call_shifts where id = ?`,
      [alta.body.id],
    );
    expect(fila).toEqual({
      status_concept_id: PHARM.ON_CALL_SHIFT_ACTIVE,
      source: PHARM.ON_CALL_SOURCE_PHARMACY,
    });

    const recarga = await http()
      .get(`/pharmacies/${b.pharmacyId}/opening-hours`)
      .set(como(b))
      .expect(200);
    expect(recarga.body.sites[0].shifts.map((s: any) => s.id)).toEqual([
      alta.body.id,
    ]);

    const publica = await abiertas({ mode: 'on-call' }).expect(200);
    expect(publica.body.items.map((i: any) => i.siteId)).toEqual([b.siteId]);
    expect(publica.body.items[0].onCall).toMatchObject({
      endsAt: alta.body.endsAt,
      source: 'PHARMACY',
    });
  });

  it('dos turnos activos solapados de la misma sede: 409', async () => {
    const res = await http()
      .post(`/pharmacies/${b.pharmacyId}/sites/${b.siteId}/on-call-shifts`)
      .set(como(b))
      .send(vigente(2))
      .expect(409);
    expect(res.body.reason).toBe('ON_CALL_SHIFT_OVERLAP');
  });

  it('la base rechaza el solape aunque no se pase por la API (EXCLUDE) y un turno > 72 h (CHECK)', async () => {
    await expect(
      sql(
        `insert into pharmacy.pharmacy_on_call_shifts (id, pharmacy_site_id, starts_at, ends_at,
                source_concept_id, status_concept_id, created_at, updated_at)
         values (?, ?, now(), now() + interval '1 hour', ?, ?, now(), now())`,
        [
          randomUUID(),
          b.siteId,
          PHARM.ON_CALL_SOURCE_PHARMACY,
          PHARM.ON_CALL_SHIFT_ACTIVE,
        ],
      ),
    ).rejects.toThrow(/ex_pharmacy_on_call_shifts_site_overlap/);
    await expect(
      sql(
        `insert into pharmacy.pharmacy_on_call_shifts (id, pharmacy_site_id, starts_at, ends_at,
                source_concept_id, status_concept_id, created_at, updated_at)
         values (?, ?, now() + interval '10 days', now() + interval '14 days', ?, ?, now(), now())`,
        [
          randomUUID(),
          a.siteId,
          PHARM.ON_CALL_SOURCE_PHARMACY,
          PHARM.ON_CALL_SHIFT_ACTIVE,
        ],
      ),
    ).rejects.toThrow(/ck_pharmacy_on_call_shifts_window/);
  });

  it('turno vencido: la API no lo acepta y, escrito directo en la base, no se publica', async () => {
    const res = await http()
      .post(`/pharmacies/${a.pharmacyId}/sites/${a.siteId}/on-call-shifts`)
      .set(como(a))
      .send({
        startsAt: new Date(Date.now() - 10 * 3_600_000).toISOString(),
        endsAt: new Date(Date.now() - 3_600_000).toISOString(),
      })
      .expect(422);
    expect(res.body.reason).toBe('ON_CALL_SHIFT_WINDOW_INVALID');

    await sql(
      `insert into pharmacy.pharmacy_on_call_shifts (id, pharmacy_site_id, starts_at, ends_at,
              source_concept_id, status_concept_id, created_at, updated_at)
       values (?, ?, now() - interval '10 hours', now() - interval '1 hour', ?, ?, now(), now())`,
      [
        randomUUID(),
        a.siteId,
        PHARM.ON_CALL_SOURCE_PHARMACY,
        PHARM.ON_CALL_SHIFT_ACTIVE,
      ],
    );
    const publica = await abiertas().expect(200);
    expect(publica.body.items.map((i: any) => i.siteId)).not.toContain(
      a.siteId,
    );
  });

  it('una hora sin desplazamiento es 400', async () => {
    await http()
      .post(`/pharmacies/${a.pharmacyId}/sites/${a.siteId}/on-call-shifts`)
      .set(como(a))
      .send({ startsAt: '2026-12-01T20:00:00', endsAt: '2026-12-02T08:00:00' })
      .expect(400);
  });

  it('cancelar: deja de publicarse y no se puede cancelar dos veces', async () => {
    const recarga = await http()
      .get(`/pharmacies/${b.pharmacyId}/opening-hours`)
      .set(como(b))
      .expect(200);
    const shiftId = recarga.body.sites[0].shifts[0].id as string;
    // La farmacia A no puede cancelar el turno de B ni desde su propia ruta.
    await http()
      .post(`/pharmacies/${a.pharmacyId}/on-call-shifts/${shiftId}/cancel`)
      .set(como(a))
      .expect(404);
    const cancelado = await http()
      .post(`/pharmacies/${b.pharmacyId}/on-call-shifts/${shiftId}/cancel`)
      .set(como(b))
      .expect(200);
    expect(cancelado.body.status).toBe('CANCELLED');
    await http()
      .post(`/pharmacies/${b.pharmacyId}/on-call-shifts/${shiftId}/cancel`)
      .set(como(b))
      .expect(422);
    expect(
      (await abiertas({ mode: 'on-call' }).expect(200)).body.items,
    ).toEqual([]);
  });

  it('open-now pagina con cursor y valida sus parámetros', async () => {
    for (const f of [a, b]) {
      await http()
        .put(`/pharmacies/${f.pharmacyId}/sites/${f.siteId}/open-24h`)
        .set(como(f))
        .send({ open24h: true })
        .expect(200);
    }
    const primera = await abiertas({ limit: '1' }).expect(200);
    expect(primera.body.items).toHaveLength(1);
    expect(primera.body.nextCursor).toEqual(expect.any(String));
    const segunda = await abiertas({
      limit: '1',
      cursor: primera.body.nextCursor,
    }).expect(200);
    expect(segunda.body.items).toHaveLength(1);
    expect(segunda.body.nextCursor).toBeNull();
    expect(segunda.body.items[0].siteId).not.toBe(primera.body.items[0].siteId);

    await abiertas({ mode: 'todas' }).expect(400);
    await abiertas({ lat: '-16.5' }).expect(400);
    await abiertas({ cursor: 'no-es-un-cursor' }).expect(400);
  });

  it('GET /pharmacy/sites trae open24h y onCallUntil', async () => {
    const res = await http()
      .get('/pharmacy/sites')
      .query({ openNow: 'true' })
      .set(como(a))
      .expect(200);
    const propia = res.body.items.find((i: any) => i.siteId === a.siteId);
    expect(propia).toMatchObject({ open24h: true, onCallUntil: null });
  });
});
