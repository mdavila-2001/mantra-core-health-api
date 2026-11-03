import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Audited, Roles } from '../../../common';
import { StorageWorkerPublicationService } from '../../../common/storage/storage-worker-publication.service';
import { StorageLifecycleCoordinator } from '../../../common/storage/storage-lifecycle-coordinator.service';
import {
  BeginStoragePublicationDto,
  StorageReservationDto,
} from '../dto/storage-lifecycle.dto';
import { loadStorageEnv } from '../../../common/storage/storage.env';

@ApiTags('internal/storage-lifecycle')
@ApiBearerAuth()
@Controller('internal/storage-lifecycle')
@Roles('SYSTEM')
export class InternalStorageLifecycleController {
  constructor(
    private readonly publication: StorageWorkerPublicationService,
    private readonly coordinator: StorageLifecycleCoordinator,
  ) {}
  @Audited({
    action: 'AUDIO_PUBLICATION_BEGUN',
    entity: 'audio_asset',
    entityId: 'param:assetId',
  })
  @Post('audio/:assetId/begin')
  @ApiOperation({
    summary: 'Reservar la publicación de un audio en almacenamiento',
  })
  begin(
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Body() dto: BeginStoragePublicationDto,
  ) {
    return this.publication.beginAudio(assetId, dto);
  }
  @Audited({
    action: 'AUDIO_PUBLICATION_DISPATCHED',
    entity: 'audio_asset',
    entityId: 'param:assetId',
  })
  @Post('audio/:assetId/dispatch')
  @ApiOperation({ summary: 'Despachar la subida reservada de un audio' })
  dispatch(
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Body() dto: StorageReservationDto,
  ) {
    return this.publication.dispatchAudio(assetId, dto.reservation);
  }
  @Audited({
    action: 'AUDIO_PUBLICATION_ABORTED',
    entity: 'audio_asset',
    entityId: 'param:assetId',
  })
  @Post('audio/:assetId/abort')
  @ApiOperation({ summary: 'Abortar la publicación reservada de un audio' })
  abort(
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Body() dto: StorageReservationDto,
  ) {
    return this.publication.abortAudio(assetId, dto.reservation);
  }
  @Audited({
    action: 'STORAGE_LIFECYCLE_RECOVERED',
    entity: 'file',
  })
  @Post('recover')
  @ApiOperation({
    summary: 'Recuperar publicaciones de almacenamiento pendientes',
  })
  recover() {
    return loadStorageEnv().lifecycleBinding
      ? this.coordinator.recover()
      : { inspected: 0, quarantined: 0 };
  }
}
