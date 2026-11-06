import { Injectable } from '@nestjs/common';
import { InpatientCensusUseCases } from './inpatient/census.use-cases';

/** Fachada del censo diario (F3, §F3.3). Sin reglas. */
@Injectable()
export class InpatientCensusService {
  constructor(private readonly census: InpatientCensusUseCases) {}

  view(...a: Parameters<InpatientCensusUseCases['view']>) {
    return this.census.view(...a);
  }
  close(...a: Parameters<InpatientCensusUseCases['close']>) {
    return this.census.close(...a);
  }
  adjust(...a: Parameters<InpatientCensusUseCases['adjust']>) {
    return this.census.adjust(...a);
  }
  tick() {
    return this.census.tick();
  }
}
