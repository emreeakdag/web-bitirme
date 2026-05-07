const XLSX = require('xlsx');
const fs = require('fs');

const csvContent = "soru,a,b,c,d,cevap\n1+1?,1,2,3,4,b\n";
const buffer = Buffer.from(csvContent, 'utf8');

try {
  // arraybuffer equivalent
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  
  // What happens without type?
  try {
    const wb1 = XLSX.read(arrayBuffer);
    console.log("Without type: Success");
  } catch(e) {
    console.log("Without type Error: " + e.message);
  }

  try {
    const wb2 = XLSX.read(arrayBuffer, { type: 'array' });
    console.log("With type array: Success");
  } catch(e) {
    console.log("With type Error: " + e.message);
  }
} catch(e) {
  console.log(e);
}
