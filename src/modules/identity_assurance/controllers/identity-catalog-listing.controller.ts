import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
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
import { IdentityCatalogListingService } from '../services/identity-catalog-listing.service';
import {
  ListIdentityAuthoritiesResponseDto,
  ListIdentityPoliciesResponseDto,
} from '../dto/listings.dto';

/** CV-13: listados de autoridades (del tenant) y políticas (de plataforma) de identidad. */
@ApiTags('identity-assurance')
@ApiBearerAuth()
@Controller('identity')
export class IdentityCatalogListingController {
  constructor(private readonly service: IdentityCatalogListingService) {}

  @Get('authorities')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({
    summary: 'Listar las autoridades de identidad del tenant',
  })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiOkResponse({ type: ListIdentityAuthoritiesResponseDto })
  listAuthorities(
    @Query('cursor') cursor?: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<ListIdentityAuthoritiesResponseDto> {
    return this.service.listAuthorities(requireTenantId(), { cursor, limit });
  }

  @Get('verification-policies')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({
    summary: 'Listar las políticas de verificación de identidad',
  })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiOkResponse({ type: ListIdentityPoliciesResponseDto })
  listPolicies(
    @Query('cursor') cursor?: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<ListIdentityPoliciesResponseDto> {
    return this.service.listPolicies({ cursor, limit });
  }
}
