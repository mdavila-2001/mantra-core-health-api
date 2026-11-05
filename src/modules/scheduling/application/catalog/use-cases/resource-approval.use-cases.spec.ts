import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';

import { CONCEPTS, ResourceNotFoundException } from '../../../../../common';
import { CatalogAccess } from '../support/catalog-access';
import { ListMyResourcesUseCase } from './list-my-resources.use-case';
import { UpdateResourceUseCase } from './update-resource.use-case';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const owner = {
  id: 'u-1',
  roles: ['PRACTITIONER'],
  practitionerProfileId: 'hp-propio',
} as never;

function ownResource(overrides: Record<string, unknown> = {}) {
  return {
    id: 'res-1',
    name: 'Consultorio propio',
    resourceRefType: 'health_practitioner_profiles',
    resourceRefId: 'hp-propio',
    stateConceptId: CONCEPTS.STATE_ACTIVE,
    requiresApproval: true,
    ...overrides,
  };
}

describe('UpdateResourceUseCase (v4.2.88) — si la agenda confirma sola', () => {
  function build(resource: unknown) {
    const tx = { flush: mockFn() };
    const em = { transactional: mockFn((cb: any) => cb(tx)) };
    const catalogRepo = {
      findResourceById: mockFn().mockResolvedValue(resource),
    };
    const access = new CatalogAccess({} as never);
    return {
      tx,
      useCase: new UpdateResourceUseCase(
        em as never,
        catalogRepo as never,
        access,
      ),
    };
  }

  it('el profesional apaga la aceptación de su propia agenda', async () => {
    const resource = ownResource();
    const { tx, useCase } = build(resource);

    const res = await useCase.execute(
      'res-1',
      { requiresApproval: false },
      owner,
    );

    expect(res).toEqual({
      id: 'res-1',
      name: 'Consultorio propio',
      requiresApproval: false,
    });
    expect(resource.requiresApproval).toBe(false);
    expect(tx.flush).toHaveBeenCalled();
  });

  it('lo que no se manda se conserva', async () => {
    const resource = ownResource({ requiresApproval: false });
    const { useCase } = build(resource);

    const res = await useCase.execute('res-1', {}, owner);

    expect(res.requiresApproval).toBe(false);
  });

  it('otro profesional no toca una agenda ajena', async () => {
    const { tx, useCase } = build(ownResource());

    await expect(
      useCase.execute('res-1', { requiresApproval: false }, {
        id: 'u-2',
        roles: ['PRACTITIONER'],
        practitionerProfileId: 'hp-ajeno',
      } as never),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(tx.flush).not.toHaveBeenCalled();
  });

  it('la administración de agenda sí puede, sobre cualquiera', async () => {
    const { useCase } = build(ownResource());

    const res = await useCase.execute('res-1', { requiresApproval: false }, {
      id: 'u-admin',
      roles: ['SCHEDULING_ADMIN'],
    } as never);

    expect(res.requiresApproval).toBe(false);
  });

  it('un recurso que no existe es 404', async () => {
    const { useCase } = build(null);

    await expect(
      useCase.execute('no-existe', { requiresApproval: false }, owner),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });
});

describe('ListMyResourcesUseCase (v4.2.88) — mis agendas', () => {
  function build(resources: unknown[]) {
    const em = { fork: mockFn(() => ({})) };
    const agendaRepo = { findResources: mockFn().mockResolvedValue(resources) };
    return {
      agendaRepo,
      useCase: new ListMyResourcesUseCase(em as never, agendaRepo as never),
    };
  }

  it('devuelve sólo las agendas activas de quien pregunta, con cómo reciben solicitudes', async () => {
    const { agendaRepo, useCase } = build([
      ownResource(),
      ownResource({
        id: 'res-2',
        name: 'Agenda ajena',
        resourceRefId: 'hp-ajeno',
      }),
      ownResource({
        id: 'sala',
        name: 'Sala 1',
        resourceRefType: 'care_spaces',
      }),
    ]);

    const res = await useCase.execute('t-1', owner);

    expect(res.items).toEqual([
      { id: 'res-1', name: 'Consultorio propio', requiresApproval: true },
    ]);
    expect(agendaRepo.findResources).toHaveBeenCalledWith(expect.anything(), {
      tenantId: 't-1',
      stateConceptId: CONCEPTS.STATE_ACTIVE,
    });
  });

  it('sin perfil profesional no hay nada suyo que configurar', async () => {
    const { agendaRepo, useCase } = build([ownResource()]);

    const res = await useCase.execute('t-1', {
      id: 'u-3',
      roles: ['SCHEDULING_ADMIN'],
    } as never);

    expect(res.items).toEqual([]);
    expect(agendaRepo.findResources).not.toHaveBeenCalled();
  });
});
