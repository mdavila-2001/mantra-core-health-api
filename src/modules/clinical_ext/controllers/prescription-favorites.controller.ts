import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthenticatedUser } from '../../../common';
import { PrescriptionFavoritesService } from '../services';
import {
  CreatePrescriptionFavoriteDto,
  PrescriptionFavoriteResponseDto,
} from '../dto';

/**
 * Favoritos de prescripción del profesional (`/prescription-favorites`).
 *
 * Las tres rutas operan siempre sobre la lista de **quien pide**: no hay
 * `practitionerProfileId` en la ruta ni en el cuerpo, porque el dueño se deduce
 * del vínculo de la cuenta. Sin `@Roles`: el filtro real es tener perfil
 * profesional, que es un dato de la cuenta y no un rol — si no lo tiene, el
 * servicio responde 403 diciendo exactamente eso.
 */
@ApiTags('clinical-ext-prescription-favorites')
@ApiBearerAuth()
@Controller('prescription-favorites')
export class PrescriptionFavoritesController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param favoritesService - Valor de favorites service requerido por la operación.
   */
  constructor(
    private readonly favoritesService: PrescriptionFavoritesService,
  ) {}

  /** La lista personal completa, ordenada por rótulo. */
  @Get()
  @ApiOperation({
    summary: 'Listar mis favoritos de prescripción',
    description:
      'Devuelve la lista completa del profesional de la sesión, ordenada por ' +
      'rótulo: es una lista personal y corta que el cliente consume entera.',
  })
  listOwn(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PrescriptionFavoriteResponseDto[]> {
    return this.favoritesService.listOwn(actor);
  }

  /** Guarda una indicación repetida como favorito. */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Guardar un favorito de prescripción' })
  create(
    @Body() dto: CreatePrescriptionFavoriteDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PrescriptionFavoriteResponseDto> {
    return this.favoritesService.create(dto, actor);
  }

  /** Borra un favorito propio. */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Borrar un favorito de prescripción propio' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<void> {
    return this.favoritesService.remove(id, actor);
  }
}
