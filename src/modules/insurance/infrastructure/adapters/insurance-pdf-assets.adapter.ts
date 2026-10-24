import { Injectable } from '@nestjs/common';
import {
  drawBrandAlovida,
  brandHeight,
} from '../../../clinical/services/alovida-mark';
import { drawQr } from '../../../clinical/services/prescription-qr';
import type { InsurancePdfAssetsPort } from '../../application/ports/insurance-pdf-assets.port';

@Injectable()
export class InsurancePdfAssetsAdapter implements InsurancePdfAssetsPort {
  drawBrand(
    doc: PDFKit.PDFDocument,
    options: {
      x: number;
      y: number;
      ancho: number;
      color: readonly [number, number, number];
    },
  ): void {
    drawBrandAlovida(doc, options);
  }

  brandHeight(width: number): number {
    return brandHeight(width);
  }

  drawQr(
    doc: PDFKit.PDFDocument,
    value: string,
    x: number,
    y: number,
    size: number,
  ): void {
    drawQr(doc, value, x, y, size);
  }
}
