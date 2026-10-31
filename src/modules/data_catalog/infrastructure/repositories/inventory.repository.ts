import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  Injectable,
  ServiceUnavailableException,
  type OnModuleInit,
} from '@nestjs/common';
import { INVENTARIO_DIR_ENV } from '../../data_catalog.constants';
import type {
  ArbolRecord,
  CatalogoIndice,
  GlosarioRecord,
  GrafoProceso,
  HallazgoRecord,
  Linaje,
  MapaFila,
  MaquinaRecord,
  OperacionRecord,
  ProcesoRecord,
  TablaRecord,
} from '../../domain/inventory/inventory.types';

/**
 * Lee el inventario generado (`inventario/**`) y lo sirve desde memoria.
 *
 * El inventario no es una base de datos: son archivos que genera
 * `tools/inventario/*.mjs` a partir del código y del modelo y que viajan con la
 * versión de la API que los generó. Se leen **la primera vez que se piden** y se
 * guardan, porque son decenas de megabytes y la mayoría de las instancias nunca
 * los usa.
 *
 * Si el directorio no está, las rutas responden **503 con un mensaje que dice qué
 * falta**, no 500: el resto de la API no depende del inventario y no debe caerse
 * por él.
 */
@Injectable()
export class InventoryRepository implements OnModuleInit {
  private readonly cache = new Map<string, unknown>();

  /** Directorio de los JSON; se resuelve en cada lectura para que una prueba pueda cambiarlo. */
  directory(): string {
    return resolve(
      process.env[INVENTARIO_DIR_ENV] ?? join(process.cwd(), 'inventario'),
    );
  }

  /** ¿Está el inventario? Las pruebas y el arranque lo preguntan sin lanzar. */
  isAvailable(): boolean {
    return existsSync(join(this.directory(), 'endpoints', 'indice.json'));
  }

  onModuleInit(): void {
    // No falla el arranque: sólo deja constancia, porque una instancia puede
    // desplegarse a propósito sin el inventario (workers, réplicas de lectura).
    this.cache.clear();
  }

  /** Vacía lo leído. Existe para las pruebas que cambian de directorio. */
  reset(): void {
    this.cache.clear();
  }

  private raw(relative: string): string {
    const key = `${this.directory()}::raw::${relative}`;
    if (this.cache.has(key)) return this.cache.get(key) as string;
    const file = join(this.directory(), relative);
    if (!existsSync(file)) {
      throw new ServiceUnavailableException(
        `El inventario del portal no está disponible: falta ${relative}. Se genera con \`yarn inventario:endpoints\`, \`yarn inventario:flujos\` y \`yarn inventario:catalogo\`, o se apunta con ${INVENTARIO_DIR_ENV}.`,
      );
    }
    const text = readFileSync(file, 'utf8');
    this.cache.set(key, text);
    return text;
  }

  private read<T>(relative: string): T {
    const key = `${this.directory()}::${relative}`;
    if (this.cache.has(key)) return this.cache.get(key) as T;
    let value: unknown;
    try {
      value = JSON.parse(this.raw(relative));
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      throw new ServiceUnavailableException(
        `El inventario del portal está dañado: ${relative} no es un JSON válido. Regenerarlo con \`yarn inventario:verificar\`.`,
      );
    }
    this.cache.set(key, value);
    return value as T;
  }

  private readDirectory<T>(
    relative: string,
    exclude: readonly string[] = [],
  ): T[] {
    const key = `${this.directory()}::${relative}/*`;
    if (this.cache.has(key)) return this.cache.get(key) as T[];
    const dir = join(this.directory(), relative);
    if (!existsSync(dir)) {
      throw new ServiceUnavailableException(
        `El inventario del portal no está disponible: falta el directorio ${relative}.`,
      );
    }
    const all = readdirSync(dir)
      .filter((f) => f.endsWith('.json') && !exclude.includes(f))
      .sort()
      .flatMap((f) => this.read<T[]>(`${relative}/${f}`));
    this.cache.set(key, all);
    return all;
  }

  operaciones(): OperacionRecord[] {
    return this.readDirectory<OperacionRecord>('endpoints', ['indice.json']);
  }

  /** Árboles de decisión por operación (`inventario/arboles/<módulo>.json`). */
  arboles(): Map<string, ArbolRecord> {
    const key = `${this.directory()}::arboles-map`;
    if (!this.cache.has(key))
      this.cache.set(
        key,
        new Map(
          this.readDirectory<ArbolRecord>('arboles').map((a) => [a.id, a]),
        ),
      );
    return this.cache.get(key) as Map<string, ArbolRecord>;
  }

  procesos(): ProcesoRecord[] {
    return this.read<ProcesoRecord[]>('flujos/procesos.json');
  }

  maquinas(): MaquinaRecord[] {
    return this.read<MaquinaRecord[]>('flujos/maquinas.json');
  }

  mapa(): MapaFila[] {
    return this.read<MapaFila[]>('flujos/mapa.json');
  }

  hallazgos(): HallazgoRecord[] {
    return this.read<HallazgoRecord[]>('flujos/hallazgos.json');
  }

  /** Grafo de un proceso; `codigo` ya viene validado por el servicio. */
  grafo(archivo: string): GrafoProceso {
    return this.read<GrafoProceso>(`grafos/${archivo}`);
  }

  linaje(): Linaje {
    return this.read<Linaje>('grafos/linaje.json');
  }

  catalogoIndice(): CatalogoIndice {
    return this.read<CatalogoIndice>('catalogo/indice.json');
  }

  /** Fichas de tablas de un schema (`inventario/catalogo/<schema>.json`). */
  tablasDeSchema(schema: string): TablaRecord[] {
    return this.read<TablaRecord[]>(`catalogo/${schema}.json`);
  }

  glosario(): GlosarioRecord[] {
    return this.read<GlosarioRecord[]>('glosario.json');
  }

  /**
   * Huella del inventario: cambia cuando cambia el contenido de los índices. Sirve para que el
   * portal muestre «datos de tal versión» y para detectar un inventario desactualizado.
   */
  version(): {
    hash: string;
    operaciones: number;
    procesos: number;
    tablas: number;
    columnas: number;
  } {
    const hash = createHash('sha256');
    for (const f of [
      'endpoints/indice.json',
      'catalogo/indice.json',
      'flujos/hallazgos.json',
    ])
      hash.update(this.raw(f));
    const catalogo = this.catalogoIndice();
    return {
      hash: hash.digest('hex').slice(0, 16),
      operaciones: this.read<{ resumen: { total: number } }>(
        'endpoints/indice.json',
      ).resumen.total,
      procesos: this.procesos().length,
      tablas: catalogo.resumen.tablas,
      columnas: catalogo.resumen.columnas,
    };
  }
}
