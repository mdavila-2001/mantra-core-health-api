import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { MikroORM } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { generate, generateSecret } from 'otplib';
import { CONCEPTS, encryptSecret } from '../../src/common';
import { SecurityEvents } from '../../src/modules/iam/entities';
import { SecurityEventsRepository } from '../../src/modules/iam/infrastructure/repositories';
import { IamTotpService } from '../../src/modules/iam/application/services/iam-totp.service';
import { SupportLinksRepository } from '../../src/modules/delegated_access/repositories/support-links.repository';

/**
 * Dos hallazgos de seguridad contra PostgreSQL real con el DDL canónico
 * (`database/SQL`: `iam`, `terminology`, `profiles` y `scheduling`, sin las FK
 * entre esquemas):
 *
 *  1. Un código TOTP es de UN SOLO USO. `IamTotpService` guarda el último paso
 *     aceptado en `iam.security_events` y lo lee con SQL real; dos peticiones
 *     simultáneas con el mismo código —en conexiones distintas— no pasan las dos
 *     (cerrojo `pg_advisory_xact_lock` por persona).
 *  2. La agenda de apoyo lee con el tope que fija quien llama: un `LIMIT 500`
 *     escrito en la consulta cortaba sin que nadie lo supiera.
 *
 * Opt-in con `MFA_AGENDA_IT_DB_URL` y sólo contra una base **desechable** (el
 * nombre debe contener `test`, `it`, `ci`, `tmp`, `scratch`, `disposable` o
 * `smoke`): recrea los esquemas `iam`, `terminology`, `profiles` y `scheduling`.
 * Datos: sólo sintéticos.
 */
const DB_URL = process.env.MFA_AGENDA_IT_DB_URL;
const root = process.cwd();

if (!DB_URL) {
  it.todo(
    'MFA_AGENDA_IT_DB_URL no está definida: TOTP de un solo uso y tope de la agenda de apoyo contra PostgreSQL desechable',
  );
} else {
  describe('TOTP de un solo uso y tope de la agenda de apoyo (DB real)', () => {
    let client: pg.Client;
    let orm: MikroORM;
    const eventsRepo = new SecurityEventsRepository();
    const agendaRepo = new SupportLinksRepository();
    const ANY = randomUUID(); // concepto cualquiera: no hay FK entre esquemas
    const TENANT = randomUUID();
    const OTHER_TENANT = randomUUID();
    const DOCTOR = randomUUID();
    const RESOURCE = randomUUID();
    const OTHER_RESOURCE = randomUUID();
    const DAY = new Date('2026-11-02T00:00:00Z');

    const totp = () => new IamTotpService(orm.em.fork() as never, eventsRepo);
    const rows = async <T = Record<string, unknown>>(
      sql: string,
      params: unknown[] = [],
    ): Promise<T[]> => (await client.query(sql, params)).rows as T[];

    beforeAll(async () => {
      const name = new URL(DB_URL).pathname.replace(/^\//, '');
      if (
        !/(^|[_-])(test|it|ci|tmp|scratch|disposable|smoke)([_-]|$)/i.test(name)
      ) {
        throw new Error(
          `MFA_AGENDA_IT_DB_URL apunta a «${name}»: la prueba recrea esquemas y sólo corre contra una base desechable`,
        );
      }
      client = new pg.Client({ connectionString: DB_URL });
      await client.connect();
      await client.query(
        'DROP SCHEMA IF EXISTS iam, terminology, profiles, scheduling CASCADE',
      );
      for (const file of [
        '00_shared/00_types.sql',
        '01_iam/01_schema.sql',
        '01_iam/02_tables.sql',
        '03_terminology/01_schema.sql',
        '03_terminology/02_tables.sql',
        '05_profiles/01_schema.sql',
        '05_profiles/02_tables.sql',
        '41_scheduling/01_schema.sql',
        '41_scheduling/02_tables.sql',
      ]) {
        await client.query(
          readFileSync(join(root, 'database/SQL', file), 'utf8'),
        );
      }
      orm = await MikroORM.init({
        clientUrl: DB_URL,
        entities: [SecurityEvents],
        metadataProvider: TsMorphMetadataProvider,
        metadataCache: { enabled: false },
        allowGlobalContext: true,
        pool: { min: 1, max: 6 },
      });
    });

    afterAll(async () => {
      await orm?.close(true);
      await client?.end();
    });

    describe('TOTP de un solo uso', () => {
      const factorOf = (secret: string) => ({
        id: randomUUID(),
        secretEncrypted: encryptSecret(secret),
      });

      it('un código vigente vale una vez; presentado otra vez dentro de su ventana, no', async () => {
        const userId = randomUUID();
        const secret = generateSecret();
        const factor = factorOf(secret);
        const code = await generate({ secret });

        const first = await totp().consume(userId, [factor as never], code);
        const second = await totp().consume(userId, [factor as never], code);

        expect(first).toEqual({ valid: true, factorId: factor.id });
        expect(second.valid).toBe(false);
        const used = await rows<{ detail_json: Record<string, unknown> }>(
          `select detail_json from iam.security_events
            where user_id = $1 and detail_json ->> 'action' = 'code-used'`,
          [userId],
        );
        // Una sola huella: el paso de tiempo usado, nunca el código.
        expect(used).toHaveLength(1);
        expect(used[0].detail_json).toMatchObject({
          action: 'code-used',
          factorId: factor.id,
          timeStep: expect.any(Number),
        });
        expect(JSON.stringify(used[0].detail_json)).not.toContain(code);
      });

      it('dos peticiones simultáneas con el mismo código, en conexiones distintas: pasa una sola', async () => {
        const userId = randomUUID();
        const secret = generateSecret();
        const factor = factorOf(secret);
        const code = await generate({ secret });

        const results = await Promise.all(
          Array.from({ length: 4 }, () =>
            totp().consume(userId, [factor as never], code),
          ),
        );

        expect(results.filter((r) => r.valid)).toHaveLength(1);
        const [{ n }] = await rows<{ n: string }>(
          `select count(*) as n from iam.security_events
            where user_id = $1 and detail_json ->> 'action' = 'code-used'`,
          [userId],
        );
        expect(Number(n)).toBe(1);
      });

      it('un código incorrecto no vale ni deja huella; y el paso usado es de ESE factor y de ESA persona', async () => {
        const userId = randomUUID();
        const secretA = generateSecret();
        const secretB = generateSecret();
        const a = factorOf(secretA);
        const b = factorOf(secretB);

        expect(
          (await totp().consume(userId, [a as never], '000000')).valid,
        ).toBe(false);
        expect(
          (
            await totp().consume(
              randomUUID(),
              [b as never],
              await generate({ secret: secretB }),
            )
          ).valid,
        ).toBe(true);
        // El gasto de otra persona no afecta a esta.
        expect(
          (
            await totp().consume(
              userId,
              [b as never],
              await generate({ secret: secretB }),
            )
          ).valid,
        ).toBe(true);
        const [{ n }] = await rows<{ n: string }>(
          `select count(*) as n from iam.security_events
            where user_id = $1 and event_type_concept_id = $2`,
          [userId, CONCEPTS.SEC_MFA_ENROLL],
        );
        expect(Number(n)).toBe(1);
      });
    });

    describe('tope de la agenda de apoyo', () => {
      beforeAll(async () => {
        for (const [resource, tenant] of [
          [RESOURCE, TENANT],
          [OTHER_RESOURCE, OTHER_TENANT],
        ]) {
          await client.query(
            `INSERT INTO scheduling.schedulable_resources (id, tenant_id, resource_type_concept_id,
               resource_ref_type, resource_ref_id, name, state_concept_id, created_at, updated_at)
             VALUES ($1, $2, $3, 'practitioner_profiles', $4, 'Consultorio', $3, now(), now())`,
            [resource, tenant, ANY, DOCTOR],
          );
        }
        // 600 turnos del doctor en el hospital y 5 de otro hospital (mismo doctor).
        await client.query(
          `INSERT INTO scheduling.bookable_slots (id, resource_id, start_at, end_at, capacity,
             remaining_capacity, status_concept_id, created_at, updated_at)
           SELECT gen_random_uuid(), CASE WHEN n <= 600 THEN $1::uuid ELSE $2::uuid END,
                  $3::timestamptz + (n || ' minutes')::interval,
                  $3::timestamptz + (n || ' minutes')::interval + interval '1 minute',
                  1, 0, $4, now(), now()
             FROM generate_series(1, 605) n`,
          [RESOURCE, OTHER_RESOURCE, DAY, ANY],
        );
        await client.query(
          `INSERT INTO scheduling.appointment_bookings (id, tenant_id, patient_profile_id,
             bookable_slot_id, resource_id, booking_channel_concept_id, status_concept_id,
             created_at, updated_at)
           SELECT gen_random_uuid(),
                  CASE WHEN s.resource_id = $1::uuid THEN $3::uuid ELSE $4::uuid END,
                  gen_random_uuid(), s.id, s.resource_id, $2, $2, now(), now()
             FROM scheduling.bookable_slots s`,
          [RESOURCE, ANY, TENANT, OTHER_TENANT],
        );
      });

      const read = (limit: number) =>
        agendaRepo.findPractitionerAgenda(
          orm.em.fork() as never,
          TENANT,
          DOCTOR,
          DAY,
          new Date(DAY.getTime() + 31 * 24 * 3600 * 1000),
          limit,
        );

      it('lee tantas filas como pide quien llama: con el tope +1 llegan 501 de 600, no 500 cortadas sin aviso', async () => {
        const items = await read(501);
        expect(items).toHaveLength(501);
        // Por hora, de la más temprana.
        const starts = items.map((i) => i.startAt.getTime());
        expect([...starts].sort((a, b) => a - b)).toEqual(starts);
      });

      it('un tope menor corta ahí, y sin tope alcanzado devuelve todo lo del hospital (nunca el de otro)', async () => {
        expect(await read(3)).toHaveLength(3);
        expect(await read(10_000)).toHaveLength(600);
      });
    });
  });
}
