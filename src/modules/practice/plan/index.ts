import { FloorPlanBackgroundService } from './floor-plan-background.service';
import { FloorPlanContextService } from './floor-plan-context.service';
import { FloorPlanLayoutRepository } from './floor-plan-layout.repository';
import { FloorPlanLayoutWriteService } from './floor-plan-layout-write.service';
import { FloorPlanLayoutService } from './floor-plan-layout.service';
import { FloorPlanLookupController } from './floor-plan-lookup.controller';
import { FloorPlanStateService } from './floor-plan-state.service';
import { FloorPlansController } from './floor-plans.controller';
import { FloorPlansRepository } from './floor-plans.repository';
import { FloorPlansService } from './floor-plans.service';
import { DefaultPlanOperationalState } from './default-plan-operational-state';
import { PlanBackgroundUrlService } from './plan-background-url.service';
import { PlanEventsService } from './plan-events.service';
import { PLAN_OPERATIONAL_STATE } from './plan-operational-state.port';
import { PlanViewerService } from './plan-viewer.service';

/** Controladores del plano de planta (F1c), para registrar en `PracticeModule`. */
export const FLOOR_PLAN_CONTROLLERS = [
  FloorPlansController,
  FloorPlanLookupController,
];

/**
 * Proveedores del plano de planta (F1c), para registrar en `PracticeModule`.
 *
 * El estado operativo entra por el token {@link PLAN_OPERATIONAL_STATE}: otro
 * lector puede reemplazar `DefaultPlanOperationalState` sin tocar el resto del
 * plano.
 */
export const FLOOR_PLAN_PROVIDERS = [
  FloorPlansRepository,
  FloorPlanLayoutRepository,
  PlanBackgroundUrlService,
  PlanEventsService,
  PlanViewerService,
  FloorPlanContextService,
  FloorPlansService,
  FloorPlanLayoutService,
  FloorPlanLayoutWriteService,
  FloorPlanBackgroundService,
  FloorPlanStateService,
  DefaultPlanOperationalState,
  { provide: PLAN_OPERATIONAL_STATE, useExisting: DefaultPlanOperationalState },
];

export * from './floor-plan.error-reasons';
export * from './floor-plan.types';
export { PLAN_OPERATIONAL_STATE } from './plan-operational-state.port';
export type {
  PlanOperationalStatePort,
  OpsStateRequest,
  OpsCardView,
} from './plan-operational-state.port';
