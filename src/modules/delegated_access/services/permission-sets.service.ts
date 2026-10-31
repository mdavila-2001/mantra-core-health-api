import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  decodeKeysetCursor,
  encodeKeysetCursor,
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
  ListPermissionSetsResponseDto,
} from '../dto';
import { DELEGATE_TYPE_CONCEPT, STATUS } from './concept-maps';
import { DelegationScopeService } from './delegation-scope.service';

/** Tope de sets por página cuando el cliente no pide uno (CV-13). */
const DEFAULT_SETS_PAGE_SIZE = 50;

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
   * @param scope - Política común de tenant y alcance de la delegación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly setsRepo: DelegatedPermissionSetsRepository,
    private readonly itemsRepo: DelegatedPermissionSetItemsRepository,
    private readonly scope: DelegationScopeService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PermissionSetsService.name);
  }

  /**
   * CV-13 — página de sets de permisos delegados del tenant del actor.
   *
   * El hub `delegated-access` sólo podía publicar sets, nunca verlos: el
   * front tenía que pegar el uuid del set a mano en el formulario de alta de
   * una delegación (ID-19).
   */
  async listByTenant(
    tenantId: string,
    options: { cursor?: string; limit?: number },
  ): Promise<ListPermissionSetsResponseDto> {
    const em = this.em.fork({ keepTransactionContext: true });
    const limit = options.limit ?? DEFAULT_SETS_PAGE_SIZE;
    const after = options.cursor
      ? decodeKeysetCursor(options.cursor)
      : undefined;
    const afterId = typeof after?.id === 'string' ? after.id : undefined;

    const rows = await this.setsRepo.findByTenantPage(
      em,
      tenantId,
      afterId,
      limit + 1,
    );
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page.at(-1);

    return {
      items: page.map((set) => ({
        id: set.id,
        code: set.code,
        name: set.name,
        delegateTypeConceptId: set.delegateTypeConceptId,
        description: set.description,
        statusConceptId: set.statusConceptId,
        versionNumber: set.versionNumber,
        createdAt: set.createdAt,
      })),
      count: page.length,
      limit,
      nextCursor: hasMore && last ? encodeKeysetCursor({ id: last.id }) : null,
    };
  }

  /** UC-29-02: crea el set (versión 1) con sus ítems de permiso. */
  async createSet(
    dto: CreatePermissionSetDto,
    actor: AuthenticatedUser,
  ): Promise<PermissionSetVersionDto> {
    // El tenant sale del contexto verificado; el del cuerpo sólo se contrasta.
    const tenantId = this.scope.resolveTenant(dto.tenantId);
    this.logger.info(
      {
        operation: 'delegated_access.permission_set.create',
        tenantId,
        code: dto.code,
      },
      'Publishing delegated permission set',
    );
    return this.em.transactional(async (tx) => {
      const clash = await this.setsRepo.findByCode(tx, tenantId, dto.code);
      if (clash) {
        throw new ConflictException(
          'Ya existe un set con ese código en el tenant',
          {
            tenantId,
            code: dto.code,
          },
        );
      }

      const set = this.setsRepo.create(tx, {
        tenantId,
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
    const tenantId = this.scope.resolveTenant();
    return this.em.transactional(async (tx) => {
      // Un set de otro tenant responde igual que uno inexistente.
      const set = await this.scope.loadSetInTenant(tx, id, tenantId);

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
