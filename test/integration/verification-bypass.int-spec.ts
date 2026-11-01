import request from 'supertest';
import { bootstrapTestApp, bearer, type TestContext } from './harness';

/**
 * Corrección #12/#13 contra la aplicación real: el bypass de verificación
 * DEV/TEST no es un detalle de unidad, es un cambio de qué ve un paciente en
 * la Guía de profesionales — y el flag se lee UNA vez al construir
 * `VerificationBypassService` (durante `moduleRef.compile()`), así que
 * probar ambos estados exige dos apps NestJS reales, cada una con el flag
 * fijado ANTES de arrancar. Ambas comparten la misma base real (no un doble),
 * así que esto es lo único que puede detectar un `listPage`/`where` mal
 * armado que las pruebas unitarias con dobles no verían.
 */
describe('Bypass de verificación (integración)', () => {
  const u = Date.now();
  const originalFlag = process.env.DEV_VERIFICATION_BYPASS;

  afterEach(() => {
    if (originalFlag === undefined) delete process.env.DEV_VERIFICATION_BYPASS;
    else process.env.DEV_VERIFICATION_BYPASS = originalFlag;
  });

  /** Da de alta un profesional (queda con verificación PENDIENTE: nadie la corrió). */
  async function createUnverifiedPractitioner(
    ctx: TestContext,
    suffix: string,
  ): Promise<string> {
    const res = await request(ctx.app.getHttpServer())
      .post('/profiles/practitioners')
      .set(bearer(ctx.adminToken))
      .send({
        practitionerCode: `BYP-${u}-${suffix}`,
        displayName: `Dr. Sin Verificar ${suffix}`,
        licenseNumber: `LIC-BYP-${u}-${suffix}`,
        credentialNumber: `CRED-BYP-${u}-${suffix}`,
      })
      .expect(201);
    return res.body.profileId as string;
  }

  // Desde 34e788b7b (03/09/2026, «la guía publica el padrón y MUESTRA la
  // verificación») la guía ya no excluye a quien no verificó: lo publica con
  // `verified: false`, y es la tarjeta la que dibuja el sello. Con el bypass
  // apagado el profesional pendiente aparece, pero NUNCA como verificado.
  it('con el bypass apagado, un profesional recién dado de alta aparece en la guía como NO verificado', async () => {
    delete process.env.DEV_VERIFICATION_BYPASS;
    const ctx = await bootstrapTestApp();
    try {
      const profileId = await createUnverifiedPractitioner(ctx, 'apagado');

      const guia = await request(ctx.app.getHttpServer())
        .get('/profiles/practitioners')
        .set(bearer(ctx.adminToken))
        .query({ limit: 200 })
        .expect(200);

      const fila = (
        guia.body.items as Array<{ profileId: string; verified: boolean }>
      ).find((item) => item.profileId === profileId);
      expect(fila).toBeDefined();
      expect(fila?.verified).toBe(false);
    } finally {
      await ctx.app.close();
    }
  });

  it('con el bypass activo, el mismo profesional sin verificar SÍ aparece en la guía', async () => {
    process.env.DEV_VERIFICATION_BYPASS = 'true';
    const ctx = await bootstrapTestApp();
    try {
      const profileId = await createUnverifiedPractitioner(ctx, 'activo');

      const guia = await request(ctx.app.getHttpServer())
        .get('/profiles/practitioners')
        .set(bearer(ctx.adminToken))
        .query({ limit: 200 })
        .expect(200);

      const ids = (guia.body.items as Array<{ profileId: string }>).map(
        (item) => item.profileId,
      );
      expect(ids).toContain(profileId);
    } finally {
      await ctx.app.close();
    }
  });
});
