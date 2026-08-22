import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';

/**
 * Cada cuánto se buscan sellos vencidos. Una hora alcanza: la vigencia de una
 * matrícula se mide en años, y un sello que cae con hasta una hora de retraso
 * es incomparablemente mejor que uno que no cae nunca.
 */
const EXPIRY_INTERVAL_MS = 3_600_000;

/** Refleja `BadgeSweepResponseDto` (`modules/community/dto`). */
interface BadgeSweepResponse {
  expired: number;
  profiles: number;
}

/**
 * Barrido de sellos vencidos (P13).
 *
 * El puente desde `identity_assurance` hace caer el sello cuando alguien
 * revoca la aserción o cuando el caso vence. Pero un sello puede vencer **por
 * su propia fecha** sin que el caso se mueva: la matrícula se emitió hasta el
 * 3 de marzo, llega el 4, y no hay ningún evento que lo cuente.
 *
 * Sin este job ese sello se seguiría mostrando activo hasta que alguien
 * revocara el caso a mano, que es exactamente el sello que miente — sólo que
 * en cámara lenta. Con él, el vencimiento es un hecho del reloj y no depende de
 * que nadie se acuerde.
 */
@Injectable()
export class BadgeExpiryJob {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param api - Cliente HTTP autenticado como `SYSTEM` contra la propia API.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(BadgeExpiryJob.name);
  }

  /** Baja los sellos cuya vigencia ya pasó. */
  @Interval(EXPIRY_INTERVAL_MS)
  async tick(): Promise<void> {
    await runTick(this.logger, 'worker.community.badge_expiry', async () => {
      const result = await this.api.post<BadgeSweepResponse>(
        '/internal/community/verification/badges/expire-sweep',
        {},
      );

      // Sin vencidos no se dice nada: un log por hora anunciando que no pasó
      // nada entierra el que sí importa.
      if (result.expired === 0) return;

      this.logger.info(
        {
          operation: 'worker.community.badge_expiry',
          expired: result.expired,
          profiles: result.profiles,
        },
        'Expired verified badges swept',
      );
    });
  }
}
