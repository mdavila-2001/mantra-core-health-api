import { Injectable } from '@nestjs/common';
import { InpatientCensusUseCases } from './inpatient/census.use-cases';

/** Fachada de indicadores hospitalarios OPS (F3, §F3.3). Sin reglas. */
@Injectable()
export class InpatientIndicatorsService {
  constructor(private readonly census: InpatientCensusUseCases) {}

  indicators(...a: Parameters<InpatientCensusUseCases['indicators']>) {
    return this.census.indicators(...a);
  }
}
