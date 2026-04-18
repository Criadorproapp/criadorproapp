const fs = require('fs');
const PDFParser = require('pdf2json');

const pdfParser = new PDFParser(this, 1); // 1 = extrai texto não formatado (root)

pdfParser.on('pdfParser_dataError', errData => console.error(errData.parserError));
pdfParser.on('pdfParser_dataReady', pdfData => {
    let text = pdfParser.getRawTextContent();
    console.log("=== INÍCIO DO PDF ===");
    console.log(text.substring(0, 3000)); // limitando pra n poluir mto
    console.log("\n=== FIM DO PREVIEW ===");
});

pdfParser.loadPDF('e:\\programa criador pro\\IA FERRAMENTAS\\Guia-Instalacao-AIOS-Xquads.pdf');
