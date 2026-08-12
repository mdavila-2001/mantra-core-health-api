import type { EntityManager } from '@mikro-orm/postgresql';
import type { AudioTtsConfig } from '../config/audio-tts.env';
import type {
  AudioQuotaRepository,
  BudgetWindow,
} from '../repositories/audio-quota.repository';

/** Para qué se pide la generación. Cambia qué puertas se aplican. */
export type GenerationPurpose = 'runtime' | 'prewarm';

export interface AudioReservation {
  allowed: boolean;
  /** Código estable de denegación; viaja al log y a la respuesta. */
  reason?: string;
  units: number;
  window: BudgetWindow;
  /** `true` si además se consumió cupo diario del actor y habría que devolverlo. */
  actorClaimed: boolean;
}

/** Ventana mensual del presupuesto, en UTC. */
export function monthKeyOf(now: Date): string {
  return now.toISOString().slice(0, 7);
}

/** Día del cupo por actor, en UTC. */
export function dayKeyOf(now: Date): string {
  return now.toISOString().slice(0, 10);
}

/**
 * Autoriza (o no) gastar cuota del proveedor.
 *
 * Es una clase y no un servicio de NestJS porque no tiene ciclo de vida propio:
 * la construyen el resolutor y el servicio de generación con la configuración y
 * el repositorio que ya tienen inyectados.
 *
 * El orden de las comprobaciones importa y va de lo barato a lo caro: primero las
 * puertas que no tocan la base (interruptores, licencia), luego el cupo del actor
 * y por último la reserva mensual. Al revés, cada petición de un módulo con el
 * audio desactivado abriría dos transacciones para acabar denegando.
 */
export class AudioBudgetPolicy {
  constructor(
    private readonly quota: AudioQuotaRepository,
    private readonly config: AudioTtsConfig,
  ) {}

  /** Presupuesto realmente gastable: el mensual menos el colchón de seguridad. */
  get usableUnits(): number {
    return Math.max(
      0,
      this.config.monthlyBudgetUnits - this.config.safetyReserveUnits,
    );
  }

  /** Puertas que no tocan la base de datos. */
  checkGates(purpose: GenerationPurpose): {
    allowed: boolean;
    reason?: string;
  } {
    if (!this.config.enabled) return { allowed: false, reason: 'TTS_DISABLED' };
    if (this.config.provider === 'disabled') {
      return { allowed: false, reason: 'PROVIDER_DISABLED' };
    }
    if (purpose === 'runtime' && !this.config.allowRuntimeGeneration) {
      return { allowed: false, reason: 'RUNTIME_GENERATION_DISABLED' };
    }
    // La licencia se comprueba aquí y no en el arranque a propósito: un entorno
    // de producción puede querer arrancar el módulo en modo solo-caché mientras se
    // cierra el contrato con el proveedor, y eso no debe impedir servir los audios
    // ya generados.
    if (
      this.config.nodeEnv === 'production' &&
      !this.config.prodLicenseConfirmed
    ) {
      return { allowed: false, reason: 'PRODUCTION_LICENSE_NOT_CONFIRMED' };
    }
    return { allowed: true };
  }

  /**
   * Reserva cuota para una generación.
   *
   * Si el cupo del actor se consumió pero la reserva mensual no cabe, el cupo se
   * devuelve antes de denegar: cobrarle al usuario un intento que nunca llegó a
   * generarse le gastaría el cupo del día sin darle un solo audio.
   */
  async reserve(
    em: EntityManager,
    units: number,
    purpose: GenerationPurpose,
    actorId: string | undefined,
    now: Date = new Date(),
  ): Promise<AudioReservation> {
    const window: BudgetWindow = {
      provider: this.config.provider,
      monthKey: monthKeyOf(now),
    };
    const denied = (
      reason: string,
      actorClaimed = false,
    ): AudioReservation => ({
      allowed: false,
      reason,
      units,
      window,
      actorClaimed,
    });

    const gates = this.checkGates(purpose);
    if (!gates.allowed) return denied(gates.reason ?? 'GENERATION_DENIED');

    const needsActorClaim =
      purpose === 'runtime' &&
      actorId !== undefined &&
      !this.config.actorLimitUnlimited;

    if (needsActorClaim && actorId !== undefined) {
      const limit = this.config.runtimeGenerationsPerActorDay;
      // `0` significa bloqueado, no ilimitado: un valor ausente o mal escrito
      // nunca debe abrir la puerta a gasto ilimitado por actor.
      if (limit === 0) return denied('ACTOR_DAILY_LIMIT');
      const claimed = await this.quota.claimActorGeneration(
        em,
        actorId,
        dayKeyOf(now),
        limit,
      );
      if (!claimed) return denied('ACTOR_DAILY_LIMIT');
    }

    const reserved = await this.quota.reserveBudget(
      em,
      window,
      units,
      this.usableUnits,
    );
    if (!reserved) {
      if (needsActorClaim && actorId !== undefined) {
        await this.quota.releaseActorGeneration(em, actorId, dayKeyOf(now));
      }
      return denied('MONTHLY_BUDGET_RESERVED');
    }

    return { allowed: true, units, window, actorClaimed: needsActorClaim };
  }

  /** Devuelve una reserva que no llegó a consumirse (y el cupo del actor con ella). */
  async release(
    em: EntityManager,
    reservation: AudioReservation,
    actorId?: string,
    now: Date = new Date(),
  ): Promise<void> {
    if (!reservation.allowed) return;
    await this.quota.releaseBudget(em, reservation.window, reservation.units);
    if (reservation.actorClaimed && actorId !== undefined) {
      await this.quota.releaseActorGeneration(em, actorId, dayKeyOf(now));
    }
  }

  /**
   * Revalidación antes de gastar de verdad.
   *
   * Un asset puede llevar horas esperando: entre su reserva y su generación el
   * presupuesto pudo agotarse con otras liquidaciones. Comprobarlo aquí cuesta una
   * lectura y evita la única llamada al proveedor que ya no se puede deshacer.
   */
  async stillWithinBudget(
    em: EntityManager,
    units: number,
    now: Date = new Date(),
  ): Promise<boolean> {
    const snapshot = await this.quota.readBudget(em, {
      provider: this.config.provider,
      monthKey: monthKeyOf(now),
    });
    return snapshot.settledUnits + units <= this.usableUnits;
  }
}
