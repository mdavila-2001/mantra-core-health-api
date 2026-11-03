import { Injectable } from '@nestjs/common';
import type {
  Disposition,
  EvidenceLevel,
  LegalHoldState,
  WriteMode,
} from '../mutability.types';
import { MutabilityCatalogService } from './mutability-catalog.service';

/** Lo que la sonda de catalogación necesita saber de una tabla, con su nivel de evidencia. */
export interface DeclaredMutability {
  writeMode: WriteMode;
  writeModeLevel: EvidenceLevel;
  disposition: Disposition;
  legalHold: LegalHoldState;
  /** Hay al menos una contradicción registrada: el modo declarado no es de fiar sin revisión. */
  contested: boolean;
}

/**
 * PUNTO DE EXTENSIÓN para la sonda de catalogación (`data_catalog/application/fit/`): permite
 * preguntar qué `writeMode` está DECLARADO para una tabla y comparar con lo observado en la base
 * (`pg_trigger`, `has_table_privilege`). Es de sólo lectura y síncrono (el catálogo está en memoria).
 *
 * Una tabla desconocida devuelve `null`, no `UNKNOWN`: «no está en el catálogo» y «está y no
 * tiene evidencia» son cosas distintas.
 */
@Injectable()
export class MutabilityLookupService {
  constructor(private readonly catalog: MutabilityCatalogService) {}

  declared(schema: string, table: string): DeclaredMutability | null {
    const r = this.catalog.find(schema, table);
    if (!r) return null;
    return {
      writeMode: r.writeMode,
      writeModeLevel: r.writeModeLevel,
      disposition: r.disposition,
      legalHold: r.legalHold,
      contested: r.findings.some((f) => f.kind === 'CONTRADICTION'),
    };
  }
}
