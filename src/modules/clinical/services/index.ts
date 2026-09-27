export * from './care-episodes.service';
export * from './encounters.service';
export * from './encounter-seal.service';
// BR-14 (CL-07): guarda independiente que rechaza escrituras sobre un
// encuentro ya sellado. Archivo y clase nuevos (no modifica
// `EncounterSealService`), exportada para que `ChartModule` la use también.
export * from './encounter-seal-guard.service';
export * from './observations.service';
export * from './service-requests.service';
export * from './duplicate-study-detector';
export * from './diagnostic-reports.service';
export * from './conditions.service';
export * from './allergy-intolerances.service';
export * from './medications.service';
export * from './medical-aspects.service';
export * from './prescription-signature-policies.service';
export * from './procedures.service';
export * from './immunizations.service';
export * from './clinical-read.service';
// B.3 — el PDF oficial de receta y su verificación pública. `prescription-seal`,
// `alovida-mark` y `prescription-qr` son colaboradores internos (funciones
// puras y helpers de `pdfkit`, no providers de Nest) y no se exportan acá.
export * from './prescription-pdf.service';
// Carril P1: los disparadores in-app de receta y encuentro. Va al final porque
// es el único servicio de `clinical` que no registra nada clínico — sólo avisa.
export { ClinicalNotificationsService } from './clinical-notifications.service';
