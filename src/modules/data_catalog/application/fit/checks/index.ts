import type { FitCheck } from '../fit.types';
import { COMPLETENESS_CHECKS } from './completeness-checks';
import { FRESHNESS_CHECKS } from './freshness-checks';
import { MODEL_CHECKS } from './model-checks';
import { MUTABILITY_CHECKS } from './mutability-checks';
import { ROUTE_CHECKS } from './route-checks';
import { SENSITIVITY_CHECKS } from './sensitivity-checks';

/** Las comprobaciones de fábrica, en el orden en que se informan. */
export const DEFAULT_FIT_CHECKS: readonly FitCheck[] = [
  ...ROUTE_CHECKS,
  ...MODEL_CHECKS,
  ...COMPLETENESS_CHECKS,
  ...FRESHNESS_CHECKS,
  ...MUTABILITY_CHECKS,
  ...SENSITIVITY_CHECKS,
];
