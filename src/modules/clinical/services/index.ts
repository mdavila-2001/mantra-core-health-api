export * from './care-episodes.service';
export * from './encounters.service';
export * from './encounter-seal.service';
export * from './observations.service';
export * from './service-requests.service';
export * from './diagnostic-reports.service';
export * from './conditions.service';
export * from './allergy-intolerances.service';
export * from './medications.service';
export * from './prescription-signature-policies.service';
export * from './procedures.service';
export * from './immunizations.service';
export * from './clinical-read.service';
// Carril P1: los disparadores in-app de receta y encuentro. Va al final porque
// es el único servicio de `clinical` que no registra nada clínico — sólo avisa.
export { ClinicalNotificationsService } from './clinical-notifications.service';
