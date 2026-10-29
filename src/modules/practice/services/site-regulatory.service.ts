import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  ConflictException,
  PreconditionFailedException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { AUD } from '../../audit/audit.concepts';
import { HistoryRepository } from '../../audit/repositories';
import type { CareSpaces, PracticeSites } from '../entities';
import {
  FUNCTIONS,
  REGULATORY,
  TYPOLOGY_SOURCES,
  type TypologyCode,
} from '../infrastructure-catalog';
import { PRAC } from '../practice.concepts';
import { PracticeErrorReason } from '../practice.error-reasons';
import {
  CareSpacesRepository,
  InfrastructureRulesRepository,
} from '../repositories';
import { assertRowVersion, withVersionConflict } from '../http/row-version';
import { allowedFunctions } from './infrastructure-rules';
import { StructureContextService } from './structure-context.service';
import { mapReferenceViolation } from './structure-errors';
import {
  STRUCTURE_EVENTS,
  StructureEventsService,
} from './structure-events.service';
import { STRUCTURE_HISTORY, structureSnapshot } from './structure-history';
import { iso, ref } from './structure-mapper';
import type { ConceptRef } from '../dto/infrastructure.types';

/** Datos regulatorios de un establecimiento. */
export interface SiteRegulatory {
  readonly siteId: string;
  readonly snisCode: string | null;
  /** `true` si la plataforma verificó el código (sólo entonces reserva unicidad global). */
  readonly snisVerified: boolean;
  readonly snisVerifiedAt: string | null;
  readonly subsector: ConceptRef | null;
  readonly careLevel: ConceptRef | null;
  readonly typology: (ConceptRef & { source: string }) | null;
  readonly managingEntityName: string | null;
  readonly healthNetworkName: string | null;
  readonly sedes: ConceptRef | null;
  readonly municipalityName: string | null;
  readonly rowVersion: number;
}

/** Cuerpo de `PATCH /sites/:siteId/regulatory`; `null` limpia el dato. */
export interface RegulatoryPatch {
  snisCode?: string | null;
  subsectorCode?: string | null;
  careLevelCode?: string | null;
  typologyCode?: string | null;
  managingEntityName?: string | null;
  healthNetworkName?: string | null;
  sedesCode?: string | null;
  municipalityName?: string | null;
}

/** Un espacio que incumple la tipología nueva. */
interface TypologyConflict {
  readonly id: string;
  readonly code: string;
  readonly functionCode: string;
  readonly rule: 'TYPO_ALLOWED';
  readonly nextAction: string;
}

/**
 * Datos regulatorios del establecimiento (Bolivia): código SNIS, subsector,
 * nivel, tipología, red, SEDES y municipio (`procesos/03`, flujo A), y la
 * verificación del código SNIS, que es exclusiva de la plataforma.
 *
 * Reglas de seguridad de F1b:
 * - el tenant escribe `snis_code`; **sólo la plataforma** escribe
 *   `snis_verified_*` (trigger `42501` en la base) y lo hace abriendo el contexto
 *   SYSTEM únicamente para esa sentencia;
 * - un código verificado por otra organización responde un 409 **genérico**
 *   (`SNIS_CODE_UNAVAILABLE`): ni de quién es ni si existe;
 * - no hay ninguna búsqueda por `snis_code` fuera del tenant: la comprobación de
 *   disponibilidad devuelve sólo un booleano.
 */
@Injectable()
export class SiteRegulatoryService {
  /**
   * @param em - Contexto de persistencia.
   * @param context - Carga y autoriza.
   * @param spacesRepo - Espacios (para validar la tipología).
   * @param rulesRepo - Reglas de tipología.
   * @param historyRepo - Historia.
   * @param events - Outbox.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly context: StructureContextService,
    private readonly spacesRepo: CareSpacesRepository,
    private readonly rulesRepo: InfrastructureRulesRepository,
    private readonly historyRepo: HistoryRepository,
    private readonly events: StructureEventsService,
  ) {}

  /**
   * `GET /sites/:siteId/regulatory`.
   *
   * @param siteId - Establecimiento.
   * @param actor - Quien lee.
   * @returns Los datos regulatorios.
   */
  async get(siteId: string, actor: AuthenticatedUser): Promise<SiteRegulatory> {
    return this.em.transactional(async (tx) => {
      const { site } = await this.context.site(tx, siteId, actor, 'read');
      return this.view(site);
    });
  }

  /**
   * `PATCH /sites/:siteId/regulatory` con `If-Match`. Cambiar la tipología valida
   * que los espacios no clausurados la cumplan (INV-07): 409 `TYPOLOGY_CONFLICT`
   * con la lista.
   *
   * @param siteId - Establecimiento.
   * @param patch - Campos a cambiar.
   * @param expectedVersion - `If-Match`.
   * @param actor - Quien edita.
   * @param correlationId - Id de correlación.
   * @returns Los datos regulatorios actualizados.
   */
  async patch(
    siteId: string,
    patch: RegulatoryPatch,
    expectedVersion: number,
    actor: AuthenticatedUser,
    correlationId?: string,
  ): Promise<SiteRegulatory> {
    return this.em.transactional(async (tx) => {
      const { site, tenantId } = await this.context.site(
        tx,
        siteId,
        actor,
        'regulatory',
      );
      assertRowVersion(site.rowVersion, expectedVersion);
      const changed: string[] = [];
      let snisChanged = false;

      const pick = (
        field: string,
        value: string | null | undefined,
        family: { byInput(i: string): { id: string } | undefined },
        key:
          | 'subsectorConceptId'
          | 'careLevelConceptId'
          | 'facilityTypologyConceptId'
          | 'sedesDepartmentConceptId',
      ): void => {
        if (value === undefined) return;
        const next =
          value === null || value === ''
            ? undefined
            : family.byInput(value)?.id;
        if (value && !next) {
          throw new PreconditionFailedException(
            `Código inválido en ${field}: ${value}`,
            {
              errors: [
                { field, reason: PracticeErrorReason.CATALOG_CODE_INVALID },
              ],
            },
            PracticeErrorReason.CATALOG_CODE_INVALID,
          );
        }
        if ((site[key] ?? undefined) !== next) {
          site[key] = (next ?? null) as string;
          changed.push(field);
        }
      };
      const text = (
        field: string,
        value: string | null | undefined,
        key: 'managingEntityName' | 'healthNetworkName' | 'municipalityName',
      ): void => {
        if (value === undefined) return;
        const next =
          value === null || value.trim() === '' ? undefined : value.trim();
        if ((site[key] ?? undefined) !== next) {
          site[key] = (next ?? null) as string;
          changed.push(field);
        }
      };

      if (patch.snisCode !== undefined) {
        const next =
          patch.snisCode === null || patch.snisCode.trim() === ''
            ? undefined
            : patch.snisCode.trim();
        if ((site.snisCode ?? undefined) !== next) {
          if (next !== undefined)
            await this.assertSnisAvailable(tx, site, tenantId, next);
          site.snisCode = (next ?? null) as string;
          changed.push('snisCode');
          snisChanged = true;
        }
      }
      pick(
        'subsectorCode',
        patch.subsectorCode,
        REGULATORY.subsector,
        'subsectorConceptId',
      );
      pick(
        'careLevelCode',
        patch.careLevelCode,
        REGULATORY.careLevel,
        'careLevelConceptId',
      );
      pick(
        'sedesCode',
        patch.sedesCode,
        REGULATORY.sedes,
        'sedesDepartmentConceptId',
      );
      const previousTypology = site.facilityTypologyConceptId;
      pick(
        'typologyCode',
        patch.typologyCode,
        REGULATORY.typology,
        'facilityTypologyConceptId',
      );
      text(
        'managingEntityName',
        patch.managingEntityName,
        'managingEntityName',
      );
      text('healthNetworkName', patch.healthNetworkName, 'healthNetworkName');
      text('municipalityName', patch.municipalityName, 'municipalityName');

      if (changed.length === 0) return this.view(site);

      if (
        (site.facilityTypologyConceptId ?? undefined) !==
        (previousTypology ?? undefined)
      ) {
        await this.assertTypologyFits(tx, site);
      }

      touch(site, actor.id);
      await withVersionConflict(() => mapReferenceViolation(() => tx.flush()));
      // El trigger de la base borró la verificación al cambiar el código: lo que se
      // devuelve y se versiona refleja eso, sin tocar `snis_verified_*` desde acá.
      const snapshot = {
        ...structureSnapshot(site),
        ...(snisChanged
          ? { snisVerifiedAt: null, snisVerifiedByUserId: null }
          : {}),
      };
      await this.historyRepo.append(tx, STRUCTURE_HISTORY.site, site.id, {
        operationConceptId: AUD.OPERATION_UPDATE,
        dataSnapshot: snapshot,
        changedByUserId: actor.id,
        tenantId,
      });
      await this.events.publish(tx, {
        type: STRUCTURE_EVENTS.siteRegulatory,
        aggregateType: 'practice_site',
        aggregateId: site.id,
        tenantId,
        actorUserId: actor.id,
        correlationId,
        payload: {
          practiceSiteId: site.id,
          changedFields: changed,
          rowVersion: site.rowVersion,
        },
      });
      return this.view(site, snisChanged ? { verifiedAt: null } : undefined);
    });
  }

  /**
   * `POST /sites/:siteId/snis-verification`: la plataforma verifica el código SNIS.
   *
   * Sólo `SECURITY_ADMIN`/`SUPERADMIN` con el tenant del establecimiento en
   * contexto. Abre el contexto SYSTEM (`SET LOCAL`) para la única sentencia que
   * escribe `snis_verified_*` y lo cierra enseguida.
   *
   * @param siteId - Establecimiento.
   * @param actor - Operador de plataforma.
   * @param correlationId - Id de correlación.
   * @returns Los datos regulatorios con la verificación.
   */
  async verifySnis(
    siteId: string,
    actor: AuthenticatedUser,
    correlationId?: string,
  ): Promise<SiteRegulatory> {
    return this.em.transactional(async (tx) => {
      const { site, tenantId, access } = await this.context.site(
        tx,
        siteId,
        actor,
        'read',
      );
      if (access.level !== 'PLATFORM') {
        throw new ForbiddenException(
          'La verificación del código SNIS la registra la plataforma',
        );
      }
      if (!site.snisCode) {
        throw new PreconditionFailedException(
          'El establecimiento no tiene código SNIS que verificar',
          undefined,
          PracticeErrorReason.SNIS_CODE_MISSING,
        );
      }
      const now = new Date();
      await tx.execute("select set_config('app.system_context', 'true', true)");
      try {
        const rows = await tx.execute<{ id: string }[]>(
          `update practice.practice_sites
              set snis_verified_at = ?, snis_verified_by_user_id = ?, updated_at = ?, updated_by_user_id = ?
            where id = ? and tenant_id = ? and snis_code is not null
        returning id`,
          [now, actor.id, now, actor.id, site.id, tenantId],
        );
        if (rows.length === 0)
          throw new PreconditionFailedException(
            'No se pudo verificar el código',
            undefined,
            PracticeErrorReason.SNIS_CODE_MISSING,
          );
      } catch (error) {
        if (isUniqueViolation(error)) throw this.snisUnavailable();
        throw error;
      } finally {
        await tx.execute(
          "select set_config('app.system_context', 'false', true)",
        );
      }
      await this.historyRepo.append(tx, STRUCTURE_HISTORY.site, site.id, {
        operationConceptId: AUD.OPERATION_UPDATE,
        dataSnapshot: {
          ...structureSnapshot(site),
          snisVerifiedAt: now.toISOString(),
          snisVerifiedByUserId: actor.id,
        },
        changedByUserId: actor.id,
        tenantId,
      });
      await this.events.publish(tx, {
        type: STRUCTURE_EVENTS.siteSnisVerified,
        aggregateType: 'practice_site',
        aggregateId: site.id,
        tenantId,
        actorUserId: actor.id,
        correlationId,
        payload: { practiceSiteId: site.id, snisCode: site.snisCode },
      });
      return this.view(site, { verifiedAt: now });
    });
  }

  /** Vista del establecimiento; `verifiedAt` sobreescribe lo cargado cuando la base lo cambió por fuera de la entidad. */
  private view(
    site: PracticeSites,
    override?: { verifiedAt: Date | null },
  ): SiteRegulatory {
    const verifiedAt = override
      ? override.verifiedAt
      : (site.snisVerifiedAt ?? null);
    const typology = REGULATORY.typology.byConceptId(
      site.facilityTypologyConceptId,
    );
    return {
      siteId: site.id,
      snisCode: site.snisCode ?? null,
      snisVerified: verifiedAt !== null,
      snisVerifiedAt: iso(verifiedAt),
      subsector: ref(REGULATORY.subsector.byConceptId(site.subsectorConceptId)),
      careLevel: ref(REGULATORY.careLevel.byConceptId(site.careLevelConceptId)),
      typology: typology
        ? {
            ...ref(typology)!,
            source: TYPOLOGY_SOURCES[typology.code as TypologyCode],
          }
        : null,
      managingEntityName: site.managingEntityName ?? null,
      healthNetworkName: site.healthNetworkName ?? null,
      sedes: ref(REGULATORY.sedes.byConceptId(site.sedesDepartmentConceptId)),
      municipalityName: site.municipalityName ?? null,
      rowVersion: site.rowVersion,
    };
  }

  /**
   * El código no puede estar en otra sede del tenant ni verificado por otra
   * organización. La segunda comprobación cruza tenants, así que corre en
   * contexto SYSTEM y **sólo devuelve un booleano**.
   */
  private async assertSnisAvailable(
    tx: EntityManager,
    site: PracticeSites,
    tenantId: string,
    code: string,
  ): Promise<void> {
    const sameTenant = await tx.execute<{ id: string }[]>(
      'select id from practice.practice_sites where tenant_id = ? and snis_code = ? and id <> ? limit 1',
      [tenantId, code, site.id],
    );
    if (sameTenant.length > 0) throw this.snisUnavailable();

    await tx.execute("select set_config('app.system_context', 'true', true)");
    let taken = false;
    try {
      const rows = await tx.execute<{ taken: boolean }[]>(
        `select exists (
           select 1 from practice.practice_sites
            where snis_code = ? and snis_verified_at is not null and tenant_id <> ?
         ) as taken`,
        [code, tenantId],
      );
      taken = Boolean(rows[0]?.taken);
    } finally {
      await tx.execute(
        "select set_config('app.system_context', 'false', true)",
      );
    }
    if (taken) throw this.snisUnavailable();
  }

  /** Cambiar la tipología no puede dejar espacios existentes que la incumplan (INV-07). */
  private async assertTypologyFits(
    tx: EntityManager,
    site: PracticeSites,
  ): Promise<void> {
    const rules = await this.rulesRepo.loadRuleSet(tx);
    const allowed = allowedFunctions(rules, site.facilityTypologyConceptId);
    if (!allowed) return;
    const spaces = await this.spacesRepo.findBySite(tx, site.id);
    const conflicts: TypologyConflict[] = spaces
      .filter(
        (space: CareSpaces) => space.statusConceptId !== PRAC.SPACE_RETIRED,
      )
      .filter((space) => !allowed.has(space.spaceTypeConceptId))
      .map((space) => ({
        id: space.id,
        code: space.code,
        functionCode:
          FUNCTIONS.byConceptId(space.spaceTypeConceptId)?.code ??
          space.spaceTypeConceptId,
        rule: 'TYPO_ALLOWED' as const,
        nextAction: 'Clausurar el espacio o elegir otra tipología',
      }));
    if (conflicts.length > 0) {
      throw new ConflictException(
        'La nueva tipología no admite espacios que el establecimiento ya tiene',
        { spaces: conflicts },
        PracticeErrorReason.TYPOLOGY_CONFLICT,
      );
    }
  }

  /** 409 genérico: no dice de quién es el código ni si existe. */
  private snisUnavailable(): ConflictException {
    return new ConflictException(
      'El código SNIS no está disponible',
      undefined,
      PracticeErrorReason.SNIS_CODE_UNAVAILABLE,
    );
  }
}

/** ¿Es una violación de unicidad (`23505`)? */
function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Error &&
    ((error as { code?: unknown }).code === '23505' ||
      error.constructor?.name === 'UniqueConstraintViolationException')
  );
}
