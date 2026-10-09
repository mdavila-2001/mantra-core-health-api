import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { INS } from '../insurance.concepts';
import { PRAC } from '../../practice/practice.concepts';
import type { PractitionerInsuranceNetworkDto } from '../dto/practitioner-insurance-network.dto';

/** Una fila de la consulta, tal como la devuelve Postgres. */
interface NetworkRow {
  membership_id: string;
  carrier_id: string;
  carrier_name: string;
  network_name: string;
  effective_from: Date | string | null;
  effective_to: Date | string | null;
}

/**
 * Con qué aseguradoras trabaja un profesional, leído desde su lado.
 *
 * El dato ya existe: `insurance.network_provider_memberships` vincula una red
 * de prestadores de una aseguradora con un prestador. Lo que faltaba era la
 * lectura del médico; sin ella «Mi perfil» decía «No pudimos traer tus
 * seguros» porque la ruta que pide el portal no existía (contrato en
 * `mantra-core-health/docs/pendientes-backend-seguros-del-medico.md`).
 *
 * Una membresía cuenta para el médico por dos caminos:
 * 1. **Por la práctica donde atiende**: `addMembership` crea toda membresía
 *    con `practice_id`, así que vale para cada médico con una vinculación
 *    activa y vigente en esa práctica (la misma fuente que
 *    `GET /practitioners/:id/sites`), incluido su consultorio propio.
 * 2. **Individual**: `practitioner_role_assignment_id` apunta a una
 *    vinculación de ese perfil. Hoy ninguna ruta la crea; se lee igual.
 *
 * Sólo membresías y redes activas, vigentes hoy. `DISTINCT` deja una fila por
 * membresía aunque los dos caminos la encuentren.
 */
@Injectable()
export class PractitionerInsuranceNetworksService {
  constructor(private readonly em: EntityManager) {}

  async listForPractitioner(
    practitionerProfileId: string,
  ): Promise<PractitionerInsuranceNetworkDto[]> {
    const rows = await this.em
      .fork()
      .getConnection()
      .execute<NetworkRow[]>(
        `select distinct m.id as membership_id,
              ca.id as carrier_id,
              ca.legal_name as carrier_name,
              n.name as network_name,
              m.effective_from,
              m.effective_to
         from insurance.network_provider_memberships m
         join insurance.provider_networks n on n.id = m.provider_network_id
         join insurance.insurance_carriers ca on ca.id = n.insurance_carrier_id
         join practice.practitioner_role_assignments ra
           on ra.practitioner_profile_id = ?
          and ra.status_concept_id = ?
          and ra.valid_to is null
          and (ra.id = m.practitioner_role_assignment_id
               or (m.practice_id is not null and ra.practice_id = m.practice_id))
        where m.status_concept_id = ?
          and n.status_concept_id = ?
          and (m.effective_from is null or m.effective_from <= current_date)
          and (m.effective_to is null or m.effective_to >= current_date)`,
        [
          practitionerProfileId,
          PRAC.ROLE_ASSIGNMENT_ACTIVE,
          INS.MEMBERSHIP_ACTIVE,
          INS.NETWORK_ACTIVE,
        ],
      );
    return rows.map((row) => ({
      membershipId: row.membership_id,
      carrierId: row.carrier_id,
      carrierName: row.carrier_name,
      networkName: row.network_name,
      effectiveFrom: soloDate(row.effective_from),
      effectiveTo: soloDate(row.effective_to),
    }));
  }
}

/** `YYYY-MM-DD` de una columna `date`, o `null`. */
function soloDate(valor: Date | string | null): string | null {
  if (valor === null) return null;
  return typeof valor === 'string'
    ? valor.slice(0, 10)
    : valor.toISOString().slice(0, 10);
}
