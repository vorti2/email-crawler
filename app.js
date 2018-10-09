var Scraper = require("./scraper");
var emailscraper = new Scraper("https://caroobi.com");
// A level is how far removed (in  terms of link clicks) a page is from the root page (only follows same domain routes)
emailscraper.getLevels(2).then((emails) => {
  console.log(emails); // Here are the emails crawled from traveling two levels down this domain
})
.catch((e) => {
  console.log("error");
})