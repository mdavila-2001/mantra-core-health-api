import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { MikroORM, EntityManager } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import * as surveyEntities from '../../src/modules/surveys/entities';
import { AppointmentBookings } from '../../src/modules/scheduling/entities/appointment_bookings.entity';
import { BookableSlots } from '../../src/modules/scheduling/entities/bookable_slots.entity';
import { SchedulableResources } from '../../src/modules/scheduling/entities/schedulable_resources.entity';
import { PractitionerServiceOfferings } from '../../src/modules/scheduling/entities/practitioner_service_offerings.entity';
import { ServiceCatalog } from '../../src/modules/billing/entities/service_catalog.entity';
import { Practices } from '../../src/modules/practice/entities/practices.entity';
import {
  EncounterLocations,
  EncounterParticipants,
  Encounters,
} from '../../src/modules/clinical/entities';
import {
  AssignmentsRepository,
  InvitationsRepository,
  ResponsesRepository,
  TargetsRepository,
  TemplatesRepository,
  StandardTemplatesRepository,
} from '../../src/modules/surveys/repositories';
import {
  SurveysAssignmentsService,
  SurveysResponsesService,
  SurveysServiceAssignmentsService,
  SurveysSystemTemplatesService,
  ServiceSurveyOwnership,
  StandardSurveyMaterializer,
} from '../../src/modules/surveys/services';
import { systemSurveyIds } from '../../src/modules/surveys/services/surveys-system-templates.service';
import { SURVEYS } from '../../src/modules/surveys/surveys.concepts';
import { SCHED } from '../../src/modules/scheduling/domain/scheduling.concepts';
import {
  SchedulingBookingsRepository,
  SchedulingCatalogRepository,
} from '../../src/modules/scheduling/infrastructure/repositories';
import { BookingAccess } from '../../src/modules/scheduling/application/bookings/support/booking-access';
import { BookingTransitionRecorder } from '../../src/modules/scheduling/application/bookings/support/booking-transition-recorder';
import { ServiceSlotLifecycle } from '../../src/modules/scheduling/application/bookings/support/service-slot-lifecycle';
import { ClinicalAppointmentSync } from '../../src/modules/scheduling/application/bookings/support/clinical-appointment-sync';
import { StartAppointmentUseCase } from '../../src/modules/scheduling/application/bookings/use-cases/start-appointment.use-case';
import { CompleteAppointmentUseCase } from '../../src/modules/scheduling/application/bookings/use-cases/complete-appointment.use-case';
import { CompleteLinkedBookingUseCase } from '../../src/modules/scheduling/application/bookings/use-cases/complete-linked-booking.use-case';
import { SurveysBookingCompletedAdapter } from '../../src/modules/scheduling/infrastructure/adapters/surveys-booking-completed.adapter';
import { SchedulingEncounterClosedAdapter } from '../../src/modules/clinical/adapters/scheduling-encounter-closed.adapter';
import { EncountersRepository } from '../../src/modules/clinical/repositories';
import { EncountersService } from '../../src/modules/clinical/services/encounters.service';
import { EncounterCloseService } from '../../src/modules/clinical/services/encounter-close.service';
import { CLIN } from '../../src/modules/clinical/clinical.concepts';
import { CEXT } from '../../src/modules/clinical_ext/clinical_ext.concepts';
import { VirtualEncounters } from '../../src/modules/clinical_ext/entities/virtual_encounters.entity';
import { VirtualEncountersRepository } from '../../src/modules/clinical_ext/repositories/virtual-encounters.repository';
import { VirtualEncountersService } from '../../src/modules/clinical_ext/services/virtual-encounters.service';
import {
  CONCEPTS,
  runWithTenant,
  type AuthenticatedUser,
} from '../../src/common';

/**
 * Encuesta estandarizada por servicio (v4.2.91) y cierre de la consulta que
 * completa el turno, contra PostgreSQL real con el DDL de `database/SQL`
 * (módulos 05, 08, 14, 17, 41 y 65, más el patch v4.2.91 con su índice único y
 * su disparador).
 *
 * No levanta Nest: arma los servicios y casos de uso reales sobre un
 * `EntityManager` por llamada y mira la base con SQL crudo. Lo que prueba y un
 * mock no puede:
 *   - `PUT /surveys/service-assignments/:serviceId` persiste la plantilla
 *     importada y su asignación; repetido o en paralelo no duplica; reemplazar
 *     deja UNA activa, y la base rechaza una segunda
 *     (`uq_survey_assignments_active_service_owner`);
 *   - la invitación de una reserva de ese servicio lleva la encuesta importada
 *     (no la base de servicio), en el tenant de la reserva aunque quien cerró
 *     tenga otro activo, y el paciente la ve;
 *   - cerrar el encuentro clínico (`EncountersService.close` real) completa el
 *     turno por los casos de uso de la agenda, que emiten la encuesta.
 *
 * Dobles, y sólo de lo que no es el tema: la autorización clínica
 * (`assertCanWriteHistory`), el sello y el aviso del cierre, el historial de
 * transiciones de agenda y la sincronía con `clinical.appointments`.
 *
 * Requiere `SURVEYS_IT_DB_URL` (base **desechable**: el nombre debe contener
 * `test`, `it`, `ci`, `tmp`, `scratch`, `disposable` o `smoke`). Recrea los
 * esquemas `surveys`, `scheduling`, `billing`, `practice`, `profiles`,
 * `clinical` e `integrity`; no aplica las FK entre esquemas.
 */
const DB_URL = process.env.SURVEYS_IT_DB_URL;
const root = process.cwd();

const silent = {
  setContext() {},
  info() {},
  warn() {},
  error() {},
  debug() {},
} as never;

const TENANT = randomUUID();
const SESSION_TENANT = randomUUID();
const DOCTOR = randomUUID();
const PATIENT = randomUUID();
const ANY = randomUUID(); // concepto cualquiera: no hay FK entre esquemas

const doctor = {
  id: randomUUID(),
  roles: ['PRACTITIONER'],
  practitionerProfileId: DOCTOR,
} as AuthenticatedUser;
const patient = {
  id: randomUUID(),
  roles: ['PATIENT'],
  patientProfileId: PATIENT,
} as AuthenticatedUser;

describe('Encuesta por servicio y cierre de la consulta (integración real)', () => {
  let client: pg.Client;
  let orm: MikroORM;
  const sql = (text: string, values: unknown[] = []) =>
    client.query(text, values);
  const rows = async (text: string, values: unknown[] = []) =>
    (await sql(text, values)).rows;
  const inTenant = <T>(fn: () => Promise<T>, tenant = TENANT) =>
    runWithTenant(tenant, fn);

  const ids = {
    resource: randomUUID(),
    practice: randomUUID(),
    catalog: randomUUID(),
    offering: randomUUID(),
  };

  /** Servicios reales sobre un `EntityManager` nuevo: lo que ve un request. */
  function services(em: EntityManager = orm.em.fork()) {
    const templatesRepo = new TemplatesRepository();
    const assignmentsRepo = new AssignmentsRepository();
    const invitationsRepo = new InvitationsRepository();
    const targetsRepo = new TargetsRepository();
    const system = new SurveysSystemTemplatesService(
      em,
      templatesRepo,
      assignmentsRepo,
      silent,
    );
    const assignments = new SurveysAssignmentsService(
      em,
      assignmentsRepo,
      invitationsRepo,
      templatesRepo,
      silent,
      system,
      targetsRepo,
    );
    const standardRepo = new StandardTemplatesRepository();
    return {
      byService: new SurveysServiceAssignmentsService(
        em,
        templatesRepo,
        assignmentsRepo,
        new ServiceSurveyOwnership(assignmentsRepo, standardRepo, targetsRepo),
        new StandardSurveyMaterializer(em, templatesRepo, standardRepo, silent),
        silent,
      ),
      assignments,
      responses: new SurveysResponsesService(
        em,
        invitationsRepo,
        new ResponsesRepository(),
        templatesRepo,
        silent,
      ),
    };
  }

  /**
   * El cierre del encuentro real, con su puerto hacia la agenda real: el
   * adaptador de `clinical`, el caso de uso de agenda y los de iniciar y
   * completar, que avisan a `surveys` por `BOOKING_COMPLETED_PORT`.
   */
  function encounters(em: EntityManager = orm.em.fork()) {
    const bookingsRepo = new SchedulingBookingsRepository();
    const catalogRepo = new SchedulingCatalogRepository();
    const access = new BookingAccess(
      bookingsRepo,
      catalogRepo,
      {} as never,
      {} as never,
    );
    const transitions = new BookingTransitionRecorder({
      append: async () => undefined,
    } as never);
    const clinicalSync = new ClinicalAppointmentSync({
      updateStatus: async () => undefined,
    } as never);
    const slots = new ServiceSlotLifecycle(
      bookingsRepo,
      {} as never,
      catalogRepo,
    );
    const complete = new CompleteAppointmentUseCase(
      em,
      access,
      transitions,
      slots,
      clinicalSync,
      new SurveysBookingCompletedAdapter(services(em).assignments, em, silent),
      silent,
    );
    const start = new StartAppointmentUseCase(
      em,
      access,
      transitions,
      clinicalSync,
      silent,
    );
    const linked = new CompleteLinkedBookingUseCase(
      em,
      start,
      complete,
      silent,
    );
    const port = new SchedulingEncounterClosedAdapter(
      { get: () => linked } as never,
      em,
      silent,
    );
    const encountersRepo = new EncountersRepository();
    const close = new EncountersService(
      em,
      encountersRepo,
      {} as never,
      { encounterClosed: async () => ({ suppressed: false }) } as never,
      { computeHash: async () => 'a'.repeat(64) } as never,
      silent,
      { assertCanWriteHistory: async () => undefined } as never,
      {} as never,
      {} as never,
      bookingsRepo,
    );
    // La ruta `POST /clinical/encounters/:id/close` pasa por acá.
    // Con el puerto a mano, para el fin de la teleconsulta.
    return Object.assign(
      new EncounterCloseService(em, close, encountersRepo, port),
      { port },
    );
  }

  /** El fin real de la teleconsulta, con el mismo puerto hacia la agenda. */
  function teleconsultations(em: EntityManager = orm.em.fork()) {
    return new VirtualEncountersService(
      em,
      new VirtualEncountersRepository(),
      new EncountersRepository(),
      silent,
      encounters(em).port,
    );
  }

  /** Una reserva del médico (de servicio o consulta) en el estado indicado. */
  async function insertBooking(
    opts: {
      status?: string;
      service?: boolean;
      appointmentId?: string;
    } = {},
  ): Promise<string> {
    const slot = randomUUID();
    const booking = randomUUID();
    await sql(
      `INSERT INTO scheduling.bookable_slots (id, resource_id, start_at, end_at, capacity,
         remaining_capacity, status_concept_id, created_at, updated_at)
       VALUES ($1, $2, now(), now() + interval '30 minutes', 1, 0, $3, now(), now())`,
      [slot, ids.resource, ANY],
    );
    const service = opts.service ?? true;
    await sql(
      `INSERT INTO scheduling.appointment_bookings (id, tenant_id, patient_profile_id, bookable_slot_id,
         resource_id, booking_channel_concept_id, status_concept_id, practitioner_service_offering_id,
         service_snapshot, appointment_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now(), now())`,
      [
        booking,
        TENANT,
        PATIENT,
        slot,
        ids.resource,
        ANY,
        opts.status ?? SCHED.BOOKING_COMPLETED,
        service ? ids.offering : null,
        service
          ? JSON.stringify({
              offeringId: ids.offering,
              serviceCatalogId: ids.catalog,
            })
          : null,
        opts.appointmentId ?? null,
      ],
    );
    return booking;
  }

  /** Un encuentro en curso atado a una cita clínica. */
  async function insertEncounter(appointmentId: string): Promise<string> {
    const encounter = randomUUID();
    await sql(
      `INSERT INTO clinical.encounters (id, patient_profile_id, tenant_id, status_concept_id,
         appointment_id, primary_practitioner_id, start_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, now(), now(), now())`,
      [
        encounter,
        PATIENT,
        TENANT,
        CLIN.ENCOUNTER_IN_PROGRESS,
        appointmentId,
        DOCTOR,
      ],
    );
    return encounter;
  }

  const bookingStatus = async (booking: string) =>
    (
      await rows(
        'SELECT status_concept_id FROM scheduling.appointment_bookings WHERE id = $1',
        [booking],
      )
    )[0].status_concept_id;
  const invitationsOf = (booking: string) =>
    rows(
      `SELECT i.id, i.tenant_id, i.survey_version_id, i.extension_survey_version_id,
                t.standard_catalog_code
           FROM surveys.survey_invitations i
           JOIN surveys.survey_versions v ON v.id = i.survey_version_id
           JOIN surveys.survey_templates t ON t.id = v.survey_template_id
          WHERE i.appointment_booking_id = $1`,
      [booking],
    );

  beforeAll(async () => {
    // Fail loudly instead of skipping: a silent skip would read as green.
    if (!DB_URL) {
      throw new Error(
        'SURVEYS_IT_DB_URL no está definida: esta prueba necesita una base PostgreSQL desechable',
      );
    }
    const name = new URL(DB_URL).pathname.replace(/^\//, '');
    if (
      !/(^|[_-])(test|it|ci|tmp|scratch|disposable|smoke)([_-]|$)/i.test(name)
    ) {
      throw new Error(
        `SURVEYS_IT_DB_URL apunta a «${name}»: la prueba recrea esquemas y sólo corre contra una base desechable`,
      );
    }
    client = new pg.Client({ connectionString: DB_URL });
    await client.connect();
    await sql(
      'DROP SCHEMA IF EXISTS surveys, scheduling, billing, practice, profiles, clinical, clinical_ext, integrity CASCADE',
    );
    // El disparador del patch v4.2.91 vive en `integrity`.
    await sql('CREATE SCHEMA integrity');
    for (const file of [
      '00_shared/00_types.sql',
      '05_profiles/01_schema.sql',
      '05_profiles/02_tables.sql',
      '08_clinical/01_schema.sql',
      '08_clinical/02_tables.sql',
      '18_clinical_ext/01_schema.sql',
      '18_clinical_ext/02_tables.sql',
      '14_practice/01_schema.sql',
      '14_practice/02_tables.sql',
      '17_billing/01_schema.sql',
      '17_billing/02_tables.sql',
      '41_scheduling/01_schema.sql',
      '41_scheduling/02_tables.sql',
      '65_surveys/01_schema.sql',
      '65_surveys/02_tables.sql',
      '65_surveys/03_fk_intra.sql',
      '65_surveys/04_indexes.sql',
      '65_surveys/05_constraints.sql',
    ]) {
      await sql(readFileSync(join(root, 'database/SQL', file), 'utf8'));
    }
    // El patch, sin su FK hacia `profiles` (no se carga ese módulo completo).
    const patch = readFileSync(
      join(
        root,
        'database/SQL/patches/2026-11-06_v4291_surveys_encuesta_por_servicio.sql',
      ),
      'utf8',
    ).replace(/-- -+ B\. FK[\s\S]*?END \$\$;/, '');
    await sql(patch);

    await sql(
      `INSERT INTO scheduling.schedulable_resources (id, tenant_id, resource_type_concept_id,
         resource_ref_type, resource_ref_id, name, state_concept_id, created_at, updated_at)
       VALUES ($1, $2, $3, 'practitioner_profiles', $4, 'Consultorio', $3, now(), now())`,
      [ids.resource, TENANT, ANY, DOCTOR],
    );
    await sql(
      `INSERT INTO practice.practices (id, tenant_id, code, name, type_concept_id, admin_user_id,
         status_concept_id, created_at, updated_at)
       VALUES ($1, $2, 'P-1', 'Práctica', $3, $4, $3, now(), now())`,
      [ids.practice, TENANT, ANY, randomUUID()],
    );
    await sql(
      `INSERT INTO billing.service_catalog (id, practice_id, code, name, default_price, is_active,
         created_at, updated_at)
       VALUES ($1, $2, 'IMG-01', 'Ecografía abdominal', 100, true, now(), now())`,
      [ids.catalog, ids.practice],
    );
    await sql(
      `INSERT INTO scheduling.practitioner_service_offerings (id, practitioner_profile_id,
         service_catalog_id, min_duration_minutes, max_duration_minutes, is_patient_bookable,
         requires_approval, status_concept_id, created_at, updated_at)
       VALUES ($1, $2, $3, 15, 30, true, false, $4, now(), now())`,
      [ids.offering, DOCTOR, ids.catalog, SCHED.OFFERING_ACTIVE],
    );

    orm = await MikroORM.init({
      clientUrl: DB_URL,
      entities: [
        ...Object.values(surveyEntities),
        AppointmentBookings,
        BookableSlots,
        SchedulableResources,
        PractitionerServiceOfferings,
        ServiceCatalog,
        Practices,
        Encounters,
        EncounterParticipants,
        EncounterLocations,
        VirtualEncounters,
      ],
      metadataProvider: TsMorphMetadataProvider,
      metadataCache: { enabled: false },
      allowGlobalContext: true,
    });
  });

  afterAll(async () => {
    await orm?.close(true);
    await client?.end();
  });

  it('el patch v4.2.91 quedó aplicado (índice único de una activa por servicio)', async () => {
    const idx = await rows(
      `SELECT indexname FROM pg_indexes
          WHERE schemaname = 'surveys' AND indexname = 'uq_survey_assignments_active_service_owner'`,
    );
    expect(idx).toHaveLength(1);
  });

  it('un paciente sin invitaciones recibe [] (también una cuenta de paciente sin perfil en el token)', async () => {
    expect(
      await inTenant(() => services().responses.listMyInvitations(patient)),
    ).toEqual([]);
    expect(
      await inTenant(() =>
        services().responses.listMyInvitations({
          id: randomUUID(),
          roles: ['PATIENT'],
        } as AuthenticatedUser),
      ),
    ).toEqual([]);
  });

  describe('encuestas por servicio', () => {
    let firstAssignment: string;

    it('GET lista el servicio sin encuesta; PUT importa del catálogo, persiste y se relee', async () => {
      const before = await inTenant(() =>
        services().byService.listServiceAssignments(doctor),
      );
      expect(before.consultation).toMatchObject({
        system: true,
        replaceable: false,
      });
      expect(before.consultation.questions).toHaveLength(12);
      expect(before.consultation.questions.map((q) => q.position)).toEqual(
        Array.from({ length: 12 }, (_, i) => i + 1),
      );
      expect(before.services).toEqual([
        {
          serviceId: ids.catalog,
          serviceName: 'Ecografía abdominal',
          // Derivado en el servidor del nombre del servicio.
          serviceKind: 'IMAGING',
          assignment: null,
        },
      ]);

      const row = await inTenant(() =>
        services().byService.importServiceSurvey(
          ids.catalog,
          { catalogCode: 'STD_IMAGING_V1' },
          doctor,
        ),
      );
      firstAssignment = row.assignment!.assignmentId;

      const [db] = await rows(
        `SELECT a.active, a.owner_practitioner_id, t.standard_catalog_code,
                  t.owner_practitioner_id AS template_owner, v.publication_status_concept_id
             FROM surveys.survey_assignments a
             JOIN surveys.survey_versions v ON v.id = a.survey_version_id
             JOIN surveys.survey_templates t ON t.id = v.survey_template_id
            WHERE a.id = $1`,
        [firstAssignment],
      );
      expect(db).toMatchObject({
        active: true,
        owner_practitioner_id: DOCTOR,
        standard_catalog_code: 'STD_IMAGING_V1',
        template_owner: DOCTOR,
        publication_status_concept_id: SURVEYS.VERSION_PUBLISHED,
      });
      const [questions] = await rows(
        `SELECT count(*)::int AS n, bool_or(required) AS any_required
             FROM surveys.survey_questions WHERE survey_version_id = $1`,
        [row.assignment!.versionId],
      );
      expect(questions.n).toBeGreaterThan(0);
      expect(questions.any_required).toBe(false);

      const after = await inTenant(() =>
        services().byService.listServiceAssignments(doctor),
      );
      expect(after.services[0].assignment).toMatchObject({
        assignmentId: firstAssignment,
        catalogCode: 'STD_IMAGING_V1',
      });
    });

    it('repetir el PUT, también en paralelo, no duplica plantilla ni asignación', async () => {
      const results = await Promise.all(
        [1, 2].map(() =>
          inTenant(() =>
            services().byService.importServiceSurvey(
              ids.catalog,
              { catalogCode: 'STD_IMAGING_V1' },
              doctor,
            ),
          ),
        ),
      );
      for (const r of results) {
        expect(r.assignment!.assignmentId).toBe(firstAssignment);
      }
      const [templates] = await rows(
        `SELECT count(*)::int AS n FROM surveys.survey_templates
            WHERE standard_catalog_code = 'STD_IMAGING_V1'`,
      );
      expect(templates.n).toBe(1);
    });

    it('cambiar de plantilla deja UNA activa, y la base rechaza reactivar la anterior', async () => {
      const row = await inTenant(() =>
        services().byService.importServiceSurvey(
          ids.catalog,
          { catalogCode: 'STD_LAB_V1' },
          doctor,
        ),
      );
      expect(row.assignment!.catalogCode).toBe('STD_LAB_V1');
      const active = await rows(
        'SELECT id FROM surveys.survey_assignments WHERE target_id = $1 AND active',
        [ids.catalog],
      );
      expect(active.map((r) => r.id)).toEqual([row.assignment!.assignmentId]);

      await expect(
        sql(
          'UPDATE surveys.survey_assignments SET active = true WHERE id = $1',
          [firstAssignment],
        ),
      ).rejects.toThrow(/uq_survey_assignments_active_service_owner/);
    });

    it('cerrar desde otra organización activa: la invitación sale en la de la reserva, con la importada, y el paciente la ve', async () => {
      const booking = await insertBooking();
      const res = await inTenant(
        () => services().assignments.issueForCompletedBooking(booking, doctor),
        SESSION_TENANT,
      );
      expect(res.ids).toHaveLength(1);
      expect(await invitationsOf(booking)).toEqual([
        expect.objectContaining({
          tenant_id: TENANT,
          extension_survey_version_id: null,
          standard_catalog_code: 'STD_LAB_V1',
        }),
      ]);

      const again = await inTenant(
        () => services().assignments.issueForCompletedBooking(booking, doctor),
        SESSION_TENANT,
      );
      expect(again).toEqual({ ids: [], alreadyIssued: 1 });

      const mine = await inTenant(() =>
        services().responses.listMyInvitations(patient),
      );
      expect(mine).toHaveLength(1);
      expect(mine[0]).toMatchObject({ serviceName: 'Ecografía abdominal' });
    });

    it('un servicio que el médico no ofrece responde 403', async () => {
      const other = {
        ...doctor,
        practitionerProfileId: randomUUID(),
      } as AuthenticatedUser;
      await expect(
        inTenant(() =>
          services().byService.importServiceSurvey(
            ids.catalog,
            { catalogCode: 'STD_LAB_V1' },
            other,
          ),
        ),
      ).rejects.toMatchObject({ status: 403 });
    });
  });

  describe('cerrar el encuentro completa el turno y emite la encuesta', () => {
    it('un turno en curso: cerrar el encuentro lo completa y el paciente ve la invitación', async () => {
      const appointmentId = randomUUID();
      const booking = await insertBooking({
        status: SCHED.BOOKING_IN_PROGRESS,
        appointmentId,
      });
      const encounter = await insertEncounter(appointmentId);
      const before = (
        await inTenant(() => services().responses.listMyInvitations(patient))
      ).length;

      const closed = await inTenant(() =>
        encounters().close(encounter, {}, doctor),
      );

      expect(closed.status).toBe(CLIN.ENCOUNTER_FINISHED);
      expect(await bookingStatus(booking)).toBe(SCHED.BOOKING_COMPLETED);
      expect(await invitationsOf(booking)).toHaveLength(1);
      const mine = await inTenant(() =>
        services().responses.listMyInvitations(patient),
      );
      expect(mine).toHaveLength(before + 1);
    });

    it('un turno confirmado (sin iniciar) de consulta pasa por «en curso» y queda completado con la base de consulta', async () => {
      const appointmentId = randomUUID();
      const booking = await insertBooking({
        status: CONCEPTS.BOOKING_CONFIRMED,
        service: false,
        appointmentId,
      });
      const encounter = await insertEncounter(appointmentId);

      await inTenant(() => encounters().close(encounter, {}, doctor));

      expect(await bookingStatus(booking)).toBe(SCHED.BOOKING_COMPLETED);
      expect(await invitationsOf(booking)).toEqual([
        expect.objectContaining({
          survey_version_id: systemSurveyIds(TENANT, 'CONSULTATION').versionId,
        }),
      ]);
    });

    it('un turno cancelado no se completa ni recibe encuesta, y el encuentro igual se cierra', async () => {
      const appointmentId = randomUUID();
      const booking = await insertBooking({
        status: CONCEPTS.BOOKING_CANCELLED,
        appointmentId,
      });
      const encounter = await insertEncounter(appointmentId);

      const closed = await inTenant(() =>
        encounters().close(encounter, {}, doctor),
      );

      expect(closed.status).toBe(CLIN.ENCOUNTER_FINISHED);
      expect(await bookingStatus(booking)).toBe(CONCEPTS.BOOKING_CANCELLED);
      expect(await invitationsOf(booking)).toEqual([]);
    });

    it('si quien cierra no opera esa agenda, el turno queda como estaba pero el encuentro se cierra', async () => {
      const appointmentId = randomUUID();
      const booking = await insertBooking({
        status: SCHED.BOOKING_IN_PROGRESS,
        appointmentId,
      });
      const encounter = await insertEncounter(appointmentId);
      const colleague = {
        id: randomUUID(),
        roles: ['PRACTITIONER'],
        practitionerProfileId: randomUUID(),
      } as AuthenticatedUser;

      const closed = await inTenant(() =>
        encounters().close(encounter, {}, colleague),
      );

      expect(closed.status).toBe(CLIN.ENCOUNTER_FINISHED);
      expect(await bookingStatus(booking)).toBe(SCHED.BOOKING_IN_PROGRESS);
      expect(await invitationsOf(booking)).toEqual([]);
    });
  });

  describe('teleconsulta: terminar la videollamada no completa el turno con el encuentro abierto', () => {
    it('con el encuentro en curso el turno sigue en curso; al cerrarlo, se completa y sale la encuesta', async () => {
      const appointmentId = randomUUID();
      const booking = await insertBooking({
        status: SCHED.BOOKING_IN_PROGRESS,
        appointmentId,
      });
      const encounter = await insertEncounter(appointmentId);

      const session = randomUUID();
      await sql(
        `INSERT INTO clinical_ext.virtual_encounters (id, encounter_id, status_concept_id,
             created_at, updated_at)
           VALUES ($1, $2, $3, now(), now())`,
        [session, encounter, CEXT.VIRTUAL_ENCOUNTER_IN_PROGRESS],
      );

      await inTenant(() =>
        teleconsultations().end(
          session,
          {},
          { ...doctor, tenantIds: [TENANT] },
        ),
      );
      expect(await bookingStatus(booking)).toBe(SCHED.BOOKING_IN_PROGRESS);
      expect(await invitationsOf(booking)).toEqual([]);

      await inTenant(() => encounters().close(encounter, {}, doctor));
      expect(await bookingStatus(booking)).toBe(SCHED.BOOKING_COMPLETED);
      expect(await invitationsOf(booking)).toHaveLength(1);
    });
  });

  describe('quitar la encuesta del servicio', () => {
    it('DELETE la desactiva y la próxima reserva recibe la base de servicio del sistema', async () => {
      await inTenant(() =>
        services().byService.removeServiceSurvey(ids.catalog, doctor),
      );
      const after = await inTenant(() =>
        services().byService.listServiceAssignments(doctor),
      );
      expect(after.services[0].assignment).toBeNull();

      const booking = await insertBooking();
      await inTenant(() =>
        services().assignments.issueForCompletedBooking(booking, doctor),
      );
      expect(await invitationsOf(booking)).toEqual([
        expect.objectContaining({
          survey_version_id: systemSurveyIds(TENANT, 'SERVICE').versionId,
        }),
      ]);
    });
  });

  // Con `RLS_ENFORCE=true` la petición entera es UNA transacción, como rol
  // `mantra_app` (sin BYPASSRLS) y con `app.current_tenant_id` fijado
  // (`TenantContextInterceptor`). Se reproduce eso con el parche real de RLS
  // (`2026-08-05_tenant_rls.sql`) y `SET LOCAL ROLE`.
  describe('con RLS forzado y el rol de ejecución (mantra_app)', () => {
    beforeAll(async () => {
      await sql(
        readFileSync(
          join(root, 'database/SQL/patches/2026-08-05_tenant_rls.sql'),
          'utf8',
        ),
      );
    });

    /** Una petición con RLS: transacción, rol de ejecución y tenant fijados. */
    async function asRuntime<T>(
      tenant: string,
      fn: (em: EntityManager) => Promise<T>,
    ): Promise<T> {
      return orm.em.fork().transactional(async (tx) => {
        await tx.execute('SET LOCAL ROLE mantra_app');
        await tx.execute(
          "select set_config('app.system_context', 'false', true)",
        );
        await tx.execute(
          "select set_config('app.current_tenant_id', ?, true)",
          [tenant],
        );
        return runWithTenant(tenant, () => fn(tx));
      });
    }

    it('la política está forzada sobre las tablas de la emisión', async () => {
      const forced = await rows(
        `SELECT relname FROM pg_class
            WHERE relforcerowsecurity
              AND relname IN ('appointment_bookings', 'survey_invitations', 'encounters')`,
      );
      expect(forced.map((r) => r.relname).sort()).toEqual([
        'appointment_bookings',
        'encounters',
        'survey_invitations',
      ]);
    });

    it('cerrar el encuentro en la organización de la reserva completa el turno y emite, y el paciente la ve', async () => {
      const appointmentId = randomUUID();
      const booking = await insertBooking({
        status: SCHED.BOOKING_IN_PROGRESS,
        appointmentId,
      });
      const encounter = await insertEncounter(appointmentId);

      const closed = await asRuntime(TENANT, (em) =>
        encounters(em).close(encounter, {}, doctor),
      );

      expect(closed.status).toBe(CLIN.ENCOUNTER_FINISHED);
      expect(await bookingStatus(booking)).toBe(SCHED.BOOKING_COMPLETED);
      const issued = await invitationsOf(booking);
      expect(issued).toHaveLength(1);
      expect(issued[0].tenant_id).toBe(TENANT);
      const mine = await asRuntime(TENANT, (em) =>
        services(em).responses.listMyInvitations(patient),
      );
      expect(mine.map((i) => i.id)).toContain(issued[0].id);
    });

    it('negativo: desde otra organización la reserva no se ve, no se emite nada y el paciente de allá no ve nada', async () => {
      const booking = await insertBooking();

      await expect(
        asRuntime(SESSION_TENANT, (em) =>
          services(em).assignments.issueForCompletedBooking(booking, doctor),
        ),
      ).rejects.toMatchObject({ status: 404 });
      expect(await invitationsOf(booking)).toEqual([]);

      const there = await asRuntime(SESSION_TENANT, (em) =>
        services(em).responses.listMyInvitations(patient),
      );
      expect(there).toEqual([]);
    });

    it('si la agenda rechaza al que cerró, el savepoint se descarta y el cierre se confirma igual', async () => {
      const appointmentId = randomUUID();
      const booking = await insertBooking({
        status: SCHED.BOOKING_IN_PROGRESS,
        appointmentId,
      });
      const encounter = await insertEncounter(appointmentId);
      const colleague = {
        id: randomUUID(),
        roles: ['PRACTITIONER'],
        practitionerProfileId: randomUUID(),
      } as AuthenticatedUser;

      const closed = await asRuntime(TENANT, (em) =>
        encounters(em).close(encounter, {}, colleague),
      );

      expect(closed.status).toBe(CLIN.ENCOUNTER_FINISHED);
      const [row] = await rows(
        'SELECT status_concept_id FROM clinical.encounters WHERE id = $1',
        [encounter],
      );
      expect(row.status_concept_id).toBe(CLIN.ENCOUNTER_FINISHED);
      expect(await bookingStatus(booking)).toBe(SCHED.BOOKING_IN_PROGRESS);
      expect(await invitationsOf(booking)).toEqual([]);
    });
  });
});
