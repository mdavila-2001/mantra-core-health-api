import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../common';
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
  @Post('audio/:assetId/dispatch')
  @ApiOperation({ summary: 'Despachar la subida reservada de un audio' })
  dispatch(
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Body() dto: StorageReservationDto,
  ) {
    return this.publication.dispatchAudio(assetId, dto.reservation);
  }
  @Post('audio/:assetId/abort')
  @ApiOperation({ summary: 'Abortar la publicación reservada de un audio' })
  abort(
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Body() dto: StorageReservationDto,
  ) {
    return this.publication.abortAudio(assetId, dto.reservation);
  }
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
