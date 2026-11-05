import { HttpStatus } from '@nestjs/common';
import { DomainException, ErrorCode } from '../../common';
import { SurveysErrorReason } from './surveys.error-reasons';
import { isSystemOwnerType } from './surveys.concepts';

/**
 * Exige que la plantilla NO sea una encuesta base del sistema.
 *
 * Es la guarda de inmutabilidad: las preguntas base están definidas en código
 * (`surveys.base-definitions.ts`), son iguales para todos y ningún profesional
 * las edita, publica, desactiva ni reparte. Se responde 403 y no 404 porque la
 * plantilla de sistema existe en todos los tenants: confirmarlo no revela nada.
 *
 * @param template - La plantilla (basta su tipo de dueño).
 * @param templateId - Identificador, para el detalle del error.
 * @throws DomainException 403 `SURVEY_SYSTEM_TEMPLATE_IMMUTABLE` si lo es.
 */
export function assertNotSystemTemplate(
  template: {
    /** Tipo del dueño alterno; los de sistema son los dos `SYSTEM_BASE_*`. */
    ownerTypeConceptId?: string | null;
  },
  templateId: string,
): void {
  if (!isSystemOwnerType(template.ownerTypeConceptId)) return;
  throw new DomainException(
    HttpStatus.FORBIDDEN,
    ErrorCode.FORBIDDEN,
    'La encuesta base del sistema no se puede modificar, publicar, desactivar ni asignar',
    { templateId },
    SurveysErrorReason.SYSTEM_TEMPLATE_IMMUTABLE,
  );
}
