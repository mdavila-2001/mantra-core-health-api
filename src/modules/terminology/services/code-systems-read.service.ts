import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';

import { CONCEPTS } from '../../../common';
import { CodeSystems, CodeSystemVersions } from '../entities';
import type {
  CodeSystemListItemDto,
  CodeSystemVersionListItemDto,
} from '../dto/code-systems-read.dto';

/**
 * Tope de sistemas y de versiones que se devuelven.
 *
 * No es paginación: es un catálogo de administración con decenas de filas, no
 * miles. Si algún día crece, el tope avisa antes de que la pantalla empiece a
 * mentir por omisión.
 */
const TOPE = 200;

/**
 * Lectura de sistemas de codificación y sus versiones.
 *
 * ## Por qué existe
 *
 * Porque no se podían leer. `terminology/code-systems` sólo tenía dos altas, así
 * que cualquier pantalla que quisiera importar conceptos no tenía forma de
 * ofrecer a qué versión — el identificador había que sacarlo de la respuesta del
 * alta y anotarlo a mano.
 *
 * ## Por qué es un servicio aparte del de escritura
 *
 * `CodeSystemsService` es dueño de transacciones: crea sistemas, versiones y sus
 * fuentes. Esto no escribe nada. Mezclarlos daría una clase que cambia por dos
 * motivos distintos.
 */
@Injectable()
export class CodeSystemsReadService {
  /**
   * Inicializa el servicio.
   *
   * @param em - Contexto de persistencia.
   */
  constructor(private readonly em: EntityManager) {}

  /**
   * Los sistemas de codificación registrados.
   *
   * @returns Los sistemas, por su código interno.
   */
  async listCodeSystems(): Promise<CodeSystemListItemDto[]> {
    const filas = await this.em
      .fork()
      .find(CodeSystems, {}, { orderBy: { internalCode: 'asc' }, limit: TOPE });

    return filas.map((sistema) => ({
      id: sistema.id,
      internalCode: sistema.internalCode,
      name: sistema.name,
      canonicalUrl: sistema.canonicalUrl,
    }));
  }

  /**
   * Las versiones de un sistema de codificación.
   *
   * El estado viaja traducido a una palabra —`DRAFT`, `ACTIVE`, `UNKNOWN`— y no
   * como uuid: quien elige una versión para importar necesita saber si la
   * admite, y un identificador no responde eso. `UNKNOWN` es el caso real de las
   * versiones que dejaron los importadores externos sin fijar estado.
   *
   * @param codeSystemId - Sistema cuyas versiones se listan.
   * @returns Las versiones, de la más nueva a la más vieja.
   */
  async listVersions(
    codeSystemId: string,
  ): Promise<CodeSystemVersionListItemDto[]> {
    const filas = await this.em
      .fork()
      .find(
        CodeSystemVersions,
        { codeSystemId },
        { orderBy: { version: 'desc' }, limit: TOPE },
      );

    return filas.map((version) => ({
      id: version.id,
      version: version.version,
      state: estadoLegible(version.stateConceptId),
      isDefault: version.isDefault === true,
      publishedAt: version.publishedAt ?? null,
      // Una versión sin estado admite conceptos igual que un borrador: es el
      // mismo criterio con el que la importación y la publicación la aceptan.
      acceptsConcepts: version.stateConceptId !== CONCEPTS.TERM_ACTIVE,
    }));
  }
}

/**
 * Traduce el concepto de estado a una palabra.
 *
 * @param stateConceptId - El estado tal como está guardado.
 * @returns La palabra que la pantalla puede mostrar.
 */
function estadoLegible(
  stateConceptId: string | null | undefined,
): 'DRAFT' | 'ACTIVE' | 'UNKNOWN' {
  if (stateConceptId === CONCEPTS.TERM_ACTIVE) return 'ACTIVE';
  if (stateConceptId === CONCEPTS.TERM_DRAFT) return 'DRAFT';
  return 'UNKNOWN';
}
