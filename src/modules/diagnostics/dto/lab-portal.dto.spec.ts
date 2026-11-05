import { describe, expect, it } from '@jest/globals';
import { createGlobalValidationPipe } from '../../../common/http/validation-pipe';
import { LabOrderTransitionDto } from './lab-portal-orders.dto';
import {
  LabResultFileQueryDto,
  LabResultWithdrawalDto,
} from './lab-portal-results.dto';
import { LabResultUploadStartDto } from './lab-portal-uploads.dto';

const pipe = createGlobalValidationPipe();
const run = (metatype: any, value: unknown, type: 'body' | 'query' = 'body') =>
  pipe.transform(value, { type, metatype });

describe('laboratory portal DTOs (global ValidationPipe)', () => {
  it('a transition accepts the four steps only', async () => {
    await expect(
      run(LabOrderTransitionDto, { action: 'PROCESS' }),
    ).resolves.toEqual({
      action: 'PROCESS',
    });
    await expect(
      run(LabOrderTransitionDto, { action: 'UPLOAD' }),
    ).rejects.toThrow();
    await expect(
      run(LabOrderTransitionDto, { action: 'REJECT', tenantId: 'x' }),
    ).rejects.toThrow();
  });

  it("the file query reads 'false' as false and refuses free text in the URL", async () => {
    const parsed = await run(
      LabResultFileQueryDto,
      { includeWithdrawn: 'false', kind: 'PDF' },
      'query',
    );
    expect(parsed).toMatchObject({ includeWithdrawn: false, kind: 'PDF' });
    expect(
      (await run(LabResultFileQueryDto, { includeWithdrawn: 'true' }, 'query'))
        .includeWithdrawn,
    ).toBe(true);
    await expect(
      run(LabResultFileQueryDto, { q: 'ana' }, 'query'),
    ).rejects.toThrow();
  });

  it('an upload needs an order and a positive size', async () => {
    const ok = {
      fileName: 'h.pdf',
      contentType: 'application/pdf',
      sizeBytes: 10,
      orderId: '0b6a3f0e-1c1d-4d5e-8f9a-000000000001',
      note: null,
      notify: true,
    };
    await expect(run(LabResultUploadStartDto, ok)).resolves.toMatchObject({
      sizeBytes: 10,
    });
    await expect(
      run(LabResultUploadStartDto, { ...ok, orderId: null }),
    ).rejects.toThrow();
    await expect(
      run(LabResultUploadStartDto, { ...ok, sizeBytes: 0 }),
    ).rejects.toThrow();
  });

  it('a withdrawal needs a non-blank reason', async () => {
    await expect(
      run(LabResultWithdrawalDto, { reason: '   ' }),
    ).rejects.toThrow();
    await expect(
      run(LabResultWithdrawalDto, { reason: ' error ' }),
    ).resolves.toEqual({
      reason: 'error',
    });
  });
});
