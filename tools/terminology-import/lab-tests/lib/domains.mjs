// =============================================================================
// Dominio AloVida de un término LOINC (laboratorio, imagen, patología,
// genética, funcional), derivado SÓLO de lo que declara LOINC: `CLASS` y
// `CLASSTYPE` (1 = laboratorio, 2 = clínico, 3 = adjuntos de reclamos,
// 4 = encuestas). La clase LOINC sigue siendo la categoría fina; el dominio es
// navegación, no un dato clínico, y la regla aplicada queda en el registro
// (`domainRule`). Lo que ninguna regla reconoce queda SIN dominio y aparece en
// el reporte de cobertura con su conteo, para que una persona lo decida: no se
// adivina.
// =============================================================================

/** Reglas en orden; la primera que coincide gana. `base` es la clase sin el prefijo `PANEL.`. */
export const DOMAIN_RULES = [
  { id: 'classtype-3-4-excluded', domain: null, test: ({ classType }) => classType === '3' || classType === '4' },
  { id: 'class-RAD*', domain: 'imaging', test: ({ base }) => /^RAD/.test(base) },
  { id: 'class-OB.US*', domain: 'imaging', test: ({ base }) => /^OB\.US/.test(base) },
  { id: 'class-MOLPATH*', domain: 'genetics', test: ({ base }) => /^MOLPATH/.test(base) },
  { id: 'class-HLA', domain: 'genetics', test: ({ base }) => base === 'HLA' },
  { id: 'class-GEN*', domain: 'genetics', test: ({ base }) => /^GEN(E|ETIC)/.test(base) },
  { id: 'class-PATH*', domain: 'pathology', test: ({ base }) => /^PATH/.test(base) },
  { id: 'class-CYTO*', domain: 'pathology', test: ({ base }) => /^CYTO/.test(base) },
  // CARD.RISK son puntajes de riesgo (Framingham, SCORE…) y CARD.PROC mezcla mediciones de cateterismo con
  // intervenciones (angioplastía, tiempo puerta-balón): quedan sin dominio.
  { id: 'classtype-2-class-CARD.RISK|CARD.PROC-excluded', domain: null, test: ({ classType, base }) => classType === '2' && /^CARD\.(RISK|PROC)$/.test(base) },
  { id: 'classtype-2-class-EKG*|CARD*', domain: 'functional', test: ({ classType, base }) => classType === '2' && /^(EKG|ECG|CARD)/.test(base) },
  { id: 'classtype-2-class-PULM*', domain: 'functional', test: ({ classType, base }) => classType === '2' && /^PULM/.test(base) },
  { id: 'classtype-2-class-EEG*|EMG*|NEURO*', domain: 'functional', test: ({ classType, base }) => classType === '2' && /^(EEG|EMG|NEURO)/.test(base) },
  { id: 'classtype-2-class-HEMODYN*', domain: 'functional', test: ({ classType, base }) => classType === '2' && /^HEMODYN/.test(base) },
  // Añadidas al ver las clases reales de LOINC 2.82 (tx.fhir.org) y muestras de sus términos.
  { id: 'class-US.*', domain: 'imaging', test: ({ base }) => /^US\./.test(base) },
  { id: 'classtype-2-class-EYE.ANGIO', domain: 'imaging', test: ({ classType, base }) => classType === '2' && base === 'EYE.ANGIO' },
  {
    id: 'classtype-2-class-EYE.(OCT|ERG|VISUAL_FIELD|TONOMETRY|REFRACTION|SPECULAR MICROSCOPY|HETEROPHORIA)',
    domain: 'functional',
    test: ({ classType, base }) => classType === '2' && /^EYE\.(OCT|ERG|VISUAL_FIELD|TONOMETRY|REFRACTION|SPECULAR MICROSCOPY|HETEROPHORIA)(\.|$)/.test(base),
  },
  { id: 'classtype-2-class-AUDIO', domain: 'functional', test: ({ classType, base }) => classType === '2' && base === 'AUDIO' },
  { id: 'classtype-2-class-GI', domain: 'functional', test: ({ classType, base }) => classType === '2' && base === 'GI' },
  { id: 'classtype-1-laboratory', domain: 'laboratory', test: ({ classType }) => classType === '1' },
];

/** @returns {{ domain: string|null, rule: string|null }} */
export function loincDomain(loincClass, classType) {
  const cls = String(loincClass ?? '').trim().toUpperCase();
  const ctx = { classType: String(classType ?? '').trim(), cls, base: cls.replace(/^PANEL\./, '') };
  for (const r of DOMAIN_RULES) if (r.test(ctx)) return { domain: r.domain, rule: r.domain ? `loinc:${r.id}` : null };
  return { domain: null, rule: null };
}
