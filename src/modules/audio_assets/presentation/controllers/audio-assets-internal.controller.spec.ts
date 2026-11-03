import { jest } from '@jest/globals';
import { AudioAssetsInternalController } from './audio-assets-internal.controller';

const fn = (): any => (jest.fn as any)().mockResolvedValue({ ok: true });

describe('AudioAssetsInternalController', () => {
  it('delegates status, generation and maintenance operations', async () => {
    const generation = { prepare: fn(), generated: fn(), failed: fn() };
    const pregenerate = { execute: fn() };
    const maintenance = {
      status: fn(),
      verify: fn(),
      garbageCollect: fn(),
      deprecate: fn(),
    };
    const controller = new AudioAssetsInternalController(
      generation as any,
      pregenerate as any,
      maintenance as any,
    );
    const actor = { id: 'system-1', roles: ['SYSTEM'] } as any;
    const generatedDto = {
      storageKey: 'audio/key',
      checksum: 'checksum',
    } as any;
    const failedDto = { reason: 'provider-error' } as any;

    await controller.status();
    await controller.pregenerateAssets(
      { templateKeys: ['welcome'] } as any,
      actor,
    );
    await controller.verify({});
    await controller.verify({ limit: 20 });
    await controller.garbageCollect({});
    await controller.garbageCollect({ limit: 10 });
    await controller.deprecate('asset-1');
    await controller.prepare('asset-1');
    await expect(
      controller.generated('asset-1', generatedDto),
    ).resolves.toEqual({ ok: true });
    await expect(controller.failed('asset-1', failedDto)).resolves.toEqual({
      ok: true,
    });

    expect(maintenance.status).toHaveBeenCalledWith();
    expect(pregenerate.execute).toHaveBeenCalledWith(actor, ['welcome']);
    expect(maintenance.verify.mock.calls).toEqual([[250], [20]]);
    expect(maintenance.garbageCollect.mock.calls).toEqual([[100], [10]]);
    expect(maintenance.deprecate).toHaveBeenCalledWith('asset-1');
    expect(generation.prepare).toHaveBeenCalledWith('asset-1');
    expect(generation.generated).toHaveBeenCalledWith({
      assetId: 'asset-1',
      ...generatedDto,
    });
    expect(generation.failed).toHaveBeenCalledWith({
      assetId: 'asset-1',
      ...failedDto,
    });
  });
});
