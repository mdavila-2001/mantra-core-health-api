import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  DelegatedPermissionSetsRepository,
  DelegatedPermissionSetItemsRepository,
} from '../repositories';
import {
  CreatePermissionSetDto,
  PublishSetVersionDto,
  PermissionSetVersionDto,
} from '../dto';
import { DELEGATE_TYPE_CONCEPT, STATUS } from './concept-maps';

/**
 * UC-29-02: publicar/versionar sets de permisos delegados (scoped). El set y sus
 * ítems se escriben en la misma transacción; el reemplazo de ítems al versionar es
 * all-or-nothing.
 */
@Injectable()
export class PermissionSetsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param setsRepo - Valor de sets repo requerido por la operación.
   * @param itemsRepo - Valor de items repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly setsRepo: DelegatedPermissionSetsRepository,
    private readonly itemsRepo: DelegatedPermissionSetItemsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PermissionSetsService.name);
  }

  /** UC-29-02: crea el set (versión 1) con sus ítems de permiso. */
  async createSet(
    dto: CreatePermissionSetDto,
    actor: AuthenticatedUser,
  ): Promise<PermissionSetVersionDto> {
    this.logger.info(
      {
        operation: 'delegated_access.permission_set.create',
        tenantId: dto.tenantId,
        code: dto.code,
      },
      'Publishing delegated permission set',
    );
    return this.em.transactional(async (tx) => {
      const clash = await this.setsRepo.findByCode(tx, dto.tenantId, dto.code);
      if (clash) {
        throw new ConflictException(
          'Ya existe un set con ese código en el tenant',
          {
            tenantId: dto.tenantId,
            code: dto.code,
          },
        );
      }

      const set = this.setsRepo.create(tx, {
        tenantId: dto.tenantId,
        code: dto.code,
        name: dto.name,
        delegateTypeConceptId:
          DELEGATE_TYPE_CONCEPT[dto.delegateType ?? 'SECRETARY'],
        description: dto.description,
        statusConceptId: STATUS.ACTIVE,
        actorUserId: actor.id,
      });
      // FK son columnas uuid: persistir el set antes de los ítems.
      await tx.flush();

      for (const item of dto.items) {
        this.itemsRepo.create(tx, {
          delegatedPermissionSetId: set.id,
          permissionId: item.permissionId,
          constraintJson: item.constraintJson,
          requiresStepUpAuthentication: item.requiresStepUpAuthentication,
        });
      }
      await tx.flush();

      this.logger.info(
        {
          operation: 'delegated_access.permission_set.create',
          setId: set.id,
          items: dto.items.length,
        },
        'Delegated permission set published',
      );
      return {
        id: set.id,
        versionNumber: set.versionNumber,
        itemCount: dto.items.length,
      };
    });
  }

  /** UC-29-02: publica una nueva versión del set (reemplazo all-or-nothing de ítems). */
  async publishVersion(
    id: string,
    dto: PublishSetVersionDto,
    actor: AuthenticatedUser,
  ): Promise<PermissionSetVersionDto> {
    this.logger.info(
      {
        operation: 'delegated_access.permission_set.version',
        setId: id,
        actorId: actor.id,
      },
      'Publishing new permission set version',
    );
    return this.em.transactional(async (tx) => {
      const set = await this.setsRepo.findById(tx, id);
      if (!set)
        throw new ResourceNotFoundException('Set de permisos no encontrado', {
          setId: id,
        });

      set.versionNumber += 1;
      set.statusConceptId = STATUS.ACTIVE;
      touch(set, actor.id);

      await this.itemsRepo.deleteBySet(tx, id);
      for (const item of dto.items) {
        this.itemsRepo.create(tx, {
          delegatedPermissionSetId: id,
          permissionId: item.permissionId,
          constraintJson: item.constraintJson,
          requiresStepUpAuthentication: item.requiresStepUpAuthentication,
        });
      }
      await tx.flush();

      this.logger.info(
        {
          operation: 'delegated_access.permission_set.version',
          setId: id,
          version: set.versionNumber,
        },
        'Permission set version published',
      );
      return {
        id: set.id,
        versionNumber: set.versionNumber,
        itemCount: dto.items.length,
      };
    });
  }
}
