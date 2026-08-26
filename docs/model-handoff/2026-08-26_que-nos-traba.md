# Qué nos traba — estado honesto al 26/08

**De:** Justin · **Para:** el equipo
**Todo lo de acá está verificado**, no supuesto: cada punto dice cómo se comprobó.

---

## Antes que nada: Marcelo entregó tres cosas

Y con eso desbloqueó buena parte de lo que estaba trabado ayer.

| Pedido | Estado |
|---|---|
| Los cinco estados del vínculo (con `DECLARED`) | ✅ en `profiles.concepts.ts` |
| Los peldaños de la escalera de organización | ✅ en `directory.concepts.ts` |
| Columna del motivo de rechazo | ✅ `decision_reason_text` |

**Ya usamos los estados** (PR #229) — `DECLARADO` funciona: el médico del
hospital público publica, y lo que no tiene es el sello de la institución.

---

## Lo que nos traba HOY, en orden de cuánto duele

### 1 · Publicar agenda en un hospital · **decisión de arquitectura**

**El síntoma:** un médico con vínculo aprobado a la Caja Petrolera **sigue sin
poder publicar agenda ahí**.

**La causa, verificada:** un interceptor global
(`src/common/tenant/tenant-context.interceptor.ts`) rechaza cualquier petición
cuyo cuerpo declare un tenant ajeno al del actor. Sólo `SUPERADMIN` y `SYSTEM`
pueden elegir tenant. Y aprobar un vínculo **no crea membresía** — se comprobó
aprobando y contando: cero.

Es una frontera de aislamiento multi-tenant, deliberada. **No se toca.**

**Lo que hace falta decidir:** ¿aprobar un vínculo debe otorgar membresía? El
problema es que la membresía habilita **todo** lo de esa organización, y lo que
la Caja aceptó fue que el médico atienda, no que administre.

Tres caminos, en `2026-08-26_mac-vinculo-el-eslabon-que-falta.md`. Mi voto:
membresía con rol asistencial acotado.

**Ojo:** esto **no** bloquea al médico en su consultorio propio. Eso funciona
hoy y funcionó siempre. Lo que espera es el caso multi-sede — MEDICO 3.1 y 3.2
del registro de procesos.

### 2 · El backfill de v4.1.9 · **Marcelo**

Los cinco estados nuevos existen, pero **las filas vivas siguen con los ids
viejos escritos**. Nuestra PR #229 lo sortea leyendo los dos —escribe con los
nuevos, acepta los viejos— y eso funciona, pero es un puente, no la orilla.

Hasta que el patch corra, `IDS_ACEPTADOS` no se puede podar: borrarlo hoy deja
sin publicar a todo médico con un vínculo ya aprobado.

### 3 · Verificar lo que subimos · **nuestro, y hoy no se pudo**

**Docker está apagado en esta máquina**, así que las PRs #229 (API) y #226
(front) van con pruebas unitarias y **sin haberse ejercitado contra la base**.

No es un detalle: la #229 cambia **cómo se leen los vínculos que ya existen**.
Si la tabla de transición tiene un hueco, un médico que hoy publica deja de
poder — sin error y sin aviso.

Y esta semana ya pasó dos veces que algo pasaba los tests y estaba mal: un
cargador que prometía idempotencia y duplicó siete sedes, y una regla completa
que resultó **inalcanzable** en producción. Las dos aparecieron **ejecutando**.

**Lo que falta correr:** un alta de vínculo contra base viva, con los dos
caminos — id viejo sigue habilitando, id nuevo nace declarado.

### 4 · FAR-E1 · **Marcelo**, y ya está afilado

El bloqueador de Ender está verificado: sus cinco afirmaciones se sostienen.
Faltan seis campos comerciales sin dónde persistirse.

Le pasamos un dato que achica la decisión:
`pharmacy_inventory.medication_dispensation_lines` **ya tiene el patrón de
precio congelado** (`unit_price_amount`, `patient_amount`, `insurer_amount`), así
que «¿dónde ponemos los precios?» pasa a ser «¿copiamos la forma de al lado?».

**Pero la moneda sí es nueva** — esa tabla no la guarda, y en todo el módulo sólo
aparece en dos tablas del flujo proveedor.

### 5 · Datos que sólo puede dar el cliente

**El padrón de médicos está al 8 %.** De 170 filas, **157 están vacías** —sólo el
número de orden—. De las 13 personas reales, sólo **4** tenían lo mínimo para
existir como cuenta, y las cuatro están cargadas.

**Tres médicos están a un correo de distancia:** GARCIA, ALGARAÑAZ y CONFESSORI
tienen cédula y matrícula. Con esos tres correos pasamos de 4 a 7 mañana. Es el
pedido más barato que hay.

**Y hay que conversar si el correo debe ser obligatorio.** En el archivo hay
**12 celulares y 4 correos**. Si el celular pudiera ser la llave de la cuenta,
pasaríamos de 4 médicos a 12 sin pedir un dato nuevo.

**Las 896 ocupaciones del SEGIP** (punto 1.4 del registro) no están en ningún
markdown que tengamos.

---

## Cosas chicas que encontramos y nadie tomó

- **No existe operación para revocar un vínculo aprobado.** El concepto
  `AFFILIATION_REVOKED` ya está, y nada lo escribe: `decidir()` exige que el
  vínculo esté pendiente. O sea que el gating al aceptar defiende un estado que
  hoy sólo se alcanza escribiendo en la base a mano.
- **La columna del motivo existe y nadie la escribe.** `decision_reason_text`
  está en la entidad; el `reason` del rechazo sigue yendo sólo al log. Es
  trabajo chico y cierra un circuito que hoy es mudo.
- **El circuito del vínculo no avisa nada.** Ni al médico cuando lo aprueban, ni
  a la organización cuando alguien pide. La infraestructura existe y tiene
  cuatro tipos de aviso funcionando.
- **El colegio no cambia solo.** El registro lo pide **dos veces** (1.4.4 y
  1.21.1) con mayúsculas. Hoy `regulatoryAuthority` es texto libre de 200
  caracteres. Ojo: el modelo declara **dos** categorías de profesional, así que
  distinguir odontólogo de médico probablemente necesite un concepto nuevo.
- **El consultorio no guarda su GPS** (punto 1.22). La tabla de direcciones
  **sí** tiene latitud y longitud y la sede se ata a una dirección: la
  estructura está, el flujo no la usa.
- **Hay dos conceptos distintos con el código `PENDING`.** No rompe nada hoy
  porque el código usa el id derivado, pero una consulta por código puede tomar
  el equivocado.
- **Pablo tiene dos commits varados** en `pablo/seeder-vitrina-publica` sin PR:
  la foto de perfil que se sube y se ve, y la farmacia verificada en su vertical.

---

## Preguntas — ¿nos hacemos cargo nosotros?

Varias de estas las podemos tomar nosotros en vez de esperar. Decidan ustedes:

1. **La membresía al aprobar** (bloqueador 1). ¿Lo diseñamos y lo proponemos
   como PR, o prefieren definirlo entre ustedes primero? Toca autorización, así
   que no avanzamos sin luz verde.

2. **El backfill de v4.1.9** (bloqueador 2). ¿Lo escribimos nosotros como patch
   en `SQL/patches/` para que Marcelo sólo revise, o lo hace él?

3. **Los avisos del vínculo.** Es lo único sustancial sin trabar. ¿Arrancamos?

4. **El motivo del rechazo.** La columna está; falta escribirla y devolverla.
   Chico y cierra un circuito mudo. ¿Lo tomamos?

5. **La revocación.** ¿La construimos —que es lo que le da sentido al gating que
   ya está— o esperamos a que alguien la pida?

6. **Los tres correos y el padrón completo.** ¿Quién se lo pide al cliente?
   ¿Y abrimos la conversación de si el correo debe ser obligatorio?

7. **El colegio automático y el GPS del consultorio.** Los dos están en el
   registro de procesos y ninguno está hecho. ¿Entran en esta tanda o en la
   siguiente?

---

## Y una cosa que quiero decir de frente

Vengo produciendo PRs rápido y **ninguna de hoy está mergeada**. Apilar más
encima de trabajo sin revisar ni verificar sube el riesgo en vez de bajarlo: si
algo de la #229 está mal, lo que construyamos arriba hereda el error.

Mi recomendación sincera: **verificar contra una base viva y que alguien revise
lo que hay**, antes de agregar. Después seguimos con los avisos.
