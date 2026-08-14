import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Procedures } from '../../clinical/entities';
import { ProcedureBodySites } from '../entities';
import { createdBy } from '../../../common';

/** Datos de alta de un procedimiento odontológico. */
export interface CreateDentalProcedureData {
  /**
   * Organización que custodia el registro.
   */
  custodianTenantId: string;
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId: string;
  /**
   * Identificador asociado a code concept.
   */
  codeConceptId: string;
  /**
   * Identificador asociado a category concept.
   */
  categoryConceptId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a performer profile.
   */
  performerProfileId?: string;
  /**
   * Identificador asociado a encounter.
   */
  encounterId?: string;
  /**
   * Nota clínica del tratamiento.
   */
  noteText?: string;
  /**
   * Cuándo se realizó.
   */
  performedAt?: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Sitio odontológico —pieza o cuadrante— del procedimiento. */
export interface CreateDentalSiteData {
  /**
   * Identificador asociado a procedure.
   */
  procedureId: string;
  /**
   * Pieza (FDI) o cuadrante tratado.
   */
  bodySiteConceptId: string;
  /**
   * Papel del sitio dentro del procedimiento.
   */
  roleConceptId: string;
  /**
   * Cara, superficie u otra precisión escrita.
   */
  description?: string;
}

/**
 * Acceso a datos del registro odontológico (stateless).
 *
 * ## Por qué vive acá y no en `clinical`
 *
 * Escribe y lee `clinical.procedures`, que es de otro módulo, pero la
 * **combinación** —procedimiento con categoría odontológica más su pieza en
 * `procedure_body_sites`— es de éste: `procedure_body_sites` es una tabla del
 * esquema perioperatorio. Ponerlo en `clinical` obligaría a ese módulo a
 * conocer una tabla que no es suya; ponerlo acá sólo repite el patrón que el
 * módulo ya usa con `ProfessionalCredentialsRepository` de `profiles`.
 *
 * No se reutiliza `ProceduresRepository` de `clinical` porque su
 * `CreateProcedureData` no admite `note_text`, y la nota clínica **es** el
 * registro odontológico: sin ella queda un código y una fecha. Extenderlo
 * sería editar un módulo ajeno; escribir la entidad desde acá, no.
 */
@Injectable()
export class PeriopDentalRepository {
  /**
   * Crea el procedimiento odontológico como procedimiento clínico.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns La fila creada, todavía sin flushear.
   */
  createProcedure(
    em: EntityManager,
    data: CreateDentalProcedureData,
  ): Procedures {
    return em.create(
      Procedures,
      {
        custodianTenantId: data.custodianTenantId,
        patientProfileId: data.patientProfileId,
        encounterId: data.encounterId,
        codeConceptId: data.codeConceptId,
        categoryConceptId: data.categoryConceptId,
        statusConceptId: data.statusConceptId,
        performerProfileId: data.performerProfileId,
        recorderProfileId: data.performerProfileId,
        noteText: data.noteText,
        performedAt: data.performedAt,
        occurrenceStartAt: data.performedAt,
        recordedAt: new Date(),
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Crea el sitio tratado —pieza o cuadrante— del procedimiento.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns La fila creada, todavía sin flushear.
   */
  createSite(
    em: EntityManager,
    data: CreateDentalSiteData,
  ): ProcedureBodySites {
    return em.create(
      ProcedureBodySites,
      {
        procedureId: data.procedureId,
        bodySiteConceptId: data.bodySiteConceptId,
        roleConceptId: data.roleConceptId,
        description: data.description,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  /**
   * Histórico odontológico de un paciente, del más reciente al más antiguo.
   *
   * Se ordena por `performedAt` y no por `createdAt`: el histórico es clínico
   * —cuándo se trató a la persona—, no de auditoría. Un tratamiento cargado con
   * retraso tiene que caer en su lugar, no arriba de todo. `createdAt` desempata
   * los que comparten fecha, que es lo corriente cuando sólo se carga el día.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param patientProfileId - Paciente consultado.
   * @param categoryConceptId - Categoría que marca el procedimiento odontológico.
   * @param limit - Tope de filas.
   * @returns Los procedimientos odontológicos de la persona.
   */
  findByPatient(
    em: EntityManager,
    patientProfileId: string,
    categoryConceptId: string,
    limit: number,
  ): Promise<Procedures[]> {
    return em.find(
      Procedures,
      { patientProfileId, categoryConceptId },
      {
        orderBy: { performedAt: 'DESC', createdAt: 'DESC' },
        limit,
      },
    );
  }

  /**
   * Cuántos procedimientos odontológicos tiene la persona, sin paginar.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param patientProfileId - Paciente consultado.
   * @param categoryConceptId - Categoría que marca el procedimiento odontológico.
   * @returns El total de filas que cumplen el filtro.
   */
  countByPatient(
    em: EntityManager,
    patientProfileId: string,
    categoryConceptId: string,
  ): Promise<number> {
    return em.count(Procedures, { patientProfileId, categoryConceptId });
  }

  /**
   * Sitios tratados de un conjunto de procedimientos.
   *
   * En una sola consulta y no una por procedimiento. La lista vacía se resuelve
   * sin ir a la base: `IN ()` no es SQL válido.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param procedureIds - Procedimientos cuyos sitios se buscan.
   * @returns Los sitios de esos procedimientos.
   */
  findSitesByProcedures(
    em: EntityManager,
    procedureIds: readonly string[],
  ): Promise<ProcedureBodySites[]> {
    if (procedureIds.length === 0) {
      return Promise.resolve([]);
    }
    return em.find(ProcedureBodySites, {
      procedureId: { $in: [...procedureIds] },
    });
  }
}
