// CSV (RFC 4180) sin dependencias: campos entre comillas con comas, saltos de línea y comillas dobles.

/** @returns {string[][]} filas de celdas. */
export function parseCsv(texto) {
  const filas = [];
  let fila = [];
  let celda = '';
  let entreComillas = false;
  for (let i = 0; i < texto.length; i += 1) {
    const c = texto[i];
    if (entreComillas) {
      if (c === '"') {
        if (texto[i + 1] === '"') {
          celda += '"';
          i += 1;
        } else entreComillas = false;
      } else celda += c;
    } else if (c === '"') entreComillas = true;
    else if (c === ',') {
      fila.push(celda);
      celda = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i += 1;
      fila.push(celda);
      celda = '';
      if (fila.length > 1 || fila[0] !== '') filas.push(fila);
      fila = [];
    } else celda += c;
  }
  if (entreComillas) throw new Error('CSV mal formado: comillas sin cerrar');
  if (celda !== '' || fila.length) {
    fila.push(celda);
    filas.push(fila);
  }
  return filas;
}

/** CSV con encabezado → lista de objetos. Falla si una fila no tiene tantas celdas como el encabezado. */
export function parseCsvConEncabezado(texto, nombre = 'csv') {
  const [encabezado, ...filas] = parseCsv(texto);
  return filas.map((fila, i) => {
    if (fila.length !== encabezado.length)
      throw new Error(
        `${nombre}: la fila ${i + 2} tiene ${fila.length} celdas y el encabezado ${encabezado.length}`,
      );
    return Object.fromEntries(encabezado.map((h, k) => [h, fila[k]]));
  });
}
