import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { PrescriptionSignaturePoliciesService } from '../services';
import {
  CreatePrescriptionSignaturePolicyDto,
  PrescriptionSignaturePolicyResponseDto,
} from '../dto';

/**
 * Administración de la política PARAMETRIZABLE de firma de receta (REDESA D-05 /
 * CAN-RX). Alta, listado y desactivación (sin borrado duro). La resolución en el
 * flujo de emisión es FAIL-SAFE: sin política vigente aplicable no se exige firma.
 */
@ApiTags('clinical-prescription-policies')
@ApiBearerAuth()
@Roles('CLINICIAN', 'SECURITY_ADMIN')
@Controller('clinical/prescription-signature-policies')
export class ClinicalPrescriptionPoliciesController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param policiesService - Valor de policies service requerido por la operación.
   */
  constructor(
    private readonly policiesService: PrescriptionSignaturePoliciesService,
  ) {}

  /**
   * Crea create.
   *
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de create conforme al contrato `Promise<PrescriptionSignaturePolicyResponseDto>`.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una política de firma de receta' })
  create(
    @Body() dto: CreatePrescriptionSignaturePolicyDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PrescriptionSignaturePolicyResponseDto> {
    return this.policiesService.create(dto, actor);
  }

  /**
   * Obtiene list.
   *
   * @param tenantId - Identificador de tenant.
   * @returns Resultado de list conforme al contrato `Promise<PrescriptionSignaturePolicyResponseDto[]>`.
   */
  @Get()
  @ApiOperation({ summary: 'Listar las políticas de firma de un tenant' })
  list(
    @Query('tenantId', ParseUUIDPipe) tenantId: string,
  ): Promise<PrescriptionSignaturePolicyResponseDto[]> {
    return this.policiesService.list(tenantId);
  }

  /**
   * Ejecuta la operación deactivate.
   *
   * @param id - Identificador de id.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de deactivate conforme al contrato `Promise<PrescriptionSignaturePolicyResponseDto>`.
   */
  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Desactivar una política (cierra vigencia, sin borrado duro)',
  })
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PrescriptionSignaturePolicyResponseDto> {
    return this.policiesService.deactivate(id, actor);
  }
}
