import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { LakehouseController } from './lakehouse.controller';
import { ResearchController } from './research.controller';

const actor = { id: 'user-1', roles: ['PLATFORM_ADMIN'] } as any;
const ID = '11111111-1111-1111-1111-111111111111';

describe('LakehouseController', () => {
  /**
   * Construye el sistema bajo prueba con dependencias controladas.
   * @returns Resultado de build.
   */
  function build() {
    const catalogService = {
      defineZone: mockFn(async () => ({ id: ID })),
      registerCatalog: mockFn(async () => ({ id: ID })),
      publishProductVersion: mockFn(async () => ({ id: ID })),
      registerDataset: mockFn(async () => ({ id: ID })),
    };
    const transformationService = {
      runTransformation: mockFn(async () => ({ id: ID })),
      ingestCurated: mockFn(async () => ({ deidentificationRunId: ID })),
      runQualityCheck: mockFn(async () => ({ id: ID })),
    };
    return {
      controller: new LakehouseController(
        catalogService as any,
        transformationService as any,
      ),
      catalogService,
      transformationService,
    };
  }

  it('delega la definición de la zona (UC-63-01)', async () => {
    const d = build();
    const dto = { code: 'curated' } as any;

    await d.controller.defineZone(dto, actor);

    expect(d.catalogService.defineZone).toHaveBeenCalledWith(dto, actor);
  });

  it('delega el registro del catálogo (UC-63-02)', async () => {
    const d = build();
    const dto = { code: 'glue' } as any;

    await d.controller.registerCatalog(dto, actor);

    expect(d.catalogService.registerCatalog).toHaveBeenCalledWith(dto, actor);
  });

  it('delega la publicación con el id de producto (UC-63-03)', async () => {
    const d = build();
    const dto = { version: '1.0.0' } as any;

    await d.controller.publishProductVersion(ID, dto, actor);

    expect(d.catalogService.publishProductVersion).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delega el registro del dataset (UC-63-04)', async () => {
    const d = build();
    const dto = { tableName: 'encounters' } as any;

    await d.controller.registerDataset(dto, actor);

    expect(d.catalogService.registerDataset).toHaveBeenCalledWith(dto, actor);
  });

  it('delega la corrida con el id de definición (UC-63-05)', async () => {
    const d = build();
    const dto = { partitions: [] } as any;

    await d.controller.runTransformation(ID, dto, actor);

    expect(d.transformationService.runTransformation).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delega la ingesta curada (UC-63-07)', async () => {
    const d = build();
    const dto = { targetDatasetId: ID } as any;

    await d.controller.ingestCurated(dto, actor);

    expect(d.transformationService.ingestCurated).toHaveBeenCalledWith(
      dto,
      actor,
    );
  });

  it('delega la corrida de calidad con el id de dataset (UC-63-08)', async () => {
    const d = build();
    const dto = { evaluatedRecordCount: '10' } as any;

    await d.controller.runQualityCheck(ID, dto, actor);

    expect(d.transformationService.runQualityCheck).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });
});

describe('ResearchController', () => {
  /**
   * Construye el sistema bajo prueba con dependencias controladas.
   * @returns Resultado de build.
   */
  function build() {
    const releaseService = {
      defineCohort: mockFn(async () => ({ id: ID })),
      requestRelease: mockFn(async () => ({ id: ID })),
      approveRelease: mockFn(async () => ({ id: ID })),
      revokeRelease: mockFn(async () => ({ id: ID })),
    };
    return {
      controller: new ResearchController(releaseService as any),
      releaseService,
    };
  }

  it('delega la cohorte con el id de proyecto (UC-63-09)', async () => {
    const d = build();
    const dto = { cohortCode: 'c1' } as any;

    await d.controller.defineCohort(ID, dto, actor);

    expect(d.releaseService.defineCohort).toHaveBeenCalledWith(ID, dto, actor);
  });

  it('delega la solicitud de release (UC-63-10)', async () => {
    const d = build();
    const dto = { purposeOfUseCode: 'RESEARCH' } as any;

    await d.controller.requestRelease(dto, actor);

    expect(d.releaseService.requestRelease).toHaveBeenCalledWith(dto, actor);
  });

  it('delega la aprobación con el id de solicitud (UC-63-11)', async () => {
    const d = build();
    const dto = { contentHash: 'h' } as any;

    await d.controller.approveRelease(ID, dto, actor);

    expect(d.releaseService.approveRelease).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delega la revocación con el id de solicitud (UC-63-12)', async () => {
    const d = build();
    const dto = { expired: true } as any;

    await d.controller.revokeRelease(ID, dto, actor);

    expect(d.releaseService.revokeRelease).toHaveBeenCalledWith(ID, dto, actor);
  });
});
