/**
 * @author Jack Considine <jackconsidine3@gmail.com>
 * @package
 * 2017-11-20
 */

var rp = require("request-promise");
const cheerio = require('cheerio');

const EventEmitter = require('events');
const endExecution = new EventEmitter();
// endExecution.on('event', () => {
//   console.log('an event occurred!');
// });
// endExecution.emit('event');



var filterer = require("./email-filterer.js")
var HtmlParser = require("./html-parser-utils.js");
var QueueManager = require("node-asyncqueue");
var unique = require("array-unique");
// Asynchronously resolve a list of asynchronous tasks using promises
// var asyncQueue = require("async-queue");

function WebsiteEmailScraper(domain) {
  /* private */
  var DEFAULT_TIMEOUT = 6000;
  /**
   * List of websites that are to be crawled
   * @type {Array}
   */
  var websiteQueue = [
    domain
  ];

  /**
   * Prevents repeats from being crawled
   * @type {Array}
   */
  var pastCrawled = [];


  var emails = [];

  /**
   * How many times this crawler has recursed on links it has found
   * @type {Number}
   */
  var currentLevel = 0;

  this.getLevels = function (numLevels, maxTimeout) {
    if (numLevels === 0) return [];
    if (!maxTimeout) maxTimeout = DEFAULT_TIMEOUT;
    var levels = [];
    return new Promise(function (resolve, reject) {




      var curLevel = 0;
      setTimeout(function () {
        curLevel = numLevels;
        endExecution.emit("finished-level");
      }, maxTimeout)

      endExecution.on("finished-level", function () {
        if (curLevel >= numLevels) return resolve(filterer.filterEmails(unique(emails)));
        getLevel().then(() => {
            endExecution.emit("finished-level");
          })
          .catch((e) => {
            reject(e);
          });
        curLevel += 1;
      });

      endExecution.emit("finished-level");
    });

    // for (var i=0; i<numLevels; i++) {
    //   p = p.then(() => {
    //
    //   }).then(getLevel);
    // }
  }


  /* public */
  function getLevel() {
    var newLinks = [];
    var promiseQueue = [new Promise(function (resolve, reject) {
      resolve();
    })];

    for (var i = 0; i < websiteQueue.length; i++) {
      console.log(`page link: ${i}. "${websiteQueue[i]}"`);

      promiseQueue.push(
        rp({
          url: websiteQueue[i],
          headers: {
            'User-Agent': 'request'
          }
        }).then((htmlString) => {
          parser = new HtmlParser(htmlString, domain);
          const foundedLinks = parser.extractLinks();
          newLinks = newLinks.concat(foundedLinks);
          /*
          const values = ['contacts', 'contact', 'kontakt', 'kontakte'];
          for (var y = 0; y < foundedLinks.length; y++) {
            console.log(`search in "${foundedLinks[y]}"`);
            var linkFounded = foundedLinks[y];
            linkFounded = (linkFounded[linkFounded.length-1] === "/") ? linkFounded.substring(0, linkFounded.length-1) : linkFounded;
            if (linkFounded === domain || _.some(values, (el) => _.includes(linkFounded, el))) {
              newLinks.push(foundedLinks[y]);
              // newLinks = newLinks.concat(foundedLinks);
            }
          }
          */
          console.log(`num links now: ${newLinks.length}`);
          const emailsFounded = parser.extractEmails();
          if (emailsFounded.length > 0) {
            console.log(`emails found = ${JSON.stringify(emailsFounded)}`)
            emails = emails.concat(emailsFounded);
          }
          

        })
        .catch((e) => {
          throw new Error("Error with rp: " + e);
        })
      );
    }

    // Async Queue, get all
    return QueueManager.asyncFunctionQueue(promiseQueue, true).then(() => {
      currentLevel++;
      websiteQueue = [];
      for (var i = 0; i < newLinks.length; i++) {
        // add next level of links
        // console.log(`page link: "${newLinks[i]}"`);
        if (pastCrawled.indexOf(newLinks[i]) === -1) websiteQueue.push(newLinks[i]);
      }
    });

    // crawl, add all pages to website queue
  }


}

module.exports = WebsiteEmailScraper;