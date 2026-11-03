import type { InfraPolicy } from '../domain/ops/infra-scope';

/**
 * Lecturas de la ficha de espacio de F5 (pestañas «Stock» y «Equipos», y la
 * lista de equipos por sede). §F5c: «Enfermería R (botiquín de su unidad)»;
 * §F5a: Mantenimiento ve los equipos. Lo que se ve se filtra por el alcance
 * (`scopeFilter`): una asignación de unidad o de espacio sólo ve lo suyo.
 */
export const INFRA_F5_ASSETS_POLICY: InfraPolicy = {
  name: 'F5-assets',
  actions: {
    'f5.space.stock.read': {
      roles: [
        'SUPERADMIN',
        'ORG_ADMIN',
        'SITE_ADMIN',
        'NURSE',
        'NURSE_SUPERVISOR',
        'UNIT_HEAD',
      ],
    },
    'f5.space.equipment.read': {
      roles: [
        'SUPERADMIN',
        'ORG_ADMIN',
        'SITE_ADMIN',
        'MAINTENANCE',
        'NURSE_SUPERVISOR',
        'UNIT_HEAD',
      ],
    },
  },
};
