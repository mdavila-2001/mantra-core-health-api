import { jest } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ArgumentsHost } from '@nestjs/common';
import type { Request, Response } from 'express';
import type { PinoLogger } from 'nestjs-pino';
import type { TracingService } from '../../observability';
import { AllExceptionsFilter } from '../filters/all-exceptions.filter';
import { ErrorCode } from './error-codes';

interface OpenApiDocument {
  paths: Record<
    string,
    Record<string, { responses: Record<string, { $ref?: string }> }>
  >;
  components: {
    schemas: {
      ErrorResponse: {
        properties: {
          code: { enum: string[] };
          reason?: { type: string };
        };
      };
    };
    responses: Record<
      string,
      { content: { 'application/json': { example: { code: string } } } }
    >;
  };
}

const repoRoot = join(
  process.cwd(),
  process.cwd().endsWith('src') ? '..' : '.',
);
const readText = (relative: string): string =>
  readFileSync(join(repoRoot, relative), 'utf8');
const document = JSON.parse(
  readText('openapi/openapi.json'),
) as OpenApiDocument;

/** Lo que el filtro global serializa para una excepción dada. */
function serialize(exception: unknown): { status: number; code: string } {
  const response = {
    setHeader: jest.fn(),
    status: jest.fn(),
    json: jest.fn(),
  };
  response.status.mockReturnValue(response);
  const host = {
    switchToHttp: () => ({
      getResponse: () => response as unknown as Response,
      getRequest: () => ({ headers: {}, url: '/x', method: 'GET' }) as Request,
    }),
  } as unknown as ArgumentsHost;
  new AllExceptionsFilter(
    {
      setContext: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as PinoLogger,
    {
      setAttribute: jest.fn(),
      recordException: jest.fn(),
      addEvent: jest.fn(),
    } as unknown as TracingService,
  ).catch(exception, host);
  const status = response.status.mock.calls[0]?.[0] as number;
  const body = response.json.mock.calls[0]?.[0] as { code: string };
  return { status, code: body.code };
}

/**
 * CO-01 · el envelope `ErrorResponse` publicado admite todo código que el
 * filtro global puede emitir, y el 504 está declarado.
 */
describe('Contrato OpenAPI del envelope de error', () => {
  it('ErrorResponse.code publica exactamente el catálogo ErrorCode', () => {
    const published =
      document.components.schemas.ErrorResponse.properties.code.enum;
    expect([...published].sort()).toEqual(Object.values(ErrorCode).sort());
  });

  it.each([
    ErrorCode.TIMEOUT,
    ErrorCode.CIRCUIT_OPEN,
    ErrorCode.CONCURRENCY_LIMIT,
    ErrorCode.IDENTITY_VERIFICATION_REQUIRED,
  ])('el código operativo %s ya no queda fuera del contrato', (code) => {
    expect(
      document.components.schemas.ErrorResponse.properties.code.enum,
    ).toContain(code);
  });

  it('ErrorResponse declara `reason` (additionalProperties: false lo rechazaría si faltara)', () => {
    expect(document.components.schemas.ErrorResponse.properties.reason).toEqual(
      expect.objectContaining({ type: 'string' }),
    );
  });

  it('SQLSTATE 57014 → 504 / TIMEOUT, y el documento generado lo admite y lo declara', () => {
    const exception = Object.assign(new Error('canceling statement'), {
      code: '57014',
    });

    const { status, code } = serialize(exception);

    expect({ status, code }).toEqual({ status: 504, code: 'TIMEOUT' });
    expect(
      document.components.schemas.ErrorResponse.properties.code.enum,
    ).toContain(code);
    expect(
      document.components.responses.GatewayTimeout.content['application/json']
        .example.code,
    ).toBe(code);
    const operation = document.paths['/iam/auth/login']?.post;
    expect(operation?.responses[String(status)]).toEqual({
      $ref: '#/components/responses/GatewayTimeout',
    });
  });

  it('las rutas de liveness y readiness no declaran 504', () => {
    for (const path of ['/health', '/liveness', '/readiness']) {
      expect(document.paths[path].get.responses['504']).toBeUndefined();
    }
  });

  it('el generador deriva la lista de códigos del catálogo, no de una copia escrita a mano', () => {
    const generator = readText('tools/openapi/generate-openapi.mjs');
    expect(generator).toContain('Object.values(ErrorCode)');
    expect(generator).not.toMatch(
      /'DEPENDENCY_UNAVAILABLE',\s*'INTERNAL',?\s*\]/,
    );
  });
});
