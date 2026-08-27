import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  deterministicId,
  requireTenantId,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { OutboxService } from '../../messaging/services';
import type {
  Pharmacies,
  PharmacyProducts,
  PharmacySites,
} from '../../pharmacy/entities';
import type { CatalogConcepts } from '../../terminology/entities';
import type {
  InventoryReservations,
  InventoryReservationLines,
  InventoryStockPositions,
} from '../entities';
import {
  PharmacyOrdersRepository,
  ReservationsRepository,
  StockPositionsRepository,
  LedgerRepository,
  InventoryReadRepository,
} from '../repositories';
import { PharmacyReadRepository } from '../../pharmacy/repositories';
import { InventoryReservationsService } from './inventory-reservations.service';
import { PharmacyOrderNotificationsService } from './pharmacy-order-notifications.service';
import type {
  ConfirmPharmacyOrderDto,
  CreatePharmacyOrderDto,
  PharmacyOrderDto,
  PharmacyOrderLineDto,
  PharmacyOrderListResponseDto,
  RejectPharmacyOrderDto,
  InventoryConceptDto,
} from '../dto';
import {
  PHARMACY_INVENTORY_CONCEPT_SEEDS,
  PINV,
} from '../pharmacy_inventory.concepts';

/** Vida del pedido: 48 h desde la creación (el carril E2 la renueva al LISTO). */
export const ORDER_TTL_HOURS = 48;

/**
 * La máquina de estados del pedido como dato, no como `if`s.
 *
 * Los 10 estados acordados con FAR-I2 viven en `PINV.ORDER_*`. El carril E1
 * solo ejecuta tres transiciones: creación (→ `ENVIADO`), cancelación del
 * titular (no terminal → `CANCELADO`) y vencimiento (no terminal → `VENCIDO`).
 * Los demás estados se **reconocen** (se leen, se sirven en palabras y cuentan
 * para decidir si una transición es legal) pero los transicionan E2/E3.
 */
export const ORDER_STATUS_IDS: readonly string[] = [
  PINV.ORDER_ENVIADO,
  PINV.ORDER_EN_REVISION,
  PINV.ORDER_CONFIRMADO,
  PINV.ORDER_ACEPTACION_PENDIENTE,
  PINV.ORDER_ACEPTADO,
  PINV.ORDER_LISTO_PARA_RETIRO,
  PINV.ORDER_RETIRADO,
  PINV.ORDER_RECHAZADO,
  PINV.ORDER_VENCIDO,
  PINV.ORDER_CANCELADO,
];

/** Estados terminales: de aquí no se sale (espejo de `esTerminal` del front). */
export const ORDER_TERMINAL_STATUS_IDS: readonly string[] = [
  PINV.ORDER_RETIRADO,
  PINV.ORDER_RECHAZADO,
  PINV.ORDER_VENCIDO,
  PINV.ORDER_CANCELADO,
];

/** Estados vivos: cancelables por el titular y vencibles por el reloj. */
export const ORDER_NON_TERMINAL_STATUS_IDS: readonly string[] =
  ORDER_STATUS_IDS.filter((id) => !ORDER_TERMINAL_STATUS_IDS.includes(id));

/**
 * Las transiciones del mostrador (FAR-E2), como dato.
 *
 * Espejo exacto de los helpers del front (`puedeConfirmarse`,
 * `puedeRechazarsePorFarmacia`, `puedePrepararse`): recepcionar lo enviado,
 * confirmar lo no revisado o en revisión, rechazar todo lo vivo salvo lo que
 * ya espera en el mostrador, y dejar listo lo confirmado o aceptado.
 * `ACEPTACION_PENDIENTE`/`ACEPTADO` figuran por completitud — hoy son
 * inalcanzables (las sustituciones están bloqueadas por modelo) pero la
 * máquina no debe reescribirse cuando lleguen.
 *
 * Fuera de esta tabla viven las dos transiciones que E1 ya posee: la
 * cancelación del titular (no-terminal → CANCELADO, con su 409 sobre
 * terminales, contrato ya publicado) y el vencimiento por reloj
 * (no-terminal → VENCIDO). Una transición que no figura acá responde 422.
 */
export const ORDER_STAFF_TRANSITIONS: ReadonlyMap<
  string,
  ReadonlySet<string>
> = new Map([
  [
    PINV.ORDER_ENVIADO,
    new Set([
      PINV.ORDER_EN_REVISION,
      PINV.ORDER_CONFIRMADO,
      PINV.ORDER_RECHAZADO,
    ]),
  ],
  [
    PINV.ORDER_EN_REVISION,
    new Set([PINV.ORDER_CONFIRMADO, PINV.ORDER_RECHAZADO]),
  ],
  [
    PINV.ORDER_CONFIRMADO,
    new Set([PINV.ORDER_LISTO_PARA_RETIRO, PINV.ORDER_RECHAZADO]),
  ],
  [PINV.ORDER_ACEPTACION_PENDIENTE, new Set([PINV.ORDER_RECHAZADO])],
  [
    PINV.ORDER_ACEPTADO,
    new Set([PINV.ORDER_LISTO_PARA_RETIRO, PINV.ORDER_RECHAZADO]),
  ],
]);

/** Tope de la bandeja cuando la consulta no acota. */
const DEFAULT_INBOX_LIMIT = 100;

/**
 * Roles de staff que pueden leer un pedido ajeno (la bandeja del carril E2).
 * Cuando E2 defina su rol de farmacia, se añade acá — la titularidad del
 * paciente no cambia.
 */
const STAFF_READ_ROLES: readonly string[] = ['SECURITY_ADMIN'];

/**
 *`{code, display}` de los conceptos propios del módulo, resuelto desde su
 * definición en código: los estados del pedido son constantes del módulo, no
 * hace falta ir a la base para ponerles palabras. Los conceptos ajenos (el
 * medicamento del vademécum) sí se resuelven en lote contra terminología.
 */
const PINV_CONCEPT_BY_ID: ReadonlyMap<string, InventoryConceptDto> = new Map(
  PHARMACY_INVENTORY_CONCEPT_SEEDS.map((seed) => [
    deterministicId(seed.key),
    { code: seed.code, display: seed.display },
  ]),
);

/** Del código servido en el DTO (`PINV_ORDER_*`) al concepto: el filtro de la bandeja. */
const ORDER_STATUS_ID_BY_CODE: ReadonlyMap<string, string> = new Map(
  ORDER_STATUS_IDS.map((id) => [PINV_CONCEPT_BY_ID.get(id)?.code ?? id, id]),
);

/** Una cantidad `numeric` (string de BD) como número; lo ilegible cuenta 0. */
const num = (value: string | null | undefined): number => {
  if (value == null) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/** Recalcula el disponible como lo hace el ledger. */
const recompute = (
  onHand: string,
  reserved: string,
  quarantine: string,
): string => String(num(onHand) - num(reserved) - num(quarantine));

/** El nombre con que la farmacia se muestra: comercial, o la razón social. */
const pharmacyName = (pharmacy: Pharmacies): string => {
  const trade = pharmacy.tradeName?.trim();
  return trade && trade !== '' ? trade : pharmacy.legalName;
};

/** El mismo 404 para inexistente, ajeno o de otro tenant: distinguirlos filtra. */
const orderNotFound = (id: string): ResourceNotFoundException =>
  new ResourceNotFoundException('Pedido no encontrado', { id });

/**
 * Pedido de farmacia del paciente (FAR-E1): creación con reserva parcial,
 * lectura del titular, cancelación con liberación de stock y vencimiento a las
 * 48 h.
 *
 * ## Cómo se persiste sin cambiar el modelo
 *
 * El pedido se materializa sobre el mecanismo vigente de reservas: la cabecera
 * es una fila de `inventory_reservations` con estado del value set
 * `PINV_ORDER_*` (eso lo distingue de una reserva de mostrador) y cada línea
 * es una `inventory_reservation_lines`. La contabilidad es la del módulo:
 * `MV_RESERVE` al tomar stock y la primitiva compartida
 * `releaseConfirmedLines` (la de UC-25-05) al devolverlo — acá no hay una
 * segunda contabilidad.
 *
 * Los campos comerciales del contrato FAR-I2 que el modelo v4.0.10 no declara
 * (modalidad y dirección de entrega, precios congelados, código de retiro,
 * motivo de rechazo, sustituciones) **no se persisten ni se fingen**: llegan
 * en la segunda vuelta, tras el patch de modelo.
 *
 * ## Reserva parcial
 *
 * A diferencia de `reserve()` (UC-25-04, todo-o-nada), una línea sin stock
 * suficiente NO tumba el pedido: queda registrada con `reserved_quantity = 0`
 * y estado `RES_LINE_OUT_OF_STOCK`, y la farmacia decide en revisión. Una
 * línea con stock puede repartirse entre varias posiciones (ubicación/lote);
 * la lectura la re-agrega por producto.
 */
@Injectable()
export class PharmacyOrdersService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param ordersRepo - Consultas del pedido (reservas con estado `ORDER_*`).
   * @param reservationsRepo - Alta de cabecera y líneas de reserva.
   * @param stockRepo - Posiciones de stock (lock pesimista).
   * @param ledgerRepo - Ledger append-only del inventario.
   * @param inventoryReadRepo - Ubicaciones y posiciones, en lote.
   * @param pharmacyRepo - Visibilidad del directorio de farmacias (módulo 24).
   * @param reservationsService - Primitiva compartida de liberación (UC-25-05).
   * @param outbox - Publicación transaccional de eventos de dominio.
   * @param orderNotifications - La campana del paciente, post-commit (FAR-E2).
   * @param logger - Logger estructurado (ids y conteos; nunca datos clínicos).
   */
  constructor(
    private readonly em: EntityManager,
    private readonly ordersRepo: PharmacyOrdersRepository,
    private readonly reservationsRepo: ReservationsRepository,
    private readonly stockRepo: StockPositionsRepository,
    private readonly ledgerRepo: LedgerRepository,
    private readonly inventoryReadRepo: InventoryReadRepository,
    private readonly pharmacyRepo: PharmacyReadRepository,
    private readonly reservationsService: InventoryReservationsService,
    private readonly outbox: OutboxService,
    private readonly orderNotifications: PharmacyOrderNotificationsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PharmacyOrdersService.name);
  }

  /**
   * FAR-E1: crear el pedido.
   *
   * La identidad del paciente sale del claim `pid` del token — nunca del
   * body. La sede debe ser visible en el directorio del tenant (activa, de
   * farmacia publicada); una sede inexistente, inactiva o ajena responde el
   * mismo 404. El pedido nace `ENVIADO` con vencimiento a 48 h; repetir la
   * misma `idempotencyKey` devuelve el pedido ya creado.
   */
  async create(
    dto: CreatePharmacyOrderDto,
    actor: AuthenticatedUser,
  ): Promise<PharmacyOrderDto> {
    const tenantId = requireTenantId();
    const patientProfileId = this.requirePatientProfile(actor);
    this.assertNoDuplicateProducts(dto);

    const orderId = await this.em.transactional(async (tx) => {
      if (dto.idempotencyKey) {
        const existing = await this.ordersRepo.findOrderByIdempotencyKey(
          tx,
          patientProfileId,
          dto.idempotencyKey,
          ORDER_STATUS_IDS,
        );
        if (existing) return existing.id;
      }

      const site = await this.pharmacyRepo.findActiveSiteById(tx, dto.siteId);
      const pharmacy = site
        ? await this.pharmacyRepo.findVisibleById(tx, tenantId, site.pharmacyId)
        : null;
      if (!site || !pharmacy) {
        throw new ResourceNotFoundException('Sede de farmacia no encontrada', {
          siteId: dto.siteId,
        });
      }

      if (dto.medicationRequestId) {
        const request = await this.ordersRepo.findOwnMedicationRequest(
          tx,
          dto.medicationRequestId,
          patientProfileId,
        );
        // Receta inexistente y receta ajena: el mismo 404.
        if (!request) {
          throw new ResourceNotFoundException('Receta no encontrada', {
            medicationRequestId: dto.medicationRequestId,
          });
        }
      }

      const productIds = dto.lines.map((line) => line.productId);
      const products = await this.pharmacyRepo.findActiveProductsByIds(
        tx,
        productIds,
      );
      const sellable = new Set(
        products
          .filter((product) => product.pharmacyId === site.pharmacyId)
          .map((product) => product.id),
      );
      const unknown = productIds.filter((id) => !sellable.has(id));
      // Producto inexistente, retirado o de otra farmacia: el mismo 404.
      if (unknown.length > 0) {
        throw new ResourceNotFoundException(
          'Producto no disponible en la sede',
          { productIds: unknown },
        );
      }

      const reservation = this.reservationsRepo.create(tx, {
        pharmacyId: pharmacy.id,
        pharmacySiteId: site.id,
        patientProfileId,
        medicationRequestId: dto.medicationRequestId,
        reservationStatusConceptId: PINV.ORDER_ENVIADO,
        expiresAt: new Date(Date.now() + ORDER_TTL_HOURS * 3_600_000),
        idempotencyKey: dto.idempotencyKey,
        actorUserId: actor.id,
      });
      await tx.flush();

      const outOfStock = await this.reserveOrderLines(
        tx,
        reservation,
        dto,
        actor,
      );

      await this.outbox.publishDomainEvent(tx, {
        tenantId,
        eventType: 'PharmacyOrderSubmitted',
        aggregateType: 'pharmacy_inventory.inventory_reservations',
        aggregateId: reservation.id,
        payloadJson: {
          orderId: reservation.id,
          pharmacyId: pharmacy.id,
          pharmacySiteId: site.id,
          statusCode: 'PINV_ORDER_ENVIADO',
          lineCount: dto.lines.length,
          outOfStockLineCount: outOfStock,
        },
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        {
          operation: 'pharmacy_inventory.order.create',
          orderId: reservation.id,
          siteId: site.id,
          lines: dto.lines.length,
          outOfStockLines: outOfStock,
        },
        'Pharmacy order submitted',
      );
      return reservation.id;
    });

    return this.readOwnOrder(orderId, tenantId, patientProfileId);
  }

  /**
   * FAR-E1: los pedidos del paciente autenticado, más nuevos primero.
   *
   * Solo del titular (claim `pid`) y solo de farmacias del tenant activo: un
   * pedido de una farmacia ajena simplemente no aparece. Antes de responder
   * corre la expiración perezosa sobre los vencidos.
   */
  async listMine(
    actor: AuthenticatedUser,
  ): Promise<PharmacyOrderListResponseDto> {
    const tenantId = requireTenantId();
    const patientProfileId = this.requirePatientProfile(actor);

    let em = this.em.fork();
    let orders = await this.ordersRepo.findOrdersByPatient(
      em,
      patientProfileId,
      ORDER_STATUS_IDS,
    );

    const dueIds = orders
      .filter((order) => this.isDue(order))
      .map((order) => order.id);
    if (dueIds.length > 0) {
      await this.expireDue(actor, dueIds);
      // Fork nuevo: el mapa de identidad del anterior quedó desactualizado.
      em = this.em.fork();
      orders = await this.ordersRepo.findOrdersByPatient(
        em,
        patientProfileId,
        ORDER_STATUS_IDS,
      );
    }

    const items = await this.composeOrders(em, tenantId, orders);
    return { items, count: items.length };
  }

  /**
   * FAR-E1: un pedido concreto.
   *
   * Lo ve su titular (claim `pid`) o el staff del tenant de la farmacia.
   * Cualquier tercero —otro paciente, otro tenant, un id inexistente— recibe
   * exactamente el mismo 404. La lectura de un pedido vivo ya vencido dispara
   * su expiración perezosa antes de responder.
   */
  async getOrder(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<PharmacyOrderDto> {
    const tenantId = requireTenantId();

    let em = this.em.fork();
    let order = await this.ordersRepo.findOrderById(em, id, ORDER_STATUS_IDS);
    if (!order) throw orderNotFound(id);

    const isOwner =
      actor.patientProfileId !== undefined &&
      order.patientProfileId === actor.patientProfileId;
    const isStaff = actor.roles.some((role) => STAFF_READ_ROLES.includes(role));
    if (!isOwner && !isStaff) throw orderNotFound(id);

    if (this.isDue(order)) {
      await this.expireDue(actor, [id]);
      em = this.em.fork();
      order = await this.ordersRepo.findOrderById(em, id, ORDER_STATUS_IDS);
      if (!order) throw orderNotFound(id);
    }

    // El tenant va en la consulta: una farmacia de otro tenant no resuelve y
    // el pedido cae en el mismo 404 que uno inexistente.
    const [dto] = await this.composeOrders(em, tenantId, [order]);
    if (!dto) throw orderNotFound(id);
    return dto;
  }

  /**
   * FAR-E1: el titular cancela su pedido.
   *
   * Legal desde cualquier estado no terminal (espejo de `puedeCancelarse()`
   * del front); un estado terminal responde 409 sin tocar nada. En una sola
   * transacción: `CANCELADO`, liberación de las líneas reservadas con la
   * primitiva compartida (sin doble liberación: una línea ya liberada no se
   * vuelve a liberar) y evento para la farmacia.
   */
  async cancel(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<PharmacyOrderDto> {
    const tenantId = requireTenantId();
    const patientProfileId = this.requirePatientProfile(actor);

    await this.em.transactional(async (tx) => {
      const order = await this.ordersRepo.findOrderByIdForUpdate(
        tx,
        id,
        ORDER_STATUS_IDS,
      );
      if (!order || order.patientProfileId !== patientProfileId) {
        throw orderNotFound(id);
      }
      const [pharmacy] = await this.ordersRepo.findPharmaciesByIdsInTenant(
        tx,
        tenantId,
        [order.pharmacyId],
      );
      if (!pharmacy) throw orderNotFound(id);

      if (
        ORDER_TERMINAL_STATUS_IDS.includes(order.reservationStatusConceptId)
      ) {
        throw new ConflictException(
          'El pedido ya está en un estado terminal y no puede cancelarse',
          { id },
        );
      }

      order.reservationStatusConceptId = PINV.ORDER_CANCELADO;
      order.releasedAt = new Date();
      touch(order, actor.id);
      await this.reservationsService.releaseConfirmedLines(tx, order, actor);

      await this.outbox.publishDomainEvent(tx, {
        tenantId,
        eventType: 'PharmacyOrderCancelled',
        aggregateType: 'pharmacy_inventory.inventory_reservations',
        aggregateId: order.id,
        payloadJson: {
          orderId: order.id,
          pharmacyId: order.pharmacyId,
          pharmacySiteId: order.pharmacySiteId,
          statusCode: 'PINV_ORDER_CANCELADO',
        },
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        { operation: 'pharmacy_inventory.order.cancel', orderId: order.id },
        'Pharmacy order cancelled',
      );
    });

    return this.readOwnOrder(id, tenantId, patientProfileId);
  }

  /**
   * FAR-E2: la bandeja del mostrador — los pedidos de las farmacias del
   * tenant activo, más nuevos primero.
   *
   * El recorte por organización va en el WHERE de las dos consultas (farmacias
   * por `tenant_id`, pedidos por esas farmacias), nunca como filtro posterior.
   * Los filtros disponibles son los que el modelo declara: estado
   * (`PINV_ORDER_*`), sede y ventana de creación. Antes de responder corre la
   * expiración perezosa sobre los vencidos, para que la bandeja nunca muestre
   * como vivo un pedido cuyo reloj ya pasó.
   */
  async listForPharmacyTenant(
    filters: {
      /** Código de estado (`PINV_ORDER_*`) para acotar la bandeja. */
      statusCode?: string;
      /** Sede puntual. */
      siteId?: string;
      /** Creados desde este instante. */
      from?: Date;
      /** Creados hasta este instante. */
      to?: Date;
      /** Tope de filas (por defecto 100). */
      limit?: number;
    },
    actor: AuthenticatedUser,
  ): Promise<PharmacyOrderListResponseDto> {
    const tenantId = requireTenantId();
    const statusIds = this.resolveStatusFilter(filters.statusCode);
    const query = {
      siteId: filters.siteId,
      from: filters.from,
      to: filters.to,
      limit: filters.limit ?? DEFAULT_INBOX_LIMIT,
    };

    let em = this.em.fork();
    const pharmacies = await this.ordersRepo.findPharmaciesByTenant(
      em,
      tenantId,
    );
    if (pharmacies.length === 0) return { items: [], count: 0 };
    const pharmacyIds = pharmacies.map((pharmacy) => pharmacy.id);

    let orders = await this.ordersRepo.findOrdersForPharmacies(
      em,
      pharmacyIds,
      statusIds,
      query,
    );
    const dueIds = orders
      .filter((order) => this.isDue(order))
      .map((order) => order.id);
    if (dueIds.length > 0) {
      await this.expireDue(actor, dueIds);
      em = this.em.fork();
      orders = await this.ordersRepo.findOrdersForPharmacies(
        em,
        pharmacyIds,
        statusIds,
        query,
      );
    }

    const items = await this.composeOrders(em, tenantId, orders);
    return { items, count: items.length };
  }

  /**
   * FAR-E2: recepcionar el pedido — `ENVIADO → EN_REVISION`.
   *
   * Es el «visto» del mostrador: el paciente ve que la farmacia lo está
   * mirando. Transición pura de estado, con lock, evento en la transacción y
   * campana después del commit.
   */
  async openReview(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<PharmacyOrderDto> {
    const tenantId = requireTenantId();

    const { patientProfileId } = await this.em.transactional(async (tx) => {
      const order = await this.loadTenantOrderForUpdate(tx, id, tenantId);
      this.assertStaffTransition(order, PINV.ORDER_EN_REVISION);

      order.reservationStatusConceptId = PINV.ORDER_EN_REVISION;
      touch(order, actor.id);

      await this.publishStaffEvent(tx, tenantId, order, {
        eventType: 'PharmacyOrderUnderReview',
        statusCode: 'PINV_ORDER_EN_REVISION',
        actor,
      });
      await tx.flush();

      this.logger.info(
        { operation: 'pharmacy_inventory.order.review', orderId: order.id },
        'Pharmacy order under review',
      );
      return { patientProfileId: order.patientProfileId };
    });

    if (patientProfileId) {
      await this.orderNotifications.orderUnderReview(
        id,
        patientProfileId,
        actor.id,
      );
    }
    return this.readOrderForTenant(id, tenantId);
  }

  /**
   * FAR-E2: confirmar el pedido **sin sustituciones** —
   * `ENVIADO|EN_REVISION → CONFIRMADO`, sellando el `confirmed_at` que el
   * modelo ya declara (la creación de E1 lo deja nulo a propósito).
   *
   * Un ajuste `NO_DISPONIBLE` devuelve el stock de ESE renglón con la
   * primitiva compartida (`onlyLineIds`) y deja la línea como
   * `RES_LINE_OUT_OF_STOCK` con reservado 0 — la misma forma que tiene una
   * línea que nació sin stock; una línea ya sin stock no se libera dos veces.
   *
   * Un ajuste `PROPONER_GENERICO` responde 422 tipificado SIN tocar nada:
   * la propuesta de sustitución exige persistencia por línea que el modelo
   * v4.0.10 no declara (bloqueador FAR-E1/E2), y `ACEPTACION_PENDIENTE` es
   * inalcanzable hasta ese patch. No se recalculan ni fingen precios: el
   * pedido no tiene precios persistidos.
   */
  async confirm(
    id: string,
    dto: ConfirmPharmacyOrderDto,
    actor: AuthenticatedUser,
  ): Promise<PharmacyOrderDto> {
    const tenantId = requireTenantId();
    const adjustments = dto.adjustments ?? [];

    const { patientProfileId } = await this.em.transactional(async (tx) => {
      const order = await this.loadTenantOrderForUpdate(tx, id, tenantId);
      // Antes que nada y antes de mutar: la capacidad bloqueada corta entera.
      const proposed = adjustments.filter(
        (adjustment) => adjustment.decision === 'PROPONER_GENERICO',
      );
      if (proposed.length > 0) {
        throw new PreconditionFailedException(
          'La propuesta de sustitución está bloqueada por modelo: no existe persistencia de propuestas por línea. El pedido no se modificó.',
          {
            orderId: id,
            blockedByModel: 'substitutions',
            productIds: proposed.map((adjustment) => adjustment.productId),
          },
        );
      }
      this.assertStaffTransition(order, PINV.ORDER_CONFIRMADO);

      let adjusted = 0;
      if (adjustments.length > 0) {
        const lines = await this.ordersRepo.findLinesByReservationIds(tx, [
          order.id,
        ]);
        const linesByProduct = new Map<string, InventoryReservationLines[]>();
        for (const line of lines) {
          const list = linesByProduct.get(line.pharmacyProductId) ?? [];
          list.push(line);
          linesByProduct.set(line.pharmacyProductId, list);
        }

        for (const adjustment of adjustments) {
          const portions = linesByProduct.get(adjustment.productId);
          if (!portions) {
            throw new PreconditionFailedException(
              'El ajuste refiere un producto que no está en el pedido',
              { orderId: id, productId: adjustment.productId },
            );
          }
          // Solo lo CONFIRMED tiene stock que devolver; una línea que nació
          // SIN_STOCK ya está en la forma final y no genera asientos.
          const confirmed = portions.filter(
            (portion) => portion.statusConceptId === PINV.RES_LINE_CONFIRMED,
          );
          if (confirmed.length > 0) {
            await this.reservationsService.releaseConfirmedLines(
              tx,
              order,
              actor,
              { onlyLineIds: confirmed.map((portion) => portion.id) },
            );
            for (const portion of confirmed) {
              portion.statusConceptId = PINV.RES_LINE_OUT_OF_STOCK;
              portion.reservedQuantity = '0';
              touch(portion, actor.id);
            }
            adjusted += 1;
          }
        }
      }

      order.reservationStatusConceptId = PINV.ORDER_CONFIRMADO;
      order.confirmedAt = new Date();
      touch(order, actor.id);

      await this.publishStaffEvent(tx, tenantId, order, {
        eventType: 'PharmacyOrderConfirmed',
        statusCode: 'PINV_ORDER_CONFIRMADO',
        actor,
        extra: { unavailableLineCount: adjusted },
      });
      await tx.flush();

      this.logger.info(
        {
          operation: 'pharmacy_inventory.order.confirm',
          orderId: order.id,
          unavailableLines: adjusted,
        },
        'Pharmacy order confirmed',
      );
      return { patientProfileId: order.patientProfileId };
    });

    if (patientProfileId) {
      await this.orderNotifications.orderConfirmed(
        id,
        patientProfileId,
        actor.id,
      );
    }
    return this.readOrderForTenant(id, tenantId);
  }

  /**
   * FAR-E2: rechazar el pedido — estados rechazables → `RECHAZADO`, liberando
   * el stock reservado con la primitiva compartida (sin doble liberación: la
   * guarda por línea y el lock de cabecera lo garantizan; un reintento ve el
   * pedido ya terminal y recibe 422 sin tocar el ledger).
   *
   * **El motivo NO se persiste** (bloqueador de modelo): viaja en el evento de
   * dominio y en la campana inmediata al paciente, y el `GET` del pedido no
   * puede devolverlo. Cuando el modelo declare la columna, este método la
   * sella y la limitación desaparece del contrato.
   */
  async reject(
    id: string,
    dto: RejectPharmacyOrderDto,
    actor: AuthenticatedUser,
  ): Promise<PharmacyOrderDto> {
    const tenantId = requireTenantId();
    const reason = dto.reason.trim();
    if (reason === '') {
      throw new PreconditionFailedException(
        'El rechazo exige un motivo en palabras',
        { orderId: id },
      );
    }

    const { patientProfileId } = await this.em.transactional(async (tx) => {
      const order = await this.loadTenantOrderForUpdate(tx, id, tenantId);
      this.assertStaffTransition(order, PINV.ORDER_RECHAZADO);

      order.reservationStatusConceptId = PINV.ORDER_RECHAZADO;
      order.releasedAt = new Date();
      touch(order, actor.id);
      await this.reservationsService.releaseConfirmedLines(tx, order, actor);

      await this.publishStaffEvent(tx, tenantId, order, {
        eventType: 'PharmacyOrderRejected',
        statusCode: 'PINV_ORDER_RECHAZADO',
        actor,
        extra: { reason },
      });
      await tx.flush();

      this.logger.info(
        { operation: 'pharmacy_inventory.order.reject', orderId: order.id },
        'Pharmacy order rejected',
      );
      return { patientProfileId: order.patientProfileId };
    });

    if (patientProfileId) {
      await this.orderNotifications.orderRejected(
        id,
        patientProfileId,
        reason,
        actor.id,
      );
    }
    return this.readOrderForTenant(id, tenantId);
  }

  /**
   * FAR-E2: dejar el pedido listo en el mostrador — **BLOQUEADO POR MODELO**.
   *
   * `LISTO_PARA_RETIRO` afirma que hay un pedido esperando a una persona en un
   * mostrador — y eso solo es verdad si el pedido es de RETIRO. La modalidad
   * (`RETIRO|DOMICILIO|TRABAJO`) no se persiste todavía, así que no existe
   * evidencia fiable para distinguirlo: permitir la transición genéricamente
   * podría convertir un pedido de entrega en uno de retiro. Hasta que el patch
   * de modelo declare la modalidad (y con ella el código de retiro, que
   * tampoco existe), la ruta queda por compatibilidad y responde **422
   * tipificado** sin ningún efecto: cero transición, cero cambio de
   * `expires_at`, cero evento, cero campana, cero ledger.
   *
   * Al habilitarse, la semántica ya está fijada por el contrato FAR-E1/I2:
   * `CONFIRMADO|ACEPTADO → LISTO_PARA_RETIRO` (la tabla de transiciones ya la
   * declara), renovación de `expires_at` +48 h y sello del código de retiro —
   * solo cuando el pedido pueda demostrarse RETIRO.
   */
  async ready(id: string, actor: AuthenticatedUser): Promise<PharmacyOrderDto> {
    // El mismo 422 para todo actor y todo pedido: la capacidad entera está
    // bloqueada, así que no hay nada que leer ni que revelar. `actor` queda en
    // la firma para que habilitarla no cambie el contrato del controller.
    void actor;
    throw new PreconditionFailedException(
      'Marcar listo para retiro está bloqueado por modelo: la modalidad del pedido no se persiste y no puede demostrarse que sea un retiro. El pedido no se modificó.',
      { orderId: id, blockedByModel: 'deliveryMode' },
    );
  }

  /**
   * FAR-E1: vencer pedidos vivos cuyo `expires_at` ya pasó.
   *
   * La llaman el worker de UC-25-05 (sin `ids`: toda la cola) y la expiración
   * perezosa de las lecturas (con los `ids` sospechosos). Es race-safe: los
   * candidatos se toman con `FOR UPDATE` y el filtro de estado se reevalúa con
   * el lock ya tomado, así que el perdedor de una carrera ve el pedido ya
   * `VENCIDO` y no libera dos veces.
   */
  async expireDue(
    actor: AuthenticatedUser,
    ids?: readonly string[],
  ): Promise<{ expiredCount: number }> {
    return this.em.transactional(async (tx) => {
      const due = await this.ordersRepo.findDueOrdersForUpdate(
        tx,
        ORDER_NON_TERMINAL_STATUS_IDS,
        new Date(),
        ids,
      );
      if (due.length === 0) return { expiredCount: 0 };

      // El worker corre sin tenant HTTP: el tenant del evento es el de la
      // farmacia del pedido.
      const pharmacies = await this.ordersRepo.findPharmaciesByIds(tx, [
        ...new Set(due.map((order) => order.pharmacyId)),
      ]);
      const tenantByPharmacy = new Map(
        pharmacies.map((pharmacy) => [pharmacy.id, pharmacy.tenantId]),
      );

      for (const order of due) {
        order.reservationStatusConceptId = PINV.ORDER_VENCIDO;
        order.releasedAt = new Date();
        touch(order, actor.id);
        await this.reservationsService.releaseConfirmedLines(tx, order, actor);

        await this.outbox.publishDomainEvent(tx, {
          tenantId: tenantByPharmacy.get(order.pharmacyId),
          eventType: 'PharmacyOrderExpired',
          aggregateType: 'pharmacy_inventory.inventory_reservations',
          aggregateId: order.id,
          payloadJson: {
            orderId: order.id,
            pharmacyId: order.pharmacyId,
            pharmacySiteId: order.pharmacySiteId,
            statusCode: 'PINV_ORDER_VENCIDO',
          },
          actorUserId: actor.id,
        });
      }
      await tx.flush();

      this.logger.info(
        {
          operation: 'pharmacy_inventory.order.expire',
          expiredCount: due.length,
        },
        'Pharmacy orders expired',
      );
      return { expiredCount: due.length };
    });
  }

  // --- Apoyo ---

  /** El filtro de estado de la bandeja: un código conocido, o el set entero. */
  private resolveStatusFilter(statusCode?: string): readonly string[] {
    if (statusCode === undefined) return ORDER_STATUS_IDS;
    const id = ORDER_STATUS_ID_BY_CODE.get(statusCode);
    if (id === undefined) {
      throw new PreconditionFailedException('Estado de pedido desconocido', {
        status: statusCode,
        allowed: [...ORDER_STATUS_ID_BY_CODE.keys()],
      });
    }
    return [id];
  }

  /**
   * El pedido bajo lock de escritura, ya verificado contra el tenant activo.
   * Inexistente, de otro tenant o una reserva de mostrador: el mismo 404 —
   * una farmacia ajena no distingue «no existe» de «no es tuyo».
   */
  private async loadTenantOrderForUpdate(
    tx: EntityManager,
    id: string,
    tenantId: string,
  ): Promise<InventoryReservations> {
    const order = await this.ordersRepo.findOrderByIdForUpdate(
      tx,
      id,
      ORDER_STATUS_IDS,
    );
    if (!order) throw orderNotFound(id);
    const [pharmacy] = await this.ordersRepo.findPharmaciesByIdsInTenant(
      tx,
      tenantId,
      [order.pharmacyId],
    );
    if (!pharmacy) throw orderNotFound(id);
    return order;
  }

  /**
   * La máquina de estados del mostrador, aplicada: una transición que la
   * tabla no declara responde 422 con ambos estados en palabras. Se evalúa
   * con el lock ya tomado, así que el perdedor de una carrera ve el estado
   * ganador y recibe su 422 sin haber tocado ledger ni outbox.
   */
  private assertStaffTransition(
    order: InventoryReservations,
    toStatusId: string,
  ): void {
    const allowed = ORDER_STAFF_TRANSITIONS.get(
      order.reservationStatusConceptId,
    );
    if (!allowed?.has(toStatusId)) {
      throw new PreconditionFailedException(
        'La transición no es legal para el estado actual del pedido',
        {
          orderId: order.id,
          from: moduleConcept(order.reservationStatusConceptId).code,
          to: moduleConcept(toStatusId).code,
        },
      );
    }
  }

  /** El hecho del mostrador, publicado en la MISMA transacción del cambio. */
  private async publishStaffEvent(
    tx: EntityManager,
    tenantId: string,
    order: InventoryReservations,
    event: {
      /** Nombre del hecho. */
      eventType: string;
      /** Código del estado resultante. */
      statusCode: string;
      /** Quien opera el mostrador. */
      actor: AuthenticatedUser;
      /** Datos extra del hecho (p. ej. el motivo efímero del rechazo). */
      extra?: Record<string, unknown>;
    },
  ): Promise<void> {
    await this.outbox.publishDomainEvent(tx, {
      tenantId,
      eventType: event.eventType,
      aggregateType: 'pharmacy_inventory.inventory_reservations',
      aggregateId: order.id,
      payloadJson: {
        orderId: order.id,
        pharmacyId: order.pharmacyId,
        pharmacySiteId: order.pharmacySiteId,
        statusCode: event.statusCode,
        ...(event.extra ?? {}),
      },
      actorUserId: event.actor.id,
    });
  }

  /** La lectura del pedido para el mostrador, tras una transición. */
  private async readOrderForTenant(
    id: string,
    tenantId: string,
  ): Promise<PharmacyOrderDto> {
    const em = this.em.fork();
    const order = await this.ordersRepo.findOrderById(em, id, ORDER_STATUS_IDS);
    if (!order) throw orderNotFound(id);
    const [dto] = await this.composeOrders(em, tenantId, [order]);
    if (!dto) throw orderNotFound(id);
    return dto;
  }

  /** El claim `pid` es la titularidad; una cuenta sin perfil no puede pedir. */
  private requirePatientProfile(actor: AuthenticatedUser): string {
    if (!actor.patientProfileId) {
      throw new PreconditionFailedException(
        'La cuenta autenticada no tiene perfil de paciente',
        {},
      );
    }
    return actor.patientProfileId;
  }

  /** Un producto por línea: repetirlo escondería cantidades sumadas. */
  private assertNoDuplicateProducts(dto: CreatePharmacyOrderDto): void {
    const seen = new Set<string>();
    const repeated = new Set<string>();
    for (const line of dto.lines) {
      if (seen.has(line.productId)) repeated.add(line.productId);
      seen.add(line.productId);
    }
    if (repeated.size > 0) {
      throw new PreconditionFailedException(
        'El pedido repite productos; use una línea por producto',
        { productIds: [...repeated] },
      );
    }
  }

  /** ¿Vivo y con el reloj vencido? — candidato a expiración perezosa. */
  private isDue(order: InventoryReservations): boolean {
    return (
      ORDER_NON_TERMINAL_STATUS_IDS.includes(
        order.reservationStatusConceptId,
      ) && order.expiresAt.getTime() <= Date.now()
    );
  }

  /**
   * Reserva las líneas del pedido con la contabilidad de UC-25-04, pero en
   * variante **parcial**: la línea se cubre entera o queda `SIN_STOCK`.
   *
   * Por línea: se toman con `FOR UPDATE` las posiciones candidatas de la sede
   * (mayor disponible primero, con desempate estable) y se asigna en avaricia
   * sobre los valores ya bloqueados. Si el disponible total no alcanza, la
   * línea queda registrada con `reserved_quantity = 0` y sin asiento — no hay
   * nada que devolver después. Si alcanza, cada porción escribe su línea, su
   * `MV_RESERVE` y el recálculo de la posición, exactamente como la reserva de
   * mostrador.
   *
   * @returns Cuántas líneas quedaron sin stock.
   */
  private async reserveOrderLines(
    tx: EntityManager,
    reservation: InventoryReservations,
    dto: CreatePharmacyOrderDto,
    actor: AuthenticatedUser,
  ): Promise<number> {
    const locations = await this.inventoryReadRepo.findActiveLocationsBySites(
      tx,
      [reservation.pharmacySiteId],
    );
    const positions = await this.inventoryReadRepo.findStockPositions(
      tx,
      locations.map((location) => location.id),
      dto.lines.map((line) => line.productId),
    );
    const byProduct = new Map<string, InventoryStockPositions[]>();
    for (const position of positions) {
      const list = byProduct.get(position.pharmacyProductId) ?? [];
      list.push(position);
      byProduct.set(position.pharmacyProductId, list);
    }

    let outOfStock = 0;
    for (const line of dto.lines) {
      const candidates = (byProduct.get(line.productId) ?? [])
        .filter((position) => num(position.availableQuantity) > 0)
        .sort(comparePositions);

      // Fase 1: bloquear las candidatas y releer su disponible ya con lock.
      const locked: InventoryStockPositions[] = [];
      for (const candidate of candidates) {
        const position = await this.stockRepo.findByKeyForUpdate(tx, {
          inventoryLocationId: candidate.inventoryLocationId,
          pharmacyProductId: candidate.pharmacyProductId,
          inventoryLotId: candidate.inventoryLotId,
        });
        if (position && num(position.availableQuantity) > 0) {
          locked.push(position);
        }
      }

      // Fase 2: plan de porciones en avaricia sobre los valores bloqueados.
      const portions: { position: InventoryStockPositions; take: number }[] =
        [];
      let remaining = line.quantity;
      for (const position of locked) {
        if (remaining <= 0) break;
        const take = Math.min(remaining, num(position.availableQuantity));
        portions.push({ position, take });
        remaining -= take;
      }

      if (remaining > 0) {
        // Sin stock suficiente: la línea queda dicha, el pedido sigue en pie.
        this.reservationsRepo.createLine(tx, {
          inventoryReservationId: reservation.id,
          pharmacyProductId: line.productId,
          requestedQuantity: String(line.quantity),
          reservedQuantity: '0',
          statusConceptId: PINV.RES_LINE_OUT_OF_STOCK,
          actorUserId: actor.id,
        });
        outOfStock += 1;
        continue;
      }

      // Fase 3: escribir porciones con la contabilidad de UC-25-04.
      for (const { position, take } of portions) {
        this.reservationsRepo.createLine(tx, {
          inventoryReservationId: reservation.id,
          pharmacyProductId: line.productId,
          inventoryLotId: position.inventoryLotId,
          inventoryLocationId: position.inventoryLocationId,
          requestedQuantity: String(take),
          reservedQuantity: String(take),
          statusConceptId: PINV.RES_LINE_CONFIRMED,
          actorUserId: actor.id,
        });
        const sequence = await this.ledgerRepo.nextSequence(
          tx,
          reservation.pharmacyId,
        );
        this.ledgerRepo.append(tx, {
          pharmacyId: reservation.pharmacyId,
          pharmacySiteId: reservation.pharmacySiteId,
          inventoryLocationId: position.inventoryLocationId,
          pharmacyProductId: line.productId,
          inventoryLotId: position.inventoryLotId,
          ledgerSequence: sequence,
          movementTypeConceptId: PINV.MV_RESERVE,
          quantityDelta: '0',
          reservationDelta: String(take),
          sourceId: reservation.id,
          recordedByUserId: actor.id,
        });
        position.reservedQuantity = String(
          num(position.reservedQuantity) + take,
        );
        position.availableQuantity = recompute(
          position.onHandQuantity,
          position.reservedQuantity,
          position.quarantineQuantity,
        );
        position.lastLedgerSequence = sequence;
        position.updatedAt = new Date();
      }
    }
    await tx.flush();
    return outOfStock;
  }

  /** La lectura del propio pedido tras crear o cancelar (el titular siempre ve). */
  private async readOwnOrder(
    id: string,
    tenantId: string,
    patientProfileId: string,
  ): Promise<PharmacyOrderDto> {
    const em = this.em.fork();
    const order = await this.ordersRepo.findOrderById(em, id, ORDER_STATUS_IDS);
    if (!order || order.patientProfileId !== patientProfileId) {
      throw orderNotFound(id);
    }
    const [dto] = await this.composeOrders(em, tenantId, [order]);
    if (!dto) throw orderNotFound(id);
    return dto;
  }

  /**
   * Pone los pedidos en palabras, todo en lote (spec anti-N+1): líneas, sedes,
   * farmacias (acotadas por tenant en el WHERE), productos y conceptos, cada
   * uno en una sola consulta. Un pedido cuya farmacia no resuelve en el tenant
   * activo se omite: para ese contexto no existe.
   */
  private async composeOrders(
    em: EntityManager,
    tenantId: string,
    orders: readonly InventoryReservations[],
  ): Promise<PharmacyOrderDto[]> {
    if (orders.length === 0) return [];

    const [lines, sites, pharmacies, patientNames] = await Promise.all([
      this.ordersRepo.findLinesByReservationIds(
        em,
        orders.map((order) => order.id),
      ),
      this.ordersRepo.findSitesByIds(em, [
        ...new Set(orders.map((order) => order.pharmacySiteId)),
      ]),
      this.ordersRepo.findPharmaciesByIdsInTenant(em, tenantId, [
        ...new Set(orders.map((order) => order.pharmacyId)),
      ]),
      // El nombre del paciente, en lote: la bandeja FAR-E2 lo pinta y un
      // uuid no se pinta.
      this.ordersRepo.findPersonNamesByProfileIds(em, [
        ...new Set(
          orders
            .map((order) => order.patientProfileId)
            .filter((id): id is string => Boolean(id)),
        ),
      ]),
    ]);
    const products = await this.ordersRepo.findProductsByIds(em, [
      ...new Set(lines.map((line) => line.pharmacyProductId)),
    ]);
    const concepts = await this.ordersRepo.findConceptsByIds(em, [
      ...new Set(
        products
          .map((product) => product.medicationConceptId)
          .filter((id): id is string => Boolean(id)),
      ),
    ]);

    const linesByOrder = new Map<string, InventoryReservationLines[]>();
    for (const line of lines) {
      const list = linesByOrder.get(line.inventoryReservationId) ?? [];
      list.push(line);
      linesByOrder.set(line.inventoryReservationId, list);
    }
    const siteById = new Map(sites.map((site) => [site.id, site]));
    const pharmacyById = new Map(
      pharmacies.map((pharmacy) => [pharmacy.id, pharmacy]),
    );
    const productById = new Map(
      products.map((product) => [product.id, product]),
    );
    const conceptById = new Map(
      concepts.map((concept) => [concept.id, concept]),
    );

    const items: PharmacyOrderDto[] = [];
    for (const order of orders) {
      const pharmacy = pharmacyById.get(order.pharmacyId);
      if (!pharmacy) continue;
      const site = siteById.get(order.pharmacySiteId);
      items.push(
        toOrderDto(
          order,
          pharmacy,
          site,
          linesByOrder.get(order.id) ?? [],
          productById,
          conceptById,
          order.patientProfileId
            ? (patientNames.get(order.patientProfileId) ?? null)
            : null,
        ),
      );
    }
    return items;
  }
}

/** Orden estable de posiciones: mayor disponible, luego ubicación y lote. */
function comparePositions(
  a: InventoryStockPositions,
  b: InventoryStockPositions,
): number {
  const byAvailable = Number(b.availableQuantity) - Number(a.availableQuantity);
  if (byAvailable !== 0) return byAvailable;
  const byLocation = a.inventoryLocationId.localeCompare(b.inventoryLocationId);
  if (byLocation !== 0) return byLocation;
  return (a.inventoryLotId ?? '').localeCompare(b.inventoryLotId ?? '');
}

/** Un concepto del módulo, en palabras, desde su definición en código. */
function moduleConcept(id: string): InventoryConceptDto {
  return PINV_CONCEPT_BY_ID.get(id) ?? { code: id, display: id };
}

/** El medicamento del vademécum, resuelto desde terminología si está. */
function optionalConcept(
  concepts: ReadonlyMap<string, CatalogConcepts>,
  id: string | undefined,
): InventoryConceptDto | null {
  const value = id === undefined ? undefined : concepts.get(id);
  return value ? { code: value.code, display: value.display } : null;
}

/**
 * Re-agrega las líneas persistidas por producto: una línea repartida en varias
 * posiciones vuelve a ser UNA línea del pedido, con las cantidades sumadas.
 * Las porciones de un mismo producto comparten destino (todas confirmadas,
 * todas liberadas, o la única sin stock), así que el estado del grupo es el de
 * su primera porción.
 */
function toOrderDto(
  order: InventoryReservations,
  pharmacy: Pharmacies,
  site: PharmacySites | undefined,
  lines: readonly InventoryReservationLines[],
  productById: ReadonlyMap<string, PharmacyProducts>,
  conceptById: ReadonlyMap<string, CatalogConcepts>,
  patientName: string | null,
): PharmacyOrderDto {
  const grouped = new Map<string, InventoryReservationLines[]>();
  for (const line of lines) {
    const list = grouped.get(line.pharmacyProductId) ?? [];
    list.push(line);
    grouped.set(line.pharmacyProductId, list);
  }

  const lineDtos: PharmacyOrderLineDto[] = [...grouped.entries()]
    .map(([productId, portions]) => {
      const product = productById.get(productId);
      return {
        productId,
        productCode: product?.productCode ?? '',
        brandName: product?.brandName ?? null,
        genericName: product?.genericName ?? null,
        strengthText: product?.strengthText ?? null,
        packageSizeText: product?.packageSizeText ?? null,
        medication: optionalConcept(conceptById, product?.medicationConceptId),
        requestedQuantity: portions.reduce(
          (sum, portion) => sum + Number(portion.requestedQuantity),
          0,
        ),
        reservedQuantity: portions.reduce(
          (sum, portion) => sum + Number(portion.reservedQuantity),
          0,
        ),
        status: moduleConcept(portions[0].statusConceptId),
      };
    })
    .sort((a, b) =>
      (a.genericName ?? a.productCode).localeCompare(
        b.genericName ?? b.productCode,
      ),
    );

  return {
    id: order.id,
    status: moduleConcept(order.reservationStatusConceptId),
    createdAt: order.createdAt.toISOString(),
    expiresAt: order.expiresAt.toISOString(),
    siteId: order.pharmacySiteId,
    siteName: site?.name ?? '',
    pharmacyId: pharmacy.id,
    pharmacyName: pharmacyName(pharmacy),
    medicationRequestId: order.medicationRequestId ?? null,
    patientName,
    lines: lineDtos,
  };
}
