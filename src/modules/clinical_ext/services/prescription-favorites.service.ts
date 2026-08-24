import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import {
  MAX_FAVORITES_PER_PRACTITIONER,
  PrescriptionFavoritesRepository,
} from '../repositories';
import { ProfileOwnershipService } from '../../profiles/services/profile-ownership.service';
import { PrescriptionFavorites } from '../entities';
import {
  CreatePrescriptionFavoriteDto,
  PrescriptionFavoriteResponseDto,
} from '../dto';

/**
 * Favoritos de prescripción del profesional (Patch v4.1.7).
 *
 * Es la lista personal de indicaciones repetidas: la amoxicilina de siempre,
 * guardada con un rótulo para no volver a tipearla. Tres reglas gobiernan todo
 * este servicio:
 *
 * 1. **El dueño se deduce de la sesión, nunca del cuerpo.** El
 *    `practitionerProfileId` sale de {@link ProfileOwnershipService}; si viniera
 *    por parámetro, cualquiera podría escribir en la lista de otro y la
 *    comprobación no comprobaría nada.
 * 2. **Aplicar un favorito no pasa por acá.** El front rellena su formulario y
 *    prescribe por el camino normal: la receta resultante es una
 *    `clinical.medication_requests` con su firma y su emisión. Un atajo que
 *    creara recetas desde este módulo sería una segunda puerta a la prescripción.
 * 3. **Se borra, no se archiva.** No hay estado: una lista de conveniencia sin
 *    obligación de conservación clínica se elimina de verdad.
 */
@Injectable()
export class PrescriptionFavoritesService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param favoritesRepo - Acceso a los favoritos del profesional.
   * @param ownership - Resuelve de qué profesional es la sesión.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly favoritesRepo: PrescriptionFavoritesRepository,
    private readonly ownership: ProfileOwnershipService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PrescriptionFavoritesService.name);
  }

  /** Proyección estable de un favorito a su DTO de respuesta. */
  private toResponse(
    favorite: PrescriptionFavorites,
  ): PrescriptionFavoriteResponseDto {
    return {
      id: favorite.id,
      name: favorite.name,
      medicationConceptId: favorite.medicationConceptId,
      substanceAtcConceptId: favorite.substanceAtcConceptId,
      doseText: favorite.doseText,
      routeConceptId: favorite.routeConceptId,
      frequencyText: favorite.frequencyText,
      quantityDecimal: favorite.quantityDecimal,
      unitConceptId: favorite.unitConceptId,
      patientInstructionsText: favorite.patientInstructionsText,
    };
  }

  /**
   * Los favoritos del profesional de la sesión.
   *
   * Se devuelven completos y ordenados por rótulo: es una lista personal que el
   * front consume entera en un desplegable, y paginarla obligaría a pedir
   * páginas para llenar un `select`.
   *
   * @param actor - Quien pide la operación.
   * @returns Sus favoritos, ordenados por rótulo.
   */
  async listOwn(
    actor: AuthenticatedUser,
  ): Promise<PrescriptionFavoriteResponseDto[]> {
    const em = this.em.fork();
    const practitionerProfileId =
      await this.ownership.requireOwnPractitionerProfileId(em, actor);
    const favorites = await this.favoritesRepo.findByPractitioner(
      em,
      practitionerProfileId,
    );
    return favorites.map((favorite) => this.toResponse(favorite));
  }

  /**
   * Guarda un favorito en la lista del profesional de la sesión.
   *
   * El rótulo duplicado se rechaza con 409 en vez de pisar el anterior: dos
   * favoritos con el mismo nombre son indistinguibles en la lista, y el que
   * pierde se pierde sin que nadie se entere.
   *
   * @param dto - Datos del favorito.
   * @param actor - Quien pide la operación.
   * @returns El favorito guardado.
   * @throws ConflictException si ya existe uno con ese rótulo.
   * @throws PreconditionFailedException si la lista llegó a su techo.
   */
  async create(
    dto: CreatePrescriptionFavoriteDto,
    actor: AuthenticatedUser,
  ): Promise<PrescriptionFavoriteResponseDto> {
    return this.em.transactional(async (tx) => {
      const practitionerProfileId =
        await this.ownership.requireOwnPractitionerProfileId(tx, actor);

      const cuantos = await this.favoritesRepo.countByPractitioner(
        tx,
        practitionerProfileId,
      );
      if (cuantos >= MAX_FAVORITES_PER_PRACTITIONER) {
        throw new PreconditionFailedException(
          'La lista de favoritos llegó a su máximo; borrá alguno antes de guardar otro',
          { max: MAX_FAVORITES_PER_PRACTITIONER },
        );
      }

      const existentes = await this.favoritesRepo.findByPractitioner(
        tx,
        practitionerProfileId,
      );
      if (existentes.some((favorite) => favorite.name === dto.name)) {
        throw new ConflictException('Ya tenés un favorito con ese nombre', {
          name: dto.name,
        });
      }

      const favorite = this.favoritesRepo.create(tx, {
        practitionerProfileId,
        name: dto.name,
        medicationConceptId: dto.medicationConceptId,
        substanceAtcConceptId: dto.substanceAtcConceptId,
        doseText: dto.doseText,
        routeConceptId: dto.routeConceptId,
        frequencyText: dto.frequencyText,
        quantityDecimal:
          dto.quantityDecimal !== undefined
            ? String(dto.quantityDecimal)
            : undefined,
        unitConceptId: dto.unitConceptId,
        patientInstructionsText: dto.patientInstructionsText,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        {
          operation: 'clinical_ext.prescriptionFavorite.create',
          favoriteId: favorite.id,
        },
        'Prescription favorite saved',
      );
      return this.toResponse(favorite);
    });
  }

  /**
   * Borra un favorito de la lista del profesional de la sesión.
   *
   * Un favorito ajeno responde 404 y no 403: que exista la lista de otro no es
   * información que esta ruta deba confirmar.
   *
   * @param favoriteId - Identificador del favorito.
   * @param actor - Quien pide la operación.
   * @throws ResourceNotFoundException si no existe o no es suyo.
   */
  async remove(favoriteId: string, actor: AuthenticatedUser): Promise<void> {
    await this.em.transactional(async (tx) => {
      const practitionerProfileId =
        await this.ownership.requireOwnPractitionerProfileId(tx, actor);
      const favorite = await this.favoritesRepo.findById(tx, favoriteId);
      if (favorite?.practitionerProfileId !== practitionerProfileId) {
        throw new ResourceNotFoundException('Favorito no encontrado', {
          favoriteId,
        });
      }
      tx.remove(favorite);
      await tx.flush();

      this.logger.info(
        { operation: 'clinical_ext.prescriptionFavorite.remove', favoriteId },
        'Prescription favorite removed',
      );
    });
  }
}
