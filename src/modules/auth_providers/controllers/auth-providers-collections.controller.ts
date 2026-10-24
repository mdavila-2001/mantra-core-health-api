import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common';
import { AuthProvidersCollectionsService } from '../services';
import {
  IdentityProviderPageDto,
  ListIdentityProvidersQueryDto,
  ListProvisioningRulesQueryDto,
  ListTenantBindingsQueryDto,
  ProviderTenantBindingPageDto,
  ProvisioningRulePageDto,
} from '../dto';

/**
 * `GET` de colección de `auth_providers` que el catálogo de vistas esperaba.
 *
 * Cada handler declara su `@Roles(...)`: el mismo que exigen las escrituras
 * del recurso. La página la acota al tenant del contexto el servicio.
 */
@ApiTags('auth-providers-collections')
@ApiBearerAuth()
@Controller()
export class AuthProvidersCollectionsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param collections - Lecturas de colección del módulo.
   */
  constructor(private readonly collections: AuthProvidersCollectionsService) {}

  /** V40-03: listar los proveedores de identidad del tenant y los globales. */
  @Get('auth-providers/identity-providers')
  @Roles('IDENTITY_ADMIN')
  @ApiOperation({
    summary: 'Listar los proveedores de identidad del tenant y los globales',
  })
  @ApiOkResponse({ type: IdentityProviderPageDto })
  listIdentityProviders(
    @Query() query: ListIdentityProvidersQueryDto,
  ): Promise<IdentityProviderPageDto> {
    return this.collections.listIdentityProviders(query);
  }

  /** V40-07: listar las reglas de aprovisionamiento de un proveedor en el tenant. */
  @Get('auth-providers/identity-providers/:id/provisioning-rules')
  @Roles('IDENTITY_ADMIN')
  @ApiOperation({
    summary:
      'Listar las reglas de aprovisionamiento de un proveedor en el tenant',
  })
  @ApiOkResponse({ type: ProvisioningRulePageDto })
  listProvisioningRules(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ListProvisioningRulesQueryDto,
  ): Promise<ProvisioningRulePageDto> {
    return this.collections.listProvisioningRules(id, query);
  }

  /** V40-09: listar los proveedores habilitados en el tenant. */
  @Get('auth-providers/tenant-bindings')
  @Roles('IDENTITY_ADMIN')
  @ApiOperation({ summary: 'Listar los proveedores habilitados en el tenant' })
  @ApiOkResponse({ type: ProviderTenantBindingPageDto })
  listTenantBindings(
    @Query() query: ListTenantBindingsQueryDto,
  ): Promise<ProviderTenantBindingPageDto> {
    return this.collections.listTenantBindings(query);
  }
}
