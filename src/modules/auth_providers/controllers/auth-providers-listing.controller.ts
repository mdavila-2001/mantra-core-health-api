import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  ParseOptionalLimitPipe,
  Roles,
  requireTenantId,
} from '../../../common';
import { AuthProvidersListingService } from '../services';
import {
  IdentityProviderDetailDto,
  ListIdentityProvidersResponseDto,
} from '../dto/listings.dto';

/** CV-13: lecturas del hub de proveedores de identidad, sin secretos y acotadas al tenant. */
@ApiTags('auth-providers')
@ApiBearerAuth()
@Controller('auth-providers')
export class AuthProvidersListingController {
  constructor(private readonly service: AuthProvidersListingService) {}

  @Get('identity-providers')
  @Roles('IDENTITY_ADMIN')
  @ApiOperation({
    summary: 'Listar los proveedores de identidad visibles para el tenant',
  })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiOkResponse({ type: ListIdentityProvidersResponseDto })
  list(
    @Query('cursor') cursor?: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<ListIdentityProvidersResponseDto> {
    return this.service.listProviders(requireTenantId(), { cursor, limit });
  }

  @Get('identity-providers/:providerId')
  @Roles('IDENTITY_ADMIN')
  @ApiOperation({
    summary: 'Ficha de un proveedor de identidad (sin secretos)',
  })
  @ApiOkResponse({ type: IdentityProviderDetailDto })
  @ApiNotFoundResponse({
    description: 'El proveedor no existe o es de otro tenant',
  })
  get(
    @Param('providerId', ParseUUIDPipe) providerId: string,
  ): Promise<IdentityProviderDetailDto> {
    return this.service.getProvider(requireTenantId(), providerId);
  }
}
