import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PrescriptionFavorites } from '../entities';
import { createdBy } from '../../../common';

/**
 * Techo de la lista personal de favoritos.
 *
 * No es paginación: es un fusible. La lista la escribe una persona a mano y se
 * consume entera en un desplegable, así que doscientos es un número que nadie
 * alcanza escribiendo y que igual acota la consulta si alguien automatiza altas.
 */
export const MAX_FAVORITES_PER_PRACTITIONER = 200;

/** Datos para crear un favorito de prescripción. */
export interface CreatePrescriptionFavoriteData {
  /**
   * Perfil profesional dueño del favorito.
   */
  practitionerProfileId: string;
  /**
   * Rótulo con el que el profesional lo reconoce en su lista.
   */
  name: string;
  /**
   * Identificador asociado a medication concept.
   */
  medicationConceptId: string;
  /**
   * Identificador asociado a substance atc concept.
   */
  substanceAtcConceptId?: string;
  /**
   * Posología por defecto.
   */
  doseText?: string;
  /**
   * Identificador asociado a route concept.
   */
  routeConceptId?: string;
  /**
   * Frecuencia por defecto.
   */
  frequencyText?: string;
  /**
   * Cantidad por defecto.
   */
  quantityDecimal?: string;
  /**
   * Identificador asociado a unit concept.
   */
  unitConceptId?: string;
  /**
   * Indicaciones al paciente por defecto.
   */
  patientInstructionsText?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a `clinical_ext.prescription_favorites`. */
@Injectable()
export class PrescriptionFavoritesRepository {
  /**
   * Los favoritos de un profesional, ordenados por su rótulo.
   *
   * Se ordena por `name` y no por fecha porque es una lista que se lee
   * buscando: el profesional sabe cómo llamó a su favorito, no cuándo lo creó.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practitionerProfileId - Perfil profesional dueño de la lista.
   * @returns Los favoritos del profesional.
   */
  findByPractitioner(
    em: EntityManager,
    practitionerProfileId: string,
  ): Promise<PrescriptionFavorites[]> {
    return em.find(
      PrescriptionFavorites,
      { practitionerProfileId },
      { orderBy: { name: 'ASC' }, limit: MAX_FAVORITES_PER_PRACTITIONER },
    );
  }

  /**
   * Un favorito por su identificador, sin filtrar por dueño.
   *
   * Quién puede tocarlo lo decide el servicio: acá no se mezcla búsqueda con
   * autorización, o el 404 y el 403 se vuelven indistinguibles.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador del favorito.
   * @returns El favorito, o `null` si no existe.
   */
  findById(
    em: EntityManager,
    id: string,
  ): Promise<PrescriptionFavorites | null> {
    return em.findOne(PrescriptionFavorites, { id });
  }

  /**
   * Cuántos favoritos tiene ya el profesional.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practitionerProfileId - Perfil profesional dueño de la lista.
   * @returns La cantidad de favoritos guardados.
   */
  countByPractitioner(
    em: EntityManager,
    practitionerProfileId: string,
  ): Promise<number> {
    return em.count(PrescriptionFavorites, { practitionerProfileId });
  }

  /**
   * Crea el favorito en el contexto de persistencia recibido.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos del favorito.
   * @returns La entidad creada, pendiente de `flush`.
   */
  create(
    em: EntityManager,
    data: CreatePrescriptionFavoriteData,
  ): PrescriptionFavorites {
    return em.create(
      PrescriptionFavorites,
      {
        practitionerProfileId: data.practitionerProfileId,
        name: data.name,
        medicationConceptId: data.medicationConceptId,
        substanceAtcConceptId: data.substanceAtcConceptId,
        doseText: data.doseText,
        routeConceptId: data.routeConceptId,
        frequencyText: data.frequencyText,
        quantityDecimal: data.quantityDecimal,
        unitConceptId: data.unitConceptId,
        patientInstructionsText: data.patientInstructionsText,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
