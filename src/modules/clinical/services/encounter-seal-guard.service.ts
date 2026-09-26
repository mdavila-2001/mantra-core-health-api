import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PreconditionFailedException } from '../../../common';
import { EncountersRepository } from '../repositories';

/**
 * BR-14 (CL-07): un encuentro FINISHED y sellado (`sealedAt`/`contentHash`
 * calculados por {@link EncounterSealService} al cerrarlo) no admite más
 * escrituras que lo referencien por `encounterId`. Antes de este archivo,
 * ningún servicio fuera de `encounters.service.ts` rechazaba una escritura
 * posterior: un diagnóstico, una observación, un plan o un documento podían
 * registrarse contra un encuentro ya sellado y el `content_hash` quedaba
 * describiendo un contenido que ya no era el real, sin que nada lo detectara.
 *
 * Decisión de producto (ver `docs/progress/DECISIONS.md`, D-BR14-01): opción
 * (a) del prompt BR-14 — rechazar con 422, no crear un addendum. Un addendum
 * append-only pediría una tabla nueva (prohibido: sin DDL en la API) y una
 * decisión de producto que nadie tomó todavía.
 *
 * Vive como archivo y clase **nuevos**, independientes de
 * `encounter-seal.service.ts` (que sólo calcula el hash al cerrar) para no
 * tocar ese archivo ni los servicios de escritura que ya existen más de lo
 * necesario: cada servicio que necesite la regla la llama desde acá.
 *
 * `conditions.service.ts` y `observations.service.ts` (este módulo) y
 * `chart-care-plans.service.ts`/`chart-documents.service.ts` (`ChartModule`,
 * que ya importa `ClinicalModule`) la invocan. `medications.service.ts`,
 * `allergy-intolerances.service.ts` y `chart-notes.service.ts` son de M3
 * (receta, alergia, notas) y quedan **fuera de este cambio**: la guarda queda
 * lista y exportada para que M3 la cablee en esos tres servicios.
 */
@Injectable()
export class EncounterSealGuardService {
  constructor(private readonly encountersRepo: EncountersRepository) {}

  /**
   * Rechaza la escritura si el encuentro está sellado.
   *
   * No valida que el encuentro exista ni que sea del paciente correcto: eso
   * ya lo hace, antes de esta llamada, la comprobación de pertenencia de cada
   * servicio (p. ej. `assertEncounterBelongsToPatient`). Esta función sólo
   * añade la pregunta que faltaba: ¿sigue abierto?
   *
   * @param tx - Transacción activa de la escritura.
   * @param encounterId - El encuentro referenciado por la escritura.
   * @throws PreconditionFailedException si el encuentro ya está sellado.
   */
  async assertEncounterWritable(
    tx: EntityManager,
    encounterId: string,
  ): Promise<void> {
    const encounter = await this.encountersRepo.findById(tx, encounterId);
    if (encounter?.sealedAt) {
      throw new PreconditionFailedException(
        'El encuentro ya está cerrado y sellado: no admite más escrituras.',
        { encounterId },
      );
    }
  }
}
