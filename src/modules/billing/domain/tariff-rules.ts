/**
 * Elección de la tarifa de un cargo y forma de una tarifa nueva (F5e).
 * Funciones puras: leer y escribir es del servicio.
 */

/** Lo que de una tarifa interesa para elegirla. */
export interface TariffCandidate {
  readonly id: string;
  readonly tariffKindConceptId: string;
  readonly bedCategoryConceptId: string | null;
  readonly careSpaceId: string | null;
  readonly serviceCatalogId: string;
  readonly unitMinutes: number | null;
  readonly minimumUnits: number | null;
  readonly unitPrice: string;
  readonly currencyConceptId: string;
  /** Inicio (incluido), `YYYY-MM-DD`. */
  readonly validFrom: string;
  /** Fin (excluido), `YYYY-MM-DD`, o `null`. */
  readonly validTo: string | null;
}

/** ¿Rige la tarifa en la fecha de servicio? (`[valid_from, valid_to)`) */
export function tariffCoversDate(
  tariff: Pick<TariffCandidate, 'validFrom' | 'validTo'>,
  serviceDate: string,
): boolean {
  return (
    tariff.validFrom <= serviceDate &&
    (tariff.validTo === null || serviceDate < tariff.validTo)
  );
}

/**
 * Tarifa de un día-cama: la propia de la sala manda sobre la de la categoría; ambas
 * vigentes en la fecha de servicio. Nunca se cae a otra categoría ni a otra
 * tarifa en silencio.
 *
 * @param tariffs - Tarifas de día-cama de la práctica.
 * @param careSpaceId - Cama.
 * @param categoryConceptId - Categoría de la cama en la medianoche.
 * @param serviceDate - Fecha de servicio.
 * @returns La tarifa, o `null` si no hay ninguna vigente.
 */
export function pickBedDayTariff<T extends TariffCandidate>(
  tariffs: readonly T[],
  careSpaceId: string,
  categoryConceptId: string,
  serviceDate: string,
): T | null {
  const live = tariffs.filter((tariff) =>
    tariffCoversDate(tariff, serviceDate),
  );
  return (
    live.find((tariff) => tariff.careSpaceId === careSpaceId) ??
    live.find(
      (tariff) =>
        tariff.careSpaceId === null &&
        tariff.bedCategoryConceptId === categoryConceptId,
    ) ??
    null
  );
}

/**
 * Tarifa de quirófano por tiempo: la de la sala, o la general de quirófano
 * (sin sala), vigente en la fecha de servicio.
 */
export function pickOrTimeTariff<T extends TariffCandidate>(
  tariffs: readonly T[],
  operatingRoomId: string | null,
  serviceDate: string,
): T | null {
  const live = tariffs.filter((tariff) =>
    tariffCoversDate(tariff, serviceDate),
  );
  return (
    (operatingRoomId
      ? live.find((tariff) => tariff.careSpaceId === operatingRoomId)
      : undefined) ??
    live.find((tariff) => tariff.careSpaceId === null) ??
    null
  );
}

/** Un error de forma de una tarifa, con el campo. */
export interface TariffShapeError {
  readonly field: string;
  readonly message: string;
}

/** Entrada de {@link validateTariffShape}. */
export interface TariffShapeInput {
  readonly kind: 'TARIFF_BED_DAY' | 'TARIFF_OR_TIME';
  readonly bedCategoryConceptId?: string | null;
  readonly careSpaceId?: string | null;
  readonly unitMinutes?: number | null;
  readonly minimumUnits?: number | null;
  readonly unitPrice: string;
  readonly validFrom: string;
  readonly validTo?: string | null;
}

/**
 * Coherencia de una tarifa nueva con su tipo (los CHECK de la base, antes de llegar a ellos):
 *
 * - día-cama: categoría **o** sala, sin `unit_minutes` ni `minimum_units` (nunca «0,5 días»);
 * - quirófano por tiempo: `unit_minutes` > 0, sin categoría de cama;
 * - precio no negativo; cierre posterior al inicio.
 */
export function validateTariffShape(
  input: TariffShapeInput,
): TariffShapeError[] {
  const errors: TariffShapeError[] = [];
  if (input.kind === 'TARIFF_BED_DAY') {
    if (!input.bedCategoryConceptId && !input.careSpaceId)
      errors.push({
        field: 'bedCategoryCode',
        message:
          'Una tarifa de día-cama exige categoría de cama o una sala propia',
      });
    if (input.unitMinutes != null || input.minimumUnits != null)
      errors.push({
        field: 'unitMinutes',
        message:
          'El día-cama se cobra por día entero: no lleva unidad de tiempo ni mínimo',
      });
  } else {
    if (!input.unitMinutes || input.unitMinutes <= 0)
      errors.push({
        field: 'unitMinutes',
        message: 'Una tarifa de quirófano exige la unidad de tiempo en minutos',
      });
    if (input.bedCategoryConceptId)
      errors.push({
        field: 'bedCategoryCode',
        message: 'Una tarifa de quirófano no lleva categoría de cama',
      });
  }
  if (input.minimumUnits != null && input.minimumUnits < 1)
    errors.push({
      field: 'minimumUnits',
      message: 'El mínimo es de al menos 1 unidad',
    });
  if (!/^\d+(\.\d{1,6})?$/.test(input.unitPrice))
    errors.push({
      field: 'unitPrice',
      message: 'El precio es un decimal no negativo con hasta 6 decimales',
    });
  if (input.validTo && input.validTo <= input.validFrom)
    errors.push({
      field: 'validTo',
      message: 'El cierre tiene que ser posterior al inicio de la vigencia',
    });
  return errors;
}
