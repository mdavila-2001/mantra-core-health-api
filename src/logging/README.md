# src/logging — Logging estructurado con pino

Un único lugar decide cómo registra **todo** el backend. La regla del proyecto es que ninguna
capa use `console`: arranque, ORM, dominios, guards, workers y peticiones HTTP escriben por
pino, con el mismo formato, nivel y redacción de secretos.

## Archivos

| Archivo | Responsabilidad |
|---|---|
| `logging.env.ts` | Valida `LOG_LEVEL` y `LOG_PRETTY` con Joi (patrón de `loadOrmEnv`) |
| `pino-options.ts` | Construye las opciones de pino: nivel, redacción, mensajes HTTP en español |
| `logging.module.ts` | `LoggingModule` global que envuelve `LoggerModule` de nestjs-pino |

## Cómo queda enrutado todo a pino

Dos piezas, en `main.ts`:

```ts
const app = await NestFactory.create(AppModule, { bufferLogs: true });
app.useLogger(app.get(Logger)); // Logger de nestjs-pino
app.flushLogs();
```

- **`bufferLogs: true`** retiene los logs de la inicialización -incluida la materialización del
  DDL, que ocurre en `OnApplicationBootstrap`- hasta que el logger definitivo está fijado. Sin
  esto, esas primeras líneas saldrían por el `ConsoleLogger` por defecto y no por pino.
- **`app.useLogger(...)`** sustituye el logger de Nest por pino. A partir de ahí no solo lo que
  inyecta `PinoLogger` va a pino: también cada `Logger` de `@nestjs/common` (el arranque del
  ORM, los servicios) queda enrutado, porque ese `Logger` delega en el que fija `useLogger`.

Por eso el puente del ORM (`src/orm/observability/orm.logger.ts`) sigue usando el `Logger` de
`@nestjs/common` y aun así sus consultas salen por pino.

## Cómo se usa desde una capa

```ts
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class FooService {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(FooService.name);
  }

  hacerAlgo(id: string): void {
    // Datos como campos, no interpolados: así se pueden filtrar en el agregador.
    this.logger.info({ id }, 'algo hecho');
  }
}
```

`LoggingModule` es global; no hay que importarlo en cada módulo.

## Configuración por entorno

| Variable | Por defecto | Efecto |
|---|---|---|
| `LOG_LEVEL` | `info` | `fatal`\|`error`\|`warn`\|`info`\|`debug`\|`trace`\|`silent`. Por debajo del nivel, la llamada es un no-op barato |
| `LOG_PRETTY` | `false` | Salida legible con `pino-pretty` en vez de JSON. Solo desarrollo |

`LOG_PRETTY=true` solo tiene efecto si `pino-pretty` está instalado (es dependencia opcional de
desarrollo); si no lo está, se cae con elegancia al JSON en vez de tumbar el proceso. Para
activarlo: `yarn add -D pino-pretty` y `LOG_PRETTY=true`.

## Redacción de secretos

`pino-options.ts` mantiene una lista de rutas que se **eliminan** del log antes de escribirlo:
la cabecera `authorization`, las cookies y los campos de cuerpo con contraseñas, tokens y OTP.
Es una lista de denegación explícita, verificada en el arranque: un `curl` con
`Authorization: Bearer ...` no deja rastro del token en los logs.

**Al añadir un endpoint que reciba un campo sensible nuevo, añádelo a `REDACT_PATHS`.** El
logging automático de peticiones serializa el cuerpo, y lo que no esté en la lista se registra
en claro.

## Mensajes en español

El logging de peticiones de pino-http trae mensajes en inglés por defecto. Se sobrescriben
(`petición recibida` / `completada` / `fallida`) para no mezclar idiomas con el resto de los
logs del proyecto.
