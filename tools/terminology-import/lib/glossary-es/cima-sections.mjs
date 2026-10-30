// =============================================================================
// Lógica pura de `import-cima-sections.mjs` (TAREA-41 F4): de qué producto se
// piden las secciones que faltan y cuáles faltan. Sin red ni disco.
// =============================================================================

/**
 * Producto de referencia de una fila `cima.ndjson`, reconstruido de lo que la
 * fila ya trae (así no hace falta volver a listar ni pedir el detalle).
 * @returns {{ nregistro: string, name: string, fichaTecnicaUrl: string|null, fichaTecnicaDate: string|null }|null}
 */
export function referenceOf(row) {
  const facts = row.drugFacts ?? {};
  const section = facts.sections?.[0];
  const ref = facts.referenceProduct;
  const nregistro = ref?.nregistro ?? section?.nregistro;
  if (!nregistro) return null;
  return {
    nregistro: String(nregistro),
    name: ref?.name ?? section?.productName ?? null,
    fichaTecnicaUrl: section?.documentUrl ?? ref?.fichaTecnicaUrl ?? null,
    fichaTecnicaDate: section?.documentDate ?? ref?.fichaTecnicaDate ?? null,
  };
}

/** Secciones de `wanted` que la fila todavía no tiene, en el orden pedido. */
export function missingSections(row, wanted) {
  const have = new Set((row.drugFacts?.sections ?? []).map((s) => s.section));
  return wanted.filter((section) => !have.has(section));
}
