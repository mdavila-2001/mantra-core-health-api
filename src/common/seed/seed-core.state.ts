import { Injectable } from '@nestjs/common';

/**
 * Estado en memoria de los seeds núcleo de este proceso (SEED-01).
 *
 * `SeedBootstrapService` lo escribe al terminar la cadena y `AppReadinessService`
 * lo lee. Guarda sólo los nombres de los pasos `core` que fallaron: el detalle
 * del error vive en el log del arranque, no en un endpoint.
 *
 * Fuera de producción, un seed núcleo fallido no aborta el arranque salvo con
 * `SEED_CORE_FAILURE_FATAL=true`; sin este estado ese proceso anunciaría
 * `/readiness` en verde con una base a medio sembrar. Un proceso que no corrió la
 * cadena (`SEED_ON_BOOT=false`) no registra nada: «sin reporte» cuenta como
 * completo aquí, y es la sonda de contenido de la readiness la que mira la base.
 */
@Injectable()
export class SeedCoreState {
  private failed: readonly string[] = [];

  /** Registra el resultado de la última corrida de la cadena. */
  record(coreFailed: readonly string[]): void {
    this.failed = [...coreFailed];
  }

  /** Nombres de los pasos núcleo que fallaron en la última corrida. */
  failedSteps(): readonly string[] {
    return this.failed;
  }

  /** Verdadero si la última corrida no dejó ningún paso núcleo fallido. */
  isComplete(): boolean {
    return this.failed.length === 0;
  }
}
