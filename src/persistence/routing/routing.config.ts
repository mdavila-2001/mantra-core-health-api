import { DataSourceConfigurationError } from '../errors/persistence.errors';

/**
 * Reglas declarativas de enrutado de datos.
 *
 * Son datos, no código: se pueden validar en el arranque, imprimir en un
 * informe y comparar entre entornos. La alternativa -un `switch` por módulo
 * repartido entre servicios- no se puede hacer ninguna de las tres cosas, y es
 * lo que el §13 y el §14 prohíben.
 */

/** Destino de las dos rutas de un módulo. */
export interface ModuleRoutingRule {
  /** Nombre lógico de la conexión que atiende las lecturas. */
  readonly read: string;
  /** Nombre lógico de la conexión que atiende las escrituras. */
  readonly write: string;
}

/** Tabla de enrutado: una regla por defecto y las excepciones por módulo. */
export interface RoutingRules {
  /** Regla que aplica a todo módulo sin excepción declarada. */
  readonly default: ModuleRoutingRule;
  /** Excepciones, indexadas por nombre de módulo. */
  readonly modules: Readonly<Record<string, ModuleRoutingRule>>;
}

/**
 * Tabla por defecto de este backend.
 *
 * Solo declara la regla general. No hay ni una excepción por módulo, y eso es
 * deliberado: los tres módulos que sí hablan con otro motor -`document_store`
 * con MongoDB, `redis_runtime` con Redis y `search_platform` con OpenSearch- no
 * tienen ninguna entidad del ORM y no pasan por esta capa en absoluto, así que
 * enrutarlos aquí sería declarar un gobierno que no se ejerce. El día que uno
 * de ellos exponga un puerto, su regla se añade aquí y el §15 valida que el
 * motor destino tenga las capacidades que la ruta exige.
 */
export function defaultRoutingRules(
  readConnection: string,
  writeConnection: string,
): RoutingRules {
  return {
    default: { read: readConnection, write: writeConnection },
    modules: {},
  };
}

/**
 * Valida que toda conexión referenciada exista y que ninguna ruta de escritura
 * apunte a una conexión de solo lectura.
 *
 * Se ejecuta en el arranque, no en la primera petición. Un enrutado que manda
 * escrituras a la réplica no falla al configurarse: falla la primera vez que
 * alguien reserva una cita, en producción, con un error del motor que nadie
 * relaciona con un fichero de configuración.
 *
 * @param rules tabla a validar.
 * @param roleOf resuelve el papel de una conexión, o `undefined` si no existe.
 */
export function validateRoutingRules(
  rules: RoutingRules,
  roleOf: (name: string) => string | undefined,
): void {
  const problems: string[] = [];

  const check = (scope: string, rule: ModuleRoutingRule): void => {
    const readRole = roleOf(rule.read);
    const writeRole = roleOf(rule.write);

    if (readRole === undefined) {
      problems.push(`«${scope}.read» apunta a «${rule.read}», que no está registrada.`);
    }
    if (writeRole === undefined) {
      problems.push(`«${scope}.write» apunta a «${rule.write}», que no está registrada.`);
    }
    if (writeRole === 'read') {
      problems.push(
        `«${scope}.write» apunta a «${rule.write}», que está declarada como de solo lectura.`,
      );
    }
    if (writeRole === 'admin') {
      problems.push(
        `«${scope}.write» apunta a «${rule.write}», que es la conexión administrativa. ` +
          `El §21 reserva ese rol para migraciones y aprovisionamiento.`,
      );
    }
    if (readRole === 'admin') {
      problems.push(
        `«${scope}.read» apunta a «${rule.read}», que es la conexión administrativa.`,
      );
    }
  };

  check('default', rules.default);
  for (const [module, rule] of Object.entries(rules.modules)) {
    check(module, rule);
  }

  if (problems.length > 0) {
    throw new DataSourceConfigurationError(
      `Enrutado de datos inválido:\n  - ${problems.join('\n  - ')}`,
    );
  }
}
