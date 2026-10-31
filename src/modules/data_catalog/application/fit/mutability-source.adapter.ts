import { Injectable } from '@nestjs/common';
import { MutabilityCatalogService } from '../../../system_ops/mutability/services/mutability-catalog.service';
import type {
  FitMutabilitySource,
  MutabilityDeclarations,
} from './fit.types';

/**
 * Fuente de mutabilidad de la sonda de ajuste: lee el registro derivado por el gobierno de
 * mutabilidad (`system_ops/mutability`). Sólo cuenta como DECLARADA una tabla con `writeMode` distinto
 * de `UNKNOWN`: «sin evidencia» no es una clasificación (ver `FIT-MUT-001`).
 */
@Injectable()
export class MutabilityFitSource implements FitMutabilitySource {
  constructor(private readonly catalog: MutabilityCatalogService) {}

  async declarations(): Promise<MutabilityDeclarations> {
    const out = new Map<string, string>();
    for (const r of this.catalog.all()) {
      if (r.writeMode === 'UNKNOWN') continue;
      out.set(`${r.schema}.${r.table}`, r.writeMode);
    }
    return out;
  }
}
