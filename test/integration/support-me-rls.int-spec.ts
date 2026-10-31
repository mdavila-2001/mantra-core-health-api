import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { MikroORM, PostgreSqlDriver } from '@mikro-orm/postgresql';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { CONCEPTS } from '../../src/common/constants/concepts';
import { DIR } from '../../src/modules/directory/directory.concepts';
import { PRAC } from '../../src/modules/practice/practice.concepts';
import { DELEG } from '../../src/modules/delegated_access/delegated_access.concepts';
import { supportPermissionId } from '../../src/modules/delegated_access/domain/support-actions';
import { COMM } from '../../src/modules/community/community.concepts';
import {
  CareSpaces,
  HealthcareServices,
  PracticeSites,
  Practices,
  PractitionerLocationAssignments,
  PractitionerRoleAssignments,
} from '../../src/modules/practice/entities';
import { TenantMemberships } from '../../src/modules/directory/entities';
import {
  OrganizationUserAssignments,
  PractitionerDelegateAssignments,
  SupportGrantActions,
  SupportScopeGrants,
  RoleTemplates,
  EngagementRequests,
  EngagementRequestItems,
  DelegatedAccessApprovalRequests,
  DelegatedAccessGrants,
} from '../../src/modules/delegated_access/entities';
import {
  ConversationAssignments,
  ConversationInternalNotes,
  ReplyTemplates,
} from '../../src/modules/community/entities';
import {
  AuthenticationCredentials,
  EmailVerifications,
  Users,
} from '../../src/modules/iam/entities';
import { SupportAccessRepository } from '../../src/modules/delegated_access/repositories/support-access.repository';
import { SupportActivityRepository } from '../../src/modules/delegated_access/repositories/support-activity.repository';
import { SupportActivityService } from '../../src/modules/delegated_access/services/support-activity.service';
import { DelegationScopeService } from '../../src/modules/delegated_access/services/delegation-scope.service';
import { AuditLog } from '../../src/modules/audit/entities';
import { runWithTenant } from '../../src/common';
import { SupportCatalogRepository } from '../../src/modules/delegated_access/repositories/support-catalog.repository';
import { EngagementRequestsRepository } from '../../src/modules/delegated_access/repositories/engagement-requests.repository';
import { RoleTemplatesRepository } from '../../src/modules/delegated_access/repositories/role-templates.repository';
import { SupportAccessPolicy } from '../../src/modules/delegated_access/services/support-access.policy';
import { SupportCatalogService } from '../../src/modules/delegated_access/services/support-catalog.service';
import { SupportEngagementsService } from '../../src/modules/delegated_access/services/support-engagements.service';
import { SupportInboxRepository } from '../../src/modules/community/repositories/support-inbox.repository';
import { CommunitySupportInboxService } from '../../src/modules/community/services/community-support-inbox.service';
import { CommunitySupportReplyService } from '../../src/modules/community/services/community-support-reply.service';
import { PublicProfilesRepository } from '../../src/modules/community/repositories/public-profiles.repository';
import { PublicProfiles } from '../../src/modules/community/entities';

/**
 * M8 contra PostgreSQL REAL, conectado como `mantra_app` (sin BYPASSRLS): las
 * lecturas `me/*` del personal de apoyo con `RLS_ENFORCE=true` no ven cero filas
 * y tampoco cruzan organizaciones.
 *
 * Es opt-in porque exige una base con el modelo, `2026-10-30_v4269_personal_apoyo.sql`
 * y `2026-08-05_tenant_rls.sql` aplicados, el rol `mantra_app` con LOGIN y un
 * superusuario para sembrar. Se activa con `SUPPORT_RLS_TEST=1` y se apunta con
 * `SUPPORT_RLS_DB_HOST/PORT/NAME` (por defecto 127.0.0.1:5498/apoyo_rls) y
 * `SUPPORT_RLS_ADMIN_USER` (por defecto `postgres`). Nunca usa la base de
 * pruebas compartida ni el puerto 5432.
 *
 * La siembra corre como superusuario con `session_replication_role = replica`
 * (sin disparadores ni FK): solo se insertan las columnas que las lecturas usan.
 */
const describeRls =
  process.env.SUPPORT_RLS_TEST === '1' ? describe : describe.skip;

const HOST = process.env.SUPPORT_RLS_DB_HOST ?? '127.0.0.1';
const PORT = Number(process.env.SUPPORT_RLS_DB_PORT ?? 5498);
const DB = process.env.SUPPORT_RLS_DB_NAME ?? 'apoyo_rls';
const ADMIN_USER = process.env.SUPPORT_RLS_ADMIN_USER ?? 'postgres';
const APP_USER = process.env.SUPPORT_RLS_APP_USER ?? 'mantra_app';

const id = (): string => randomUUID();
const HOSP = id();
const CLIN = id();
const OTRA = id();
const ANA = id();
const BEA = id();
const NUEVA = id();
const PAC_HOSP = id();
const PAC_CLIN = id();
const PAC_OTRA = id();
const DR_PEREZ = id();
const DR_CESPEDES = id();
const DR_VACA = id();
const PP_PEREZ = id();
const PP_CESPEDES = id();
const PP_VACA = id();
const PP_PAC_HOSP = id();
const PP_PAC_CLIN = id();
const PP_PAC_OTRA = id();
const CONV_HOSP = id();
const CONV_CLIN = id();
const CONV_OTRA = id();
const ASG_ANA_HOSP = id();
const ASG_ANA_CLIN = id();
const ASG_BEA_HOSP = id();
const ROLE_PEREZ = id();
const ROLE_CESPEDES = id();
const ROLE_VACA = id();
const REPLY = supportPermissionId('messages.reply_on_behalf');
const NOW = new Date();
const PAST = new Date(NOW.getTime() - 30 * 24 * 3600 * 1000);

/** Entidades que las lecturas bajo prueba tocan (el resto del modelo no hace falta). */
const ENTITIES = [
  CareSpaces,
  HealthcareServices,
  PracticeSites,
  Practices,
  PractitionerLocationAssignments,
  PractitionerRoleAssignments,
  TenantMemberships,
  OrganizationUserAssignments,
  PractitionerDelegateAssignments,
  SupportGrantActions,
  SupportScopeGrants,
  RoleTemplates,
  EngagementRequests,
  EngagementRequestItems,
  DelegatedAccessApprovalRequests,
  DelegatedAccessGrants,
  ConversationAssignments,
  ConversationInternalNotes,
  ReplyTemplates,
  AuthenticationCredentials,
  EmailVerifications,
  Users,
  PublicProfiles,
  AuditLog,
];

const logger: any = {
  setContext: () => undefined,
  info: () => undefined,
  warn: () => undefined,
};

describeRls('M8: lecturas me/* con RLS, como mantra_app', () => {
  let admin: pg.Client;
  let app: pg.Client;
  let orm: MikroORM;
  let policy: SupportAccessPolicy;
  let inbox: CommunitySupportInboxService;
  let reply: CommunitySupportReplyService;
  let engagements: SupportEngagementsService;
  let catalog: SupportCatalogService;
  let activityService: SupportActivityService;
  const before = process.env.RLS_ENFORCE;

  /** Inserta una fila por nombre de columna (superusuario, sin FK ni disparadores). */
  async function insert(
    table: string,
    row: Record<string, unknown>,
  ): Promise<void> {
    const columns = Object.keys(row);
    await admin.query(
      `insert into ${table} (${columns.join(', ')}) values (${columns
        .map((_, i) => `$${i + 1}`)
        .join(', ')})`,
      Object.values(row),
    );
  }

  const stamps = { created_at: NOW, updated_at: NOW };
  let DELEGATE_ANA_HOSP = '';

  beforeAll(async () => {
    admin = new pg.Client({
      host: HOST,
      port: PORT,
      user: ADMIN_USER,
      database: DB,
    });
    await admin.connect();
    app = new pg.Client({
      host: HOST,
      port: PORT,
      user: APP_USER,
      database: DB,
    });
    await app.connect();
    await admin.query("set session_replication_role = 'replica'");

    // --- organizaciones, personas y cuentas -------------------------------
    for (const [tenant, code] of [
      [HOSP, 'HOSP'],
      [CLIN, 'CLIN'],
      [OTRA, 'OTRA'],
    ] as const) {
      await insert('directory.tenants', {
        id: tenant,
        code: `${code}-${tenant.slice(0, 4)}`,
        tenant_type_concept_id: id(),
        legal_name: `Organización ${code}`,
        trade_name: `Organización ${code}`,
        legal_entity_type_concept_id: id(),
        status_concept_id: id(),
        verification_status_concept_id: id(),
        ...stamps,
      });
    }
    for (const [user, name] of [
      [ANA, 'Ana Gutiérrez'],
      [BEA, 'Bea Soto'],
      [NUEVA, 'Nueva Persona'],
      [PAC_HOSP, 'Paciente Hospital'],
      [PAC_CLIN, 'Paciente Clínica'],
      [PAC_OTRA, 'Paciente Otra'],
    ] as const) {
      await insert('iam.users', {
        id: user,
        status_concept_id: CONCEPTS.STATE_ACTIVE,
        display_name: name,
        ...stamps,
      });
    }
    for (const [person, name] of [
      [DR_PEREZ, 'Andrés Pérez'],
      [DR_CESPEDES, 'Paola Céspedes'],
      [DR_VACA, 'Jorge Vaca'],
    ] as const) {
      await insert('profiles.persons', {
        id: person,
        person_status_concept_id: id(),
        display_name: name,
        ...stamps,
      });
    }

    for (const doctor of [DR_PEREZ, DR_CESPEDES, DR_VACA]) {
      await insert('profiles.health_practitioner_profiles', {
        profile_id: doctor,
        practitioner_code: `MD-${doctor.slice(0, 8)}`,
        practitioner_category_concept_id: id(),
        verification_status_concept_id: id(),
        practice_status_concept_id: id(),
        ...stamps,
      });
    }
    // Los estados de la bandeja que la aplicación escribe deben existir como conceptos
    // (FK): se siembran solo los que no están, sin versión de sistema de códigos real.
    const codeSystem = id();
    for (const concept of [
      COMM.CONVERSATION_ASSIGNMENT_NEW,
      COMM.CONVERSATION_ASSIGNMENT_TAKEN,
      COMM.CONVERSATION_ASSIGNMENT_WAITING_DOCTOR,
      COMM.CONVERSATION_ASSIGNMENT_RESOLVED,
    ]) {
      await admin.query(
        `insert into terminology.catalog_concepts
           (id, code_system_version_id, code, display, created_at, updated_at)
         values ($1, $2, $3, $3, now(), now()) on conflict (id) do nothing`,
        [concept, codeSystem, `INBOX-${concept}`],
      );
    }

    // --- vínculos de apoyo: Ana en HOSP y CLIN, Bea en HOSP ----------------
    const membership = async (
      user: string,
      tenant: string,
    ): Promise<string> => {
      const mid = id();
      await insert('directory.tenant_memberships', {
        id: mid,
        user_id: user,
        tenant_id: tenant,
        tenant_role_concept_id: id(),
        status_concept_id: DIR.MEMBERSHIP_ACTIVE,
        access_scope_concept_id: id(),
        start_date: PAST,
        ...stamps,
      });
      return mid;
    };
    const assignment = async (
      asg: string,
      membershipId: string,
      tenant: string,
    ): Promise<void> =>
      insert('delegated_access.organization_user_assignments', {
        id: asg,
        tenant_id: tenant,
        tenant_membership_id: membershipId,
        assignment_role_concept_id: id(),
        access_scope_concept_id: id(),
        status_concept_id: CONCEPTS.STATE_ACTIVE,
        role_template_id: id(),
        ...stamps,
      });
    await assignment(ASG_ANA_HOSP, await membership(ANA, HOSP), HOSP);
    await assignment(ASG_ANA_CLIN, await membership(ANA, CLIN), CLIN);
    await assignment(ASG_BEA_HOSP, await membership(BEA, HOSP), HOSP);

    // --- doctores ----------------------------------------------------------
    for (const [tenant, role, doctor] of [
      [HOSP, ROLE_PEREZ, DR_PEREZ],
      [CLIN, ROLE_CESPEDES, DR_CESPEDES],
      [OTRA, ROLE_VACA, DR_VACA],
    ] as const) {
      const practice = id();
      await insert('practice.practices', {
        id: practice,
        tenant_id: tenant,
        code: `P-${practice.slice(0, 6)}`,
        name: 'Práctica',
        type_concept_id: id(),
        admin_user_id: ANA,
        status_concept_id: id(),
        ...stamps,
      });
      await insert('practice.practitioner_role_assignments', {
        id: role,
        practitioner_profile_id: doctor,
        practice_id: practice,
        role_concept_id: id(),
        status_concept_id: PRAC.ROLE_ASSIGNMENT_ACTIVE,
        ...stamps,
      });
    }

    // --- aceptación del doctor y permiso `messages.reply_on_behalf` --------
    const accepted = async (
      asg: string,
      role: string,
      mayReply: boolean,
      tenant: string,
    ): Promise<string> => {
      const delegateId = id();
      await insert('delegated_access.practitioner_delegate_assignments', {
        id: delegateId,
        tenant_id: tenant,
        practitioner_role_assignment_id: role,
        delegate_user_assignment_id: asg,
        delegated_permission_set_id: id(),
        delegate_role_concept_id: id(),
        status_concept_id: CONCEPTS.STATE_ACTIVE,
        accepted_at: PAST,
        may_reply_on_behalf: mayReply,
        reply_disclosure_concept_id: DELEG.REPLY_DISCLOSURE_SHOW,
        ...stamps,
      });
      return delegateId;
    };
    DELEGATE_ANA_HOSP = await accepted(ASG_ANA_HOSP, ROLE_PEREZ, true, HOSP);
    await accepted(ASG_ANA_CLIN, ROLE_CESPEDES, true, CLIN);
    // Bea fue aceptada por el Dr. Pérez pero no le permitió responder.
    await accepted(ASG_BEA_HOSP, ROLE_PEREZ, false, HOSP);

    // --- bitácora (cadena de auditoría): Ana en HOSP, CLIN y OTRA; Bea en HOSP.
    // Ana NO tiene vínculo en OTRA: ese asiento no debe aparecer en su actividad.
    const audit = (
      user: string,
      tenant: string,
      action: string,
      entity: string,
      entityId: string | null,
      minutesAgo: number,
    ): Promise<void> =>
      insert('audit.audit_log', {
        id: id(),
        user_id: user,
        tenant_id: tenant,
        action,
        entity,
        entity_id: entityId,
        outcome_concept_id: CONCEPTS.OUTCOME_SUCCESS,
        record_hash: id(),
        recorded_at: new Date(NOW.getTime() - minutesAgo * 60_000),
      });
    await audit(
      ANA,
      HOSP,
      'SUPPORT_DELEGATE_ACCEPTED',
      'practitioner_delegate_assignment',
      DELEGATE_ANA_HOSP,
      1,
    );
    await audit(
      ANA,
      HOSP,
      'SUPPORT_PATIENT_SEARCHED',
      'patient_search',
      null,
      2,
    );
    await audit(
      ANA,
      CLIN,
      'SUPPORT_PATIENT_SEARCHED',
      'patient_search',
      null,
      3,
    );
    await audit(
      ANA,
      OTRA,
      'SUPPORT_PATIENT_SEARCHED',
      'patient_search',
      null,
      4,
    );
    await audit(
      BEA,
      HOSP,
      'SUPPORT_PATIENT_SEARCHED',
      'patient_search',
      null,
      5,
    );
    for (const [tenant, asg] of [
      [HOSP, ASG_ANA_HOSP],
      [CLIN, ASG_ANA_CLIN],
      [HOSP, ASG_BEA_HOSP],
    ] as const) {
      const grant = id();
      await insert('delegated_access.support_scope_grants', {
        id: grant,
        tenant_id: tenant,
        organization_user_assignment_id: asg,
        target_kind_concept_id: DELEG.SUPPORT_TARGET_ALL,
        expansion_mode_concept_id: DELEG.SUPPORT_EXPANSION_DYNAMIC,
        status_concept_id: DELEG.SUPPORT_GRANT_ACTIVE,
        ...stamps,
      });
      await insert('delegated_access.support_grant_actions', {
        id: id(),
        tenant_id: tenant,
        support_scope_grant_id: grant,
        permission_id: REPLY,
        created_at: NOW,
      });
    }

    // --- una persona sin vínculo con una solicitud PENDIENTE en HOSP -------
    const template = id();
    await insert('delegated_access.role_templates', {
      id: template,
      code: `SECRETARY-${template.slice(0, 8)}`,
      name: 'Secretaría',
      default_actions_json: JSON.stringify([]),
      status_concept_id: CONCEPTS.STATE_ACTIVE,
      version_number: 1,
      ...stamps,
    });
    await insert('delegated_access.engagement_requests', {
      id: id(),
      tenant_id: HOSP,
      requester_user_id: NUEVA,
      direction_concept_id: DELEG.ENGAGEMENT_DIRECTION_REQUEST,
      role_template_id: template,
      status_concept_id: DELEG.ENGAGEMENT_STATUS_PENDING,
      expires_at: new Date(NOW.getTime() + 7 * 24 * 3600 * 1000),
      ...stamps,
    });

    // --- chat: un doctor y un paciente por organización --------------------
    const profile = async (
      pid: string,
      tenant: string,
      targetType: string,
      target: string,
      name: string,
    ): Promise<void> =>
      insert('community.public_profiles', {
        id: pid,
        tenant_id: tenant,
        target_type_concept_id: targetType,
        target_id: target,
        slug: `slug-${pid.slice(0, 8)}`,
        display_name: name,
        status_concept_id: CONCEPTS.STATE_ACTIVE,
        ...stamps,
      });
    await profile(
      PP_PEREZ,
      HOSP,
      COMM.PROFILE_TARGET_PRACTITIONER,
      DR_PEREZ,
      'Andrés Pérez',
    );
    await profile(
      PP_CESPEDES,
      CLIN,
      COMM.PROFILE_TARGET_PRACTITIONER,
      DR_CESPEDES,
      'Paola Céspedes',
    );
    await profile(
      PP_VACA,
      OTRA,
      COMM.PROFILE_TARGET_PRACTITIONER,
      DR_VACA,
      'Jorge Vaca',
    );
    await profile(
      PP_PAC_HOSP,
      HOSP,
      COMM.PROFILE_TARGET_USER,
      PAC_HOSP,
      'Paciente Hospital',
    );
    await profile(
      PP_PAC_CLIN,
      CLIN,
      COMM.PROFILE_TARGET_USER,
      PAC_CLIN,
      'Paciente Clínica',
    );
    await profile(
      PP_PAC_OTRA,
      OTRA,
      COMM.PROFILE_TARGET_USER,
      PAC_OTRA,
      'Paciente Otra',
    );
    const conversation = async (
      cid: string,
      tenantOfConversation: string | null,
      doctorProfile: string,
      patientProfile: string,
      text: string,
    ): Promise<void> => {
      await insert('community.conversations', {
        id: cid,
        tenant_id: tenantOfConversation,
        conversation_type_concept_id: COMM.CONVERSATION_DIRECT,
        status_concept_id: CONCEPTS.STATE_ACTIVE,
        last_message_at: NOW,
        ...stamps,
      });
      for (const p of [doctorProfile, patientProfile]) {
        await insert('community.conversation_participants', {
          id: id(),
          conversation_id: cid,
          participant_profile_id: p,
          role_concept_id: COMM.PARTICIPANT_ROLE_MEMBER,
          status_concept_id: CONCEPTS.STATE_ACTIVE,
          is_favorite: false, // NOT NULL en el modelo actual (columnas de la bandeja del chat)
          is_pinned: false,
          ...stamps,
        });
      }
      await insert('community.direct_messages', {
        id: id(),
        conversation_id: cid,
        sender_profile_id: patientProfile,
        content_type_concept_id: COMM.MESSAGE_CONTENT_TEXT,
        status_concept_id: COMM.MESSAGE_SENT,
        body_text: text,
        sent_at: NOW,
        disclosure_shown: false,
        ...stamps,
      });
    };
    // La del hospital anclada a su organización; la de la clínica sin ancla.
    await conversation(
      CONV_HOSP,
      HOSP,
      PP_PEREZ,
      PP_PAC_HOSP,
      '¿Pueden cambiarme la cita del jueves?',
    );
    await conversation(
      CONV_CLIN,
      null,
      PP_CESPEDES,
      PP_PAC_CLIN,
      'Necesito el comprobante de pago',
    );
    await conversation(
      CONV_OTRA,
      OTRA,
      PP_VACA,
      PP_PAC_OTRA,
      'Quiero otra hora',
    );

    // --- la app, como mantra_app ------------------------------------------
    orm = await MikroORM.init({
      driver: PostgreSqlDriver,
      host: HOST,
      port: PORT,
      user: APP_USER,
      dbName: DB,
      entities: ENTITIES,
      // Las entidades se compilan con `decoratorMetadata`: el tipo de las columnas sin
      // `type` explícito sale de ahí, sin recorrer los 1159 archivos con ts-morph.
      metadataProvider: ReflectMetadataProvider,
      allowGlobalContext: true,
      discovery: { warnWhenNoEntities: false },
      forceUtcTimezone: true,
    });
    const em = orm.em as any;
    const access = new SupportAccessRepository();
    policy = new SupportAccessPolicy(em, access, logger);
    const inboxRepo = new SupportInboxRepository();
    inbox = new CommunitySupportInboxService(em, inboxRepo, policy, logger);
    reply = new CommunitySupportReplyService(
      inboxRepo,
      new PublicProfilesRepository(),
      logger,
    );
    engagements = Object.assign(
      Object.create(SupportEngagementsService.prototype),
      {
        em,
        access,
        templates: new RoleTemplatesRepository(),
        activity: new SupportActivityRepository(),
      },
    );
    activityService = Object.assign(
      Object.create(SupportActivityService.prototype),
      {
        em,
        access,
        activity: new SupportActivityRepository(),
        scope: new DelegationScopeService(
          {} as any,
          {} as any,
          {} as any,
          {} as any,
        ),
      },
    );
    catalog = new SupportCatalogService(
      em,
      new SupportCatalogRepository(),
      access,
      new EngagementRequestsRepository(),
      {} as any,
    );
    process.env.RLS_ENFORCE = 'true';
  });

  afterAll(async () => {
    if (before === undefined) delete process.env.RLS_ENFORCE;
    else process.env.RLS_ENFORCE = before;
    await orm?.close(true);
    await app?.end();
    await admin?.end();
  });

  it('control: sin contexto el rol de la aplicación NO ve nada (el problema de M8)', async () => {
    const mine = [ANA, BEA, NUEVA];
    const memberships = await app.query(
      'select count(*)::int as n from directory.tenant_memberships where user_id = any($1)',
      [mine],
    );
    expect(memberships.rows[0].n).toBe(0);
    const grants = await app.query(
      'select count(*)::int as n from delegated_access.support_scope_grants where organization_user_assignment_id = any($1)',
      [[ASG_ANA_HOSP, ASG_ANA_CLIN, ASG_BEA_HOSP]],
    );
    expect(grants.rows[0].n).toBe(0);
    // Y con el contexto de sistema abierto vería todo: por eso no se abre para todos.
    await app.query('begin');
    await app.query("select set_config('app.system_context', 'true', true)");
    const everything = await app.query(
      'select count(*)::int as n from directory.tenant_memberships where user_id = any($1)',
      [mine],
    );
    await app.query('rollback');
    expect(everything.rows[0].n).toBe(3);
  });

  it('control del arreglo: sin el alcance por organización la misma ruta ve cero filas y niega a quien sí tiene vínculo', async () => {
    // Con RLS en la base pero la lectura a la antigua (sin transacción ni contexto):
    // la persona con vínculo vivo en HOSP aparece sin vínculo. Es lo que M8 describía.
    process.env.RLS_ENFORCE = 'false';
    try {
      await expect(
        inbox.listInbox({ tenantId: HOSP }, { id: ANA, roles: [] } as any),
      ).rejects.toMatchObject({ status: 403 });
    } finally {
      process.env.RLS_ENFORCE = 'true';
    }
    const res = await inbox.listInbox({ tenantId: HOSP }, {
      id: ANA,
      roles: [],
    } as any);
    expect(res.count).toBe(1);
  });

  it('el vínculo vivo de Ana son HOSP y CLIN, nunca OTRA', async () => {
    const tx = orm.em.fork();
    await tx.begin();
    try {
      await tx.execute("select set_config('app.system_context', 'true', true)");
      const tenants = await policy.liveEngagementTenants(ANA, tx as any);
      expect(tenants.sort()).toEqual([CLIN, HOSP].sort());
    } finally {
      await tx.rollback();
    }
  });

  it('la bandeja de Ana reúne HOSP y CLIN y no trae la de OTRA', async () => {
    const res = await inbox.listInbox({}, { id: ANA, roles: [] } as any);
    const ids = res.items.map((i) => i.conversationId).sort();
    expect(ids).toEqual([CONV_CLIN, CONV_HOSP].sort());
    expect(res.items.find((i) => i.conversationId === CONV_HOSP)).toMatchObject(
      {
        organizationName: 'Organización HOSP',
        practitionerName: 'Andrés Pérez',
        patientLabel: 'Paciente Hospital',
        status: 'NEW',
        assignedToMe: false,
      },
    );
    expect(res.doctors.map((d) => d.practitionerProfileId).sort()).toEqual(
      [DR_CESPEDES, DR_PEREZ].sort(),
    );
    expect(JSON.stringify(res)).not.toContain(CONV_OTRA);
    expect(JSON.stringify(res)).not.toContain(DR_VACA);
  });

  it('acotada a una organización: solo esa; sin vínculo, 403', async () => {
    const actor = { id: ANA, roles: [] } as any;
    const clin = await inbox.listInbox({ tenantId: CLIN }, actor);
    expect(clin.items.map((i) => i.conversationId)).toEqual([CONV_CLIN]);
    await expect(
      inbox.listInbox({ tenantId: OTRA }, actor),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('una conversación de otra organización responde 404, y la propia se abre', async () => {
    const actor = { id: ANA, roles: [] } as any;
    await expect(
      inbox.getConversation(CONV_OTRA, {}, actor),
    ).rejects.toMatchObject({ status: 404 });
    const open = await inbox.getConversation(
      CONV_HOSP,
      { tenantId: HOSP },
      actor,
    );
    expect(open).toMatchObject({
      organizationId: HOSP,
      practitionerName: 'Andrés Pérez',
      replyAllowed: true,
    });
    expect(open.messages).toHaveLength(1);
    expect(open.messages[0].from).toBe('PATIENT');
    // La persona que solo tiene vínculo con CLIN no abre la de HOSP pidiéndola por CLIN.
    await expect(
      inbox.getConversation(CONV_HOSP, { tenantId: CLIN }, actor),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('Bea (aceptada por el Dr. Pérez solo para la agenda, sin may_reply_on_behalf) NO ve su bandeja: leer sus conversaciones es más amplio que agendar', async () => {
    // Endurecimiento de la revisión de seguridad (inboxDoctorsOfTenant): una aceptación sin `may_reply_on_behalf` no abre la bandeja.
    // Antes del gobierno de accesos Bea la veía en solo lectura; esta prueba quedó con esa expectativa vieja (hallazgo de B7a).
    const bea = { id: BEA, roles: [] } as any;
    await expect(
      inbox.listInbox({ tenantId: HOSP }, bea),
    ).rejects.toMatchObject({ status: 403 });
    // sin acotar por organización no hay bandeja: ninguna conversación ni doctor
    const all = await inbox.listInbox({}, bea);
    expect(all.items).toEqual([]);
    expect(all.doctors).toEqual([]);
    // y la conversación del doctor no existe para ella
    await expect(
      inbox.getConversation(CONV_HOSP, {}, bea),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('tomar una conversación escribe la asignación en la organización del doctor, y quien no puede verla no la toma (404)', async () => {
    const res = await inbox.applyAssignment(
      CONV_HOSP,
      { practitionerProfileId: DR_PEREZ, status: 'TAKEN' } as any,
      { id: ANA, roles: [] } as any,
    );
    expect(res).toMatchObject({ status: 'TAKEN', assignedUserId: ANA });
    const row = await admin.query(
      'select tenant_id, assigned_user_id from community.conversation_assignments where conversation_id = $1',
      [CONV_HOSP],
    );
    expect(row.rows).toEqual([{ tenant_id: HOSP, assigned_user_id: ANA }]);
    await expect(
      inbox.applyAssignment(
        CONV_HOSP,
        { status: 'TAKEN' } as any,
        { id: BEA, roles: [] } as any,
      ),
      // Bea no cubre al doctor (sin may_reply_on_behalf): la conversación no es visible para ella.
    ).rejects.toMatchObject({ status: 404 });
    // La asignación de HOSP no se ve entrando a CLIN: el aislamiento es de la base.
    await app.query('begin');
    await app.query("select set_config('app.current_tenant_id', $1, true)", [
      CLIN,
    ]);
    const seenFromClin = await app.query(
      'select count(*)::int as n from community.conversation_assignments',
    );
    await app.query("select set_config('app.current_tenant_id', $1, true)", [
      HOSP,
    ]);
    const seenFromHosp = await app.query(
      'select count(*)::int as n from community.conversation_assignments',
    );
    await app.query('rollback');
    expect(seenFromClin.rows[0].n).toBe(0);
    expect(seenFromHosp.rows[0].n).toBe(1);
    // Y en la bandeja ya figura a nombre de Ana.
    const list = await inbox.listInbox({ tenantId: HOSP }, {
      id: ANA,
      roles: [],
    } as any);
    expect(list.items[0]).toMatchObject({
      status: 'TAKEN',
      assignedToMe: true,
      assignedToName: 'Ana Gutiérrez',
    });
  });

  it('una nota interna queda con la organización de la conversación', async () => {
    const note = await inbox.addNote(
      CONV_HOSP,
      { bodyText: 'Llamar al paciente mañana' },
      { id: ANA, roles: [] } as any,
    );
    expect(note.authorName).toBe('Ana Gutiérrez');
    const row = await admin.query(
      'select tenant_id from community.conversation_internal_notes where id = $1',
      [note.id],
    );
    expect(row.rows[0].tenant_id).toBe(HOSP);
  });

  it('el paciente que escribe reabre la conversación resuelta (laguna 4) desde otra organización', async () => {
    await inbox.applyAssignment(
      CONV_HOSP,
      { status: 'RESOLVED' } as any,
      { id: ANA, roles: [] } as any,
    );
    // El paciente escribe dentro de SU contexto (otra organización): la fila de HOSP
    // solo se alcanza por la conversación en la que participa.
    await orm.em.transactional(async (tx) => {
      await tx.execute(
        "select set_config('app.system_context', 'false', true)",
      );
      await tx.execute("select set_config('app.current_tenant_id', ?, true)", [
        OTRA,
      ]);
      const reopened = await reply.reopenIfResolved(
        tx as any,
        CONV_HOSP,
        PP_PAC_HOSP,
      );
      expect(reopened).toBe(true);
      // El contexto de la petición se devolvió tal cual.
      const [ctx] = await tx.execute<{ tid: string }[]>(
        "select current_setting('app.current_tenant_id', true) as tid",
      );
      expect(ctx.tid).toBe(OTRA);
    });
    const row = await admin.query(
      'select status_concept_id, assigned_user_id, sla_due_at from community.conversation_assignments where conversation_id = $1',
      [CONV_HOSP],
    );
    expect(row.rows[0]).toEqual({
      status_concept_id: COMM.CONVERSATION_ASSIGNMENT_NEW,
      assigned_user_id: null,
      sla_due_at: null,
    });
  });

  /** Corre `work` en una transacción con el tenant de la petición, como el interceptor. */
  async function inRequest<T>(
    tenant: string,
    work: (tx: any) => Promise<T>,
  ): Promise<T> {
    return orm.em.transactional(async (tx) => {
      await tx.execute(
        "select set_config('app.system_context', 'false', true)",
      );
      await tx.execute("select set_config('app.current_tenant_id', ?, true)", [
        tenant,
      ]);
      return work(tx);
    });
  }

  it('responder en nombre del doctor: 409 si otra persona la tiene y 422 si hay un mensaje clínico sin derivar', async () => {
    const target = (userId: string) => ({
      conversationId: CONV_CLIN,
      doctorPublicProfileId: PP_CESPEDES,
      practitionerProfileId: DR_CESPEDES,
      tenantId: CLIN,
      actorUserId: userId,
    });
    // Libre y administrativa: se puede responder; responder es hacerse cargo.
    await inRequest(CLIN, async (tx) => {
      await reply.guardReply(tx, target(ANA));
      await reply.recordReply(tx, target(ANA));
    });
    const taken = await admin.query(
      'select tenant_id, assigned_user_id from community.conversation_assignments where conversation_id = $1',
      [CONV_CLIN],
    );
    expect(taken.rows).toEqual([{ tenant_id: CLIN, assigned_user_id: ANA }]);
    // Otra persona del equipo no responde una conversación que ya tiene Ana.
    await expect(
      inRequest(CLIN, (tx) => reply.guardReply(tx, target(BEA))),
    ).rejects.toMatchObject({
      status: 409,
      details: { assignedToName: 'Ana Gutiérrez' },
    });
    // Llega un mensaje clínico: Ana no lo responde sin derivar.
    await insert('community.direct_messages', {
      id: id(),
      conversation_id: CONV_CLIN,
      sender_profile_id: PP_PAC_CLIN,
      content_type_concept_id: COMM.MESSAGE_CONTENT_TEXT,
      status_concept_id: COMM.MESSAGE_SENT,
      body_text: 'Tengo fiebre y mucho dolor de pecho',
      sent_at: new Date(NOW.getTime() + 1000),
      disclosure_shown: false,
      ...stamps,
    });
    await expect(
      inRequest(CLIN, (tx) => reply.guardReply(tx, target(ANA))),
    ).rejects.toMatchObject({
      status: 422,
      reason: 'CLINICAL_REQUIRES_DERIVATION',
      details: { reason: 'CLINICAL_REQUIRES_DERIVATION' },
    });
    // La bandeja lo marca como clínico y, derivada al doctor, ya se puede seguir.
    const list = await inbox.listInbox({ tenantId: CLIN }, {
      id: ANA,
      roles: [],
    } as any);
    expect(list.items[0]).toMatchObject({
      isClinical: true,
      clinicalSuspected: true,
    });
    await inbox.applyAssignment(
      CONV_CLIN,
      { status: 'WAITING_DOCTOR' } as any,
      { id: ANA, roles: [] } as any,
    );
    await expect(
      inRequest(CLIN, (tx) => reply.guardReply(tx, target(ANA))),
    ).resolves.toBeUndefined();
  });

  it('las consultas con lista (`in (?)`) funcionan con 0, 1 y varios elementos por el mismo acceso (em.execute)', async () => {
    const repo = new SupportInboxRepository();
    const em = orm.em.fork() as any;
    // Cero: el repositorio no consulta.
    expect((await repo.doctorInfo(em, [])).size).toBe(0);
    expect((await repo.tenantNames(em, [])).size).toBe(0);
    expect((await repo.userNames(em, [])).size).toBe(0);
    // Uno.
    const one = await repo.doctorInfo(em, [DR_PEREZ]);
    expect([...one.keys()]).toEqual([DR_PEREZ]);
    expect(one.get(DR_PEREZ)?.displayName).toBe('Andrés Pérez');
    expect((await repo.tenantNames(em, [HOSP])).get(HOSP)).toBe(
      'Organización HOSP',
    );
    // Varios, con repetidos.
    const many = await repo.doctorInfo(em, [
      DR_PEREZ,
      DR_CESPEDES,
      DR_VACA,
      DR_PEREZ,
    ]);
    expect([...many.keys()].sort()).toEqual(
      [DR_CESPEDES, DR_PEREZ, DR_VACA].sort(),
    );
    const tenants = await repo.tenantNames(em, [HOSP, CLIN, OTRA]);
    expect([...tenants.keys()].sort()).toEqual([CLIN, HOSP, OTRA].sort());
    // Un id inexistente no rompe ni aparece.
    expect((await repo.doctorInfo(em, [id()])).size).toBe(0);
    // Las del catálogo (`any(?::uuid[])` con texto de arreglo) con 1 y varios.
    const catalogRepo = new SupportCatalogRepository();
    expect(await catalogRepo.locationAssignments(em, [])).toEqual([]);
    expect(await catalogRepo.locationAssignments(em, [ROLE_PEREZ])).toEqual([]);
    expect(
      await catalogRepo.locationAssignments(em, [
        ROLE_PEREZ,
        ROLE_CESPEDES,
        ROLE_VACA,
      ]),
    ).toEqual([]);
  });

  it('mis vínculos: HOSP y CLIN con sus permisos, sin los de otras personas', async () => {
    const res = await engagements.listMine(ANA);
    expect(res.items.map((e) => e.tenantId).sort()).toEqual(
      [CLIN, HOSP].sort(),
    );
    for (const item of res.items) {
      expect(item.userId).toBe(ANA);
      expect(item.grants.map((g) => g.actions).flat()).toContain(
        'messages.reply_on_behalf',
      );
    }
    const bea = await engagements.listMine(BEA);
    expect(bea.items.map((e) => e.tenantId)).toEqual([HOSP]);
  });

  it('catálogo: con vínculo o solicitud pendiente lo lee; de otra organización, 403', async () => {
    const asAna = await catalog.forPerson(ANA, HOSP);
    expect(asAna.tenantId).toBe(HOSP);
    expect(asAna.doctors.map((d) => d.displayName)).toEqual(['Andrés Pérez']);
    // Nueva persona: solo una solicitud pendiente en HOSP.
    const asNew = await catalog.forPerson(NUEVA, HOSP);
    expect(asNew.doctors.map((d) => d.displayName)).toEqual(['Andrés Pérez']);
    await expect(catalog.forPerson(NUEVA, CLIN)).rejects.toMatchObject({
      status: 403,
    });
    await expect(catalog.forPerson(ANA, OTRA)).rejects.toMatchObject({
      status: 403,
    });
  });

  describe('actividad (me/support-activity y org)', () => {
    const asAna = { id: ANA, roles: [] } as any;

    it('control: el rol de la aplicación, sin contexto, no ve ni un asiento de la bitácora', async () => {
      const rows = await app.query(
        'select count(*)::int as n from audit.audit_log where user_id = any($1)',
        [[ANA, BEA]],
      );
      expect(rows.rows[0].n).toBe(0);
    });

    it('Ana ve su actividad solo de HOSP y CLIN (vínculo vivo): ni OTRA, ni lo de Bea', async () => {
      const res = await activityService.forPerson(asAna, {});
      expect(res.items.map((i) => i.tenantId).sort()).toEqual(
        [CLIN, HOSP, HOSP].sort(),
      );
      expect(res.items.every((i) => i.userId === ANA)).toBe(true);
      expect(res.items.every((i) => i.personName === 'Ana Gutiérrez')).toBe(
        true,
      );
      expect(res.items.some((i) => i.tenantId === OTRA)).toBe(false);
      // Las filas con doctor atribuible traen su nombre y su evento en el código del cliente.
      const delegate = res.items.find((i) => i.entityId === DELEGATE_ANA_HOSP);
      expect(delegate).toMatchObject({
        action: 'delegate.accepted',
        auditAction: 'SUPPORT_DELEGATE_ACCEPTED',
        practitionerName: 'Andrés Pérez',
        practitionerProfileId: DR_PEREZ,
        result: 'SUCCESS',
      });
    });

    it('acotada a una organización: solo esa; una sin vínculo vivo, nada', async () => {
      const clin = await activityService.forPerson(asAna, { tenantId: CLIN });
      expect(clin.items.map((i) => i.tenantId)).toEqual([CLIN]);
      const otra = await activityService.forPerson(asAna, { tenantId: OTRA });
      expect(otra).toEqual({ items: [], count: 0, nextCursor: null });
    });

    it('Bea ve solo lo suyo en HOSP; una persona sin vínculo vivo no ve nada', async () => {
      const bea = await activityService.forPerson(
        { id: BEA, roles: [] } as any,
        {},
      );
      expect(bea.items.map((i) => [i.userId, i.tenantId])).toEqual([
        [BEA, HOSP],
      ]);
      const nueva = await activityService.forPerson(
        { id: NUEVA, roles: [] } as any,
        {},
      );
      expect(nueva.items).toEqual([]);
    });

    it('filtros y paginación sobre filas reales', async () => {
      const byAction = await activityService.forPerson(asAna, {
        action: 'patient.search',
      });
      expect(byAction.items.map((i) => i.tenantId).sort()).toEqual(
        [CLIN, HOSP].sort(),
      );
      const first = await activityService.forPerson(asAna, { limit: 1 });
      expect(first.items).toHaveLength(1);
      expect(first.nextCursor).not.toBeNull();
      const second = await activityService.forPerson(asAna, {
        limit: 5,
        cursor: first.nextCursor as string,
      });
      expect(second.items.map((i) => i.id)).not.toContain(first.items[0].id);
      expect(second.items).toHaveLength(2);
    });

    it('la organización lee su bitácora en la transacción de la petición (contexto de HOSP): su personal, sin OTRA ni CLIN', async () => {
      const em = orm.em as any;
      const res = await em.transactional(async () => {
        await em.execute(
          "select set_config('app.system_context', 'false', true)",
        );
        await em.execute(
          "select set_config('app.current_tenant_id', ?, true)",
          [HOSP],
        );
        return runWithTenant(HOSP, () => activityService.forTenant({}));
      });
      expect(res.items.every((i: any) => i.tenantId === HOSP)).toBe(true);
      expect(res.items.map((i: any) => i.userId).sort()).toEqual(
        [ANA, ANA, BEA].sort(),
      );
      expect(res.items.find((i: any) => i.userId === BEA)?.personName).toBe(
        'Bea Soto',
      );
    });
  });
});
