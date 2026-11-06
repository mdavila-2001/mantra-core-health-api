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
  AssignmentsRepository,
  InvitationsRepository,
  ResponsesRepository,
  TargetsRepository,
  TemplatesRepository,
} from '../../src/modules/surveys/repositories';
import {
  SurveysAssignmentsService,
  SurveysResponsesService,
  SurveysSystemTemplatesService,
  SurveysTemplatesService,
} from '../../src/modules/surveys/services';
import { systemSurveyIds } from '../../src/modules/surveys/services/surveys-system-templates.service';
import { SURVEYS } from '../../src/modules/surveys/surveys.concepts';
import {
  SYSTEM_BASE_SURVEYS,
  SYSTEM_BASE_SURVEY_VERSION,
} from '../../src/modules/surveys/surveys.base-definitions';
import { InsightsRepository } from '../../src/modules/surveys/repositories/insights.repository';
import { SurveysInsightsService } from '../../src/modules/surveys/services/surveys-insights.service';
import { SCHED } from '../../src/modules/scheduling/domain/scheduling.concepts';
import { runWithTenant, type AuthenticatedUser } from '../../src/common';

/**
 * F3 · encuesta base del sistema, emisión por reserva completada y asociación a
 * servicio, contra PostgreSQL real con el DDL canónico (`database/SQL`: módulo
 * 65 completo, más las tablas de agenda, catálogo y práctica que la emisión lee).
 *
 * No levanta Nest ni la aplicación: arma los servicios reales sobre un
 * `EntityManager` de MikroORM por cada llamada (como un request) y mira la base
 * con SQL crudo. Lo que prueba y un mock no puede:
 *   - la creación paralela de la base converge en UNA plantilla (clave primaria
 *     determinista) en vez de fallar o duplicar;
 *   - la invitación única por reserva la respalda el índice
 *     `uq_survey_invitations_booking_version` bajo concurrencia;
 *   - el CHECK `ck_survey_invitations_extension_distinct` y las columnas nuevas
 *     existen y las lee la entidad;
 *   - de punta a punta: asociar → emitir → responder → el médico lee sólo lo suyo.
 *
 * Opt-in con `SURVEYS_IT_DB_URL` (base **desechable**: el nombre debe contener
 * `test`, `it`, `ci`, `tmp`, `scratch`, `disposable` o `smoke`). Recrea los
 * esquemas `surveys`, `scheduling`, `billing`, `practice` y `profiles`; no aplica las FK
 * entre esquemas, así que no necesita el resto del modelo.
 */
const DB_URL = process.env.SURVEYS_IT_DB_URL;
const describeIfDb = DB_URL ? describe : describe.skip;
const root = process.cwd();

const silent = {
  setContext() {},
  info() {},
  warn() {},
  error() {},
  debug() {},
} as never;

const TENANT = randomUUID();
const OTHER_TENANT = randomUUID();
const DOCTOR = randomUUID(); // perfil profesional
const OTHER_DOCTOR = randomUUID();
const PATIENT = randomUUID(); // perfil de paciente
const ANY = randomUUID(); // concepto cualquiera: no hay FK entre esquemas

/**
 * La encuesta base de consulta vigente (versión 2, 29/10/2026): 12 preguntas,
 * obligatorias todas salvo la revisión de la medicación (8) y el comentario
 * final (12). Se fija acá además de leerse de la definición: si la definición
 * cambia, esta prueba tiene que cambiar a sabiendas.
 */
const BASE_CONSULTATION = SYSTEM_BASE_SURVEYS.CONSULTATION.questions;
const BASE_CONSULTATION_REQUIRED = [
  ...Array(7).fill(true),
  false,
  true,
  true,
  true,
  false,
];

const doctorActor: AuthenticatedUser = {
  id: randomUUID(),
  roles: ['PRACTITIONER'],
  practitionerProfileId: DOCTOR,
} as AuthenticatedUser;
const otherDoctorActor: AuthenticatedUser = {
  id: randomUUID(),
  roles: ['PRACTITIONER'],
  practitionerProfileId: OTHER_DOCTOR,
} as AuthenticatedUser;
const patientActor: AuthenticatedUser = {
  id: randomUUID(),
  roles: ['PATIENT'],
  patientProfileId: PATIENT,
} as AuthenticatedUser;

describeIfDb(
  'Encuesta base, emisión y asociación a servicio (integración real)',
  () => {
    let client: pg.Client;
    let orm: MikroORM;

    const sql = (text: string, values: unknown[] = []) =>
      client.query(text, values);
    const rows = async (text: string, values: unknown[] = []) =>
      (await sql(text, values)).rows;

    /** Servicios reales sobre un `EntityManager` nuevo: lo que ve un request. */
    function services(em: EntityManager = orm.em.fork()) {
      const templatesRepo = new TemplatesRepository();
      const assignmentsRepo = new AssignmentsRepository();
      const invitationsRepo = new InvitationsRepository();
      const responsesRepo = new ResponsesRepository();
      const targetsRepo = new TargetsRepository();
      const system = new SurveysSystemTemplatesService(
        em,
        templatesRepo,
        assignmentsRepo,
        silent,
      );
      return {
        system,
        templates: new SurveysTemplatesService(
          em,
          templatesRepo,
          silent,
          assignmentsRepo,
          targetsRepo,
        ),
        assignments: new SurveysAssignmentsService(
          em,
          assignmentsRepo,
          invitationsRepo,
          templatesRepo,
          silent,
          system,
          targetsRepo,
        ),
        responses: new SurveysResponsesService(
          em,
          invitationsRepo,
          responsesRepo,
          templatesRepo,
          silent,
        ),
      };
    }
    const inTenant = <T>(fn: () => Promise<T>, tenant = TENANT) =>
      runWithTenant(tenant, fn);

    // --- fixtures ------------------------------------------------------------
    const ids = {
      resource: randomUUID(),
      practice: randomUUID(),
      otherPractice: randomUUID(),
      catalog: randomUUID(),
      catalogOtherTenant: randomUUID(),
      catalogNotOffered: randomUUID(),
      offering: randomUUID(),
    };

    async function insertBooking(opts: {
      offering?: boolean;
      status?: string;
      resource?: string;
      patient?: string;
    }): Promise<string> {
      const slot = randomUUID();
      const booking = randomUUID();
      await sql(
        `INSERT INTO scheduling.bookable_slots (id, resource_id, start_at, end_at, capacity,
         remaining_capacity, status_concept_id, created_at, updated_at)
       VALUES ($1, $2, now(), now() + interval '30 minutes', 1, 0, $3, now(), now())`,
        [slot, opts.resource ?? ids.resource, ANY],
      );
      await sql(
        `INSERT INTO scheduling.appointment_bookings (id, tenant_id, patient_profile_id, bookable_slot_id,
         resource_id, booking_channel_concept_id, status_concept_id, practitioner_service_offering_id,
         service_snapshot, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now(), now())`,
        [
          booking,
          TENANT,
          opts.patient ?? PATIENT,
          slot,
          opts.resource ?? ids.resource,
          ANY,
          opts.status ?? SCHED.BOOKING_COMPLETED,
          opts.offering ? ids.offering : null,
          opts.offering
            ? JSON.stringify({
                offeringId: ids.offering,
                serviceCatalogId: ids.catalog,
              })
            : null,
        ],
      );
      return booking;
    }

    const invitationsOf = (bookingId: string) =>
      rows(
        `SELECT id, survey_version_id, extension_survey_version_id, survey_assignment_id
         FROM surveys.survey_invitations WHERE appointment_booking_id = $1`,
        [bookingId],
      );

    beforeAll(async () => {
      const name = new URL(DB_URL as string).pathname.replace(/^\//, '');
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
        'DROP SCHEMA IF EXISTS surveys, scheduling, billing, practice, profiles CASCADE',
      );
      // El DDL canónico del repositorio: sin las FK entre esquemas (90_fk_deferred).
      for (const file of [
        '00_shared/00_types.sql',
        '05_profiles/01_schema.sql',
        '05_profiles/02_tables.sql',
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

      // El médico atiende en un recurso suyo; ofrece un servicio de su práctica.
      await sql(
        `INSERT INTO scheduling.schedulable_resources (id, tenant_id, resource_type_concept_id,
         resource_ref_type, resource_ref_id, name, state_concept_id, created_at, updated_at)
       VALUES ($1, $2, $3, 'practitioner_profiles', $4, 'Consultorio', $3, now(), now())`,
        [ids.resource, TENANT, ANY, DOCTOR],
      );
      for (const [practice, tenant] of [
        [ids.practice, TENANT],
        [ids.otherPractice, OTHER_TENANT],
      ]) {
        await sql(
          `INSERT INTO practice.practices (id, tenant_id, code, name, type_concept_id, admin_user_id,
           status_concept_id, created_at, updated_at)
         VALUES ($1, $2, $3, 'Práctica', $4, $5, $4, now(), now())`,
          [practice, tenant, `P-${practice.slice(0, 6)}`, ANY, randomUUID()],
        );
      }
      for (const [catalog, practice, code] of [
        [ids.catalog, ids.practice, 'LAB-01'],
        [ids.catalogNotOffered, ids.practice, 'IMG-01'],
        [ids.catalogOtherTenant, ids.otherPractice, 'LAB-99'],
      ]) {
        await sql(
          `INSERT INTO billing.service_catalog (id, practice_id, code, name, default_price, is_active,
           created_at, updated_at)
         VALUES ($1, $2, $3, $3, 100, true, now(), now())`,
          [catalog, practice, code],
        );
      }
      await sql(
        `INSERT INTO scheduling.practitioner_service_offerings (id, practitioner_profile_id,
         service_catalog_id, min_duration_minutes, max_duration_minutes, is_patient_bookable,
         requires_approval, status_concept_id, created_at, updated_at)
       VALUES ($1, $2, $3, 15, 30, true, false, $4, now(), now())`,
        [ids.offering, DOCTOR, ids.catalog, ANY],
      );

      // Quien atiende tiene nombre visible: la bandeja del paciente lo muestra.
      await sql(
        `INSERT INTO profiles.persons (id, person_status_concept_id, display_name, created_at, updated_at)
       VALUES ($1, $2, 'Dra. Ana Pérez', now(), now())`,
        [DOCTOR, ANY],
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

    describe('la encuesta base del sistema', () => {
      it('se materializa una sola vez aunque se pida en paralelo, y repetirla no cambia nada', async () => {
        const results = await Promise.all(
          [1, 2, 3].map(() =>
            inTenant(() =>
              services().system.ensureSystemTemplate(
                TENANT,
                'CONSULTATION',
                doctorActor.id,
              ),
            ),
          ),
        );

        const expected = systemSurveyIds(TENANT, 'CONSULTATION');
        for (const r of results) {
          expect(r).toMatchObject({
            templateId: expected.templateId,
            versionId: expected.versionId,
            assignmentId: expected.assignmentId,
          });
        }
        const count = async (table: string) =>
          Number(
            (await rows(`SELECT count(*)::int AS n FROM surveys.${table}`))[0]
              .n,
          );
        expect(SYSTEM_BASE_SURVEY_VERSION).toBe(2);
        expect(BASE_CONSULTATION).toHaveLength(12);
        expect(await count('survey_templates')).toBe(1);
        expect(await count('survey_versions')).toBe(1);
        expect(await count('survey_questions')).toBe(12);
        expect(await count('survey_assignments')).toBe(1);

        await inTenant(() =>
          services().system.ensureSystemTemplate(TENANT, 'CONSULTATION'),
        );
        expect(await count('survey_questions')).toBe(12);
      });

      it('la plantilla de sistema no tiene profesional dueño y la marca su tipo; obligatorias todas salvo la medicación y el comentario', async () => {
        const [template] = await rows(
          `SELECT owner_practitioner_id, owner_type_concept_id, owner_id, tenant_id, status_concept_id
           FROM surveys.survey_templates WHERE id = $1`,
          [systemSurveyIds(TENANT, 'CONSULTATION').templateId],
        );
        expect(template).toMatchObject({
          owner_practitioner_id: null,
          owner_type_concept_id: SURVEYS.SYSTEM_BASE_CONSULTATION,
          owner_id: TENANT,
          tenant_id: TENANT,
          status_concept_id: SURVEYS.TEMPLATE_ACTIVE,
        });
        const questions = await rows(
          `SELECT position, required FROM surveys.survey_questions
          WHERE survey_version_id = $1 ORDER BY position`,
          [systemSurveyIds(TENANT, 'CONSULTATION').versionId],
        );
        expect(questions.map((q) => q.required)).toEqual(
          BASE_CONSULTATION_REQUIRED,
        );
        expect(BASE_CONSULTATION.map((q) => q.required)).toEqual(
          BASE_CONSULTATION_REQUIRED,
        );
      });

      it('la de servicio tiene 7 preguntas, todas opcionales', async () => {
        await inTenant(() =>
          services().system.ensureSystemTemplate(TENANT, 'SERVICE'),
        );
        const questions = await rows(
          `SELECT required FROM surveys.survey_questions WHERE survey_version_id = $1`,
          [systemSurveyIds(TENANT, 'SERVICE').versionId],
        );
        expect(questions).toHaveLength(7);
        expect(questions.every((q) => q.required === false)).toBe(true);
      });

      it('el médico no puede modificarla ni asignarla (403)', async () => {
        const { templateId, versionId } = systemSurveyIds(
          TENANT,
          'CONSULTATION',
        );
        const status = async (p: Promise<unknown>) =>
          p.then(
            () => 200,
            (e) => (e as { getStatus?: () => number }).getStatus?.() ?? 500,
          );
        expect(
          await status(
            inTenant(() =>
              services().templates.addQuestion(
                templateId,
                { questionText: 'x', answerType: 'TEXT' },
                doctorActor,
              ),
            ),
          ),
        ).toBe(403);
        expect(
          await status(
            inTenant(() =>
              services().assignments.createAssignment(
                { surveyVersionId: versionId, targetType: 'CARE_TYPE' },
                doctorActor,
              ),
            ),
          ),
        ).toBe(403);
      });
    });

    describe('emisión al completarse la reserva', () => {
      it('una consulta recibe UNA invitación con la base de consulta; repetir la emisión no duplica', async () => {
        const booking = await insertBooking({});

        const first = await inTenant(() =>
          services().assignments.issueForBooking(
            { appointmentBookingId: booking },
            doctorActor,
          ),
        );
        const again = await inTenant(() =>
          services().assignments.issueForBooking(
            { appointmentBookingId: booking },
            doctorActor,
          ),
        );

        expect(first.ids).toHaveLength(1);
        expect(again).toEqual({ ids: [], alreadyIssued: 1 });
        const invitations = await invitationsOf(booking);
        expect(invitations).toHaveLength(1);
        expect(invitations[0]).toMatchObject({
          survey_version_id: systemSurveyIds(TENANT, 'CONSULTATION').versionId,
          extension_survey_version_id: null,
          survey_assignment_id: systemSurveyIds(TENANT, 'CONSULTATION')
            .assignmentId,
        });
      });

      it('cinco emisiones simultáneas de la misma reserva dejan una sola invitación', async () => {
        const booking = await insertBooking({});

        await Promise.all(
          [1, 2, 3, 4, 5].map(() =>
            inTenant(() =>
              services().assignments.issueForBooking(
                { appointmentBookingId: booking },
                doctorActor,
              ),
            ),
          ),
        );

        expect(await invitationsOf(booking)).toHaveLength(1);
      });

      it('un servicio (reserva con oferta) recibe la base de servicio', async () => {
        const booking = await insertBooking({ offering: true });

        await inTenant(() =>
          services().assignments.issueForBooking(
            { appointmentBookingId: booking },
            doctorActor,
          ),
        );

        const [invitation] = await invitationsOf(booking);
        expect(invitation.survey_version_id).toBe(
          systemSurveyIds(TENANT, 'SERVICE').versionId,
        );
      });

      it('no se emite sobre una reserva que no está completada', async () => {
        const booking = await insertBooking({
          status: SCHED.BOOKING_IN_PROGRESS,
        });

        await expect(
          inTenant(() =>
            services().assignments.issueForBooking(
              { appointmentBookingId: booking },
              doctorActor,
            ),
          ),
        ).rejects.toMatchObject({ status: 422 });
        expect(await invitationsOf(booking)).toHaveLength(0);
      });
    });

    describe('la bandeja del paciente distingue las tarjetas', () => {
      const BAY_PATIENT = randomUUID();
      const bayActor = {
        id: randomUUID(),
        roles: ['PATIENT'],
        patientProfileId: BAY_PATIENT,
      } as AuthenticatedUser;

      async function issued(opts: {
        offering?: boolean;
        resource?: string;
      }): Promise<{ booking: string; invitation: string }> {
        const booking = await insertBooking({
          ...opts,
          patient: BAY_PATIENT,
        });
        const [id] = (
          await inTenant(() =>
            services().assignments.issueForBooking(
              { appointmentBookingId: booking },
              doctorActor,
            ),
          )
        ).ids;
        return { booking, invitation: id };
      }

      const slotStart = async (booking: string) =>
        new Date(
          (
            await rows(
              `SELECT s.start_at FROM scheduling.bookable_slots s
               JOIN scheduling.appointment_bookings b ON b.bookable_slot_id = s.id
              WHERE b.id = $1`,
              [booking],
            )
          )[0].start_at,
        ).toISOString();

      it('una consulta dice CONSULTATION, quién atendió y cuándo; un servicio trae además su nombre', async () => {
        const consultation = await issued({});
        const service = await issued({ offering: true });

        const list = await inTenant(() =>
          services().responses.listMyInvitations(bayActor),
        );

        const byId = new Map(list.map((i) => [i.id, i]));
        expect(byId.get(consultation.invitation)).toMatchObject({
          kind: 'CONSULTATION',
          serviceName: null,
          practitionerDisplayName: 'Dra. Ana Pérez',
          attendedAt: await slotStart(consultation.booking),
        });
        expect(byId.get(service.invitation)).toMatchObject({
          kind: 'SERVICE',
          serviceName: 'LAB-01',
          practitionerDisplayName: 'Dra. Ana Pérez',
          attendedAt: await slotStart(service.booking),
        });

        // La invitación abierta lleva lo mismo que su tarjeta.
        const opened = await inTenant(() =>
          services().responses.getMyQuestionnaire(service.invitation, bayActor),
        );
        expect(opened).toMatchObject({
          kind: 'SERVICE',
          serviceName: 'LAB-01',
          practitionerDisplayName: 'Dra. Ana Pérez',
          attendedAt: await slotStart(service.booking),
        });
      });

      it('si la reserva ya no se resuelve a un profesional, la tarjeta sigue ahí con el campo en null', async () => {
        const orphanResource = randomUUID();
        await sql(
          `INSERT INTO scheduling.schedulable_resources (id, tenant_id, resource_type_concept_id,
           resource_ref_type, resource_ref_id, name, state_concept_id, created_at, updated_at)
         VALUES ($1, $2, $3, 'rooms', $4, 'Sala', $3, now(), now())`,
          [orphanResource, TENANT, ANY, randomUUID()],
        );
        const room = await issued({});
        // Después de emitida, la reserva pasa a un recurso que no es un profesional.
        await sql(
          `UPDATE scheduling.appointment_bookings SET resource_id = $2 WHERE id = $1`,
          [room.booking, orphanResource],
        );
        await sql(
          `UPDATE scheduling.bookable_slots SET resource_id = $2
            WHERE id = (SELECT bookable_slot_id FROM scheduling.appointment_bookings WHERE id = $1)`,
          [room.booking, orphanResource],
        );

        const list = await inTenant(() =>
          services().responses.listMyInvitations(bayActor),
        );

        expect(list.find((i) => i.id === room.invitation)).toMatchObject({
          kind: 'CONSULTATION',
          practitionerDisplayName: null,
        });
      });

      it('sin N+1: la cantidad de consultas a la base no crece con las invitaciones', async () => {
        const solo = randomUUID();
        const soloActor = {
          id: randomUUID(),
          roles: ['PATIENT'],
          patientProfileId: solo,
        } as AuthenticatedUser;
        const emit = async (patient: string) => {
          const booking = await insertBooking({ patient });
          await inTenant(() =>
            services().assignments.issueForBooking(
              { appointmentBookingId: booking },
              doctorActor,
            ),
          );
        };
        const countQueries = async (actor: AuthenticatedUser) => {
          const connection = orm.em.getConnection();
          const original = connection.execute.bind(connection);
          let calls = 0;
          (connection as any).execute = (...args: unknown[]) => {
            calls += 1;
            return (original as any)(...args);
          };
          try {
            const result = await inTenant(() =>
              services().responses.listMyInvitations(actor),
            );
            return { calls, size: result.length };
          } finally {
            (connection as any).execute = original;
          }
        };

        await emit(solo);
        const one = await countQueries(soloActor);
        await emit(solo);
        await emit(solo);
        const three = await countQueries(soloActor);

        expect(one.size).toBe(1);
        expect(three.size).toBe(3);
        expect(three.calls).toBe(one.calls);
      });
    });

    // Desde el 06/11/2026 sólo se asocia y reparte lo importado del catálogo
    // estándar: la consulta recibe sólo la base del sistema y un servicio, la
    // importada o la base de servicio. Las encuestas escritas a mano ya no se
    // asocian ni se emiten, pero lo que se emitió antes con ellas (la base con
    // su extensión) sigue siendo contestable y legible: eso se prueba con
    // invitaciones anteriores escritas en la base tal como quedaron.
    describe('encuesta escrita a mano (anterior al catálogo) y del catálogo', () => {
      let template: { id: string; versionId: string };
      let catalogTemplate: { id: string; versionId: string };
      let consultationInvitation: string;
      let consultationBooking: string;
      let serviceBooking: string;

      it('crea su encuesta: las preguntas nacen opcionales aunque pida obligatorias', async () => {
        template = await inTenant(() =>
          services().templates.createTemplate(
            { title: 'Mi encuesta', responseWindowDays: 14 },
            doctorActor,
          ),
        );
        await inTenant(() =>
          services().templates.addQuestion(
            template.id,
            {
              questionText: '¿Volvería a consultarme?',
              answerType: 'BOOLEAN',
              required: true,
            },
            doctorActor,
          ),
        );
        await inTenant(() =>
          services().templates.publishVersion(template.id, 1, {}, doctorActor),
        );

        const [question] = await rows(
          `SELECT required FROM surveys.survey_questions WHERE survey_version_id = $1`,
          [template.versionId],
        );
        expect(question.required).toBe(false);
      });

      it('asociar la escrita a mano se rechaza (422, sólo del catálogo) y no deja filas', async () => {
        for (const dto of [
          { targetType: 'SERVICE' as const, targetId: ids.catalog },
          { targetType: 'CARE_TYPE' as const },
        ]) {
          await expect(
            inTenant(() =>
              services().assignments.createAssignment(
                { surveyVersionId: template.versionId, ...dto },
                doctorActor,
              ),
            ),
          ).rejects.toMatchObject({
            status: 422,
            reason: 'SURVEY_ASSIGNMENT_REQUIRES_CATALOG_TEMPLATE',
          });
        }
        const targets = await rows(
          'SELECT id FROM surveys.survey_assignments WHERE survey_version_id = $1',
          [template.versionId],
        );
        expect(targets).toEqual([]);
      });

      it('una del catálogo se asocia a un servicio que ofrece y a «todas mis consultas»', async () => {
        // Una plantilla publicada del médico que salió del catálogo estándar.
        catalogTemplate = await inTenant(() =>
          services().templates.createTemplate(
            { title: 'Encuesta de su análisis de laboratorio' },
            doctorActor,
          ),
        );
        await inTenant(() =>
          services().templates.addQuestion(
            catalogTemplate.id,
            {
              questionText: '¿Le explicaron cómo prepararse?',
              answerType: 'BOOLEAN',
            },
            doctorActor,
          ),
        );
        await inTenant(() =>
          services().templates.publishVersion(
            catalogTemplate.id,
            1,
            {},
            doctorActor,
          ),
        );
        await sql(
          `UPDATE surveys.survey_templates SET standard_catalog_code = 'STD_LAB_V1' WHERE id = $1`,
          [catalogTemplate.id],
        );

        await inTenant(() =>
          services().assignments.createAssignment(
            {
              surveyVersionId: catalogTemplate.versionId,
              targetType: 'SERVICE',
              targetId: ids.catalog,
            },
            doctorActor,
          ),
        );
        await inTenant(() =>
          services().assignments.createAssignment(
            {
              surveyVersionId: catalogTemplate.versionId,
              targetType: 'CARE_TYPE',
            },
            doctorActor,
          ),
        );

        const targets = await rows(
          `SELECT target_id, owner_practitioner_id FROM surveys.survey_assignments
          WHERE survey_version_id = $1 ORDER BY target_id`,
          [catalogTemplate.versionId],
        );
        expect(targets.map((t) => t.target_id).sort()).toEqual(
          [ids.catalog, SURVEYS.CARE_TYPE_CONSULTATION].sort(),
        );
        expect(targets.map((t) => t.owner_practitioner_id)).toEqual([
          DOCTOR,
          DOCTOR,
        ]);

        // El detalle de la plantilla dice a qué está asociada, con el nombre del servicio.
        const detail = await inTenant(() =>
          services().templates.getTemplate(catalogTemplate.id, doctorActor),
        );
        const byType = new Map(
          detail.assignments!.map((a) => [a.targetType, a]),
        );
        expect(byType.get('SERVICE')).toMatchObject({
          targetId: ids.catalog,
          targetName: 'LAB-01',
          active: true,
        });
        expect(byType.get('CARE_TYPE')).toMatchObject({
          targetId: SURVEYS.CARE_TYPE_CONSULTATION,
          targetName: null,
        });
        expect(detail.assignments).toHaveLength(2);
      });

      it('rechaza destinos que no existen, son de otra organización o no ofrece', async () => {
        const attempt = (targetId: string) =>
          inTenant(() =>
            services().assignments.createAssignment(
              {
                surveyVersionId: catalogTemplate.versionId,
                targetType: 'SERVICE',
                targetId,
              },
              doctorActor,
            ),
          ).then(
            () => 200,
            (e) => (e as { getStatus?: () => number }).getStatus?.() ?? 500,
          );

        expect(await attempt(randomUUID())).toBe(404);
        expect(await attempt(ids.catalogOtherTenant)).toBe(404);
        expect(await attempt(ids.catalogNotOffered)).toBe(422);
      });

      it('una consulta completada emite UNA invitación con SÓLO la base, aunque el médico tenga encuestas asociadas a sus consultas', async () => {
        // Una asociación heredada de la escrita a mano, tal como quedó en la base.
        await sql(
          `INSERT INTO surveys.survey_assignments (id, survey_version_id, tenant_id,
             target_type_concept_id, target_id, active, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, true, now(), now())`,
          [
            randomUUID(),
            template.versionId,
            TENANT,
            SURVEYS.TARGET_CARE_TYPE,
            SURVEYS.CARE_TYPE_CONSULTATION,
          ],
        );
        consultationBooking = await insertBooking({});

        await inTenant(() =>
          services().assignments.issueForBooking(
            { appointmentBookingId: consultationBooking },
            doctorActor,
          ),
        );

        const invitations = await invitationsOf(consultationBooking);
        expect(invitations).toHaveLength(1);
        expect(invitations[0]).toMatchObject({
          survey_version_id: systemSurveyIds(TENANT, 'CONSULTATION').versionId,
          survey_assignment_id: systemSurveyIds(TENANT, 'CONSULTATION')
            .assignmentId,
          extension_survey_version_id: null,
        });
      });

      it('un servicio completado recibe sólo la del catálogo asociada a ese servicio (ni la base ni la escrita a mano)', async () => {
        await sql(
          `INSERT INTO surveys.survey_assignments (id, survey_version_id, tenant_id,
             target_type_concept_id, target_id, active, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, true, now(), now())`,
          [
            randomUUID(),
            template.versionId,
            TENANT,
            SURVEYS.TARGET_SERVICE,
            ids.catalog,
          ],
        );
        serviceBooking = await insertBooking({ offering: true });

        await inTenant(() =>
          services().assignments.issueForBooking(
            { appointmentBookingId: serviceBooking },
            doctorActor,
          ),
        );

        const invitations = await invitationsOf(serviceBooking);
        expect(invitations).toHaveLength(1);
        expect(invitations[0]).toMatchObject({
          survey_version_id: catalogTemplate.versionId,
          extension_survey_version_id: null,
        });
      });

      it('una invitación anterior (la base con la escrita a mano detrás) sigue en la base, lista para responder', async () => {
        // Así quedó lo emitido antes del 06/11/2026.
        const booking = await insertBooking({});
        consultationInvitation = randomUUID();
        await sql(
          `INSERT INTO surveys.survey_invitations (id, survey_version_id, extension_survey_version_id,
             survey_assignment_id, tenant_id, patient_profile_id, appointment_booking_id,
             status_concept_id, issued_at, expires_at, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now() + interval '30 days', now(), now())`,
          [
            consultationInvitation,
            systemSurveyIds(TENANT, 'CONSULTATION').versionId,
            template.versionId,
            systemSurveyIds(TENANT, 'CONSULTATION').assignmentId,
            TENANT,
            PATIENT,
            booking,
            SURVEYS.INVITATION_PENDING,
          ],
        );
        const mine = await inTenant(() =>
          services().responses.listMyInvitations(patientActor),
        );
        expect(mine.map((i) => i.id)).toContain(consultationInvitation);
      });

      it('otro profesional no reparte la encuesta del médico en una reserva que no atendió', async () => {
        // Misma reserva de consulta, pero la atendió OTRO profesional: el recurso es suyo.
        const resource = randomUUID();
        await sql(
          `INSERT INTO scheduling.schedulable_resources (id, tenant_id, resource_type_concept_id,
           resource_ref_type, resource_ref_id, name, state_concept_id, created_at, updated_at)
         VALUES ($1, $2, $3, 'practitioner_profiles', $4, 'Otro consultorio', $3, now(), now())`,
          [resource, TENANT, ANY, OTHER_DOCTOR],
        );
        const slot = randomUUID();
        const booking = randomUUID();
        await sql(
          `INSERT INTO scheduling.bookable_slots (id, resource_id, start_at, end_at, capacity,
           remaining_capacity, status_concept_id, created_at, updated_at)
         VALUES ($1, $2, now(), now() + interval '30 minutes', 1, 0, $3, now(), now())`,
          [slot, resource, ANY],
        );
        await sql(
          `INSERT INTO scheduling.appointment_bookings (id, tenant_id, patient_profile_id, bookable_slot_id,
           resource_id, booking_channel_concept_id, status_concept_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, now(), now())`,
          [
            booking,
            TENANT,
            PATIENT,
            slot,
            resource,
            ANY,
            SCHED.BOOKING_COMPLETED,
          ],
        );

        await inTenant(() =>
          services().assignments.issueForBooking(
            { appointmentBookingId: booking },
            otherDoctorActor,
          ),
        );

        const [invitation] = await invitationsOf(booking);
        expect(invitation.extension_survey_version_id).toBeNull();
      });

      it('en esa invitación anterior el paciente ve primero las preguntas del sistema y después las del médico', async () => {
        const questionnaire = await inTenant(() =>
          services().responses.getMyQuestionnaire(
            consultationInvitation,
            patientActor,
          ),
        );

        expect(questionnaire.title).toBe('Encuesta de su consulta médica');
        expect(questionnaire.questions).toHaveLength(13);
        expect(questionnaire.questions.map((q) => q.source)).toEqual([
          ...Array(12).fill('SYSTEM'),
          'PRACTITIONER',
        ]);
        expect(questionnaire.questions.map((q) => q.position)).toEqual(
          Array.from({ length: 13 }, (_, i) => i + 1),
        );
        expect(
          questionnaire.questions.slice(0, 12).map((q) => q.questionText),
        ).toEqual(BASE_CONSULTATION.map((q) => q.text));
        expect(questionnaire.questions[12].required).toBe(false);
      });

      it('responder la anterior sin las obligatorias del sistema falla; con ellas, se registra y el médico lee sólo lo suyo', async () => {
        const questionnaire = await inTenant(() =>
          services().responses.getMyQuestionnaire(
            consultationInvitation,
            patientActor,
          ),
        );
        const q = questionnaire.questions;

        await expect(
          inTenant(() =>
            services().responses.submitResponse(
              consultationInvitation,
              { answers: [{ questionId: q[12].id, valueBoolean: true }] },
              patientActor,
            ),
          ),
        ).rejects.toMatchObject({ status: 422 });

        // Las 10 obligatorias de la base + la del médico (la medicación y el
        // comentario libre, opcionales, quedan sin responder).
        await inTenant(() =>
          services().responses.submitResponse(
            consultationInvitation,
            {
              answers: [
                { questionId: q[0].id, valueNumber: 4 },
                { questionId: q[1].id, valueChoices: ['Menos de 15 minutos'] },
                { questionId: q[2].id, valueNumber: 5 },
                { questionId: q[3].id, valueNumber: 5 },
                { questionId: q[4].id, valueNumber: 5 },
                { questionId: q[5].id, valueNumber: 4 },
                { questionId: q[6].id, valueNumber: 5 },
                {
                  questionId: q[8].id,
                  valueChoices: ['No, no tuve ningún problema'],
                },
                { questionId: q[9].id, valueNumber: 4 },
                { questionId: q[10].id, valueNumber: 9 },
                { questionId: q[12].id, valueBoolean: true },
              ],
            },
            patientActor,
          ),
        );

        const [status] = await rows(
          `SELECT status_concept_id FROM surveys.survey_invitations WHERE id = $1`,
          [consultationInvitation],
        );
        expect(status.status_concept_id).toBe(SURVEYS.INVITATION_ANSWERED);
        expect(
          Number(
            (
              await rows(
                `SELECT count(*)::int AS n FROM surveys.survey_answers a
                 JOIN surveys.survey_responses r ON r.id = a.survey_response_id
                WHERE r.survey_invitation_id = $1`,
                [consultationInvitation],
              )
            )[0].n,
          ),
        ).toBe(11);

        const forDoctor = await inTenant(() =>
          services().responses.listTemplateResponses(template.id, doctorActor),
        );
        expect(forDoctor).toHaveLength(1);
        expect(forDoctor[0].answers).toHaveLength(1);
        expect(forDoctor[0].answers[0]).toMatchObject({
          questionText: '¿Volvería a consultarme?',
          valueBoolean: true,
        });
        // Ni las respuestas del sistema ni el paciente salen en la lectura del médico.
        expect(JSON.stringify(forDoctor)).not.toContain(PATIENT);
      });

      it('el médico no lee las respuestas de la plantilla de sistema (403)', async () => {
        await expect(
          inTenant(() =>
            services().responses.listTemplateResponses(
              systemSurveyIds(TENANT, 'CONSULTATION').templateId,
              doctorActor,
            ),
          ),
        ).rejects.toMatchObject({ status: 403 });
      });
    });

    describe('resumen del médico (insights) con la invitación única', () => {
      const DOC3 = randomUUID();
      const resource3 = randomUUID();
      const doc3Actor = {
        id: randomUUID(),
        roles: ['PRACTITIONER'],
        practitionerProfileId: DOC3,
      } as AuthenticatedUser;
      const now = new Date();
      const from = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-01`;
      const to = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0),
      )
        .toISOString()
        .slice(0, 10);
      const insights = (actor: AuthenticatedUser) =>
        inTenant(() =>
          new SurveysInsightsService(
            orm.em.fork(),
            new InsightsRepository(),
            silent,
          ).getInsights({ from, to }, actor),
        );
      const extQuestionText = '¿Le gustó el consultorio de Doc3?';
      let doctorBefore: Awaited<ReturnType<typeof insights>>;

      /** El paciente responde todo lo respondible de una invitación. */
      async function answerAll(invitationId: string, patient: string) {
        const patientOf = {
          id: randomUUID(),
          roles: ['PATIENT'],
          patientProfileId: patient,
        } as AuthenticatedUser;
        const questionnaire = await inTenant(() =>
          services().responses.getMyQuestionnaire(invitationId, patientOf),
        );
        const answers = questionnaire.questions
          .filter((q) => q.answerType !== 'TEXT')
          .map((q) =>
            q.answerType === 'SCALE'
              ? { questionId: q.id, valueNumber: q.scaleMax }
              : { questionId: q.id, valueChoices: [q.options![0]] },
          );
        await inTenant(() =>
          services().responses.submitResponse(
            invitationId,
            { answers },
            patientOf,
          ),
        );
      }

      it('antes: el resumen de otro médico (DOCTOR) de la misma organización', async () => {
        doctorBefore = await insights(doctorActor);
        expect(doctorBefore.totals.issued).toBeGreaterThan(0);
      });

      it('en invitaciones anteriores, las preguntas de la base Y de la extensión cuentan en el médico que atendió', async () => {
        await sql(
          `INSERT INTO scheduling.schedulable_resources (id, tenant_id, resource_type_concept_id,
             resource_ref_type, resource_ref_id, name, state_concept_id, created_at, updated_at)
           VALUES ($1, $2, $3, 'practitioner_profiles', $4, 'Consultorio 3', $3, now(), now())`,
          [resource3, TENANT, ANY, DOC3],
        );
        const tpl = await inTenant(() =>
          services().templates.createTemplate({ title: 'Doc3' }, doc3Actor),
        );
        await inTenant(() =>
          services().templates.addQuestion(
            tpl.id,
            { questionText: extQuestionText, answerType: 'SCALE' },
            doc3Actor,
          ),
        );
        await inTenant(() =>
          services().templates.publishVersion(tpl.id, 1, {}, doc3Actor),
        );
        // La escrita a mano ya no se asocia (sólo del catálogo).
        await expect(
          inTenant(() =>
            services().assignments.createAssignment(
              { surveyVersionId: tpl.versionId, targetType: 'CARE_TYPE' },
              doc3Actor,
            ),
          ),
        ).rejects.toMatchObject({ status: 422 });

        for (let i = 0; i < 5; i += 1) {
          const patient = randomUUID();
          const booking = await insertBooking({ resource: resource3, patient });
          await inTenant(() =>
            services().assignments.issueForBooking(
              { appointmentBookingId: booking },
              doc3Actor,
            ),
          );
          const [invitation] = await invitationsOf(booking);
          // Hoy sale sólo la base; las anteriores llevaban la extensión detrás,
          // y así se reproduce lo que quedó en la base de datos.
          expect(invitation.extension_survey_version_id).toBeNull();
          await sql(
            'UPDATE surveys.survey_invitations SET extension_survey_version_id = $1 WHERE id = $2',
            [tpl.versionId, invitation.id],
          );
          await answerAll(invitation.id, patient);
        }

        const summary = await insights(doc3Actor);
        expect(summary.totals).toMatchObject({ issued: 5, answered: 5 });
        expect(summary.privacy.suppressed).toBe(false);
        const byText = new Map(summary.byQuestion!.map((q) => [q.text, q]));
        // La de la extensión cuenta...
        expect(byText.get(extQuestionText)?.n).toBe(5);
        // ... y las de la base también (una por dimensión, cada una con sus 5).
        expect(
          summary.byQuestion!.find((q) => q.dimension === 'esfuerzo_acceso')?.n,
        ).toBe(5);
        expect(
          summary.byQuestion!.find((q) => q.dimension === 'recomendacion_nps')
            ?.n,
        ).toBe(5);
        expect(summary.nps?.n).toBe(5);
      });

      it('nunca cuentan en el resumen de otro médico', async () => {
        const after = await insights(doctorActor);
        expect(after.totals).toEqual(doctorBefore.totals);
        expect(
          (after.byQuestion ?? []).some((q) => q.text === extQuestionText),
        ).toBe(false);
        const stranger = await insights({
          id: randomUUID(),
          roles: ['PRACTITIONER'],
          practitionerProfileId: randomUUID(),
        } as AuthenticatedUser);
        expect(stranger.totals).toMatchObject({ issued: 0, answered: 0 });
      });

      it('una plantilla sin dueño profesional que NO es la base del sistema no cuenta', async () => {
        const booking = await insertBooking({ resource: resource3 });
        const template = randomUUID();
        const version = randomUUID();
        await sql(
          `INSERT INTO surveys.survey_templates (id, tenant_id, owner_type_concept_id, owner_id,
             title, status_concept_id, created_at, updated_at)
           VALUES ($1, $2, $3, $4, 'De otra organización', $5, now(), now())`,
          [template, TENANT, ANY, randomUUID(), SURVEYS.TEMPLATE_ACTIVE],
        );
        await sql(
          `INSERT INTO surveys.survey_versions (id, survey_template_id, version_number,
             publication_status_concept_id, response_window_days, created_at, updated_at)
           VALUES ($1, $2, 1, $3, 30, now(), now())`,
          [version, template, SURVEYS.VERSION_PUBLISHED],
        );
        await sql(
          `INSERT INTO surveys.survey_invitations (id, survey_version_id, survey_assignment_id,
             tenant_id, patient_profile_id, appointment_booking_id, status_concept_id, issued_at,
             expires_at, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, now(), now(), now(), now())`,
          [
            randomUUID(),
            version,
            systemSurveyIds(TENANT, 'CONSULTATION').assignmentId,
            TENANT,
            PATIENT,
            booking,
            SURVEYS.INVITATION_PENDING,
          ],
        );

        const summary = await insights(doc3Actor);
        expect(summary.totals.issued).toBe(5);
      });
    });

    describe('el modelo respalda las reglas', () => {
      it('la extensión no puede ser la misma versión que la base (CHECK)', async () => {
        const booking = await insertBooking({});
        const { versionId, assignmentId } = systemSurveyIds(
          TENANT,
          'CONSULTATION',
        );

        await expect(
          sql(
            `INSERT INTO surveys.survey_invitations (id, survey_version_id, extension_survey_version_id,
             survey_assignment_id, tenant_id, patient_profile_id, appointment_booking_id,
             status_concept_id, issued_at, expires_at, created_at, updated_at)
           VALUES ($1, $2, $2, $3, $4, $5, $6, $7, now(), now(), now(), now())`,
            [
              randomUUID(),
              versionId,
              assignmentId,
              TENANT,
              PATIENT,
              booking,
              ANY,
            ],
          ),
        ).rejects.toMatchObject({
          constraint: 'ck_survey_invitations_extension_distinct',
        });
      });

      it('una invitación por reserva y versión base (índice único)', async () => {
        const booking = await insertBooking({});
        const { versionId, assignmentId } = systemSurveyIds(
          TENANT,
          'CONSULTATION',
        );
        const insert = () =>
          sql(
            `INSERT INTO surveys.survey_invitations (id, survey_version_id, survey_assignment_id, tenant_id,
             patient_profile_id, appointment_booking_id, status_concept_id, issued_at, expires_at,
             created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, now(), now(), now(), now())`,
            [
              randomUUID(),
              versionId,
              assignmentId,
              TENANT,
              PATIENT,
              booking,
              ANY,
            ],
          );

        await insert();
        await expect(insert()).rejects.toMatchObject({
          constraint: 'uq_survey_invitations_booking_version',
        });
      });
    });

    describe('reservas completadas sin invitación (runbook)', () => {
      it('lista las que no tienen ninguna invitación y deja de listar la que se reemite', async () => {
        const booking = await insertBooking({});

        const before = await inTenant(() =>
          services().assignments.listCompletedBookingsWithoutInvitation(1000),
        );
        expect(before).toContain(booking);

        await inTenant(() =>
          services().assignments.issueForBooking(
            { appointmentBookingId: booking },
            doctorActor,
          ),
        );

        const after = await inTenant(() =>
          services().assignments.listCompletedBookingsWithoutInvitation(1000),
        );
        expect(after).not.toContain(booking);
      });

      it('no lista las que no están completadas ni las de otro tenant', async () => {
        const inProgress = await insertBooking({
          status: SCHED.BOOKING_IN_PROGRESS,
        });

        const mine = await inTenant(() =>
          services().assignments.listCompletedBookingsWithoutInvitation(1000),
        );
        const other = await inTenant(
          () =>
            services().assignments.listCompletedBookingsWithoutInvitation(1000),
          OTHER_TENANT,
        );

        expect(mine).not.toContain(inProgress);
        expect(other).toEqual([]);
      });
    });

    describe('el patch v4267 desactiva las asignaciones heredadas de FT-31', () => {
      const patch = readFileSync(
        join(
          root,
          'database/SQL/patches/2026-10-28_v4267_surveys_encuesta_base.sql',
        ),
        'utf8',
      );

      /** Una «Satisfacción — …» como la dejaba FT-31, con su asignación activa a un servicio. */
      async function legacy(opts: {
        title?: string;
        questions?: number;
        withInvitation?: boolean;
      }) {
        const template = randomUUID();
        const version = randomUUID();
        const assignment = randomUUID();
        await sql(
          `INSERT INTO surveys.survey_templates (id, tenant_id, owner_practitioner_id, title,
             status_concept_id, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, now(), now())`,
          [
            template,
            TENANT,
            DOCTOR,
            opts.title ?? 'Satisfacción — Laboratorio',
            SURVEYS.TEMPLATE_ACTIVE,
          ],
        );
        await sql(
          `INSERT INTO surveys.survey_versions (id, survey_template_id, version_number,
             publication_status_concept_id, response_window_days, created_at, updated_at)
           VALUES ($1, $2, 1, $3, 30, now(), now())`,
          [version, template, SURVEYS.VERSION_PUBLISHED],
        );
        for (let i = 1; i <= (opts.questions ?? 1); i++) {
          await sql(
            `INSERT INTO surveys.survey_questions (id, survey_version_id, position, question_text,
               answer_type_concept_id, required, scale_min, scale_max, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, true, 1, 5, now(), now())`,
            [
              randomUUID(),
              version,
              i,
              '¿Qué tan satisfecho quedó con la atención?',
              SURVEYS.ANSWER_TYPE_SCALE,
            ],
          );
        }
        await sql(
          `INSERT INTO surveys.survey_assignments (id, survey_version_id, tenant_id,
             target_type_concept_id, target_id, active, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, true, now(), now())`,
          [assignment, version, TENANT, SURVEYS.TARGET_SERVICE, randomUUID()],
        );
        if (opts.withInvitation) {
          await sql(
            `INSERT INTO surveys.survey_invitations (id, survey_version_id, survey_assignment_id,
               tenant_id, patient_profile_id, appointment_booking_id, status_concept_id, issued_at,
               expires_at, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, now(), now(), now(), now())`,
            [
              randomUUID(),
              version,
              assignment,
              TENANT,
              PATIENT,
              await insertBooking({}),
              SURVEYS.INVITATION_PENDING,
            ],
          );
        }
        return assignment;
      }
      const activeOf = async (assignment: string) =>
        (
          await rows(
            `SELECT active FROM surveys.survey_assignments WHERE id = $1`,
            [assignment],
          )
        )[0].active;

      it('desactiva la heredada sin invitaciones; conserva la repartida, la de otro título y la de varias preguntas; es idempotente', async () => {
        const heredada = await legacy({});
        const repartida = await legacy({ withInvitation: true });
        const otroTitulo = await legacy({
          title: 'Mi encuesta de laboratorio',
        });
        const variasPreguntas = await legacy({ questions: 2 });

        await sql(patch);

        expect(await activeOf(heredada)).toBe(false);
        expect(await activeOf(repartida)).toBe(true);
        expect(await activeOf(otroTitulo)).toBe(true);
        expect(await activeOf(variasPreguntas)).toBe(true);

        // Segunda pasada: nada cambia y no falla.
        await sql(patch);
        expect(await activeOf(heredada)).toBe(false);
        expect(await activeOf(repartida)).toBe(true);
      });
    });
  },
);
