import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import {
  StorageGovernanceService,
  DatasetGovernanceService,
  StorageOperationsService,
} from '../services';
import {
  RegisterBackendDto,
  BackendResponseDto,
  DefineDatasetDto,
  DatasetResponseDto,
  PublishDatasetVersionDto,
  DatasetVersionResponseDto,
  DefineCollectionDto,
  CollectionResponseDto,
  ApprovePlacementDto,
  PlacementResponseDto,
  DefineConsistencyPolicyDto,
  PolicyResponseDto,
  DefineAccessPolicyDto,
  AccessPolicyResponseDto,
  BindTenantStorageDto,
  TenantBindingResponseDto,
  DefineEncryptionProfileDto,
  EncryptionProfileResponseDto,
  DefineStoragePoliciesDto,
  StoragePoliciesResponseDto,
  FailoverPlacementDto,
  FailoverResponseDto,
} from '../dto';

/** Endpoints de gobierno del almacenamiento políglota. */
@ApiTags('polyglot-governance')
@ApiBearerAuth()
@Controller('governance')
export class StorageGovernanceController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param governanceService - Valor de governance service requerido por la operación.
   * @param datasetService - Valor de dataset service requerido por la operación.
   * @param operationsService - Valor de operations service requerido por la operación.
   */
  constructor(
    private readonly governanceService: StorageGovernanceService,
    private readonly datasetService: DatasetGovernanceService,
    private readonly operationsService: StorageOperationsService,
  ) {}

  /** UC-54-01. */
  @Post('storage-backends')
  @Roles('PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar un backend con sus regiones y capacidades',
    description:
      'Nace registrado, no activo: declararlo no es haber comprobado que responde.',
  })
  registerBackend(
    @Body() dto: RegisterBackendDto,
  ): Promise<BackendResponseDto> {
    return this.governanceService.registerBackend(dto);
  }

  /** UC-54-02. */
  @Post('datasets')
  @Roles('GOVERNANCE_ADMIN', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Definir un dataset gobernado con su versión inicial',
    description:
      'Nace en borrador con la versión 1.0.0 en la misma transacción.',
  })
  defineDataset(@Body() dto: DefineDatasetDto): Promise<DatasetResponseDto> {
    return this.datasetService.defineDataset(dto);
  }

  /** UC-54-03. */
  @Post('datasets/:id/versions')
  @Roles('GOVERNANCE_ADMIN', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Publicar una versión nueva del dataset',
    description:
      'La anterior queda superseded; una sucesora debe declarar su compatibilidad.',
  })
  publishDatasetVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PublishDatasetVersionDto,
  ): Promise<DatasetVersionResponseDto> {
    return this.datasetService.publishDatasetVersion(id, dto);
  }

  /** UC-54-04. */
  @Post('collections')
  @Roles('GOVERNANCE_ADMIN', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Definir una colección física y su esquema versionado',
    description:
      'Exige dataset activo: no se ata almacenamiento a algo que aún puede cambiar.',
  })
  defineCollection(
    @Body() dto: DefineCollectionDto,
  ): Promise<CollectionResponseDto> {
    return this.governanceService.defineCollection(dto);
  }

  /** UC-54-05. */
  @Post('placements/approve')
  @Roles('GOVERNANCE_ADMIN', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Aprobar una colocación respetando residencia y clasificación',
    description:
      'Residencia, clasificación, cifrado y aislamiento deben cumplirse a la vez.',
  })
  approvePlacement(
    @Body() dto: ApprovePlacementDto,
  ): Promise<PlacementResponseDto> {
    return this.datasetService.approvePlacement(dto);
  }

  /** UC-54-06. */
  @Post('consistency-policies')
  @Roles('GOVERNANCE_ADMIN', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Definir una política de consistencia',
    description:
      'Leer lo propio recién escrito obliga a tolerancia cero de lectura rancia.',
  })
  defineConsistencyPolicy(
    @Body() dto: DefineConsistencyPolicyDto,
  ): Promise<PolicyResponseDto> {
    return this.governanceService.defineConsistencyPolicy(dto);
  }

  /** UC-54-07. */
  @Post('datasets/:id/data-access-policies')
  @Roles('GOVERNANCE_ADMIN', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Definir la política de acceso al dato del dataset',
  })
  defineAccessPolicy(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DefineAccessPolicyDto,
  ): Promise<AccessPolicyResponseDto> {
    return this.datasetService.defineAccessPolicy(id, dto);
  }

  /** UC-54-08. */
  @Post('tenants/:tenantId/storage-bindings')
  @Roles('GOVERNANCE_ADMIN', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Vincular el tenant a su colocación',
    description:
      'Activa la colocación: sin vínculo no debe escribirse en el backend.',
  })
  bindTenantStorage(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: BindTenantStorageDto,
  ): Promise<TenantBindingResponseDto> {
    return this.datasetService.bindTenantStorage(tenantId, dto);
  }

  /** UC-54-09. */
  @Post('encryption-profiles')
  @Roles('SECURITY_ADMIN', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Definir un perfil de cifrado con su política de rotación',
    description: 'La referencia apunta al KMS; la clave nunca pasa por aquí.',
  })
  defineEncryptionProfile(
    @Body() dto: DefineEncryptionProfileDto,
  ): Promise<EncryptionProfileResponseDto> {
    return this.governanceService.defineEncryptionProfile(dto);
  }

  /** UC-54-10. */
  @Post('policies')
  @Roles('GOVERNANCE_ADMIN', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Definir políticas de residencia, replicación y retención',
    description:
      'Las tres caras de la misma decisión sobre dónde vive el dato.',
  })
  defineStoragePolicies(
    @Body() dto: DefineStoragePoliciesDto,
  ): Promise<StoragePoliciesResponseDto> {
    return this.governanceService.defineStoragePolicies(dto);
  }

  /** UC-54-11. */
  @Post('placements/:id/failover')
  @Roles('PLATFORM_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Forzar el failover de una colocación',
    description:
      'Los vínculos con secundario mueven su primario; el resto se queda.',
  })
  failoverPlacement(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: FailoverPlacementDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<FailoverResponseDto> {
    return this.operationsService.failoverPlacement(id, dto, actor);
  }
}
