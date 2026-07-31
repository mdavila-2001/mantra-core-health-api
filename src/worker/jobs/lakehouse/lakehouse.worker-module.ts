import { Module } from '@nestjs/common';
import { ReleaseExpiryJob } from './release-expiry.job';

export { ReleaseExpiryJob } from './release-expiry.job';

/**
 * Cierra el "bucle del worker" que `lakehouse/README.md` deja pendiente para
 * la caducidad de releases de investigación (UC-63-12). Las corridas de
 * transformación, la ingesta curada y las corridas de calidad no entran aquí:
 * necesitan un `defId`/`inputManifestFileId` que viene de otro módulo o de un
 * catálogo sin endpoint de alta en este repo (`transformation_definitions`,
 * lotes de `health_data`), no de un descubrimiento propio de este módulo.
 */
@Module({
  providers: [ReleaseExpiryJob],
})
export class LakehouseWorkerModule {}
