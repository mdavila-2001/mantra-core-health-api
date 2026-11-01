/** Una URL base no transporta credenciales: la clave usa su campo cifrado. */
export function isSafePharmacySystemBaseUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash
    );
  } catch {
    return false;
  }
}
