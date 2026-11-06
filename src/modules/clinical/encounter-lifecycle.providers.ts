import type { Provider } from '@nestjs/common';
import { ENCOUNTER_CLOSED_PORT } from './ports/encounter-closed.port';
import { SchedulingEncounterClosedAdapter } from './adapters/scheduling-encounter-closed.adapter';
import { EncounterCloseService } from './services/encounter-close.service';

export { ENCOUNTER_CLOSED_PORT };

/**
 * El fin de la consulta completa el turno de la agenda (y emite la encuesta),
 * detrás de `ENCOUNTER_CLOSED_PORT`. El adaptador resuelve `scheduling` de forma
 * perezosa: `scheduling` ya llega a `clinical` por `community`, e importarlo
 * cerraría el ciclo.
 */
export const encounterLifecycleProviders: Provider[] = [
  EncounterCloseService,
  SchedulingEncounterClosedAdapter,
  {
    provide: ENCOUNTER_CLOSED_PORT,
    useExisting: SchedulingEncounterClosedAdapter,
  },
];
