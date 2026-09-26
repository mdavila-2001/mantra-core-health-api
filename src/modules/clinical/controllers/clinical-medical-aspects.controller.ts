import { Body, Controller, Get, HttpCode, HttpStatus, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthenticatedUser } from '../../../common';
import { MedicalAspectsService } from '../services';
import {
  MedicalAspectsResponseDto,
  UpdateOwnMedicalAspectsDto,
} from '../dto';

/**
 * Autoservicio del paciente sobre `/clinical/me/medical-aspects` (FT-22, D-B).
 *
 * **Sin `@Roles` a propósito**, igual que `forms/me` y `surveys/me`: el filtro
 * real no es un rol —todas las cuentas de paciente comparten el mismo— sino
 * tener perfil de paciente, y el servidor lo resuelve por el vínculo de la
 * cuenta. El identificador del paciente **no se acepta por parámetro**: si se
 * aceptara, cualquiera podría leer o pisar la declaración de otro.
 */
@ApiTags('clinical-me')
@ApiBearerAuth()
@Controller('clinical/me/medical-aspects')
export class ClinicalMedicalAspectsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param medicalAspects - Lectura y escritura de la declaración del titular.
   */
  constructor(private readonly medicalAspects: MedicalAspectsService) {}

  /** Lo que la persona declaró de su salud; `{}` si nunca declaró nada. */
  @Get()
  @ApiOperation({ summary: 'Ver mis aspectos médicos declarados' })
  getOwn(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MedicalAspectsResponseDto> {
    return this.medicalAspects.getOwn(actor);
  }

  /**
   * Guarda lo declarado. Campo ausente = no tocar; `''` = borrar. Responde el
   * estado completo resultante.
   */
  @Put()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Guardar mis aspectos médicos declarados' })
  updateOwn(
    @Body() dto: UpdateOwnMedicalAspectsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MedicalAspectsResponseDto> {
    return this.medicalAspects.updateOwn(dto, actor);
  }
}
