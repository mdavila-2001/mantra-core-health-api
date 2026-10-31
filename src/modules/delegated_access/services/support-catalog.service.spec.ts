import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { SupportCatalogService } from './support-catalog.service';
import { DELEG } from '../delegated_access.concepts';
import { STATUS } from './concept-maps';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = 'tenant-1';

/** Arma el servicio con la estructura de un consultorio pequeño. */
function build(
  opts: { engaged?: boolean; requested?: boolean; expired?: boolean } = {},
) {
  const em = { fork: mockFn().mockReturnValue({}) };
  const catalog = {
    doctors: mockFn().mockResolvedValue([
      {
        roleAssignmentId: 'ra-perez',
        practitionerProfileId: 'prof-perez',
        displayName: 'Andrés Pérez',
        practiceSiteId: 'site-central',
      },
      {
        roleAssignmentId: 'ra-mendez',
        practitionerProfileId: 'prof-mendez',
        displayName: 'Carla Méndez',
        healthcareServiceId: 'svc-interna',
      },
    ]),
    services: mockFn().mockResolvedValue([
      { id: 'svc-consulta', name: 'Consulta', practiceSiteId: 'site-central' },
      { id: 'svc-eco', name: 'Ecografía', practiceSiteId: 'site-norte' },
      { id: 'svc-interna', name: 'Medicina interna' },
    ]),
    locations: mockFn().mockResolvedValue([
      {
        id: 'site-central',
        kind: 'SITE',
        name: 'Central',
        code: 'C',
        practiceSiteId: 'site-central',
      },
      {
        id: 'sala-103',
        kind: 'SPACE',
        name: '103',
        code: 'A-P1-103',
        parentId: 'site-central',
        practiceSiteId: 'site-central',
      },
      {
        id: 'sala-n101',
        kind: 'SPACE',
        name: 'N101',
        code: 'N101',
        parentId: 'site-norte',
        practiceSiteId: 'site-norte',
      },
    ]),
    locationAssignments: mockFn().mockResolvedValue([
      { roleAssignmentId: 'ra-perez', careSpaceId: 'sala-103' },
      { roleAssignmentId: 'ra-mendez', careSpaceId: 'sala-n101' },
    ]),
  };
  const access = {
    findEngagements: mockFn().mockResolvedValue(
      opts.engaged
        ? [{ assignment: { statusConceptId: STATUS.ACTIVE }, tenantId: TENANT }]
        : [],
    ),
  };
  const requests = {
    findByRequester: mockFn().mockResolvedValue(
      opts.requested
        ? [
            {
              tenantId: TENANT,
              statusConceptId: DELEG.ENGAGEMENT_STATUS_PENDING,
              expiresAt: new Date(Date.now() + (opts.expired ? -1000 : 1000)),
            },
          ]
        : [],
    ),
  };
  const scope = { resolveTenant: mockFn().mockReturnValue(TENANT) };
  const service = new SupportCatalogService(
    em as any,
    catalog as any,
    access as any,
    requests as any,
    scope as any,
  );
  return { service, catalog };
}

describe('SupportCatalogService', () => {
  it('cada doctor trae solo las combinaciones espacio ↔ servicio en las que atiende', async () => {
    const { service } = build();
    const res = await service.forActiveTenant();
    const perez = res.doctors.find(
      (d) => d.practitionerProfileId === 'prof-perez',
    );
    // Pérez atiende en la sala 103 de Central: sirven los servicios de Central
    // y los de toda la organización, no la Ecografía de Norte.
    expect(perez?.placements).toEqual([
      { careSpaceId: 'sala-103', healthcareServiceId: 'svc-consulta' },
      { careSpaceId: 'sala-103', healthcareServiceId: 'svc-interna' },
    ]);
  });

  it('un doctor con servicio propio no cruza con otros servicios', async () => {
    const { service } = build();
    const res = await service.forActiveTenant();
    const mendez = res.doctors.find(
      (d) => d.practitionerProfileId === 'prof-mendez',
    );
    expect(mendez?.placements).toEqual([
      { careSpaceId: 'sala-n101', healthcareServiceId: 'svc-interna' },
    ]);
  });

  it('devuelve servicios y ubicaciones de la organización', async () => {
    const { service } = build();
    const res = await service.forActiveTenant();
    expect(res.tenantId).toBe(TENANT);
    expect(res.services).toHaveLength(3);
    expect(res.locations.map((l) => l.kind)).toEqual([
      'SITE',
      'SPACE',
      'SPACE',
    ]);
  });

  it('M3: quien no tiene vínculo ni solicitud pendiente en la organización recibe 403 y no su estructura', async () => {
    const { service, catalog } = build();
    await expect(service.forPerson('u1', TENANT)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(catalog.doctors).not.toHaveBeenCalled();
  });

  it('M3: una solicitud VENCIDA ya no abre el catálogo', async () => {
    const { service } = build({ requested: true, expired: true });
    await expect(service.forPerson('u1', TENANT)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('con un vínculo activo lee el catálogo', async () => {
    const { service } = build({ engaged: true });
    await expect(service.forPerson('u1', TENANT)).resolves.toMatchObject({
      tenantId: TENANT,
    });
  });

  it('con una solicitud pendiente y vigente también lo lee', async () => {
    const { service } = build({ requested: true });
    await expect(service.forPerson('u1', TENANT)).resolves.toMatchObject({
      tenantId: TENANT,
    });
  });

  it('M3: la persona recibe lo mínimo: sin perfil profesional ni sede interna del doctor', async () => {
    const { service } = build({ engaged: true });
    const res = await service.forPerson('u1', TENANT);
    for (const doctor of res.doctors) {
      expect(doctor.practitionerProfileId).toBeUndefined();
      expect(doctor.practiceSiteId).toBeUndefined();
      expect(doctor.practitionerRoleAssignmentId).toBeDefined();
    }
  });
});
