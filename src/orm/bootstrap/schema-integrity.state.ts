import { Injectable } from '@nestjs/common';

/** Reporte del último arranque que materializó el DDL, apto para readiness. */
export interface SchemaIntegrityReport {
  /** Cuántas incidencias que comprometen la integridad quedaron sin resolver. */
  readonly blockingCount: number;
  /** Cuántas incidencias tolerables (rendimiento, extensiones opcionales). */
  readonly degradedCount: number;
  /** Cuándo se calculó el reporte. */
  readonly recordedAt: Date;
}

/**
 * Estado en memoria de la integridad del esquema tras el bootstrap (ORMN-01).
 *
 * `SchemaBootstrapService` lo escribe al terminar las capas; `AppReadinessService`
 * lo lee. Guarda sólo conteos: el detalle de cada incidencia (que puede nombrar
 * constraints y mensajes del driver) vive en el log del arranque, no en un
 * endpoint. Un proceso que no sincroniza el DDL (`ORM_SCHEMA_SYNC=off`) no
 * registra nada y el estado queda «sin reporte», que cuenta como íntegro.
 */
@Injectable()
export class SchemaIntegrityState {
  private report: SchemaIntegrityReport | null = null;

  /** Registra el resultado de un arranque. */
  record(blockingCount: number, degradedCount: number): void {
    this.report = { blockingCount, degradedCount, recordedAt: new Date() };
  }

  /** Último reporte, o `null` si este proceso no materializó el DDL. */
  current(): SchemaIntegrityReport | null {
    return this.report;
  }

  /** Verdadero si no hay incidencias de integridad sin resolver. */
  isComplete(): boolean {
    return (this.report?.blockingCount ?? 0) === 0;
  }
}
