/**
 * El padrón de correos **reales** con el que siembran todos los scripts.
 *
 * ## Por qué existe
 *
 * Los seeders daban de alta cuentas en `@redesa.test`, un dominio que **no
 * recibe correo**. Con eso se puede probar que el backend crea la solicitud de
 * notificación y que el worker la marca entregada, y no se puede probar lo
 * único que importa del canal EMAIL: que el correo **llega**, y que el texto
 * que llega está bien escrito. Un adaptador que reporta `SENT` contra un buzón
 * inexistente es una prueba que siempre pasa y nunca dice nada.
 *
 * Estas cinco direcciones son de personas del equipo y las cinco reciben de
 * verdad. Cambiarlas es cambiar este archivo: ningún script vuelve a escribir
 * una dirección a mano.
 *
 * ## Por qué las cuentas llevan una etiqueta `+algo`
 *
 * Porque las direcciones son cinco y las cuentas sembradas son muchas más, y
 * `iam.users.email` es única. Con la dirección pelada, la segunda cuenta de la
 * misma persona choca con un 409 y la corrida se cae a la mitad.
 *
 * Gmail entrega `alguien+lo-que-sea@gmail.com` en el buzón de `alguien`, así
 * que la etiqueta da unicidad **sin dejar de llegar**. Cuatro de las cinco son
 * Gmail; para la quinta —el correo institucional— se usa la dirección pelada y
 * se le reserva un papel que se crea **una sola vez** por corrida.
 *
 * ## Cuidado en producción
 *
 * `seed-dev-data.mjs` ya se niega a correr con `NODE_ENV=production` sin
 * `--force`, y esa guarda importa más ahora que antes: sembrar con estas
 * direcciones contra un entorno real le manda correo de verdad a personas de
 * verdad.
 */

/** Las cinco direcciones del equipo, en orden de reparto. */
export const CORREOS_DEL_EQUIPO = [
  'pabliarca@gmail.com',
  'cpacentropreparacionacademica@gmail.com',
  'justinsaldiasn@gmail.com',
  'redesa77@gmail.com',
  // Institucional: no se le ponen etiquetas `+`, porque no todo servidor de
  // correo universitario las entrega.
  'a2020115468@estudiantes.upsa.edu.bo',
];

/** Las que aceptan etiqueta `+`, que son las que pueden repartirse muchas veces. */
const ETIQUETABLES = CORREOS_DEL_EQUIPO.filter((correo) =>
  correo.endsWith('@gmail.com'),
);

/**
 * Los papeles fijos de la siembra.
 *
 * Se reparten a mano y no por rotación para que el equipo sepa **de memoria**
 * en qué buzón mirar cada cosa: quien prueba el alta de un médico abre el
 * primero, quien prueba la del paciente abre el tercero.
 */
export const CORREOS = {
  /** El administrador de arranque. */
  admin: 'cpacentropreparacionacademica@gmail.com',
  /** La cuenta de médico con login real. */
  doctor: 'pabliarca@gmail.com',
  /** El paciente de las altas asistidas. */
  paciente: 'justinsaldiasn@gmail.com',
  /** El segundo profesional, para las pruebas de dos sesiones. */
  segundoDoctor: 'redesa77@gmail.com',
  /**
   * Cuenta institucional. Sin etiqueta y de un solo uso por corrida: se le da
   * el papel que se crea una vez.
   */
  institucional: 'a2020115468@estudiantes.upsa.edu.bo',
};

/**
 * Una dirección real y **única** para una cuenta sembrada.
 *
 * @param {string} etiqueta - Qué es esa cuenta (`doctor`, `paciente`, `admin`…).
 * @param {string|number} sufijo - Lo que la hace única dentro de la corrida.
 * @param {number} [indice] - Para repartir entre los buzones etiquetables.
 * @returns {string} La dirección con su etiqueta `+`.
 */
export function correoDe(etiqueta, sufijo, indice = 0) {
  const base = ETIQUETABLES[indice % ETIQUETABLES.length];
  const [cuenta, dominio] = base.split('@');
  // La etiqueta se limpia: Gmail acepta letras, números, puntos y guiones, y
  // una etiqueta con un carácter raro convierte una dirección válida en un
  // rebote que después nadie entiende.
  const limpia = `${etiqueta}-${sufijo}`
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${cuenta}+${limpia}@${dominio}`;
}

/**
 * Resumen legible para el final de la siembra.
 *
 * Los scripts lo imprimen para que quien corre el seed sepa **dónde mirar** sin
 * releer este archivo.
 *
 * @returns {string} Las direcciones y su papel, una por línea.
 */
export function resumenDeCorreos() {
  return [
    'Correos reales de la siembra (revisar estos buzones):',
    `  administrador     ${CORREOS.admin}`,
    `  médico con login  ${CORREOS.doctor}`,
    `  paciente          ${CORREOS.paciente}`,
    `  segundo médico    ${CORREOS.segundoDoctor}`,
    `  institucional     ${CORREOS.institucional}`,
    '  Las cuentas adicionales usan etiquetas +algo sobre esos mismos buzones.',
  ].join('\n');
}
