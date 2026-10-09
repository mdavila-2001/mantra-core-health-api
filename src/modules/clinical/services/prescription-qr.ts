import QRCode from 'qrcode';

/**
 * Dibuja un código QR con `pdfkit`, módulo por módulo, con `doc.rect`.
 *
 * ## Por qué sin PNG
 *
 * `qrcode` sabe rasterizar a `data:` URL o `Buffer` de PNG (`toDataURL`,
 * `toBuffer`) usando `canvas`/`pngjs` de por medio; acá alcanza con la
 * matriz binaria (`QRCode.create`) y un rectángulo por bit oscuro, sin
 * decodificar ningún formato de imagen — más barato y sin dependencias de
 * rasterizado en el proceso del servidor.
 *
 * @param doc - El documento en construcción.
 * @param text - Lo que el QR codifica (la URL de verificación).
 * @param x - Borde izquierdo del QR, en puntos.
 * @param y - Borde superior del QR, en puntos.
 * @param side - Lado del QR completo (con su margen), en puntos.
 */
export function drawQr(
  doc: PDFKit.PDFDocument,
  text: string,
  x: number,
  y: number,
  side: number,
): void {
  // Corrección de errores 'M' (15 %): suficiente para un documento impreso
  // sin exigir una matriz enorme para un texto tan corto como la URL.
  const code = QRCode.create(text, { errorCorrectionLevel: 'M' });
  const { modules } = code;
  const size = modules.size;
  // Margen en "módulos" (celdas), no en puntos: el estándar QR pide un
  // margen en blanco de al menos 4 módulos alrededor de la matriz para que
  // los lectores lo reconozcan.
  const moduleMargin = 4;
  const totalModulos = size + moduleMargin * 2;
  const pointsPerModule = side / totalModulos;

  doc.save();
  doc.fillColor('#000000');
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      if (modules.get(row, column) === 0) continue;
      const px = x + (column + moduleMargin) * pointsPerModule;
      const py = y + (row + moduleMargin) * pointsPerModule;
      doc.rect(px, py, pointsPerModule, pointsPerModule).fill();
    }
  }
  doc.restore();
}
