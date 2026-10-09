/**
 * Un servicio del catálogo de una práctica, tal como lo necesita la agenda
 * (contexto `billing`). Es estructural: la entidad del otro contexto lo
 * satisface sin que `application/` la importe.
 */
export interface ServiceCatalogItem {
  readonly id: string;
  readonly practiceId: string;
  readonly code: string;
  readonly name: string;
  readonly defaultPrice: string;
  readonly currencyConceptId?: string | null;
  readonly isActive: boolean;
}
