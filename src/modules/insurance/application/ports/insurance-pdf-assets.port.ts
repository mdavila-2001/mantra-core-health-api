export interface InsurancePdfAssetsPort {
  drawBrand(
    doc: PDFKit.PDFDocument,
    options: {
      x: number;
      y: number;
      ancho: number;
      color: readonly [number, number, number];
    },
  ): void;
  brandHeight(width: number): number;
  drawQr(
    doc: PDFKit.PDFDocument,
    value: string,
    x: number,
    y: number,
    size: number,
  ): void;
}

export const INSURANCE_PDF_ASSETS_PORT = Symbol('INSURANCE_PDF_ASSETS_PORT');
