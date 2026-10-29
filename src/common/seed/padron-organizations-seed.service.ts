import { Injectable } from '@nestjs/common';
import { MikroORM, type EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';

import { CONCEPTS, SEED, deterministicId } from '../constants/concepts';
import { PreconditionFailedException } from '../errors/domain.exception';
import { runWithTenant } from '../tenant/tenant-context';
import { Addresses } from '../../modules/common/entities';
import { AddressesService } from '../../modules/common/services';
import { OwnerType } from '../../modules/common/dto';
import { PublicProfiles } from '../../modules/community/entities';
import { COMM } from '../../modules/community/community.concepts';
import { PublicProfileProjectionService } from '../../modules/community/services';
import { Tenants } from '../../modules/directory/entities';
import {
  DIR,
  TENANT_TYPE_CONCEPT_BY_CODE,
  type TenantTypeCode,
} from '../../modules/directory/directory.concepts';
import { DirectoryTenantsService } from '../../modules/directory/services';
import {
  BO_MUNICIPALITIES,
  boDepartmentConceptId,
  boMunicipalityConceptId,
} from './bo-geography.catalog';
import { SEED_ACTOR_ID, ensureSeedActor } from './seed-actor';
import facilitiesDataset from './data/bolivia/health-facilities.dataset.json';

/** Una fila del padrón de establecimientos, tal como la deja el dataset. */
export interface PadronFacility {
  readonly code: string;
  readonly nombre: string;
  readonly razonSocial: string | null;
  readonly nit: string | null;
  readonly direccion: string | null;
  readonly telefonos: readonly string[];
  readonly departamento: string;
  readonly municipio: string;
  readonly tipo: string;
  readonly naturaleza: string;
  readonly lat: number | null;
  readonly lng: number | null;
  readonly precision: string | null;
  readonly source_file: string;
  readonly source_row: number;
}

/** Cómo se da de alta cada clase de establecimiento del padrón. */
interface FacilityKind {
  /** Tipo de organización de la plataforma. */
  readonly tenantType: TenantTypeCode;
  /** Cómo se la nombra en la ficha pública. */
  readonly label: string;
  /**
   * Si operar exige papeles que el padrón no trae (farmacias y laboratorios):
   * esas fichas no se verifican y su vitrina solo existe en demostración.
   */
  readonly needsPapers: boolean;
}

const KIND_BY_TIPO: Readonly<Record<string, FacilityKind>> = {
  CLINICA_PRIVADA: {
    tenantType: 'CLINIC',
    label: 'Clínica privada',
    needsPapers: false,
  },
  HOSPITAL: { tenantType: 'HOSPITAL', label: 'Hospital', needsPapers: false },
  CAJA_SALUD: {
    tenantType: 'HOSPITAL',
    label: 'Establecimiento de la seguridad social',
    needsPapers: false,
  },
  CENTRO_SALUD: {
    tenantType: 'HEALTH_OTHER',
    label: 'Centro de salud',
    needsPapers: false,
  },
  LABORATORIO: {
    tenantType: 'DIAGNOSTIC_CENTER',
    label: 'Laboratorio',
    needsPapers: true,
  },
  IMAGEN: {
    tenantType: 'DIAGNOSTIC_CENTER',
    label: 'Centro de diagnóstico por imágenes',
    needsPapers: false,
  },
  FARMACIA: { tenantType: 'PHARMACY', label: 'Farmacia', needsPapers: true },
};

/** Prefijo de los códigos que dejó la carga anterior a este paso. */
const LEGACY_CODE_PREFIX = 'CARGA_';

/** Naturaleza que el padrón asigna a los consultorios de las redes de aseguradoras. */
const NETWORK_OFFICE = 'RED_ASEGURADORA';

/** Lo que el paso dejó hecho en esta pasada. */
export interface PadronOrganizationsResult {
  /** Organizaciones dadas de alta. */
  created: number;
  /** Organizaciones que ya estaban. */
  existing: number;
  /** Organizaciones de la carga anterior (`CARGA_*`) que se tomaron como propias. */
  adopted: number;
  /** Filas que no se crearon porque hay más de una candidata a adoptar. */
  ambiguous: string[];
  /** Organizaciones que esta pasada verificó. */
  verified: number;
  /** Fichas que quedan pendientes porque operar exige papeles que no están. */
  pendingForPapers: number;
  /** Vitrinas públicas completadas en esta pasada. */
  showcases: number;
  /** Direcciones escritas en esta pasada. */
  addresses: number;
  /** Filas del padrón que no se pudieron clasificar. */
  skipped: string[];
  /** Organizaciones cuyo alta falló, con el motivo. */
  failed: string[];
  /** Por qué no se hizo nada, si se saltó todo el paso. */
  reason?: 'not-configured';
}

/** Los establecimientos del padrón que son organizaciones, sin los consultorios de red. */
export function padronFacilities(): PadronFacility[] {
  return (facilitiesDataset.datos as unknown as PadronFacility[]).filter(
    (row) => row.naturaleza !== NETWORK_OFFICE,
  );
}

/** Clase de organización (tipo de la plataforma) de una fila del padrón. */
export function padronTenantType(
  row: PadronFacility,
): TenantTypeCode | undefined {
  return KIND_BY_TIPO[row.tipo]?.tenantType;
}

/** Id determinista de la organización: el mismo en todos los entornos. */
export function padronTenantId(code: string): string {
  return deterministicId(`seed:tenant:padron:${code}`);
}

/** Id determinista de la membresía del dueño (el actor semilla). */
export function padronOwnerMembershipId(code: string): string {
  return deterministicId(`seed:tenant-membership:padron-owner:${code}`);
}

/** «LISTA_DE_CLINICAS_PRIVADAS_1.md» → «Lista de clinicas privadas». */
function readableSource(sourceFile: string): string {
  const text = sourceFile
    .replace(/\.md$/i, '')
    .replace(/_\d+$/, '')
    .replace(/_+/g, ' ')
    .toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function normalizeName(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[^A-Z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Municipios de Santa Cruz por nombre normalizado → código del INE. */
const SANTA_CRUZ_MUNICIPALITY_BY_NAME: ReadonlyMap<string, string> = new Map(
  BO_MUNICIPALITIES.filter((m) => m.department === 'SC').map((m) => [
    normalizeName(m.name),
    m.ine,
  ]),
);

/** `SANTA CRUZ DE LA SIERRA` → `Santa Cruz de la Sierra`. */
function titleCase(text: string): string {
  const small = new Set(['de', 'la', 'del', 'las', 'los', 'el', 'y']);
  return text
    .toLowerCase()
    .split(/\s+/)
    .map((word, i) =>
      i > 0 && small.has(word)
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(' ');
}

/**
 * Da de alta como organizaciones los establecimientos del padrón público de
 * Santa Cruz (hospitales, clínicas, centros de salud, laboratorios, centros de
 * imágenes y farmacias).
 *
 * ## Qué hace distinto a un seed de catálogo
 *
 * `BoliviaFacilitiesSeedService` deja una lista de consulta
 * (`VS_BO_HEALTH_FACILITY`). Este paso crea además la **organización** de cada
 * establecimiento, para que el directorio, la ficha pública y los enlaces
 * funcionen con entidades reales. Lo hace por los mismos servicios que usa la
 * API (`DirectoryTenantsService.provision`, `AddressesService`,
 * `PublicProfileProjectionService`) y no por SQL, y con ids deterministas
 * (`padronTenantId`): una organización tiene el mismo id en todos los entornos.
 *
 * ## Quién es el dueño
 *
 * El actor semilla, que no tiene credencial: nadie puede iniciar sesión como él,
 * así que estas fichas no entregan acceso a nadie. La organización real las
 * reclama sumándose como miembro.
 *
 * ## Qué se verifica y qué no
 *
 * Se verifica lo que `verify` acepta, con las mismas reglas en todos los
 * entornos. Las farmacias y los laboratorios necesitan papeles que el padrón no
 * trae: quedan pendientes, sin vitrina pública, salvo en un entorno de
 * demostración (`SEED_DEMO_ALLOW_PRODUCTION=true`), donde la vitrina existe para
 * que el directorio no salga vacío. Ninguna ficha se publica como una
 * declaración de la organización: la biografía dice que viene del padrón
 * público y no está verificada por ella.
 *
 * ## Qué no se inventa
 *
 * Las coordenadas son solo las del dataset, y no las que son del centro de la
 * ciudad (`precision: ciudad`): un punto genérico apilaría todas las farmacias
 * en el mismo lugar del mapa.
 *
 * Los consultorios de las redes de aseguradoras (`RED_ASEGURADORA`) no entran:
 * son lugares de atención de médicos, no organizaciones.
 */
@Injectable()
export class PadronOrganizationsSeedService {
  /**
   * @param orm - Acceso al `EntityManager` para las lecturas de convergencia.
   * @param tenants - Alta, verificación y vitrina de organizaciones.
   * @param addresses - Alta de direcciones postales.
   * @param projection - Vitrina pública de una organización.
   * @param logger - Registro con el contexto de este servicio.
   */
  constructor(
    private readonly orm: MikroORM,
    private readonly tenants: DirectoryTenantsService,
    private readonly addresses: AddressesService,
    private readonly projection: PublicProfileProjectionService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PadronOrganizationsSeedService.name);
  }

  /**
   * Ejecuta el paso.
   *
   * @param enabled - Interruptor del paso; apagado no hace nada.
   * @param demoShowcases - Si las fichas que necesitan papeles reciben vitrina
   *   (solo en un entorno de demostración).
   * @returns Qué quedó hecho en esta pasada.
   */
  async run(
    enabled = process.env.SEED_PADRON_ORGANIZATIONS_ENABLED === 'true',
    demoShowcases = process.env.SEED_DEMO_ALLOW_PRODUCTION === 'true',
  ): Promise<PadronOrganizationsResult> {
    const result: PadronOrganizationsResult = {
      created: 0,
      existing: 0,
      adopted: 0,
      ambiguous: [],
      verified: 0,
      pendingForPapers: 0,
      showcases: 0,
      addresses: 0,
      skipped: [],
      failed: [],
    };
    if (!enabled) return { ...result, reason: 'not-configured' };

    const em = this.orm.em.fork();
    await ensureSeedActor(em);
    const actor = { id: SEED_ACTOR_ID, roles: ['SECURITY_ADMIN'] };

    const facilities = (
      facilitiesDataset.datos as unknown as PadronFacility[]
    ).filter((row) => row.naturaleza !== NETWORK_OFFICE);
    const known = await this.knownState(em, facilities);

    for (const row of facilities) {
      const kind = KIND_BY_TIPO[row.tipo];
      if (!kind) {
        result.skipped.push(`${row.code}: tipo ${row.tipo} sin clasificar`);
        continue;
      }
      try {
        await this.ensureOrganization(
          row,
          kind,
          actor,
          known,
          demoShowcases,
          result,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        result.failed.push(`${row.code}: ${message}`);
        this.logger.warn(
          {
            operation: 'seed.padron-organizations',
            code: row.code,
            err: error,
          },
          'No se pudo completar una organización del padrón',
        );
      }
    }

    this.logger.info(
      {
        operation: 'seed.padron-organizations',
        created: result.created,
        existing: result.existing,
        adopted: result.adopted,
        ambiguous: result.ambiguous.length,
        verified: result.verified,
        pendingForPapers: result.pendingForPapers,
        showcases: result.showcases,
        addresses: result.addresses,
        skipped: result.skipped.length,
        failed: result.failed.length,
      },
      'Organizaciones del padrón sembradas',
    );
    return result;
  }

  /**
   * Resuelve la organización de cada fila: la propia (por id fijo o por código)
   * o, si no hay, una adoptada de la carga anterior.
   *
   * Público porque quien cuelga cuentas de las organizaciones (los
   * administradores) tiene que apuntar a la misma organización que este paso.
   */
  async resolveIds(
    em: EntityManager,
    facilities: readonly PadronFacility[] = padronFacilities(),
  ): Promise<{
    idByCode: Map<string, string>;
    ambiguous: Set<string>;
    fixedIds: Map<string, string>;
  }> {
    const fixedIds = new Map(
      facilities.map((row) => [row.code, padronTenantId(row.code)]),
    );
    const owned = await em.find(Tenants, {
      $or: [
        { id: { $in: [...fixedIds.values()] } },
        { code: { $in: [...fixedIds.keys()] } },
      ],
    });
    const idByCode = new Map<string, string>();
    for (const tenant of owned) {
      const row = facilities.find((r) => r.code === tenant.code);
      if (row) idByCode.set(row.code, tenant.id);
    }
    // Una organización encontrada solo por id (código distinto) también es de la fila.
    for (const [code, id] of fixedIds) {
      if (!idByCode.has(code) && owned.some((t) => t.id === id)) {
        idByCode.set(code, id);
      }
    }

    const ambiguous = new Set<string>();
    const legacy = await em.find(Tenants, {
      // `_` es comodín en LIKE: se escapa para que el prefijo sea literal.
      code: { $like: `${LEGACY_CODE_PREFIX.replace(/_/g, String.raw`\_`)}%` },
    });
    const claimed = new Set<string>();
    for (const row of facilities) {
      if (idByCode.has(row.code)) continue;
      const kind = KIND_BY_TIPO[row.tipo];
      if (!kind) continue;
      const wanted = normalizeName(row.nombre);
      const typeConceptId = TENANT_TYPE_CONCEPT_BY_CODE[kind.tenantType];
      const candidates = legacy.filter(
        (t) =>
          !claimed.has(t.id) &&
          t.tenantTypeConceptId === typeConceptId &&
          normalizeName(t.tradeName ?? t.legalName) === wanted,
      );
      if (candidates.length === 1) {
        idByCode.set(row.code, candidates[0].id);
        claimed.add(candidates[0].id);
      } else if (candidates.length > 1) {
        ambiguous.add(row.code);
      }
    }
    return { idByCode, ambiguous, fixedIds };
  }

  /**
   * Lee de una vez lo que ya existe, para no preguntar fila por fila en cada
   * despliegue: las 523 comprobaciones son unas pocas consultas.
   *
   * ## Adopción de la carga anterior
   *
   * Antes de este paso, dev y test se cargaron con scripts que daban a cada
   * organización un código `CARGA_*`. Crear ahora las del padrón las duplicaría.
   * Por cada fila sin organización propia se busca una `CARGA_*` con el mismo
   * nombre normalizado y el mismo tipo: si hay una sola, se la adopta (queda
   * como la organización de esa fila, con el id que ya tiene); si hay más de
   * una, no se elige ninguna ni se crea otra, y la fila se informa como
   * ambigua. No se renombra, no se borra y no se cambia nada de la adoptada.
   */
  private async knownState(
    em: EntityManager,
    facilities: readonly PadronFacility[],
  ): Promise<KnownState> {
    const { idByCode, ambiguous, fixedIds } = await this.resolveIds(
      em,
      facilities,
    );

    const known = [...idByCode.values()];
    const tenants = await em.find(Tenants, { id: { $in: known } });
    const profiles = await em.find(PublicProfiles, {
      targetId: { $in: known },
    });
    const withAddress = await em.find(Addresses, {
      ownerId: { $in: known },
    });
    return {
      idByCode,
      ambiguous,
      adopted: new Set(
        [...idByCode]
          .filter(([code, id]) => id !== fixedIds.get(code))
          .map(([c]) => c),
      ),
      tenants: new Map(tenants.map((t) => [t.id, t.statusConceptId])),
      showcaseHeadlines: new Map(profiles.map((p) => [p.targetId, p.headline])),
      withAddress: new Set(withAddress.map((a) => a.ownerId)),
    };
  }

  private async ensureOrganization(
    row: PadronFacility,
    kind: FacilityKind,
    actor: { id: string; roles: string[] },
    known: KnownState,
    demoShowcases: boolean,
    result: PadronOrganizationsResult,
  ): Promise<void> {
    if (known.ambiguous.has(row.code)) {
      result.ambiguous.push(
        `${row.code}: más de una organización ${LEGACY_CODE_PREFIX}* con el mismo nombre y tipo`,
      );
      return;
    }
    const tenantId = known.idByCode.get(row.code) ?? padronTenantId(row.code);
    let status = known.tenants.get(tenantId);

    if (status === undefined) {
      await runWithTenant(SEED.tenantId, () =>
        this.tenants.provision(
          {
            code: row.code,
            legalName: (row.razonSocial ?? row.nombre).slice(0, 300),
            tradeName: row.nombre.slice(0, 300),
            ownerUserId: actor.id,
            tenantType: kind.tenantType,
            countryConceptId: CONCEPTS.COUNTRY_BO,
            jurisdictionConceptId: CONCEPTS.JURISDICTION_BO,
            timeZone: 'America/La_Paz',
          },
          actor,
          {
            tenantId,
            ownerMembershipId: padronOwnerMembershipId(row.code),
          },
        ),
      );
      status = DIR.TENANT_PENDING;
      known.tenants.set(tenantId, status);
      result.created++;
    } else if (known.adopted.has(row.code)) {
      result.adopted++;
    } else {
      result.existing++;
    }

    if (!known.withAddress.has(tenantId)) {
      if (await this.createAddress(tenantId, row, actor)) {
        known.withAddress.add(tenantId);
        result.addresses++;
      }
    }

    if (kind.needsPapers) {
      result.pendingForPapers++;
      if (!demoShowcases) return;
      await this.completeShowcase(tenantId, row, kind, actor, known, result);
      return;
    }

    if (status === DIR.TENANT_PENDING) {
      try {
        await runWithTenant(SEED.tenantId, () =>
          this.tenants.verify(tenantId, {}, actor),
        );
        known.tenants.set(tenantId, CONCEPTS.TENANT_ACTIVE);
        // `verify` proyecta la vitrina: ya existe, solo falta completarla.
        if (!known.showcaseHeadlines.has(tenantId)) {
          known.showcaseHeadlines.set(tenantId, undefined);
        }
        result.verified++;
      } catch (error) {
        // Una regla de `verify` que no se cumple deja la ficha pendiente: es el
        // estado honesto, no un fallo del paso.
        if (!(error instanceof PreconditionFailedException)) throw error;
        result.pendingForPapers++;
        return;
      }
    }
    await this.completeShowcase(tenantId, row, kind, actor, known, result);
  }

  /**
   * Deja la vitrina de la ficha con titular y presentación, una sola vez.
   *
   * Si la organización todavía no tiene vitrina (una ficha que no pasó por
   * `verify`, o que otro proceso dejó activa sin proyectarla) la proyecta antes.
   */
  private async completeShowcase(
    tenantId: string,
    row: PadronFacility,
    kind: FacilityKind,
    actor: { id: string; roles: string[] },
    known: KnownState,
    result: PadronOrganizationsResult,
  ): Promise<void> {
    if (known.showcaseHeadlines.get(tenantId)) return;
    if (!known.showcaseHeadlines.has(tenantId)) {
      await this.orm.em.fork().transactional((tx) =>
        this.projection.projectOrganization(tx, {
          tenantId,
          targetId: tenantId,
          slug: `organization-${tenantId}`,
          displayName: row.nombre.slice(0, 200),
          actorUserId: actor.id,
          targetTypeConceptId:
            kind.tenantType === 'PHARMACY'
              ? COMM.PROFILE_TARGET_PHARMACY
              : COMM.PROFILE_TARGET_ORGANIZATION,
        }),
      );
      known.showcaseHeadlines.set(tenantId, undefined);
    }
    const municipality = titleCase(
      row.municipio.replace(/\(.*?\)/g, '').trim(),
    );
    const lines = [
      'Ficha del padrón público de establecimientos de salud. ' +
        'La información no fue verificada por la organización.',
      `Fuente: ${readableSource(row.source_file)}.`,
    ];
    if (row.direccion) lines.push(`Dirección: ${row.direccion}.`);
    if (row.telefonos.length) {
      lines.push(`Teléfono: ${row.telefonos.join(' / ')}.`);
    }
    await runWithTenant(SEED.tenantId, () =>
      this.tenants.updatePublicProfile(
        tenantId,
        {
          displayName: row.nombre.slice(0, 200),
          headline: `${kind.label} · ${municipality}`.slice(0, 200),
          biography: lines.join('\n').slice(0, 5000),
        },
        actor,
      ),
    );
    known.showcaseHeadlines.set(tenantId, 'listo');
    result.showcases++;
  }

  /**
   * Escribe la dirección de la ficha cuando hay algo real que escribir.
   *
   * @returns `true` si escribió una dirección.
   */
  private async createAddress(
    tenantId: string,
    row: PadronFacility,
    actor: { id: string; roles: string[] },
  ): Promise<boolean> {
    const hasPoint =
      row.lat !== null && row.lng !== null && row.precision !== 'ciudad';
    if (!row.direccion && !hasPoint) return false;

    const ine = SANTA_CRUZ_MUNICIPALITY_BY_NAME.get(
      normalizeName(row.municipio),
    );
    await this.addresses.create(
      {
        ownerType: OwnerType.TENANT,
        ownerId: tenantId,
        lines: [row.direccion ?? titleCase(row.municipio)],
        city: titleCase(row.municipio.replace(/\(.*?\)/g, '').trim()),
        municipalityConceptId: ine ? boMunicipalityConceptId(ine) : undefined,
        administrativeAreaConceptId:
          row.departamento === 'SC' ? boDepartmentConceptId('SC') : undefined,
        ...(hasPoint ? { latitude: row.lat, longitude: row.lng } : {}),
      },
      actor,
    );
    return true;
  }
}

/** Lo que ya existe en la base, leído una sola vez al empezar. */
interface KnownState {
  /** Organización de cada fila (por código), la propia o la adoptada. */
  readonly idByCode: Map<string, string>;
  /** Filas cuya organización es una adoptada de la carga anterior. */
  readonly adopted: Set<string>;
  /** Filas con más de una candidata a adoptar. */
  readonly ambiguous: Set<string>;
  /** Estado de cada organización existente. */
  readonly tenants: Map<string, string>;
  /** Titular de la vitrina de cada organización que ya tiene una. */
  readonly showcaseHeadlines: Map<string, string | undefined>;
  /** Organizaciones que ya tienen dirección. */
  readonly withAddress: Set<string>;
}
