import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import type { RoleTemplates } from '../entities';
import { DELEG } from '../delegated_access.concepts';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import type {
  CreateRoleTemplateDto,
  ListRoleTemplatesResponseDto,
  ResourceCreatedDto,
  RoleTemplateViewDto,
  UpdateRoleTemplateDto,
  OperationResultDto,
} from '../dto';
import { RoleTemplatesRepository } from '../repositories';
import {
  inheritedTemplateCeiling,
  mostRestrictiveTemplateCeiling,
} from '../domain';
import { governanceError } from './governance-errors';
import { DelegationScopeService } from './delegation-scope.service';

/**
 * Plantillas de rol de apoyo. Las de plataforma (`tenant_id` nulo) traen las
 * acciones por defecto de cada oficio y no se editan; cada organización puede
 * crear las suyas y versionarlas.
 */
@Injectable()
export class RoleTemplatesService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param templates - Repositorio de plantillas.
   * @param scope - Política común de tenant.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly templates: RoleTemplatesRepository,
    private readonly scope: DelegationScopeService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(RoleTemplatesService.name);
  }

  /**
   * Plantillas visibles para la organización activa: las suyas y las de plataforma.
   *
   * @returns Las plantillas ordenadas por código.
   */
  async list(): Promise<ListRoleTemplatesResponseDto> {
    const tenantId = this.scope.resolveTenant();
    const rows = await this.templates.findVisible(
      this.em.fork({ keepTransactionContext: true }),
      tenantId,
    );
    const items = rows.map(toView);
    return { items, count: items.length };
  }

  /**
   * Crea una plantilla propia de la organización activa.
   *
   * @param dto - Código, nombre y acciones por defecto.
   * @param actor - Quien la crea.
   * @returns La plantilla creada.
   */
  async create(
    dto: CreateRoleTemplateDto,
    actor: AuthenticatedUser,
  ): Promise<ResourceCreatedDto> {
    const tenantId = this.scope.resolveTenant();
    this.logger.info(
      {
        operation: 'delegated_access.role_template.create',
        tenantId,
        actorId: actor.id,
      },
      'Creating role template',
    );
    return this.em.transactional(async (tx) => {
      if (await this.templates.findEffectiveByCode(tx, tenantId, dto.code)) {
        throw new ConflictException(
          'Ya existe una plantilla con ese código',
          { code: dto.code },
          Reason.SUPPORT_TEMPLATE_CODE_TAKEN,
        );
      }
      const row = this.templates.create(tx, {
        tenantId,
        code: dto.code,
        name: dto.name,
        defaultActions: dto.defaultActions,
        // GP-2 no se relaja con una plantilla propia: hereda el techo más
        // restrictivo de plataforma que cubre sus acciones por defecto (A-M7).
        ceilingActions: inheritedCeilingOf(dto.defaultActions),
        statusConceptId: DELEG.ROLE_TEMPLATE_ACTIVE,
        versionNumber: 1,
      });
      await tx.flush();
      return {
        id: row.id,
        status: row.statusConceptId,
        createdAt: row.createdAt,
      };
    });
  }

  /**
   * Publica una versión nueva de una plantilla propia. Los vínculos ya abiertos
   * no cambian: los permisos viven en cada vínculo.
   *
   * @param id - Plantilla.
   * @param dto - Nombre o acciones nuevas.
   * @param actor - Quien la cambia.
   * @returns `{ ok: true }`.
   */
  async update(
    id: string,
    dto: UpdateRoleTemplateDto,
    actor: AuthenticatedUser,
  ): Promise<OperationResultDto> {
    const tenantId = this.scope.resolveTenant();
    if (dto.name === undefined && dto.defaultActions === undefined) {
      throw new PreconditionFailedException('No hay cambios que aplicar');
    }
    return this.em.transactional(async (tx) => {
      const row = await this.templates.findById(tx, id);
      if (!row || (row.tenantId && row.tenantId !== tenantId)) {
        throw this.notFound();
      }
      if (!row.tenantId) {
        throw new PreconditionFailedException(
          'La plantilla de plataforma no se edita',
          undefined,
          Reason.SUPPORT_TEMPLATE_READ_ONLY,
        );
      }
      if (row.statusConceptId !== DELEG.ROLE_TEMPLATE_ACTIVE) {
        throw new PreconditionFailedException(
          'Esa versión de la plantilla ya fue reemplazada: edite la vigente',
          undefined,
          Reason.SUPPORT_TEMPLATE_READ_ONLY,
        );
      }
      // Se publica una versión nueva y la anterior se retira, no se modifica: los
      // vínculos abiertos con ella conservan lo que se les concedió y las
      // solicitudes nuevas toman la vigente.
      const defaultActions =
        dto.defaultActions ??
        (Array.isArray(row.defaultActionsJson)
          ? (row.defaultActionsJson as string[])
          : []);
      // Acciones nuevas: se recalcula el techo; solo el nombre: se conserva el guardado.
      const kept = Array.isArray(row.ceilingActionsJson)
        ? (row.ceilingActionsJson as string[])
        : undefined;
      this.templates.create(tx, {
        tenantId,
        code: row.code,
        name: dto.name ?? row.name,
        defaultActions,
        ceilingActions:
          dto.defaultActions === undefined && kept && kept.length > 0
            ? kept
            : inheritedCeilingOf(defaultActions),
        statusConceptId: DELEG.ROLE_TEMPLATE_ACTIVE,
        versionNumber: row.versionNumber + 1,
      });
      row.statusConceptId = DELEG.ROLE_TEMPLATE_RETIRED;
      touch(row, actor.id);
      await tx.flush();
      return { ok: true };
    });
  }

  private notFound(): ResourceNotFoundException {
    return new ResourceNotFoundException(
      'Plantilla de rol no encontrada',
      undefined,
      Reason.SUPPORT_TEMPLATE_NOT_FOUND,
    );
  }
}

/**
 * Techo que hereda una plantilla propia (A-M7): el de plataforma más
 * restrictivo que cubre sus acciones por defecto; si ninguno las cubre, 422
 * `GUARDRAIL_CEILING_EXCEEDED`. Sin acciones legibles, lo común a todas.
 */
function inheritedCeilingOf(defaultActions: readonly string[]): string[] {
  if (defaultActions.length === 0) return mostRestrictiveTemplateCeiling();
  const inherited = inheritedTemplateCeiling(defaultActions);
  if (!inherited.ok) {
    throw governanceError(
      Reason.GUARDRAIL_CEILING_EXCEEDED,
      'Las acciones de la plantilla superan el techo de todas las plantillas de la plataforma.',
      { offendingAtoms: [...inherited.offendingAtoms] },
    );
  }
  return [...inherited.ceiling];
}

/** Vista de una plantilla. */
function toView(row: RoleTemplates): RoleTemplateViewDto {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    defaultActions: Array.isArray(row.defaultActionsJson)
      ? (row.defaultActionsJson as string[])
      : [],
    platform: !row.tenantId,
    versionNumber: row.versionNumber,
  };
}
