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
 * @param texto - Lo que el QR codifica (la URL de verificación).
 * @param x - Borde izquierdo del QR, en puntos.
 * @param y - Borde superior del QR, en puntos.
 * @param lado - Lado del QR completo (con su margen), en puntos.
 */
export function dibujarQr(
  doc: PDFKit.PDFDocument,
  texto: string,
  x: number,
  y: number,
  lado: number,
): void {
  // Corrección de errores 'M' (15 %): suficiente para un documento impreso
  // sin exigir una matriz enorme para un texto tan corto como la URL.
  const codigo = QRCode.create(texto, { errorCorrectionLevel: 'M' });
  const { modules } = codigo;
  const tamano = modules.size;
  // Margen en "módulos" (celdas), no en puntos: el estándar QR pide un
  // margen en blanco de al menos 4 módulos alrededor de la matriz para que
  // los lectores lo reconozcan.
  const margenModulos = 4;
  const totalModulos = tamano + margenModulos * 2;
  const puntosPorModulo = lado / totalModulos;

  doc.save();
  doc.fillColor('#000000');
  for (let fila = 0; fila < tamano; fila += 1) {
    for (let columna = 0; columna < tamano; columna += 1) {
      if (modules.get(fila, columna) === 0) continue;
      const px = x + (columna + margenModulos) * puntosPorModulo;
      const py = y + (fila + margenModulos) * puntosPorModulo;
      doc.rect(px, py, puntosPorModulo, puntosPorModulo).fill();
    }
  }
  doc.restore();
}
