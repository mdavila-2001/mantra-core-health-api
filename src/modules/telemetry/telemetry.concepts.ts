import { defineModuleConcepts } from '../../common/seed/concept-seed';

/**
 * Conceptos propios del módulo Telemetry (28). Se declaran aquí para no tocar
 * archivos compartidos: el agregador central los reúne por su export
 * `TELEMETRY_CONCEPT_SEEDS`. Cubren TODA columna `*_concept_id` NOT NULL que los
 * endpoints de este módulo insertan cuando el valor no proviene de un concepto
 * transversal (p. ej. `CONCEPTS.STATE_ACTIVE` para estados activos genéricos).
 */
export const { seeds: TELEMETRY_CONCEPT_SEEDS, ids: TELE } = defineModuleConcepts(
  'telemetry',
  {
    // Propósito / base legal
    PURPOSE_CATEGORY_ANALYTICS: { code: 'ANALYTICS', display: 'Analytics tracking' },
    PURPOSE_CATEGORY_MARKETING: { code: 'MARKETING', display: 'Marketing tracking' },
    LEGAL_BASIS_CONSENT: { code: 'CONSENT', display: 'Consent' },
    LEGAL_BASIS_LEGITIMATE_INTEREST: { code: 'LEGITIMATE_INTEREST', display: 'Legitimate interest' },
    // Portales / clasificación de datos
    PORTAL_WEB: { code: 'WEB', display: 'Web portal' },
    PORTAL_MOBILE: { code: 'MOBILE', display: 'Mobile app' },
    PII_NONE: { code: 'NONE', display: 'No PII' },
    DATA_CLASS_INTERNAL: { code: 'INTERNAL', display: 'Internal data' },
    // Disclosure
    DISCLOSURE_PUBLISHED: { code: 'PUBLISHED', display: 'Published disclosure' },
    JURISDICTION_DEFAULT: { code: 'GLOBAL', display: 'Global jurisdiction' },
    ACCEPTANCE_ACCEPTED: { code: 'ACCEPTED', display: 'Disclosure accepted' },
    // Consentimiento de tracking (append-only por decisión)
    DECISION_GRANTED: { code: 'GRANTED', display: 'Tracking consent granted' },
    DECISION_WITHDRAWN: { code: 'WITHDRAWN', display: 'Tracking consent withdrawn' },
    // Tipos de valor de propiedad de evento
    VALUE_TYPE_STRING: { code: 'STRING', display: 'String value' },
    VALUE_TYPE_NUMBER: { code: 'NUMBER', display: 'Numeric value' },
    VALUE_TYPE_BOOLEAN: { code: 'BOOLEAN', display: 'Boolean value' },
    // Estado del journey de sesión
    JOURNEY_OPEN: { code: 'OPEN', display: 'Journey open' },
    JOURNEY_CONVERTED: { code: 'CONVERTED', display: 'Journey converted' },
    JOURNEY_CLOSED: { code: 'CLOSED', display: 'Journey closed' },
    // Core Web Vitals
    METRIC_LCP: { code: 'LCP', display: 'Largest Contentful Paint' },
    METRIC_INP: { code: 'INP', display: 'Interaction to Next Paint' },
    METRIC_FID: { code: 'FID', display: 'First Input Delay' },
    METRIC_CLS: { code: 'CLS', display: 'Cumulative Layout Shift' },
    METRIC_TTFB: { code: 'TTFB', display: 'Time to First Byte' },
    METRIC_FCP: { code: 'FCP', display: 'First Contentful Paint' },
    RATING_GOOD: { code: 'GOOD', display: 'Good' },
    RATING_NEEDS_IMPROVEMENT: { code: 'NEEDS_IMPROVEMENT', display: 'Needs improvement' },
    RATING_POOR: { code: 'POOR', display: 'Poor' },
    NAV_NAVIGATE: { code: 'NAVIGATE', display: 'Navigate' },
  },
);

/** Métrica Web Vital (código) -> concepto. */
export const METRIC_CONCEPT_BY_CODE: Record<string, string> = {
  LCP: TELE.METRIC_LCP,
  INP: TELE.METRIC_INP,
  FID: TELE.METRIC_FID,
  CLS: TELE.METRIC_CLS,
  TTFB: TELE.METRIC_TTFB,
  FCP: TELE.METRIC_FCP,
};

/** Rating Web Vital (código) -> concepto. */
export const RATING_CONCEPT_BY_CODE: Record<string, string> = {
  GOOD: TELE.RATING_GOOD,
  NEEDS_IMPROVEMENT: TELE.RATING_NEEDS_IMPROVEMENT,
  POOR: TELE.RATING_POOR,
};

/** Tipo de valor de propiedad (código) -> concepto. */
export const VALUE_TYPE_CONCEPT_BY_CODE: Record<string, string> = {
  STRING: TELE.VALUE_TYPE_STRING,
  NUMBER: TELE.VALUE_TYPE_NUMBER,
  BOOLEAN: TELE.VALUE_TYPE_BOOLEAN,
};

/** Códigos de métrica válidos para Core Web Vitals. */
export const WEB_VITAL_METRIC_CODES = ['LCP', 'INP', 'FID', 'CLS', 'TTFB', 'FCP'] as const;
export type WebVitalMetricCode = (typeof WEB_VITAL_METRIC_CODES)[number];
