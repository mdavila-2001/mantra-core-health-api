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
  ReadModelDefinitionsRepository,
  ReadModelRefreshRunsRepository,
  PortalSurfacesRepository,
  FrontendRoutesRepository,
  FrontendPageViewsRepository,
  FrontendViewChildrenRepository,
  UserViewPreferencesRepository,
} from '../repositories';
import {
  PublishViewContractDto,
  UpsertViewPreferencesDto,
  ViewContractResponseDto,
  ViewPreferencesResponseDto,
  ServeViewDataResponseDto,
  AvailableActionDto,
  ServedFieldDto,
} from '../dto';
import {
  RM,
  PORTAL_TYPE_CONCEPT_BY_CODE,
  VIEW_TYPE_CONCEPT_BY_CODE,
  SORT_DIRECTION_CONCEPT_BY_CODE,
  NULLS_POSITION_CONCEPT_BY_CODE,
  ACTION_TYPE_CONCEPT_BY_CODE,
  STATE_TYPE_CONCEPT_BY_CODE,
  DENSITY_CONCEPT_BY_CODE,
} from '../read_models.concepts';
import type { FrontendViewActions, FrontendViewFields } from '../entities';

const PRIVILEGED_ROLES = new Set(['SUPERADMIN', 'SECURITY_ADMIN']);

/**
 * Contratos de vista de frontend y servicio de lectura:
 *  - UC-30-02 publicar contrato de página (route + view + fields/sort/actions/kpis/states)
 *  - UC-30-05 servir el read model (consent-aware, masking heredado, cursor)
 *  - UC-30-11 derivar available_actions_json en servidor (estado + permiso)
 *  - UC-30-09 guardar preferencias de vista del usuario (validadas contra el allow-list)
 */
@Injectable()
export class FrontendViewsService {
  constructor(
    private readonly em: EntityManager,
    private readonly definitionsRepo: ReadModelDefinitionsRepository,
    private readonly runsRepo: ReadModelRefreshRunsRepository,
    private readonly surfacesRepo: PortalSurfacesRepository,
    private readonly routesRepo: FrontendRoutesRepository,
    private readonly pageViewsRepo: FrontendPageViewsRepository,
    private readonly childrenRepo: FrontendViewChildrenRepository,
    private readonly prefsRepo: UserViewPreferencesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(FrontendViewsService.name);
  }

  /** UC-30-02: publica el contrato de una vista de página (include UC-30-01). */
  async publishViewContract(
    portalCode: string,
    routeCode: string,
    dto: PublishViewContractDto,
    actor: AuthenticatedUser,
  ): Promise<ViewContractResponseDto> {
    this.logger.info(
      { operation: 'read_models.view.publish', portalCode, routeCode, viewCode: dto.viewCode },
      'Publishing frontend view contract',
    );
    return this.em.transactional(async (tx) => {
      const definition = await this.definitionsRepo.findById(tx, dto.readModelDefinitionId);
      if (!definition) {
        throw new ResourceNotFoundException('Definición de read model no encontrada', {
          readModelDefinitionId: dto.readModelDefinitionId,
        });
      }
      if (definition.statusConceptId !== RM.DEF_ACTIVE) {
        throw new PreconditionFailedException(
          'La definición de read model no está ACTIVE',
          { readModelDefinitionId: dto.readModelDefinitionId },
        );
      }

      // --- Superficie de portal (upsert por portal_code) ---
      let surface = await this.surfacesRepo.findByCode(tx, portalCode);
      if (!surface) {
        surface = this.surfacesRepo.create(tx, {
          portalCode,
          name: dto.portalName,
          portalTypeConceptId: PORTAL_TYPE_CONCEPT_BY_CODE[dto.portalType],
          statusConceptId: CONCEPTS.STATE_ACTIVE,
          actorUserId: actor.id,
        });
        await tx.flush();
      }

      // --- Ruta (upsert por surface + route_code) ---
      let route = await this.routesRepo.findBySurfaceAndCode(tx, surface.id, routeCode);
      if (!route) {
        route = this.routesRepo.create(tx, {
          portalSurfaceId: surface.id,
          routeCode,
          routePattern: dto.routePattern,
          pageTitle: dto.pageTitle,
          requiresPatientContext: dto.requiresPatientContext,
          requiresTenantContext: dto.requiresTenantContext,
          statusConceptId: CONCEPTS.STATE_ACTIVE,
          actorUserId: actor.id,
        });
        await tx.flush();
      }

      // --- Vista (unique route + view_code) ---
      const clash = await this.pageViewsRepo.findByRouteAndCode(tx, route.id, dto.viewCode);
      if (clash) {
        throw new ConflictException('La vista ya existe en esa ruta', {
          routeCode,
          viewCode: dto.viewCode,
        });
      }
      const view = this.pageViewsRepo.create(tx, {
        frontendRouteId: route.id,
        readModelDefinitionId: definition.id,
        viewCode: dto.viewCode,
        viewTypeConceptId: VIEW_TYPE_CONCEPT_BY_CODE[dto.viewType],
        title: dto.title,
        supportsCursorPagination: dto.supportsCursorPagination,
        supportsExport: dto.supportsExport,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();

      // --- Hijos: allow-lists del contrato ---
      dto.fields.forEach((f, i) => {
        this.childrenRepo.createField(tx, {
          frontendPageViewId: view.id,
          fieldCode: f.fieldCode,
          sourceColumn: f.sourceColumn,
          label: f.label,
          dataType: f.dataType,
          formatMask: f.formatMask,
          sensitive: f.sensitive,
          permissionId: f.permissionId,
          ordinal: f.ordinal ?? i,
          statusConceptId: CONCEPTS.STATE_ACTIVE,
          actorUserId: actor.id,
        });
      });
      (dto.sortOptions ?? []).forEach((s, i) => {
        this.childrenRepo.createSortOption(tx, {
          frontendPageViewId: view.id,
          sortCode: s.sortCode,
          label: s.label,
          sortExpression: s.sortExpression,
          directionConceptId: SORT_DIRECTION_CONCEPT_BY_CODE[s.direction],
          nullsPositionConceptId: NULLS_POSITION_CONCEPT_BY_CODE[s.nulls],
          stableTieBreakerExpression: s.stableTieBreakerExpression,
          ordinal: s.ordinal ?? i,
          statusConceptId: CONCEPTS.STATE_ACTIVE,
          actorUserId: actor.id,
        });
      });
      (dto.actions ?? []).forEach((a, i) => {
        this.childrenRepo.createAction(tx, {
          frontendPageViewId: view.id,
          actionCode: a.actionCode,
          label: a.label,
          actionTypeConceptId: ACTION_TYPE_CONCEPT_BY_CODE[a.actionType],
          routeTemplate: a.routeTemplate,
          requiredPermissionId: a.requiredPermissionId,
          idempotencyRequired: a.idempotencyRequired,
          ordinal: a.ordinal ?? i,
          statusConceptId: CONCEPTS.STATE_ACTIVE,
          actorUserId: actor.id,
        });
      });
      (dto.kpis ?? []).forEach((k, i) => {
        this.childrenRepo.createKpi(tx, {
          frontendPageViewId: view.id,
          kpiCode: k.kpiCode,
          label: k.label,
          valueColumn: k.valueColumn,
          comparisonColumn: k.comparisonColumn,
          formatMask: k.formatMask,
          ordinal: k.ordinal ?? i,
          statusConceptId: CONCEPTS.STATE_ACTIVE,
          actorUserId: actor.id,
        });
      });
      (dto.states ?? []).forEach((st) => {
        this.childrenRepo.createState(tx, {
          frontendPageViewId: view.id,
          stateTypeConceptId: STATE_TYPE_CONCEPT_BY_CODE[st.stateType],
          title: st.title,
          message: st.message,
          retryAllowed: st.retryAllowed,
          statusConceptId: CONCEPTS.STATE_ACTIVE,
          actorUserId: actor.id,
        });
      });

      this.logger.info(
        { operation: 'read_models.view.publish', viewId: view.id },
        'Frontend view contract published',
      );
      return {
        id: view.id,
        portalSurfaceId: surface.id,
        frontendRouteId: route.id,
        viewCode: view.viewCode,
        fieldCount: dto.fields.length,
        actionCount: (dto.actions ?? []).length,
        status: view.statusConceptId,
      };
    });
  }

  /** UC-30-05: sirve el read model al frontend con masking heredado y cursor. */
  async serveData(
    portalCode: string,
    routeCode: string,
    viewCode: string,
    user: AuthenticatedUser,
  ): Promise<ServeViewDataResponseDto> {
    const em = this.em.fork();
    const view = await this.resolveView(em, portalCode, routeCode, viewCode);

    const fields = await this.childrenRepo.listFields(em, view.id);
    const actions = await this.childrenRepo.listActions(em, view.id);
    const privileged = this.isPrivileged(user);

    const servedFields: ServedFieldDto[] = fields.map((f) => ({
      fieldCode: f.fieldCode,
      label: f.label,
      dataType: f.dataType,
      masked: this.isFieldMasked(f, privileged),
    }));

    const lastRun = await this.runsRepo.findLatestByDefinition(em, view.readModelDefinitionId);
    const refreshedAt = lastRun?.completedAt ?? lastRun?.createdAt ?? null;
    const now = new Date();
    const stalenessSeconds = refreshedAt
      ? Math.max(0, Math.floor((now.getTime() - refreshedAt.getTime()) / 1000))
      : Number.MAX_SAFE_INTEGER;

    // La proyección física de la MV no se consulta aquí (contrato de lectura):
    // se devuelven el allow-list, el masking y las acciones derivadas en servidor.
    const availableActions = this.deriveActionsFor(actions, undefined, user);

    return {
      frontendPageViewId: view.id,
      viewCode: view.viewCode,
      fields: servedFields,
      data: [],
      availableActions,
      nextCursor: null,
      refreshedAt,
      stalenessSeconds,
      generatedAt: now,
    };
  }

  /** UC-30-11: deriva las acciones disponibles para un estado + permisos del solicitante. */
  async deriveAvailableActions(
    portalCode: string,
    routeCode: string,
    viewCode: string,
    stateValue: string | undefined,
    user: AuthenticatedUser,
  ): Promise<AvailableActionDto[]> {
    const em = this.em.fork();
    const view = await this.resolveView(em, portalCode, routeCode, viewCode);
    const actions = await this.childrenRepo.listActions(em, view.id);
    return this.deriveActionsFor(actions, stateValue, user);
  }

  /** UC-30-09: guarda (upsert) las preferencias de vista del usuario. */
  async upsertPreferences(
    frontendPageViewId: string,
    dto: UpsertViewPreferencesDto,
    user: AuthenticatedUser,
  ): Promise<ViewPreferencesResponseDto> {
    this.logger.info(
      { operation: 'read_models.view.preferences', frontendPageViewId, userId: user.id },
      'Saving user view preferences',
    );
    return this.em.transactional(async (tx) => {
      const view = await this.pageViewsRepo.findById(tx, frontendPageViewId);
      if (!view) {
        throw new ResourceNotFoundException('Vista no encontrada', { frontendPageViewId });
      }
      if (view.statusConceptId !== CONCEPTS.STATE_ACTIVE) {
        throw new PreconditionFailedException('La vista no está ACTIVE', { frontendPageViewId });
      }

      // Validar que los campos visibles estén dentro del allow-list del contrato.
      if (dto.visibleFields?.length) {
        const fields = await this.childrenRepo.listFields(tx, frontendPageViewId);
        const allowed = new Set(fields.map((f) => f.fieldCode));
        const invalid = dto.visibleFields.filter((code) => !allowed.has(code));
        if (invalid.length > 0) {
          throw new PreconditionFailedException(
            'visibleFields contiene columnas fuera del contrato',
            { invalid },
          );
        }
      }

      const densityConceptId = dto.density ? DENSITY_CONCEPT_BY_CODE[dto.density] : undefined;
      const existing = await this.prefsRepo.findByUserAndView(tx, user.id, frontendPageViewId);
      if (existing) {
        existing.visibleFieldsJson = dto.visibleFields ?? existing.visibleFieldsJson;
        existing.fieldOrderJson = dto.fieldOrder ?? existing.fieldOrderJson;
        existing.activeFilterJson = dto.activeFilter ?? existing.activeFilterJson;
        existing.sortCode = dto.sortCode ?? existing.sortCode;
        existing.densityConceptId = densityConceptId ?? existing.densityConceptId;
        existing.pageSize = dto.pageSize ?? existing.pageSize;
        existing.tenantId = dto.tenantId ?? existing.tenantId;
        touch(existing, user.id);
        return {
          id: existing.id,
          frontendPageViewId,
          created: false,
          status: existing.statusConceptId,
        };
      }

      const prefs = this.prefsRepo.create(tx, {
        userId: user.id,
        frontendPageViewId,
        tenantId: dto.tenantId,
        visibleFieldsJson: dto.visibleFields,
        fieldOrderJson: dto.fieldOrder,
        activeFilterJson: dto.activeFilter,
        sortCode: dto.sortCode,
        densityConceptId,
        pageSize: dto.pageSize,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: user.id,
      });
      await tx.flush();
      return {
        id: prefs.id,
        frontendPageViewId,
        created: true,
        status: prefs.statusConceptId,
      };
    });
  }

  private async resolveView(
    em: EntityManager,
    portalCode: string,
    routeCode: string,
    viewCode: string,
  ) {
    const surface = await this.surfacesRepo.findByCode(em, portalCode);
    if (!surface) {
      throw new ResourceNotFoundException('Portal no encontrado', { portalCode });
    }
    const route = await this.routesRepo.findBySurfaceAndCode(em, surface.id, routeCode);
    if (!route) {
      throw new ResourceNotFoundException('Ruta no encontrada', { portalCode, routeCode });
    }
    const view = await this.pageViewsRepo.findByRouteAndCode(em, route.id, viewCode);
    if (!view) {
      throw new ResourceNotFoundException('Vista no encontrada', { routeCode, viewCode });
    }
    return view;
  }

  /**
   * Regla de UC-30-11: una acción se ofrece solo si su estado permitido incluye el
   * estado de la fila (cuando hay `allowed_state_value_set_id`) y el solicitante
   * tiene el permiso requerido. Es una sugerencia de UI: el write siempre revalida.
   */
  private deriveActionsFor(
    actions: FrontendViewActions[],
    stateValue: string | undefined,
    user: AuthenticatedUser,
  ): AvailableActionDto[] {
    const privileged = this.isPrivileged(user);
    return actions.map((a) => {
      const permissionOk = privileged || !a.requiredPermissionId;
      // Sin catálogo de value sets cargado aquí, el estado no restringe salvo
      // que exista un allowed_state_value_set_id (en cuyo caso requiere privilegio).
      const stateOk = !a.allowedStateValueSetId || privileged || stateValue == null;
      return {
        actionCode: a.actionCode,
        label: a.label,
        actionType: a.actionTypeConceptId,
        enabled: permissionOk && stateOk,
      };
    });
  }

  private isFieldMasked(field: FrontendViewFields, privileged: boolean): boolean {
    if (!field.sensitive) return false;
    // Campo sensible con permiso explícito: solo se revela a roles privilegiados.
    return !privileged;
  }

  private isPrivileged(user: AuthenticatedUser): boolean {
    return (user.roles ?? []).some((r) => PRIVILEGED_ROLES.has(r));
  }
}
