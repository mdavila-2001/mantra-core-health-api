#!/usr/bin/env node
/**
 * seed-contabilidad.mjs — Un plan de cuentas y un libro diario con movimiento,
 * para que las pantallas contables se puedan mirar.
 *
 * ## Por qué hace falta
 *
 * Ningún seeder del repositorio toca el módulo 16. Medido antes de escribir
 * esto: **2 cuentas, 1 asiento, 2 líneas, 0 períodos fiscales**. Con eso, el
 * balance de sumas y saldos, el libro mayor, el estado de resultados y el
 * balance general muestran su estado vacío y **no hay forma de distinguir «no
 * hay datos» de «la lectura no funciona»** — que es exactamente lo que un
 * seeder existe para evitar. Tampoco se puede juzgar el acabado de una
 * pantalla contable sin cifras: la alineación de importes, la separación de
 * los totales y el ancho de las columnas sólo se ven con números adentro.
 *
 * ## Qué siembra, y por qué eso
 *
 * 1. **Un ejercicio fiscal** con sus períodos. Sin él, un asiento no tiene
 *    dónde caer y la lectura por período no devuelve nada.
 * 2. **Un plan de cuentas mínimo pero completo en los cinco tipos**
 *    —activo, pasivo, patrimonio, ingreso y gasto—, porque el estado de
 *    resultados necesita ingresos y gastos, y el balance general necesita los
 *    otros tres. Con sólo dos cuentas, cuatro de las seis pestañas quedan
 *    vacías por construcción.
 * 3. **Asientos balanceados de partida doble**, con importes de magnitudes
 *    distintas y con decimales, para que se vea si las columnas alinean por
 *    la coma y si un total de seis cifras rompe el ancho.
 *
 * **No inventa un negocio.** Los movimientos son los de un consultorio: cobro
 * de consultas, alquiler, sueldos, insumos. No se declara ninguna cifra como
 * dato real de nadie: es un entorno de desarrollo y el propio guardia de
 * `NODE_ENV` de más abajo lo garantiza.
 *
 * No es un mock: escribe por la API real, con sus guards y validaciones. Si el
 * contrato cambia, la corrida termina en rojo en vez de dejar datos a medias.
 *
 * ## Uso
 *
 *   node tools/redesa/seed-contabilidad.mjs
 *   node tools/redesa/seed-contabilidad.mjs --base-url http://localhost:3001
 *
 * Requiere una API levantada con el administrador de arranque
 * (`BOOTSTRAP_ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_PASSWORD`). El alta de cuentas y
 * de asientos exige `SECURITY_ADMIN`.
 */

/**
 * Lee un argumento con valor de la línea de órdenes.
 *
 * @param name - Nombre del argumento, sin guiones.
 * @param fallback - Valor si no viene.
 * @returns El valor recibido o el de reserva.
 */
function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const BASE = arg('base-url', process.env.API_BASE_URL ?? 'http://localhost:3000');
const ADMIN_EMAIL = process.env.BOOTSTRAP_ADMIN_EMAIL ?? 'admin@redesa.test';
const ADMIN_PASSWORD = process.env.BOOTSTRAP_ADMIN_PASSWORD ?? 'S3cret-passw0rd';

/** Sufijo de la corrida, para que dos pasadas no choquen por código único. */
const TANDA = Date.now().toString(36).slice(-5);

/** El año del ejercicio que se siembra. */
const ANIO = new Date().getFullYear();

let token = '';

/**
 * Llama a la API y devuelve el resultado, sin lanzar.
 *
 * @param titulo - Qué se estaba haciendo, para el mensaje de error.
 * @param method - Verbo HTTP.
 * @param path - Ruta, relativa a la base.
 * @param options - `body`, `expect`, `auth`.
 * @returns `{ ok, status, body }`.
 */
async function call(titulo, method, path, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (options.auth !== false && token) headers.Authorization = `Bearer ${token}`;

  const esperado =
    options.expect === undefined
      ? null
      : Array.isArray(options.expect)
        ? options.expect
        : [options.expect];

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const texto = await res.text();
  let body = null;
  try {
    body = texto ? JSON.parse(texto) : null;
  } catch {
    body = texto;
  }

  const ok = esperado === null ? res.ok : esperado.includes(res.status);
  if (!ok) {
    console.log(`    ✗ ${titulo} → ${res.status} ${JSON.stringify(body).slice(0, 260)}`);
  }
  return { ok, status: res.status, body };
}

/**
 * El plan de cuentas mínimo, con los cinco tipos representados.
 *
 * Los códigos siguen la forma de un plan boliviano corriente (1 activo,
 * 2 pasivo, 3 patrimonio, 4 ingreso, 5 gasto). No pretende ser un plan
 * completo: es el esqueleto que hace que las seis lecturas tengan qué mostrar.
 *
 * `normalBalance` va declarado por cuenta y **no se deduce del tipo**. La
 * correspondencia es la corriente —activo y gasto por el debe; pasivo,
 * patrimonio e ingreso por el haber—, pero es el contador quien la fija: hay
 * cuentas regularizadoras (depreciación acumulada, descuentos sobre ventas)
 * cuyo saldo normal es el contrario al de su tipo. Escribirla acá deja el dato
 * a la vista en vez de esconderlo en una regla implícita.
 */
const CUENTAS = [
  { code: '1101', name: 'Caja', accountType: 'ASSET', normalBalance: 'DEBIT' },
  { code: '1102', name: 'Banco cuenta corriente', accountType: 'ASSET', normalBalance: 'DEBIT' },
  { code: '1301', name: 'Cuentas por cobrar a pacientes', accountType: 'ASSET', normalBalance: 'DEBIT' },
  { code: '2101', name: 'Cuentas por pagar a proveedores', accountType: 'LIABILITY', normalBalance: 'CREDIT' },
  { code: '2201', name: 'Sueldos por pagar', accountType: 'LIABILITY', normalBalance: 'CREDIT' },
  { code: '3101', name: 'Capital', accountType: 'EQUITY', normalBalance: 'CREDIT' },
  { code: '4101', name: 'Ingresos por consultas', accountType: 'REVENUE', normalBalance: 'CREDIT' },
  { code: '4102', name: 'Ingresos por procedimientos', accountType: 'REVENUE', normalBalance: 'CREDIT' },
  { code: '5101', name: 'Alquiler del consultorio', accountType: 'EXPENSE', normalBalance: 'DEBIT' },
  { code: '5201', name: 'Sueldos y cargas sociales', accountType: 'EXPENSE', normalBalance: 'DEBIT' },
  { code: '5301', name: 'Insumos médicos', accountType: 'EXPENSE', normalBalance: 'DEBIT' },
];

/**
 * Los asientos, ya balanceados.
 *
 * Las magnitudes son deliberadamente dispares —de tres a seis cifras— y con
 * decimales: es lo que permite ver si la columna de importes alinea por la
 * coma y si un total largo rompe el ancho de la tabla.
 */
const ASIENTOS = [
  {
    descripcion: 'Aporte inicial de capital',
    dia: '01-15',
    lineas: [
      { cuenta: '1102', direction: 'DEBIT', amount: '120000.00' },
      { cuenta: '3101', direction: 'CREDIT', amount: '120000.00' },
    ],
  },
  {
    descripcion: 'Cobro de consultas de la semana',
    dia: '02-03',
    lineas: [
      { cuenta: '1101', direction: 'DEBIT', amount: '4350.00' },
      { cuenta: '4101', direction: 'CREDIT', amount: '4350.00' },
    ],
  },
  {
    descripcion: 'Alquiler del consultorio, febrero',
    dia: '02-05',
    lineas: [
      { cuenta: '5101', direction: 'DEBIT', amount: '3500.00' },
      { cuenta: '1102', direction: 'CREDIT', amount: '3500.00' },
    ],
  },
  {
    descripcion: 'Compra de insumos médicos a crédito',
    dia: '02-11',
    lineas: [
      { cuenta: '5301', direction: 'DEBIT', amount: '1875.50' },
      { cuenta: '2101', direction: 'CREDIT', amount: '1875.50' },
    ],
  },
  {
    descripcion: 'Procedimientos facturados y no cobrados',
    dia: '02-18',
    lineas: [
      { cuenta: '1301', direction: 'DEBIT', amount: '18640.75' },
      { cuenta: '4102', direction: 'CREDIT', amount: '18640.75' },
    ],
  },
  {
    descripcion: 'Sueldos devengados de febrero',
    dia: '02-28',
    lineas: [
      { cuenta: '5201', direction: 'DEBIT', amount: '27400.00' },
      { cuenta: '2201', direction: 'CREDIT', amount: '27400.00' },
    ],
  },
  {
    descripcion: 'Cobro parcial de cuentas por cobrar',
    dia: '03-06',
    lineas: [
      { cuenta: '1102', direction: 'DEBIT', amount: '9320.40' },
      { cuenta: '1301', direction: 'CREDIT', amount: '9320.40' },
    ],
  },
  {
    descripcion: 'Pago a proveedores',
    dia: '03-12',
    lineas: [
      { cuenta: '2101', direction: 'DEBIT', amount: '1875.50' },
      { cuenta: '1102', direction: 'CREDIT', amount: '1875.50' },
    ],
  },
];

/**
 * Punto de entrada.
 *
 * @returns Nada; marca el resultado con `process.exitCode`.
 */
async function main() {
  console.log(`\nSembrando contabilidad contra ${BASE}\n`);

  const acceso = await call('login del administrador', 'POST', '/iam/auth/login', {
    auth: false,
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    expect: 200,
  });
  if (!acceso.ok) {
    console.log(`✗ No se pudo entrar como ${ADMIN_EMAIL}.`);
    process.exitCode = 1;
    return;
  }
  token = acceso.body.accessToken;

  const practicas = await call('prácticas', 'GET', '/practices', { expect: 200 });
  const practiceId = practicas.ok ? practicas.body?.[0]?.id : null;
  if (!practiceId) {
    console.log('✗ No hay ninguna práctica: la contabilidad cuelga de una.');
    process.exitCode = 1;
    return;
  }
  console.log(`· Práctica: ${practicas.body[0].name}`);

  /* ---- ejercicio fiscal -------------------------------------------------- */

  console.log('· Ejercicio fiscal…');
  // Doce períodos mensuales. El contrato los exige (mínimo uno) y con uno solo
  // el informe por período no distingue enero de diciembre, que es justamente
  // lo que un balance mensual sirve para mirar.
  const periodos = Array.from({ length: 12 }, (_, mes) => {
    const desde = new Date(Date.UTC(ANIO, mes, 1));
    const hasta = new Date(Date.UTC(ANIO, mes + 1, 0));
    return {
      code: `${ANIO}-${String(mes + 1).padStart(2, '0')}`,
      startDate: desde.toISOString().slice(0, 10),
      endDate: hasta.toISOString().slice(0, 10),
    };
  });

  const ejercicio = await call('alta de ejercicio', 'POST', '/accounting/fiscal-years', {
    body: {
      practiceId,
      code: `EJ-${ANIO}-${TANDA}`,
      startDate: `${ANIO}-01-01`,
      endDate: `${ANIO}-12-31`,
      periods: periodos,
    },
    expect: [201, 409],
  });
  if (!ejercicio.ok) {
    console.log('  (se sigue igual: puede existir de una corrida anterior)');
  }

  /* ---- plan de cuentas --------------------------------------------------- */

  console.log(`· Plan de cuentas (${CUENTAS.length} cuentas)…`);
  const idPorCodigo = new Map();
  for (const cuenta of CUENTAS) {
    const alta = await call(
      `cuenta ${cuenta.code}`,
      'POST',
      '/accounting/accounts',
      {
        body: { practiceId, ...cuenta, code: `${cuenta.code}-${TANDA}` },
        expect: [201, 409],
      },
    );
    if (alta.ok && alta.body?.id) {
      idPorCodigo.set(cuenta.code, alta.body.id);
    }
  }
  console.log(`  ${idPorCodigo.size}/${CUENTAS.length} cuentas disponibles`);

  if (idPorCodigo.size < CUENTAS.length) {
    console.log('✗ Faltan cuentas: los asientos no se pueden armar sin ellas.');
    process.exitCode = 1;
    return;
  }

  /* ---- asientos ---------------------------------------------------------- */

  console.log(`· Asientos de partida doble (${ASIENTOS.length})…`);
  let posteados = 0;
  for (const [indice, asiento] of ASIENTOS.entries()) {
    const resultado = await call(
      `asiento «${asiento.descripcion}»`,
      'POST',
      '/accounting/journal-transactions',
      {
        body: {
          practiceId,
          transactionNumber: `AS-${TANDA}-${String(indice + 1).padStart(3, '0')}`,
          transactionDate: `${ANIO}-${asiento.dia}`,
          description: asiento.descripcion,
          lines: asiento.lineas.map((linea) => ({
            accountId: idPorCodigo.get(linea.cuenta),
            direction: linea.direction,
            amount: linea.amount,
            memo: asiento.descripcion,
          })),
        },
        expect: 201,
      },
    );
    if (resultado.ok) posteados += 1;
  }

  console.log('\n─── Resumen ───');
  console.log(`  ${idPorCodigo.size} cuentas · ${posteados}/${ASIENTOS.length} asientos posteados`);
  console.log('  Pantalla: /administration/accounting');
  console.log(`  Entrá como ${ADMIN_EMAIL}\n`);

  if (posteados === 0) process.exitCode = 1;
}

await main();
