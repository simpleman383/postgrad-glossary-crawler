const puppeteer = require('puppeteer');


const glossaryCrawler = async function({ headless = true } = {}) {
  const PoS = {
    NOUN: { key: 'noun', shortcuts: [ 'сущ' ], },
    VERB: { key: 'verb', shortcuts: [ 'гл' ], },
    ADJECTIVE: { key: 'adjective', shortcuts: [ 'прил' ], },
    ADVERB: { key: 'adverb', shortcuts: [ 'нареч' ], },
    GERUND: { key: 'gerund', shortcuts: [ 'прич' ], },
  };

  const browser = await puppeteer.launch({ headless: false });


  const fetchTranscription = async function(word) {
    const baseAPI = `https://dictionary.cambridge.org/dictionary/english`;
    const posSelector = '.pron';

    const page = await browser.newPage();
    await page.goto(`${baseAPI}/${word}`);

    try {
      await page.waitForSelector(posSelector);
    } catch (err) {
      console.error(`failed to fetchTranscription for ${word}`);
      return "";
    }


    const domElements = await page.$(posSelector);
    const text = await domElements.evaluate(element => element.innerText);

    await page.close();

    if (text) {
      return Promise.resolve(text);
    }
    else {
      return Promise.resolve('unknown');
    }
  }

  const fetchSynonyms = async function(word, options) {
    const baseAPI = `https://synonyms.reverso.net/synonym/en`;
    const posSelector = 'a.synonym.relevant';

    const page = await browser.newPage();
    await page.goto(`${baseAPI}/${word}`);

    try {
      await page.waitForSelector(posSelector);
    } catch (err) {
      console.error(`failed to fetchSynonyms for ${word}`);
      return "";
    }

    const domElements = await page.$$(posSelector);
    const synonyms = await Promise.all(domElements.map(element => {
      return element.evaluate(e => e.innerText);
    }));
    
    await page.close();

    const result = synonyms ? synonyms.slice(0, options.limit && options.limit > 0 ? options.limit : undefined) : [];
    return Promise.resolve(result);
  }

  const fetchPartOfSpeech = async function(word) {
    const baseAPI = `https://dictionary.cambridge.org/dictionary/english`;
    const posSelector = '.pos';

    const page = await browser.newPage();
    await page.goto(`${baseAPI}/${word}`);


    try {
      await page.waitForSelector(posSelector);
    } catch (err) {
      console.error(`failed to fetchPartOfSpeech for ${word}`);
      return "";
    }

    const domElement = await page.$(posSelector);

    const possibleVariants = await domElement.evaluate(e => e.innerText);
    

    await page.close();
    return possibleVariants || 'unknown';
  }

  const fetchMeanings = async function(word, options) {
    const baseAPI = `https://context.reverso.net/translation/english-russian`;
    const posSelector = '#translations-content > .translation';

    const page = await browser.newPage();
    await page.goto(`${baseAPI}/${word}`);

    
    try {
      await page.waitForSelector(posSelector);
    } catch (err) {
      console.error(`failed to fetchMeanings for ${word}`);
      return [];
    }

    const domElements = await page.$$(posSelector);
    const meanings = (await Promise.all(domElements.map(element => {
      return element.evaluate(e => e.innerText);
    }))).map(i => i.replace('\n', '').trim());
    
    await page.close();

    const result = meanings ? meanings.slice(0, options.limit && options.limit > 0 ? options.limit : undefined) : [];
    return Promise.resolve(result);
  }

  const fetchExamples = async function(word, options) {
    const baseAPI = `https://context.reverso.net/translation/english-russian`;
    const posSelector = '#examples-content .src .text';

    const page = await browser.newPage();
    await page.goto(`${baseAPI}/${word}`);


    try {
      await page.waitForSelector(posSelector);
    } catch (err) {
      console.error(`failed to fetchExamples for ${word}`);
      return [];
    }

    const domElements = await page.$$(posSelector);
    const examples = await Promise.all(domElements.map(element => {
      return element.evaluate(e => e.innerText);
    }));
    
    await page.close();

    const result = examples ? examples.slice(0, options.limit && options.limit > 0 ? options.limit : undefined) : [];
    return Promise.resolve(result);
  } 

  const fetchDefinitions = async function(word) {
    const baseAPI = `https://www.vocabulary.com/dictionary`;
    const selector = 'h3.definition';

    const page = await browser.newPage();
    await page.goto(`${baseAPI}/${word}`);

    try {
      await page.waitForSelector(selector);
    } catch (err) {
      console.error(`failed to fetchDefinitions for ${word}`);
      return [];
    }


    const definitionBlocks = await page.$$(selector);

    const definitions = await Promise.all(definitionBlocks.map((block) => {
      return block.evaluate(e => {
        const text = e.innerText;
        return text.replace('\n', ": ")
      });
    }));

    
    await page.close();

    return definitions ? Promise.resolve(definitions) : Promise.resolve([]);
  }

  return {
    takeScreenshot: async function(url, filename) {
      const page = await browser.newPage();
      await page.goto(url);
      await page.screenshot({ path: filename });
      await page.close();
    },

    fetch: function(word, type, options = {}) {
      switch(type) {
        case 'part-of-speech':
          return fetchPartOfSpeech(word, options);
        case 'transcription':
          return fetchTranscription(word, options);
        case 'synonyms':
          return fetchSynonyms(word, options);
        case 'meanings':
          return fetchMeanings(word, options);
        case 'examples':
          return fetchExamples(word, options);
        case 'definitions':
          return fetchDefinitions(word, options);
        default:
          return Promise.resolve(null);
      }
    },

    done: async function() {
      await browser.close();
    },
  }
}



module.exports = glossaryCrawler
