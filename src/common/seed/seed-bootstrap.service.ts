import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { AuthzClinicalRolesSeedService } from './authz-clinical-roles-seed.service';
import { AuthzPlatformPermissionsSeedService } from './authz-platform-permissions-seed.service';
import { BootstrapAdminSeedService } from './bootstrap-admin-seed.service';
import { ProviderAccountsSeedService } from './provider-accounts-seed.service';
import { DynamicEnumSeedService } from './dynamic-enum-seed.service';
import { GlossarySeedService } from './glossary-seed.service';
import { BoGeographySeedService } from './bo-geography-seed.service';
import { BoliviaFacilitiesSeedService } from './bolivia-facilities-seed.service';
import { BoliviaFeeScheduleSeedService } from './bolivia-fee-schedule-seed.service';
import { BoliviaInsuranceSeedService } from './bolivia-insurance-seed.service';
import { IdentityVerificationSeedService } from './identity-verification-seed.service';
import { MessagingSeedService } from './messaging-seed.service';
import { AudioAssetsSeedService } from './audio-assets-seed.service';
import { VademecumSeedService } from './vademecum-seed.service';
import { TerminologySeedService } from './terminology-seed.service';
import { ClinicalFormsSeedService } from './clinical-forms-seed.service';
import { ProviderDirectorySeedService } from './provider-directory-seed.service';
import { loadSeedBootEnv } from './seed-boot.env';

/** Resultado de un paso de la cadena, ya medido. */
export interface SeedStepResult {
  /** Nombre legible del seed, el mismo que aparece en el log. */
  name: string;
  /** Filas insertadas en esta pasada, o `null` si el seed no lo reporta. */
  inserted: number | null;
  /** Cuánto tardó el paso, en milisegundos. */
  tookMs: number;
  /** Si el paso terminó con excepción. */
  failed: boolean;
}

/** Resumen de una corrida completa de la cadena. */
export interface SeedRunSummary {
  /** Pasos que terminaron sin excepción. */
  ok: number;
  /** Pasos que terminaron con excepción y quedaron omitidos. */
  failed: number;
  /** Filas insertadas en total por los pasos que lo reportan. */
  inserted: number;
  /** Duración de la cadena completa, en milisegundos. */
  tookMs: number;
  /** Detalle por paso, en orden de ejecución. */
  steps: SeedStepResult[];
  /**
   * Pasos de contenido que no se intentaron por `SEED_CONTENT_ON_BOOT=false`.
   *
   * Opcional para que el campo no cambie la forma del resumen en la corrida
   * normal: quien lo lea con el contenido encendido ve exactamente lo de antes.
   */
  skippedContent?: number;
}

/**
 * Qué clase de paso es, y por lo tanto si el entorno puede saltearlo.
 *
 * `core` es lo que la base necesita para aceptar una escritura: sin esos pasos
 * la aplicación queda en pie pero incapaz de persistir. `content` es material
 * curado —catálogos de negocio, glosario, formularios— que un despliegue puede
 * preferir cargar por su cuenta; saltearlo no rompe nada estructural.
 */
type SeedStepKind = 'core' | 'content';

/** Un paso de la cadena, con lo necesario para decidir si corre. */
interface SeedStepDescriptor {
  /** Nombre legible, el mismo que aparece en el log. */
  readonly name: string;
  /** Si el entorno puede saltearlo. */
  readonly kind: SeedStepKind;
  /** La corrida del seed. */
  readonly run: () => Promise<unknown>;
}

/**
 * Suma los contadores numéricos que devuelve un seed.
 *
 * Cada servicio reporta con su propia forma —`{ inserted }`, `{ templates,
 * specialties }`, un objeto de contadores por nivel— y ninguna interfaz común
 * los une. Sumar los valores numéricos de primer nivel es la lectura honesta:
 * da «cuántas filas tocó este paso» sin obligar a los diez servicios a cambiar
 * su contrato de retorno.
 *
 * @param result - Lo que devolvió el seed.
 * @returns El total, o `null` si el seed no devolvió contadores.
 */
export function contarInsertados(result: unknown): number | null {
  if (typeof result !== 'object' || result === null) return null;
  const numeros = Object.entries(result as Record<string, unknown>)
    // No todo contador numérico cuenta filas escritas: el glosario devuelve
    // `orphanRelationships`, que son relaciones declaradas cuyo destino no
    // existe y por eso NO se insertan. Sumarlas hacía que una corrida sin
    // trabajo informara «1 filas», que es justo la clase de mentira que este
    // resumen vino a eliminar.
    .filter(([nombre]) => !nombre.startsWith('orphan'))
    .map(([, valor]) => valor)
    .filter((valor): valor is number => typeof valor === 'number');
  if (numeros.length === 0) return null;
  return numeros.reduce((total, valor) => total + valor, 0);
}

/** Ejecuta los seeds estructurales en un orden explícito y determinista. */
@Injectable()
export class SeedBootstrapService implements OnApplicationBootstrap {
  /** Si la cadena corre sola al arrancar; ver `seed-boot.env.ts`. */
  private readonly seedOnBoot: boolean;

  /** Si los pasos de contenido corren junto con los de núcleo. */
  private readonly contentOnBoot: boolean;

  /**
   * Inicializa el orquestador.
   *
   * @param terminology - Catálogo padre de todos los conceptos.
   * @param dynamicEnums - Conjuntos de valores y amarres campo -> enumeración.
   * @param glossary - Taxonomía y catálogo curado del glosario médico.
   * @param boGeography - Departamentos de Bolivia (`VS_BO_DEPARTMENT`).
   * @param boliviaFacilities - Directorio de establecimientos de salud de
   *   Santa Cruz (`VS_BO_HEALTH_FACILITY`).
   * @param boliviaInsurance - Aseguradoras bolivianas con su producto de
   *   salud y sus planes.
   * @param boliviaFeeSchedule - Nomenclador de procedimientos con su precio de
   *   referencia (`VS_BO_MEDICAL_PROCEDURE`).
   * @param messaging - Datos estructurales de mensajería.
   * @param audioAssets - Colas y plantillas de audio.
   * @param vademecum - Catálogo de medicamentos para prescribir.
   * @param identityVerification - Datos estructurales de identidad.
   * @param clinicalRoles - Roles asistenciales de sistema en `authz.roles`.
   * @param platformPermissions - Permisos de sistema en `authz.permissions`.
   * @param bootstrapAdmin - Primer `SECURITY_ADMIN`, si el entorno lo pide.
   * @param clinicalForms - Catálogo de formularios clínicos estándar.
   * @param providerDirectory - Directorio de médicos habilitados (`VS_BO_PROVIDER_DIRECTORY`).
   * @param logger - Logger estructurado del arranque.
   */
  constructor(
    private readonly terminology: TerminologySeedService,
    private readonly dynamicEnums: DynamicEnumSeedService,
    private readonly glossary: GlossarySeedService,
    private readonly boGeography: BoGeographySeedService,
    private readonly boliviaFacilities: BoliviaFacilitiesSeedService,
    private readonly boliviaInsurance: BoliviaInsuranceSeedService,
    private readonly boliviaFeeSchedule: BoliviaFeeScheduleSeedService,
    private readonly messaging: MessagingSeedService,
    private readonly audioAssets: AudioAssetsSeedService,
    private readonly vademecum: VademecumSeedService,
    private readonly identityVerification: IdentityVerificationSeedService,
    private readonly clinicalRoles: AuthzClinicalRolesSeedService,
    private readonly platformPermissions: AuthzPlatformPermissionsSeedService,
    private readonly bootstrapAdmin: BootstrapAdminSeedService,
    private readonly providerAccounts: ProviderAccountsSeedService,
    private readonly clinicalForms: ClinicalFormsSeedService,
    private readonly providerDirectory: ProviderDirectorySeedService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SeedBootstrapService.name);
    const entorno = loadSeedBootEnv();
    this.seedOnBoot = entorno.enabled;
    this.contentOnBoot = entorno.contentEnabled;
  }

  /**
   * Punto de entrada del ciclo de vida de Nest.
   *
   * Con `SEED_ON_BOOT=false` no siembra, pero **lo dice**: un catálogo sin
   * materializar deja la aplicación escuchando HTTP e incapaz de persistir
   * nada, y ese silencio es justo el que costó un día de desconcierto cuando
   * tres seeds faltaban en una imagen vieja.
   */
  async onApplicationBootstrap(): Promise<void> {
    if (!this.seedOnBoot) {
      this.logger.warn(
        { event: 'seed.boot.disabled', nodeEnv: process.env.NODE_ENV },
        'SEED_ON_BOOT=false: la cadena de seeds no corre en este arranque. Si ' +
          'el catálogo no está materializado, ninguna escritura con ' +
          '*_concept_id va a poder persistir. Sembrá con "yarn seed:boot".',
      );
      return;
    }

    await this.run();
  }

  /**
   * Materializa primero los conceptos y luego los dominios dependientes.
   *
   * Público a propósito: lo invocan `yarn seed:boot` y el arnés de las pruebas
   * de integración, que apagan la siembra automática para no repetirla una vez
   * por archivo de spec.
   *
   * @returns El resumen de la corrida, con un detalle por paso.
   */
  async run(): Promise<SeedRunSummary> {
    const arranque = Date.now();
    const steps: SeedStepResult[] = [];

    // El catálogo de conceptos no es un paso más: es la precondición de todos
    // los demás. Si falla, seguir sería sembrar contra FKs que no existen —y el
    // error real quedaría sepultado bajo una cascada de fallos derivados.
    const catalogo = await this.runStep('catálogo de conceptos', () =>
      this.terminology.run(),
    );
    steps.push(catalogo);

    if (catalogo.failed) {
      const resumen = this.resumir(steps, arranque);
      this.logger.error(
        { event: 'seed.aborted', ...resumen },
        'Seeds estructurales omitidos: el catálogo de terminología no quedó ' +
          'disponible, así que los seeds dependientes ni se intentaron.',
      );
      return resumen;
    }

    let skippedContent = 0;
    for (const paso of this.pasosDependientes()) {
      if (paso.kind === 'content' && !this.contentOnBoot) {
        skippedContent += 1;
        this.logger.info(
          { event: 'seed.step.skipped', name: paso.name },
          'Seed de contenido salteado (SEED_CONTENT_ON_BOOT=false): ' +
            paso.name,
        );
        continue;
      }
      steps.push(await this.runStep(paso.name, paso.run));
    }

    return this.resumir(steps, arranque, skippedContent);
  }

  /**
   * Los pasos que corren después del catálogo, en orden y ya clasificados.
   *
   * El orden es el contrato: cada paso depende de lo que materializaron los
   * anteriores, y los comentarios de cada entrada dicen de qué. La
   * clasificación es una decisión del orquestador y no de cada servicio,
   * porque «esto es núcleo» solo tiene sentido mirando la cadena entera.
   */
  private pasosDependientes(): readonly SeedStepDescriptor[] {
    return [
      // Va inmediatamente después del catálogo porque sus miembros y opciones son
      // FK a los conceptos que aquél acaba de materializar, y porque sin él ningún
      // formulario puede poblar sus campos de catálogo.
      {
        name: 'enumeraciones dinámicas',
        kind: 'core',
        run: () => this.dynamicEnums.run(),
      },
      // Depende de `SEED.codeSystemVersionId`, ya materializado por el catálogo
      // de conceptos. No depende de las enumeraciones dinámicas ni al revés,
      // pero va justo después de ellas para agrupar los seeds que amplían el
      // motor de terminología antes de los dominios operativos.
      {
        name: 'glosario médico',
        kind: 'content',
        run: () => this.glossary.run(),
      },
      // Mismo motivo que el glosario: materializa un conjunto de valores sobre el
      // catálogo que el paso anterior acaba de sembrar (`SEED.codeSystemVersionId`
      // para los conceptos, `CONCEPTS.LANG_ES` para sus designaciones). Va acá y
      // no más abajo porque el registro público —la primera pantalla que ve
      // cualquiera— lee `VS_BO_DEPARTMENT` para su desplegable de departamentos.
      // Es núcleo por eso mismo: sin departamentos no hay alta de nadie.
      {
        name: 'departamentos de Bolivia',
        kind: 'core',
        run: () => this.boGeography.run(),
      },
      // Junto a los departamentos y por lo mismo: son catálogos de referencia de
      // Bolivia que las pantallas resuelven por el código del conjunto. El
      // directorio de establecimientos es el que le permite al médico decir en qué
      // hospital está de turno y en qué clínica atiende.
      {
        name: 'establecimientos de salud',
        kind: 'content',
        run: () => this.boliviaFacilities.run(),
      },
      // Directorio de médicos habilitados en las redes de Alianza y Nacional Seguros.
      // Son 961 profesionales reales sin cuenta de usuario, para que la APP los muestre
      // al buscar especialistas habilitados (PACIENTE §3.2).
      {
        name: 'directorio de médicos habilitados',
        kind: 'content',
        run: () => this.providerDirectory.run(),
      },
      // Las aseguradoras van después del catálogo de conceptos porque su estado y
      // su tipo de producto salen de `insurance:*`, y antes que nada que registre
      // una cobertura: `patient_coverages` apunta al plan, no a la compañía.
      {
        name: 'aseguradoras de Bolivia',
        kind: 'content',
        run: () => this.boliviaInsurance.run(),
      },
      // El nomenclador va con los otros catálogos de referencia. Es el más grande
      // de todos —4 408 procedimientos— y por eso siembra e indaga por bloques.
      {
        name: 'nomenclador de procedimientos',
        kind: 'content',
        run: () => this.boliviaFeeSchedule.run(),
      },
      // Mismo motivo que el glosario: amplía el motor de terminología con un code
      // system propio. Depende del catálogo de conceptos por los idiomas de cada
      // designación (`EN`/`ES`) y por las severidades `clinical_ext:SEVERITY_*` de
      // las interacciones: aplicado antes, viola esas FK. Vivía como patch SQL
      // fuera de `apply_all.sql`, así que una base reconstruida no lo traía.
      {
        name: 'vademécum de medicamentos',
        kind: 'content',
        run: () => this.vademecum.run(),
      },
      // Núcleo: los canales que siembra tienen id fijo y el código de producción
      // los referencia directo —verificación de correo, restablecimiento, avisos
      // de agenda—, así que sin ellos esas escrituras violan su FK.
      { name: 'mensajería', kind: 'core', run: () => this.messaging.run() },
      {
        name: 'audio assets',
        kind: 'core',
        run: () => this.audioAssets.run(),
      },
      {
        name: 'verificación de identidad',
        kind: 'core',
        run: () => this.identityVerification.run(),
      },
      // Depende de los conceptos de rol base y de ámbito del catálogo `authz`.
      {
        name: 'roles asistenciales',
        kind: 'core',
        run: () => this.clinicalRoles.run(),
      },
      // Mismo motivo que los roles: sus conceptos de acción, ámbito y estado los
      // acaba de materializar el catálogo.
      {
        name: 'permisos de plataforma',
        kind: 'core',
        run: () => this.platformPermissions.run(),
      },
      // Carril R2-5. Depende del catálogo de conceptos —siembra sus propias
      // especialidades sobre el mismo sistema de códigos— y es contenido, no
      // estructura: si falla, el resto del arranque sigue en pie.
      {
        name: 'formularios clínicos estándar',
        kind: 'content',
        run: () => this.clinicalForms.run(),
      },
      // Va el último a propósito: el alta del administrador referencia conceptos
      // de estado y el tenant por defecto, que los sembra el catálogo.
      {
        name: 'administrador de arranque',
        kind: 'core',
        run: () => this.bootstrapAdmin.run(),
      },
      // Después del administrador y no antes: las cuentas de proveedor se crean
      // con `IamUsersService`, que escribe `created_by_user_id` apuntando al
      // actor semilla, y ese actor lo materializa el paso anterior.
      {
        name: 'cuentas de proveedores',
        kind: 'content',
        run: () => this.providerAccounts.run(),
      },
    ];
  }

  /**
   * Ejecuta un paso de la cadena, lo cronometra y deja registro pase lo que pase.
   *
   * El log es **incondicional**. Antes cada servicio informaba sólo cuando
   * insertaba algo, así que una base ya poblada arrancaba en silencio —y un
   * seed que ni siquiera existía en la imagen se veía exactamente igual que uno
   * que corrió y no tuvo nada para hacer—.
   *
   * @param name - Nombre legible del paso.
   * @param run - La corrida del seed.
   * @returns La medición del paso, con `failed` en vez de excepción.
   */
  private async runStep(
    name: string,
    run: () => Promise<unknown>,
  ): Promise<SeedStepResult> {
    const desde = Date.now();
    try {
      const resultado = await run();
      const paso: SeedStepResult = {
        name,
        inserted: contarInsertados(resultado),
        tookMs: Date.now() - desde,
        failed: false,
      };
      // `detail` lleva los contadores tal como los devolvió el seed, incluidos
      // los que `inserted` deja afuera: el agregado es para leer de un vistazo,
      // el detalle es para no perder nada.
      this.logger.info(
        { event: 'seed.step', ...paso, detail: resultado },
        'Seed: ' + name,
      );
      return paso;
    } catch (error) {
      const paso: SeedStepResult = {
        name,
        inserted: null,
        tookMs: Date.now() - desde,
        failed: true,
      };
      this.logger.warn(
        { err: error, event: 'seed.step.failed', ...paso },
        'Seed omitido: ' + name,
      );
      return paso;
    }
  }

  /**
   * Cierra la corrida con una línea que se lee de un vistazo.
   *
   * @param steps - Los pasos ya medidos.
   * @param arranque - Marca de tiempo del inicio de la cadena.
   * @param skippedContent - Pasos de contenido que el entorno salteó.
   * @returns El resumen agregado.
   */
  private resumir(
    steps: SeedStepResult[],
    arranque: number,
    skippedContent = 0,
  ): SeedRunSummary {
    const failed = steps.filter((paso) => paso.failed).length;
    const summary: SeedRunSummary = {
      ok: steps.length - failed,
      failed,
      inserted: steps.reduce((total, paso) => total + (paso.inserted ?? 0), 0),
      tookMs: Date.now() - arranque,
      steps,
      // Solo cuando hubo salteados: con el contenido encendido el resumen
      // conserva exactamente la forma que tenía antes de que el flag existiera.
      ...(skippedContent > 0 ? { skippedContent } : {}),
    };

    const linea =
      'Seeds: ' +
      summary.ok +
      '/' +
      steps.length +
      ' ok' +
      (failed > 0 ? ' · ' + failed + ' omitidos' : '') +
      (skippedContent > 0
        ? ' · ' + skippedContent + ' de contenido salteados'
        : '') +
      ' · ' +
      summary.inserted +
      ' filas · ' +
      summary.tookMs +
      ' ms';

    if (failed > 0) {
      this.logger.error({ event: 'seed.summary', ...summary }, linea);
    } else {
      this.logger.info({ event: 'seed.summary', ...summary }, linea);
    }

    return summary;
  }
}
