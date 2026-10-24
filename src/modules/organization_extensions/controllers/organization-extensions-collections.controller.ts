import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common';
import { OrganizationExtensionsCollectionsService } from '../services';
import {
  FacilityLicensePageDto,
  HospitalPageDto,
  ListDataBoundariesQueryDto,
  ListFacilityLicensesQueryDto,
  ListHospitalsQueryDto,
  OrganizationDataBoundaryPageDto,
} from '../dto';

/**
 * `GET` de colección de `organization_extensions` que el catálogo de vistas esperaba.
 *
 * Cada handler declara su `@Roles(...)`: el mismo que exigen las escrituras
 * del recurso. La página la acota al tenant del contexto el servicio.
 */
@ApiTags('organization-extensions-collections')
@ApiBearerAuth()
@Controller()
export class OrganizationExtensionsCollectionsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param collections - Lecturas de colección del módulo.
   */
  constructor(
    private readonly collections: OrganizationExtensionsCollectionsService,
  ) {}

  /** V22-02: listar licencias de establecimiento del tenant. */
  @Get('orgext/facility-licenses')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Listar licencias de establecimiento del tenant' })
  @ApiOkResponse({ type: FacilityLicensePageDto })
  listFacilityLicenses(
    @Query() query: ListFacilityLicensesQueryDto,
  ): Promise<FacilityLicensePageDto> {
    return this.collections.listFacilityLicenses(query);
  }

  /** V22-03: listar hospitales del tenant. */
  @Get('orgext/hospitals')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Listar hospitales del tenant' })
  @ApiOkResponse({ type: HospitalPageDto })
  listHospitals(
    @Query() query: ListHospitalsQueryDto,
  ): Promise<HospitalPageDto> {
    return this.collections.listHospitals(query);
  }

  /** V22-05: listar fronteras de datos del tenant. */
  @Get('orgext/data-boundaries')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Listar fronteras de datos del tenant' })
  @ApiOkResponse({ type: OrganizationDataBoundaryPageDto })
  listDataBoundaries(
    @Query() query: ListDataBoundariesQueryDto,
  ): Promise<OrganizationDataBoundaryPageDto> {
    return this.collections.listDataBoundaries(query);
  }
}
