import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  CatalogConceptsRepository,
  ConceptMapsRepository,
} from '../repositories';
import {
  type Equivalence,
  type TranslateConceptDto,
  type TranslateResponseDto,
} from '../dto';

/** Equivalencia declarada por el consumidor → concepto del catálogo. */
const EQUIVALENCE_CONCEPTS: Record<Equivalence, string> = {
  EQUIVALENT: CONCEPTS.EQUIV_EQUIVALENT,
  WIDER: CONCEPTS.EQUIV_WIDER,
  NARROWER: CONCEPTS.EQUIV_NARROWER,
  INEXACT: CONCEPTS.EQUIV_INEXACT,
  UNMATCHED: CONCEPTS.EQUIV_UNMATCHED,
};

/**
 * Mapeos entre conceptos de sistemas distintos (UC-03-09, FHIR `$translate`).
 *
 * El caso de uso cubre dos caminos por el mismo endpoint: el terminólogo **cura**
 * el mapa (escritura) y el consumidor FHIR lo **consulta** (sólo lectura). Se
 * distinguen por la presencia de `targetConceptId`.
 */
@Injectable()
export class ConceptMapsService {
  constructor(
    private readonly em: EntityManager,
    private readonly conceptMapsRepo: ConceptMapsRepository,
    private readonly conceptsRepo: CatalogConceptsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ConceptMapsService.name);
  }

  /** UC-03-09: cura un mapeo o consulta las traducciones de un concepto. */
  async translate(
    dto: TranslateConceptDto,
    actor: AuthenticatedUser,
  ): Promise<TranslateResponseDto> {
    return dto.targetConceptId ? this.curate(dto, actor) : this.lookup(dto);
  }

  /**
   * Camino de curado: alta o actualización del mapeo. El caso de uso declara
   * `concept_maps — UPSERT`, así que recurar el mismo par actualiza su
   * equivalencia en vez de añadir un segundo mapa contradictorio.
   */
  private async curate(
    dto: TranslateConceptDto,
    actor: AuthenticatedUser,
  ): Promise<TranslateResponseDto> {
    this.logger.info(
      {
        operation: 'terminology.concept-map.curate',
        sourceConceptId: dto.sourceConceptId,
        targetConceptId: dto.targetConceptId,
      },
      'Curando mapeo entre conceptos',
    );

    const targetConceptId = dto.targetConceptId as string;
    if (!dto.equivalence) {
      throw new PreconditionFailedException(
        'Curar un mapeo exige declarar la equivalencia',
        {
          sourceConceptId: dto.sourceConceptId,
          targetConceptId,
        },
      );
    }
    if (targetConceptId === dto.sourceConceptId) {
      throw new PreconditionFailedException(
        'Un concepto no puede mapearse a sí mismo',
        {
          sourceConceptId: dto.sourceConceptId,
        },
      );
    }
    const equivalenceConceptId = EQUIVALENCE_CONCEPTS[dto.equivalence];

    return this.em.transactional(async (tx) => {
      // El caso de uso exige origen y destino activos: mapear desde o hacia un
      // concepto retirado publicaría una traducción que no debe usarse.
      const source = await this.conceptsRepo.findById(tx, dto.sourceConceptId);
      if (!source) {
        throw new ResourceNotFoundException('Concepto origen no encontrado', {
          sourceConceptId: dto.sourceConceptId,
        });
      }
      const target = await this.conceptsRepo.findById(tx, targetConceptId);
      if (!target) {
        throw new ResourceNotFoundException('Concepto destino no encontrado', {
          targetConceptId,
        });
      }
      for (const [concept, field] of [
        [source, 'sourceConceptId'],
        [target, 'targetConceptId'],
      ] as const) {
        if (concept.stateConceptId !== CONCEPTS.TERM_ACTIVE) {
          throw new PreconditionFailedException(
            'Los conceptos del mapeo tienen que estar activos',
            {
              [field]: concept.id,
              stateConceptId: concept.stateConceptId,
            },
          );
        }
      }

      const duplicate = await this.conceptMapsRepo.findEquivalent(
        tx,
        dto.sourceConceptId,
        targetConceptId,
        dto.context,
        dto.version,
      );

      let conceptMapId: string;
      if (duplicate) {
        // Se relee bloqueada: dos recurados simultáneos del mismo par dejarían la
        // equivalencia del que perdió la carrera.
        const locked = await this.conceptMapsRepo.findByIdForUpdate(
          tx,
          duplicate.id,
        );
        if (!locked) {
          throw new ResourceNotFoundException(
            'El mapeo dejó de existir durante el curado',
            {
              conceptMapId: duplicate.id,
            },
          );
        }
        locked.equivalenceConceptId = equivalenceConceptId;
        locked.stateConceptId = CONCEPTS.TERM_ACTIVE;
        touch(locked, actor.id);
        conceptMapId = locked.id;
      } else {
        const created = this.conceptMapsRepo.create(tx, {
          sourceConceptId: dto.sourceConceptId,
          targetConceptId,
          equivalenceConceptId,
          context: dto.context,
          version: dto.version,
          stateConceptId: CONCEPTS.TERM_ACTIVE,
          actorUserId: actor.id,
        });
        conceptMapId = created.id;
      }
      await tx.flush();

      this.logger.info(
        {
          operation: 'terminology.concept-map.curate',
          conceptMapId,
          updated: Boolean(duplicate),
        },
        'Mapeo curado',
      );
      return {
        sourceConceptId: dto.sourceConceptId,
        matched: true,
        matches: [
          {
            conceptMapId,
            targetConceptId,
            equivalenceConceptId,
            context: dto.context,
          },
        ],
        curated: true,
      };
    });
  }

  /**
   * Camino de consulta: sólo lectura, sin transacción propia. Devuelve **todas**
   * las traducciones activas del concepto; quedarse con una escondería el resto,
   * que pueden tener equivalencias distintas.
   */
  private async lookup(
    dto: TranslateConceptDto,
  ): Promise<TranslateResponseDto> {
    this.logger.info(
      {
        operation: 'terminology.concept-map.translate',
        sourceConceptId: dto.sourceConceptId,
      },
      'Consultando traducciones de concepto',
    );

    const source = await this.conceptsRepo.findById(
      this.em,
      dto.sourceConceptId,
    );
    if (!source) {
      throw new ResourceNotFoundException('Concepto origen no encontrado', {
        sourceConceptId: dto.sourceConceptId,
      });
    }

    const maps = await this.conceptMapsRepo.findTranslations(
      this.em,
      dto.sourceConceptId,
      CONCEPTS.TERM_ACTIVE,
      dto.context,
    );

    this.logger.info(
      {
        operation: 'terminology.concept-map.translate',
        sourceConceptId: dto.sourceConceptId,
        matches: maps.length,
      },
      'Traducciones resueltas',
    );
    return {
      sourceConceptId: dto.sourceConceptId,
      matched: maps.length > 0,
      matches: maps.map((map) => ({
        conceptMapId: map.id,
        targetConceptId: map.targetConceptId,
        equivalenceConceptId: map.equivalenceConceptId,
        context: map.context,
      })),
      curated: false,
    };
  }
}
