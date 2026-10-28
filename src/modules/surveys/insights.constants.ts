/**
 * Reglas de privacidad del resumen agregado (`GET /surveys/insights`).
 *
 * Un resumen sobre pocas respuestas deja de ser un agregado: con un periodo de
 * un día, o un servicio poco usado, el «promedio» o el «comentario» es de UNA
 * persona, y en la encuesta base de sistema el médico no puede leer respuestas
 * individuales. Todas las cotas viven acá para que contrato, servicio y pruebas
 * hablen de los mismos números.
 */

/**
 * Respuestas mínimas para mostrar cualquier cálculo. Si el alcance filtrado
 * tiene menos respondidas, sólo salen los totales; lo mismo vale por pregunta,
 * por punto de la tendencia y por NPS.
 */
export const MIN_COHORT = 5;

/** Amplitud máxima del periodo, en días (ambos extremos incluidos). */
export const MAX_RANGE_DAYS = 366;

/** Periodo por defecto cuando falta `from`: los últimos 365 días. */
export const DEFAULT_RANGE_DAYS = 365;

/** Tope de comentarios devueltos. */
export const MAX_COMMENTS = 20;

/** Una fecha de día, sin componente horario. */
export const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
