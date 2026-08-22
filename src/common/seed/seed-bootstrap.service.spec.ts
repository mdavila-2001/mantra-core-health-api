import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { SeedBootstrapService } from './seed-bootstrap.service';

/** Los trece seeds de la cadena, en el orden en que el orquestador los corre. */
const PASOS = [
  'terminology',
  'dynamicEnums',
  'glossary',
  'boGeography',
  'vademecum',
  'messaging',
  'audioAssets',
  'identityVerification',
  'clinicalRoles',
  'platformPermissions',
  'bootstrapAdmin',
  'providerAccounts',
  'clinicalForms',
] as const;

type Paso = (typeof PASOS)[number];

/** Logger mínimo que registra lo que se le pidió escribir. */
function loggerFalso() {
  return {
    setContext: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

/**
 * Arma el orquestador con los trece seeds mockeados.
 *
 * @param fallan - Nombres de los seeds que deben lanzar en esta corrida.
 */
function armar(fallan: Paso[] = []) {
  const logger = loggerFalso();
  const dobles = Object.fromEntries(
    PASOS.map((nombre) => [
      nombre,
      {
        run: fallan.includes(nombre)
          ? jest
              .fn<() => Promise<unknown>>()
              .mockRejectedValue(new Error(`explotó ${nombre}`))
          : jest
              .fn<() => Promise<unknown>>()
              .mockResolvedValue({ inserted: 0 }),
      },
    ]),
  ) as Record<Paso, { run: jest.Mock<() => Promise<unknown>> }>;

  const service = new SeedBootstrapService(
    dobles.terminology as never,
    dobles.dynamicEnums as never,
    dobles.glossary as never,
    dobles.boGeography as never,
    dobles.messaging as never,
    dobles.audioAssets as never,
    dobles.vademecum as never,
    dobles.identityVerification as never,
    dobles.clinicalRoles as never,
    dobles.platformPermissions as never,
    dobles.bootstrapAdmin as never,
    dobles.providerAccounts as never,
    dobles.clinicalForms as never,
    logger as never,
  );

  return { service, dobles, logger };
}

describe('SeedBootstrapService', () => {
  const entornoOriginal = process.env.SEED_ON_BOOT;

  afterEach(() => {
    if (entornoOriginal === undefined) delete process.env.SEED_ON_BOOT;
    else process.env.SEED_ON_BOOT = entornoOriginal;
  });

  describe('interruptor de arranque', () => {
    it('con SEED_ON_BOOT=false no toca la base, y lo dice', async () => {
      process.env.SEED_ON_BOOT = 'false';
      const { service, dobles, logger } = armar();

      await service.onApplicationBootstrap();

      for (const nombre of PASOS) {
        expect(dobles[nombre].run).not.toHaveBeenCalled();
      }
      // El aviso importa tanto como no sembrar: una base sin catálogo deja la
      // aplicación en pie e incapaz de persistir, y ese silencio ya costó caro.
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'seed.boot.disabled' }),
        expect.stringContaining('SEED_ON_BOOT=false'),
      );
    });

    it('sin la variable declarada siembra igual que antes del flag', async () => {
      delete process.env.SEED_ON_BOOT;
      const { service, dobles } = armar();

      await service.onApplicationBootstrap();

      expect(dobles.terminology.run).toHaveBeenCalledTimes(1);
      expect(dobles.clinicalForms.run).toHaveBeenCalledTimes(1);
    });
  });

  describe('run', () => {
    it('corre los trece seeds y los resume', async () => {
      const { service } = armar();

      const summary = await service.run();

      expect(summary.ok).toBe(PASOS.length);
      expect(summary.failed).toBe(0);
      expect(summary.steps).toHaveLength(PASOS.length);
    });

    it('deja registro de cada paso aunque no haya insertado nada', async () => {
      // Este es el corazón del arreglo: antes los seeds sólo hablaban si
      // insertaban, así que un seed ausente de la imagen y uno que corrió sin
      // trabajo se veían exactamente igual — ninguno de los dos escribía.
      const { service, logger } = armar();

      await service.run();

      const pasosLogueados = logger.info.mock.calls.filter(
        ([contexto]) => (contexto as { event?: string }).event === 'seed.step',
      );
      expect(pasosLogueados).toHaveLength(PASOS.length);
      for (const [contexto] of pasosLogueados) {
        expect(contexto).toMatchObject({ inserted: 0, failed: false });
        expect((contexto as { tookMs: number }).tookMs).toBeGreaterThanOrEqual(
          0,
        );
      }
    });

    it('un seed dependiente que falla no corta la cadena, pero se cuenta', async () => {
      const { service, dobles } = armar(['glossary']);

      const summary = await service.run();

      expect(dobles.clinicalForms.run).toHaveBeenCalledTimes(1);
      expect(summary.failed).toBe(1);
      expect(summary.ok).toBe(PASOS.length - 1);
      expect(summary.steps.find((paso) => paso.failed)?.name).toBe(
        'glosario médico',
      );
    });

    it('si falla el catálogo de conceptos, los once dependientes ni se intentan', async () => {
      const { service, dobles, logger } = armar(['terminology']);

      const summary = await service.run();

      expect(dobles.dynamicEnums.run).not.toHaveBeenCalled();
      expect(summary.steps).toHaveLength(1);
      expect(summary.failed).toBe(1);
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'seed.aborted' }),
        expect.stringContaining('catálogo de terminología'),
      );
    });

    it('el resumen sube a error cuando quedó algo omitido', async () => {
      const { service, logger } = armar(['messaging']);

      await service.run();

      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'seed.summary', failed: 1 }),
        expect.stringContaining('1 omitidos'),
      );
    });

    it('suma las filas de seeds que reportan con formas distintas', async () => {
      // Cada servicio devuelve su propia forma: `{ inserted }`, `{ templates,
      // specialties }`, contadores por nivel. El resumen suma los numéricos.
      const { service, dobles } = armar();
      dobles.clinicalForms.run.mockResolvedValue({
        templates: 15,
        specialties: 10,
      });
      dobles.dynamicEnums.run.mockResolvedValue({
        valueSets: 52,
        options: 314,
      });

      const summary = await service.run();

      expect(summary.inserted).toBe(391);
    });

    it('no cuenta como fila lo que el seed declara como omitido', async () => {
      // Caso real: el glosario devuelve `orphanRelationships`, relaciones cuyo
      // destino no existe y que por eso NO se insertan. Sumarlas hacía que una
      // corrida sin trabajo informara «1 filas».
      const { service, dobles } = armar();
      dobles.glossary.run.mockResolvedValue({
        valueSets: 0,
        terms: 0,
        relationships: 0,
        orphanRelationships: 1,
      });

      const summary = await service.run();

      const paso = summary.steps.find(
        (candidato) => candidato.name === 'glosario médico',
      );
      expect(paso?.inserted).toBe(0);
      expect(summary.inserted).toBe(0);
    });

    it('un seed que no devuelve contadores se registra sin inventar un número', async () => {
      const { service, dobles } = armar();
      dobles.bootstrapAdmin.run.mockResolvedValue(undefined);

      const summary = await service.run();

      const paso = summary.steps.find(
        (candidato) => candidato.name === 'administrador de arranque',
      );
      expect(paso?.inserted).toBeNull();
      expect(paso?.failed).toBe(false);
    });
  });
});
