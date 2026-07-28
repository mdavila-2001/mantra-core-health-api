import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  CatalogConceptsRepository,
  CodeSystemVersionsRepository,
} from '../repositories';
import {
  type ImportConceptsDto,
  type ImportConceptsResponseDto,
  type PublishVersionResponseDto,
} from '../dto';

/**
 * Reglas de negocio sobre versiones de sistemas de códigos: importación en bloque
 * de conceptos (UC-03-03) y publicación (UC-03-04).
 *
 * Una versión es mutable solo mientras está en borrador (`TERM_DRAFT`): al
 * publicarla pasa a `TERM_ACTIVE` y ya no admite importaciones. Este servicio es
 * quien impone esa precondición.
 */
@Injectable()
export class CodeSystemVersionsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param versionsRepo - Valor de versions repo requerido por la operación.
   * @param conceptsRepo - Valor de concepts repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly versionsRepo: CodeSystemVersionsRepository,
    private readonly conceptsRepo: CatalogConceptsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CodeSystemVersionsService.name);
  }

  /** UC-03-03: importa conceptos en una versión en borrador de forma idempotente. */
  async importConcepts(
    versionId: string,
    dto: ImportConceptsDto,
    actor: AuthenticatedUser,
  ): Promise<ImportConceptsResponseDto> {
    this.logger.info(
      {
        operation: 'terminology.version.import',
        versionId,
        total: dto.concepts.length,
      },
      'Importando conceptos en versión',
    );

    return this.em.transactional(async (tx) => {
      const version = await this.versionsRepo.findById(tx, versionId);
      if (!version) {
        throw new ResourceNotFoundException('Versión no encontrada', {
          versionId,
        });
      }
      if (version.stateConceptId !== CONCEPTS.TERM_DRAFT) {
        this.logger.warn(
          { operation: 'terminology.version.import', versionId },
          'Importación rechazada: la versión no está en borrador',
        );
        throw new PreconditionFailedException(
          'No se puede importar en una versión que no está en borrador',
          { versionId },
        );
      }

      const codes = dto.concepts.map((concept) => concept.code);
      const existing = await this.conceptsRepo.findExistingCodes(
        tx,
        versionId,
        codes,
      );

      // `seen` cubre además los duplicados dentro del propio lote: la operación es
      // idempotente frente a códigos repetidos vengan de la base o de la petición.
      const seen = new Set<string>(existing);
      let inserted = 0;
      let skipped = 0;
      for (const concept of dto.concepts) {
        if (seen.has(concept.code)) {
          skipped++;
          continue;
        }
        seen.add(concept.code);
        this.conceptsRepo.create(tx, {
          codeSystemVersionId: versionId,
          code: concept.code,
          display: concept.display,
          definition: concept.definition,
          actorUserId: actor.id,
        });
        inserted++;
      }
      await tx.flush();

      this.logger.info(
        {
          operation: 'terminology.version.import',
          versionId,
          inserted,
          skipped,
        },
        'Importación de conceptos completada',
      );
      return { inserted, skipped, total: dto.concepts.length };
    });
  }

  /** UC-03-04: publica una versión (transición TERM_DRAFT → TERM_ACTIVE). */
  async publishVersion(
    versionId: string,
    actor: AuthenticatedUser,
  ): Promise<PublishVersionResponseDto> {
    this.logger.info(
      { operation: 'terminology.version.publish', versionId },
      'Publicando versión',
    );

    return this.em.transactional(async (tx) => {
      const version = await this.versionsRepo.findById(tx, versionId);
      if (!version) {
        throw new ResourceNotFoundException('Versión no encontrada', {
          versionId,
        });
      }
      if (version.stateConceptId === CONCEPTS.TERM_ACTIVE) {
        this.logger.warn(
          { operation: 'terminology.version.publish', versionId },
          'Publicación rechazada: la versión ya está publicada',
        );
        throw new ConflictException('La versión ya está publicada', {
          versionId,
        });
      }
      if (version.stateConceptId !== CONCEPTS.TERM_DRAFT) {
        throw new PreconditionFailedException(
          'Solo se puede publicar una versión en borrador',
          { versionId },
        );
      }

      const now = new Date();
      version.stateConceptId = CONCEPTS.TERM_ACTIVE;
      version.publishedAt = now;
      touch(version, actor.id, now);
      await tx.flush();

      this.logger.info(
        { operation: 'terminology.version.publish', versionId },
        'Versión publicada',
      );
      return { id: version.id, state: 'TERM_ACTIVE', publishedAt: now };
    });
  }
}
