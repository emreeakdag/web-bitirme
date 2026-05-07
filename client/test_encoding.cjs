const XLSX = require('xlsx');

// UTF-8 encoded string
const csvContent = "soru,cevap\nTürkiye'nin başkenti neresidir?,Ankara\nŞemsiye nerede?,Şurada\n";
const buffer = Buffer.from(csvContent, 'utf8');
const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

try {
  // Read without codepage
  const wb1 = XLSX.read(arrayBuffer, { type: 'array' });
  const sheet1 = wb1.Sheets[wb1.SheetNames[0]];
  const json1 = XLSX.utils.sheet_to_json(sheet1);
  console.log("Without codepage:", json1[0]);

  // Read with codepage 65001 (UTF-8)
  const wb2 = XLSX.read(arrayBuffer, { type: 'array', codepage: 65001 });
  const sheet2 = wb2.Sheets[wb2.SheetNames[0]];
  const json2 = XLSX.utils.sheet_to_json(sheet2);
  console.log("With codepage 65001:", json2[0]);
} catch (e) {
  console.error(e);
}
