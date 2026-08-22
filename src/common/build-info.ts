/**
 * Identidad del artefacto que está corriendo.
 *
 * Existe porque no había forma de saber qué código tenía un contenedor sin
 * entrar a inspeccionarle el `dist/`. Eso costó caro una vez: la imagen de
 * desarrollo quedó un día entera por detrás de `dev` y le faltaban tres seeds
 * (glosario, formularios clínicos y permisos de plataforma). Las tablas
 * correspondientes estaban vacías, el arranque no decía nada, y la conclusión
 * natural —«los seeds están rotos»— era falsa: el código de esos seeds ni
 * siquiera estaba en la imagen.
 *
 * Los valores llegan por entorno porque el commit sólo se conoce al construir,
 * no al compilar. El `Dockerfile` los recibe como `ARG` y los fija como `ENV`;
 * fuera de Docker quedan en `desconocido`, que es información honesta y no un
 * valor inventado.
 */
export interface BuildInfo {
  /** Versión declarada en `package.json`. */
  version: string;
  /** Commit con el que se construyó la imagen, o `desconocido` fuera de Docker. */
  commit: string;
  /** Momento de la construcción en ISO-8601, o `desconocido`. */
  builtAt: string;
  /** Entorno declarado (`NODE_ENV`). */
  nodeEnv: string;
}

/** Lo que se muestra cuando el dato no viajó en la imagen. */
const SIN_DATO = 'desconocido';

/**
 * Resuelve la identidad del artefacto.
 *
 * @param source - Entorno a leer; parametrizado para poder probarlo.
 * @param version - Versión del paquete; se inyecta para no acoplar el módulo
 *   a la forma en que cada entrypoint carga `package.json`.
 */
export function loadBuildInfo(
  source: NodeJS.ProcessEnv = process.env,
  version = source.npm_package_version ?? SIN_DATO,
): BuildInfo {
  return {
    version,
    // `GIT_COMMIT` es el nombre que ya usan los `ARG` del Dockerfile; se acepta
    // `SOURCE_COMMIT` porque es lo que inyectan varios registries al construir.
    commit: source.GIT_COMMIT ?? source.SOURCE_COMMIT ?? SIN_DATO,
    builtAt: source.BUILD_TIME ?? SIN_DATO,
    nodeEnv: source.NODE_ENV ?? SIN_DATO,
  };
}

/**
 * Arma la línea corta que se escribe al arrancar.
 *
 * Una sola línea, con el commit acortado igual que lo muestra `git log --oneline`:
 * la idea es poder comparar de un vistazo contra la rama sin copiar y pegar.
 *
 * @param info - La identidad ya resuelta.
 */
export function describeBuild(info: BuildInfo): string {
  const commitCorto =
    info.commit === SIN_DATO ? SIN_DATO : info.commit.slice(0, 8);
  return (
    `Arranca v${info.version} · commit ${commitCorto} · ` +
    `construido ${info.builtAt} · entorno ${info.nodeEnv}`
  );
}
