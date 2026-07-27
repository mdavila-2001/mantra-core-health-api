import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import {
  CodeSystemsRepository,
  CodeSystemVersionsRepository,
  TerminologySourcesRepository,
} from '../repositories';
import {
  type CreateCodeSystemDto,
  type CodeSystemResponseDto,
  type CreateCodeSystemVersionDto,
  type CodeSystemVersionResponseDto,
} from '../dto';

/**
 * Reglas de negocio para el alta de sistemas de códigos (UC-03-01) y sus versiones
 * (UC-03-02).
 *
 * Usa `em.transactional` para agrupar cada operación en una unidad de trabajo
 * atómica. Como las FK del modelo son columnas `uuid` planas (no relaciones del
 * ORM), MikroORM no ordena los inserts: hay que `flush` tras cada nivel de
 * dependencia (fuente antes que sistema de códigos).
 */
@Injectable()
export class CodeSystemsService {
  constructor(
    private readonly em: EntityManager,
    private readonly sourcesRepo: TerminologySourcesRepository,
    private readonly codeSystemsRepo: CodeSystemsRepository,
    private readonly versionsRepo: CodeSystemVersionsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CodeSystemsService.name);
  }

  /** UC-03-01: crea un sistema de códigos, reutilizando o creando su fuente. */
  async createCodeSystem(
    dto: CreateCodeSystemDto,
    actor: AuthenticatedUser,
  ): Promise<CodeSystemResponseDto> {
    this.logger.info(
      {
        operation: 'terminology.code-system.create',
        internalCode: dto.internalCode,
      },
      'Creando sistema de códigos',
    );

    return this.em.transactional(async (tx) => {
      const duplicate = await this.codeSystemsRepo.findByInternalCode(
        tx,
        dto.internalCode,
      );
      if (duplicate) {
        this.logger.warn(
          {
            operation: 'terminology.code-system.create',
            internalCode: dto.internalCode,
          },
          'Código interno de sistema de códigos duplicado',
        );
        throw new ConflictException(
          'Ya existe un sistema de códigos con ese código interno',
          {
            internalCode: dto.internalCode,
          },
        );
      }

      // Nivel 1: la fuente debe existir antes que el sistema de códigos porque
      // `code_systems.source_id` la referencia. Se reutiliza si ya está.
      let source = await this.sourcesRepo.findByCode(tx, dto.sourceCode);
      if (!source) {
        source = this.sourcesRepo.create(tx, {
          code: dto.sourceCode,
          name: dto.sourceName,
          sourceTypeConceptId: CONCEPTS.SRC_TYPE_EXTERNAL,
          stateConceptId: CONCEPTS.TERM_ACTIVE,
          actorUserId: actor.id,
        });
        await tx.flush();
      }

      // Nivel 2: el sistema de códigos ya puede referenciar la fuente persistida.
      const codeSystem = this.codeSystemsRepo.create(tx, {
        sourceId: source.id,
        internalCode: dto.internalCode,
        name: dto.name,
        canonicalUrl: dto.canonicalUrl,
        contentTypeConceptId: CONCEPTS.CS_CONTENT_COMPLETE,
        stateConceptId: CONCEPTS.TERM_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        {
          operation: 'terminology.code-system.create',
          codeSystemId: codeSystem.id,
        },
        'Sistema de códigos creado',
      );
      return {
        id: codeSystem.id,
        internalCode: codeSystem.internalCode,
        sourceId: source.id,
      };
    });
  }

  /** UC-03-02: crea una versión (en borrador) de un sistema de códigos existente. */
  async createVersion(
    codeSystemId: string,
    dto: CreateCodeSystemVersionDto,
    actor: AuthenticatedUser,
  ): Promise<CodeSystemVersionResponseDto> {
    this.logger.info(
      {
        operation: 'terminology.code-system-version.create',
        codeSystemId,
        version: dto.version,
      },
      'Creando versión de sistema de códigos',
    );

    return this.em.transactional(async (tx) => {
      const codeSystem = await this.codeSystemsRepo.findById(tx, codeSystemId);
      if (!codeSystem) {
        throw new ResourceNotFoundException(
          'Sistema de códigos no encontrado',
          { codeSystemId },
        );
      }

      const duplicate = await this.versionsRepo.findByCodeSystemAndVersion(
        tx,
        codeSystemId,
        dto.version,
      );
      if (duplicate) {
        this.logger.warn(
          {
            operation: 'terminology.code-system-version.create',
            codeSystemId,
            version: dto.version,
          },
          'Versión de sistema de códigos duplicada',
        );
        throw new ConflictException(
          'Ya existe esa versión para el sistema de códigos',
          {
            codeSystemId,
            version: dto.version,
          },
        );
      }

      const version = this.versionsRepo.create(tx, {
        codeSystemId,
        version: dto.version,
        isDefault: dto.isDefault,
        stateConceptId: CONCEPTS.TERM_DRAFT,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        {
          operation: 'terminology.code-system-version.create',
          versionId: version.id,
        },
        'Versión de sistema de códigos creada',
      );
      return { id: version.id, version: version.version, state: 'TERM_DRAFT' };
    });
  }
}
