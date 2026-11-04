import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { FileCategory, FileSensitivity } from '../../common/dto';
import { LabPortalUploadsService } from './lab-portal-uploads.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const LAB = 'lab-1';
const ORDER = '0b6a3f0e-1c1d-4d5e-8f9a-000000000001';
const actor = { id: 'user-1' } as any;
const MAX = 20;

function build() {
  const reads = { assertUploadable: mockFn(async () => ({})) };
  const writes = {
    attach: mockFn(async (_t: string, _o: string, fileId: string) => ({
      id: fileId,
    })),
  };
  const files = { upload: mockFn(async () => ({ id: 'file-1' })) };
  const fileRecords = { softDelete: mockFn(async () => ({})) };
  const logger = { setContext: mockFn(), info: mockFn(), error: mockFn() };
  const service = new LabPortalUploadsService(
    { fork: () => ({}) } as any,
    reads as any,
    writes as any,
    files as any,
    fileRecords as any,
    logger as any,
  );
  return { service, reads, writes, files, fileRecords };
}

const start = (size: number) => ({
  fileName: 'hemograma.pdf',
  contentType: 'application/pdf',
  sizeBytes: size,
  orderId: ORDER,
  note: ' revisar ',
});

describe('LabPortalUploadsService', () => {
  const previous = process.env.FILE_STORAGE_MAX_SIZE_BYTES;
  beforeEach(() => {
    process.env.FILE_STORAGE_MAX_SIZE_BYTES = String(MAX);
  });
  afterEach(() => {
    if (previous === undefined) delete process.env.FILE_STORAGE_MAX_SIZE_BYTES;
    else process.env.FILE_STORAGE_MAX_SIZE_BYTES = previous;
  });

  it('start: requires an uploadable order of the tenant and splits by the max size', async () => {
    const t = build();
    const session = await t.service.start(LAB, start(15));
    expect(t.reads.assertUploadable).toHaveBeenCalledWith(
      expect.anything(),
      LAB,
      ORDER,
    );
    expect(session).toMatchObject({
      chunkSizeBytes: MAX,
      totalParts: 1,
      receivedParts: [],
    });
  });

  it('start: a declared size over the configured max is 422', async () => {
    const t = build();
    await expect(t.service.start(LAB, start(MAX + 1))).rejects.toBeInstanceOf(
      PreconditionFailedException,
    );
    expect(t.reads.assertUploadable).not.toHaveBeenCalled();
  });

  it('start: an order that is not processed propagates the 409', async () => {
    const t = build();
    t.reads.assertUploadable.mockRejectedValueOnce(new ConflictException('no'));
    await expect(t.service.start(LAB, start(5))).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('parts: wrong index or wrong size is 400', async () => {
    const t = build();
    const { uploadId } = await t.service.start(LAB, start(5));
    expect(() => t.service.putPart(LAB, uploadId, 1, Buffer.alloc(5))).toThrow(
      BadRequestException,
    );
    expect(() => t.service.putPart(LAB, uploadId, 0, Buffer.alloc(4))).toThrow(
      BadRequestException,
    );
  });

  it("sessions are isolated per tenant: another tenant's upload is 404", async () => {
    const t = build();
    const { uploadId } = await t.service.start(LAB, start(5));
    expect(() =>
      t.service.putPart('other', uploadId, 0, Buffer.alloc(5)),
    ).toThrow(ResourceNotFoundException);
    await expect(
      t.service.complete('other', uploadId, actor),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    t.service.abort('other', uploadId);
    t.service.putPart(LAB, uploadId, 0, Buffer.from('%PDF-'));
  });

  it('complete: missing parts is 409 with their indexes', async () => {
    const t = build();
    const { uploadId } = await t.service.start(LAB, start(5));
    const error: any = await t.service
      .complete(LAB, uploadId, actor)
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ConflictException);
    expect(error.details).toEqual({ missingParts: [0] });
  });

  it('complete: stores the joined bytes through the file pipeline and attaches them', async () => {
    process.env.FILE_STORAGE_MAX_SIZE_BYTES = '100';
    const t = build();
    const { uploadId } = await t.service.start(LAB, {
      ...start(6),
      sizeBytes: 6,
    });
    t.service.putPart(LAB, uploadId, 0, Buffer.from('%PDF-1'));
    const result = await t.service.complete(LAB, uploadId, actor);
    expect(t.files.upload).toHaveBeenCalledWith(
      {
        originalname: 'hemograma.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('%PDF-1'),
      },
      { category: FileCategory.DOCUMENT, sensitivity: FileSensitivity.PHI },
      actor,
    );
    expect(t.writes.attach).toHaveBeenCalledWith(
      LAB,
      ORDER,
      'file-1',
      'revisar',
      actor,
    );
    expect(result).toEqual({ id: 'file-1' });
    // The session is closed: completing again is 404.
    await expect(
      t.service.complete(LAB, uploadId, actor),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('abort closes the session', async () => {
    const t = build();
    const { uploadId } = await t.service.start(LAB, start(5));
    t.service.abort(LAB, uploadId);
    expect(() => t.service.putPart(LAB, uploadId, 0, Buffer.alloc(5))).toThrow(
      ResourceNotFoundException,
    );
  });

  it('complete: a second concurrent call is 409 and the file is stored once', async () => {
    const t = build();
    const { uploadId } = await t.service.start(LAB, start(5));
    t.service.putPart(LAB, uploadId, 0, Buffer.from('%PDF-'));
    const [first, second] = await Promise.allSettled([
      t.service.complete(LAB, uploadId, actor),
      t.service.complete(LAB, uploadId, actor),
    ]);
    expect(first.status).toBe('fulfilled');
    expect(second).toMatchObject({ status: 'rejected' });
    expect((second as PromiseRejectedResult).reason).toBeInstanceOf(
      ConflictException,
    );
    expect(t.files.upload).toHaveBeenCalledTimes(1);
    expect(t.writes.attach).toHaveBeenCalledTimes(1);
  });

  it('complete: while completing, parts and abort are refused', async () => {
    const t = build();
    const { uploadId } = await t.service.start(LAB, start(5));
    t.service.putPart(LAB, uploadId, 0, Buffer.from('%PDF-'));
    const pending = t.service.complete(LAB, uploadId, actor);
    expect(() => t.service.putPart(LAB, uploadId, 0, Buffer.alloc(5))).toThrow(
      ConflictException,
    );
    expect(() => t.service.abort(LAB, uploadId)).toThrow(ConflictException);
    await pending;
  });

  it('complete: if attach fails the stored file is discarded and the session stays retryable', async () => {
    const t = build();
    const { uploadId } = await t.service.start(LAB, start(5));
    t.service.putPart(LAB, uploadId, 0, Buffer.from('%PDF-'));
    t.writes.attach.mockRejectedValueOnce(new Error('db down'));
    await expect(t.service.complete(LAB, uploadId, actor)).rejects.toThrow(
      'db down',
    );
    expect(t.fileRecords.softDelete).toHaveBeenCalledWith('file-1', actor);
    // The parts survived: the retry succeeds without re-sending them.
    await expect(t.service.complete(LAB, uploadId, actor)).resolves.toEqual({
      id: 'file-1',
    });
  });

  it('complete: a failed compensation does not mask the attach error', async () => {
    const t = build();
    const { uploadId } = await t.service.start(LAB, start(5));
    t.service.putPart(LAB, uploadId, 0, Buffer.from('%PDF-'));
    t.writes.attach.mockRejectedValueOnce(new Error('db down'));
    t.fileRecords.softDelete.mockRejectedValueOnce(new Error('gone'));
    await expect(t.service.complete(LAB, uploadId, actor)).rejects.toThrow(
      'db down',
    );
  });

  describe('expired sessions sweep', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    it('drops expired sessions on a timer and clears it on destroy', async () => {
      const t = build();
      t.service.onModuleInit();
      const { uploadId } = await t.service.start(LAB, start(5));
      t.service.putPart(LAB, uploadId, 0, Buffer.from('%PDF-'));
      jest.advanceTimersByTime(66 * 60 * 1000);
      expect((t.service as any).sessions.size).toBe(0);
      t.service.onModuleDestroy();
      expect(jest.getTimerCount()).toBe(0);
    });
  });
});
