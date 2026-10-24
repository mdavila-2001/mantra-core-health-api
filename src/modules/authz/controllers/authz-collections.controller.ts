import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AccessLogged, Roles } from '../../../common';
import { AuthzCollectionsService } from '../services';
import {
  AccessPolicyPageDto,
  ClinicalAccessGrantPageDto,
  ListAccessPoliciesQueryDto,
  ListClinicalAccessGrantsQueryDto,
  ListResourceScopeGrantsQueryDto,
  ListUserPermissionGrantsQueryDto,
  ResourceScopeGrantPageDto,
  UserPermissionGrantPageDto,
} from '../dto';

/**
 * `GET` de colección de `authz` que el catálogo de vistas esperaba.
 *
 * Cada handler declara su `@Roles(...)`: el mismo que exigen las escrituras
 * del recurso. La página la acota al tenant del contexto el servicio.
 */
@ApiTags('authz-collections')
@ApiBearerAuth()
@Controller()
export class AuthzCollectionsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param collections - Lecturas de colección del módulo.
   */
  constructor(private readonly collections: AuthzCollectionsService) {}

  /** V06-03, V06-06: listar las concesiones de acceso clínico del tenant. */
  @Get('authz/clinical-access-grants')
  @Roles('CLINICAL_APPROVER', 'SECURITY_ADMIN')
  @AccessLogged({ resourceType: 'CLINICAL_ACCESS_GRANTS' })
  @ApiOperation({
    summary: 'Listar las concesiones de acceso clínico del tenant',
  })
  @ApiOkResponse({ type: ClinicalAccessGrantPageDto })
  listClinicalAccessGrants(
    @Query() query: ListClinicalAccessGrantsQueryDto,
  ): Promise<ClinicalAccessGrantPageDto> {
    return this.collections.listClinicalAccessGrants(query);
  }

  /** V06-10: listar las concesiones de alcance de recurso del tenant. */
  @Get('authz/resource-scope-grants')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({
    summary: 'Listar las concesiones de alcance de recurso del tenant',
  })
  @ApiOkResponse({ type: ResourceScopeGrantPageDto })
  listResourceScopeGrants(
    @Query() query: ListResourceScopeGrantsQueryDto,
  ): Promise<ResourceScopeGrantPageDto> {
    return this.collections.listResourceScopeGrants(query);
  }

  /** V06-14: listar las políticas de acceso abac del tenant. */
  @Get('authz/tenants/:tenantId/access-policies')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Listar las políticas de acceso ABAC del tenant' })
  @ApiOkResponse({ type: AccessPolicyPageDto })
  listAccessPolicies(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query() query: ListAccessPoliciesQueryDto,
  ): Promise<AccessPolicyPageDto> {
    return this.collections.listAccessPolicies(tenantId, query);
  }

  /** V06-15: listar las excepciones de permiso de un usuario en el tenant. */
  @Get('authz/users/:userId/permission-grants')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({
    summary: 'Listar las excepciones de permiso de un usuario en el tenant',
  })
  @ApiOkResponse({ type: UserPermissionGrantPageDto })
  listUserPermissionGrants(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() query: ListUserPermissionGrantsQueryDto,
  ): Promise<UserPermissionGrantPageDto> {
    return this.collections.listUserPermissionGrants(userId, query);
  }
}
