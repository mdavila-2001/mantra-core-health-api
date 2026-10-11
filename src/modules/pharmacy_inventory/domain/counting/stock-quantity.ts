/** Cantidad persistida como texto convertida al número que usa el conteo. */
export function numericQuantity(value: string | null | undefined): number {
  return value == null ? 0 : Number(value);
}

/** Disponible luego de actualizar el on-hand, preservando reservas y cuarentena. */
export function recomputeAvailableQuantity(
  onHand: string,
  reserved: string,
  quarantine: string,
): string {
  return String(
    numericQuantity(onHand) -
      numericQuantity(reserved) -
      numericQuantity(quarantine),
  );
}
