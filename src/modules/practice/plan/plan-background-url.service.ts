import { createHmac, timingSafeEqual } from 'node:crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { resolveSecret } from '../../../common/crypto/dev-secret';
import { DomainException, ErrorCode } from '../../../common';
import { BACKGROUND_RULES } from './floor-plan.constants';
import { FloorPlanReason } from './floor-plan.error-reasons';

const INSECURE_DEV_SECRET = 'alovida-dev-download-secret';

/** URL firmada de un fondo y cuándo vence. */
export interface SignedBackgroundUrl {
  readonly url: string;
  readonly expiresAt: string;
}

/**
 * Firma y verifica las URL de vida corta del fondo de un lienzo
 * (CONTRATO-PLANO §1.6).
 *
 * La firma liga **lienzo + versión del archivo + vencimiento**; la URL nunca
 * lleva el id público del archivo. No reemplaza a la sesión: la ruta de
 * contenido exige igualmente token y permiso de lectura sobre la sede (un plano
 * es información de seguridad: rutas de evacuación, áreas restringidas). La
 * firma garantiza que la URL la emitió la API hace poco y para esa versión.
 */
@Injectable()
export class PlanBackgroundUrlService {
  /**
   * Firma la URL del fondo vigente.
   *
   * @param planId - Lienzo.
   * @param fileVersionId - Versión vigente del archivo (cambia si se reemplaza).
   * @param now - Reloj (inyectable en pruebas).
   * @returns Ruta relativa a la API y vencimiento.
   */
  sign(
    planId: string,
    fileVersionId: string,
    now: Date = new Date(),
  ): SignedBackgroundUrl {
    const exp =
      Math.floor(now.getTime() / 1000) + BACKGROUND_RULES.signedUrlTtlSeconds;
    const sig = this.signature(planId, fileVersionId, exp);
    return {
      url: `/floor-plans/${planId}/background/content?v=${fileVersionId}&exp=${exp}&sig=${sig}`,
      expiresAt: new Date(exp * 1000).toISOString(),
    };
  }

  /**
   * Verifica una URL firmada.
   *
   * @param planId - Lienzo de la ruta.
   * @param query - `v`, `exp` y `sig` de la URL.
   * @param now - Reloj (inyectable en pruebas).
   * @throws DomainException 403 `BACKGROUND_URL_INVALID` si la firma no coincide.
   * @throws DomainException 410 `BACKGROUND_URL_INVALID` si venció.
   */
  verify(
    planId: string,
    query: { v: string; exp: string; sig: string },
    now: Date = new Date(),
  ): void {
    const exp = Number(query.exp);
    const expected = Buffer.from(this.signature(planId, query.v, exp), 'hex');
    const presented = Buffer.from(query.sig, 'hex');
    if (
      !Number.isFinite(exp) ||
      presented.length !== expected.length ||
      !timingSafeEqual(presented, expected)
    ) {
      throw new DomainException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'La firma de la URL no es válida',
        undefined,
        FloorPlanReason.BACKGROUND_URL_INVALID,
      );
    }
    if (exp * 1000 < now.getTime()) {
      throw new DomainException(
        HttpStatus.GONE,
        ErrorCode.PRECONDITION_FAILED,
        'La URL del fondo venció; pedí el lienzo de nuevo',
        { reason: 'URL_EXPIRED' },
        FloorPlanReason.BACKGROUND_URL_INVALID,
      );
    }
  }

  private signature(planId: string, versionId: string, exp: number): string {
    const secret = resolveSecret(
      'DOWNLOAD_URL_SECRET',
      INSECURE_DEV_SECRET,
      'firma de las URL del fondo del plano',
    );
    return createHmac('sha256', secret)
      .update(`plan-background:${planId}:${versionId}:${exp}`)
      .digest('hex');
  }
}
