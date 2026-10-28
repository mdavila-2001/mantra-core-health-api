import { jest } from '@jest/globals';
import { LockMode } from '@mikro-orm/core';
import {
  Artifacts,
  ChangeRequests,
  Deployments,
  HealthChecks,
  HealthIncidents,
  MaintenanceWindows,
  ResilienceExercises,
  Runbooks,
  ServiceComponents,
  ToolRegistry,
} from '../entities';
import { OpsIncidentsRepository } from './ops-incidents.repository';
import { OpsPracticesRepository } from './ops-practices.repository';
import { OpsReleasesRepository } from './ops-releases.repository';
import { OpsReliabilityRepository } from './ops-reliability.repository';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const T1 = '00000000-0000-4000-8000-0000000000a1';
const ID = '00000000-0000-4000-8000-0000000000d4';

/** `em` cuyo `findOne` registra cómo se acota cada búsqueda. */
function em() {
  return { findOne: mockFn().mockResolvedValue(null) } as any;
}

describe('Repositorios de platform_ops · búsquedas acotadas al tenant (POPS-01)', () => {
  it('los agregados de releases se buscan por id + tenant, nunca sólo por id', async () => {
    const repo = new OpsReleasesRepository();
    const e = em();

    await repo.findComponentById(e, ID, T1);
    await repo.findWindowForUpdate(e, ID, T1);
    await repo.findChangeRequestForUpdate(e, ID, T1);
    await repo.findArtifactById(e, ID, T1);
    await repo.findDeploymentById(e, ID, T1);
    await repo.findDeploymentForUpdate(e, ID, T1);

    expect(e.findOne).toHaveBeenNthCalledWith(1, ServiceComponents, {
      id: ID,
      tenantId: T1,
    });
    expect(e.findOne).toHaveBeenNthCalledWith(
      2,
      MaintenanceWindows,
      { id: ID, tenantId: T1 },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
    expect(e.findOne).toHaveBeenNthCalledWith(
      3,
      ChangeRequests,
      { id: ID, tenantId: T1 },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
    expect(e.findOne).toHaveBeenNthCalledWith(4, Artifacts, {
      id: ID,
      tenantId: T1,
    });
    expect(e.findOne).toHaveBeenNthCalledWith(5, Deployments, {
      id: ID,
      tenantId: T1,
    });
    expect(e.findOne).toHaveBeenNthCalledWith(
      6,
      Deployments,
      { id: ID, tenantId: T1 },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  });

  it('la herramienta es del catálogo compartido (sin tenant) o del tenant, no de otro', async () => {
    const repo = new OpsReleasesRepository();
    const e = em();

    await repo.findToolById(e, ID, T1);

    expect(e.findOne).toHaveBeenCalledWith(ToolRegistry, {
      id: ID,
      $or: [{ tenantId: T1 }, { tenantId: null }],
    });
  });

  it('los agregados de observabilidad y prácticas se buscan por id + tenant', async () => {
    const incidents = new OpsIncidentsRepository();
    const practices = new OpsPracticesRepository();
    const reliability = new OpsReliabilityRepository();
    const e = em();

    await incidents.findHealthCheckById(e, ID, T1);
    await incidents.findIncidentById(e, ID, T1);
    await incidents.findIncidentForUpdate(e, ID, T1);
    await incidents.findDeploymentInTenant(e, ID, T1);
    await practices.findRunbookForUpdate(e, ID, T1);
    await practices.findExerciseForUpdate(e, ID, T1);
    await practices.findChangeRequestInTenant(e, ID, T1);
    await reliability.findIncidentInTenant(e, ID, T1);

    const scoped = { id: ID, tenantId: T1 };
    expect(e.findOne).toHaveBeenNthCalledWith(1, HealthChecks, scoped);
    expect(e.findOne).toHaveBeenNthCalledWith(2, HealthIncidents, scoped);
    expect(e.findOne).toHaveBeenNthCalledWith(3, HealthIncidents, scoped, {
      lockMode: LockMode.PESSIMISTIC_WRITE,
    });
    expect(e.findOne).toHaveBeenNthCalledWith(4, Deployments, scoped);
    expect(e.findOne).toHaveBeenNthCalledWith(5, Runbooks, scoped, {
      lockMode: LockMode.PESSIMISTIC_WRITE,
    });
    expect(e.findOne).toHaveBeenNthCalledWith(6, ResilienceExercises, scoped, {
      lockMode: LockMode.PESSIMISTIC_WRITE,
    });
    expect(e.findOne).toHaveBeenNthCalledWith(7, ChangeRequests, scoped);
    expect(e.findOne).toHaveBeenNthCalledWith(8, HealthIncidents, scoped);
  });
});
