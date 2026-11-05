import { describe, expect, it, jest } from '@jest/globals';
import {
  BadRequestException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { Readable } from 'node:stream';
import {
  DiagnosticsLabUploadsController,
  assertOctetStream,
  readRawBody,
} from './diagnostics-lab-uploads.controller';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const ID = '0b6a3f0e-1c1d-4d5e-8f9a-000000000001';

/** A request-like stream carrying `chunks` with the given content type. */
function fakeReq(contentType: string | undefined, chunks: Buffer[] = []): any {
  const req: any = Readable.from(chunks);
  req.headers = contentType ? { 'content-type': contentType } : {};
  return req;
}

describe('assertOctetStream', () => {
  it('accepts application/octet-stream, with parameters or casing', () => {
    expect(() =>
      assertOctetStream(fakeReq('application/octet-stream')),
    ).not.toThrow();
    expect(() =>
      assertOctetStream(fakeReq('Application/Octet-Stream; charset=binary')),
    ).not.toThrow();
  });

  it.each(['application/json', 'text/plain', undefined])(
    'rejects %s with 415',
    (type) => {
      expect(() => assertOctetStream(fakeReq(type))).toThrow(
        UnsupportedMediaTypeException,
      );
    },
  );
});

describe('readRawBody', () => {
  it('reads the stream up to the limit', async () => {
    const req = fakeReq('application/octet-stream', [
      Buffer.from('ab'),
      Buffer.from('cd'),
    ]);
    await expect(readRawBody(req, 4)).resolves.toEqual(Buffer.from('abcd'));
  });

  it('returns a body a parser already left as a Buffer', async () => {
    const req = fakeReq('application/octet-stream');
    req.body = Buffer.from('xyz');
    await expect(readRawBody(req, 10)).resolves.toEqual(Buffer.from('xyz'));
  });

  it('refuses more bytes than declared', async () => {
    const req = fakeReq('application/octet-stream', [Buffer.from('abcdef')]);
    await expect(readRawBody(req, 3)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('does not hang when the body was already consumed by another parser', async () => {
    const req = fakeReq('application/json', [Buffer.from('{"a":1}')]);
    req.body = { a: 1 };
    // Drain the stream like the JSON parser would.
    req.resume();
    await new Promise((resolve) => req.on('end', resolve));
    await expect(readRawBody(req, 100)).rejects.toBeInstanceOf(
      UnsupportedMediaTypeException,
    );
  });
});

describe('DiagnosticsLabUploadsController.putPart', () => {
  it('answers 415 before looking at the session or reading the body', async () => {
    const uploads = { expectedPartSize: mockFn(), putPart: mockFn() };
    const controller = new DiagnosticsLabUploadsController(uploads as any);
    const req = fakeReq('application/json', [Buffer.from('{}')]);
    await expect(controller.putPart(ID, 0, req)).rejects.toBeInstanceOf(
      UnsupportedMediaTypeException,
    );
    expect(uploads.expectedPartSize).not.toHaveBeenCalled();
    expect(uploads.putPart).not.toHaveBeenCalled();
  });
});
