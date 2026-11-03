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

/**
 * Amplitud máxima del periodo, en meses calendario. El periodo va de un primer
 * día de mes a un último día de mes: ventanas arbitrarias (de un día, o corridas
 * de a un día) permiten restar dos resúmenes casi iguales y aislar una respuesta.
 * Con meses enteros hay a lo sumo 12 ventanas distintas por año; la cohorte
 * mínima las acota, pero sin ruido añadido no hay protección total contra la
 * comparación de ventanas casi iguales o de `serviceId` distintos: es un riesgo
 * residual aceptado.
 */
export const MAX_RANGE_MONTHS = 12;

/** Tope de comentarios devueltos. */
export const MAX_COMMENTS = 20;

/** Un primer día de mes (`from`). */
export const MONTH_START_PATTERN = /^\d{4}-\d{2}-01$/;

/** Una fecha de día, sin componente horario. */
export const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
