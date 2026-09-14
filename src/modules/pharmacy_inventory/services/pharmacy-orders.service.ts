import { TenantAdministrationService } from '../../directory/services/tenant-administration.service';
import { PatientSettlementService } from '../../insurance/services/patient-settlement.service';
import { unavailableSettlement } from '../../insurance/dto/patient-settlement.dto';
import { randomInt } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { UniqueConstraintViolationException } from '@mikro-orm/core';
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
  PharmacyOrderSubstitutions,
} from '../entities';
import {
  PharmacyOrdersRepository,
  ReservationsRepository,
  StockPositionsRepository,
  LedgerRepository,
  InventoryReadRepository,
  DispensationsRepository,
  PharmacyOrderSubstitutionsRepository,
} from '../repositories';
import { PharmacyReadRepository } from '../../pharmacy/repositories';
import { isRetailList } from '../../pharmacy/services/pharmacy-read.service';
import {
  multiplyAmounts,
  payableAmount,
  sumAmounts,
  winningPriceFor,
} from './pharmacy-pricing';
import { InventoryReservationsService } from './inventory-reservations.service';
import { PharmacyOrderNotificationsService } from './pharmacy-order-notifications.service';
import type {
  ConfirmOrderAdjustmentDto,
  ConfirmPharmacyOrderDto,
  CreatePharmacyOrderDto,
  DispensePharmacyOrderDto,
  PharmacyOrderDto,
  PharmacyOrderLineDto,
  PharmacyOrderListResponseDto,
  PharmacyOrderSubstitutionDto,
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
 * Alfabeto del código de retiro: **sin ambiguos** (`0`/`O`, `1`/`I`/`L`
 * excluidos a propósito). El código se dicta en voz alta en un mostrador y se
 * copia a mano de la pantalla de un teléfono; `IL01` es una discusión
 * garantizada. 30⁶ ≈ 7,3 × 10⁸ combinaciones. Contrato v4.2.1
 * (`DISENO-CODIGO-RETIRO.md`).
 */
export const PICKUP_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** Largo del código de retiro. */
export const PICKUP_CODE_LENGTH = 6;

/**
 * Intentos ante colisión de código (violación del único parcial). La unicidad
 * la garantiza el índice, no una consulta previa: se genera, se inserta y se
 * reintenta la transacción entera si el índice lo rechaza — consultar antes de
 * escribir es una carrera. Con 7 × 10⁸ de espacio, dos colisiones seguidas son
 * casi imposibles; tres intentos están de sobra.
 */
const PICKUP_CODE_MAX_ATTEMPTS = 3;

/**
 * El único parcial que respalda la unicidad del código de retiro, POR SEDE
 * desde v4.2.2. El detector de colisiones compara contra ESTE nombre y nada
 * más; un spec lo contrasta contra el catálogo ORM (`pharmacy_inventory.idx`)
 * para que el próximo rename rompa un test en vez de matar el reintento en
 * silencio — que es exactamente lo que el rename de v4.2.2 le hizo a v4.2.1.
 */
export const PICKUP_CODE_UNIQUE_INDEX =
  'ux_inventory_reservations_pharmacy_site_pickup_code';

/** Del código de modalidad del contrato (`RETIRO`…) al concepto persistible. */
const DELIVERY_MODE_ID_BY_CODE: ReadonlyMap<string, string> = new Map([
  ['RETIRO', PINV.DELIVERY_RETIRO],
  ['DOMICILIO', PINV.DELIVERY_DOMICILIO],
  ['TRABAJO', PINV.DELIVERY_TRABAJO],
]);

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
 * confirmar lo no revisado o en revisión (a `CONFIRMADO`, o a
 * `ACEPTACION_PENDIENTE` cuando la confirmación trae propuestas de genérico),
 * rechazar todo lo vivo salvo lo que ya espera en el mostrador, y dejar listo
 * lo confirmado o aceptado.
 *
 * Fuera de esta tabla viven las transiciones que no son del mostrador: la
 * cancelación del titular (no-terminal → CANCELADO, con su 409 sobre
 * terminales), el vencimiento por reloj (no-terminal → VENCIDO) y la decisión
 * del paciente sobre las propuestas (`ACEPTACION_PENDIENTE → ACEPTADO` al
 * aceptar, `→ CONFIRMADO` al preferir el original — la guarda vive en sus
 * casos de uso). Una transición que no figura acá responde 422.
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
      PINV.ORDER_ACEPTACION_PENDIENTE,
      PINV.ORDER_RECHAZADO,
    ]),
  ],
  [
    PINV.ORDER_EN_REVISION,
    new Set([
      PINV.ORDER_CONFIRMADO,
      PINV.ORDER_ACEPTACION_PENDIENTE,
      PINV.ORDER_RECHAZADO,
    ]),
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
 * Quién lee el pedido. El código de retiro es la prueba de posesión del
 * titular: solo la vista `owner` lo sirve; el staff valida enviándolo en la
 * dispensa, no mirándolo en la bandeja.
 */
type OrderViewer = 'owner' | 'staff';

/** Un precio congelado: lo que paga el paciente + la moneda de la lista. */
interface FrozenPrice {
  /** Importe unitario, texto exacto. */
  readonly unitPriceAmount?: string;
  /** Moneda copiada de la lista de precios. */
  readonly currencyConceptId?: string;
}

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
 * Desde el modelo v4.2.1 el pedido persiste su **modalidad de entrega** y su
 * **código de retiro**, y con ellos este servicio ejecuta el flujo completo de
 * retiro: `ready` (FAR-E2, sella el código) y `dispense` (FAR-E3, entrega
 * parcial acumulativa contra el código). Lo que el carril todavía no
 * implementa (dirección de envío, precios congelados, motivo de rechazo
 * persistido, sustituciones) **no se persiste ni se finge**: va en su propia
 * rama para mantener el diff revisable.
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
   * @param dispensationsRepo - Alta de dispensaciones (la entrega de FAR-E3).
   * @param substitutionsRepo - Bitácora de propuestas de sustitución (v4.2.1).
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
    private readonly dispensationsRepo: DispensationsRepository,
    private readonly substitutionsRepo: PharmacyOrderSubstitutionsRepository,
    private readonly pharmacyRepo: PharmacyReadRepository,
    private readonly reservationsService: InventoryReservationsService,
    private readonly outbox: OutboxService,
    private readonly orderNotifications: PharmacyOrderNotificationsService,
    private readonly logger: PinoLogger,
    private readonly settlements: PatientSettlementService,
    private readonly tenantAdministration: TenantAdministrationService,
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
    const deliveryModeConceptId = this.resolveDeliveryMode(dto.deliveryMode);

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

      // El precio se CONGELA acá, al crear (v4.2.1): lo que el paciente vio
      // al pedir es lo que el comprobante va a decir, aunque la lista cambie
      // mañana. La regla de elección es la MISMA del comparador (pricing).
      const frozenPrices = await this.freezePricesFor(
        tx,
        pharmacy.id,
        site.id,
        productIds,
      );

      const reservation = this.reservationsRepo.create(tx, {
        pharmacyId: pharmacy.id,
        pharmacySiteId: site.id,
        patientProfileId,
        medicationRequestId: dto.medicationRequestId,
        reservationStatusConceptId: PINV.ORDER_ENVIADO,
        deliveryModeConceptId,
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
        frozenPrices,
      );

      // El total congelado de cabecera, desde las líneas recién selladas.
      this.sealFrozenTotal(
        reservation,
        await this.ordersRepo.findLinesByReservationIds(tx, [reservation.id]),
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

    const items = await this.composeOrders(em, tenantId, orders, 'owner');
    const settlements = await this.settlements.forOrders(
      em,
      actor.id,
      'PHARMACY',
      items.map((item) => item.id),
    );
    return {
      items: items.map((item) => ({
        ...item,
        ...(settlements.get(item.id) ?? unavailableSettlement()),
      })),
      count: items.length,
    };
  }

  /**
   * FAR-E1: un pedido concreto.
   *
   * Lo ve su titular (claim `pid`), la plataforma o un OWNER/ADMIN activo
   * del tenant de la farmacia.
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

    // El aislamiento precede tanto a la composición como a la expiración perezosa.
    const [pharmacy] = await this.ordersRepo.findPharmaciesByIdsInTenant(
      em,
      tenantId,
      [order.pharmacyId],
    );
    if (!pharmacy) throw orderNotFound(id);

    const isOwner =
      actor.patientProfileId !== undefined &&
      order.patientProfileId === actor.patientProfileId;
    const isStaff = actor.roles.some((role) => STAFF_READ_ROLES.includes(role));
    if (
      !isOwner &&
      !isStaff &&
      !(await this.tenantAdministration.canAdminister(
        em,
        pharmacy.tenantId,
        actor,
      ))
    ) {
      throw orderNotFound(id);
    }

    if (this.isDue(order)) {
      await this.expireDue(actor, [id]);
      em = this.em.fork();
      order = await this.ordersRepo.findOrderById(em, id, ORDER_STATUS_IDS);
      if (!order) throw orderNotFound(id);
    }

    // El tenant va en la consulta: una farmacia de otro tenant no resuelve y
    // el pedido cae en el mismo 404 que uno inexistente.
    const [dto] = await this.composeOrders(
      em,
      tenantId,
      [order],
      isOwner ? 'owner' : 'staff',
    );
    if (!dto) throw orderNotFound(id);
    if (isOwner) {
      const settlements = await this.settlements.forOrders(
        em,
        actor.id,
        'PHARMACY',
        [id],
      );
      return { ...dto, ...(settlements.get(id) ?? unavailableSettlement()) };
    }
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
   * FAR-E2: confirmar el pedido — `ENVIADO|EN_REVISION → CONFIRMADO`, o
   * `→ ACEPTACION_PENDIENTE` si la confirmación trae propuestas de genérico
   * (v4.2.1). En ambos casos se sella `confirmed_at`: la farmacia revisó.
   *
   * Un ajuste `NO_DISPONIBLE` devuelve el stock de ESE renglón con la
   * primitiva compartida (`onlyLineIds`) y deja la línea como
   * `RES_LINE_OUT_OF_STOCK` con reservado 0 — la misma forma que tiene una
   * línea que nació sin stock; una línea ya sin stock no se libera dos veces.
   *
   * Un ajuste `PROPONER_GENERICO` persiste la propuesta como **bitácora** en
   * `pharmacy_order_substitutions` (estado `PROPUESTA`, sin `decided_at`):
   * el propuesto debe ser un producto activo de la MISMA farmacia y del MISMO
   * medicamento del vademécum, con los precios de ambos congelados al proponer
   * — la oferta que el paciente decide no puede moverse debajo suyo. El stock
   * del original queda reservado mientras tanto: si el paciente prefiere el
   * original, el pedido sigue tal cual.
   *
   * El total congelado de cabecera se RE-congela al final: las líneas que
   * quedaron sin stock salen de la suma.
   */
  async confirm(
    id: string,
    dto: ConfirmPharmacyOrderDto,
    actor: AuthenticatedUser,
  ): Promise<PharmacyOrderDto> {
    const tenantId = requireTenantId();
    const adjustments = dto.adjustments ?? [];
    this.assertOneAdjustmentPerProduct(adjustments);
    const proposals = adjustments.filter(
      (adjustment) => adjustment.decision === 'PROPONER_GENERICO',
    );

    const { patientProfileId } = await this.em.transactional(async (tx) => {
      const order = await this.loadTenantOrderForUpdate(tx, id, tenantId);
      const target =
        proposals.length > 0
          ? PINV.ORDER_ACEPTACION_PENDIENTE
          : PINV.ORDER_CONFIRMADO;
      this.assertStaffTransition(order, target);

      const lines = await this.ordersRepo.findLinesByReservationIds(tx, [
        order.id,
      ]);
      const linesByProduct = new Map<string, InventoryReservationLines[]>();
      for (const line of lines) {
        const list = linesByProduct.get(line.pharmacyProductId) ?? [];
        list.push(line);
        linesByProduct.set(line.pharmacyProductId, list);
      }

      let adjusted = 0;
      for (const adjustment of adjustments) {
        const portions = linesByProduct.get(adjustment.productId);
        if (!portions) {
          throw new PreconditionFailedException(
            'El ajuste refiere un producto que no está en el pedido',
            { orderId: id, productId: adjustment.productId },
          );
        }
        if (adjustment.decision !== 'NO_DISPONIBLE') continue;
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

      if (proposals.length > 0) {
        await this.persistProposals(
          tx,
          order,
          proposals,
          linesByProduct,
          actor,
        );
      }

      order.reservationStatusConceptId = target;
      order.confirmedAt = new Date();
      touch(order, actor.id);
      this.sealFrozenTotal(order, lines);

      await this.publishStaffEvent(tx, tenantId, order, {
        eventType:
          proposals.length > 0
            ? 'PharmacyOrderSubstitutionsProposed'
            : 'PharmacyOrderConfirmed',
        statusCode:
          proposals.length > 0
            ? 'PINV_ORDER_ACEPTACION_PENDIENTE'
            : 'PINV_ORDER_CONFIRMADO',
        actor,
        extra: {
          unavailableLineCount: adjusted,
          proposalCount: proposals.length,
        },
      });
      await tx.flush();

      this.logger.info(
        {
          operation: 'pharmacy_inventory.order.confirm',
          orderId: order.id,
          unavailableLines: adjusted,
          proposals: proposals.length,
        },
        'Pharmacy order confirmed',
      );
      return { patientProfileId: order.patientProfileId };
    });

    if (patientProfileId) {
      if (proposals.length > 0) {
        await this.orderNotifications.substitutionsProposed(
          id,
          patientProfileId,
          proposals.length,
          actor.id,
        );
      } else {
        await this.orderNotifications.orderConfirmed(
          id,
          patientProfileId,
          actor.id,
        );
      }
    }
    return this.readOrderForTenant(id, tenantId);
  }

  /**
   * FAR-E2/I2: el paciente ACEPTA los genéricos propuestos —
   * `ACEPTACION_PENDIENTE → ACEPTADO`, todo-o-nada (los dos botones del
   * contrato del front deciden el pedido entero).
   *
   * Por cada propuesta en pie: el stock reservado del original se devuelve
   * con la primitiva compartida, el propuesto se reserva con la MISMA
   * contabilidad de la creación (sin stock suficiente la línea queda
   * `SIN_STOCK`, dicha, no fingida), y la línea nueva nace con el precio que
   * la propuesta CONGELÓ — el paciente aceptó esa oferta, no la lista de
   * mañana. La propuesta sobrevive como historia: `ACEPTADA` + `decided_at`.
   */
  async acceptSubstitutions(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<PharmacyOrderDto> {
    const tenantId = requireTenantId();
    const patientProfileId = this.requirePatientProfile(actor);

    await this.em.transactional(async (tx) => {
      const order = await this.loadOwnOrderForUpdate(
        tx,
        id,
        tenantId,
        patientProfileId,
      );
      const pending = await this.pendingProposalsOf(tx, order);

      const lines = await this.ordersRepo.findLinesByReservationIds(tx, [
        order.id,
      ]);
      const locations = await this.inventoryReadRepo.findActiveLocationsBySites(
        tx,
        [order.pharmacySiteId],
      );
      const positions = await this.inventoryReadRepo.findStockPositions(
        tx,
        locations.map((location) => location.id),
        pending.map((proposal) => proposal.proposedPharmacyProductId),
      );
      const positionsByProduct = new Map<string, InventoryStockPositions[]>();
      for (const position of positions) {
        const list = positionsByProduct.get(position.pharmacyProductId) ?? [];
        list.push(position);
        positionsByProduct.set(position.pharmacyProductId, list);
      }

      for (const proposal of pending) {
        const portions = lines.filter(
          (line) =>
            line.pharmacyProductId === proposal.originalPharmacyProductId,
        );
        const requestedTotal = portions.reduce(
          (sum, portion) => sum + num(portion.requestedQuantity),
          0,
        );
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
        }
        const candidates = (
          positionsByProduct.get(proposal.proposedPharmacyProductId) ?? []
        )
          .filter((position) => num(position.availableQuantity) > 0)
          .sort(comparePositions);
        await this.reserveLineStock(
          tx,
          order,
          candidates,
          proposal.proposedPharmacyProductId,
          requestedTotal,
          actor,
          {
            unitPriceAmount: proposal.proposedUnitPriceAmount,
            currencyConceptId: proposal.currencyConceptId,
          },
        );

        proposal.statusConceptId = PINV.SUBSTITUTION_ACEPTADA;
        proposal.decidedAt = new Date();
        touch(proposal, actor.id);
      }

      order.reservationStatusConceptId = PINV.ORDER_ACEPTADO;
      touch(order, actor.id);
      // El total se RE-congela con las líneas nuevas: el comprobante tiene
      // que decir lo que se va a cobrar tras el cambio.
      this.sealFrozenTotal(
        order,
        await this.ordersRepo.findLinesByReservationIds(tx, [order.id]),
      );

      await this.publishStaffEvent(tx, tenantId, order, {
        eventType: 'PharmacyOrderSubstitutionsAccepted',
        statusCode: 'PINV_ORDER_ACEPTADO',
        actor,
        extra: { acceptedCount: pending.length },
      });
      await tx.flush();

      this.logger.info(
        {
          operation: 'pharmacy_inventory.order.accept_substitutions',
          orderId: order.id,
          accepted: pending.length,
        },
        'Pharmacy order substitutions accepted',
      );
    });

    return this.readOwnOrder(id, tenantId, patientProfileId);
  }

  /**
   * FAR-E2/I2: el paciente PREFIERE los originales —
   * `ACEPTACION_PENDIENTE → CONFIRMADO`. Las líneas no se tocan (el stock del
   * original siguió reservado todo el tiempo); las propuestas quedan como
   * historia: `RECHAZADA` + `decided_at`. La farmacia ya había revisado el
   * pedido, así que vuelve a la cola del mostrador como confirmado.
   */
  async preferOriginal(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<PharmacyOrderDto> {
    const tenantId = requireTenantId();
    const patientProfileId = this.requirePatientProfile(actor);

    await this.em.transactional(async (tx) => {
      const order = await this.loadOwnOrderForUpdate(
        tx,
        id,
        tenantId,
        patientProfileId,
      );
      const pending = await this.pendingProposalsOf(tx, order);

      for (const proposal of pending) {
        proposal.statusConceptId = PINV.SUBSTITUTION_RECHAZADA;
        proposal.decidedAt = new Date();
        touch(proposal, actor.id);
      }

      order.reservationStatusConceptId = PINV.ORDER_CONFIRMADO;
      touch(order, actor.id);

      await this.publishStaffEvent(tx, tenantId, order, {
        eventType: 'PharmacyOrderOriginalPreferred',
        statusCode: 'PINV_ORDER_CONFIRMADO',
        actor,
        extra: { declinedCount: pending.length },
      });
      await tx.flush();

      this.logger.info(
        {
          operation: 'pharmacy_inventory.order.prefer_original',
          orderId: order.id,
          declined: pending.length,
        },
        'Pharmacy order substitutions declined',
      );
    });

    return this.readOwnOrder(id, tenantId, patientProfileId);
  }

  /**
   * FAR-E2: rechazar el pedido — estados rechazables → `RECHAZADO`, liberando
   * el stock reservado con la primitiva compartida (sin doble liberación: la
   * guarda por línea y el lock de cabecera lo garantizan; un reintento ve el
   * pedido ya terminal y recibe 422 sin tocar el ledger).
   *
   * El motivo **se persiste** en `rejection_reason_text` (v4.2.1) además de
   * viajar en el evento y en la campana: el `GET` del pedido lo devuelve.
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
      order.rejectionReasonText = reason;
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
   * FAR-E2/E3: dejar el pedido listo en el mostrador —
   * `CONFIRMADO|ACEPTADO → LISTO_PARA_RETIRO` (habilitado por el modelo
   * v4.2.1, que persiste la modalidad y el código de retiro).
   *
   * `LISTO_PARA_RETIRO` afirma que hay un pedido esperando a una persona en
   * un mostrador, así que exige demostrarlo: el pedido debe declarar
   * modalidad `PINV_DELIVERY_RETIRO` (uno de envío cierra por el carril de
   * envío, FAR-E4) y la sede debe ofrecer retiro en mostrador
   * (`pharmacy_sites.pickup_available`) — el esquema no puede exigir ninguna
   * de las dos porque la tabla la comparten las reservas de mostrador; son
   * reglas de este servicio.
   *
   * En la MISMA transacción se sella el código de retiro (solo si no lo tenía:
   * un reintento no rota el código de alguien ya avisado) y se renueva
   * `expires_at` +48 h — el código caduca con el pedido, sin ventana propia.
   * La unicidad del código la garantiza el índice parcial **por sede**
   * `ux_inventory_reservations_pharmacy_site_pickup_code` (v4.2.2): ante la
   * colisión (rarísima) se reintenta la transacción entera con un código
   * nuevo, hasta 3 veces.
   */
  async ready(id: string, actor: AuthenticatedUser): Promise<PharmacyOrderDto> {
    const tenantId = requireTenantId();

    let lastCollision: unknown;
    for (let attempt = 1; attempt <= PICKUP_CODE_MAX_ATTEMPTS; attempt += 1) {
      try {
        const { patientProfileId, pickupCode } = await this.em.transactional(
          async (tx) => {
            const order = await this.loadTenantOrderForUpdate(tx, id, tenantId);
            this.assertStaffTransition(order, PINV.ORDER_LISTO_PARA_RETIRO);
            await this.assertPickupOrder(tx, order);

            // Un reintento (o una transición previa fallida después del
            // sello) conserva el código: rotarlo obligaría a re-avisar a
            // alguien que quizá ya está en camino.
            order.pickupCode ??= generatePickupCode();
            order.reservationStatusConceptId = PINV.ORDER_LISTO_PARA_RETIRO;
            order.expiresAt = new Date(
              Date.now() + ORDER_TTL_HOURS * 3_600_000,
            );
            touch(order, actor.id);

            await this.publishStaffEvent(tx, tenantId, order, {
              eventType: 'PharmacyOrderReady',
              statusCode: 'PINV_ORDER_LISTO_PARA_RETIRO',
              actor,
            });
            await tx.flush();

            this.logger.info(
              {
                operation: 'pharmacy_inventory.order.ready',
                orderId: order.id,
              },
              'Pharmacy order ready for pickup',
            );
            return {
              patientProfileId: order.patientProfileId,
              pickupCode: order.pickupCode,
            };
          },
        );

        if (patientProfileId) {
          await this.orderNotifications.orderReady(
            id,
            patientProfileId,
            actor.id,
            pickupCode,
          );
        }
        return this.readOrderForTenant(id, tenantId);
      } catch (error) {
        if (!isPickupCodeCollision(error)) throw error;
        lastCollision = error;
        this.logger.info(
          { operation: 'pharmacy_inventory.order.ready', orderId: id, attempt },
          'Pickup code collision; retrying with a fresh code',
        );
      }
    }
    // Tres colisiones seguidas sobre 7 × 10⁸ de espacio no son mala suerte:
    // algo está mal (¿el generador?, ¿el índice?) y se dice como conflicto.
    throw new ConflictException(
      'No se pudo sellar un código de retiro único; reintente la operación',
      {
        orderId: id,
        attempts: PICKUP_CODE_MAX_ATTEMPTS,
        cause: String(lastCollision),
      },
    );
  }

  /**
   * FAR-E3: la entrega en el mostrador —
   * `LISTO_PARA_RETIRO → (LISTO_PARA_RETIRO | RETIRADO)`.
   *
   * ## El código primero, los efectos después
   *
   * El pedido se carga con `FOR UPDATE` (dos mostradores concurrentes se
   * serializan) y el código se valida **antes de cualquier escritura**,
   * insensible a mayúsculas. Un código que no coincide responde 422 tipificado
   * con cero efectos: nada de stock, nada de ledger, nada de estado — el
   * front ya espera esa forma (`codigoValido: false`).
   *
   * ## Parcial acumulativa
   *
   * La entrega puede acotarse a productos (`productIds`); cada línea entregada
   * acumula en `fulfilled_quantity` (la fuente de verdad del saldo: restante =
   * `reserved − fulfilled`) y el desglose por entrega queda en las
   * `medication_dispensation_lines`. Mientras quede saldo en pie el pedido
   * sigue `LISTO_PARA_RETIRO` con el MISMO código; cuando la última línea se
   * cubre pasa a `PINV_ORDER_RETIRADO`. La contabilidad es la de UC-25-03:
   * `MV_DISPENSE` por línea, `on_hand` y `reserved` bajan juntos (el stock
   * estaba reservado por este pedido) y la posición se recalcula.
   *
   * ## Cero doble dispensación
   *
   * Una línea sin saldo no puede volver a entregarse (422 sin efectos), y
   * repetir la `idempotencyKey` devuelve el pedido tal como quedó sin repetir
   * stock ni ledger — la misma clave que ya usa UC-25-03.
   */
  async dispense(
    id: string,
    dto: DispensePharmacyOrderDto,
    actor: AuthenticatedUser,
  ): Promise<PharmacyOrderDto> {
    const tenantId = requireTenantId();

    const outcome = await this.em.transactional(async (tx) => {
      const order = await this.loadTenantOrderForUpdate(tx, id, tenantId);

      // Idempotencia ANTES que el estado: el reintento de la entrega que dejó
      // el pedido RETIRADO tiene que devolverlo tal como quedó, no un 422.
      if (dto.idempotencyKey) {
        const existing = await this.dispensationsRepo.findByIdempotencyKey(
          tx,
          order.pharmacyId,
          dto.idempotencyKey,
        );
        if (existing?.inventoryReservationId === order.id) return undefined;
        if (existing) {
          throw new ConflictException(
            'La clave de idempotencia ya se usó para otra entrega',
            { orderId: id },
          );
        }
      }

      if (order.reservationStatusConceptId !== PINV.ORDER_LISTO_PARA_RETIRO) {
        throw new PreconditionFailedException(
          'Solo un pedido listo para retiro puede dispensarse',
          {
            orderId: id,
            from: moduleConcept(order.reservationStatusConceptId).code,
          },
        );
      }

      // La prueba de posesión, antes de tocar nada. Sin código sellado no hay
      // retiro posible — no debería ocurrir en un LISTO, pero si ocurre es un
      // 422 honesto, no un pase libre.
      const presented = dto.pickupCode.trim().toUpperCase();
      if (!order.pickupCode || presented !== order.pickupCode) {
        throw new PreconditionFailedException(
          'El código de retiro no coincide. El pedido no se modificó.',
          { orderId: id, reason: 'PICKUP_CODE_MISMATCH' },
        );
      }

      const lines = await this.ordersRepo.findLinesByReservationIds(tx, [
        order.id,
      ]);
      const pending = lines.filter(
        (line) =>
          line.statusConceptId === PINV.RES_LINE_CONFIRMED &&
          remainingOf(line) > 0,
      );

      let targets = pending;
      if (dto.productIds !== undefined) {
        const requested = new Set(dto.productIds);
        const pendingProducts = new Set(
          pending.map((line) => line.pharmacyProductId),
        );
        const notPending = [...requested].filter(
          (productId) => !pendingProducts.has(productId),
        );
        if (notPending.length > 0) {
          // Producto ajeno al pedido, ya entregado o sin stock en pie: no hay
          // nada que darle, y decirlo evita una entrega fantasma.
          throw new PreconditionFailedException(
            'La entrega refiere productos sin saldo en pie en este pedido',
            { orderId: id, productIds: notPending },
          );
        }
        targets = pending.filter((line) =>
          requested.has(line.pharmacyProductId),
        );
      }
      if (targets.length === 0) {
        throw new PreconditionFailedException(
          'El pedido no tiene saldo en pie que entregar',
          { orderId: id },
        );
      }

      const insuranceClaimId =
        await this.settlements.activeClaimForDispensation(tx, order.id);
      const dispensation = this.dispensationsRepo.create(tx, {
        insuranceClaimId,
        pharmacyId: order.pharmacyId,
        pharmacySiteId: order.pharmacySiteId,
        // Un pedido siempre nace con titular (claim `pid`); el fallback es
        // solo por el tipo opcional de la entidad compartida.
        patientProfileId: order.patientProfileId ?? '',
        medicationRequestId: order.medicationRequestId,
        inventoryReservationId: order.id,
        dispensationStatusConceptId: PINV.DISPENSE_DISPENSED,
        dispensedAt: new Date(),
        idempotencyKey: dto.idempotencyKey,
        actorUserId: actor.id,
      });
      await tx.flush();

      for (const line of targets) {
        const take = remainingOf(line);
        this.dispensationsRepo.createLine(tx, {
          medicationDispensationId: dispensation.id,
          pharmacyProductId: line.pharmacyProductId,
          inventoryLotId: line.inventoryLotId,
          dispensedQuantity: String(take),
          actorUserId: actor.id,
        });

        // El stock estaba reservado por ESTE pedido: `on_hand` y `reserved`
        // bajan juntos y el disponible no cambia para el resto del mundo.
        if (line.inventoryLocationId) {
          const sequence = await this.ledgerRepo.nextSequence(
            tx,
            order.pharmacyId,
          );
          this.ledgerRepo.append(tx, {
            pharmacyId: order.pharmacyId,
            pharmacySiteId: order.pharmacySiteId,
            inventoryLocationId: line.inventoryLocationId,
            pharmacyProductId: line.pharmacyProductId,
            inventoryLotId: line.inventoryLotId,
            ledgerSequence: sequence,
            movementTypeConceptId: PINV.MV_DISPENSE,
            quantityDelta: String(-take),
            reservationDelta: String(-take),
            sourceId: dispensation.id,
            recordedByUserId: actor.id,
          });
          const position = await this.stockRepo.findByKeyForUpdate(tx, {
            inventoryLocationId: line.inventoryLocationId,
            pharmacyProductId: line.pharmacyProductId,
            inventoryLotId: line.inventoryLotId,
          });
          if (position) {
            position.onHandQuantity = String(
              num(position.onHandQuantity) - take,
            );
            position.reservedQuantity = String(
              Math.max(0, num(position.reservedQuantity) - take),
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

        line.fulfilledQuantity = String(num(line.fulfilledQuantity) + take);
        line.statusConceptId = PINV.RES_LINE_FULFILLED;
        touch(line, actor.id);
      }

      const remainingLines = pending.filter(
        (line) => !targets.includes(line),
      ).length;
      const complete = remainingLines === 0;
      if (complete) {
        order.reservationStatusConceptId = PINV.ORDER_RETIRADO;
      }
      touch(order, actor.id);

      await this.publishStaffEvent(tx, tenantId, order, {
        eventType: 'PharmacyOrderDispensed',
        statusCode: complete
          ? 'PINV_ORDER_RETIRADO'
          : 'PINV_ORDER_LISTO_PARA_RETIRO',
        actor,
        extra: {
          dispensationId: dispensation.id,
          deliveredLineCount: targets.length,
          remainingLineCount: remainingLines,
          complete,
        },
      });
      await tx.flush();

      this.logger.info(
        {
          operation: 'pharmacy_inventory.order.dispense',
          orderId: order.id,
          dispensationId: dispensation.id,
          deliveredLines: targets.length,
          remainingLines,
          complete,
        },
        'Pharmacy order dispensed at the counter',
      );
      return { complete, medicationRequestId: order.medicationRequestId };
    });

    // El cierre del bucle (FAR-E3): con el pedido RETIRADO, quien recetó se
    // entera. Post-commit, como toda campana; sin receta no hay a quién.
    if (outcome?.complete && outcome.medicationRequestId) {
      const prescriberProfileId = await this.ordersRepo.findPrescriberProfileId(
        this.em.fork(),
        outcome.medicationRequestId,
      );
      if (prescriberProfileId) {
        await this.orderNotifications.dispensedToPrescriber(
          id,
          outcome.medicationRequestId,
          prescriberProfileId,
          actor.id,
        );
      }
    }

    return this.readOrderForTenant(id, tenantId);
  }

  /**
   * Las dos pruebas de que «listo para RETIRO» es verdad: la modalidad
   * declarada es retiro, y la sede puede atenderlo en mostrador. El esquema no
   * puede exigirlas (columnas nullable compartidas con el mostrador): son
   * reglas de servicio, y su ausencia responde 422 tipificado sin efectos.
   */
  private async assertPickupOrder(
    tx: EntityManager,
    order: InventoryReservations,
  ): Promise<void> {
    if (!order.deliveryModeConceptId) {
      throw new PreconditionFailedException(
        'El pedido no declara modalidad de entrega: no puede demostrarse que sea un retiro',
        { orderId: order.id, deliveryMode: null },
      );
    }
    if (order.deliveryModeConceptId !== PINV.DELIVERY_RETIRO) {
      throw new PreconditionFailedException(
        'El pedido es de envío: se cierra por el carril de envío, no por el mostrador',
        {
          orderId: order.id,
          deliveryMode: moduleConcept(order.deliveryModeConceptId).code,
        },
      );
    }
    const [site] = await this.ordersRepo.findSitesByIds(tx, [
      order.pharmacySiteId,
    ]);
    // Solo `true` habilita: una sede que no declaró la capacidad no puede
    // prometer un mostrador que quizá no tiene.
    if (site?.pickupAvailable !== true) {
      throw new PreconditionFailedException(
        'La sede no ofrece retiro en mostrador',
        { orderId: order.id, siteId: order.pharmacySiteId },
      );
    }
  }

  /** El código de modalidad del contrato, resuelto a concepto persistible. */
  private resolveDeliveryMode(
    deliveryMode: CreatePharmacyOrderDto['deliveryMode'],
  ): string | undefined {
    if (deliveryMode === undefined) return undefined;
    if (deliveryMode !== 'RETIRO') {
      throw new PreconditionFailedException(
        'El envío a domicilio o al trabajo llega con el carril de envío (FAR-E4); hoy solo RETIRO',
        { deliveryMode },
      );
    }
    return DELIVERY_MODE_ID_BY_CODE.get(deliveryMode);
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
    const expired = await this.em.transactional(async (tx) => {
      const due = await this.ordersRepo.findDueOrdersForUpdate(
        tx,
        ORDER_NON_TERMINAL_STATUS_IDS,
        new Date(),
        ids,
      );
      if (due.length === 0) {
        return [] as {
          orderId: string;
          patientProfileId?: string;
          medicationRequestId?: string;
        }[];
      }

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
      return due.map((order) => ({
        orderId: order.id,
        patientProfileId: order.patientProfileId,
        medicationRequestId: order.medicationRequestId,
      }));
    });

    // «Vence sin retiro → aviso» (FAR-E3), post-commit como toda campana: al
    // paciente, y **también al prescriptor** cuando hay receta — la regla del
    // bucle abierto («no retiró» es dato clínico). El `debounceKey` por
    // estado hace que el lazy y el worker no dupliquen ninguno de los dos.
    for (const notice of expired) {
      if (notice.patientProfileId) {
        await this.orderNotifications.orderExpired(
          notice.orderId,
          notice.patientProfileId,
          actor.id,
        );
      }
      if (notice.medicationRequestId) {
        const prescriberProfileId =
          await this.ordersRepo.findPrescriberProfileId(
            this.em.fork(),
            notice.medicationRequestId,
          );
        if (prescriberProfileId) {
          await this.orderNotifications.expiredToPrescriber(
            notice.orderId,
            notice.medicationRequestId,
            prescriberProfileId,
            actor.id,
          );
        }
      }
    }
    return { expiredCount: expired.length };
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
   * El pedido bajo lock, verificado contra tenant Y titularidad: la decisión
   * sobre las propuestas es del dueño. Inexistente, ajeno o de otro tenant:
   * el mismo 404 (el patrón de `cancel`).
   */
  private async loadOwnOrderForUpdate(
    tx: EntityManager,
    id: string,
    tenantId: string,
    patientProfileId: string,
  ): Promise<InventoryReservations> {
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
    return order;
  }

  /**
   * Las propuestas EN PIE del pedido, con la guarda de estado: la decisión
   * solo existe en `ACEPTACION_PENDIENTE`, y sin propuestas vivas no hay nada
   * que decidir — ambos casos responden 422 sin efectos.
   */
  private async pendingProposalsOf(
    tx: EntityManager,
    order: InventoryReservations,
  ): Promise<PharmacyOrderSubstitutions[]> {
    if (order.reservationStatusConceptId !== PINV.ORDER_ACEPTACION_PENDIENTE) {
      throw new PreconditionFailedException(
        'El pedido no tiene una decisión de sustituciones pendiente',
        {
          orderId: order.id,
          from: moduleConcept(order.reservationStatusConceptId).code,
        },
      );
    }
    const pending = (
      await this.substitutionsRepo.findByReservationIds(tx, [order.id])
    ).filter(
      (proposal) => proposal.statusConceptId === PINV.SUBSTITUTION_PROPUESTA,
    );
    if (pending.length === 0) {
      throw new PreconditionFailedException(
        'El pedido no tiene propuestas de sustitución en pie',
        { orderId: order.id },
      );
    }
    return pending;
  }

  /** Dos ajustes sobre el mismo renglón se contradicen: uno por producto. */
  private assertOneAdjustmentPerProduct(
    adjustments: readonly ConfirmOrderAdjustmentDto[],
  ): void {
    const seen = new Set<string>();
    const repeated = new Set<string>();
    for (const adjustment of adjustments) {
      if (seen.has(adjustment.productId)) repeated.add(adjustment.productId);
      seen.add(adjustment.productId);
    }
    if (repeated.size > 0) {
      throw new PreconditionFailedException(
        'Hay más de un ajuste para el mismo renglón',
        { productIds: [...repeated] },
      );
    }
  }

  /**
   * Persiste las propuestas de genérico de una confirmación (v4.2.1).
   *
   * El propuesto debe ser un producto activo de la MISMA farmacia, distinto
   * del original y del MISMO medicamento del vademécum — «genérico» acá es
   * exactamente eso, no un texto libre. Los precios de ambos se CONGELAN al
   * proponer con la regla del comparador: la oferta que el paciente va a
   * decidir no puede moverse debajo suyo. La fila ancla en la primera porción
   * del renglón — la identidad de negocio es `(pedido, producto original)`;
   * las porciones son contabilidad.
   */
  private async persistProposals(
    tx: EntityManager,
    order: InventoryReservations,
    proposals: readonly ConfirmOrderAdjustmentDto[],
    linesByProduct: ReadonlyMap<string, InventoryReservationLines[]>,
    actor: AuthenticatedUser,
  ): Promise<void> {
    const withoutProposed = proposals.filter(
      (proposal) => !proposal.proposedProductId,
    );
    if (withoutProposed.length > 0) {
      throw new PreconditionFailedException(
        'PROPONER_GENERICO exige el producto propuesto (proposedProductId)',
        {
          orderId: order.id,
          productIds: withoutProposed.map((proposal) => proposal.productId),
        },
      );
    }

    const originalIds = proposals.map((proposal) => proposal.productId);
    const proposedIds = proposals.map(
      (proposal) => proposal.proposedProductId as string,
    );
    const products = await this.ordersRepo.findProductsByIds(tx, [
      ...new Set([...originalIds, ...proposedIds]),
    ]);
    const productById = new Map(
      products.map((product) => [product.id, product]),
    );

    const frozen = await this.freezePricesFor(
      tx,
      order.pharmacyId,
      order.pharmacySiteId,
      [...new Set([...originalIds, ...proposedIds])],
    );

    for (const proposal of proposals) {
      const proposedId = proposal.proposedProductId as string;
      const original = productById.get(proposal.productId);
      const proposed = productById.get(proposedId);
      if (
        !proposed ||
        proposed.pharmacyId !== order.pharmacyId ||
        proposedId === proposal.productId
      ) {
        throw new PreconditionFailedException(
          'El producto propuesto no está disponible en esta farmacia',
          { orderId: order.id, proposedProductId: proposedId },
        );
      }
      // Mismo medicamento del vademécum, y conocido en ambos: sin concepto no
      // puede demostrarse la equivalencia, y una sustitución indemostrable no
      // se propone.
      if (
        !original?.medicationConceptId ||
        original.medicationConceptId !== proposed.medicationConceptId
      ) {
        throw new PreconditionFailedException(
          'El producto propuesto no es del mismo medicamento que el original',
          {
            orderId: order.id,
            productId: proposal.productId,
            proposedProductId: proposedId,
          },
        );
      }

      const portions = linesByProduct.get(proposal.productId);
      if (!portions || portions.length === 0) {
        throw new PreconditionFailedException(
          'El ajuste refiere un producto que no está en el pedido',
          { orderId: order.id, productId: proposal.productId },
        );
      }
      const anchor = portions[0];
      const proposedPrice = frozen.get(proposedId);
      this.substitutionsRepo.create(tx, {
        inventoryReservationId: order.id,
        inventoryReservationLineId: anchor.id,
        originalPharmacyProductId: proposal.productId,
        proposedPharmacyProductId: proposedId,
        // El original congelado al crear el pedido manda; si aquel pedido es
        // anterior al congelamiento, se congela recién ahora.
        originalUnitPriceAmount:
          anchor.unitPriceAmount ??
          frozen.get(proposal.productId)?.unitPriceAmount,
        proposedUnitPriceAmount: proposedPrice?.unitPriceAmount,
        currencyConceptId:
          proposedPrice?.currencyConceptId ?? anchor.currencyConceptId,
        statusConceptId: PINV.SUBSTITUTION_PROPUESTA,
        actorUserId: actor.id,
      });
    }
  }

  /**
   * Los precios a CONGELAR de un conjunto de productos en una sede: el
   * ganador del comparador (lista de la sede sobre la general; a igualdad, el
   * más barato), como «lo que paga el paciente» + la moneda **copiada** de la
   * lista — el módulo arrastra cuatro juegos de conceptos de moneda sin
   * unificar y la lectura los compara por `code`: acuñar uno propio haría que
   * el total congelado y el recalculado no se reconocieran.
   */
  private async freezePricesFor(
    tx: EntityManager,
    pharmacyId: string,
    siteId: string,
    productIds: readonly string[],
  ): Promise<ReadonlyMap<string, FrozenPrice>> {
    const now = new Date();
    const priceLists = (
      await this.pharmacyRepo.findCurrentPublicPriceLists(tx, [pharmacyId], now)
    ).filter(isRetailList);
    const prices = await this.pharmacyRepo.findCurrentPrices(
      tx,
      priceLists.map((list) => list.id),
      productIds,
      now,
    );
    const listById = new Map(priceLists.map((list) => [list.id, list]));

    const frozen = new Map<string, FrozenPrice>();
    for (const productId of productIds) {
      const winner = winningPriceFor(productId, siteId, prices, listById);
      if (winner) {
        frozen.set(productId, {
          unitPriceAmount: payableAmount(winner.price),
          currencyConceptId: winner.list.currencyConceptId,
        });
      }
    }
    return frozen;
  }

  /**
   * RE-congela el total de cabecera desde las líneas en pie (CONFIRMED):
   * Σ (precio congelado × reservado). Si a alguna le falta precio o las
   * monedas difieren, el total es NULL — una suma con huecos o que mezcla
   * monedas afirma un costo que nadie publicó. Nunca se recalcula en un GET.
   */
  private sealFrozenTotal(
    order: InventoryReservations,
    lines: readonly InventoryReservationLines[],
  ): void {
    const alive = lines.filter(
      (line) => line.statusConceptId === PINV.RES_LINE_CONFIRMED,
    );
    const priceable =
      alive.length > 0 &&
      alive.every(
        (line) =>
          line.unitPriceAmount !== undefined &&
          line.unitPriceAmount !== null &&
          line.currencyConceptId,
      );
    const currencies = new Set(alive.map((line) => line.currencyConceptId));
    if (!priceable || currencies.size > 1) {
      order.totalAmount = undefined;
      order.currencyConceptId = undefined;
      return;
    }
    order.totalAmount = sumAmounts(
      alive.map((line) =>
        multiplyAmounts(line.unitPriceAmount as string, line.reservedQuantity),
      ),
    );
    order.currencyConceptId = alive[0].currencyConceptId;
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
    frozenPrices: ReadonlyMap<string, FrozenPrice>,
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
      const reserved = await this.reserveLineStock(
        tx,
        reservation,
        candidates,
        line.productId,
        line.quantity,
        actor,
        frozenPrices.get(line.productId),
      );
      if (!reserved) outOfStock += 1;
    }
    await tx.flush();
    return outOfStock;
  }

  /**
   * Reserva UN renglón con la contabilidad de UC-25-04, variante parcial: se
   * cubre entero o queda `SIN_STOCK` (dicho, sin asientos). La comparten la
   * creación del pedido y la aceptación de un genérico — dos entradas, UNA
   * contabilidad. El precio congelado del renglón viaja a cada porción.
   *
   * @returns `true` si el renglón quedó reservado entero.
   */
  private async reserveLineStock(
    tx: EntityManager,
    reservation: InventoryReservations,
    candidates: readonly InventoryStockPositions[],
    productId: string,
    quantity: number,
    actor: AuthenticatedUser,
    frozen?: FrozenPrice,
  ): Promise<boolean> {
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
    const portions: { position: InventoryStockPositions; take: number }[] = [];
    let remaining = quantity;
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
        pharmacyProductId: productId,
        requestedQuantity: String(quantity),
        reservedQuantity: '0',
        statusConceptId: PINV.RES_LINE_OUT_OF_STOCK,
        unitPriceAmount: frozen?.unitPriceAmount,
        currencyConceptId: frozen?.currencyConceptId,
        actorUserId: actor.id,
      });
      return false;
    }

    // Fase 3: escribir porciones con la contabilidad de UC-25-04.
    for (const { position, take } of portions) {
      this.reservationsRepo.createLine(tx, {
        inventoryReservationId: reservation.id,
        pharmacyProductId: productId,
        inventoryLotId: position.inventoryLotId,
        inventoryLocationId: position.inventoryLocationId,
        requestedQuantity: String(take),
        reservedQuantity: String(take),
        statusConceptId: PINV.RES_LINE_CONFIRMED,
        unitPriceAmount: frozen?.unitPriceAmount,
        currencyConceptId: frozen?.currencyConceptId,
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
        pharmacyProductId: productId,
        inventoryLotId: position.inventoryLotId,
        ledgerSequence: sequence,
        movementTypeConceptId: PINV.MV_RESERVE,
        quantityDelta: '0',
        reservationDelta: String(take),
        sourceId: reservation.id,
        recordedByUserId: actor.id,
      });
      position.reservedQuantity = String(num(position.reservedQuantity) + take);
      position.availableQuantity = recompute(
        position.onHandQuantity,
        position.reservedQuantity,
        position.quarantineQuantity,
      );
      position.lastLedgerSequence = sequence;
      position.updatedAt = new Date();
    }
    return true;
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
    const [dto] = await this.composeOrders(em, tenantId, [order], 'owner');
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
    viewer: OrderViewer = 'staff',
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
    // La historia de sustituciones viaja con el pedido; sus productos entran
    // al mismo lote de nombres.
    const substitutions = await this.substitutionsRepo.findByReservationIds(
      em,
      orders.map((order) => order.id),
    );
    const products = await this.ordersRepo.findProductsByIds(em, [
      ...new Set([
        ...lines.map((line) => line.pharmacyProductId),
        ...substitutions.flatMap((substitution) => [
          substitution.originalPharmacyProductId,
          substitution.proposedPharmacyProductId,
        ]),
      ]),
    ]);
    // Un solo lote de terminología: medicamentos del vademécum + las monedas
    // congeladas (líneas, cabeceras y ofertas) — son conceptos globales, no
    // del módulo, así que se resuelven contra la base.
    const concepts = await this.ordersRepo.findConceptsByIds(em, [
      ...new Set(
        [
          ...products.map((product) => product.medicationConceptId),
          ...lines.map((line) => line.currencyConceptId),
          ...orders.map((order) => order.currencyConceptId),
          ...substitutions.map(
            (substitution) => substitution.currencyConceptId,
          ),
        ].filter((id): id is string => Boolean(id)),
      ),
    ]);

    const linesByOrder = new Map<string, InventoryReservationLines[]>();
    for (const line of lines) {
      const list = linesByOrder.get(line.inventoryReservationId) ?? [];
      list.push(line);
      linesByOrder.set(line.inventoryReservationId, list);
    }
    const substitutionsByOrder = new Map<
      string,
      PharmacyOrderSubstitutions[]
    >();
    for (const substitution of substitutions) {
      const list =
        substitutionsByOrder.get(substitution.inventoryReservationId) ?? [];
      list.push(substitution);
      substitutionsByOrder.set(substitution.inventoryReservationId, list);
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
          substitutionsByOrder.get(order.id) ?? [],
          productById,
          conceptById,
          order.patientProfileId
            ? (patientNames.get(order.patientProfileId) ?? null)
            : null,
          viewer,
        ),
      );
    }
    return items;
  }
}

/** Saldo por retirar de una línea: lo reservado menos lo ya entregado. */
function remainingOf(line: InventoryReservationLines): number {
  return num(line.reservedQuantity) - num(line.fulfilledQuantity);
}

/**
 * Un código de retiro nuevo: 6 símbolos del alfabeto sin ambiguos, con
 * aleatoriedad criptográfica. Ya sale normalizado (mayúsculas): lo que se
 * guarda y lo que se compara comparten forma.
 */
function generatePickupCode(): string {
  let code = '';
  for (let i = 0; i < PICKUP_CODE_LENGTH; i += 1) {
    code += PICKUP_CODE_ALPHABET[randomInt(PICKUP_CODE_ALPHABET.length)];
  }
  return code;
}

/**
 * ¿El flush murió por el único parcial del código de retiro? Solo esa
 * violación se reintenta con un código nuevo; cualquier otra unicidad
 * (idempotencia, por ejemplo) es un error real y sube tal cual. El nombre de
 * la constraint se busca en la cadena de causas, como hace el filtro global,
 * y se compara contra {@link PICKUP_CODE_UNIQUE_INDEX} y NADA más — el spec
 * que lo ata al catálogo ORM es lo que impide que un rename futuro deje el
 * reintento muerto en silencio.
 */
function isPickupCodeCollision(error: unknown): boolean {
  if (!(error instanceof UniqueConstraintViolationException)) return false;
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current; depth += 1) {
    const candidate = current as {
      /** Nombre de la constraint, si el driver lo trae. */
      constraint?: unknown;
      /** Mensaje del eslabón. */
      message?: unknown;
      /** Causa envuelta (Error.cause). */
      cause?: unknown;
      /** Causa envuelta (convención del driver). */
      previous?: unknown;
    };
    if (candidate.constraint === PICKUP_CODE_UNIQUE_INDEX) {
      return true;
    }
    if (
      typeof candidate.message === 'string' &&
      candidate.message.includes(PICKUP_CODE_UNIQUE_INDEX)
    ) {
      return true;
    }
    current = candidate.cause ?? candidate.previous;
  }
  return false;
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
  substitutions: readonly PharmacyOrderSubstitutions[],
  productById: ReadonlyMap<string, PharmacyProducts>,
  conceptById: ReadonlyMap<string, CatalogConcepts>,
  patientName: string | null,
  viewer: OrderViewer,
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
        medicationConceptId: product?.medicationConceptId ?? null,
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
        fulfilledQuantity: portions.reduce(
          (sum, portion) => sum + num(portion.fulfilledQuantity),
          0,
        ),
        // El precio congelado del renglón: las porciones comparten valor.
        unitPriceAmount: portions[0].unitPriceAmount ?? null,
        currency: optionalConcept(conceptById, portions[0].currencyConceptId),
        status: moduleConcept(portions[0].statusConceptId),
      };
    })
    .sort((a, b) =>
      (a.genericName ?? a.productCode).localeCompare(
        b.genericName ?? b.productCode,
      ),
    );

  return {
    ...unavailableSettlement(),
    reservationLines: [...lines]
      .filter((line) =>
        [PINV.RES_LINE_CONFIRMED, PINV.RES_LINE_FULFILLED].includes(
          line.statusConceptId,
        ),
      )
      .sort((a, b) => (a.id > b.id ? 1 : a.id < b.id ? -1 : 0))
      .map((line) => ({
        id: line.id,
        productId: line.pharmacyProductId,
        quantity: line.reservedQuantity,
        unitPriceAmount: line.unitPriceAmount ?? null,
        billedAmount:
          line.unitPriceAmount == null
            ? null
            : multiplyAmounts(line.unitPriceAmount, line.reservedQuantity),
        currencyConceptId: line.currencyConceptId ?? null,
      })),
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
    deliveryMode: order.deliveryModeConceptId
      ? moduleConcept(order.deliveryModeConceptId)
      : null,
    // La prueba de posesión es del titular: el staff la sirve null siempre.
    pickupCode: viewer === 'owner' ? (order.pickupCode ?? null) : null,
    totalAmount: order.totalAmount ?? null,
    currency: optionalConcept(conceptById, order.currencyConceptId),
    rejectionReasonText: order.rejectionReasonText ?? null,
    substitutions: substitutions.map((substitution) =>
      toSubstitutionDto(substitution, productById, conceptById),
    ),
    lines: lineDtos,
  };
}

/** El nombre con que un producto se pinta: marca, o genérico, o el código. */
function productName(product: PharmacyProducts | undefined): string {
  return (
    product?.brandName ?? product?.genericName ?? product?.productCode ?? ''
  );
}

/** Una propuesta de sustitución, en palabras. */
function toSubstitutionDto(
  substitution: PharmacyOrderSubstitutions,
  productById: ReadonlyMap<string, PharmacyProducts>,
  conceptById: ReadonlyMap<string, CatalogConcepts>,
): PharmacyOrderSubstitutionDto {
  return {
    id: substitution.id,
    originalProductId: substitution.originalPharmacyProductId,
    originalName: productName(
      productById.get(substitution.originalPharmacyProductId),
    ),
    originalUnitPriceAmount: substitution.originalUnitPriceAmount ?? null,
    proposedProductId: substitution.proposedPharmacyProductId,
    proposedName: productName(
      productById.get(substitution.proposedPharmacyProductId),
    ),
    proposedUnitPriceAmount: substitution.proposedUnitPriceAmount ?? null,
    currency: optionalConcept(conceptById, substitution.currencyConceptId),
    status: moduleConcept(substitution.statusConceptId),
    decidedAt: substitution.decidedAt?.toISOString() ?? null,
  };
}
