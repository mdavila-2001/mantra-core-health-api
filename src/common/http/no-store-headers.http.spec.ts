import {
  Controller,
  ForbiddenException,
  Get,
  Header,
  INestApplication,
  Module,
  Post,
  UseGuards,
  type CanActivate,
} from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Public } from '../auth/public.decorator';
import { NoStoreHeadersModule } from './no-store-headers.module';
import { stripEtagOnNoStore } from './no-store-etag.middleware';
import { PublicCacheInterceptor } from './public-cache.interceptor';
import { PublicCacheStore } from './public-cache.store';

/** Guard que rechaza como lo haría el de autenticación (antes del handler). */
class DenyGuard implements CanActivate {
  /** Siempre rechaza. */
  canActivate(): boolean {
    throw new ForbiddenException('Sin permiso');
  }
}

/** Respuesta con datos de una persona: lo que F3 no quiere en la caché del navegador. */
@Controller('f3-private')
class PrivateController {
  /** Lectura autenticada sin cabecera propia (agenda, bandeja, búsqueda...). */
  @Get('agenda')
  agenda() {
    return { patient: 'Paciente Sintético' };
  }

  /** Búsqueda por POST, como `support-patient-search`. */
  @Post('search')
  search() {
    return { documentNumber: '0000000' };
  }

  /** Descarga que ya declara su propia directiva y no debe degradarse. */
  @Get('download')
  @Header('Cache-Control', 'private, no-store')
  download() {
    return { ok: true };
  }

  /** Recurso privado con caché propia acotada por el handler. */
  @Get('own-private-cache')
  @Header('Cache-Control', 'private, max-age=3600')
  ownPrivateCache() {
    return { ok: true };
  }

  /** Ruta rechazada por un guard antes de llegar al handler. */
  @Get('denied')
  @UseGuards(DenyGuard)
  denied() {
    return { never: true };
  }

  /** Ruta que lanza una excepción propia. */
  @Get('boom')
  boom(): never {
    throw new ForbiddenException('No autorizado');
  }
}

/** Una ficha pública: conserva su caché pública. */
@Controller('f3-public')
class PublicController {
  /** Lectura `@Public()` sin cabecera propia: la pone `PublicCacheInterceptor`. */
  @Public()
  @Get('profile')
  profile() {
    return { name: 'Ficha pública' };
  }

  /** Lectura `@Public()` que declara su propia caché pública. */
  @Public()
  @Get('asset')
  @Header('Cache-Control', 'public, max-age=3600')
  asset() {
    return { name: 'Recurso' };
  }

  /** Escritura `@Public()` (login, por ejemplo): no hay caché pública posible. */
  @Public()
  @Post('login')
  login() {
    return { accessToken: 'sintético' };
  }
}

@Module({
  imports: [NoStoreHeadersModule],
  controllers: [PrivateController, PublicController],
  providers: [
    PublicCacheStore,
    { provide: APP_INTERCEPTOR, useClass: PublicCacheInterceptor },
  ],
})
class FixtureModule {}

describe('F3 · Cache-Control: no-store en respuestas privadas (app HTTP)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [FixtureModule],
    }).compile();
    app = moduleRef.createNestApplication();
    // Same order as main.ts: the ETag guard is registered before init.
    app.use(stripEtagOnNoStore);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET autenticado sin cabecera propia sale con no-store y Pragma', async () => {
    const res = await request(app.getHttpServer())
      .get('/f3-private/agenda')
      .expect(200);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.headers.pragma).toBe('no-cache');
    // api#1242: a no-store response carries no validator.
    expect(res.headers.etag).toBeUndefined();
  });

  it('POST autenticado (búsqueda de pacientes) sale con no-store y Pragma', async () => {
    const res = await request(app.getHttpServer())
      .post('/f3-private/search')
      .expect(201);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.headers.pragma).toBe('no-cache');
  });

  it('no pisa la directiva que un handler privado ya declaró', async () => {
    const download = await request(app.getHttpServer()).get(
      '/f3-private/download',
    );
    expect(download.headers['cache-control']).toBe('private, no-store');

    const own = await request(app.getHttpServer()).get(
      '/f3-private/own-private-cache',
    );
    expect(own.headers['cache-control']).toBe('private, max-age=3600');
  });

  it('un 403 de guard y uno de handler también salen con no-store', async () => {
    const guard = await request(app.getHttpServer())
      .get('/f3-private/denied')
      .expect(403);
    expect(guard.headers['cache-control']).toBe('no-store');

    const handler = await request(app.getHttpServer())
      .get('/f3-private/boom')
      .expect(403);
    expect(handler.headers['cache-control']).toBe('no-store');
  });

  it('una ruta inexistente (404) sale con no-store', async () => {
    const res = await request(app.getHttpServer())
      .get('/f3-private/no-existe')
      .expect(404);
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('un GET @Public() conserva la caché pública de PublicCacheInterceptor', async () => {
    const res = await request(app.getHttpServer())
      .get('/f3-public/profile')
      .expect(200);
    expect(res.headers['cache-control']).toMatch(
      /^public, max-age=\d+, stale-while-revalidate=\d+$/,
    );
    // The ETag is the interceptor's own (sha1 of the body), not the one
    // Express derives in `res.send` after the default `no-store` was dropped.
    expect(res.headers.etag).toMatch(/^W\/"[A-Za-z0-9_-]{27}"$/);
    expect(res.headers.pragma).toBeUndefined();

    // Second read is served from PublicCacheStore (cached branch).
    const cached = await request(app.getHttpServer())
      .get('/f3-public/profile')
      .expect(200);
    expect(cached.headers.etag).toBe(res.headers.etag);

    const revalidated = await request(app.getHttpServer())
      .get('/f3-public/profile')
      .set('If-None-Match', res.headers.etag as string)
      .expect(304);
    expect(revalidated.headers['cache-control']).toMatch(/^public, /);
  });

  it('un GET @Public() con su propia caché pública la conserva', async () => {
    const res = await request(app.getHttpServer())
      .get('/f3-public/asset')
      .expect(200);
    expect(res.headers['cache-control']).toBe('public, max-age=3600');
    expect(res.headers.pragma).toBeUndefined();
  });

  it('un POST @Public() (login) no se cachea: no-store', async () => {
    const res = await request(app.getHttpServer())
      .post('/f3-public/login')
      .expect(201);
    expect(res.headers['cache-control']).toBe('no-store');
  });
});

describe('F3 · cableado en AppModule', () => {
  it('AppModule importa NoStoreHeadersModule (si alguien lo quita, la regla se pierde)', () => {
    // Importar `AppModule` exige la configuración de BD; el cableado se prueba
    // con la app real en el smoke (cabeceras de rutas privadas y públicas).
    const source = readFileSync(
      join(process.cwd(), 'src', 'app.module.ts'),
      'utf8',
    );
    expect(source).toMatch(/imports:\s*\[[\s\S]*\bNoStoreHeadersModule\b/);
  });
});
