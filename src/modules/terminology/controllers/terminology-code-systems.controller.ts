import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { CodeSystemsReadService, CodeSystemsService } from '../services';
import {
  CreateCodeSystemDto,
  CodeSystemResponseDto,
  CreateCodeSystemVersionDto,
  CodeSystemVersionResponseDto,
  ListCodeSystemsResponseDto,
  ListCodeSystemVersionsResponseDto,
} from '../dto';

/**
 * Endpoints de administración de sistemas de códigos y sus versiones (UC-03-01,
 * UC-03-02). Reservados a `SECURITY_ADMIN`.
 */
@ApiTags('terminology')
@ApiBearerAuth()
@Controller('terminology/code-systems')
export class TerminologyCodeSystemsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param codeSystemsService - Valor de code systems service requerido por la operación.
   * @param readService - Cara de lectura de sistemas y versiones.
   */
  constructor(
    private readonly codeSystemsService: CodeSystemsService,
    private readonly readService: CodeSystemsReadService,
  ) {}

  /**
   * Los sistemas de codificación registrados.
   *
   * Existe porque no se podían leer: sin esto, una pantalla que quiera importar
   * conceptos no tiene forma de ofrecer a qué sistema, y el identificador había
   * que sacarlo de la respuesta del alta y anotarlo a mano.
   *
   * @returns Los sistemas registrados.
   */
  @Get()
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Sistemas de códigos registrados' })
  async listCodeSystems(): Promise<ListCodeSystemsResponseDto> {
    return { items: await this.readService.listCodeSystems() };
  }

  /**
   * Las versiones de un sistema de codificación.
   *
   * Cada una dice si **admite conceptos**, que es la pregunta que se hace quien
   * va a importar: una versión publicada ya no los acepta.
   *
   * @param id - Sistema cuyas versiones se listan.
   * @returns Las versiones, de la más nueva a la más vieja.
   */
  @Get(':id/versions')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Versiones de un sistema de códigos' })
  async listVersions(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ListCodeSystemVersionsResponseDto> {
    return { items: await this.readService.listVersions(id) };
  }

  /**
   * Crea create code system.
   *
   * @param dto - Datos validados de la operación.
   * @param user - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de create code system conforme al contrato `Promise<CodeSystemResponseDto>`.
   */
  @Post()
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'UC-03-01: crea un sistema de códigos y su fuente' })
  createCodeSystem(
    @Body() dto: CreateCodeSystemDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CodeSystemResponseDto> {
    return this.codeSystemsService.createCodeSystem(dto, user);
  }

  /**
   * Crea create version.
   *
   * @param id - Identificador de id.
   * @param dto - Datos validados de la operación.
   * @param user - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de create version conforme al contrato `Promise<CodeSystemVersionResponseDto>`.
   */
  @Post(':id/versions')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'UC-03-02: crea una versión (borrador) de un sistema de códigos',
  })
  createVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCodeSystemVersionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CodeSystemVersionResponseDto> {
    return this.codeSystemsService.createVersion(id, dto, user);
  }
}
