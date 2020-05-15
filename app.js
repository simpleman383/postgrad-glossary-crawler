const puppeteer = require('puppeteer');
const cli = require('command-line-args');

const loader = require('./loader');
const useGlossaryCrawler = require('./crawler');


const optionDefinitions = [
  { name: 'dict', alias: 'd', type: String, defaultOption: true },
  { name: 'output', alias: 'o', type: String },
  { name: 'max-synomyns', alias: 's', type: Number },
  { name: 'max-examples', alias: 'e', type: Number },
  { name: 'max-meanings', alias: 'm', type: Number },
];



const main = async () => {
  const options = cli(optionDefinitions);
  const sourceWordList = await loader.fromFile(options.dict);

  const crawler = await useGlossaryCrawler();


  const methods = [
    { key: 'part-of-speech' },
    { key: 'transcription' },
    { key: 'definitions' },
    { key: 'meanings', options: { limit: options['max-meanings'] || -1 } },
    { key: 'synonyms', options: { limit: options['max-synonyms'] || -1 } },
    { key: 'examples', options: { limit: options['max-examples'] || -1 } },
  ];

  const glossary = await Promise.all(sourceWordList.map(async word => {

    try {
      const fetchedData = await Promise.all(methods.map(method => {
        return new Promise((resolve) => {
          const { key: methodName, options } = method;
          crawler.fetch(word, methodName, options)
            .then(data => {
              resolve({ key: methodName, data });
            });
        });
      }));

      const glossaryRecord = fetchedData.reduce((acc, cur) => {
        const { key, data } = cur;
        return {
          ...acc,
          [key]: data
        }
      }, { word });

      return glossaryRecord;
  } catch (err) {
    console.error(`Error while processing word: ${word}`);
    return null;
  }


  }));

  await crawler.done();


  loader.toExcel(glossary, options.output);

}

main();