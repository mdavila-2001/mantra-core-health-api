import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { SeedBootstrapService } from './seed-bootstrap.service';

/** Los seeds de la cadena, en el orden en que el orquestador los corre. */
/**
 * Los pasos de la cadena, **en el orden real** de `pasosDependientes()`.
 *
 * Para armar los dobles alcanzaría con la lista sin ordenar, pero esta constante
 * es lo primero que se lee al abrir el archivo y se toma como la documentación
 * del orden: tenerla desalineada —`clinicalForms` figuraba al final cuando corre
 * antes del administrador de arranque— enseña un orden que no existe.
 */
const STEPS = [
  'terminology',
  'dynamicEnums',
  'patientPortalProxy',
  'glossary',
  'boGeography',
  'legalEntityTypes',
  'affiliationCatalogs',
  'boOccupations',
  'boProfessions',
  'boEmployers',
  'boliviaFacilities',
  'boliviaInsurance',
  'boliviaFeeSchedule',
  'vademecum',
  'messaging',
  'audioAssets',
  'stickerPack',
  'identityVerification',
  'clinicalRoles',
  'platformPermissions',
  'clinicalForms',
  'bootstrapAdmin',
  'providerAccounts',
  'people',
  'directoryNetworks',
  'practiceDefaultServices',
] as const;

type Step = (typeof STEPS)[number];

/** Logger mínimo que registra lo que se le pidió escribir. */
function loggerFake() {
  return {
    setContext: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

/**
 * Arma el orquestador con todos los seeds mockeados.
 *
 * @param fallan - Nombres de los seeds que deben lanzar en esta corrida.
 */
function build(fallan: Step[] = []) {
  const logger = loggerFake();
  const double = Object.fromEntries(
    STEPS.map((nombre) => [
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
  ) as Record<Step, { run: jest.Mock<() => Promise<unknown>> }>;

  const service = new SeedBootstrapService(
    double.terminology as never,
    double.dynamicEnums as never,
    double.patientPortalProxy as never,
    double.glossary as never,
    double.boGeography as never,
    double.legalEntityTypes as never,
    double.affiliationCatalogs as never,
    double.boOccupations as never,
    double.boProfessions as never,
    double.boEmployers as never,
    double.boliviaFacilities as never,
    double.boliviaInsurance as never,
    double.boliviaFeeSchedule as never,
    double.messaging as never,
    double.audioAssets as never,
    double.stickerPack as never,
    double.vademecum as never,
    double.identityVerification as never,
    double.clinicalRoles as never,
    double.platformPermissions as never,
    double.bootstrapAdmin as never,
    double.providerAccounts as never,
    double.clinicalForms as never,
    double.practiceDefaultServices as never,
    double.people as never,
    double.directoryNetworks as never,
    logger as never,
  );

  return { service, dobles: double, logger };
}

/** Los pasos de contenido, que `SEED_CONTENT_ON_BOOT=false` saltea. */
const CONTENT: readonly Step[] = [
  'glossary',
  'boliviaFacilities',
  'boliviaInsurance',
  'boliviaFeeSchedule',
  'stickerPack',
  'vademecum',
  'clinicalForms',
  'providerAccounts',
  'people',
  'directoryNetworks',
  'practiceDefaultServices',
];

/** Los pasos de núcleo, que corren siempre que la cadena corra. */
const CORE: readonly Step[] = STEPS.filter(
  (nombre) => !CONTENT.includes(nombre),
);

describe('SeedBootstrapService', () => {
  const environmentOriginal = process.env.SEED_ON_BOOT;
  const contentOriginal = process.env.SEED_CONTENT_ON_BOOT;

  afterEach(() => {
    if (environmentOriginal === undefined) delete process.env.SEED_ON_BOOT;
    else process.env.SEED_ON_BOOT = environmentOriginal;

    if (contentOriginal === undefined) delete process.env.SEED_CONTENT_ON_BOOT;
    else process.env.SEED_CONTENT_ON_BOOT = contentOriginal;
  });

  describe('interruptor de arranque', () => {
    it('con SEED_ON_BOOT=false no toca la base, y lo dice', async () => {
      process.env.SEED_ON_BOOT = 'false';
      const { service, dobles, logger } = build();

      await service.onApplicationBootstrap();

      for (const nombre of STEPS) {
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
      const { service, dobles } = build();

      await service.onApplicationBootstrap();

      expect(dobles.terminology.run).toHaveBeenCalledTimes(1);
      expect(dobles.clinicalForms.run).toHaveBeenCalledTimes(1);
    });
  });

  describe('interruptor de contenido', () => {
    it('con SEED_CONTENT_ON_BOOT=false corre el núcleo y saltea el contenido', async () => {
      process.env.SEED_CONTENT_ON_BOOT = 'false';
      const { service, dobles } = build();

      const summary = await service.run();

      for (const nombre of CORE) {
        expect(dobles[nombre].run).toHaveBeenCalledTimes(1);
      }
      for (const nombre of CONTENT) {
        expect(dobles[nombre].run).not.toHaveBeenCalled();
      }
      expect(summary.ok).toBe(CORE.length);
      expect(summary.steps).toHaveLength(CORE.length);
    });

    it('lo salteado se informa aparte y no cuenta como omitido', async () => {
      // La diferencia importa: `failed` significa «se intentó y explotó», y
      // teñir de rojo un arranque que hizo exactamente lo que se le pidió
      // convierte el resumen en ruido que nadie mira.
      process.env.SEED_CONTENT_ON_BOOT = 'false';
      const { service, logger } = build();

      const summary = await service.run();

      expect(summary.failed).toBe(0);
      expect(summary.skippedContent).toBe(CONTENT.length);
      expect(logger.error).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'seed.step.skipped' }),
        expect.stringContaining('SEED_CONTENT_ON_BOOT=false'),
      );
    });

    it('el administrador de arranque es núcleo: se siembra igual', async () => {
      // Es el punto del modo: una instalación sin catálogos de negocio pero con
      // alguien que pueda entrar a cargarlos.
      process.env.SEED_CONTENT_ON_BOOT = 'false';
      const { service, dobles } = build();

      await service.run();

      expect(dobles.bootstrapAdmin.run).toHaveBeenCalledTimes(1);
    });

    it('sin la variable declarada corre la cadena entera', async () => {
      delete process.env.SEED_CONTENT_ON_BOOT;
      const { service, dobles } = build();

      const summary = await service.run();

      for (const nombre of STEPS) {
        expect(dobles[nombre].run).toHaveBeenCalledTimes(1);
      }
      // Sin salteados el resumen conserva la forma que tenía antes del flag.
      expect(summary.skippedContent).toBeUndefined();
    });
  });

  describe('run', () => {
    it('corre los diecisiete seeds y los resume', async () => {
      const { service } = build();

      const summary = await service.run();

      expect(summary.ok).toBe(STEPS.length);
      expect(summary.failed).toBe(0);
      expect(summary.steps).toHaveLength(STEPS.length);
    });

    it('deja registro de cada paso aunque no haya insertado nada', async () => {
      // Este es el corazón del arreglo: antes los seeds sólo hablaban si
      // insertaban, así que un seed ausente de la imagen y uno que corrió sin
      // trabajo se veían exactamente igual — ninguno de los dos escribía.
      const { service, logger } = build();

      await service.run();

      const loggedInSteps = logger.info.mock.calls.filter(
        ([contexto]) => (contexto as { event?: string }).event === 'seed.step',
      );
      expect(loggedInSteps).toHaveLength(STEPS.length);
      for (const [contexto] of loggedInSteps) {
        expect(contexto).toMatchObject({ inserted: 0, failed: false });
        expect((contexto as { tookMs: number }).tookMs).toBeGreaterThanOrEqual(
          0,
        );
      }
    });

    it('un seed dependiente que falla no corta la cadena, pero se cuenta', async () => {
      const { service, dobles } = build(['glossary']);

      const summary = await service.run();

      expect(dobles.clinicalForms.run).toHaveBeenCalledTimes(1);
      expect(summary.failed).toBe(1);
      expect(summary.ok).toBe(STEPS.length - 1);
      expect(summary.steps.find((step) => step.failed)?.name).toBe(
        'glosario médico',
      );
    });

    it('si falla el catálogo de conceptos, los once dependientes ni se intentan', async () => {
      const { service, dobles, logger } = build(['terminology']);

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
      const { service, logger } = build(['messaging']);

      await service.run();

      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'seed.summary', failed: 1 }),
        expect.stringContaining('1 omitidos'),
      );
    });

    it('suma las filas de seeds que reportan con formas distintas', async () => {
      // Cada servicio devuelve su propia forma: `{ inserted }`, `{ templates,
      // specialties }`, contadores por nivel. El resumen suma los numéricos.
      const { service, dobles } = build();
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
      const { service, dobles } = build();
      dobles.glossary.run.mockResolvedValue({
        valueSets: 0,
        terms: 0,
        relationships: 0,
        orphanRelationships: 1,
      });

      const summary = await service.run();

      const step = summary.steps.find(
        (candidate) => candidate.name === 'glosario médico',
      );
      expect(step?.inserted).toBe(0);
      expect(summary.inserted).toBe(0);
    });

    it('un seed que no devuelve contadores se registra sin inventar un número', async () => {
      const { service, dobles } = build();
      dobles.bootstrapAdmin.run.mockResolvedValue(undefined);

      const summary = await service.run();

      const step = summary.steps.find(
        (candidate) => candidate.name === 'administrador de arranque',
      );
      expect(step?.inserted).toBeNull();
      expect(step?.failed).toBe(false);
    });
  });
});
