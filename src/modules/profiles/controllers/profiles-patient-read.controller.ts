import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../common';
import { ProfilesPatientReadService } from '../services';
import {
  PatientFiliationResponseDto,
  SearchPatientsQueryDto,
  SearchPatientsResponseDto,
} from '../dto';

/**
 * Lectura de filiación de pacientes por parte del personal.
 *
 * Distinto de `GET /profiles/patients/me/summary`, que es el paciente
 * consultándose a sí mismo y exige identidad verificada. Aquí lee quien atiende,
 * y por eso el acceso se restringe por rol.
 */
@ApiTags('profiles-patients-read')
@ApiBearerAuth()
@Controller('profiles/patients')
export class ProfilesPatientReadController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param readService - Valor de read service requerido por la operación.
   */
  constructor(private readonly readService: ProfilesPatientReadService) {}

  /** Búsqueda de pacientes por nombre o código. */
  @Get()
  @Roles('SECURITY_ADMIN', 'PRACTITIONER', 'SCHEDULING_AGENT', 'SECRETARY')
  @ApiOperation({ summary: 'Buscar pacientes por nombre o código' })
  search(
    @Query() query: SearchPatientsQueryDto,
  ): Promise<SearchPatientsResponseDto> {
    return this.readService.searchPatients(query);
  }

  /**
   * Filiación completa de un paciente: la lectura que sostiene la F-01.
   *
   * La ruta va después de `me/summary` en el orden de declaración de Nest, pero
   * no compite con ella: `me` no es un UUID y `ParseUUIDPipe` lo rechazaría, así
   * que la ruta literal siempre gana.
   */
  @Get(':profileId')
  @Roles('SECURITY_ADMIN', 'PRACTITIONER', 'SCHEDULING_AGENT', 'SECRETARY')
  @ApiOperation({
    summary: 'Consultar la filiación completa de un paciente',
    description:
      'Incluye vínculos de identidad, contactos de emergencia y representación legal.',
  })
  getFiliation(
    @Param('profileId', ParseUUIDPipe) profileId: string,
  ): Promise<PatientFiliationResponseDto> {
    return this.readService.getFiliation(profileId);
  }
}
