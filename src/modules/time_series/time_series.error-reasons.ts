/**
 * Catálogo de sub-códigos de negocio estables del módulo `time_series`. Se usan
 * como `reason` de `DomainException`, encima del `code` genérico que ya fija el
 * status HTTP.
 */
export enum TimeSeriesErrorReason {
  /**
   * El consentimiento que respalda un ping de ubicación no existe, es de otro
   * tenant o sujeto, está retirado o vencido, no cubre el instante del ping o
   * no es de propósito de ubicación. Todas las causas responden igual: nombrar
   * cuál revelaría el estado de privacidad de la persona.
   */
  LOCATION_CONSENT_INVALID = 'TIME_SERIES_LOCATION_CONSENT_INVALID',
}
