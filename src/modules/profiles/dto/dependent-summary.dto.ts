import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { DependentRelationshipCode } from '../dependent-relationship';

/**
 * Un dependiente, tal como lo ve quien lo representa.
 *
 * Es lo que sostiene el conmutador de la cabecera y la pantalla de
 * dependientes: un nombre para mostrar, una edad para distinguir a un menor de
 * un adulto y el parentesco ya dado vuelta —«Hijo/a», no «Madre»—, de modo que
 * ningún cliente tenga que conocer los conceptos del catálogo para nombrar a un
 * hijo.
 *
 * No lleva un solo dato clínico: es filiación.
 */
export class DependentSummaryDto {
  /**
   * Identificador del apoderamiento que sostiene la representación.
   *
   * Es el de `profiles.patient_portal_proxies`, no el del dependiente: es lo
   * que hará falta el día que se pueda revocar, y tenerlo desde ahora evita que
   * la pantalla tenga que volver a buscarlo.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Perfil de paciente del dependiente. Es el que viaja en las reservas y en la
   * lectura de su historia.
   */
  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  /** Persona del dependiente. */
  @ApiProperty({ format: 'uuid' })
  personId!: string;

  /** Nombre visible, ya compuesto por el servidor. */
  @ApiProperty({ description: 'Nombre para mostrar, ya compuesto' })
  fullName!: string;

  /** Nombre de pila. */
  @ApiPropertyOptional()
  name?: string;

  /** Apellido paterno. */
  @ApiPropertyOptional()
  lastName?: string;

  /** Fecha de nacimiento, en `YYYY-MM-DD`. */
  @ApiPropertyOptional({ format: 'date', example: '2018-03-14' })
  birthDate?: string;

  /**
   * Edad cumplida, en años.
   *
   * La calcula el servidor y no el navegador: es lo que decide si la pantalla
   * dice «3 años» o «78 años», y dejarlo del lado del cliente haría que la
   * misma persona tuviera una edad distinta según la zona horaria del aparato.
   * Ausente —no cero— si no declaró fecha de nacimiento.
   */
  @ApiPropertyOptional({ description: 'Edad cumplida en años' })
  ageYears?: number;

  /** Documento de identidad del dependiente, si lo tiene. */
  @ApiPropertyOptional()
  nationalId?: string;

  /**
   * Qué es el dependiente para quien lo representa, ya dado vuelta.
   */
  @ApiProperty({
    description: 'Parentesco visto desde el dependiente',
    enum: ['CHILD', 'PARENT', 'SPOUSE', 'WARD', 'OTHER'],
  })
  relationshipCode!: DependentRelationshipCode;

  /** Cómo se dice ese parentesco en pantalla. */
  @ApiProperty({ description: 'Rótulo en castellano', example: 'Hijo/a' })
  relationshipDisplay!: string;

  /**
   * Si la fila de parentesco afirma la tutela legal.
   *
   * El alta de un dependiente la afirma; el contacto de emergencia que declara
   * cualquiera al registrarse, no. Es lo que separa «esta persona está a mi
   * cargo» de «a esta persona llamen si me pasa algo».
   */
  @ApiProperty({ description: 'Si el vínculo afirma la tutela legal' })
  isLegalGuardian!: boolean;
}
