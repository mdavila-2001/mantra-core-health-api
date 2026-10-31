import {
  countGrantsSinceCertification,
  effectiveAtoms,
  privilegeCreep,
  type PrivilegeCreepResult,
} from '../domain';
import type { WorldEngagement } from './governance-world';

/**
 * Acumulación de privilegios de UN vínculo (§6.6, D-20): `puntaje = Σ peso por
 * átomo efectivo distinto`, `deriva = puntaje − puntaje del paquete v2 de su
 * plantilla`; marca si la deriva llega al umbral o si se le agregaron ≥ 2
 * concesiones desde su última certificación sin pasar por revisión. Es la misma
 * cuenta para el informe y para la anomalía.
 *
 * @param e - Vínculo con sus concesiones.
 * @param now - Reloj.
 * @param threshold - Umbral de deriva (ajuste `creepThreshold`).
 */
export function creepOfEngagement(
  e: WorldEngagement,
  now: Date,
  threshold: number,
): PrivilegeCreepResult {
  return privilegeCreep({
    atoms: effectiveAtoms(e.grants, now),
    templateCode: e.templateCode,
    threshold,
    grantsSinceCertification: countGrantsSinceCertification({
      grants: e.grants.map((g) => ({
        createdAt: g.createdAt ?? e.createdAt,
        effect: g.effect,
      })),
      lastCertifiedAt: e.lastCertifiedAt,
      engagementCreatedAt: e.createdAt,
    }),
  });
}
