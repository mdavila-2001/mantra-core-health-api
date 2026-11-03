import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { RegisterSupportStaffDto } from '../../iam/presentation/dto/register-support-staff.dto';

/**
 * Cuerpo para crear una secretaria directamente desde la sesión del doctor.
 * Crea la cuenta, persona, perfil de secretaria y el vínculo de apoyo ACTIVO
 * con la vinculación indicada en un único paso atómico.
 */
export class CreatePractitionerSupportStaffDto extends RegisterSupportStaffDto {
  /** Vinculación del doctor a la que se asocia la secretaria de inmediato. */
  @ApiProperty({
    format: 'uuid',
    description:
      'ID de la vinculación del doctor (practitioner_role_assignment_id)',
  })
  @IsUUID()
  practitionerRoleAssignmentId!: string;
}
