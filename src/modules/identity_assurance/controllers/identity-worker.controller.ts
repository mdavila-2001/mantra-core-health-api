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
  Optional,
} from '@nestjs/common';
import { IsOptional, IsUUID } from 'class-validator';
import { IdentityEvidenceLifecycleService } from '../services/identity-evidence-lifecycle.service';
import { IdentityEvidenceStoragePurgeService } from '../services/identity-evidence-storage-purge.service';
import { StorageLifecycleDenied } from '../../../common/storage/storage-lifecycle.protocol';

export class EvidenceLifecycleScanDto {
  @IsOptional() @IsUUID() cursor?: string;
}
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  ParseOptionalLimitPipe,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { IdentityChecksService } from '../services';
import {
  AttemptResponseDto,
  CheckResultResponseDto,
  DispatchableChecksResponseDto,
  RecordAttemptDto,
  RecordResultDto,
} from '../dto';

/**
 * Superficie que consume el worker de `identity_assurance`.
 *
 * Va aparte de `IdentityChecksController` a propósito: aquéllas son operaciones
 * de gobierno que ejecuta un administrador con un veredicto ya decidido por una
 * persona; éstas las ejecuta un proceso automático que descubre trabajo y
 * asienta lo que dijo la autoridad externa. Compartir ruta obligaría a que el
 * rol `SYSTEM` heredara la superficie administrativa entera.
 */
@ApiTags('identity_assurance')
@ApiBearerAuth()
@Controller('internal/identity')
export class IdentityWorkerController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param checksService - Valor de checks service requerido por la operación.
   */
  constructor(
    private readonly checksService: IdentityChecksService,
    @Optional() private readonly lifecycle?: IdentityEvidenceLifecycleService,
    @Optional()
    private readonly storagePurge?: IdentityEvidenceStoragePurgeService,
  ) {}

  @Post('evidence/storage-purge-review')
  @Roles('SYSTEM')
  @ApiOperation({
    summary: 'Recheck retired evidence objects; never grants physical delete',
  })
  storagePurgeReview() {
    if (!this.storagePurge)
      throw new StorageLifecycleDenied('LIFECYCLE_WIRING_MISSING');
    return this.storagePurge.review();
  }

  @Post('evidence/lifecycle-scan')
  @Roles('SYSTEM')
  @ApiOperation({
    summary:
      'Evaluate configured evidence lifecycle; destructive runtime remains blocked',
  })
  lifecycleScan(@Body() dto: EvidenceLifecycleScanDto) {
    if (!this.lifecycle)
      throw new StorageLifecycleDenied('LIFECYCLE_WIRING_MISSING');
    return this.lifecycle.scan(dto.cursor);
  }

  /** Descubrimiento: qué checks hay que despachar o seguir esperando. */
  @Get('checks/dispatchable')
  @Roles('SYSTEM', 'SECURITY_ADMIN')
  @ApiOperation({
    summary: 'Listar los checks que el worker debe atender en este tick',
  })
  listDispatchable(
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<DispatchableChecksResponseDto> {
    return this.checksService.listDispatchable(limit);
  }

  /** Asienta el intento de despacho contra la autoridad externa. */
  @Post('checks/:id/attempts')
  @Roles('SYSTEM', 'SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar el intento del worker contra la autoridad externa',
  })
  recordAttempt(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordAttemptDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AttemptResponseDto> {
    return this.checksService.recordAttempt(id, dto, actor);
  }

  /**
   * Asienta el veredicto de la autoridad. Es el punto que puede cerrar el caso
   * (verificarlo y emitir su aserción, o rechazarlo).
   */
  @Post('checks/:id/results')
  @Roles('SYSTEM', 'SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar el veredicto que devolvió la autoridad externa',
  })
  recordResult(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordResultDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CheckResultResponseDto> {
    return this.checksService.recordResult(id, dto, actor);
  }
}
