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
      service.assertCanAdminister(tx, 'tenant-1', { id: 'u1', roles: ['USER'] }),
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
        service.assertCanAdminister(tx, 'tenant-1', { id: 'admin', roles: [role] }),
      ).resolves.toBeUndefined();
    }
    // Ni siquiera pregunta: el rol de plataforma no depende de pertenecer al tenant, y
    // consultarlo sería una query por request que nunca cambia la decisión.
    expect(membershipsRepo.findActiveByUserTenant).not.toHaveBeenCalled();
  });
});
