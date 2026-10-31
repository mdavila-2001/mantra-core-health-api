/**
 * Doble de `SupportActivityRepository` para las pruebas de los servicios que
 * solo necesitan que los nombres y la actividad vengan vacíos: cada lectura
 * responde un mapa vacío. Recibe la fábrica de `jest.fn` de la prueba para no
 * atar este archivo a una forma de importar `jest`.
 *
 * @param mockFn - Fábrica de funciones simuladas de la prueba.
 * @returns El repositorio simulado.
 */
export function namesRepoDouble(
  mockFn: (impl?: any) => any,
): Record<string, any> {
  const empty = (): any => mockFn().mockResolvedValue(new Map());
  return {
    userNames: empty(),
    profileNames: empty(),
    tenantNames: empty(),
    serviceNames: empty(),
    locationNames: empty(),
    doctorNamesByRoleAssignment: empty(),
    lastActivity: empty(),
    lastPersonConfirmations: empty(),
    scan: mockFn().mockResolvedValue([]),
    attributions: mockFn().mockResolvedValue({
      byBooking: new Map(),
      byAppointment: new Map(),
      byDelegate: new Map(),
      byGrant: new Map(),
    }),
  };
}
