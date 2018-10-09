const cheerio = require("cheerio");
const emailregexp = require("./email-regexp");
const unique = require("array-unique");
const _ = require('lodash');


const LINKS_LIMIT = 120;

module.exports = function(htmlStr, domain) {
  var self = this;
  replaceAbsoluteLinkReferences(); // remove absolute references right away
    /**
     * Finds all the links in an html string
     * @param  {string} htmlStr html data
     * @return {array}  list of links that were found
     */
    this.extractLinks = function() {
      // Use cheerio

      var $ = cheerio.load(htmlStr);
      var navLinks = prepareExtractedLinks($, "nav a");
      var normalLinks = prepareExtractedLinks($, "a");
      var spanLinks = prepareExtractedLinksWithAttribute($, "span", "url");
      var totalList = _.concat(navLinks, normalLinks, spanLinks);
     
      return unique(totalList);
    };

    /**
     * helper function, takes selctor and compiles links with that selector. easy reuse for trying to get links within navs,
     * then if that is empty just resrot to first 10 other links
     * @param  {[type]} jqSelector [description]
     * @return {[type]}            [description]
     */
    function prepareExtractedLinks ($, jqSelector) {
      var linkQueue = [];
      var domainNoSlash = (domain[domain.length-1] === "/") ? domain.substring(0, domain.length-1) : domain;
      $(jqSelector).each(function (i, link) {
        if (i > LINKS_LIMIT)  return false; // break after 10
        var linkUrl = $(link).attr('href');
        // make sure relative link
        if (linkUrl == null) return
        if (linkUrl[0] === '/') {
          linkQueue.push(domainNoSlash +  linkUrl);
        }
        if (linkUrl.indexOf("http:") === -1 && linkUrl.indexOf("https:") === -1 && linkUrl[0] != "/") linkUrl = domainNoSlash + "/"+linkUrl;

        if (self.getRootDomain(domain) === self.getRootDomain(linkUrl)) linkQueue.push(linkUrl);

      });
      return unique(linkQueue);
    }

    function prepareExtractedLinksWithAttribute($, jqSelector, jqAttribute) {
      var linkQueue = [];
      var domainNoSlash = (domain[domain.length-1] === "/") ? domain.substring(0, domain.length-1) : domain;
      $(`${jqSelector}[${jqAttribute}]`).each(function (i, link) {
        if (i > LINKS_LIMIT)  return false; // break after 10
        var linkUrl = $(link).attr(jqAttribute);
        // make sure relative link
        if (linkUrl == null) return
        if (linkUrl[0] === '/') {
          linkQueue.push(domainNoSlash +  linkUrl);
        }
        if (linkUrl.indexOf("http:") === -1 && linkUrl.indexOf("https:") === -1 && linkUrl[0] != "/") linkUrl = domainNoSlash + "/"+linkUrl;

        if (self.getRootDomain(domain) === self.getRootDomain(linkUrl)) linkQueue.push(linkUrl);

      });
      return unique(linkQueue);
    }

    function replaceAbsoluteLinkReferences () {
      htmlStr =  htmlStr.replace(new RegExp(domain, 'g'), "");
    }
    /**
     * Gets list of emails from the html
     * @return {[type]} [description]
     */
    this.extractEmails = function () {
      var emails = htmlStr.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi) || [];
      // var emails = htmlStr.match(emailregexp) || [];
      return unique(emails);
    }

    this.extractTitle = function () {
      return 'test';
    }


    /**
     * @see https://stackoverflow.com/questions/8498592/extract-hostname-name-from-string
     * @param  {string} url domain url
     * @return {}     [description]
     */
    this.getRootDomain = function (linkUrl) {

      var hostDomain = extractHostname(linkUrl),
        splitArr = hostDomain.split('.'),
        arrLen = splitArr.length;

        //extracting the root domain here
        //if there is a subdomain
        if (arrLen > 2) {
            hostDomain = splitArr[arrLen - 2] + '.' + splitArr[arrLen - 1];
            //check to see if it's using a Country Code Top Level Domain (ccTLD) (i.e. ".me.uk")
            if (splitArr[arrLen - 1].length == 2 && splitArr[arrLen - 1].length == 2) {
                //this is using a ccTLD
                hostDomain = splitArr[arrLen - 3] + '.' + hostDomain;
            }
        }
        return hostDomain;
    }
    /**
     * @see https://stackoverflow.com/questions/8498592/extract-hostname-name-from-string
     * @param  {string} linkUrl domain url
     * @return {string}    root of domain
     */
    function extractHostname(linkUrl) {
        var hostname;
        //find & remove protocol (http, ftp, etc.) and get hostname

        if (linkUrl.indexOf("://") > -1) {
            hostname = linkUrl.split('/')[2];
        }
        else {
            hostname = linkUrl.split('/')[0];
        }

        //find & remove port number
        hostname = hostname.split(':')[0];
        //find & remove "?"
        hostname = hostname.split('?')[0];

        return hostname;
    }
}
