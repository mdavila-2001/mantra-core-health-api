import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import {
  AddMaterialAssetDto,
  ChangeProductStatusDto,
  CreateInformationalMaterialDto,
  CreatePharmaProductDto,
  CreatedResourceDto,
  DecideMaterialDto,
  TransitionResultDto,
  UpdatePharmaProductDto,
} from '../dto';
import type {
  InformationalMaterials,
  MaterialApprovals,
  MaterialAssets,
  PharmaProducts,
} from '../entities';
import { PharmaCatalogService } from '../services';

/**
 * Catálogo de medicamentos y material informativo (UC-17-21 a UC-17-26).
 * Capa fina que delega en `PharmaCatalogService`.
 */
@ApiTags('pharma-lab-catalog')
@ApiBearerAuth()
@Controller('pharma-labs/:pharmaLabId')
export class PharmaCatalogController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Casos de uso del catálogo.
   */
  constructor(private readonly service: PharmaCatalogService) {}

  /** UC-17-21. */
  @Post('products')
  @HttpCode(HttpStatus.CREATED)
  @Roles('PHARMA_LAB_ADMIN', 'REGULATORY_AFFAIRS', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Registrar un medicamento en el catálogo' })
  createProduct(
    @Param('pharmaLabId', ParseUUIDPipe) pharmaLabId: string,
    @Body() dto: CreatePharmaProductDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.service.createProduct(pharmaLabId, dto, actor);
  }

  /** Catálogo del laboratorio. */
  @Get('products')
  @Roles(
    'PHARMA_LAB_ADMIN',
    'REGULATORY_AFFAIRS',
    'MEDICAL_VISITOR',
    'PLATFORM_ADMIN',
  )
  @ApiOperation({ summary: 'Listar el catálogo de medicamentos' })
  listProducts(
    @Param('pharmaLabId', ParseUUIDPipe) pharmaLabId: string,
  ): Promise<PharmaProducts[]> {
    return this.service.listProducts(pharmaLabId);
  }

  /** UC-17-22. */
  @Patch('products/:productId')
  @Roles('PHARMA_LAB_ADMIN', 'REGULATORY_AFFAIRS', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Actualizar un medicamento' })
  updateProduct(
    @Param('pharmaLabId', ParseUUIDPipe) pharmaLabId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: UpdatePharmaProductDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TransitionResultDto> {
    return this.service.updateProduct(pharmaLabId, productId, dto, actor);
  }

  /** UC-17-23. */
  @Post('products/:productId/status')
  @Roles('PHARMA_LAB_ADMIN', 'REGULATORY_AFFAIRS', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Cambiar el estado regulatorio de un medicamento' })
  changeProductStatus(
    @Param('pharmaLabId', ParseUUIDPipe) pharmaLabId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: ChangeProductStatusDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TransitionResultDto> {
    return this.service.changeProductStatus(pharmaLabId, productId, dto, actor);
  }

  /** UC-17-24. */
  @Post('materials')
  @HttpCode(HttpStatus.CREATED)
  @Roles('PHARMA_LAB_ADMIN', 'REGULATORY_AFFAIRS', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Crear material informativo (nace en borrador)' })
  createMaterial(
    @Param('pharmaLabId', ParseUUIDPipe) pharmaLabId: string,
    @Body() dto: CreateInformationalMaterialDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.service.createMaterial(pharmaLabId, dto, actor);
  }

  /** Material informativo del laboratorio. */
  @Get('materials')
  @Roles(
    'PHARMA_LAB_ADMIN',
    'REGULATORY_AFFAIRS',
    'MEDICAL_VISITOR',
    'PLATFORM_ADMIN',
  )
  @ApiOperation({ summary: 'Listar el material informativo' })
  listMaterials(
    @Param('pharmaLabId', ParseUUIDPipe) pharmaLabId: string,
  ): Promise<InformationalMaterials[]> {
    return this.service.listMaterials(pharmaLabId);
  }

  /** UC-17-25. */
  @Post('materials/:materialId/assets')
  @HttpCode(HttpStatus.CREATED)
  @Roles('PHARMA_LAB_ADMIN', 'REGULATORY_AFFAIRS', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Adjuntar un archivo al material' })
  addAsset(
    @Param('pharmaLabId', ParseUUIDPipe) pharmaLabId: string,
    @Param('materialId', ParseUUIDPipe) materialId: string,
    @Body() dto: AddMaterialAssetDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.service.addAsset(pharmaLabId, materialId, dto, actor);
  }

  /** Adjuntos del material. */
  @Get('materials/:materialId/assets')
  @Roles(
    'PHARMA_LAB_ADMIN',
    'REGULATORY_AFFAIRS',
    'MEDICAL_VISITOR',
    'PLATFORM_ADMIN',
  )
  @ApiOperation({ summary: 'Listar los adjuntos del material' })
  listAssets(
    @Param('pharmaLabId', ParseUUIDPipe) pharmaLabId: string,
    @Param('materialId', ParseUUIDPipe) materialId: string,
  ): Promise<MaterialAssets[]> {
    return this.service.listAssets(pharmaLabId, materialId);
  }

  /** Envío a revisión interna. */
  @Post('materials/:materialId/submit')
  @Roles('PHARMA_LAB_ADMIN', 'REGULATORY_AFFAIRS', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Enviar el material a revisión interna' })
  submitMaterial(
    @Param('pharmaLabId', ParseUUIDPipe) pharmaLabId: string,
    @Param('materialId', ParseUUIDPipe) materialId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TransitionResultDto> {
    return this.service.submitMaterialForReview(pharmaLabId, materialId, actor);
  }

  /** UC-17-26. */
  @Post('materials/:materialId/decision')
  @Roles('PHARMA_LAB_ADMIN', 'REGULATORY_AFFAIRS', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Aprobar o rechazar el material' })
  decideMaterial(
    @Param('pharmaLabId', ParseUUIDPipe) pharmaLabId: string,
    @Param('materialId', ParseUUIDPipe) materialId: string,
    @Body() dto: DecideMaterialDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TransitionResultDto> {
    return this.service.decideMaterial(pharmaLabId, materialId, dto, actor);
  }

  /** Historial de revisiones del material. */
  @Get('materials/:materialId/approvals')
  @Roles('PHARMA_LAB_ADMIN', 'REGULATORY_AFFAIRS', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Historial de revisiones del material' })
  listApprovals(
    @Param('pharmaLabId', ParseUUIDPipe) pharmaLabId: string,
    @Param('materialId', ParseUUIDPipe) materialId: string,
  ): Promise<MaterialApprovals[]> {
    return this.service.listApprovals(pharmaLabId, materialId);
  }
}
