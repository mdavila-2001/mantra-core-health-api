import { ApiProperty } from '@nestjs/swagger';

/**
 * Las cinco etapas del alta del profesional, en el orden en que se recorren.
 *
 * Son claves y no números: el orden puede cambiar y un `2` guardado en algún
 * lado dejaría de significar lo mismo. La pantalla las traduce.
 */
export const PASOS_DE_ONBOARDING = [
  'professional-data',
  'photo',
  'organizations',
  'schedule',
  'review',
] as const;

/** Una de las cinco etapas. */
export type PasoDeOnboarding = (typeof PASOS_DE_ONBOARDING)[number];

/** El estado de una etapa concreta. */
export class OnboardingStepDto {
  /** Qué etapa es. */
  @ApiProperty({ enum: PASOS_DE_ONBOARDING }) key!: PasoDeOnboarding;

  /** Está cumplida con los datos que el profesional ya cargó. */
  @ApiProperty() complete!: boolean;

  /**
   * Qué falta, en claves estables que la pantalla traduce.
   *
   * Van en clave y no en prosa porque el texto es del front: acá se dice qué
   * falta, no cómo se le pide a la persona.
   */
  @ApiProperty({ type: [String] }) missing!: string[];
}

/**
 * En qué punto del alta está el profesional.
 *
 * ## Por qué no hay columna de «paso actual»
 *
 * Porque el paso **se deriva de los datos que ya existen**: si tiene matrícula
 * y especialidad, el paso 1 está hecho; si tiene foto, el 2. Guardar el paso en
 * una columna crea un segundo estado que puede contradecir al primero — alguien
 * carga su foto por otra pantalla y el contador sigue diciendo que le falta.
 *
 * Retomable sale gratis: al volver a entrar se recalcula. Y los profesionales
 * que ya estaban completos **antes** de que este asistente existiera aparecen
 * completos sin migrar una sola fila.
 */
export class PractitionerOnboardingDto {
  /** El perfil consultado. */
  @ApiProperty({ format: 'uuid' }) practitionerProfileId!: string;

  /** Las cinco etapas, siempre las cinco y en orden. */
  @ApiProperty({ type: [OnboardingStepDto] }) steps!: OnboardingStepDto[];

  /**
   * La primera etapa incompleta, o `done` si no queda ninguna.
   *
   * Es lo único que la pantalla necesita para decidir dónde aterrizar.
   */
  @ApiProperty({ enum: [...PASOS_DE_ONBOARDING, 'done'] })
  firstIncomplete!: PasoDeOnboarding | 'done';
}
