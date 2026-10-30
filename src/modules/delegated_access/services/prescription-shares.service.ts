import { isIP } from 'node:net';
import {
  BadRequestException,
  ForbiddenException,
  GoneException,
  Injectable,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ErrorCode,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import type { MedicationRequests } from '../../clinical/entities';
import { PrescriberIdentityReader } from '../../clinical/services/prescriber-identity.reader';
import type { PrescriberLicense } from '../../clinical/services/prescription-pdf.service';
import { loadAgendaNoticesEnv } from '../../scheduling/infrastructure/config/agenda-notices.env';
import { DELEG } from '../delegated_access.concepts';
import { DelegatedAccessErrorReason } from '../delegated_access.error-reasons';
import type { SharedAccessLinks } from '../entities';
import { SharedAccessLinksRepository } from '../repositories/shared-access-links.repository';
import type {
  CreatePrescriptionShareDto,
  PrescriptionShareCreatedDto,
  PrescriptionShareOwnershipDto,
  PrescriptionShareResourceType,
  PrescriptionShareSummaryDto,
  PublicPrescriptionShareDto,
} from '../dto/prescription-shares.dto';
import {
  hashShareToken,
  isWellFormedShareToken,
  issueShareToken,
} from './prescription-share-token';
import {
  effectiveShareStatus,
  shareExpiresAt,
  type PrescriptionShareStatus,
} from './prescription-share-expiry';
import {
  activeItemsOf,
  earliestDate,
  itemsOfLink,
  resourceIdsOf,
  sharesEncounter,
  shareResourceTypeOf,
} from './prescription-share-items';

/** Largo máximo del agente de usuario que se guarda en un uso. */
const USER_AGENT_MAX_LENGTH = 512;

/** Origen de un uso del enlace, para `shared_access_link_uses`. */
export interface PrescriptionShareUseContext {
  /** IP del cliente; si no es una IP válida, se guarda `null`. */
  readonly sourceIp?: string | null;
  /** Agente de usuario; se recorta a 512 caracteres. */
  readonly userAgent?: string | null;
}

/** Quién emitió la receta compartida. */
export interface PrescriptionSharePrescriber {
  /** Perfil profesional del prescriptor, o `null` si la receta no lo tiene. */
  readonly practitionerProfileId: string | null;
  /** Nombre visible, o `null` si no se encuentra. */
  readonly name: string | null;
  /** Matrícula nacional, o `null` si no declaró. */
  readonly license: PrescriberLicense | null;
}

/**
 * Lo que `openForPharmacy` le entrega a la pantalla de la farmacia (FAR-02).
 * Trae los ítems vigentes enteros: la proyección y el enmascarado del paciente
 * (S-4) los decide quien arma la respuesta HTTP.
 */
export interface PharmacyPrescriptionShare {
  readonly shareId: string;
  /** Tenant custodio de la receta (`shared_access_links.tenant_id`). */
  readonly tenantId: string;
  readonly patientProfileId: string;
  readonly resourceType: PrescriptionShareResourceType;
  readonly resourceId: string;
  /** Emisión más antigua de los ítems vigentes. */
  readonly issuedAt: Date | null;
  /** `valid_to` más próximo de los ítems vigentes, o `null` si no tienen. */
  readonly validTo: Date | null;
  /** Vencimiento del enlace. */
  readonly expiresAt: Date;
  readonly prescriber: PrescriptionSharePrescriber;
  /** Ítems emitidos y vigentes (regla única de `prescription-validity.ts`). */
  readonly items: readonly MedicationRequests[];
}

/** Un enlace con los ítems que comparte, ya clasificados. */
interface ResolvedShare {
  readonly link: SharedAccessLinks;
  readonly activeItems: MedicationRequests[];
  readonly allItems: MedicationRequests[];
  readonly status: PrescriptionShareStatus;
}

/**
 * Enlace compartido de una receta (FAR-01): el paciente, o la médica que la
 * emitió, genera un enlace con token; sin sesión ese enlace solo confirma que
 * la receta es válida, y una farmacia lo abre para dispensar (FAR-02).
 *
 * Principio rector: la receta es del paciente. Nadie la ve sin su enlace, el
 * enlace se puede revocar, y cada apertura de una farmacia queda registrada.
 * El token en claro no se persiste ni se loguea (S-6).
 */
@Injectable()
export class PrescriptionSharesService {
  /**
   * @param em - Contexto de persistencia.
   * @param links - Enlaces, usos e ítems de receta.
   * @param prescriberIdentity - Nombre y matrícula del prescriptor.
   * @param logger - Logger del servicio (solo ids, nunca el token).
   */
  constructor(
    private readonly em: EntityManager,
    private readonly links: SharedAccessLinksRepository,
    private readonly prescriberIdentity: PrescriberIdentityReader,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PrescriptionSharesService.name);
  }

  /**
   * Crea el enlace de una receta (`POST /clinical/prescription-shares`).
   *
   * @param dto - Exactamente uno de `encounterId` o `medicationRequestId`.
   * @param actor - Paciente dueño o médica que emitió la receta.
   * @returns El enlace con el token en claro (única vez que sale).
   * @throws BadRequestException 400 si no viene exactamente uno de los ids.
   * @throws ResourceNotFoundException 404 si la receta no existe o es de otro
   *   paciente (mismo cuerpo).
   * @throws ForbiddenException 403 si es una médica que no la emitió.
   * @throws PreconditionFailedException 422 si no tiene ítems vigentes.
   */
  async create(
    dto: CreatePrescriptionShareDto,
    actor: AuthenticatedUser,
  ): Promise<PrescriptionShareCreatedDto> {
    const target = this.targetOf(dto);
    const now = new Date();
    return this.em.transactional(async (tx) => {
      const items =
        target.resourceTypeConceptId ===
        DELEG.SHARE_RESOURCE_PRESCRIPTION_ENCOUNTER
          ? await this.links.findItemsByEncounter(tx, target.resourceId)
          : await this.single(tx, target.resourceId);
      if (items.length === 0) throw this.prescriptionNotFound();

      const patientProfileId = items[0].patientProfileId;
      const activeItems = activeItemsOf(items, now);
      this.assertCanShare(actor, patientProfileId, activeItems, items);
      if (activeItems.length === 0) {
        const reason =
          DelegatedAccessErrorReason.PRESCRIPTION_SHARE_NO_ACTIVE_ITEMS;
        throw new PreconditionFailedException(
          'La receta no tiene medicamentos emitidos y vigentes para compartir.',
          { reason },
          reason,
        );
      }

      const { token, tokenHash } = issueShareToken();
      const expiresAt = shareExpiresAt(activeItems, now);
      const link = this.links.create(tx, {
        tenantId: activeItems[0].custodianTenantId,
        patientProfileId,
        resourceTypeConceptId: target.resourceTypeConceptId,
        resourceId: target.resourceId,
        tokenHash,
        scopeConceptId: DELEG.SHARE_SCOPE_PHARMACY_DISPENSE,
        expiresAt,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();
      this.logger.info(
        {
          operation: 'delegated_access.prescription_share.create',
          shareId: link.id,
          actorId: actor.id,
        },
        'Prescription share created',
      );
      const { webAppBaseUrl } = loadAgendaNoticesEnv();
      return {
        shareId: link.id,
        url: `${webAppBaseUrl}/rx/${token}`,
        token,
        expiresAt,
        itemCount: activeItems.length,
      };
    });
  }

  /**
   * Enlaces de un paciente (`GET /clinical/prescription-shares`), sin token.
   *
   * @param patientProfileId - Paciente pedido.
   * @param actor - El paciente mismo (ve todos) o una médica (ve los que creó).
   * @returns Los enlaces con su estado y sus aperturas `OPENED`.
   * @throws ResourceNotFoundException 404 si es otro paciente.
   */
  async listForPatient(
    patientProfileId: string,
    actor: AuthenticatedUser,
  ): Promise<PrescriptionShareSummaryDto[]> {
    const isOwner = actor.patientProfileId === patientProfileId;
    if (!isOwner && !actor.practitionerProfileId) {
      throw new ResourceNotFoundException('Paciente no encontrado');
    }
    const em = this.em.fork();
    const rows = await this.links.findByPatient(
      em,
      patientProfileId,
      isOwner ? undefined : actor.id,
    );
    if (rows.length === 0) return [];

    const now = new Date();
    const [items, uses] = await Promise.all([
      this.links.findItemsForResources(
        em,
        resourceIdsOf(rows, DELEG.SHARE_RESOURCE_PRESCRIPTION_ENCOUNTER),
        resourceIdsOf(rows, DELEG.SHARE_RESOURCE_MEDICATION_REQUEST),
      ),
      this.links.countOpenedByLinkIds(
        em,
        rows.map((row) => row.id),
      ),
    ]);
    return rows.map((row) => {
      const activeCount = activeItemsOf(itemsOfLink(row, items), now).length;
      return {
        shareId: row.id,
        resourceType: shareResourceTypeOf(row),
        resourceId: row.resourceId,
        createdAt: row.createdAt,
        expiresAt: row.expiresAt,
        status: effectiveShareStatus(row, activeCount, now),
        uses: uses.get(row.id) ?? 0,
      };
    });
  }

  /**
   * Revoca un enlace (`POST /clinical/prescription-shares/:shareId/revoke`).
   * Revocar uno ya revocado no cambia nada.
   *
   * @param shareId - Enlace.
   * @param actor - Paciente dueño o quien lo creó.
   * @throws ResourceNotFoundException 404 si no existe o es de otro.
   */
  async revoke(shareId: string, actor: AuthenticatedUser): Promise<void> {
    await this.em.transactional(async (tx) => {
      const link = await this.links.findById(tx, shareId);
      if (!link || !this.ownsOrCreated(link, actor)) {
        throw this.shareNotFound();
      }
      if (link.revokedAt || link.statusConceptId === CONCEPTS.STATE_REVOKED) {
        return;
      }
      const now = new Date();
      link.revokedAt = now;
      link.revokedByUserId = actor.id;
      link.statusConceptId = CONCEPTS.STATE_REVOKED;
      link.updatedAt = now;
      link.updatedByUserId = actor.id;
      await tx.flush();
      this.logger.info(
        {
          operation: 'delegated_access.prescription_share.revoke',
          shareId: link.id,
          actorId: actor.id,
        },
        'Prescription share revoked',
      );
    });
  }

  /**
   * Si el enlace es de quien lo abre (`GET …/by-token/:token`, D-1). No
   * registra uso.
   *
   * @param token - Token en claro de la ruta.
   * @param actor - Sesión que abre `/rx/:token`.
   * @returns El enlace, solo si es del paciente dueño o de quien lo creó.
   * @throws ResourceNotFoundException 404 en cualquier otro caso.
   */
  async resolveOwnership(
    token: string,
    actor: AuthenticatedUser,
  ): Promise<PrescriptionShareOwnershipDto> {
    const link = await this.findByToken(this.em.fork(), token);
    if (!link || !this.ownsOrCreated(link, actor)) {
      throw this.shareNotFound();
    }
    return {
      shareId: link.id,
      resourceType: shareResourceTypeOf(link),
      resourceId: link.resourceId,
    };
  }

  /**
   * Vista sin sesión (`GET /public/prescription-shares/:token`, S-4, D-2):
   * estado, cuándo y quién la emitió. Nada del paciente ni de los fármacos.
   * Un enlace revocado solo dice `REVOKED`.
   *
   * Cada apertura deja un uso `OPEN` en `shared_access_link_uses` (S-4), como
   * la de la farmacia: `DENIED` si el enlace venció o fue revocado (la vista
   * igual responde con su `status`), escrito antes de armar la respuesta;
   * `OPENED` si es válido, escrito al final, cuando la respuesta ya está
   * armada. Falla cerrada: si el uso no se puede escribir, la lectura no se
   * sirve (500), porque toda lectura deja rastro auditable
   * (`.agents/rules/90-seguridad-y-datos-sensibles.md`, regla 7). Un token
   * desconocido o mal formado responde 404 y no deja uso.
   *
   * @param token - Token en claro de la ruta.
   * @param context - IP y agente del cliente.
   * @returns La vista pública del enlace.
   * @throws ResourceNotFoundException 404 si el token no existe.
   */
  async readPublic(
    token: string,
    context: PrescriptionShareUseContext = {},
  ): Promise<PublicPrescriptionShareDto> {
    const em = this.em.fork();
    const now = new Date();
    const resolved = await this.resolve(em, token, now);
    if (!resolved) throw this.shareNotFound();
    if (resolved.status !== 'VALID') {
      await this.recordUse(
        resolved.link.id,
        DELEG.SHARE_OUTCOME_DENIED,
        context,
        now,
      );
    }
    if (resolved.status === 'REVOKED') {
      // El paciente dejó de compartirla: el enlace ya no muestra nada de la
      // receta, solo que fue revocado.
      return {
        status: 'REVOKED',
        issuedAt: null,
        prescriberName: null,
        prescriberLicense: null,
        itemCount: 0,
      };
    }
    const shown =
      resolved.activeItems.length > 0
        ? resolved.activeItems
        : resolved.allItems;
    const prescriber = await this.prescriberOf(em, shown);
    const view: PublicPrescriptionShareDto = {
      status: resolved.status,
      issuedAt: earliestDate(shown.map((item) => item.issuedAt)),
      prescriberName: prescriber.name,
      prescriberLicense: prescriber.license,
      itemCount: resolved.activeItems.length,
    };
    if (resolved.status === 'VALID') {
      await this.recordUse(
        resolved.link.id,
        DELEG.SHARE_OUTCOME_OPENED,
        context,
        now,
      );
    }
    return view;
  }

  /**
   * Abre el enlace para una farmacia (lo llama el endpoint de FAR-02). Cada
   * apertura deja un uso `OPEN`: `OPENED` si el enlace es válido, `DENIED` si
   * venció o fue revocado. El `DENIED` se confirma en su propia transacción
   * **antes** de lanzar el 410, así queda escrito aunque la respuesta sea un
   * error. Un token desconocido no deja uso: no hay enlace al que atarlo.
   *
   * Qué farmacia lo abrió no va acá (`shared_access_link_uses` no tiene
   * actor): va en el registro de acceso del endpoint que llama.
   *
   * Con `prepare`, quien llama arma su respuesta antes de que se escriba el
   * `OPENED` y se devuelve lo suyo: si falla, no queda una apertura (FAR-02).
   *
   * @param token - Token en claro de la ruta.
   * @param context - IP y agente del cliente.
   * @param prepare - Opcional; sin él se devuelve el enlace resuelto.
   * @returns El enlace, el prescriptor y los ítems vigentes, o lo de `prepare`.
   * @throws ResourceNotFoundException 404 si el token no existe.
   * @throws GoneException 410 con `reason` `PRESCRIPTION_SHARE_EXPIRED` o
   *   `PRESCRIPTION_SHARE_REVOKED`.
   */
  async openForPharmacy<T = PharmacyPrescriptionShare>(
    token: string,
    context: PrescriptionShareUseContext = {},
    prepare: (share: PharmacyPrescriptionShare) => Promise<T> = (share) =>
      Promise.resolve(share as T),
  ): Promise<T> {
    const em = this.em.fork();
    const now = new Date();
    const resolved = await this.resolve(em, token, now);
    if (!resolved) throw this.shareNotFound();

    if (resolved.status !== 'VALID') {
      await this.recordUse(
        resolved.link.id,
        DELEG.SHARE_OUTCOME_DENIED,
        context,
        now,
      );
      throw this.gone(resolved.status);
    }
    // El `OPENED` va al final: si el prescriptor o `prepare` fallan, no queda
    // una apertura que no ocurrió.
    const prescriber = await this.prescriberOf(em, resolved.activeItems);
    const share: PharmacyPrescriptionShare = {
      shareId: resolved.link.id,
      tenantId: resolved.link.tenantId,
      patientProfileId: resolved.link.patientProfileId,
      resourceType: shareResourceTypeOf(resolved.link),
      resourceId: resolved.link.resourceId,
      issuedAt: earliestDate(resolved.activeItems.map((item) => item.issuedAt)),
      validTo: earliestDate(resolved.activeItems.map((item) => item.validTo)),
      expiresAt: resolved.link.expiresAt,
      prescriber,
      items: resolved.activeItems,
    };
    const result = await prepare(share);
    await this.recordUse(
      resolved.link.id,
      DELEG.SHARE_OUTCOME_OPENED,
      context,
      now,
    );
    return result;
  }

  // --- Internos ---------------------------------------------------------

  /** Exactamente uno de los dos ids del cuerpo. */
  private targetOf(dto: CreatePrescriptionShareDto): {
    resourceTypeConceptId: string;
    resourceId: string;
  } {
    const hasEncounter = Boolean(dto.encounterId);
    const hasItem = Boolean(dto.medicationRequestId);
    if (hasEncounter === hasItem) {
      const reason =
        DelegatedAccessErrorReason.PRESCRIPTION_SHARE_TARGET_INVALID;
      throw new BadRequestException({
        code: ErrorCode.VALIDATION_FAILED,
        message:
          'Indicá la consulta o el medicamento que querés compartir, uno de los dos.',
        reason,
        details: { reason },
      });
    }
    return hasEncounter
      ? {
          resourceTypeConceptId: DELEG.SHARE_RESOURCE_PRESCRIPTION_ENCOUNTER,
          resourceId: dto.encounterId as string,
        }
      : {
          resourceTypeConceptId: DELEG.SHARE_RESOURCE_MEDICATION_REQUEST,
          resourceId: dto.medicationRequestId as string,
        };
  }

  /**
   * El paciente dueño comparte siempre; una médica, solo si emitió todos los
   * ítems vigentes (o, si no queda ninguno, todos los de la receta, para que
   * el 422 no se le muestre a quien no la emitió). Otro paciente: 404, igual
   * que una receta inexistente. Otra médica: 403.
   */
  private assertCanShare(
    actor: AuthenticatedUser,
    patientProfileId: string,
    activeItems: readonly MedicationRequests[],
    allItems: readonly MedicationRequests[],
  ): void {
    if (actor.patientProfileId === patientProfileId) return;
    const practitionerProfileId = actor.practitionerProfileId;
    if (!practitionerProfileId) throw this.prescriptionNotFound();
    const considered = activeItems.length > 0 ? activeItems : allItems;
    const issuedAll = considered.every(
      (item) => item.prescriberProfileId === practitionerProfileId,
    );
    if (!issuedAll) {
      throw new ForbiddenException({
        code: ErrorCode.FORBIDDEN,
        message:
          'Solo el paciente o quien emitió la receta pueden compartirla.',
      });
    }
  }

  private async single(
    em: EntityManager,
    medicationRequestId: string,
  ): Promise<MedicationRequests[]> {
    const item = await this.links.findItemById(em, medicationRequestId);
    return item ? [item] : [];
  }

  private async findByToken(
    em: EntityManager,
    token: string,
  ): Promise<SharedAccessLinks | null> {
    if (!isWellFormedShareToken(token)) return null;
    return this.links.findByTokenHash(em, hashShareToken(token));
  }

  /** El enlace del token con sus ítems y su estado efectivo. */
  private async resolve(
    em: EntityManager,
    token: string,
    now: Date = new Date(),
  ): Promise<ResolvedShare | null> {
    const link = await this.findByToken(em, token);
    if (!link) return null;
    const allItems = sharesEncounter(link)
      ? await this.links.findItemsByEncounter(em, link.resourceId)
      : await this.single(em, link.resourceId);
    // Los ítems tienen que ser del mismo paciente del enlace: si no, no se
    // muestran (defensa ante un `resource_id` que no corresponde).
    const ownItems = allItems.filter(
      (item) => item.patientProfileId === link.patientProfileId,
    );
    const activeItems = activeItemsOf(ownItems, now);
    return {
      link,
      activeItems,
      allItems: ownItems,
      status: effectiveShareStatus(link, activeItems.length, now),
    };
  }

  /** Escribe un uso `OPEN` y lo confirma en una transacción propia. */
  private async recordUse(
    linkId: string,
    outcomeConceptId: string,
    context: PrescriptionShareUseContext,
    now: Date,
  ): Promise<void> {
    const sourceIp =
      context.sourceIp && isIP(context.sourceIp) !== 0
        ? context.sourceIp
        : undefined;
    const userAgent = context.userAgent
      ? context.userAgent.slice(0, USER_AGENT_MAX_LENGTH)
      : undefined;
    await this.em.fork().transactional(async (tx) => {
      this.links.appendUse(tx, {
        sharedAccessLinkId: linkId,
        actionConceptId: DELEG.SHARE_ACTION_OPEN,
        outcomeConceptId,
        sourceIp,
        userAgent,
        occurredAt: now,
      });
      await tx.flush();
    });
  }

  private async prescriberOf(
    em: EntityManager,
    items: readonly MedicationRequests[],
  ): Promise<PrescriptionSharePrescriber> {
    const practitionerProfileId =
      items.find((item) => item.prescriberProfileId)?.prescriberProfileId ??
      null;
    if (!practitionerProfileId) {
      return { practitionerProfileId: null, name: null, license: null };
    }
    const identity = await this.prescriberIdentity.read(
      em,
      practitionerProfileId,
    );
    return {
      practitionerProfileId,
      name: identity?.name ?? null,
      license: identity?.license ?? null,
    };
  }

  private ownsOrCreated(
    link: SharedAccessLinks,
    actor: AuthenticatedUser,
  ): boolean {
    return (
      (actor.patientProfileId !== undefined &&
        actor.patientProfileId === link.patientProfileId) ||
      link.createdByUserId === actor.id
    );
  }

  private gone(status: PrescriptionShareStatus): GoneException {
    const revoked = status === 'REVOKED';
    const reason = revoked
      ? DelegatedAccessErrorReason.PRESCRIPTION_SHARE_REVOKED
      : DelegatedAccessErrorReason.PRESCRIPTION_SHARE_EXPIRED;
    return new GoneException({
      // Sin `code` propio para 410: PRECONDITION_FAILED es el más cercano, y
      // el cliente distingue el caso por `reason` (como la URL de descarga
      // vencida de `files.service.ts`).
      code: ErrorCode.PRECONDITION_FAILED,
      message: revoked
        ? 'El paciente dejó de compartir esta receta.'
        : 'Esta receta venció.',
      reason,
      details: { reason },
    });
  }

  private prescriptionNotFound(): ResourceNotFoundException {
    return new ResourceNotFoundException('Receta no encontrada');
  }

  private shareNotFound(): ResourceNotFoundException {
    return new ResourceNotFoundException('Enlace no encontrado');
  }
}
