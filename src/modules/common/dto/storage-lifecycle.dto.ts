import {
  IsInt,
  IsObject,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import type { PublicationReservation } from '../../../common/storage/storage-lifecycle-coordinator.service';
export class BeginStoragePublicationDto {
  @IsUUID() operationId!: string;
  @IsUUID() ownerToken!: string;
  @IsString() @MaxLength(1024) storageUri!: string;
  @Matches(/^[0-9a-f]{64}$/) contentHash!: string;
  @IsInt() @Min(1) sizeBytes!: number;
}
export class StorageReservationDto {
  /** Coordinator validates every persisted field and token again, under exclusion. */
  @IsObject() reservation!: PublicationReservation;
}
