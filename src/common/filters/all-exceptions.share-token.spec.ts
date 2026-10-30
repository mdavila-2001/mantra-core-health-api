import { jest } from '@jest/globals';
import {
  type ArgumentsHost,
  Controller,
  Get,
  GoneException,
  HttpException,
  HttpStatus,
  type INestApplication,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { Request, Response } from 'express';
import type { PinoLogger } from 'nestjs-pino';
import type { TracingService } from '../../observability';
import { ResourceNotFoundException } from '../errors/domain.exception';
import { ERROR_DIAGNOSTICS_ENV } from './error-diagnostics';
import { AllExceptionsFilter } from './all-exceptions.filter';

/** Un token con la forma de los emitidos (43 caracteres base64url), sintético. */
const TOKEN = 'Q2hhbmdlTWVQbGVhc2VUaGlzSXNOb3RBUmVhbFRva2U';

function build(url: string) {
  const logger = { setContext: jest.fn(), warn: jest.fn(), error: jest.fn() };
  const tracing = {
    setAttribute: jest.fn(),
    recordException: jest.fn(),
    addEvent: jest.fn(),
  };
  const response = {
    headersSent: false,
    setHeader: jest.fn(),
    status: jest.fn(),
    json: jest.fn(),
  };
  response.status.mockReturnValue(response);
  const request = { headers: {}, url, method: 'GET' } as Request;
  const host = {
    switchToHttp: () => ({
      getResponse: () => response as unknown as Response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;
  const filter = new AllExceptionsFilter(
    logger as unknown as PinoLogger,
    tracing as unknown as TracingService,
  );
  return { filter, host, response, logger, tracing };
}

/** Todo lo que el filtro escribió en el log, serializado. */
function everythingLogged(logger: ReturnType<typeof build>['logger']): string {
  return JSON.stringify([
    ...logger.warn.mock.calls,
    ...logger.error.mock.calls,
  ]);
}

/**
 * El token del enlace compartido de receta no queda en el log del filtro
 * (S-6, D-6): un 4xx o 5xx de una ruta que lo lleva escribe `[token]`.
 */
describe('AllExceptionsFilter · token del enlace compartido de receta', () => {
  it('un 404 de /public/prescription-shares/<token> no deja el token en el log', () => {
    const { filter, host, logger, response } = build(
      `/public/prescription-shares/${TOKEN}`,
    );
    filter.catch(new ResourceNotFoundException('Enlace no encontrado'), host);

    expect(response.status).toHaveBeenCalledWith(404);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/public/prescription-shares/[token]' }),
      expect.anything(),
    );
    expect(everythingLogged(logger)).not.toContain(TOKEN);
    expect(JSON.stringify(response.json.mock.calls)).not.toContain(TOKEN);
  });

  it('un 410 de /pharmacy/prescription-shares/<token> tampoco', () => {
    const { filter, host, logger } = build(
      `/pharmacy/prescription-shares/${TOKEN}?x=1`,
    );
    filter.catch(new GoneException('Esta receta venció.'), host);

    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/pharmacy/prescription-shares/[token]',
      }),
      expect.anything(),
    );
    expect(everythingLogged(logger)).not.toContain(TOKEN);
  });

  it('un 500 de …/by-token/<token> tampoco', () => {
    const { filter, host, logger } = build(
      `/clinical/prescription-shares/by-token/${TOKEN}`,
    );
    filter.catch(new Error('fallo sintético'), host);

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/clinical/prescription-shares/by-token/[token]',
      }),
      expect.anything(),
    );
    expect(everythingLogged(logger)).not.toContain(TOKEN);
  });

  it('otra ruta se loguea igual que antes', () => {
    const { filter, host, logger } = build(
      '/clinical/prescription-shares/abc/revoke?y=2',
    );
    filter.catch(new ResourceNotFoundException(), host);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/clinical/prescription-shares/abc/revoke',
      }),
      expect.anything(),
    );
  });
  it('el «Cannot GET <ruta>» de una ruta no declarada sale con [token] en log y cuerpo', () => {
    const url = `/pharmacy/prescription-shares/${TOKEN}`;
    const { filter, host, logger, response } = build(url);
    filter.catch(new NotFoundException(`Cannot GET ${url}`), host);

    expect(logger.warn).toHaveBeenCalledWith(
      expect.anything(),
      'Cannot GET /pharmacy/prescription-shares/[token]',
    );
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Cannot GET /pharmacy/prescription-shares/[token]',
      }),
    );
    expect(everythingLogged(logger)).not.toContain(TOKEN);
    expect(JSON.stringify(response.json.mock.calls)).not.toContain(TOKEN);
  });

  it('la mayúscula no la salva: /PUBLIC/Prescription-Shares/<token>', () => {
    const url = `/PUBLIC/Prescription-Shares/${TOKEN}`;
    const { filter, host, logger, response } = build(url);
    filter.catch(new NotFoundException(`Cannot POST ${url}`), host);
    expect(everythingLogged(logger)).not.toContain(TOKEN);
    expect(JSON.stringify(response.json.mock.calls)).not.toContain(TOKEN);
  });

  it('un 5xx con el token en el mensaje llega a la traza con [token]', () => {
    const url = `/public/prescription-shares/${TOKEN}`;
    const { filter, host, tracing } = build(url);
    filter.catch(
      new HttpException(`Falló ${url}`, HttpStatus.SERVICE_UNAVAILABLE),
      host,
    );
    expect(tracing.recordException).toHaveBeenCalledTimes(1);
    const recorded = tracing.recordException.mock.calls[0][0] as Error;
    expect(recorded.message).toBe('Falló /public/prescription-shares/[token]');
    expect(String(recorded.stack)).not.toContain(TOKEN);
  });

  it('un 5xx sin token llega a la traza como la misma excepción', () => {
    const { filter, host, tracing } = build('/health');
    const exception = new HttpException('caído', HttpStatus.BAD_GATEWAY);
    filter.catch(exception, host);
    expect(tracing.recordException).toHaveBeenCalledWith(exception);
  });
});

describe('AllExceptionsFilter · diagnóstico encendido (API_ERROR_DIAGNOSTICS)', () => {
  const previous = process.env[ERROR_DIAGNOSTICS_ENV];

  beforeEach(() => {
    process.env[ERROR_DIAGNOSTICS_ENV] = 'true';
  });

  afterEach(() => {
    if (previous === undefined) delete process.env[ERROR_DIAGNOSTICS_ENV];
    else process.env[ERROR_DIAGNOSTICS_ENV] = previous;
  });

  it('diagnostics.message de un 404 de ruta sale con [token]', () => {
    const url = `/public/prescription-shares/${TOKEN}`;
    const { filter, host, response, logger } = build(url);
    filter.catch(new NotFoundException(`Cannot GET ${url}`), host);

    const body = response.json.mock.calls[0][0] as {
      diagnostics?: { message?: string };
    };
    expect(body.diagnostics?.message).toBe(
      'Cannot GET /public/prescription-shares/[token]',
    );
    expect(JSON.stringify(response.json.mock.calls)).not.toContain(TOKEN);
    expect(everythingLogged(logger)).not.toContain(TOKEN);
  });

  it('el err.message del log y el diagnóstico de un 5xx salen con [token]', () => {
    const url = `/clinical/prescription-shares/by-token/${TOKEN}`;
    const { filter, host, response, logger } = build(url);
    filter.catch(new Error(`fallo sintético en ${url}`), host);

    const [fields] = logger.error.mock.calls[0] as [
      { err: { message?: string } },
    ];
    expect(fields.err.message).toBe(
      'fallo sintético en /clinical/prescription-shares/by-token/[token]',
    );
    const body = response.json.mock.calls[0][0] as {
      diagnostics?: { message?: string };
    };
    expect(body.diagnostics?.message).toBe(
      'fallo sintético en /clinical/prescription-shares/by-token/[token]',
    );
    expect(everythingLogged(logger)).not.toContain(TOKEN);
    expect(JSON.stringify(response.json.mock.calls)).not.toContain(TOKEN);
  });

  it('un mensaje sin token queda igual', () => {
    const { filter, host, response } = build('/iam/users');
    filter.catch(new Error('fallo sintético'), host);
    const body = response.json.mock.calls[0][0] as {
      diagnostics?: { message?: string };
    };
    expect(body.diagnostics?.message).toBe('fallo sintético');
  });
});

@Controller()
class DeclaredShareController {
  @Get('public/prescription-shares/:token')
  read(): { ok: true } {
    return { ok: true };
  }
}

/**
 * Con el router de Nest de verdad: una ruta no declarada que lleva el token
 * (la de la farmacia antes de existir, otro verbo, un segmento de más) da el
 * 404 «Cannot <VERBO> <ruta>» del router, y el token no queda en el log.
 */
describe('AllExceptionsFilter · 404 del router con el token en la ruta', () => {
  const logger = { setContext: jest.fn(), warn: jest.fn(), error: jest.fn() };
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [DeclaredShareController],
    }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    app.useGlobalFilters(
      new AllExceptionsFilter(
        logger as unknown as PinoLogger,
        {
          setAttribute: jest.fn(),
          recordException: jest.fn(),
          addEvent: jest.fn(),
        } as unknown as TracingService,
      ),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => logger.warn.mockClear());

  it.each([
    ['GET', `/pharmacy/prescription-shares/${TOKEN}`],
    ['POST', `/public/prescription-shares/${TOKEN}`],
    ['GET', `/public/prescription-shares/${TOKEN}/extra`],
    ['DELETE', `/clinical/prescription-shares/by-token/${TOKEN}`],
  ])('%s %s', async (verb, url) => {
    const server = request(app.getHttpServer());
    const res =
      verb === 'GET'
        ? await server.get(url)
        : verb === 'POST'
          ? await server.post(url)
          : await server.delete(url);
    expect(res.status).toBe(404);
    expect(String(res.body.message)).toContain('[token]');
    expect(JSON.stringify(res.body)).not.toContain(TOKEN);
    expect(logger.warn).toHaveBeenCalled();
    expect(JSON.stringify(logger.warn.mock.calls)).not.toContain(TOKEN);
  });
});
