import { jest } from '@jest/globals';
// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
import { ForbiddenException } from '@nestjs/common';
import { TenantAdministrationService } from './tenant-administration.service';
import { DIR } from '../directory.concepts';

describe('TenantAdministrationService', () => {
  /**
   * Construye el sistema bajo prueba con dependencias controladas.
   * @returns Resultado de build.
   */
  function build(membership: unknown = null) {
    const membershipsRepo = {
      findActiveByUserTenant: fn().mockResolvedValue(membership),
    };
    const service = new TenantAdministrationService(membershipsRepo as never);
    return { service, membershipsRepo, tx: {} as never };
  }

  it('deja pasar al OWNER de la organización sin rol global', async () => {
    // Es el caso que motivó el servicio: el auto-registro crea al owner con rol global
    // `USER`, y su poder viene de esta membresía. Sin esto, una organización recién
    // registrada no podía gestionar a su propia gente.
    const { service, tx } = build({ tenantRoleConceptId: DIR.ROLE_OWNER });

    await expect(
      service.assertCanAdminister(tx, 'tenant-1', {
        id: 'u1',
        roles: ['USER'],
      }),
    ).resolves.toBeUndefined();
  });

  it('deja pasar al ADMIN de la organización', async () => {
    const { service, tx } = build({ tenantRoleConceptId: DIR.ROLE_ADMIN });

    await expect(
      service.assertCanAdminister(tx, 'tenant-1', { id: 'u1', roles: [] }),
    ).resolves.toBeUndefined();
  });

  it('rechaza al STAFF del propio tenant', async () => {
    // Pertenecer a la organización no es administrarla: un auxiliar no da de alta personal.
    const { service, tx } = build({ tenantRoleConceptId: DIR.ROLE_STAFF });

    await expect(
      service.assertCanAdminister(tx, 'tenant-1', { id: 'u1', roles: [] }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rechaza a quien no tiene membresía activa en ese tenant', async () => {
    // El aislamiento entre organizaciones: ser owner de la propia no da permisos sobre
    // la de al lado, porque la consulta es por tenant.
    const { service, tx } = build(null);

    await expect(
      service.assertCanAdminister(tx, 'tenant-ajeno', { id: 'u1', roles: [] }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('deja pasar a la plataforma sin consultar membresías', async () => {
    const { service, membershipsRepo, tx } = build(null);

    for (const role of ['SECURITY_ADMIN', 'SUPERADMIN']) {
      await expect(
        service.assertCanAdminister(tx, 'tenant-1', {
          id: 'admin',
          roles: [role],
        }),
      ).resolves.toBeUndefined();
    }
    // Ni siquiera pregunta: el rol de plataforma no depende de pertenecer al tenant, y
    // consultarlo sería una query por request que nunca cambia la decisión.
    expect(membershipsRepo.findActiveByUserTenant).not.toHaveBeenCalled();
  });

  describe('administersByMembership (sin atajo de plataforma)', () => {
    it('es verdadero para el OWNER y el ADMIN activos del tenant', async () => {
      for (const role of [DIR.ROLE_OWNER, DIR.ROLE_ADMIN]) {
        const { service, tx, membershipsRepo } = build({
          tenantRoleConceptId: role,
        });

        await expect(
          service.administersByMembership(tx, 'tenant-1', {
            id: 'u1',
            roles: ['USER'],
          }),
        ).resolves.toBe(true);
        expect(membershipsRepo.findActiveByUserTenant).toHaveBeenCalled();
      }
    });

    it('es falso para el STAFF y para quien no pertenece al tenant', async () => {
      const staff = build({ tenantRoleConceptId: DIR.ROLE_STAFF });
      const stranger = build(null);

      await expect(
        staff.service.administersByMembership(staff.tx, 'tenant-1', {
          id: 'u1',
          roles: [],
        }),
      ).resolves.toBe(false);
      await expect(
        stranger.service.administersByMembership(stranger.tx, 'tenant-1', {
          id: 'u1',
          roles: [],
        }),
      ).resolves.toBe(false);
    });

    it('un rol de plataforma no alcanza: `canAdminister` sí lo deja pasar, esta consulta no', async () => {
      // `isPlatform` no mira `scopedRoles`; por eso quien necesita respetar el ámbito de un rol
      // acotado a otro tenant pregunta sólo por la membresía.
      const { service, tx } = build(null);
      const platform = { id: 'u1', roles: ['SECURITY_ADMIN'] };

      await expect(
        service.canAdminister(tx, 'tenant-1', platform),
      ).resolves.toBe(true);
      await expect(
        service.administersByMembership(tx, 'tenant-1', platform),
      ).resolves.toBe(false);
    });
  });

  describe('assertCanChangeOwnership (escalón de dueños)', () => {
    it('deja pasar al OWNER del tenant', async () => {
      const { service, tx } = build({ tenantRoleConceptId: DIR.ROLE_OWNER });

      await expect(
        service.assertCanChangeOwnership(tx, 'tenant-1', {
          id: 'u1',
          roles: ['USER'],
        }),
      ).resolves.toBeUndefined();
    });

    it('rechaza al ADMIN: administrar no es poseer', async () => {
      // La escalación que la regla existe para impedir: sin esto, un ADMIN podía
      // auto-promoverse a OWNER o dar de baja a quien lo nombró.
      const { service, tx } = build({ tenantRoleConceptId: DIR.ROLE_ADMIN });

      await expect(
        service.assertCanChangeOwnership(tx, 'tenant-1', {
          id: 'u1',
          roles: [],
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rechaza a quien no tiene membresía activa en ese tenant', async () => {
      const { service, tx } = build(null);

      await expect(
        service.assertCanChangeOwnership(tx, 'tenant-ajeno', {
          id: 'u1',
          roles: [],
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('deja pasar a la plataforma sin consultar membresías', async () => {
      const { service, membershipsRepo, tx } = build(null);

      for (const role of ['SECURITY_ADMIN', 'SUPERADMIN']) {
        await expect(
          service.assertCanChangeOwnership(tx, 'tenant-1', {
            id: 'admin',
            roles: [role],
          }),
        ).resolves.toBeUndefined();
      }
      expect(membershipsRepo.findActiveByUserTenant).not.toHaveBeenCalled();
    });
  });

  describe('assertCanRead', () => {
    it('deja leer al STAFF de la organización', async () => {
      // Leer es el escalón por debajo de administrar: exigir OWNER/ADMIN aquí
      // dejaría al personal sin poder ver la organización en la que trabaja.
      const { service, tx } = build({ tenantRoleConceptId: DIR.ROLE_STAFF });

      await expect(
        service.assertCanRead(tx, 'tenant-1', { id: 'u1', roles: [] }),
      ).resolves.toBeUndefined();
    });

    it('deja leer a la plataforma sin membresía', async () => {
      const { service, tx } = build(null);

      await expect(
        service.assertCanRead(tx, 'tenant-1', {
          id: 'u1',
          roles: ['SECURITY_ADMIN'],
        }),
      ).resolves.toBeUndefined();
    });

    it('rechaza a la secretaria: su membresía no lee la organización entera', async () => {
      // Ve sólo las sedes, servicios, pisos y doctores de sus vínculos
      // aceptados (`GET /me/support-access`), no la estructura completa.
      const { service, tx } = build({ tenantRoleConceptId: DIR.ROLE_SUPPORT });

      await expect(
        service.assertCanRead(tx, 'tenant-1', {
          id: 'u1',
          roles: ['USER', 'SUPPORT_STAFF'],
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rechaza a quien no pertenece a la organización', async () => {
      // Es lo que impide que un listado se convierta en una fuga entre organizaciones.
      const { service, tx } = build(null);

      await expect(
        service.assertCanRead(tx, 'tenant-1', { id: 'u1', roles: ['USER'] }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('resuelve la membresía en ese tenant, no en cualquiera', async () => {
      const { service, membershipsRepo, tx } = build({
        tenantRoleConceptId: DIR.ROLE_STAFF,
      });

      await service.assertCanRead(tx, 'tenant-1', { id: 'u1', roles: [] });

      expect(membershipsRepo.findActiveByUserTenant).toHaveBeenCalledWith(
        tx,
        'u1',
        'tenant-1',
        expect.anything(),
      );
    });
  });

  describe('rol de plataforma acotado a un tenant (#1241)', () => {
    // Un `SECURITY_ADMIN`/`SUPERADMIN` concedido sólo en el tenant A figura en
    // `roles`, pero `scopedRoles` lo limita a A: fuera de A no es plataforma.
    const scopedTo = (role: string, tenantId: string) => ({
      id: 'admin-a',
      roles: [role],
      scopedRoles: { [tenantId]: [role] },
    });
    const PLATFORM = ['SECURITY_ADMIN', 'SUPERADMIN'];

    it('acotado a A NO administra, ni lee, ni cambia dueños de B sin membresía', async () => {
      const { service, tx } = build(null);

      for (const role of PLATFORM) {
        const actor = scopedTo(role, 'tenant-a');
        await expect(
          service.canAdminister(tx, 'tenant-b', actor),
        ).resolves.toBe(false);
        await expect(
          service.assertCanAdminister(tx, 'tenant-b', actor),
        ).rejects.toBeInstanceOf(ForbiddenException);
        await expect(
          service.assertCanRead(tx, 'tenant-b', actor),
        ).rejects.toBeInstanceOf(ForbiddenException);
        await expect(
          service.assertCanChangeOwnership(tx, 'tenant-b', actor),
        ).rejects.toBeInstanceOf(ForbiddenException);
      }
    });

    it('acotado a A cae a la membresía en B: la decide el tenant B, no el rol', async () => {
      // Sin el atajo, cuenta lo que el actor sea en B: STAFF lee pero no administra.
      const { service, membershipsRepo, tx } = build({
        tenantRoleConceptId: DIR.ROLE_STAFF,
      });
      const actor = scopedTo('SECURITY_ADMIN', 'tenant-a');

      await expect(service.canAdminister(tx, 'tenant-b', actor)).resolves.toBe(
        false,
      );
      await expect(
        service.assertCanRead(tx, 'tenant-b', actor),
      ).resolves.toBeUndefined();
      expect(membershipsRepo.findActiveByUserTenant).toHaveBeenCalledWith(
        tx,
        'admin-a',
        'tenant-b',
        expect.anything(),
      );
    });

    it('acotado a A sí administra, lee y cambia dueños de A sin consultar membresías', async () => {
      const { service, membershipsRepo, tx } = build(null);

      for (const role of PLATFORM) {
        const actor = scopedTo(role, 'tenant-a');
        await expect(
          service.canAdminister(tx, 'tenant-a', actor),
        ).resolves.toBe(true);
        await expect(
          service.assertCanAdminister(tx, 'tenant-a', actor),
        ).resolves.toBeUndefined();
        await expect(
          service.assertCanRead(tx, 'tenant-a', actor),
        ).resolves.toBeUndefined();
        await expect(
          service.assertCanChangeOwnership(tx, 'tenant-a', actor),
        ).resolves.toBeUndefined();
      }
      expect(membershipsRepo.findActiveByUserTenant).not.toHaveBeenCalled();
    });

    it('global (sin ámbito) administra A y B, aunque tenga otros roles acotados', async () => {
      const { service, membershipsRepo, tx } = build(null);

      for (const role of PLATFORM) {
        const actor = {
          id: 'admin-global',
          roles: [role, 'CLINICIAN'],
          // Otro código acotado no vuelve acotado al de plataforma.
          scopedRoles: { 'tenant-a': ['CLINICIAN'] },
        };
        for (const tenantId of ['tenant-a', 'tenant-b']) {
          await expect(
            service.assertCanAdminister(tx, tenantId, actor),
          ).resolves.toBeUndefined();
          await expect(
            service.assertCanRead(tx, tenantId, actor),
          ).resolves.toBeUndefined();
          await expect(
            service.assertCanChangeOwnership(tx, tenantId, actor),
          ).resolves.toBeUndefined();
        }
      }
      expect(membershipsRepo.findActiveByUserTenant).not.toHaveBeenCalled();
    });
  });
});
