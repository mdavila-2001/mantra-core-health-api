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
import { PracticeWorkforceService } from '../services';
import {
  CreateSupportAssignmentDto,
  SupportAssignmentResponseDto,
  RoleAssignmentTransitionDto,
  RoleAssignmentResponseDto,
} from '../dto';

/**
 * Endpoints con raíz en `/role-assignments`: personal de apoyo a un rol, y
 * (Carril 18) el ciclo de vida que la organización ejerce sobre una
 * vinculación profesional-organización — aprobarla, rechazarla, suspenderla o
 * finalizarla (spec línea 1655). Rol `SECURITY_ADMIN`: es quien administra la
 * organización, igual que el resto de las escrituras de este módulo.
 */
@ApiTags('practice')
@ApiBearerAuth()
@Controller('role-assignments')
export class RoleAssignmentsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param workforceService - Valor de workforce service requerido por la operación.
   */
  constructor(private readonly workforceService: PracticeWorkforceService) {}

  /** UC-14-09. */
  @Post(':roleId/support-assignments')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Adjuntar personal de apoyo a un rol de profesional',
  })
  attachSupport(
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Body() dto: CreateSupportAssignmentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SupportAssignmentResponseDto> {
    return this.workforceService.attachSupport(roleId, dto, actor);
  }

  /** Carril 18: `PENDING → ACTIVE`. */
  @Post(':roleId/approve')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aprobar una vinculación pendiente' })
  approve(
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Body() dto: RoleAssignmentTransitionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RoleAssignmentResponseDto> {
    return this.workforceService.approveAssignment(roleId, dto, actor);
  }

  /** Carril 18: `PENDING → REJECTED`. */
  @Post(':roleId/reject')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rechazar una vinculación pendiente' })
  reject(
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Body() dto: RoleAssignmentTransitionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RoleAssignmentResponseDto> {
    return this.workforceService.rejectAssignment(roleId, dto, actor);
  }

  /** Carril 18: `ACTIVE → SUSPENDED`. */
  @Post(':roleId/suspend')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspender una vinculación activa' })
  suspend(
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Body() dto: RoleAssignmentTransitionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RoleAssignmentResponseDto> {
    return this.workforceService.suspendAssignment(roleId, dto, actor);
  }

  /** Carril 18: `ACTIVE|SUSPENDED → ENDED`. */
  @Post(':roleId/end')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Finalizar una vinculación' })
  end(
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Body() dto: RoleAssignmentTransitionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RoleAssignmentResponseDto> {
    return this.workforceService.endAssignment(roleId, dto, actor);
  }
}
