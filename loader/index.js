const fs = require('fs');
const excel = require('excel4node');

const loader = {
  fromFile: function(filepath) {
    return new Promise((res, rej) => {
      fs.readFile(filepath, 'utf8', (err, data) => {
        if (err) {
          console.error(err);
          rej(err);
        }
  
        res(data.replace(/[^A-Za-z\-\n]/gi, '').split('\n'));
      })
    });
  },

  toExcel: function(wordlist, filename) {
    const workbook = new excel.Workbook();
    const sheet = workbook.addWorksheet('Glossary sheet');


    wordlist.forEach((record, rowIdx) => {
      if (!record) {
        return;
      }

      Object.keys(record).forEach((propName, colIdx) => {
        const data = record[propName];
        
        let value = data;
        if (Array.isArray(data)) {
          value = data.join('; \n')
        }

        sheet.cell(1 + rowIdx, 1 + colIdx).string(value);
      });


    });

    workbook.write(filename || 'output.xlsx');
  }
}

module.exports = loader;