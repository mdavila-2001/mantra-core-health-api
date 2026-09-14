import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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
  begin(
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Body() dto: BeginStoragePublicationDto,
  ) {
    return this.publication.beginAudio(assetId, dto);
  }
  @Post('audio/:assetId/dispatch')
  dispatch(
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Body() dto: StorageReservationDto,
  ) {
    return this.publication.dispatchAudio(assetId, dto.reservation);
  }
  @Post('audio/:assetId/abort')
  abort(
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Body() dto: StorageReservationDto,
  ) {
    return this.publication.abortAudio(assetId, dto.reservation);
  }
  @Post('recover')
  recover() {
    return loadStorageEnv().lifecycleBinding
      ? this.coordinator.recover()
      : { inspected: 0, quarantined: 0 };
  }
}
