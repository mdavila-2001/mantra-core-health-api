import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  getCurrentTenantId,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { ReadModelsErrorReason } from '../read_models.error-reasons';
import {
  ViewContractAuthorizer,
  viewOutOfScope,
  type AuthorizedView,
  type ViewContract,
} from './view-contract-authorizer.service';
import { ProjectionExecutor } from './projection-executor.service';
import type { ServeViewQuery } from './serve-view-query';
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

/**
 * Contratos de vista de frontend y servicio de lectura:
 *  - UC-30-02 publicar contrato de página (route + view + fields/sort/actions/kpis/states)
 *  - UC-30-05 servir el read model (consent-aware, masking heredado, cursor)
 *  - UC-30-11 derivar available_actions_json en servidor (estado + permiso)
 *  - UC-30-09 guardar preferencias de vista del usuario (validadas contra el allow-list)
 */
@Injectable()
export class FrontendViewsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param definitionsRepo - Valor de definitions repo requerido por la operación.
   * @param runsRepo - Valor de runs repo requerido por la operación.
   * @param surfacesRepo - Valor de surfaces repo requerido por la operación.
   * @param routesRepo - Valor de routes repo requerido por la operación.
   * @param pageViewsRepo - Valor de page views repo requerido por la operación.
   * @param childrenRepo - Valor de children repo requerido por la operación.
   * @param prefsRepo - Valor de prefs repo requerido por la operación.
   * @param authorizer - Autorizador del contrato de la vista (audiencia, permiso, contextos).
   * @param projection - Ejecutor de la proyección del read model.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly definitionsRepo: ReadModelDefinitionsRepository,
    private readonly runsRepo: ReadModelRefreshRunsRepository,
    private readonly surfacesRepo: PortalSurfacesRepository,
    private readonly routesRepo: FrontendRoutesRepository,
    private readonly pageViewsRepo: FrontendPageViewsRepository,
    private readonly childrenRepo: FrontendViewChildrenRepository,
    private readonly prefsRepo: UserViewPreferencesRepository,
    private readonly authorizer: ViewContractAuthorizer,
    private readonly projection: ProjectionExecutor,
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
      {
        operation: 'read_models.view.publish',
        portalCode,
        routeCode,
        viewCode: dto.viewCode,
      },
      'Publishing frontend view contract',
    );
    return this.em.transactional(async (tx) => {
      const definition = await this.definitionsRepo.findById(
        tx,
        dto.readModelDefinitionId,
      );
      if (!definition) {
        throw new ResourceNotFoundException(
          'Definición de read model no encontrada',
          {
            readModelDefinitionId: dto.readModelDefinitionId,
          },
        );
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
      let route = await this.routesRepo.findBySurfaceAndCode(
        tx,
        surface.id,
        routeCode,
      );
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
      const clash = await this.pageViewsRepo.findByRouteAndCode(
        tx,
        route.id,
        dto.viewCode,
      );
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

  /**
   * UC-30-05: sirve el read model al frontend con masking heredado y cursor.
   *
   * El contrato se autoriza **antes** de listar sus hijos (campos, acciones) y de
   * tocar la proyección: audiencia, permiso, propósito, feature flag y contextos
   * de tenant/paciente. Un campo con `permission_id` que el actor no tiene no se
   * sirve; un campo sensible se enmascara salvo para los roles con bypass. Las
   * columnas enmascaradas ni siquiera se seleccionan: su valor no sale de la base.
   *
   * @throws ResourceNotFoundException (`READ_MODEL_VIEW_OUT_OF_SCOPE`) si la vista
   * no existe o el actor no cumple su contrato.
   * @throws PreconditionFailedException (`READ_MODEL_PROJECTION_UNAVAILABLE`,
   * `READ_MODEL_QUERY_NOT_ALLOWED`, `READ_MODEL_CURSOR_INVALID`).
   */
  async serveData(
    portalCode: string,
    routeCode: string,
    viewCode: string,
    user: AuthenticatedUser,
    query: ServeViewQuery = { filters: {} },
  ): Promise<ServeViewDataResponseDto> {
    const em = this.em.fork();
    const contract = await this.resolveContract(
      em,
      portalCode,
      routeCode,
      viewCode,
    );
    const authorized = await this.authorizer.authorizeView(contract, {
      user,
      tenantId: getCurrentTenantId(),
      patientProfileId: query.patientProfileId,
      purposeOfUseConceptId: query.purposeOfUse,
    });
    const { portal, route, view } = contract;

    const fields = await this.authorizer.authorizedFields(
      await this.childrenRepo.listFields(em, view.id),
      authorized,
      user,
    );
    const actions = (await this.childrenRepo.listActions(em, view.id)).filter(
      (a) => a.statusConceptId === CONCEPTS.STATE_ACTIVE,
    );

    const servedFields: ServedFieldDto[] = fields.map((f) => ({
      fieldCode: f.fieldCode,
      label: f.label,
      dataType: f.dataType,
      masked: this.isFieldMasked(f, authorized.privileged),
    }));

    const definition = await this.definitionsRepo.findById(
      em,
      view.readModelDefinitionId,
    );
    if (!definition) {
      throw new PreconditionFailedException(
        'La proyección no está disponible',
        undefined,
        ReadModelsErrorReason.READ_MODEL_PROJECTION_UNAVAILABLE,
      );
    }

    const lastRun = await this.runsRepo.findLatestByDefinition(
      em,
      view.readModelDefinitionId,
    );
    const refreshedAt = lastRun?.completedAt ?? lastRun?.createdAt ?? null;
    const now = new Date();
    const stalenessSeconds = refreshedAt
      ? Math.max(0, Math.floor((now.getTime() - refreshedAt.getTime()) / 1000))
      : Number.MAX_SAFE_INTEGER;

    // Las columnas enmascaradas no se seleccionan: el valor no sale de la base.
    const readable = fields.filter(
      (f) => !this.isFieldMasked(f, authorized.privileged),
    );
    const page = await this.projection.execute({
      definition,
      viewId: view.id,
      fields: readable,
      sortOptions: await this.childrenRepo.listSortOptions(em, view.id),
      filters: await this.childrenRepo.listFilters(em, view.id),
      defaultSortCode: view.defaultSortCode,
      tenantScoped:
        route.requiresTenantContext === true || portal.tenantScoped === true,
      tenantId: authorized.tenantId,
      patientScoped:
        route.requiresPatientContext === true || portal.patientScoped === true,
      patientProfileId: authorized.patientProfileId,
      sortCode: query.sort,
      requestedFilters: query.filters,
      requestedLimit: query.limit,
      cursor: query.cursor,
      refreshedAt,
      materialized: lastRun?.resultConceptId === RM.RESULT_SUCCESS,
    });

    const maskedCodes = servedFields
      .filter((f) => f.masked)
      .map((f) => f.fieldCode);
    const data = page.rows.map((row) => {
      for (const code of maskedCodes) row[code] = null;
      return row;
    });

    const availableActions = await this.deriveActionsFor(
      actions,
      undefined,
      authorized,
      user,
    );

    return {
      frontendPageViewId: view.id,
      viewCode: view.viewCode,
      fields: servedFields,
      data,
      availableActions,
      nextCursor: page.nextCursor,
      refreshedAt,
      stalenessSeconds,
      generatedAt: now,
    };
  }

  /**
   * UC-30-11: deriva las acciones disponibles para un estado + permisos del solicitante.
   *
   * Pasa por el mismo autorizador de contrato que `serveData`: sin acceso a la
   * vista no hay acciones, ni siquiera su lista.
   */
  async deriveAvailableActions(
    portalCode: string,
    routeCode: string,
    viewCode: string,
    stateValue: string | undefined,
    user: AuthenticatedUser,
    context: {
      /** Propósito de uso declarado (`catalog_concepts.id`). */
      purposeOfUse?: string;
      /** Paciente cuyo contexto se declara. */
      patientProfileId?: string;
    } = {},
  ): Promise<AvailableActionDto[]> {
    const em = this.em.fork();
    const contract = await this.resolveContract(
      em,
      portalCode,
      routeCode,
      viewCode,
    );
    const authorized = await this.authorizer.authorizeView(contract, {
      user,
      tenantId: getCurrentTenantId(),
      patientProfileId: context.patientProfileId,
      purposeOfUseConceptId: context.purposeOfUse,
    });
    const actions = (
      await this.childrenRepo.listActions(em, contract.view.id)
    ).filter((a) => a.statusConceptId === CONCEPTS.STATE_ACTIVE);
    return this.deriveActionsFor(actions, stateValue, authorized, user);
  }

  /** UC-30-09: guarda (upsert) las preferencias de vista del usuario. */
  async upsertPreferences(
    frontendPageViewId: string,
    dto: UpsertViewPreferencesDto,
    user: AuthenticatedUser,
  ): Promise<ViewPreferencesResponseDto> {
    this.logger.info(
      {
        operation: 'read_models.view.preferences',
        frontendPageViewId,
        userId: user.id,
      },
      'Saving user view preferences',
    );
    return this.em.transactional(async (tx) => {
      const view = await this.pageViewsRepo.findById(tx, frontendPageViewId);
      if (!view) {
        throw new ResourceNotFoundException('Vista no encontrada', {
          frontendPageViewId,
        });
      }
      if (view.statusConceptId !== CONCEPTS.STATE_ACTIVE) {
        throw new PreconditionFailedException('La vista no está ACTIVE', {
          frontendPageViewId,
        });
      }

      // Validar que los campos visibles estén dentro del allow-list del contrato.
      if (dto.visibleFields?.length) {
        const fields = await this.childrenRepo.listFields(
          tx,
          frontendPageViewId,
        );
        const allowed = new Set(fields.map((f) => f.fieldCode));
        const invalid = dto.visibleFields.filter((code) => !allowed.has(code));
        if (invalid.length > 0) {
          throw new PreconditionFailedException(
            'visibleFields contiene columnas fuera del contrato',
            { invalid },
          );
        }
      }

      const densityConceptId = dto.density
        ? DENSITY_CONCEPT_BY_CODE[dto.density]
        : undefined;
      const existing = await this.prefsRepo.findByUserAndView(
        tx,
        user.id,
        frontendPageViewId,
      );
      if (existing) {
        existing.visibleFieldsJson =
          dto.visibleFields ?? existing.visibleFieldsJson;
        existing.fieldOrderJson = dto.fieldOrder ?? existing.fieldOrderJson;
        existing.activeFilterJson =
          dto.activeFilter ?? existing.activeFilterJson;
        existing.sortCode = dto.sortCode ?? existing.sortCode;
        existing.densityConceptId =
          densityConceptId ?? existing.densityConceptId;
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

  /**
   * Resuelve portal, ruta y vista por código.
   *
   * Cualquier eslabón ausente es el mismo `404/READ_MODEL_VIEW_OUT_OF_SCOPE` que
   * produce un contrato que el actor no puede ver: decir qué nivel falló
   * confirmaría que los códigos existen.
   *
   * @param em - Contexto de persistencia.
   * @param portalCode - Código del portal.
   * @param routeCode - Código de la ruta.
   * @param viewCode - Código de la vista.
   * @returns Portal, ruta y vista.
   * @throws ResourceNotFoundException (`READ_MODEL_VIEW_OUT_OF_SCOPE`).
   */
  private async resolveContract(
    em: EntityManager,
    portalCode: string,
    routeCode: string,
    viewCode: string,
  ): Promise<ViewContract> {
    const portal = await this.surfacesRepo.findByCode(em, portalCode);
    if (!portal) throw viewOutOfScope();
    const route = await this.routesRepo.findBySurfaceAndCode(
      em,
      portal.id,
      routeCode,
    );
    if (!route) throw viewOutOfScope();
    const view = await this.pageViewsRepo.findByRouteAndCode(
      em,
      route.id,
      viewCode,
    );
    if (!view) throw viewOutOfScope();
    return { portal, route, view };
  }

  /**
   * Regla de UC-30-11: una acción se ofrece solo si su estado permitido incluye el
   * estado de la fila (cuando hay `allowed_state_value_set_id`) y el solicitante
   * tiene el permiso requerido. Es una sugerencia de UI: el write siempre revalida.
   */
  private async deriveActionsFor(
    actions: FrontendViewActions[],
    stateValue: string | undefined,
    authorized: AuthorizedView,
    user: AuthenticatedUser,
  ): Promise<AvailableActionDto[]> {
    const privileged = authorized.privileged;
    return Promise.all(
      actions.map(async (a) => {
        // El permiso de la acción se evalúa de verdad (deny-overrides); la
        // administración entra por el bypass explícito del autorizador.
        const permissionOk = await this.authorizer.actionPermitted(
          a,
          authorized,
          user,
        );
        // Sin catálogo de value sets cargado aquí, el estado no restringe salvo
        // que exista un allowed_state_value_set_id (en cuyo caso requiere privilegio).
        const stateOk =
          !a.allowedStateValueSetId || privileged || stateValue == null;
        return {
          actionCode: a.actionCode,
          label: a.label,
          actionType: a.actionTypeConceptId,
          enabled: permissionOk && stateOk,
        };
      }),
    );
  }

  /**
   * Obtiene is field masked.
   *
   * @param field - Valor de field requerido por la operación.
   * @param privileged - Valor de privileged requerido por la operación.
   * @returns Resultado de is field masked conforme al contrato `boolean`.
   */
  private isFieldMasked(
    field: FrontendViewFields,
    privileged: boolean,
  ): boolean {
    if (!field.sensitive) return false;
    // Campo sensible con permiso explícito: solo se revela a roles privilegiados.
    return !privileged;
  }
}
