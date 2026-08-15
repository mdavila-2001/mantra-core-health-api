import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import {
  CreateMedicalVisitorDto,
  CreatedResourceDto,
  RelinkMedicalVisitorDto,
  SetVisitorProductsDto,
  SetVisitorSpecialtiesDto,
  TransitionResultDto,
  UnlinkDto,
  UnlinkResultDto,
  VerifyMedicalVisitorDto,
} from '../dto';
import type { MedicalVisitors } from '../entities';
import { MedicalVisitorsService } from '../services';

/**
 * Visitadores médicos de un laboratorio (UC-17-06 a UC-17-10).
 *
 * Todas las rutas cuelgan del laboratorio y no existe ninguna de auto-registro:
 * la spec exige que la cuenta la cree la organización y dependa de ella, y la
 * forma del recurso lo refleja.
 */
@ApiTags('pharma-lab-visitors')
@ApiBearerAuth()
@Roles('PHARMA_LAB_ADMIN', 'BUSINESS_ADMIN', 'PLATFORM_ADMIN')
@Controller('pharma-labs/:pharmaLabId/medical-visitors')
export class MedicalVisitorsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Casos de uso del visitador.
   */
  constructor(private readonly service: MedicalVisitorsService) {}

  /** UC-17-06. */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un visitador médico' })
  create(
    @Param('pharmaLabId', ParseUUIDPipe) pharmaLabId: string,
    @Body() dto: CreateMedicalVisitorDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.service.createVisitor(pharmaLabId, dto, actor);
  }

  /** Listado de visitadores del laboratorio. */
  @Get()
  @ApiOperation({ summary: 'Listar los visitadores del laboratorio' })
  list(
    @Param('pharmaLabId', ParseUUIDPipe) pharmaLabId: string,
  ): Promise<MedicalVisitors[]> {
    return this.service.listVisitors(pharmaLabId);
  }

  /** UC-17-07. */
  @Post(':medicalVisitorId/verifications')
  @ApiOperation({ summary: 'Registrar las verificaciones del visitador' })
  verify(
    @Param('pharmaLabId', ParseUUIDPipe) pharmaLabId: string,
    @Param('medicalVisitorId', ParseUUIDPipe) medicalVisitorId: string,
    @Body() dto: VerifyMedicalVisitorDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TransitionResultDto> {
    return this.service.verifyVisitor(
      pharmaLabId,
      medicalVisitorId,
      dto,
      actor,
    );
  }

  /** UC-17-09. */
  @Put(':medicalVisitorId/products')
  @ApiOperation({ summary: 'Fijar los productos que el visitador representa' })
  setProducts(
    @Param('pharmaLabId', ParseUUIDPipe) pharmaLabId: string,
    @Param('medicalVisitorId', ParseUUIDPipe) medicalVisitorId: string,
    @Body() dto: SetVisitorProductsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TransitionResultDto> {
    return this.service.setProducts(pharmaLabId, medicalVisitorId, dto, actor);
  }

  /** UC-17-10. */
  @Put(':medicalVisitorId/specialties')
  @ApiOperation({ summary: 'Fijar las especialidades que el visitador visita' })
  setSpecialties(
    @Param('pharmaLabId', ParseUUIDPipe) pharmaLabId: string,
    @Param('medicalVisitorId', ParseUUIDPipe) medicalVisitorId: string,
    @Body() dto: SetVisitorSpecialtiesDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TransitionResultDto> {
    return this.service.setSpecialties(
      pharmaLabId,
      medicalVisitorId,
      dto,
      actor,
    );
  }

  /** UC-17-08: desvinculación con revocación efectiva de accesos. */
  @Post(':medicalVisitorId/unlink')
  @ApiOperation({
    summary: 'Desvincular al visitador y revocar sus accesos',
    description:
      'Desactiva la cuenta, cierra sus sesiones, revoca sus permisos y cancela sus visitas pendientes. Conserva el registro para auditoría.',
  })
  unlink(
    @Param('pharmaLabId', ParseUUIDPipe) pharmaLabId: string,
    @Param('medicalVisitorId', ParseUUIDPipe) medicalVisitorId: string,
    @Body() dto: UnlinkDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<UnlinkResultDto> {
    return this.service.unlinkVisitor(
      pharmaLabId,
      medicalVisitorId,
      dto,
      actor,
    );
  }

  /** Revinculación autorizada (spec 5340). */
  @Post(':medicalVisitorId/relink')
  @ApiOperation({ summary: 'Revincular a un visitador con nueva autorización' })
  relink(
    @Param('pharmaLabId', ParseUUIDPipe) pharmaLabId: string,
    @Param('medicalVisitorId', ParseUUIDPipe) medicalVisitorId: string,
    @Body() dto: RelinkMedicalVisitorDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TransitionResultDto> {
    return this.service.relinkVisitor(
      pharmaLabId,
      medicalVisitorId,
      dto,
      actor,
    );
  }
}
