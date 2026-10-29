import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import { AUD } from '../../audit/audit.concepts';
import { HistoryRepository } from '../../audit/repositories';
import { ATTRIBUTES } from '../../practice/infrastructure-catalog';
import { BILL } from '../billing.concepts';
import { BillingErrorReason } from '../billing.error-reasons';
import { isIsoDay } from '../domain/zoned-time';
import { validateTariffShape } from '../domain/tariff-rules';
import type {
  CloseSpaceTariffDto,
  CreateSpaceTariffDto,
  ListSpaceTariffsQueryDto,
  ListSpaceTariffsResponseDto,
  SpaceTariffResponseDto,
} from '../dto';
import { BillingAccessService } from './billing-access.service';
import { CHARGE_EVENTS, ChargeEventsService } from './charge-events.service';

/** Fila de `billing.space_tariffs` con las fechas como texto. */
interface TariffRow {
  id: string;
  tenant_id: string;
  practice_id: string;
  tariff_kind_concept_id: string;
  bed_category_concept_id: string | null;
  care_space_id: string | null;
  service_catalog_id: string;
  unit_minutes: number | null;
  minimum_units: number | null;
  unit_price: string;
  currency_concept_id: string;
  valid_from: string;
  valid_to: string | null;
  created_at: Date;
}

const COLUMNS = `t.id, t.tenant_id, t.practice_id, t.tariff_kind_concept_id, t.bed_category_concept_id,
  t.care_space_id, t.service_catalog_id, t.unit_minutes, t.minimum_units, t.unit_price::text as unit_price,
  t.currency_concept_id, t.valid_from::text as valid_from, t.valid_to::text as valid_to, t.created_at`;

const ZERO_UUID = '00000000-0000-0000-0000-000000000000';

/** "No existe" de una tarifa; la de otro tenant responde idéntico. */
const TARIFF_NOT_FOUND = {
  message: 'Tarifa no encontrada',
  reason: BillingErrorReason.TARIFF_NOT_FOUND,
};

/**
 * Tarifas de espacio versionadas con vigencia (CONTRATO-F2-F5 F5e): día-cama por
 * categoría de cama (o propia de una sala) y quirófano por tiempo.
 *
 * Una tarifa no se edita ni se borra: se **cierra** (`valid_to`) y se abre otra
 * con la vigencia siguiente. Los cargos devengados guardan una foto exacta del
 * precio, así que cambiar o cerrar una tarifa nunca altera lo ya devengado, y la
 * base impide cerrarla antes de una fecha ya devengada con ella.
 */
@Injectable()
export class SpaceTariffsService {
  /**
   * @param em - Contexto de persistencia.
   * @param access - Autorización de Facturación.
   * @param events - Outbox.
   * @param historyRepo - Historia append-only.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly access: BillingAccessService,
    private readonly events: ChargeEventsService,
    private readonly historyRepo: HistoryRepository,
  ) {}

  /**
   * `GET /billing/space-tariffs`.
   *
   * @param query - Práctica y filtros.
   * @param actor - Quien lee.
   * @returns Las tarifas de la práctica, las más nuevas primero.
   */
  async list(
    query: ListSpaceTariffsQueryDto,
    actor: AuthenticatedUser,
  ): Promise<ListSpaceTariffsResponseDto> {
    if (query.onDate !== undefined && !isIsoDay(query.onDate))
      throw this.invalid([
        { field: 'onDate', message: 'No es una fecha válida' },
      ]);
    const tx = this.em.fork();
    await this.access.forPractice(
      tx,
      actor,
      'infra.tariff.view',
      query.practiceId,
      'any',
    );
    const params: unknown[] = [query.practiceId, requireTenantId()];
    let filters = '';
    if (query.kind) {
      filters += ' and t.tariff_kind_concept_id = ?';
      params.push(BILL[query.kind]);
    }
    if (query.onDate) {
      filters +=
        ' and t.valid_from <= ?::date and (t.valid_to is null or ?::date < t.valid_to)';
      params.push(query.onDate, query.onDate);
    }
    params.push(query.limit ?? 100);
    const rows = await tx.execute<TariffRow[]>(
      `select ${COLUMNS} from billing.space_tariffs t
        where t.practice_id = ? and t.tenant_id = ?${filters}
        order by t.valid_from desc, t.id
        limit ?`,
      params,
    );
    const items = rows.map((row) => this.toResponse(row));
    return { items, count: items.length };
  }

  /**
   * `POST /billing/space-tariffs`.
   *
   * @param dto - La tarifa.
   * @param actor - Quien la crea.
   * @param correlationId - Id de correlación.
   * @returns La tarifa creada.
   */
  async create(
    dto: CreateSpaceTariffDto,
    actor: AuthenticatedUser,
    correlationId?: string,
  ): Promise<SpaceTariffResponseDto> {
    const days = [
      ['validFrom', dto.validFrom],
      ['validTo', dto.validTo],
    ] as const;
    const badDays = days.filter(
      ([, value]) => value !== undefined && !isIsoDay(value),
    );
    if (badDays.length > 0)
      throw this.invalid(
        badDays.map(([field]) => ({
          field,
          message: 'No es una fecha válida',
        })),
      );
    const category = dto.bedCategoryCode
      ? ATTRIBUTES.bedCategory.byInput(dto.bedCategoryCode)
      : undefined;
    if (dto.bedCategoryCode && !category)
      throw this.invalid([
        { field: 'bedCategoryCode', message: 'No es una categoría de cama' },
      ]);
    const shape = validateTariffShape({
      kind: dto.kind,
      bedCategoryConceptId: category?.id,
      careSpaceId: dto.careSpaceId,
      unitMinutes: dto.unitMinutes,
      minimumUnits: dto.minimumUnits,
      unitPrice: dto.unitPrice,
      validFrom: dto.validFrom,
      validTo: dto.validTo,
    });
    if (shape.length > 0) throw this.invalid(shape);

    const tenantId = requireTenantId();
    return this.em.transactional(async (tx) => {
      if (dto.careSpaceId) {
        const space = await tx.execute<{ id: string }[]>(
          `select id from practice.care_spaces cs
            where cs.id = ? and cs.tenant_id = ?
              and exists (select 1 from practice.practice_sites s
                           where s.id = cs.practice_site_id and s.practice_id = ?)`,
          [dto.careSpaceId, tenantId, dto.practiceId],
        );
        if (space.length === 0)
          throw new ResourceNotFoundException(
            'Espacio no encontrado',
            undefined,
            BillingErrorReason.TARIFF_SPACE_NOT_FOUND,
          );
        await this.access.forSpace(
          tx,
          actor,
          'infra.tariff.write',
          dto.careSpaceId,
        );
      } else {
        await this.access.forPractice(
          tx,
          actor,
          'infra.tariff.write',
          dto.practiceId,
          'all',
        );
      }

      // El servicio es del catálogo de ESTA práctica; uno de otra práctica o de otra
      // organización responde igual (no se confirma que existe).
      const service = await tx.execute<{ id: string }[]>(
        'select id from billing.service_catalog where id = ? and practice_id = ?',
        [dto.serviceCatalogId, dto.practiceId],
      );
      if (service.length === 0)
        throw new PreconditionFailedException(
          'El servicio no pertenece a la práctica de la tarifa',
          { errors: [{ field: 'serviceCatalogId' }] },
          BillingErrorReason.TARIFF_SERVICE_NOT_IN_PRACTICE,
        );

      const currencyConceptId =
        dto.currencyConceptId ??
        (await this.practiceCurrency(tx, dto.practiceId));
      if (!currencyConceptId)
        throw this.invalid([
          {
            field: 'currencyConceptId',
            message: 'La práctica no tiene moneda: indicá la de la tarifa',
          },
        ]);
      const currency = await tx.execute<{ id: string }[]>(
        'select id from terminology.catalog_concepts where id = ?',
        [currencyConceptId],
      );
      if (currency.length === 0)
        throw this.invalid([
          { field: 'currencyConceptId', message: 'La moneda no existe' },
        ]);

      const clash = await tx.execute<{ id: string }[]>(
        `select id from billing.space_tariffs
          where practice_id = ? and tariff_kind_concept_id = ?
            and coalesce(bed_category_concept_id, ?::uuid) = coalesce(?::uuid, ?::uuid)
            and coalesce(care_space_id, ?::uuid) = coalesce(?::uuid, ?::uuid)
            and daterange(valid_from, valid_to, '[)') && daterange(?::date, ?::date, '[)')
          limit 1`,
        [
          dto.practiceId,
          BILL[dto.kind],
          ZERO_UUID,
          category?.id ?? null,
          ZERO_UUID,
          ZERO_UUID,
          dto.careSpaceId ?? null,
          ZERO_UUID,
          dto.validFrom,
          dto.validTo ?? null,
        ],
      );
      if (clash.length > 0)
        throw new ConflictException(
          'Ya existe una tarifa vigente para esa clase en ese período; cerrala antes de abrir otra',
          { conflictingTariffId: clash[0].id },
          BillingErrorReason.TARIFF_OVERLAP,
        );

      const [row] = await tx.execute<(TariffRow & { snapshot: unknown })[]>(
        `insert into billing.space_tariffs
           (id, tenant_id, practice_id, tariff_kind_concept_id, bed_category_concept_id, care_space_id,
            service_catalog_id, unit_minutes, minimum_units, unit_price, currency_concept_id,
            valid_from, valid_to, status_concept_id, created_at, updated_at,
            created_by_user_id, updated_by_user_id, row_version)
         values (gen_random_uuid(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?::date, ?::date, ?, now(), now(), ?, ?, 1)
         returning id, tenant_id, practice_id, tariff_kind_concept_id, bed_category_concept_id, care_space_id,
                   service_catalog_id, unit_minutes, minimum_units, unit_price::text as unit_price,
                   currency_concept_id, valid_from::text as valid_from, valid_to::text as valid_to, created_at,
                   to_jsonb(billing.space_tariffs.*) as snapshot`,
        [
          tenantId,
          dto.practiceId,
          BILL[dto.kind],
          category?.id ?? null,
          dto.careSpaceId ?? null,
          dto.serviceCatalogId,
          dto.kind === 'TARIFF_OR_TIME' ? (dto.unitMinutes ?? null) : null,
          dto.kind === 'TARIFF_OR_TIME' ? (dto.minimumUnits ?? null) : null,
          dto.unitPrice,
          currencyConceptId,
          dto.validFrom,
          dto.validTo ?? null,
          CONCEPTS.STATE_ACTIVE,
          actor.id,
          actor.id,
        ],
      );
      await this.historyRepo.append(tx, 'space_tariffs', row.id, {
        operationConceptId: AUD.OPERATION_INSERT,
        dataSnapshot: row.snapshot,
        changedByUserId: actor.id,
        tenantId,
        firstRevision: true,
      });
      await this.events.publish(tx, {
        type: CHARGE_EVENTS.tariffCreated,
        aggregateType: 'space_tariff',
        aggregateId: row.id,
        tenantId,
        actorUserId: actor.id,
        correlationId,
        payload: {
          spaceTariffId: row.id,
          practiceId: dto.practiceId,
          kind: dto.kind,
          bedCategoryCode: category?.code ?? null,
          careSpaceId: dto.careSpaceId ?? null,
          validFrom: dto.validFrom,
          validTo: dto.validTo ?? null,
        },
      });
      return this.toResponse(row);
    });
  }

  /**
   * `POST /billing/space-tariffs/:id/close`: cierra la vigencia (no se edita ni se borra).
   *
   * @param id - Tarifa.
   * @param dto - Primer día sin la tarifa.
   * @param actor - Quien la cierra.
   * @param correlationId - Id de correlación.
   * @returns La tarifa cerrada.
   */
  async close(
    id: string,
    dto: CloseSpaceTariffDto,
    actor: AuthenticatedUser,
    correlationId?: string,
  ): Promise<SpaceTariffResponseDto> {
    if (!isIsoDay(dto.validTo))
      throw this.invalid([
        { field: 'validTo', message: 'No es una fecha válida' },
      ]);
    const tenantId = requireTenantId();
    return this.em.transactional(async (tx) => {
      const rows = await tx.execute<TariffRow[]>(
        `select ${COLUMNS} from billing.space_tariffs t
          where t.id = ? and t.tenant_id = ? for update`,
        [id, tenantId],
      );
      if (rows.length === 0)
        throw new ResourceNotFoundException(
          TARIFF_NOT_FOUND.message,
          undefined,
          TARIFF_NOT_FOUND.reason,
        );
      const tariff = rows[0];
      // La autoridad es la de la tarifa guardada, no la que diga el cliente.
      if (tariff.care_space_id)
        await this.access.forSpace(
          tx,
          actor,
          'infra.tariff.write',
          tariff.care_space_id,
        );
      else
        await this.access.forPractice(
          tx,
          actor,
          'infra.tariff.write',
          tariff.practice_id,
          'all',
        );

      if (dto.validTo <= tariff.valid_from)
        throw this.cannotClose(
          'El cierre tiene que ser posterior al inicio de la vigencia',
          {},
        );
      if (tariff.valid_to !== null && dto.validTo >= tariff.valid_to)
        throw this.cannotClose(
          'La tarifa ya está cerrada en esa fecha o antes: sólo se puede acortar su vigencia',
          { validTo: tariff.valid_to },
        );
      const accrued = await tx.execute<{ last: string | null }[]>(
        'select max(service_date)::text as last from billing.charge_captures where space_tariff_id = ?',
        [id],
      );
      const last = accrued[0]?.last ?? null;
      if (last !== null && last >= dto.validTo)
        throw this.cannotClose(
          'La tarifa ya devengó cargos hasta una fecha posterior: no se puede cerrar antes',
          { lastAccruedDate: last },
        );

      const [row] = await tx.execute<(TariffRow & { snapshot: unknown })[]>(
        `update billing.space_tariffs
            set valid_to = ?::date, updated_at = now(), updated_by_user_id = ?, row_version = row_version + 1
          where id = ?
          returning id, tenant_id, practice_id, tariff_kind_concept_id, bed_category_concept_id, care_space_id,
                    service_catalog_id, unit_minutes, minimum_units, unit_price::text as unit_price,
                    currency_concept_id, valid_from::text as valid_from, valid_to::text as valid_to, created_at,
                    to_jsonb(billing.space_tariffs.*) as snapshot`,
        [dto.validTo, actor.id, id],
      );
      await this.historyRepo.append(tx, 'space_tariffs', id, {
        operationConceptId: AUD.OPERATION_UPDATE,
        dataSnapshot: row.snapshot,
        changedByUserId: actor.id,
        tenantId,
      });
      await this.events.publish(tx, {
        type: CHARGE_EVENTS.tariffClosed,
        aggregateType: 'space_tariff',
        aggregateId: id,
        tenantId,
        actorUserId: actor.id,
        correlationId,
        payload: {
          spaceTariffId: id,
          practiceId: tariff.practice_id,
          validTo: dto.validTo,
        },
      });
      return this.toResponse(row);
    });
  }

  private async practiceCurrency(
    tx: EntityManager,
    practiceId: string,
  ): Promise<string | null> {
    const rows = await tx.execute<{ currency_concept_id: string | null }[]>(
      'select currency_concept_id from practice.practices where id = ?',
      [practiceId],
    );
    return rows[0]?.currency_concept_id ?? null;
  }

  private toResponse(row: TariffRow): SpaceTariffResponseDto {
    return {
      id: row.id,
      practiceId: row.practice_id,
      kind:
        row.tariff_kind_concept_id === BILL.TARIFF_OR_TIME
          ? 'TARIFF_OR_TIME'
          : 'TARIFF_BED_DAY',
      bedCategoryCode:
        ATTRIBUTES.bedCategory.byConceptId(row.bed_category_concept_id)?.code ??
        null,
      careSpaceId: row.care_space_id,
      serviceCatalogId: row.service_catalog_id,
      unitMinutes: row.unit_minutes,
      minimumUnits: row.minimum_units,
      unitPrice: row.unit_price,
      currencyConceptId: row.currency_concept_id,
      validFrom: row.valid_from,
      validTo: row.valid_to,
      createdAt: row.created_at,
    };
  }

  private invalid(
    errors: readonly { field: string; message: string }[],
  ): PreconditionFailedException {
    return new PreconditionFailedException(
      errors[0].message,
      { errors: errors.map(({ field }) => ({ field })) },
      BillingErrorReason.TARIFF_SHAPE_INVALID,
    );
  }

  private cannotClose(
    message: string,
    details: Record<string, unknown>,
  ): PreconditionFailedException {
    return new PreconditionFailedException(
      message,
      details,
      BillingErrorReason.TARIFF_CLOSE_INVALID,
    );
  }
}
