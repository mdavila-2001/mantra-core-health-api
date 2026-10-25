import {
  HttpStatus,
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import {
  DomainException,
  ErrorCode,
  ResourceNotFoundException,
} from '../../../../common';

export interface OnboardingDraftPayload {
  readonly draftId: string;
  readonly formType: string;
  readonly stepIndex: number;
  readonly stepKey?: string;
  readonly stepTitle?: string;
  readonly data: Record<string, unknown>;
  readonly extraData?: Record<string, unknown>;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly percentComplete: number;
}

/** Respuesta de `PUT`: `draftSecret` sólo viaja cuando el borrador se crea. */
export interface SaveOnboardingDraftResult {
  readonly ok: boolean;
  readonly savedAt: string;
  readonly draftSecret?: string;
}

interface DraftEntry {
  readonly payload: OnboardingDraftPayload;
  /** SHA-256 del secreto; el secreto en claro nunca se guarda. */
  readonly secretHash: Buffer;
  readonly origin: string;
  expiresAt: number;
}

/** Cabecera que lleva el secreto del borrador en `GET`, `PUT` y `DELETE`. */
export const ONBOARDING_DRAFT_SECRET_HEADER = 'x-onboarding-draft-secret';

const FORM_TYPE_PATTERN = /^[a-z0-9-]{1,40}$/;
const DRAFT_ID_PATTERN = /^[A-Za-z0-9_-]{16,128}$/;

/** Bytes aleatorios del secreto: 256 bits, por encima del mínimo de 128. */
const SECRET_BYTES = 32;
/** Tope del cuerpo del borrador serializado (el parser global admite 1 MB). */
export const MAX_DRAFT_BYTES = 64 * 1024;
/** Tope de borradores vivos en el proceso: acota la memoria a ~128 MB. */
export const MAX_DRAFTS_TOTAL = 2000;
/** Tope de borradores vivos creados desde un mismo origen (IP). */
export const MAX_DRAFTS_PER_ORIGIN = 25;
const TTL_MS = 30 * 24 * 60 * 60 * 1000;
const SWEEP_INTERVAL_MS = 10 * 60 * 1000;

function hashSecret(secret: string): Buffer {
  return createHash('sha256').update(secret, 'utf8').digest();
}

/**
 * Almacén en memoria de borradores del formulario de alta.
 *
 * Las rutas son públicas (el alta ocurre antes de tener cuenta), así que la
 * única barrera es un secreto aleatorio por borrador. Se emite una vez, en el
 * `PUT` que crea el borrador, y se exige en la cabecera
 * {@link ONBOARDING_DRAFT_SECRET_HEADER} en todas las operaciones posteriores.
 * Si el borrador no existe, venció o el secreto falta o no coincide, la
 * respuesta es el mismo 404: no se puede distinguir un borrador ajeno de uno
 * inexistente.
 *
 * El almacén es por proceso: con más de una instancia el borrador sólo existe
 * en la que lo recibió.
 */
@Injectable()
export class IamOnboardingDraftsService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly drafts = new Map<string, DraftEntry>();
  private readonly perOrigin = new Map<string, number>();
  private sweepTimer: NodeJS.Timeout | undefined;

  onModuleInit(): void {
    this.sweepTimer = setInterval(() => this.sweepExpired(), SWEEP_INTERVAL_MS);
    // No debe mantener vivo el proceso durante el apagado.
    this.sweepTimer.unref();
  }

  onModuleDestroy(): void {
    if (this.sweepTimer) clearInterval(this.sweepTimer);
    this.sweepTimer = undefined;
  }

  /** Cantidad de borradores vivos (para pruebas y métricas). */
  get size(): number {
    return this.drafts.size;
  }

  /** Elimina los borradores vencidos y devuelve cuántos quitó. */
  sweepExpired(now = Date.now()): number {
    let removed = 0;
    for (const [key, entry] of this.drafts) {
      if (now > entry.expiresAt) {
        this.removeEntry(key, entry);
        removed += 1;
      }
    }
    return removed;
  }

  getDraft(
    formType: string,
    draftId: string,
    secret: string | undefined,
  ): OnboardingDraftPayload {
    return this.authorize(formType, draftId, secret).entry.payload;
  }

  saveDraft(
    formType: string,
    draftId: string,
    payload: OnboardingDraftPayload,
    secret: string | undefined,
    origin: string,
  ): SaveOnboardingDraftResult {
    if (!this.validKey(formType, draftId)) throw this.notFound();
    this.assertPayloadShape(payload);

    const now = Date.now();
    const key = `${formType}:${draftId}`;
    const savedAt = new Date(now).toISOString();
    const existing = this.live(key, now);

    if (secret === undefined || secret === '') {
      // Sin secreto sólo se puede crear. Si el id ya está tomado, el cliente
      // recibe el mismo 404 que ante un secreto erróneo.
      if (existing) throw this.notFound();
      const draftSecret = randomBytes(SECRET_BYTES).toString('base64url');
      this.assertCapacity(origin, now);
      this.drafts.set(key, {
        payload: this.buildPayload(
          formType,
          draftId,
          payload,
          savedAt,
          savedAt,
        ),
        secretHash: hashSecret(draftSecret),
        origin,
        expiresAt: now + TTL_MS,
      });
      this.perOrigin.set(origin, (this.perOrigin.get(origin) ?? 0) + 1);
      return { ok: true, savedAt, draftSecret };
    }

    const { entry } = this.authorize(formType, draftId, secret);
    this.drafts.set(key, {
      ...entry,
      payload: this.buildPayload(
        formType,
        draftId,
        payload,
        entry.payload.createdAt,
        savedAt,
      ),
      expiresAt: now + TTL_MS,
    });
    return { ok: true, savedAt };
  }

  deleteDraft(
    formType: string,
    draftId: string,
    secret: string | undefined,
  ): { ok: boolean } {
    const { key, entry } = this.authorize(formType, draftId, secret);
    this.removeEntry(key, entry);
    return { ok: true };
  }

  /**
   * Verifica clave, vigencia y secreto. Toda falla es el mismo 404, y la
   * comparación se hace siempre (contra un hash de relleno si no hay borrador)
   * para no distinguir los casos por tiempo.
   */
  private authorize(
    formType: string,
    draftId: string,
    secret: string | undefined,
  ): { key: string; entry: DraftEntry } {
    const key = `${formType}:${draftId}`;
    const entry = this.validKey(formType, draftId)
      ? this.live(key, Date.now())
      : undefined;
    const presented = hashSecret(secret ?? '');
    const expected = entry?.secretHash ?? hashSecret('sin-borrador');
    const matches = timingSafeEqual(presented, expected);
    if (!entry || !matches || secret === undefined || secret === '') {
      throw this.notFound();
    }
    return { key, entry };
  }

  private live(key: string, now: number): DraftEntry | undefined {
    const entry = this.drafts.get(key);
    if (!entry) return undefined;
    if (now > entry.expiresAt) {
      this.removeEntry(key, entry);
      return undefined;
    }
    return entry;
  }

  private removeEntry(key: string, entry: DraftEntry): void {
    this.drafts.delete(key);
    const left = (this.perOrigin.get(entry.origin) ?? 1) - 1;
    if (left <= 0) this.perOrigin.delete(entry.origin);
    else this.perOrigin.set(entry.origin, left);
  }

  private assertCapacity(origin: string, now: number): void {
    if (this.drafts.size >= MAX_DRAFTS_TOTAL) this.sweepExpired(now);
    if (this.drafts.size >= MAX_DRAFTS_TOTAL) {
      throw new DomainException(
        HttpStatus.SERVICE_UNAVAILABLE,
        ErrorCode.DEPENDENCY_UNAVAILABLE,
        'No hay capacidad para nuevos borradores en este momento',
      );
    }
    if ((this.perOrigin.get(origin) ?? 0) >= MAX_DRAFTS_PER_ORIGIN) {
      throw new DomainException(
        HttpStatus.TOO_MANY_REQUESTS,
        ErrorCode.RATE_LIMITED,
        'Se alcanzó el máximo de borradores abiertos desde este origen',
      );
    }
  }

  private assertPayloadShape(payload: OnboardingDraftPayload): void {
    const isRecord = (value: unknown): boolean =>
      typeof value === 'object' && value !== null && !Array.isArray(value);
    if (
      !isRecord(payload) ||
      !isRecord(payload.data) ||
      (payload.extraData !== undefined && !isRecord(payload.extraData))
    ) {
      throw new DomainException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_FAILED,
        'El borrador debe traer `data` (y `extraData`, si viene) como objetos',
      );
    }
    if (Buffer.byteLength(JSON.stringify(payload), 'utf8') > MAX_DRAFT_BYTES) {
      throw new DomainException(
        HttpStatus.PAYLOAD_TOO_LARGE,
        ErrorCode.PAYLOAD_TOO_LARGE,
        `El borrador supera el máximo de ${MAX_DRAFT_BYTES} bytes`,
      );
    }
  }

  /** Sólo se conservan los campos conocidos; el resto del cuerpo se descarta. */
  private buildPayload(
    formType: string,
    draftId: string,
    payload: OnboardingDraftPayload,
    createdAt: string,
    updatedAt: string,
  ): OnboardingDraftPayload {
    const stripSecrets = (
      source: Record<string, unknown>,
    ): Record<string, unknown> => {
      const copy = { ...source };
      // Seguridad: jamás persistir contraseñas en borradores
      delete copy['password'];
      delete copy['confirmPassword'];
      return copy;
    };
    const stepIndex = Number.isFinite(payload.stepIndex)
      ? Math.max(0, Math.trunc(payload.stepIndex))
      : 0;
    const percent = Number.isFinite(payload.percentComplete)
      ? Math.min(100, Math.max(0, payload.percentComplete))
      : 0;
    return {
      draftId,
      formType,
      stepIndex,
      ...(typeof payload.stepKey === 'string'
        ? { stepKey: payload.stepKey }
        : {}),
      ...(typeof payload.stepTitle === 'string'
        ? { stepTitle: payload.stepTitle }
        : {}),
      data: stripSecrets(payload.data),
      ...(payload.extraData
        ? { extraData: stripSecrets(payload.extraData) }
        : {}),
      createdAt,
      updatedAt,
      percentComplete: percent,
    };
  }

  private validKey(formType: string, draftId: string): boolean {
    return FORM_TYPE_PATTERN.test(formType) && DRAFT_ID_PATTERN.test(draftId);
  }

  private notFound(): ResourceNotFoundException {
    return new ResourceNotFoundException('Borrador no encontrado');
  }
}
