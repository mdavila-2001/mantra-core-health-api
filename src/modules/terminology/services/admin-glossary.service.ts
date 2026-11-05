import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConcurrencyConflictException,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  decodeKeysetCursor,
  encodeKeysetCursor,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  glossaryCodeSystemVersionId,
  glossaryTermConceptId,
} from '../../../common/seed/glossary-taxonomy';
import {
  GLOSSARY_ALL_TERMS_CODE,
  GLOSSARY_CLINICAL_DEFINITION_PROPERTY_CODE,
  GLOSSARY_PLAIN_SUMMARY_PROPERTY_CODE,
  GLOSSARY_SLUG_PROPERTY_CODE,
} from '../glossary.constants';
import { CatalogConcepts } from '../entities';
import {
  CatalogConceptsRepository,
  ConceptDesignationsRepository,
  ValueSetsRepository,
} from '../repositories';
import { TerminologyErrorReason } from '../terminology.error-reasons';
import {
  ADMIN_GLOSSARY_DEFAULT_LIMIT,
  type AdminCreateGlossaryTermDto,
  type AdminGlossaryPageDto,
  type AdminGlossaryTermDto,
  type AdminListGlossaryQueryDto,
  type AdminUpdateGlossaryTermDto,
  type GlossaryAdminAudience,
} from '../dto/admin-glossary.dto';

/** Propiedad que guarda el texto de cada tipo de usuario (no hay otra dimensión hoy). */
const AUDIENCE_PROPERTY: Readonly<Record<GlossaryAdminAudience, string>> = {
  patient: GLOSSARY_PLAIN_SUMMARY_PROPERTY_CODE,
  professional: GLOSSARY_CLINICAL_DEFINITION_PROPERTY_CODE,
};

const STRING_DATA_TYPE = 'string';
const JSON_DATA_TYPE = 'json';

/** Resultado de un alta; `created: false` es un reintento idempotente. */
export interface AdminGlossaryCreateResult {
  readonly term: AdminGlossaryTermDto;
  readonly created: boolean;
}

type Text = { es: string; en?: string };

/**
 * Editor administrativo del glosario global (H3).
 *
 * Reutiliza el motor de terminología sin tablas nuevas: un término es un
 * `catalog_concepts` del code system del glosario, con su designación preferida
 * en español, sus propiedades (`glossary-slug`, `glossary-plain-summary` para
 * pacientes, `glossary-clinical-definition` para profesionales) y su membresía
 * en el conjunto «todos los términos». El id es el mismo determinista que usa
 * el seed (`glossaryTermConceptId(slug)`), así que el alta es idempotente por
 * slug y nunca choca con el contenido curado.
 *
 * El glosario **no tiene tenant**: lo que se edita acá lo ven todas las
 * organizaciones. Por eso el controlador exige `SUPERADMIN` para escribir.
 * La versión que ve el cliente es `catalog_concepts.row_version`; cada cambio
 * de texto toca el concepto para que la versión suba.
 */
@Injectable()
export class AdminGlossaryService {
  constructor(
    private readonly em: EntityManager,
    private readonly conceptsRepo: CatalogConceptsRepository,
    private readonly designationsRepo: ConceptDesignationsRepository,
    private readonly valueSetsRepo: ValueSetsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AdminGlossaryService.name);
  }

  /** Página de términos, ordenada de forma determinista por `(code, id)`. */
  async list(query: AdminListGlossaryQueryDto): Promise<AdminGlossaryPageDto> {
    const em = this.em.fork();
    const limit = query.limit ?? ADMIN_GLOSSARY_DEFAULT_LIMIT;
    const states =
      query.state === 'active'
        ? [CONCEPTS.TERM_ACTIVE]
        : query.state === 'retired'
          ? [CONCEPTS.TERM_RETIRED]
          : [CONCEPTS.TERM_ACTIVE, CONCEPTS.TERM_RETIRED];

    const and: Record<string, unknown>[] = [
      { codeSystemVersionId: glossaryCodeSystemVersionId },
      { stateConceptId: { $in: [...states] } },
    ];
    if (query.q) {
      const pattern = `%${query.q}%`;
      and.push({
        $or: [{ code: { $ilike: pattern } }, { display: { $ilike: pattern } }],
      });
    }
    if (query.cursor) {
      const key = decodeKeysetCursor(query.cursor);
      if (typeof key.code === 'string' && typeof key.id === 'string') {
        and.push({
          $or: [
            { code: { $gt: key.code } },
            { code: key.code, id: { $gt: key.id } },
          ],
        });
      }
    }

    const rows = await em.find(
      CatalogConcepts,
      { $and: and },
      { orderBy: { code: 'ASC', id: 'ASC' }, limit: limit + 1 },
    );
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page.at(-1);
    const items = await this.toTerms(em, page, query.audience);
    return {
      items,
      count: items.length,
      limit,
      nextCursor:
        hasMore && last
          ? encodeKeysetCursor({ code: last.code, id: last.id })
          : null,
    };
  }

  /** Un término del glosario con el texto del tipo de usuario pedido. */
  async get(
    conceptId: string,
    audience: GlossaryAdminAudience,
  ): Promise<AdminGlossaryTermDto> {
    const em = this.em.fork();
    const concept = await this.loadTerm(em, conceptId);
    const [term] = await this.toTerms(em, [concept], audience);
    return term;
  }

  /** Alta idempotente por slug; mismo contenido = `created: false`, otro = 409. */
  async create(
    dto: AdminCreateGlossaryTermDto,
    actor: AuthenticatedUser,
  ): Promise<AdminGlossaryCreateResult> {
    const conceptId = glossaryTermConceptId(dto.slug);
    return this.em.transactional(async (tx) => {
      const existing = await this.conceptsRepo.findById(tx, conceptId);
      if (existing) {
        const [current] = await this.toTerms(tx, [existing], dto.audience);
        if (
          existing.codeSystemVersionId === glossaryCodeSystemVersionId &&
          current.display === dto.display &&
          current.nameEs === dto.nameEs &&
          sameText(current.text, dto.text)
        ) {
          return { term: current, created: false };
        }
        throw new ConflictException(
          'Ya existe un término del glosario con ese slug',
          { slug: dto.slug },
          TerminologyErrorReason.GLOSSARY_TERM_ALREADY_EXISTS,
        );
      }

      const umbrella = await this.valueSetsRepo.findByInternalCode(
        tx,
        GLOSSARY_ALL_TERMS_CODE,
      );
      const version = umbrella
        ? await this.valueSetsRepo.findDefaultVersion(tx, umbrella.id)
        : null;
      if (!version) {
        throw new PreconditionFailedException(
          'El glosario no está inicializado',
          undefined,
          TerminologyErrorReason.GLOSSARY_UMBRELLA_MISSING,
        );
      }

      const concept = tx.create(
        CatalogConcepts,
        {
          id: conceptId,
          codeSystemVersionId: glossaryCodeSystemVersionId,
          code: `GLOSSARY_${dto.slug.toUpperCase().replace(/-/g, '_')}`,
          display: dto.display,
          abstract: false,
          selectable: true,
          stateConceptId: CONCEPTS.TERM_ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdByUserId: actor.id,
          updatedByUserId: actor.id,
        },
        { partial: true },
      );
      this.designationsRepo.createDesignation(tx, {
        conceptId,
        value: dto.nameEs,
        languageConceptId: CONCEPTS.LANG_ES,
        designationTypeConceptId: CONCEPTS.DESIG_PREFERRED,
        preferred: true,
        actorUserId: actor.id,
      });
      this.designationsRepo.createProperty(tx, {
        conceptId,
        propertyCode: GLOSSARY_SLUG_PROPERTY_CODE,
        valueJson: dto.slug,
        dataType: STRING_DATA_TYPE,
        actorUserId: actor.id,
      });
      this.designationsRepo.createProperty(tx, {
        conceptId,
        propertyCode: AUDIENCE_PROPERTY[dto.audience],
        valueJson: toText(dto.text),
        dataType: JSON_DATA_TYPE,
        actorUserId: actor.id,
      });
      const total = (
        await this.valueSetsRepo.countMembersByVersionIds(tx, [version.id])
      ).get(version.id);
      this.valueSetsRepo.createMember(tx, {
        valueSetVersionId: version.id,
        conceptId,
        included: true,
        ordinal: total ?? 0,
        actorUserId: actor.id,
      });
      await tx.flush();
      this.logger.info(
        { operation: 'terminology.admin-glossary.create', conceptId },
        'Glossary term created',
      );
      const [term] = await this.toTerms(tx, [concept], dto.audience);
      return { term, created: true };
    });
  }

  /** Edita el texto de un tipo de usuario y/o el nombre; versión desfasada = 409. */
  async update(
    conceptId: string,
    dto: AdminUpdateGlossaryTermDto,
    actor: AuthenticatedUser,
  ): Promise<AdminGlossaryTermDto> {
    if (dto.text === undefined && dto.nameEs === undefined) {
      throw new BadRequestException(
        'No hay nada que cambiar: envíe text o nameEs',
      );
    }
    return this.em.transactional(async (tx) => {
      const concept = await this.loadTerm(tx, conceptId);
      assertVersion(concept.rowVersion, dto.expectedRowVersion, conceptId);

      if (dto.text !== undefined) {
        const code = AUDIENCE_PROPERTY[dto.audience];
        const existing = await this.designationsRepo.findProperty(
          tx,
          conceptId,
          code,
        );
        if (existing) {
          existing.valueJson = toText(dto.text);
          touch(existing, actor.id);
        } else {
          this.designationsRepo.createProperty(tx, {
            conceptId,
            propertyCode: code,
            valueJson: toText(dto.text),
            dataType: JSON_DATA_TYPE,
            actorUserId: actor.id,
          });
        }
      }
      if (dto.nameEs !== undefined) {
        const siblings = await this.designationsRepo.findByLanguageForUpdate(
          tx,
          conceptId,
          CONCEPTS.LANG_ES,
        );
        const preferred = siblings.find((d) => d.preferred);
        if (preferred) {
          preferred.value = dto.nameEs;
          touch(preferred, actor.id);
        } else {
          this.designationsRepo.createDesignation(tx, {
            conceptId,
            value: dto.nameEs,
            languageConceptId: CONCEPTS.LANG_ES,
            designationTypeConceptId: CONCEPTS.DESIG_PREFERRED,
            preferred: true,
            actorUserId: actor.id,
          });
        }
      }
      // Sube la versión del término: es lo que el cliente usa como precondición.
      touch(concept, actor.id);
      await tx.flush();
      const [term] = await this.toTerms(tx, [concept], dto.audience);
      return term;
    });
  }

  /**
   * Retira (`false`) o reactiva (`true`) un término. Idempotente: si ya está en
   * el estado pedido no escribe ni sube la versión. Retirar excluye sus
   * membresías de las expansiones, igual que `$deprecate`; reactivar las
   * vuelve a incluir.
   */
  async setActive(
    conceptId: string,
    active: boolean,
    expectedRowVersion: number,
    audience: GlossaryAdminAudience,
    actor: AuthenticatedUser,
  ): Promise<AdminGlossaryTermDto> {
    return this.em.transactional(async (tx) => {
      const concept = await this.loadTerm(tx, conceptId, true);
      const target = active ? CONCEPTS.TERM_ACTIVE : CONCEPTS.TERM_RETIRED;
      if (concept.stateConceptId === target) {
        const [same] = await this.toTerms(tx, [concept], audience);
        return same;
      }
      assertVersion(concept.rowVersion, expectedRowVersion, conceptId);
      concept.stateConceptId = target;
      concept.validTo = (active ? null : new Date()) as never;
      touch(concept, actor.id);
      const members = await this.valueSetsRepo.findMembersByConceptForUpdate(
        tx,
        conceptId,
      );
      for (const member of members) {
        member.included = active;
        touch(member, actor.id);
      }
      await tx.flush();
      const [term] = await this.toTerms(tx, [concept], audience);
      return term;
    });
  }

  /** Concepto del glosario o 404 uniforme (inexistente o de otro code system). */
  private async loadTerm(
    em: EntityManager,
    conceptId: string,
    forUpdate = false,
  ): Promise<CatalogConcepts> {
    const concept = forUpdate
      ? await this.conceptsRepo.findByIdForUpdate(em, conceptId)
      : await this.conceptsRepo.findById(em, conceptId);
    if (
      !concept ||
      concept.codeSystemVersionId !== glossaryCodeSystemVersionId
    ) {
      throw new ResourceNotFoundException(
        'Término no encontrado',
        undefined,
        TerminologyErrorReason.GLOSSARY_TERM_NOT_FOUND,
      );
    }
    return concept;
  }

  private async toTerms(
    em: EntityManager,
    concepts: readonly CatalogConcepts[],
    audience: GlossaryAdminAudience,
  ): Promise<AdminGlossaryTermDto[]> {
    const ids = concepts.map((c) => c.id);
    const [props, names] = await Promise.all([
      this.designationsRepo.findPropertiesForConcepts(em, ids),
      this.designationsRepo.findPreferredByLanguageForConcepts(
        em,
        ids,
        CONCEPTS.LANG_ES,
      ),
    ]);
    return concepts.map((c) => {
      const p = props.get(c.id) ?? {};
      const raw = p[AUDIENCE_PROPERTY[audience]];
      const slug = p[GLOSSARY_SLUG_PROPERTY_CODE];
      return {
        conceptId: c.id,
        slug: typeof slug === 'string' ? slug : '',
        code: c.code,
        display: c.display,
        nameEs: names.get(c.id)?.value ?? c.display,
        state:
          c.stateConceptId === CONCEPTS.TERM_RETIRED ? 'retired' : 'active',
        audience,
        text: asText(raw),
        rowVersion: c.rowVersion,
        updatedAt: c.updatedAt.toISOString(),
        updatedByUserId: c.updatedByUserId ?? undefined,
      };
    });
  }
}

function assertVersion(actual: number, expected: number, id: string): void {
  if (actual === expected) return;
  throw new ConcurrencyConflictException(
    'El término fue modificado por otra persona; recargue y reintente',
    { id, expected, actual },
    TerminologyErrorReason.GLOSSARY_TERM_VERSION_MISMATCH,
  );
}

function toText(text: Text): Text {
  return text.en === undefined ? { es: text.es } : { es: text.es, en: text.en };
}

function asText(raw: unknown): Text | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw))
    return null;
  const { es, en } = raw as { es?: unknown; en?: unknown };
  if (typeof es !== 'string') return null;
  return typeof en === 'string' ? { es, en } : { es };
}

function sameText(a: Text | null, b: Text): boolean {
  return a !== null && a.es === b.es && (a.en ?? undefined) === b.en;
}
