import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { SeedBootstrapService, countInserted } from './seed-bootstrap.service';
import { SeedCoreState } from './seed-core.state';

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
  'telemetryUxHeatmap',
  'glossary',
  'boGeography',
  'adminDivisions',
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
  'boMedicalSpecialties',
  'bootstrapAdmin',
  'providerAccounts',
  'insurerAccounts',
  'people',
  'directoryNetworks',
  'practiceDefaultServices',
  'qaFlows',
  'admissionRequirements',
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
 * @param fail - Nombres de los seeds que deben lanzar en esta corrida.
 */
function build(
  fail: Step[] = [],
  coreState?: SeedCoreState,
  extras: {
    padronOrganizations?: { run: jest.Mock<() => Promise<unknown>> };
    padronOrgAdmins?: { run: jest.Mock<() => Promise<unknown>> };
    searchIndex?: {
      reindexAll: jest.Mock<
        (opts?: { recreate?: boolean }) => Promise<unknown>
      >;
    };
  } = {},
) {
  const logger = loggerFake();
  const double = Object.fromEntries(
    STEPS.map((name) => [
      name,
      {
        run: fail.includes(name)
          ? jest
              .fn<() => Promise<unknown>>()
              .mockRejectedValue(new Error(`explotó ${name}`))
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
    double.telemetryUxHeatmap as never,
    double.glossary as never,
    double.boGeography as never,
    double.adminDivisions as never,
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
    double.insurerAccounts as never,
    double.clinicalForms as never,
    double.boMedicalSpecialties as never,
    double.practiceDefaultServices as never,
    double.people as never,
    double.directoryNetworks as never,
    double.qaFlows as never,
    double.admissionRequirements as never,
    logger as never,
    coreState,
    extras.padronOrganizations as never,
    extras.padronOrgAdmins as never,
    extras.searchIndex as never,
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
  'boMedicalSpecialties',
  'providerAccounts',
  'insurerAccounts',
  'people',
  'directoryNetworks',
  'practiceDefaultServices',
  'qaFlows',
];

/** Los pasos de núcleo, que corren siempre que la cadena corra. */
const CORE: readonly Step[] = STEPS.filter((name) => !CONTENT.includes(name));

describe('SeedBootstrapService · estado de los seeds núcleo para /readiness (SEED-01)', () => {
  it('un paso núcleo fallido queda registrado aunque el entorno no lo haga fatal', async () => {
    const state = new SeedCoreState();
    const { service } = build(['clinicalRoles'], state);

    const summary = await service.run();

    expect(summary.coreFailed).toEqual(['roles asistenciales']);
    expect(state.failedSteps()).toEqual(summary.coreFailed);
    expect(state.isComplete()).toBe(false);
  });

  it('un paso de contenido fallido no vuelve incompleto al núcleo', async () => {
    const state = new SeedCoreState();
    const { service } = build(['glossary'], state);

    await service.run();

    expect(state.isComplete()).toBe(true);
  });

  it('una corrida limpia borra el fallo de la anterior', async () => {
    const state = new SeedCoreState();
    state.record(['catálogo de conceptos']);
    const { service } = build([], state);

    await service.run();

    expect(state.isComplete()).toBe(true);
  });

  it('si el catálogo de conceptos no queda disponible, el aborto también se registra', async () => {
    const state = new SeedCoreState();
    const { service } = build(['terminology'], state);

    await service.run();

    expect(state.failedSteps()).toEqual(['catálogo de conceptos']);
  });
});

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
      const { service, dobles: doubles, logger } = build();

      await service.onApplicationBootstrap();

      for (const name of STEPS) {
        expect(doubles[name].run).not.toHaveBeenCalled();
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
      const { service, dobles: doubles } = build();

      await service.onApplicationBootstrap();

      expect(doubles.terminology.run).toHaveBeenCalledTimes(1);
      expect(doubles.clinicalForms.run).toHaveBeenCalledTimes(1);
    });
  });

  describe('interruptor de contenido', () => {
    it('con SEED_CONTENT_ON_BOOT=false corre el núcleo y saltea el contenido', async () => {
      process.env.SEED_CONTENT_ON_BOOT = 'false';
      const { service, dobles: doubles } = build();

      const summary = await service.run();

      for (const name of CORE) {
        expect(doubles[name].run).toHaveBeenCalledTimes(1);
      }
      for (const name of CONTENT) {
        expect(doubles[name].run).not.toHaveBeenCalled();
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
      const { service, dobles: doubles } = build();

      await service.run();

      expect(doubles.bootstrapAdmin.run).toHaveBeenCalledTimes(1);
    });

    it('sin la variable declarada corre la cadena entera', async () => {
      delete process.env.SEED_CONTENT_ON_BOOT;
      const { service, dobles: doubles } = build();

      const summary = await service.run();

      for (const name of STEPS) {
        expect(doubles[name].run).toHaveBeenCalledTimes(1);
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
        ([context]) => (context as { event?: string }).event === 'seed.step',
      );
      expect(loggedInSteps).toHaveLength(STEPS.length);
      for (const [context] of loggedInSteps) {
        expect(context).toMatchObject({ inserted: 0, failed: false });
        expect((context as { tookMs: number }).tookMs).toBeGreaterThanOrEqual(
          0,
        );
      }
    });

    it('un seed dependiente que falla no corta la cadena, pero se cuenta', async () => {
      const { service, dobles: doubles } = build(['glossary']);

      const summary = await service.run();

      expect(doubles.clinicalForms.run).toHaveBeenCalledTimes(1);
      expect(summary.failed).toBe(1);
      expect(summary.ok).toBe(STEPS.length - 1);
      expect(summary.steps.find((step) => step.failed)?.name).toBe(
        'glosario médico',
      );
    });

    it('si falla el catálogo de conceptos, los once dependientes ni se intentan', async () => {
      const { service, dobles: doubles, logger } = build(['terminology']);

      const summary = await service.run();

      expect(doubles.dynamicEnums.run).not.toHaveBeenCalled();
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
      const { service, dobles: doubles } = build();
      doubles.clinicalForms.run.mockResolvedValue({
        templates: 15,
        specialties: 10,
      });
      doubles.dynamicEnums.run.mockResolvedValue({
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
      const { service, dobles: doubles } = build();
      doubles.glossary.run.mockResolvedValue({
        valueSets: 0,
        terms: 0,
        relationships: 0,
        orphanRelationships: 1,
        // Artículos cuyo slug todavía no tiene concepto: se omiten, no se escriben.
        articles: 0,
        orphanArticles: 446,
      });

      const summary = await service.run();

      const step = summary.steps.find(
        (candidate) => candidate.name === 'glosario médico',
      );
      expect(step?.inserted).toBe(0);
      expect(summary.inserted).toBe(0);
    });

    it('un seed que no devuelve contadores se registra sin inventar un número', async () => {
      const { service, dobles: doubles } = build();
      doubles.bootstrapAdmin.run.mockResolvedValue(undefined);

      const summary = await service.run();

      const step = summary.steps.find(
        (candidate) => candidate.name === 'administrador de arranque',
      );
      expect(step?.inserted).toBeNull();
      expect(step?.failed).toBe(false);
    });
  });
  // SEED-01: un seed núcleo fallido no puede dejar que la API termine de arrancar.
  describe('fallo de un seed núcleo (SEED-01)', () => {
    const nodeEnvOriginal = process.env.NODE_ENV;
    const fatalOriginal = process.env.SEED_CORE_FAILURE_FATAL;

    afterEach(() => {
      if (nodeEnvOriginal === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = nodeEnvOriginal;
      if (fatalOriginal === undefined)
        delete process.env.SEED_CORE_FAILURE_FATAL;
      else process.env.SEED_CORE_FAILURE_FATAL = fatalOriginal;
    });

    it('todos los núcleo resuelven: el arranque termina y no hay coreFailed', async () => {
      process.env.NODE_ENV = 'production';
      const { service } = build();

      await expect(service.onApplicationBootstrap()).resolves.toBeUndefined();
      expect((await service.run()).coreFailed).toBeUndefined();
    });

    it('falla un seed de contenido: la aplicación sigue disponible, incluso en producción', async () => {
      process.env.NODE_ENV = 'production';
      const { service } = build(['glossary']);

      await expect(service.onApplicationBootstrap()).resolves.toBeUndefined();
    });

    it('falla un núcleo en producción: relanza tras el resumen y no inicia HTTP', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.SEED_CORE_FAILURE_FATAL;
      const { service, logger } = build(['messaging']);

      await expect(service.onApplicationBootstrap()).rejects.toThrow(
        'SYSTEM_SEED_CORE_INCOMPLETE',
      );
      // El resumen ya se registró antes de lanzar.
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'seed.summary',
          coreFailed: ['mensajería'],
        }),
        expect.any(String),
      );
    });

    it('falla el catálogo de conceptos en producción: también es fatal', async () => {
      process.env.NODE_ENV = 'production';
      const { service } = build(['terminology']);

      await expect(service.onApplicationBootstrap()).rejects.toThrow(
        'catálogo de conceptos',
      );
    });

    it('fuera de producción no rompe el desarrollo local salvo opt-in explícito', async () => {
      process.env.NODE_ENV = 'development';
      delete process.env.SEED_CORE_FAILURE_FATAL;
      await expect(
        build(['messaging']).service.onApplicationBootstrap(),
      ).resolves.toBeUndefined();

      process.env.SEED_CORE_FAILURE_FATAL = 'true';
      await expect(
        build(['messaging']).service.onApplicationBootstrap(),
      ).rejects.toThrow('SYSTEM_SEED_CORE_INCOMPLETE');
    });

    it('run() sigue devolviendo el resumen sin lanzar (lo usa yarn seed:boot)', async () => {
      process.env.NODE_ENV = 'production';
      const { service } = build(['messaging']);

      const summary = await service.run();

      expect(summary.failed).toBe(1);
      expect(summary.coreFailed).toEqual(['mensajería']);
    });
  });
});

describe('SeedBootstrapService · seed-cli --only y conteos por paso', () => {
  const contentOriginal = process.env.SEED_CONTENT_ON_BOOT;
  const reindexOriginal = process.env.SEED_SEARCH_REINDEX;

  afterEach(() => {
    if (contentOriginal === undefined) delete process.env.SEED_CONTENT_ON_BOOT;
    else process.env.SEED_CONTENT_ON_BOOT = contentOriginal;
    if (reindexOriginal === undefined) delete process.env.SEED_SEARCH_REINDEX;
    else process.env.SEED_SEARCH_REINDEX = reindexOriginal;
  });

  const padron = () => ({
    run: jest
      .fn<() => Promise<unknown>>()
      .mockResolvedValue({ created: 523, existing: 0 }),
  });

  it('corre únicamente los pasos pedidos, sin el catálogo si no se nombra', async () => {
    const organizations = padron();
    const { service, dobles: doubles } = build([], undefined, {
      padronOrganizations: organizations,
    });

    const summary = await service.run({ only: ['padron-organizaciones'] });

    expect(summary.steps.map((step) => step.name)).toEqual([
      'organizaciones del padrón',
    ]);
    expect(organizations.run).toHaveBeenCalledTimes(1);
    for (const name of STEPS) {
      expect(doubles[name].run).not.toHaveBeenCalled();
    }
  });

  it('acepta varios ids y el id del catálogo de conceptos', async () => {
    const organizations = padron();
    const { service, dobles: doubles } = build([], undefined, {
      padronOrganizations: organizations,
    });

    const summary = await service.run({
      only: [
        'catalogo-de-conceptos',
        'padron-organizaciones',
        'padron-de-personas',
      ],
    });

    expect(summary.steps.map((step) => step.name)).toEqual([
      'catálogo de conceptos',
      'padrón de personas',
      'organizaciones del padrón',
    ]);
    expect(doubles.terminology.run).toHaveBeenCalledTimes(1);
    expect(doubles.people.run).toHaveBeenCalledTimes(1);
  });

  it('un id desconocido falla nombrando los válidos y no corre nada', async () => {
    const { service, dobles: doubles } = build();

    await expect(service.run({ only: ['no-existe'] })).rejects.toThrow(
      /desconocidos: no-existe.*catalogo-de-conceptos/,
    );
    expect(doubles.terminology.run).not.toHaveBeenCalled();
  });

  it('pedir un paso de contenido por id lo corre aunque el contenido esté apagado', async () => {
    process.env.SEED_CONTENT_ON_BOOT = 'false';
    const { service, dobles: doubles } = build();

    const summary = await service.run({ only: ['padron-de-personas'] });

    expect(doubles.people.run).toHaveBeenCalledTimes(1);
    expect(summary.skippedContent).toBeUndefined();
  });

  it('pedir un paso opt-in por id lo habilita aunque su variable esté apagada; sin --only usa la suya', async () => {
    const organizations = padron();
    const admins = padron();
    const { service, dobles: doubles } = build([], undefined, {
      padronOrganizations: organizations,
      padronOrgAdmins: admins,
    });

    await service.run({
      only: [
        'padron-organizaciones',
        'padron-administradores',
        'padron-de-personas',
        'directorio-de-redes-de-aseguradoras',
      ],
    });

    const argsOf = (mock: unknown) =>
      (mock as jest.Mock<(...args: unknown[]) => unknown>).mock.calls;
    expect(argsOf(organizations.run)).toEqual([[true]]);
    expect(argsOf(admins.run)).toEqual([[undefined, true]]);
    expect(argsOf(doubles.people.run)).toEqual([[true]]);
    expect(argsOf(doubles.directoryNetworks.run)).toEqual([[true]]);

    organizations.run.mockClear();
    await service.run();
    expect(argsOf(organizations.run)).toEqual([[undefined]]);
  });

  it('countInserted suma lo escrito y no lo que el paso solo encontró hecho', () => {
    expect(
      countInserted({
        created: 3,
        verified: 0,
        showcases: 2,
        existing: 500,
        adopted: 20,
        adoptedTypeMismatch: 4,
        practitionersExisting: 9,
        pendingForPapers: 17,
        organizationMissing: 6,
        skipped: 8,
        orphanRelationships: 1,
      }),
    ).toBe(5);
    expect(countInserted({ existing: 3 })).toBeNull();
  });

  it('el código de salida sigue el resumen: un paso pedido que falla cuenta como fallo', async () => {
    const { service } = build(['people']);

    const summary = await service.run({ only: ['padron-de-personas'] });

    expect(summary.failed).toBe(1);
  });

  it('cada paso informa los contadores que devolvió, para comparar entornos', async () => {
    const organizations = padron();
    const { service } = build([], undefined, {
      padronOrganizations: organizations,
    });

    const summary = await service.run({ only: ['padron-organizaciones'] });

    expect(summary.steps[0].counts).toEqual({ created: 523, existing: 0 });
  });

  it('sin los servicios opcionales la cadena es la de siempre', async () => {
    const { service } = build();

    const summary = await service.run();

    const names = summary.steps.map((step) => step.name);
    expect(names).not.toContain('organizaciones del padrón');
    expect(names).not.toContain('reindexado del buscador público');
  });

  describe('reindexado del buscador', () => {
    const search = () => ({
      reindexAll: jest
        .fn<(opts?: { recreate?: boolean }) => Promise<unknown>>()
        .mockResolvedValue({
          indexed: 10,
          total: 10,
          confirmed: 10,
          errors: false,
        }),
    });

    it('apagado por defecto: el paso corre pero no toca el buscador', async () => {
      delete process.env.SEED_SEARCH_REINDEX;
      const searchIndex = search();
      const { service } = build([], undefined, { searchIndex });

      const summary = await service.run();

      expect(searchIndex.reindexAll).not.toHaveBeenCalled();
      const step = summary.steps.find(
        (entry) => entry.name === 'reindexado del buscador público',
      );
      expect(step?.counts).toEqual({ skipped: 1 });
    });

    it('con SEED_SEARCH_REINDEX=true reindexa al final de la cadena', async () => {
      process.env.SEED_SEARCH_REINDEX = 'true';
      const searchIndex = search();
      const { service } = build([], undefined, { searchIndex });

      const summary = await service.run();

      expect(searchIndex.reindexAll).toHaveBeenCalledWith({ recreate: false });
      expect(summary.steps.at(-1)?.name).toBe(
        'reindexado del buscador público',
      );
      expect(summary.steps.at(-1)?.counts).toEqual({
        indexed: 10,
        confirmed: 10,
      });
    });

    it('pedido con --only reindexa aunque la variable esté apagada', async () => {
      delete process.env.SEED_SEARCH_REINDEX;
      const searchIndex = search();
      const { service } = build([], undefined, { searchIndex });

      await service.run({ only: ['reindex-buscador'] });

      expect(searchIndex.reindexAll).toHaveBeenCalledTimes(1);
    });

    it('un reindexado con errores parciales falla el paso, no se traga', async () => {
      process.env.SEED_SEARCH_REINDEX = 'true';
      const searchIndex = {
        reindexAll: jest
          .fn<(opts?: { recreate?: boolean }) => Promise<unknown>>()
          .mockResolvedValue({
            indexed: 8,
            total: 10,
            confirmed: 8,
            errors: true,
          }),
      };
      const { service } = build([], undefined, { searchIndex });

      const summary = await service.run({ only: ['reindex-buscador'] });

      expect(summary.failed).toBe(1);
    });
  });
});
