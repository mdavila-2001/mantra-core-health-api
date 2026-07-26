import { jest } from '@jest/globals';
// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
import { InternalFilesController } from './internal-files.controller';
import { ScanResult } from '../dto';

describe('InternalFilesController', () => {
  it('delegates scanResult to the service with the version id and dto', async () => {
    const service = { recordScanResult: fn().mockResolvedValue({ id: 'ver-1' }) };
    const controller = new InternalFilesController(service as never);

    const result = await controller.scanResult('ver-1', { result: ScanResult.CLEAN });

    expect(service.recordScanResult).toHaveBeenCalledWith('ver-1', { result: ScanResult.CLEAN });
    expect(result).toEqual({ id: 'ver-1' });
  });
});