import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomBytes, randomUUID } from 'node:crypto';
import pg from 'pg';
import { MikroORM } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { ForbiddenException } from '@nestjs/common';
import * as schedulingEntities from '../../src/modules/scheduling/entities';
import {
  SchedulingBookingsRepository,
  SchedulingCatalogRepository,
} from '../../src/modules/scheduling/infrastructure/repositories';
import { createBookingsService } from '../../src/modules/scheduling/application/bookings/scheduling-bookings.testing';
import {
  CONCEPTS,
  runWithTenant,
  type AuthenticatedUser,
} from '../../src/common';

/**
 * SEG V-1 / S1-A4 · quién actúa sobre una cita se decide en la organización de
 * la cita, contra PostgreSQL real con el DDL canónico de `scheduling`.
 *
 * Arma la fachada de reservas real (`createBookingsService`) con los
 * **repositorios reales** de agenda sobre un `EntityManager` de MikroORM y deja
 * como dobles sólo lo ajeno a la decisión (historial, avisos, clínica, seguros,
 * facturación, representación). Lo que prueba y un mock del repositorio no puede:
 *   - `FOR UPDATE` de la cita y la lectura del recurso dueño de la agenda con
 *     las columnas reales (`resource_ref_id`, `resource_ref_type`, `tenant_id`);
 *   - que un profesional rechazado NO deja rastro: la cita sigue confirmada, el
 *     cupo intacto y sin fila en `booking_cancellations`;
 *   - que quien sí puede cancelar escribe de verdad (estado, cupo, cancelación);
 *   - que el listado por paciente de un profesional sale de la base ya acotado
 *     a su agenda.
 *
 * No toca la base configurada: con la misma conexión que usa el arnés
 * (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`) crea una base NUEVA de nombre
 * aleatorio (`mantra_it_actor_<hex>`), aplica ahí el DDL de `scheduling` y
 * `profiles` (el listado lee el nombre del paciente; sin las FK entre esquemas)
 * y la borra al terminar. Si el servidor no responde, la prueba falla: no se
 * omite.
 */
const root = process.cwd();
const PG = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5434),
  user: process.env.DB_USER ?? 'mantra',
  password: process.env.DB_PASSWORD,
};
const DB_NAME = `mantra_it_actor_${randomBytes(5).toString('hex')}`;

const TENANT_A = randomUUID();
const TENANT_B = randomUUID();
const HP_DOCTOR = randomUUID(); // perfil profesional del médico que actúa
const HP_COLLEAGUE = randomUUID(); // perfil profesional del colega
const PAT_OTHER = randomUUID(); // paciente ajeno a ambos
const PAT_DOCTOR = randomUUID(); // el propio médico como paciente
const ANY = randomUUID();
const RES_OWN = randomUUID();
const RES_COLLEAGUE = randomUUID();

const silent = {
  setContext() {},
  info() {},
  warn() {},
  error() {},
  debug() {},
} as never;

const actorOf = (over: Partial<AuthenticatedUser>): AuthenticatedUser =>
  ({ id: randomUUID(), roles: [], tenantIds: [TENANT_A], ...over }) as never;

/** Médico que atiende en A (rol con ámbito de A y perfil profesional). */
const doctorInA = actorOf({
  roles: ['PRACTITIONER'],
  scopedRoles: { [TENANT_A]: ['PRACTITIONER'] },
  practitionerProfileId: HP_DOCTOR,
  patientProfileId: PAT_DOCTOR,
});
/** Mostrador de A. */
const deskOfA = actorOf({
  roles: ['SCHEDULING_AGENT'],
  scopedRoles: { [TENANT_A]: ['SCHEDULING_AGENT'] },
});
/** Mostrador de B con cuenta de paciente, actuando en A. */
const deskOfB = actorOf({
  roles: ['PATIENT', 'SCHEDULING_AGENT'],
  scopedRoles: { [TENANT_B]: ['SCHEDULING_AGENT'] },
  patientProfileId: randomUUID(),
  tenantIds: [TENANT_A, TENANT_B],
});

describe('Actor por organización en la agenda (integración real)', () => {
  let admin: pg.Client;
  let client: pg.Client;
  let orm: MikroORM;

  const sql = (text: string, values: unknown[] = []) =>
    client.query(text, values);
  const rows = async (text: string, values: unknown[] = []) =>
    (await sql(text, values)).rows;

  /** Dobles de lo ajeno a la decisión; los repositorios de agenda son los reales. */
  function facade() {
    const fn = (impl?: unknown) => {
      const calls: unknown[][] = [];
      const wrapped = (...args: unknown[]) => {
        calls.push(args);
        return typeof impl === 'function'
          ? (impl as (...a: unknown[]) => unknown)(...args)
          : impl;
      };
      return Object.assign(wrapped, { calls });
    };
    const empty = () => fn(Promise.resolve(new Map()));
    const noPatients = new Set<string>();
    const em = orm.em.fork();
    const deniedByRepresentation = (patientId: string) => {
      throw new ForbiddenException(
        `No cuenta con autorización de tutoría sobre ${patientId}`,
      );
    };
    const representation = {
      assertMayActForPatient: fn(deniedByRepresentation),
      representsPatient: fn(Promise.resolve(false)),
      findActiveProxiedPatientIds: fn(Promise.resolve(noPatients)),
    };
    return createBookingsService({
      em: em as never,
      bookingsRepo: new SchedulingBookingsRepository() as never,
      catalogRepo: new SchedulingCatalogRepository() as never,
      historyRepo: {
        append: fn(Promise.resolve(undefined)),
        latestBySource: empty(),
      } as never,
      appointmentsRepo: { findTypesByIds: empty() } as never,
      noticeRepo: { describeBooking: fn(Promise.resolve(null)) } as never,
      notices: { emit: fn(Promise.resolve({ delivered: true })) } as never,
      logger: silent as never,
      affiliations: { evaluate: fn(Promise.resolve('sin-vinculos')) } as never,
      professionalTime: {} as never,
      coverageRepo: { findActiveCarriersByPatients: empty() } as never,
      waitlist: {
        promoteWaitlist: fn(Promise.resolve({ processed: 0 })),
      } as never,
      encountersRepo: {
        findLatestIdsByAppointmentIds: empty(),
        findIdsByAppointmentIds: empty(),
      } as never,
      claimReadRepo: {
        findSummariesByEncounterIds: fn(Promise.resolve([])),
      } as never,
      representation: representation as never,
      formOrigin: {} as never,
      serviceAgenda: {
        reopen: fn(Promise.resolve(0)),
        reopenSpan: fn(Promise.resolve(0)),
        retract: fn(Promise.resolve(0)),
        offeringOfSlot: fn(Promise.resolve(null)),
      } as never,
    });
  }

  /** Una cita confirmada en A, en la agenda indicada, a tres días. */
  async function insertBooking(resource: string, patient: string) {
    const slot = randomUUID();
    const booking = randomUUID();
    await sql(
      `INSERT INTO scheduling.bookable_slots (id, resource_id, start_at, end_at, capacity,
         remaining_capacity, status_concept_id, created_at, updated_at)
       VALUES ($1, $2, now() + interval '3 days', now() + interval '3 days 30 minutes', 1, 0, $3, now(), now())`,
      [slot, resource, CONCEPTS.SLOT_BOOKED],
    );
    await sql(
      `INSERT INTO scheduling.appointment_bookings (id, tenant_id, patient_profile_id, bookable_slot_id,
         resource_id, booking_channel_concept_id, status_concept_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, now(), now())`,
      [
        booking,
        TENANT_A,
        patient,
        slot,
        resource,
        ANY,
        CONCEPTS.BOOKING_CONFIRMED,
      ],
    );
    return { booking, slot };
  }

  const state = async (booking: string, slot: string) => ({
    status: (
      await rows(
        'SELECT status_concept_id FROM scheduling.appointment_bookings WHERE id = $1',
        [booking],
      )
    )[0].status_concept_id as string,
    remaining: (
      await rows(
        'SELECT remaining_capacity FROM scheduling.bookable_slots WHERE id = $1',
        [slot],
      )
    )[0].remaining_capacity as number,
    cancellations: Number(
      (
        await rows(
          'SELECT count(*) AS n FROM scheduling.booking_cancellations WHERE booking_id = $1',
          [booking],
        )
      )[0].n,
    ),
  });

  const cancelDto = {
    cancelledBy: 'PROVIDER',
    reasonText: 'Reprogramación por indisposición',
  } as never;
  const inA = <T>(fn: () => Promise<T>) => runWithTenant(TENANT_A, fn);

  beforeAll(async () => {
    // Base nueva y descartable: se rechaza reutilizar una que ya exista.
    admin = new pg.Client({ ...PG, database: 'postgres' });
    await admin.connect();
    const exists = await admin.query(
      'select 1 from pg_database where datname = $1',
      [DB_NAME],
    );
    if (exists.rowCount) {
      throw new Error(`La base ${DB_NAME} ya existe: se rechaza reutilizarla`);
    }
    await admin.query(`CREATE DATABASE "${DB_NAME}"`);
    client = new pg.Client({ ...PG, database: DB_NAME });
    await client.connect();
    for (const file of [
      '00_shared/00_types.sql',
      '05_profiles/01_schema.sql',
      '05_profiles/02_tables.sql',
      '41_scheduling/01_schema.sql',
      '41_scheduling/02_tables.sql',
    ]) {
      await sql(readFileSync(join(root, 'database/SQL', file), 'utf8'));
    }
    for (const [resource, owner] of [
      [RES_OWN, HP_DOCTOR],
      [RES_COLLEAGUE, HP_COLLEAGUE],
    ]) {
      await sql(
        `INSERT INTO scheduling.schedulable_resources (id, tenant_id, resource_type_concept_id,
           resource_ref_type, resource_ref_id, name, state_concept_id, created_at, updated_at)
         VALUES ($1, $2, $3, 'practitioner_profiles', $4, 'Consultorio', $3, now(), now())`,
        [resource, TENANT_A, ANY, owner],
      );
    }
    orm = await MikroORM.init({
      ...PG,
      dbName: DB_NAME,
      entities: Object.values(schedulingEntities).filter(
        (value) => typeof value === 'function',
      ),
      metadataProvider: TsMorphMetadataProvider,
      metadataCache: { enabled: false },
      allowGlobalContext: true,
    });
  });

  afterAll(async () => {
    await orm?.close(true);
    await client?.end();
    if (admin) {
      // El pool cierra sus sockets de forma asíncrona: se espera por condición a
      // que no quede ninguna conexión de esta base antes de tirarla.
      for (let i = 0; i < 100; i += 1) {
        const open = await admin.query(
          'select count(*)::int as n from pg_stat_activity where datname = $1 and pid <> pg_backend_pid()',
          [DB_NAME],
        );
        if (open.rows[0].n === 0) break;
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      await admin.query(`DROP DATABASE IF EXISTS "${DB_NAME}"`);
      await admin.end();
    }
  });

  it('un profesional no cancela la cita de un paciente ajeno en la agenda de un colega, y no deja rastro', async () => {
    const { booking, slot } = await insertBooking(RES_COLLEAGUE, PAT_OTHER);

    await expect(
      inA(() => facade().cancel(booking, cancelDto, doctorInA)),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(await state(booking, slot)).toEqual({
      status: CONCEPTS.BOOKING_CONFIRMED,
      remaining: 0,
      cancellations: 0,
    });
  });

  it('el mostrador de otra organización no cancela la cita de esta, y no deja rastro', async () => {
    const { booking, slot } = await insertBooking(RES_COLLEAGUE, PAT_OTHER);

    await expect(
      inA(() => facade().cancel(booking, cancelDto, deskOfB)),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(await state(booking, slot)).toEqual({
      status: CONCEPTS.BOOKING_CONFIRMED,
      remaining: 0,
      cancellations: 0,
    });
  });

  it('el mostrador de esta organización cancela: estado, cupo y cancelación quedan escritos', async () => {
    const { booking, slot } = await insertBooking(RES_COLLEAGUE, PAT_OTHER);

    await inA(() => facade().cancel(booking, cancelDto, deskOfA));

    expect(await state(booking, slot)).toEqual({
      status: CONCEPTS.BOOKING_CANCELLED,
      remaining: 1,
      cancellations: 1,
    });
  });

  it('el profesional cancela la cita de su propia agenda', async () => {
    const { booking, slot } = await insertBooking(RES_OWN, PAT_OTHER);

    await inA(() => facade().cancel(booking, cancelDto, doctorInA));

    expect(await state(booking, slot)).toMatchObject({
      status: CONCEPTS.BOOKING_CANCELLED,
      cancellations: 1,
    });
  });

  it('el profesional cancela la cita donde él es el paciente, aunque sea en otra agenda', async () => {
    const { booking, slot } = await insertBooking(RES_COLLEAGUE, PAT_DOCTOR);

    await inA(() => facade().cancel(booking, cancelDto, doctorInA));

    expect(await state(booking, slot)).toMatchObject({
      status: CONCEPTS.BOOKING_CANCELLED,
    });
  });

  it('el mostrador de otra organización no inicia la cita de esta (loadForOperation con FOR UPDATE)', async () => {
    const { booking } = await insertBooking(RES_COLLEAGUE, PAT_OTHER);

    await expect(
      inA(() => facade().start(booking, deskOfB)),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('un profesional que lista por un paciente ajeno solo recibe las citas de su agenda', async () => {
    const patient = randomUUID();
    const own = await insertBooking(RES_OWN, patient);
    await insertBooking(RES_COLLEAGUE, patient);

    const res = await inA(() =>
      facade().searchBookings(
        { patientProfileId: patient, includeCancelled: false },
        50,
        doctorInA,
      ),
    );

    expect(res.items.map((item) => item.id)).toEqual([own.booking]);
  });

  it('el mostrador de esta organización lista por cualquier paciente', async () => {
    const patient = randomUUID();
    await insertBooking(RES_OWN, patient);
    await insertBooking(RES_COLLEAGUE, patient);

    const res = await inA(() =>
      facade().searchBookings(
        { patientProfileId: patient, includeCancelled: false },
        50,
        deskOfA,
      ),
    );

    expect(res.items).toHaveLength(2);
  });

  it('el mostrador de otra organización no lista por un paciente ajeno', async () => {
    const patient = randomUUID();
    await insertBooking(RES_OWN, patient);

    await expect(
      inA(() =>
        facade().searchBookings(
          { patientProfileId: patient, includeCancelled: false },
          50,
          deskOfB,
        ),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
