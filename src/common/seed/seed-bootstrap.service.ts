import {
  Injectable,
  Optional,
  type OnApplicationBootstrap,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { AuthzClinicalRolesSeedService } from './authz-clinical-roles-seed.service';
import { AuthzPlatformPermissionsSeedService } from './authz-platform-permissions-seed.service';
import { BootstrapAdminSeedService } from './bootstrap-admin-seed.service';
import { QaFlowsSeedService } from './qa-flows-seed.service';
import { ProviderAccountsSeedService } from './provider-accounts-seed.service';
import { InsurerAccountsSeedService } from './insurer-accounts-seed.service';
import { DynamicEnumSeedService } from './dynamic-enum-seed.service';
import { PatientPortalProxySeedService } from './patient-portal-proxy-seed.service';
import { TelemetryUxHeatmapSeedService } from './telemetry-ux-heatmap-seed.service';
import { CatalogDocumentationSeedService } from './catalog/catalog-documentation-seed.service';
import { MutabilityRegistrySeedService } from './mutability/mutability-registry-seed.service';
import { FrontendRoutesSeedService } from '../../modules/read_models/seed/frontend-routes-seed.service';
import { GlossarySeedService } from './glossary-seed.service';
import { BoGeographySeedService } from './bo-geography-seed.service';
import { AdminDivisionsSeedService } from './admin-divisions-seed.service';
import { LegalEntityTypesSeedService } from './legal-entity-types-seed.service';
import { AffiliationCatalogsSeedService } from './affiliation-catalogs-seed.service';
import { AdmissionRequirementsSeedService } from './admission-requirements-seed.service';
import { BoEmployersSeedService } from './bo-employers-seed.service';
import { BoOccupationsSeedService } from './bo-occupations-seed.service';
import { BoProfessionsSeedService } from './bo-professions-seed.service';
import { BoliviaFacilitiesSeedService } from './bolivia-facilities-seed.service';
import { BoliviaFeeScheduleSeedService } from './bolivia-fee-schedule-seed.service';
import { BoliviaInsuranceSeedService } from './bolivia-insurance-seed.service';
import { IdentityVerificationSeedService } from './identity-verification-seed.service';
import { PharmacySystemProvidersSeedService } from './pharmacy-system-providers-seed.service';
import { MessagingSeedService } from './messaging-seed.service';
import { AudioAssetsSeedService } from './audio-assets-seed.service';
import { StickerPackSeedService } from './sticker-pack-seed.service';
import { VademecumSeedService } from './vademecum-seed.service';
import { TerminologySeedService } from './terminology-seed.service';
import { ClinicalFormsSeedService } from './clinical-forms-seed.service';
import { BoMedicalSpecialtiesSeedService } from './bo-medical-specialties-seed.service';
import { PracticeDefaultServicesSeedService } from './practice-default-services-seed.service';
import { PracticeInfrastructureSeedService } from './practice-infrastructure-seed.service';
import { PeopleSeedService } from './people-seed.service';
import { DirectoryNetworksSeedService } from './directory-networks-seed.service';
import { PadronOrganizationsSeedService } from './padron-organizations-seed.service';
import { PadronOrgAdminsSeedService } from './padron-org-admins-seed.service';
import { ToolRegistrySeedService } from './tool-registry-seed.service';
import { CommunitySearchIndexService } from '../../modules/community/services';
import { isCoreSeedFailureFatal, loadSeedBootEnv } from './seed-boot.env';
import { SeedCoreState } from './seed-core.state';

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
  /**
   * Contadores que devolvió el seed, tal cual (creadas, existentes…). Sirven para
   * comparar entornos paso a paso; vacío si el seed no devuelve contadores.
   */
  counts?: Record<string, number>;
}

/** Cómo se corre la cadena. */
export interface SeedRunOptions {
  /**
   * Ids de los únicos pasos a correr (`seed-cli --only=<id>,<id>`). Sin él corre
   * toda la cadena. Un paso pedido por id corre aunque `SEED_CONTENT_ON_BOOT`
   * sea `false`: pedirlo es la decisión explícita.
   */
  readonly only?: readonly string[];
}

/** Nombre normalizado de un paso: minúsculas, sin acentos, con guiones. */
export function seedStepSlug(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
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
  /**
   * Nombres de los pasos `core` que fallaron (SEED-01).
   *
   * Opcional por la misma razón que `skippedContent`: sólo aparece cuando hay
   * algo que decir. Su presencia es lo que vuelve fatal el arranque.
   */
  coreFailed?: string[];
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

/** Id del paso del catálogo de conceptos, que no está entre los dependientes. */
const CATALOG_STEP_ID = 'catalogo-de-conceptos';

/** Id con que se pide un paso por `--only`. */
function stepId(step: { id?: string; name: string }): string {
  return step.id ?? seedStepSlug(step.name);
}

/** Un paso de la cadena, con lo necesario para decidir si corre. */
interface SeedStepDescriptor {
  /**
   * Identificador corto y estable para `seed-cli --only=<id>`. Sin él se usa el
   * nombre normalizado (minúsculas, sin acentos, con guiones).
   */
  readonly id?: string;
  /** Nombre legible, el mismo que aparece en el log. */
  readonly name: string;
  /** Si el entorno puede saltearlo. */
  readonly kind: SeedStepKind;
  /** La corrida del seed. */
  readonly run: () => Promise<unknown>;
}

/** Contadores que describen filas que el paso no escribió. */
const NOT_INSERTED =
  /^(orphan|adopted|existing$|skipped$|pendingForPapers$|organizationMissing$)|(Existing|Adopted)$/;

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
export function countInserted(result: unknown): number | null {
  if (typeof result !== 'object' || result === null) return null;
  const numbers = Object.entries(result as Record<string, unknown>)
    // No todo contador numérico cuenta filas escritas: el glosario devuelve
    // `orphanRelationships`, que son relaciones declaradas cuyo destino no
    // existe y por eso NO se insertan. Sumarlas hacía que una corrida sin
    // trabajo informara «1 filas», que es justo la clase de mentira que este
    // resumen vino a eliminar. Por el mismo motivo, `people-seed.service.ts`
    // reporta `...Existing` — filas que ya estaban, no filas nuevas de esta
    // pasada — y tampoco cuentan.
    // Tampoco cuentan las filas que el paso encontró hechas (`existing`,
    // `adopted*`), las que dejó a la espera de algo (`pendingForPapers`,
    // `organizationMissing`) ni las que saltó (`skipped`): el total es lo que
    // este paso escribió, no lo que vio.
    .filter(([name]) => !NOT_INSERTED.test(name))
    .map(([, value]) => value)
    .filter((value): value is number => typeof value === 'number');
  if (numbers.length === 0) return null;
  return numbers.reduce((total, value) => total + value, 0);
}

/**
 * Los contadores numéricos de primer nivel que devolvió un seed, tal cual.
 *
 * @param result - Lo que devolvió el seed.
 * @returns Los contadores, o `undefined` si no devolvió ninguno.
 */
export function seedCounts(
  result: unknown,
): Record<string, number> | undefined {
  if (typeof result !== 'object' || result === null) return undefined;
  const entries = Object.entries(result as Record<string, unknown>).filter(
    (entry): entry is [string, number] => typeof entry[1] === 'number',
  );
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

/** Ejecuta los seeds estructurales en un orden explícito y determinista. */
@Injectable()
export class SeedBootstrapService implements OnApplicationBootstrap {
  /** Si la cadena corre sola al arrancar; ver `seed-boot.env.ts`. */
  private readonly seedOnBoot: boolean;

  /** Si los pasos de contenido corren junto con los de núcleo. */
  private readonly contentOnBoot: boolean;

  /** Si la corrida en curso pidió pasos concretos con `--only`. */
  private onlyRequested = false;

  /**
   * Inicializa el orquestador.
   *
   * @param terminology - Catálogo padre de todos los conceptos.
   * @param dynamicEnums - Conjuntos de valores y amarres campo -> enumeración.
   * @param patientPortalProxy - Alcance y base legal del apoderamiento de portal.
   * @param glossary - Taxonomía y catálogo curado del glosario médico.
   * @param boGeography - Departamentos de Bolivia (`VS_BO_DEPARTMENT`).
   * @param adminDivisions - Divisiones administrativas de todo país con
   *   catálogo (`VS_ADMIN_DIVISION`, ADR-0028).
   * @param legalEntityTypes - País y categoría canónica de cada forma societaria
   *   del diccionario internacional (subtarea 1.1).
   * @param affiliationCatalogs - Documentos de afiliación, autoridad emisora,
   *   estado de verificación y rol del representante legal del alta de organización.
   * @param boOccupations - Ocupaciones de Bolivia (`VS_BO_OCCUPATION`).
   * @param boProfessions - Profesiones COB-2023 (`VS_BO_PROFESSION`).
   * @param boEmployers - Empresas y empleadores de Bolivia (`VS_BO_EMPLOYER`).
   * @param boliviaFacilities - Directorio de establecimientos de salud de
   *   Santa Cruz (`VS_BO_HEALTH_FACILITY`).
   * @param boliviaInsurance - Aseguradoras bolivianas con su producto de
   *   salud y sus planes.
   * @param boliviaFeeSchedule - Nomenclador de procedimientos con su precio de
   *   referencia (`VS_BO_MEDICAL_PROCEDURE`).
   * @param messaging - Datos estructurales de mensajería.
   * @param audioAssets - Colas y plantillas de audio.
   * @param stickerPack - Los 24 stickers del producto (AG-17).
   * @param vademecum - Catálogo de medicamentos para prescribir.
   * @param identityVerification - Datos estructurales de identidad.
   * @param clinicalRoles - Roles asistenciales de sistema en `authz.roles`.
   * @param platformPermissions - Permisos de sistema en `authz.permissions`.
   * @param bootstrapAdmin - Primer `SECURITY_ADMIN`, si el entorno lo pide.
   * @param clinicalForms - Catálogo de formularios clínicos estándar.
   * @param boMedicalSpecialties - Especialidades y subespecialidades que se
   *   suman a `VS_MEDICAL_SPECIALTY` (médicas, quirúrgicas y odontológicas).
   * @param practiceDefaultServices - «Cita médica» en las prácticas que nacieron
   *   sin catálogo.
   * @param people - Cuentas del padrón (H2, carril M2 · MacBook), sintéticas y
   *   opt-in por `SEED_PEOPLE_ENABLED`.
   * @param directoryNetworks - Médicos de las redes de Alianza y Nacional, con
   *   sus sedes y membresías (H3), opt-in por `SEED_DIRECTORY_NETWORKS_ENABLED`.
   * @param qaFlows - Suites de `qa_lab` generadas desde el catálogo de flujos,
   *   opt-in por `SEED_QA_FLOWS`.
   * @param admissionRequirements - Requisitos de la admisión ALTA_DE_DOCTOR
   *   (proceso 2.1), el checklist que revisa el portal admin.
   * @param logger - Logger estructurado del arranque.
   * @param coreState - Dónde queda registrado qué paso núcleo falló, para que
   *   `/readiness` lo vea (SEED-01); opcional para quien arma el orquestador a mano.
   * @param padronOrganizations - Organizaciones del padrón público de
   *   establecimientos, opt-in por `SEED_PADRON_ORGANIZATIONS_ENABLED`.
   * @param searchIndex - Buscador del directorio público, que se reindexa al
   *   final cuando `SEED_SEARCH_REINDEX=true` o se pide con `--only`.
   * @param padronOrgAdmins - Un administrador de demostración por organización,
   *   opt-in por `SEED_PADRON_ORG_ADMINS_ENABLED` y tras el candado de demo.
   */
  constructor(
    private readonly terminology: TerminologySeedService,
    private readonly dynamicEnums: DynamicEnumSeedService,
    private readonly patientPortalProxy: PatientPortalProxySeedService,
    private readonly telemetryUxHeatmap: TelemetryUxHeatmapSeedService,
    private readonly mutabilityRegistry: MutabilityRegistrySeedService,
    private readonly catalogDocumentation: CatalogDocumentationSeedService,
    private readonly glossary: GlossarySeedService,
    private readonly boGeography: BoGeographySeedService,
    private readonly adminDivisions: AdminDivisionsSeedService,
    private readonly legalEntityTypes: LegalEntityTypesSeedService,
    private readonly affiliationCatalogs: AffiliationCatalogsSeedService,
    private readonly boOccupations: BoOccupationsSeedService,
    private readonly boProfessions: BoProfessionsSeedService,
    private readonly boEmployers: BoEmployersSeedService,
    private readonly boliviaFacilities: BoliviaFacilitiesSeedService,
    private readonly boliviaInsurance: BoliviaInsuranceSeedService,
    private readonly boliviaFeeSchedule: BoliviaFeeScheduleSeedService,
    private readonly messaging: MessagingSeedService,
    private readonly audioAssets: AudioAssetsSeedService,
    private readonly stickerPack: StickerPackSeedService,
    private readonly vademecum: VademecumSeedService,
    private readonly identityVerification: IdentityVerificationSeedService,
    private readonly clinicalRoles: AuthzClinicalRolesSeedService,
    private readonly platformPermissions: AuthzPlatformPermissionsSeedService,
    private readonly bootstrapAdmin: BootstrapAdminSeedService,
    private readonly providerAccounts: ProviderAccountsSeedService,
    private readonly insurerAccounts: InsurerAccountsSeedService,
    private readonly clinicalForms: ClinicalFormsSeedService,
    private readonly boMedicalSpecialties: BoMedicalSpecialtiesSeedService,
    private readonly practiceDefaultServices: PracticeDefaultServicesSeedService,
    private readonly practiceInfrastructure: PracticeInfrastructureSeedService,
    private readonly people: PeopleSeedService,
    private readonly directoryNetworks: DirectoryNetworksSeedService,
    private readonly qaFlows: QaFlowsSeedService,
    private readonly admissionRequirements: AdmissionRequirementsSeedService,
    private readonly logger: PinoLogger,
    @Optional() private readonly coreState?: SeedCoreState,
    // Los pasos de la carga del padrón van al final y opcionales para no mover
    // la posición de los demás; el módulo siempre los provee.
    @Optional()
    private readonly padronOrganizations?: PadronOrganizationsSeedService,
    @Optional()
    private readonly padronOrgAdmins?: PadronOrgAdminsSeedService,
    @Optional()
    private readonly searchIndex?: CommunitySearchIndexService,
    @Optional()
    private readonly toolRegistry?: ToolRegistrySeedService,
    @Optional()
    private readonly frontendRoutes?: FrontendRoutesSeedService,
    @Optional()
    private readonly pharmacySystems?: PharmacySystemProvidersSeedService,
  ) {
    this.logger.setContext(SeedBootstrapService.name);
    const environment = loadSeedBootEnv();
    this.seedOnBoot = environment.enabled;
    this.contentOnBoot = environment.contentEnabled;
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

    const summary = await this.run();
    this.assertCoreSeedsComplete(summary);
  }

  /**
   * SEED-01 · un paso `core` fallido no puede dejar que la API quede en pie.
   *
   * Sin el catálogo de conceptos, los roles o los departamentos, el proceso
   * atiende HTTP pero toda escritura que dependa de ellos viola una FK NOT NULL.
   * Se lanza **después** del resumen (ya registrado por `summarize`), así que el
   * motivo queda en el log y `app.listen` no llega a ejecutarse.
   *
   * Es fatal siempre en `NODE_ENV=production` y, fuera de producción, sólo con
   * `SEED_CORE_FAILURE_FATAL=true`: un desarrollador con una base a medio sembrar
   * conserva su flujo local. Un fallo de contenido nunca es fatal; para degradarlo
   * de forma explícita está `SEED_CONTENT_ON_BOOT=false`.
   */
  private assertCoreSeedsComplete(summary: SeedRunSummary): void {
    if (!summary.coreFailed?.length) return;
    if (!isCoreSeedFailureFatal()) return;
    throw new Error(
      'SYSTEM_SEED_CORE_INCOMPLETE: fallaron seeds núcleo: ' +
        summary.coreFailed.join(', '),
    );
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
  async run(options: SeedRunOptions = {}): Promise<SeedRunSummary> {
    const startup = Date.now();
    const steps: SeedStepResult[] = [];
    const only = this.resolveOnly(options.only);
    this.onlyRequested = only !== undefined;

    // El catálogo de conceptos no es un paso más: es la precondición de todos
    // los demás. Si falla, seguir sería sembrar contra FKs que no existen —y el
    // error real quedaría sepultado bajo una cascada de fallos derivados.
    const coreFailed: string[] = [];
    const catalog =
      !only || only.has(CATALOG_STEP_ID)
        ? await this.runStep('catálogo de conceptos', () =>
            this.terminology.run(),
          )
        : undefined;
    if (catalog) steps.push(catalog);

    if (catalog?.failed) {
      coreFailed.push(catalog.name);
      const summary = this.summarize(steps, startup, 0, coreFailed);
      this.logger.error(
        { event: 'seed.aborted', ...summary },
        'Seeds estructurales omitidos: el catálogo de terminología no quedó ' +
          'disponible, así que los seeds dependientes ni se intentaron.',
      );
      return summary;
    }

    let skippedContent = 0;
    for (const step of this.dependentsSteps()) {
      if (only && !only.has(stepId(step))) continue;
      if (step.kind === 'content' && !this.contentOnBoot && !only) {
        skippedContent += 1;
        this.logger.info(
          { event: 'seed.step.skipped', name: step.name },
          'Seed de contenido salteado (SEED_CONTENT_ON_BOOT=false): ' +
            step.name,
        );
        continue;
      }
      const result = await this.runStep(step.name, step.run);
      steps.push(result);
      if (result.failed && step.kind === 'core') coreFailed.push(step.name);
    }

    return this.summarize(steps, startup, skippedContent, coreFailed);
  }

  /**
   * Valida los ids de `--only` contra los pasos que existen.
   *
   * @param ids - Ids pedidos, o `undefined` para toda la cadena.
   * @returns El conjunto de ids, o `undefined` si no se pidió ninguno.
   * @throws Error si algún id no corresponde a un paso, nombrando los válidos.
   */
  private resolveOnly(
    ids: readonly string[] | undefined,
  ): ReadonlySet<string> | undefined {
    const wanted = (ids ?? []).map((id) => id.trim()).filter(Boolean);
    if (wanted.length === 0) return undefined;
    const known = new Set([
      CATALOG_STEP_ID,
      ...this.dependentsSteps().map((step) => stepId(step)),
    ]);
    const unknown = wanted.filter((id) => !known.has(id));
    if (unknown.length > 0) {
      throw new Error(
        `Pasos de siembra desconocidos: ${unknown.join(', ')}. ` +
          `Pasos válidos: ${[...known].join(', ')}`,
      );
    }
    return new Set(wanted);
  }

  /**
   * Los pasos que corren después del catálogo, en orden y ya clasificados.
   *
   * El orden es el contrato: cada paso depende de lo que materializaron los
   * anteriores, y los comentarios de cada entrada dicen de qué. La
   * clasificación es una decisión del orquestador y no de cada servicio,
   * porque «esto es núcleo» solo tiene sentido mirando la cadena entera.
   */
  private dependentsSteps(): readonly SeedStepDescriptor[] {
    return [
      // Va inmediatamente después del catálogo porque sus miembros y opciones son
      // FK a los conceptos que aquél acaba de materializar, y porque sin él ningún
      // formulario puede poblar sus campos de catálogo.
      {
        name: 'enumeraciones dinámicas',
        kind: 'core',
        run: () => this.dynamicEnums.run(),
      },
      // Las dos filas sin las que no se puede escribir un apoderamiento de
      // portal. Es `core` porque sin ellas el alta de un dependiente viola dos
      // FK NOT NULL, y va acá porque depende del tenant y del propósito de
      // procesamiento que el catálogo acaba de materializar.
      // Registro de mutabilidad (system_ops.entity_registry y sus políticas), derivado del
      // modelo con nivel de evidencia. Depende de los conceptos `SO_*` del catálogo; sin ellos
      // no siembra nada y lo avisa. Idempotente por (schema, tabla).
      {
        name: 'registro de mutabilidad de datos',
        kind: 'core',
        run: () => this.mutabilityRegistry.run(),
      },
      // Documentación del catálogo (dominios, clasificaciones, glosario, linaje y fichas en
      // borrador con procedencia). Nunca aprueba nada; las fichas necesitan que el escaneo haya
      // observado los objetos (si no, informa NO_OBSERVED_OBJECTS y la corrida siguiente las siembra).
      {
        name: 'documentación del catálogo de datos',
        kind: 'core',
        run: () => this.catalogDocumentation.run(),
      },
      {
        name: 'apoderamiento de portal',
        kind: 'core',
        run: () => this.patientPortalProxy.run(),
      },
      // El propósito y el esquema de evento con los que el portal manda las
      // interacciones de los mapas de calor. Es `core` porque sin el esquema
      // cada lote de `POST /telemetry/activity-events` vuelve 404, y va acá
      // porque sólo depende de los conceptos de telemetría del catálogo.
      {
        name: 'mapas de calor del portal',
        kind: 'core',
        run: () => this.telemetryUxHeatmap.run(),
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
      // El árbol multipaís (ADR-0028) apunta a los departamentos y municipios
      // del paso anterior: va inmediatamente después. Es núcleo porque las
      // direcciones deducen de acá la provincia del municipio.
      {
        name: 'divisiones administrativas',
        kind: 'core',
        run: () => this.adminDivisions.run(),
      },
      // Va justo después del catálogo de conceptos: sólo depende de que los 21
      // conceptos de `LEGAL_ENTITY_TYPES` ya existan (los materializa el paso
      // 'catálogo de conceptos'), y sin sus propiedades el registro sigue
      // funcionando -- sólo faltan país y categoría canónica en `$expand`. Es
      // núcleo, no contenido, porque las 8 formas bolivianas son las que el
      // registro de procesos exige poder contar desde el primer arranque.
      {
        name: 'país y categoría canónica de formas societarias',
        kind: 'core',
        run: () => this.legalEntityTypes.run(),
      },
      // Los cuatro conjuntos que el alta de organización resuelve por código
      // (documentos de afiliación, autoridad emisora, estado de verificación y
      // rol del representante). Es núcleo y no contenido: sin ellos
      // `register-organization` responde 422 «El catálogo de documentos de
      // afiliación no está disponible» — el defecto D6 del 26/09/2026. Va
      // después de terminología porque sus conceptos cuelgan del sistema de
      // códigos interno.
      {
        name: 'catálogos de afiliación y representación legal',
        kind: 'core',
        run: () => this.affiliationCatalogs.run(),
      },
      // El checklist de la admisión de médicos (proceso 2.1). Es núcleo: sin
      // requisitos la bandeja de Admisiones no tiene qué revisar, y el servidor
      // se niega a verificar a quien no tiene checklist. Depende de los
      // conceptos `profiles:ADMISSION_*` del catálogo de conceptos.
      {
        name: 'requisitos de admisión de profesionales',
        kind: 'core',
        run: () => this.admissionRequirements.run(),
      },
      // Y con ellos, por lo mismo: el alta de paciente resuelve
      // `VS_BO_OCCUPATION` por su código para el desplegable de ocupación.
      // Es núcleo y no contenido porque sin el conjunto el campo se queda en el
      // texto libre que este catálogo vino a cerrar.
      {
        name: 'ocupaciones de Bolivia',
        kind: 'core',
        run: () => this.boOccupations.run(),
      },
      // La profesión que acredita un título (COB-2023, grandes grupos 2 y 3):
      // «Otra profesión» del alta del médico. Núcleo por lo mismo que las
      // ocupaciones: sin el conjunto el alta vuelve al texto libre.
      {
        name: 'profesiones de Bolivia (COB-2023)',
        kind: 'core',
        run: () => this.boProfessions.run(),
      },
      // Y con ellas, por lo mismo: el alta pregunta la empresa donde se
      // trabaja —antes preguntaba dónde queda, que eran tres campos— y
      // resuelve `VS_BO_EMPLOYER` por su código para el buscador. Es núcleo por
      // el mismo motivo: sin el conjunto el campo se queda en el texto libre
      // que este catálogo vino a cerrar.
      {
        name: 'empresas de Bolivia',
        kind: 'core',
        run: () => this.boEmployers.run(),
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
      // Contenido, no núcleo: sin el pack la mensajería sigue funcionando
      // entera, sólo el botón de stickers no tiene qué ofrecer. Depende del
      // tenant DEFAULT y del `SEED.systemWorkerUserId` que ya materializó el
      // catálogo de conceptos.
      {
        name: 'pack de stickers',
        kind: 'content',
        run: () => this.stickerPack.run(),
      },
      {
        name: 'verificación de identidad',
        kind: 'core',
        run: () => this.identityVerification.run(),
      },
      // FAR-C9: los tipos de sistema con que una farmacia conecta su API. Núcleo:
      // sin ellos, guardar una conexión responde que el tipo no está disponible.
      ...(this.pharmacySystems
        ? [
            {
              id: 'tipos-de-sistema-de-farmacia',
              name: 'tipos de sistema de farmacia',
              kind: 'core' as const,
              run: () => this.pharmacySystems!.run(),
            },
          ]
        : []),
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
      // Después de los formularios y no antes: en una base sin el paquete del
      // modelo es ese paso quien publica `VS_MEDICAL_SPECIALTY`, y éste sólo
      // suma miembros a un conjunto que ya existe. Antes del directorio de
      // redes, que mapea las especialidades de los médicos por nombre contra
      // el conjunto. Contenido: sin él el alta sigue funcionando con las del
      // modelo.
      {
        name: 'especialidades médicas ampliadas',
        kind: 'content',
        run: () => this.boMedicalSpecialties.run(),
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
      // Después de `boliviaInsurance`: cada cuenta cuelga del tenant de su
      // aseguradora. Mismo candado opt-in que las cuentas de proveedores.
      {
        name: 'cuentas de aseguradoras',
        kind: 'content',
        run: () => this.insurerAccounts.run(),
      },
      // H2 (carril M2 · MacBook, 2026-09-26): después de los roles de sistema
      // y del administrador de arranque, porque el alta de médico/paciente
      // necesita `authz.roles` materializado y un actor con el que auditar.
      // Opt-in con `SEED_PEOPLE_ENABLED`: sin la variable, no toca nada. Pedido
      // por `--only` se habilita igual (ver `explicitly`); el candado de demo no.
      {
        name: 'padrón de personas',
        kind: 'content',
        run: () => this.people.run(this.explicitly()),
      },
      // H3: después de `people` sólo por orden de lectura; depende de las
      // aseguradoras (`boliviaInsurance`) y del actor de arranque.
      {
        name: 'directorio de redes de aseguradoras',
        kind: 'content',
        run: () => this.directoryNetworks.run(this.explicitly()),
      },
      // F1 de infraestructura hospitalaria: reglas padre→hijo y de tipología
      // (concept ids de `practice.concepts.ts`, que el catálogo acaba de
      // materializar) y forma `LOC_FORM_ROOM` en los espacios anteriores. Es
      // núcleo: sin reglas, toda alta de espacio que cuelgue de un padre
      // responde 422 `SPACE_PARENT_RULE`.
      {
        name: 'reglas de infraestructura hospitalaria',
        kind: 'core',
        run: () => this.practiceInfrastructure.run(),
      },
      // Después de las aseguradoras y de las redes, y antes del servicio por
      // defecto de cada práctica: crea las organizaciones del padrón público
      // (hospitales, clínicas, centros de salud, laboratorios, imágenes y
      // farmacias) con el actor semilla como dueño. Opt-in por
      // `SEED_PADRON_ORGANIZATIONS_ENABLED`; en producción es el único paso de
      // la carga que corre, porque no crea cuentas.
      ...(this.padronOrganizations
        ? [
            {
              id: 'padron-organizaciones',
              name: 'organizaciones del padrón',
              kind: 'content' as const,
              run: () => this.padronOrganizations!.run(this.explicitly()),
            },
          ]
        : []),
      // Después de las organizaciones, a las que cuelga su cuenta de
      // administrador. Es de demostración: pasa por el candado común y en
      // producción no crea nada.
      ...(this.padronOrgAdmins
        ? [
            {
              id: 'padron-administradores',
              name: 'administradores de organizaciones del padrón',
              kind: 'content' as const,
              run: () =>
                this.padronOrgAdmins!.run(undefined, this.explicitly()),
            },
          ]
        : []),
      // Catálogo interno de herramientas de plataforma (`platform_ops`). Solo
      // necesita los conceptos `platform_ops:*` que materializó el catálogo.
      // Contenido: sin él `GET /admin/ops/tools` responde vacío, nada más.
      ...(this.toolRegistry
        ? [
            {
              id: 'registro-herramientas',
              name: 'registro de herramientas de plataforma',
              kind: 'content' as const,
              run: () => this.toolRegistry!.run(),
            },
          ]
        : []),
      // Mapa «pantalla → superficie → dominio» (`read_models.frontend_routes`) que
      // el panel de uso y errores usa para resolver cada `route_template`. Sólo
      // necesita los conceptos `read_models:*` del catálogo. Contenido: sin él
      // `GET /admin/analytics/parts` devuelve todo en `unmapped`, nada más.
      ...(this.frontendRoutes
        ? [
            {
              id: 'partes-del-frontend',
              name: 'partes del frontend (superficies y rutas)',
              kind: 'content' as const,
              run: () => this.frontendRoutes!.run(),
            },
          ]
        : []),
      // El último, y no por importancia: es el único paso que siembra **sobre
      // filas de negocio que ya existen** —una por práctica— en vez de
      // materializar un catálogo. Corre después de todo lo demás para que, si
      // el arranque acaba de crear la primera organización, encuentre su
      // práctica. No es núcleo: una práctica sin el servicio por defecto
      // funciona, sólo abre su catálogo vacío.
      {
        name: 'servicio por defecto de cada práctica',
        kind: 'content',
        run: () => this.practiceDefaultServices.run(),
      },
      // Opt-in (`SEED_QA_FLOWS=true`): sin la variable no hace nada. Va al final
      // porque sólo necesita el catálogo de conceptos (estados, tipos de caso y
      // métodos HTTP de `qa_lab`) y el tenant de plataforma, y no la alimenta nadie.
      {
        name: 'flujos del catálogo de QA',
        kind: 'content',
        run: () => this.qaFlows.run(),
      },
      // Al final de todo: proyecta al buscador los perfiles que los pasos
      // anteriores acaban de crear. Opt-in (`SEED_SEARCH_REINDEX=true`) porque
      // depende de que el buscador esté disponible; un entorno sin él sigue
      // sirviendo desde la base. Pedido por `--only=reindex-buscador` corre
      // siempre.
      ...(this.searchIndex
        ? [
            {
              id: 'reindex-buscador',
              name: 'reindexado del buscador público',
              kind: 'content' as const,
              run: () => this.reindexSearch(),
            },
          ]
        : []),
    ];
  }

  /**
   * Interruptor de un paso opt-in (`SEED_*_ENABLED`) según cómo se lo pidió.
   *
   * Pedir un paso por `--only` es intención explícita: lo habilita aunque su
   * variable esté apagada. Sin `--only` devuelve `undefined`, y el paso usa su
   * propia variable. Solo cubre el interruptor: el candado de las cuentas de
   * demostración (`demo-gate.ts`) lo evalúa cada paso y `--only` nunca lo saltea.
   */
  private explicitly(): true | undefined {
    return this.onlyRequested ? true : undefined;
  }

  /**
   * Reindexa el directorio público si el entorno lo pidió.
   *
   * Sin `SEED_SEARCH_REINDEX=true` (ni `--only`) no hace nada y lo dice en el
   * contador `skipped`; con él, un fallo del buscador falla el paso (queda en el
   * resumen y en el código de salida), no se traga.
   */
  private async reindexSearch(): Promise<Record<string, number>> {
    if (process.env.SEED_SEARCH_REINDEX !== 'true' && !this.onlyRequested) {
      return { skipped: 1 };
    }
    const outcome = await this.searchIndex!.reindexAll({ recreate: false });
    if (outcome.errors) {
      throw new Error(
        `El reindexado dejó errores parciales: ${outcome.indexed} de ${outcome.total}`,
      );
    }
    return { indexed: outcome.indexed, confirmed: outcome.confirmed };
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
    const from = Date.now();
    try {
      const result = await run();
      const step: SeedStepResult = {
        name,
        inserted: countInserted(result),
        tookMs: Date.now() - from,
        failed: false,
        ...(seedCounts(result) ? { counts: seedCounts(result) } : {}),
      };
      // `detail` lleva los contadores tal como los devolvió el seed, incluidos
      // los que `inserted` deja afuera: el agregado es para leer de un vistazo,
      // el detalle es para no perder nada.
      this.logger.info(
        { event: 'seed.step', ...step, detail: result },
        'Seed: ' + name,
      );
      return step;
    } catch (error) {
      const step: SeedStepResult = {
        name,
        inserted: null,
        tookMs: Date.now() - from,
        failed: true,
      };
      this.logger.warn(
        { err: error, event: 'seed.step.failed', ...step },
        'Seed omitido: ' + name,
      );
      return step;
    }
  }

  /**
   * Cierra la corrida con una línea que se lee de un vistazo.
   *
   * @param steps - Los pasos ya medidos.
   * @param startup - Marca de tiempo del inicio de la cadena.
   * @param skippedContent - Pasos de contenido que el entorno salteó.
   * @param coreFailed - Nombres de los pasos `core` que fallaron.
   * @returns El resumen agregado.
   */
  private summarize(
    steps: SeedStepResult[],
    startup: number,
    skippedContent = 0,
    coreFailed: readonly string[] = [],
  ): SeedRunSummary {
    const failed = steps.filter((step) => step.failed).length;
    // SEED-01: la readiness lee esto; un fallo núcleo tolerado fuera de producción
    // no puede quedar invisible para ella.
    this.coreState?.record(coreFailed);
    const summary: SeedRunSummary = {
      ok: steps.length - failed,
      failed,
      inserted: steps.reduce((total, step) => total + (step.inserted ?? 0), 0),
      tookMs: Date.now() - startup,
      steps,
      // Solo cuando hubo salteados: con el contenido encendido el resumen
      // conserva exactamente la forma que tenía antes de que el flag existiera.
      ...(skippedContent > 0 ? { skippedContent } : {}),
      ...(coreFailed.length > 0 ? { coreFailed: [...coreFailed] } : {}),
    };

    const line =
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
      this.logger.error({ event: 'seed.summary', ...summary }, line);
    } else {
      this.logger.info({ event: 'seed.summary', ...summary }, line);
    }

    return summary;
  }
}
