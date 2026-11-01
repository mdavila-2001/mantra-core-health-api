/**
 * Registro de «partes» de la app (03 §2.1): resuelve la plantilla de ruta que
 * mandan los eventos y los errores a su `route_code`, dominio y superficie.
 * La unión es la taxonomía: los eventos siguen llevando `route_template`.
 */

export interface PartRow {
  readonly routeCode: string;
  readonly routePattern: string;
  readonly pageTitle: string;
  readonly domain: string | null;
  readonly surface: string;
  readonly active: boolean;
}

/** Superficies en las que puede vivir cada portal del evento. */
const SURFACES_BY_PORTAL: Record<string, readonly string[]> = {
  WEB: ['WEB', 'INSIGHTS', 'WEB_PUBLICO'],
  MOBILE: ['MOBILE'],
};

export class PartsRegistry {
  private readonly byPattern = new Map<string, PartRow[]>();
  private readonly byCode = new Map<string, PartRow>();

  constructor(readonly rows: readonly PartRow[]) {
    for (const row of rows) {
      const list = this.byPattern.get(row.routePattern) ?? [];
      list.push(row);
      this.byPattern.set(row.routePattern, list);
      this.byCode.set(row.routeCode, row);
    }
  }

  /** La parte de una plantilla, o `null` si no casa con ninguna (cubo «sin parte»). */
  resolve(
    routeTemplate: string | null | undefined,
    portal = 'WEB',
  ): PartRow | null {
    if (!routeTemplate) return null;
    const candidates = this.byPattern.get(routeTemplate);
    if (!candidates?.length) return null;
    const surfaces = SURFACES_BY_PORTAL[portal] ?? SURFACES_BY_PORTAL.WEB;
    return (
      surfaces
        .map((s) => candidates.find((c) => c.surface === s))
        .find((c): c is PartRow => c !== undefined) ?? null
    );
  }

  byRouteCode(code: string): PartRow | null {
    return this.byCode.get(code) ?? null;
  }

  /** Todas las plantillas que corresponden a un `route_code` (una por superficie). */
  patternsOf(code: string): string[] {
    const part = this.byCode.get(code);
    return part ? [part.routePattern] : [];
  }
}
