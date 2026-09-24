import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ProfessionalCredentials } from '../entities';
import { PROF } from '../profiles.concepts';
import { CONCEPTS, createdBy } from '../../../common';

/**
 * Estados en los que una credencial profesional acredita que su titular puede
 * ejercer.
 *
 * `PROF.CRED_VERIFIED` es el que escribe `verifyCredential`, el único acto que
 * verifica una matrícula en todo el sistema. Faltaba de esta lista, que sólo
 * miraba los estados transversales: las dos mitades del mismo hecho usaban
 * catálogos distintos, así que **ninguna credencial verificada contaba jamás
 * como vigente**. Aguas abajo eso bloqueaba el circuito quirúrgico entero
 * (CAN-INT-002): ningún integrante podía acreditarse y ningún caso podía
 * confirmarse, por muy en regla que estuviera la matrícula.
 *
 * Los dos transversales se conservan porque hay filas antiguas escritas con
 * ellos y quitarlos las invalidaría de golpe.
 */
const CURRENT_CREDENTIAL_STATES: readonly string[] = [
  PROF.CRED_VERIFIED,
  CONCEPTS.STATE_VERIFIED,
  CONCEPTS.STATE_ACTIVE,
];

/** Datos de una credencial profesional. */
export interface CreateCredentialData {
  /**
   * Identificador asociado a practitioner profile.
   */
  practitionerProfileId: string;
  /**
   * Identificador asociado a credential type concept.
   */
  credentialTypeConceptId: string;
  /**
   * Valor de number mantenido por la instancia.
   */
  number: string;
  /**
   * Valor de issuing institution text mantenido por la instancia.
   */
  issuingInstitutionText?: string;
  /**
   * Cuándo se emitió. Sin ella, una línea de tiempo de formación no se puede
   * ordenar y se lee como una lista de títulos sueltos.
   */
  issueDate?: Date;
  /**
   * Valor de verification source uri mantenido por la instancia.
   */
  verificationSourceUri?: string;
  /**
   * Identificador asociado a state concept.
   */
  stateConceptId: string;
  /**
   * El archivo del diploma. `em.create` sólo escribe lo que este objeto nombra,
   * así que omitirlo acá dejaría la columna en `NULL` sin que nada fallara.
   */
  fileId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `profiles.professional_credentials`. */
@Injectable()
export class ProfessionalCredentialsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<ProfessionalCredentials | null>`.
   */
  findById(
    em: EntityManager,
    id: string,
  ): Promise<ProfessionalCredentials | null> {
    return em.findOne(ProfessionalCredentials, { id });
  }

  /**
   * Obtiene una credencial dentro de una transacción, reservando la fila para
   * que edición, retiro y verificación no se pisen entre sí.
   */
  findByIdForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<ProfessionalCredentials | null> {
    return em.findOne(
      ProfessionalCredentials,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `ProfessionalCredentials`.
   */
  create(
    em: EntityManager,
    data: CreateCredentialData,
  ): ProfessionalCredentials {
    return em.create(
      ProfessionalCredentials,
      {
        practitionerProfileId: data.practitionerProfileId,
        credentialTypeConceptId: data.credentialTypeConceptId,
        number: data.number,
        issuingInstitutionText: data.issuingInstitutionText,
        issueDate: data.issueDate,
        verificationSourceUri: data.verificationSourceUri,
        stateConceptId: data.stateConceptId,
        fileId: data.fileId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * ¿Tiene el profesional al menos una credencial VIGENTE en este instante?
   * Fuente autoritativa de C-14/CAN-INT-002: la credencial debe estar en estado
   * verificado/activo (no suspendida ni no verificada) y no expirada
   * (`expiry_date` nula o futura). Reemplaza al proxy de "estado del miembro del
   * equipo" que no detectaba una credencial vencida/suspendida.
   */
  async hasCurrentCredential(
    em: EntityManager,
    practitionerProfileId: string,
    now: Date,
  ): Promise<boolean> {
    const count = await em.count(ProfessionalCredentials, {
      practitionerProfileId,
      stateConceptId: { $in: [...CURRENT_CREDENTIAL_STATES] },
      $or: [{ expiryDate: null }, { expiryDate: { $gte: now } }],
    });
    return count > 0;
  }

  /**
   * Las credenciales del profesional: títulos, posgrados y certificaciones.
   *
   * Es **la trayectoria formativa** — lo que en un perfil profesional se lee
   * como «estudios»—. Se devuelven todas, incluidas las vencidas y las que no
   * llegaron a verificarse: una certificación que caducó sigue siendo formación
   * cursada, y ocultarla dejaría huecos inexplicables en la línea de tiempo.
   * Qué hacer con cada estado lo decide quien la muestra, no esta consulta.
   *
   * @param em - Contexto de persistencia.
   * @param practitionerProfileId - Perfil profesional dueño de las credenciales.
   * @returns Sus credenciales, de la más reciente a la más antigua.
   */
  findByPractitioner(
    em: EntityManager,
    practitionerProfileId: string,
  ): Promise<ProfessionalCredentials[]> {
    return em.find(
      ProfessionalCredentials,
      { practitionerProfileId },
      { orderBy: { issueDate: 'desc', createdAt: 'desc' } },
    );
  }

  /**
   * Borra una credencial (ALV-009/formación: retirar un título propio
   * cargado por error, sólo mientras está pendiente — la regla de negocio
   * vive en el servicio, acá sólo el borrado físico).
   */
  remove(em: EntityManager, row: ProfessionalCredentials): void {
    em.remove(row);
  }

  /**
   * Nº de credenciales del profesional que siguen en un estado dado (típicamente
   * "pendiente"), excluyendo una credencial concreta. Sirve para decidir si el
   * profesional pasa a verificado cuando ya no le quedan credenciales pendientes.
   */
  countInStateExcept(
    em: EntityManager,
    practitionerProfileId: string,
    stateConceptId: string,
    exceptId: string,
  ): Promise<number> {
    return em.count(ProfessionalCredentials, {
      practitionerProfileId,
      stateConceptId,
      id: { $ne: exceptId },
    });
  }
}
