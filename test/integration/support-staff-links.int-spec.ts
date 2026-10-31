import 'dotenv/config';
import { MikroORM } from '@mikro-orm/postgresql';
import { randomUUID } from 'node:crypto';
import { CONCEPTS, SEED } from '../../src/common/constants/concepts';
import { TerminologySeedService } from '../../src/common/seed/terminology-seed.service';
import { buildOrmConfig } from '../../src/orm/config/orm.config';
import { DIR } from '../../src/modules/directory/directory.concepts';
import { TenantMembershipsRepository } from '../../src/modules/directory/repositories';
import { TenantAdministrationService } from '../../src/modules/directory/services/tenant-administration.service';
import { PRAC } from '../../src/modules/practice/practice.concepts';
import { PROF } from '../../src/modules/profiles/profiles.concepts';
import {
  PersonAccountLinksRepository,
  PersonProfilesRepository,
  PersonsRepository,
} from '../../src/modules/profiles/infrastructure/repositories';
import {
  ContactPointsRepository,
  IdentifiersRepository,
} from '../../src/modules/common/repositories';
import {
  CredentialsRepository,
  EmailVerificationsRepository,
  SecurityEventsRepository,
  UserGlobalRolesRepository,
  UsersRepository,
} from '../../src/modules/iam/infrastructure/repositories';
import { ProfilesRegistrationAdapter } from '../../src/modules/iam/infrastructure/adapters/profiles-registration.adapter';
import { CommonRecordsAdapter } from '../../src/modules/iam/infrastructure/adapters/common-records.adapter';
import { DirectoryRegistrationAdapter } from '../../src/modules/iam/infrastructure/adapters/directory-registration.adapter';
import { IamSupportStaffSelfRegistrationService } from '../../src/modules/iam/application/services/iam-support-staff-self-registration.service';
import { conceptIdsToRoleCodes } from '../../src/modules/iam/domain/role-mapping';
import { SupportLinksRepository } from '../../src/modules/delegated_access/repositories/support-links.repository';
import { SupportStaffService } from '../../src/modules/delegated_access/services/support-staff.service';
import type { AuthenticatedUser } from '../../src/common';

/**
 * Secretaria (personal de apoyo hospitalario) contra PostgreSQL real: el alta,
 * la solicitud y la aceptación, y el alcance que resulta.
 *
 * Opt-in (`SUPPORT_STAFF_IT=1`) y sólo contra una base **desechable**
 * (`DB_NAME` con `test`/`ci`/`tmp`/`scratch`/`smoke`/`disposable`): deja filas
 * en `iam.security_events` y en las tablas de vínculos, y no las borra.
 *
 * Datos: sólo sintéticos, marcados `SUP-<sufijo>`.
 */
const enabled =
  process.env.SUPPORT_STAFF_IT === '1' &&
  /(test|ci|tmp|scratch|smoke|disposable)/i.test(process.env.DB_NAME ?? '');
const describeIt = enabled ? describe : describe.skip;

describeIt(
  'secretaria: alta, solicitud, aceptación y alcance (DB real)',
  () => {
    let orm: MikroORM;
    const mark = `SUP-${randomUUID().slice(0, 8)}`;
    const any = CONCEPTS.STATE_ACTIVE;
    const ids = {
      admin: randomUUID(),
      doctorUser: randomUUID(),
      doctor: randomUUID(),
      tenantA: randomUUID(),
      tenantB: randomUUID(),
      practiceA: randomUUID(),
      practiceB: randomUUID(),
      siteA: randomUUID(),
      siteB: randomUUID(),
      floor1: randomUUID(),
      floor2: randomUUID(),
      floorB: randomUUID(),
      roleA: randomUUID(),
    };
    const nationalId = `${Math.floor(1e7 + Math.random() * 8e7)}`;
    const quiet = {
      setContext: () => undefined,
      info: () => undefined,
      warn: () => undefined,
      error: () => undefined,
    };

    const run = (sql: string, params: unknown[] = []) =>
      orm.em.getConnection().execute(sql, params, 'run');
    const all = <T = Record<string, unknown>>(
      sql: string,
      params: unknown[] = [],
    ) => orm.em.getConnection().execute(sql, params, 'all') as Promise<T[]>;

    async function insert(table: string, row: Record<string, unknown>) {
      const withStamps = {
        created_at: new Date(),
        updated_at: new Date(),
        ...row,
      };
      const columns = Object.keys(withStamps);
      await run(
        `insert into ${table} (${columns.join(', ')}) values (${columns.map(() => '?').join(', ')})`,
        Object.values(withStamps),
      );
    }

    let service: SupportStaffService;
    let registration: IamSupportStaffSelfRegistrationService;
    let secretary: AuthenticatedUser;
    const admin: AuthenticatedUser = { id: ids.admin, roles: ['USER'] };
    const doctor: AuthenticatedUser = {
      id: ids.doctorUser,
      roles: ['USER', 'PRACTITIONER'],
      practitionerProfileId: ids.doctor,
    };

    beforeAll(async () => {
      orm = await MikroORM.init({
        ...buildOrmConfig(),
        entities: ['src/modules/**/entities/*.entity.ts'],
      });
      const needed = [
        CONCEPTS.ROLE_SUPPORT_STAFF,
        DIR.ROLE_SUPPORT,
        PROF.PROFILE_TYPE_SECRETARY,
        PRAC.SUPPORT_PENDING,
      ];
      const [{ n }] = await all<{ n: number }>(
        `select count(*)::int as n from terminology.catalog_concepts where id in (${needed.map(() => '?').join(', ')})`,
        needed,
      );
      if (n < needed.length) {
        await new TerminologySeedService(orm, quiet as never).run();
      }

      const [seedTenant] = await all(
        'select id from directory.tenants where id = ?',
        [SEED.tenantId],
      );
      await insert('iam.users', {
        id: ids.admin,
        status_concept_id: CONCEPTS.USER_ACTIVE,
        display_name: `${mark} admin`,
      });
      await insert('iam.users', {
        id: ids.doctorUser,
        status_concept_id: CONCEPTS.USER_ACTIVE,
        display_name: `${mark} doctor`,
      });
      const tenants: [string, string][] = [
        [ids.tenantA, 'A'],
        [ids.tenantB, 'B'],
      ];
      if (!seedTenant) tenants.push([SEED.tenantId, 'SEED']);
      for (const [tenant, suffix] of tenants) {
        await insert('directory.tenants', {
          id: tenant,
          code: `${mark}-${suffix}`,
          tenant_type_concept_id: any,
          legal_name: `${mark} Hospital ${suffix}`,
          legal_entity_type_concept_id: any,
          status_concept_id: any,
          verification_status_concept_id: any,
        });
      }
      await insert('directory.tenant_memberships', {
        id: randomUUID(),
        user_id: ids.admin,
        tenant_id: ids.tenantA,
        tenant_role_concept_id: DIR.ROLE_OWNER,
        status_concept_id: DIR.MEMBERSHIP_ACTIVE,
        access_scope_concept_id: DIR.SCOPE_ALL_TENANT,
        start_date: new Date(),
      });
      for (const [practice, tenant, site] of [
        [ids.practiceA, ids.tenantA, ids.siteA],
        [ids.practiceB, ids.tenantB, ids.siteB],
      ]) {
        await insert('practice.practices', {
          id: practice,
          tenant_id: tenant,
          code: `${mark}-${practice.slice(0, 6)}`,
          name: mark,
          type_concept_id: any,
          admin_user_id: ids.admin,
          status_concept_id: any,
        });
        await insert('practice.practice_sites', {
          id: site,
          practice_id: practice,
          tenant_id: tenant,
          code: `${mark}-${site.slice(0, 6)}`,
          name: `Sede ${site.slice(0, 4)}`,
          site_type_concept_id: any,
          status_concept_id: any,
        });
      }
      for (const [floor, site, tenant, name] of [
        [ids.floor1, ids.siteA, ids.tenantA, 'Piso 1'],
        [ids.floor2, ids.siteA, ids.tenantA, 'Piso 2'],
        [ids.floorB, ids.siteB, ids.tenantB, 'Piso B'],
      ]) {
        await insert('practice.care_spaces', {
          id: floor,
          practice_site_id: site,
          tenant_id: tenant,
          code: `${mark}-${floor.slice(0, 6)}`,
          name,
          space_type_concept_id: any,
          status_concept_id: any,
          form_concept_id: PRAC.LOC_FORM_LEVEL,
        });
      }
      await insert('profiles.persons', {
        id: ids.doctor,
        person_status_concept_id: PROF.PERSON_ACTIVE,
        display_name: `${mark} Dra. Rojas`,
      });
      await insert('profiles.health_practitioner_profiles', {
        profile_id: ids.doctor,
        practitioner_code: mark,
        practitioner_category_concept_id: any,
        verification_status_concept_id: any,
        practice_status_concept_id: any,
      });
      await insert('profiles.person_account_links', {
        id: randomUUID(),
        person_id: ids.doctor,
        user_id: ids.doctorUser,
        link_type_concept_id: PROF.ACCOUNT_LINK_SELF,
        verification_status_concept_id: PROF.ACCOUNT_LINK_VERIFIED,
        status_concept_id: PROF.ACCOUNT_LINK_ACTIVE,
        valid_from: new Date(),
      });
      await insert('practice.practitioner_role_assignments', {
        id: ids.roleA,
        practitioner_profile_id: ids.doctor,
        practice_id: ids.practiceA,
        practice_site_id: ids.siteA,
        role_concept_id: any,
        status_concept_id: PRAC.ROLE_ASSIGNMENT_ACTIVE,
      });

      const membershipsRepo = new TenantMembershipsRepository();
      registration = new IamSupportStaffSelfRegistrationService(
        orm.em.fork(),
        {
          issueRefreshToken: () => ({ raw: 'raw', hash: `hash-${mark}` }),
        } as never,
        new UsersRepository(),
        new CredentialsRepository(),
        new UserGlobalRolesRepository(),
        new SecurityEventsRepository(),
        new EmailVerificationsRepository(),
        new ProfilesRegistrationAdapter(
          new PersonsRepository(),
          new PersonProfilesRepository(),
          undefined as never,
          new PersonAccountLinksRepository(),
          undefined as never,
          undefined as never,
          undefined as never,
          undefined as never,
          undefined as never,
          undefined as never,
          undefined as never,
          undefined as never,
          { assertIsAdministrativeArea: async () => undefined } as never,
          undefined as never,
          undefined as never,
        ),
        new CommonRecordsAdapter(
          new IdentifiersRepository(),
          new ContactPointsRepository(),
          undefined as never,
          undefined as never,
        ),
        { enqueueEmail: async () => undefined },
        new DirectoryRegistrationAdapter(
          membershipsRepo,
          undefined as never,
          undefined as never,
          undefined as never,
          undefined as never,
          undefined as never,
        ),
        quiet as never,
      );
      service = new SupportStaffService(
        orm.em.fork(),
        new SupportLinksRepository(),
        quiet as never,
      );
    });

    afterAll(async () => {
      if (orm) await orm.close(true);
    });

    it('el alta crea la cuenta con el rol SUPPORT_STAFF y el perfil de secretaria', async () => {
      const created = await registration.register({
        nationalId,
        issuerAdministrativeAreaConceptId: any,
        password: 'password123',
        name: 'Rosa',
        lastName: mark,
        email: `${mark.toLowerCase()}@example.test`,
        birthDate: '1992-03-04',
        phone: '+591 70000000',
      });
      expect(created.role).toBe('SUPPORT_STAFF');

      const roles = await all<{ role_concept_id: string }>(
        'select role_concept_id from iam.user_global_roles where user_id = ?',
        [created.userId],
      );
      expect(
        conceptIdsToRoleCodes(roles.map((r) => r.role_concept_id)).sort(),
      ).toEqual(['SUPPORT_STAFF', 'USER']);
      const [profile] = await all(
        'select profile_id from profiles.secretary_profiles where profile_id = ?',
        [created.personId],
      );
      expect(profile).toBeDefined();
      const [seedMembership] = await all<{ tenant_role_concept_id: string }>(
        'select tenant_role_concept_id from directory.tenant_memberships where user_id = ? and tenant_id = ?',
        [created.userId, SEED.tenantId],
      );
      expect(seedMembership.tenant_role_concept_id).toBe(DIR.ROLE_SUPPORT);

      secretary = { id: created.userId, roles: ['USER', 'SUPPORT_STAFF'] };
    });

    it('un segundo alta con el mismo documento responde 409', async () => {
      await expect(
        registration.register({
          nationalId,
          issuerAdministrativeAreaConceptId: any,
          password: 'password123',
          name: 'Otra',
          lastName: mark,
          email: `otra-${mark.toLowerCase()}@example.test`,
          birthDate: '1990-01-01',
          phone: '+591 70000001',
        }),
      ).rejects.toMatchObject({ reason: 'NATIONAL_ID_ALREADY_REGISTERED' });
    });

    it('el catálogo del hospital trae sus pisos y doctores, no los de otro', async () => {
      const catalog = await service.catalogForSupport(secretary, ids.tenantA);
      expect(catalog.floors.map((f) => f.id).sort()).toEqual(
        [ids.floor1, ids.floor2].sort(),
      );
      expect(catalog.practitioners.map((p) => p.id)).toEqual([ids.roleA]);
    });

    it('pedir un piso de otro hospital responde 404', async () => {
      await expect(
        service.request(
          {
            tenantId: ids.tenantA,
            items: [{ targetKind: 'SPACE', careSpaceId: ids.floorB }],
          },
          secretary,
        ),
      ).rejects.toMatchObject({ reason: 'SUPPORT_TARGET_NOT_FOUND' });
    });

    it('pide piso y doctor; sin aceptación no hay acceso', async () => {
      const created = await service.request(
        {
          tenantId: ids.tenantA,
          items: [
            { targetKind: 'SPACE', careSpaceId: ids.floor1 },
            {
              targetKind: 'PRACTITIONER',
              practitionerRoleAssignmentId: ids.roleA,
            },
          ],
        },
        secretary,
      );
      expect(
        created.items.map((i) => [i.targetKind, i.status, i.awaiting]),
      ).toEqual(
        expect.arrayContaining([
          ['SPACE', 'PENDING', 'ORGANIZATION'],
          ['PRACTITIONER', 'PENDING', 'PRACTITIONER'],
        ]),
      );
      const [membership] = await all<{ status_concept_id: string }>(
        'select status_concept_id from directory.tenant_memberships where user_id = ? and tenant_id = ?',
        [secretary.id, ids.tenantA],
      );
      expect(membership.status_concept_id).toBe(DIR.MEMBERSHIP_INVITED);
      expect((await service.myAccess(secretary)).tenants).toEqual([]);
      await expect(
        service.agenda(
          {
            tenantId: ids.tenantA,
            practitionerRoleAssignmentId: ids.roleA,
            from: '2026-11-01T00:00:00Z',
            to: '2026-11-08T00:00:00Z',
          },
          secretary,
        ),
      ).rejects.toMatchObject({ reason: 'SUPPORT_SCOPE_DENIED' });
    });

    it('el hospital acepta el piso y el doctor acepta su vínculo: queda el alcance', async () => {
      const inbox = await service.listForOrganization(ids.tenantA, admin);
      const floorLink = inbox.items.find((i) => i.targetKind === 'SPACE');
      const doctorLink = inbox.items.find(
        (i) => i.targetKind === 'PRACTITIONER',
      );
      expect(floorLink?.targetName).toBe('Piso 1');

      // La secretaria no se acepta sola.
      await expect(
        service.confirmMine(floorLink!.id, secretary),
      ).rejects.toMatchObject({ reason: 'SUPPORT_LINK_NOT_AWAITING_YOU' });

      await service.decideForOrganization(
        ids.tenantA,
        floorLink!.id,
        { decision: 'APPROVED' },
        admin,
      );
      const team = await service.practitionerTeam(doctor);
      expect(team.items.map((i) => i.id)).toEqual([doctorLink!.id]);
      await service.acceptForPractitioner(doctorLink!.id, doctor);

      const [membership] = await all<{
        status_concept_id: string;
        tenant_role_concept_id: string;
      }>(
        'select status_concept_id, tenant_role_concept_id from directory.tenant_memberships where user_id = ? and tenant_id = ?',
        [secretary.id, ids.tenantA],
      );
      expect(membership).toEqual({
        status_concept_id: DIR.MEMBERSHIP_ACTIVE,
        tenant_role_concept_id: DIR.ROLE_SUPPORT,
      });

      const access = await service.myAccess(secretary);
      expect(access.tenants).toHaveLength(1);
      expect(access.tenants[0]).toMatchObject({
        tenantId: ids.tenantA,
        careSpaceIds: [ids.floor1],
        practitioners: [
          expect.objectContaining({ practitionerRoleAssignmentId: ids.roleA }),
        ],
      });
      await expect(
        service.agenda(
          {
            tenantId: ids.tenantA,
            practitionerRoleAssignmentId: ids.roleA,
            from: '2026-11-01T00:00:00Z',
            to: '2026-11-08T00:00:00Z',
          },
          secretary,
        ),
      ).resolves.toEqual({ items: [], count: 0 });
    });

    it('su membresía de apoyo no lee la estructura entera del hospital', async () => {
      const tenantAdmin = new TenantAdministrationService(
        new TenantMembershipsRepository(),
      );
      await expect(
        tenantAdmin.assertCanRead(orm.em.fork(), ids.tenantA, secretary),
      ).rejects.toThrow();
    });

    it('el hospital invita y la secretaria acepta; al terminar todo, la membresía se cierra', async () => {
      const invited = await service.inviteForOrganization(
        ids.tenantA,
        {
          nationalId,
          items: [{ targetKind: 'SPACE', careSpaceId: ids.floor2 }],
        },
        admin,
      );
      expect(invited.items[0]).toMatchObject({
        initiatedBy: 'ORGANIZATION',
        awaiting: 'SUPPORT_STAFF',
      });
      await service.confirmMine(invited.id, secretary);
      expect(
        (await service.myAccess(secretary)).tenants[0].careSpaceIds.sort(),
      ).toEqual([ids.floor1, ids.floor2].sort());

      const live = await service.listEngagementsForOrganization(
        ids.tenantA,
        admin,
      );
      for (const item of live.items) {
        await service.endForOrganization(ids.tenantA, item.id, admin);
      }
      expect((await service.myAccess(secretary)).tenants).toEqual([]);
      const [membership] = await all<{ status_concept_id: string }>(
        'select status_concept_id from directory.tenant_memberships where user_id = ? and tenant_id = ?',
        [secretary.id, ids.tenantA],
      );
      expect(membership.status_concept_id).toBe(DIR.MEMBERSHIP_ENDED);
    });
  },
);
