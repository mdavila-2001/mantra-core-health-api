import { Injectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { CONCEPTS, SEED, deterministicId } from '../constants/concepts';
import { STICKER_PACK } from '../constants/sticker-pack';
import { Files } from '../../modules/common/entities/files.entity';
import { FileVersions } from '../../modules/common/entities/file_versions.entity';

/**
 * Boot seed idempotente del pack de 24 stickers del producto (AG-17, BR-22).
 *
 * Mismo patrón que `AudioAssetsSeedService`: materializa filas con id fijo si
 * no existen todavía, y no toca nada si ya están. La diferencia es que acá no
 * hay bytes que subir — el front sirve el sticker desde su propio
 * `public/stickers/*.svg` (es un archivo del producto, no del usuario) — así
 * que la fila sólo existe para que `attachment_file_id` tenga a qué apuntar y
 * para que `AttachableFileService.assertVersionUsable` (vivo, con versión,
 * sin infectar, del tipo admitido) tenga algo real que comprobar.
 *
 * El dueño es `SEED.systemWorkerUserId`: no hay una persona autora de un
 * sticker del catálogo, y ese es exactamente el actor que la app ya usa para
 * lo que no tiene un usuario detrás (avisos automáticos, afiliaciones). La
 * allowlist que permite adjuntarlo sin ser su dueño vive en
 * `AttachableFileService`/`community-messaging.service.ts`, no acá: este
 * servicio sólo escribe las filas.
 */
@Injectable()
export class StickerPackSeedService {
  constructor(
    private readonly orm: MikroORM,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(StickerPackSeedService.name);
  }

  async run(): Promise<{ inserted: number }> {
    const em = this.orm.em.fork();
    const now = new Date();
    let inserted = 0;

    for (const sticker of STICKER_PACK) {
      const existing = await em.findOne(Files, { id: sticker.id });
      if (existing) continue;

      em.create(
        Files,
        {
          id: sticker.id,
          tenantId: SEED.tenantId,
          categoryConceptId: CONCEPTS.FILE_CATEGORY_IMAGE,
          originalName: `${sticker.clave}.svg`,
          sensitivityConceptId: CONCEPTS.SENSITIVITY_NORMAL,
          lifecycleStatusConceptId: CONCEPTS.FILE_ACTIVE,
          currentVersionId: undefined,
          createdByUserId: SEED.systemWorkerUserId,
          updatedByUserId: SEED.systemWorkerUserId,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      // `FileVersions.fileId` es una columna cruda (sin `@ManyToOne`, igual
      // que declara la entidad): MikroORM no conoce la FK y no puede ordenar
      // el insert solo. Sin este flush intermedio, `file_versions` se
      // insertaba ANTES que `files` en el mismo batch y violaba
      // `fk_file_versions_file_id` — se reprodujo contra Postgres real
      // (legion-h5-pg) antes de este fix.
      await em.flush();

      const versionId = deterministicId(
        `seed:sticker-pack:version:${sticker.clave}:v1`,
      );
      em.create(
        FileVersions,
        {
          id: versionId,
          fileId: sticker.id,
          versionNumber: 1,
          storageProviderConceptId: CONCEPTS.STORAGE_PROVIDER_S3,
          storageRegionConceptId: CONCEPTS.STORAGE_REGION_DEFAULT,
          objectKey: `product-assets/stickers/${sticker.clave}.svg`,
          // No es un archivo del usuario: el front lo sirve desde su propio
          // `public/stickers/*.svg` y nunca pide estos bytes a la API. Esta
          // URI documenta de dónde sale el contenido real, no un objeto que
          // el backend vaya a devolver.
          storageUri: `product-assets://stickers/${sticker.clave}.svg`,
          mimeType: 'image/svg+xml',
          sizeBytes: '0',
          checksumAlgorithmConceptId: CONCEPTS.CHECKSUM_SHA256,
          contentHash: 'product-asset-no-bytes',
          encryptionStatusConceptId: CONCEPTS.ENCRYPTION_NONE,
          malwareScanStatusConceptId: CONCEPTS.SCAN_CLEAN,
          recordedAt: now,
          recordedByUserId: SEED.systemWorkerUserId,
        },
        { partial: true },
      );

      await em.flush();
      const file = await em.findOneOrFail(Files, { id: sticker.id });
      file.currentVersionId = versionId;
      await em.flush();
      inserted += 1;
    }

    if (inserted > 0) {
      this.logger.info(
        { inserted, total: STICKER_PACK.length },
        'Sticker pack boot seed materialized',
      );
    }
    return { inserted };
  }
}
