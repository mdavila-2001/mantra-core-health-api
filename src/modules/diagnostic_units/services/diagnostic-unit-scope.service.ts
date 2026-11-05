import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { requireTenantId, ResourceNotFoundException } from '../../../common';
import { assertResourceInTenant } from '../../../common/tenant/resource-scope';
import { DiagnosticUnitsErrorReason } from '../diagnostic_units.error-reasons';
import {
  DiagnosticEquipmentRepository,
  DiagnosticPriceSchedulesRepository,
  DiagnosticStudyOfferingsRepository,
  DiagnosticStudyPricesRepository,
  DiagnosticUnitAccreditationsRepository,
  DiagnosticUnitSitesRepository,
  DiagnosticUnitsRepository,
} from '../repositories';
import type {
  DiagnosticEquipment,
  DiagnosticPriceSchedules,
  DiagnosticStudyOfferings,
  DiagnosticStudyPrices,
  DiagnosticUnitAccreditations,
  DiagnosticUnitSites,
  DiagnosticUnits,
} from '../entities';

const REASON = DiagnosticUnitsErrorReason.DIAGNOSTIC_UNIT_RESOURCE_OUT_OF_SCOPE;

/**
 * Resuelve unidades y recursos hijos por UUID acotados al tenant activo.
 *
 * Solo `diagnostic_units` guarda `tenant_id`; sitios, acreditaciones, equipos,
 * ofertas y cronogramas lo heredan de su unidad, y los precios del cronograma.
 * Cada resolvedor sube por la cadena hijo → sitio/cronograma → unidad → tenant
 * antes de que el servicio lea o escriba, y un recurso ajeno responde igual que
 * uno inexistente (`404`, mismo mensaje y `reason`, sin `details`).
 */
@Injectable()
export class DiagnosticUnitScopeService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param unitsRepo - Repositorio de unidades.
   * @param sitesRepo - Repositorio de sitios.
   * @param accreditationsRepo - Repositorio de acreditaciones.
   * @param equipmentRepo - Repositorio de equipos.
   * @param offeringsRepo - Repositorio de ofertas de estudio.
   * @param schedulesRepo - Repositorio de cronogramas de precios.
   * @param pricesRepo - Repositorio de precios.
   */
  constructor(
    private readonly unitsRepo: DiagnosticUnitsRepository,
    private readonly sitesRepo: DiagnosticUnitSitesRepository,
    private readonly accreditationsRepo: DiagnosticUnitAccreditationsRepository,
    private readonly equipmentRepo: DiagnosticEquipmentRepository,
    private readonly offeringsRepo: DiagnosticStudyOfferingsRepository,
    private readonly schedulesRepo: DiagnosticPriceSchedulesRepository,
    private readonly pricesRepo: DiagnosticStudyPricesRepository,
  ) {}

  /**
   * Rechaza un `tenantId` del cuerpo que no coincide con el tenant activo.
   *
   * @param bodyTenantId - Tenant declarado por el cliente, si lo hubo.
   * @returns El tenant activo, que es la única fuente de verdad.
   * @throws ResourceNotFoundException si el cuerpo declara otro tenant.
   */
  activeTenantFor(bodyTenantId?: string): string {
    const tenantId = requireTenantId();
    if (bodyTenantId !== undefined && bodyTenantId !== tenantId) {
      throw new ResourceNotFoundException(
        'Unidad no encontrada',
        undefined,
        REASON,
      );
    }
    return tenantId;
  }

  /**
   * Carga una unidad del tenant activo.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param unitId - UUID de la unidad.
   * @returns La unidad, ya acotada al tenant.
   * @throws ResourceNotFoundException si no existe o es de otro tenant.
   */
  async unit(tx: EntityManager, unitId: string): Promise<DiagnosticUnits> {
    requireTenantId(); // sin tenant activo no se lee nada
    const unit = await this.unitsRepo.findById(tx, unitId);
    return assertResourceInTenant(unit, unit?.tenantId, requireTenantId(), {
      message: 'Unidad no encontrada',
      reason: REASON,
    });
  }

  /**
   * Carga un sitio cuya unidad es del tenant activo.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param siteId - UUID del sitio.
   * @returns El sitio, ya acotado al tenant.
   * @throws ResourceNotFoundException si no existe o es de otro tenant.
   */
  async site(tx: EntityManager, siteId: string): Promise<DiagnosticUnitSites> {
    requireTenantId(); // sin tenant activo no se lee nada
    const site = await this.sitesRepo.findById(tx, siteId);
    return this.viaUnit(
      tx,
      site,
      site?.diagnosticUnitId,
      'Sitio no encontrado',
    );
  }

  /**
   * Comprueba que un sitio referenciado por el cuerpo pertenece a la unidad.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param siteId - UUID del sitio declarado por el cliente.
   * @param unitId - Unidad ya resuelta dentro del tenant.
   * @returns El sitio de esa unidad.
   * @throws ResourceNotFoundException si no existe o es de otra unidad.
   */
  async siteOfUnit(
    tx: EntityManager,
    siteId: string,
    unitId: string,
  ): Promise<DiagnosticUnitSites> {
    const site = await this.site(tx, siteId);
    if (site.diagnosticUnitId !== unitId) {
      throw new ResourceNotFoundException(
        'Sitio no encontrado',
        undefined,
        REASON,
      );
    }
    return site;
  }

  /**
   * Carga una acreditación cuya unidad es del tenant activo.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param accreditationId - UUID de la acreditación.
   * @returns La acreditación, ya acotada al tenant.
   * @throws ResourceNotFoundException si no existe o es de otro tenant.
   */
  async accreditation(
    tx: EntityManager,
    accreditationId: string,
  ): Promise<DiagnosticUnitAccreditations> {
    requireTenantId(); // sin tenant activo no se lee nada
    const accreditation = await this.accreditationsRepo.findById(
      tx,
      accreditationId,
    );
    return this.viaUnit(
      tx,
      accreditation,
      accreditation?.diagnosticUnitId,
      'Acreditación no encontrada',
    );
  }

  /**
   * Carga un equipo cuyo sitio y unidad son del tenant activo.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param equipmentId - UUID del equipo.
   * @returns El equipo, ya acotado al tenant.
   * @throws ResourceNotFoundException si no existe o es de otro tenant.
   */
  async equipment(
    tx: EntityManager,
    equipmentId: string,
  ): Promise<DiagnosticEquipment> {
    requireTenantId(); // sin tenant activo no se lee nada
    const equipment = await this.equipmentRepo.findById(tx, equipmentId);
    await this.siteOrFail(tx, equipment?.diagnosticUnitSiteId);
    return equipment as DiagnosticEquipment;
  }

  /**
   * Carga una oferta de estudio cuya unidad es del tenant activo.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param offeringId - UUID de la oferta.
   * @returns La oferta, ya acotada al tenant.
   * @throws ResourceNotFoundException si no existe o es de otro tenant.
   */
  async offering(
    tx: EntityManager,
    offeringId: string,
  ): Promise<DiagnosticStudyOfferings> {
    requireTenantId(); // sin tenant activo no se lee nada
    const offering = await this.offeringsRepo.findById(tx, offeringId);
    return this.viaUnit(
      tx,
      offering,
      offering?.diagnosticUnitId,
      'Oferta no encontrada',
    );
  }

  /**
   * Carga un cronograma de precios cuya unidad es del tenant activo.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param scheduleId - UUID del cronograma.
   * @returns El cronograma, ya acotado al tenant.
   * @throws ResourceNotFoundException si no existe o es de otro tenant.
   */
  async schedule(
    tx: EntityManager,
    scheduleId: string,
  ): Promise<DiagnosticPriceSchedules> {
    requireTenantId(); // sin tenant activo no se lee nada
    const schedule = await this.schedulesRepo.findById(tx, scheduleId);
    return this.viaUnit(
      tx,
      schedule,
      schedule?.diagnosticUnitId,
      'Cronograma no encontrado',
    );
  }

  /**
   * Carga un precio cuyo cronograma y unidad son del tenant activo.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param priceId - UUID del precio.
   * @returns El precio, ya acotado al tenant.
   * @throws ResourceNotFoundException si no existe o es de otro tenant.
   */
  async price(
    tx: EntityManager,
    priceId: string,
  ): Promise<DiagnosticStudyPrices> {
    requireTenantId(); // sin tenant activo no se lee nada
    const price = await this.pricesRepo.findById(tx, priceId);
    if (!price) this.notFound('Precio no encontrado');
    await this.schedule(tx, price.priceScheduleId).catch(() =>
      this.notFound('Precio no encontrado'),
    );
    return price;
  }

  /** Lanza el 404 uniforme del módulo. */
  private notFound(message: string): never {
    throw new ResourceNotFoundException(message, undefined, REASON);
  }

  /** Exige que el sitio exista y su unidad sea del tenant activo. */
  private async siteOrFail(
    tx: EntityManager,
    siteId: string | undefined,
  ): Promise<void> {
    if (!siteId) this.notFound('Equipo no encontrado');
    await this.site(tx, siteId).catch(() =>
      this.notFound('Equipo no encontrado'),
    );
  }

  /** Acota un hijo con `diagnosticUnitId` resolviendo su unidad. */
  private async viaUnit<T>(
    tx: EntityManager,
    child: T | null | undefined,
    unitId: string | undefined,
    message: string,
  ): Promise<T> {
    const unit = unitId ? await this.unitsRepo.findById(tx, unitId) : null;
    assertResourceInTenant(child, unit?.tenantId, requireTenantId(), {
      message,
      reason: REASON,
    });
    return child as T;
  }
}
