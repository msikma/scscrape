// Soundcloud Scraper
// Copyright (C) 2015, Michiel Sikma <michiel@sikma.org>

var cheerio = require('cheerio');
var request = require('request');
var exec = require('child_process').exec;
var Entities = require('html-entities').XmlEntities;
var entities = new Entities();

var baseURL = 'http://9soundclouddownloader.com/download-sound-track';
var originURL = 'http://9soundclouddownloader.com';
var refURL = 'http://9soundclouddownloader.com/';
var acceptLang = 'en-US,en;q=0.8,ja;q=0.6,nl;q=0.4,de;q=0.2,es;q=0.2,it;q=0.2,pt;q=0.2';
var ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.80 Safari/537.36';
var csrf = '';
var ga = 'GA1.2.562238575.1444486205';
var useSleep = false;

/**
 * Retrieves the HTML content of a URL, while pretending to be a real browser.
 * Bit of a hack at the moment. TODO: clean up.
 *
 * @param {String} url URL of the page
 * @returns {Promise} Content of the page
 */
function getURLSpoof(url) {
  return new Promise(function(resolve, reject) {
    var command = (
      'curl \'' + url + '\' '
      + '-H \'Origin: ' + url + '\' '
      + '-H \'Accept-Encoding: gzip, deflate' + '\' '
      + '-H \'Accept-Language: ' + acceptLang + '\' '
      + '-H \'Upgrade-Insecure-Requests: 1' + '\' '
      + '-H \'User-Agent: ' + ua + '\' '
      + '-H \'Content-Type: application/x-www-form-urlencoded' + '\' '
      + '-H \'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8' + '\' '
      + '-H \'Cache-Control: max-age=0' + '\' '
      + '-H \'Referer: ' + url + '\' '
      + '-H \'Connection: keep-alive' + '\' '
      + '--compressed'
    );
    child = exec(command, function(error, stdout, stderr) {
      if (error) {
        reject(error);
      }
      resolve(stdout);
    });
  });
}

/**
 * Returns an MP3 download link from a Soundcloud track URL.
 *
 * @param {String} url Soundcloud track URL
 * @param {String} csrfToken CSRF token
 * @param {Number} n Track number (used when rate limiting)
 */
function fetchDl(url, csrfToken, n) {
  return new Promise(function(resolve, reject) {
    var encURL = entities.encode(url);
    var sleep = useSleep ? 'sleep ' + n + '; ' : '';
    var command = (
      sleep + 'curl \'' + baseURL + '\' '
      + '-H \'Cookie: _ga=' + ga + '; csrftoken=' + csrfToken + '\' '
      + '-H \'Origin: ' + originURL + '\' '
      + '-H \'Accept-Encoding: gzip, deflate' + '\' '
      + '-H \'Accept-Language: ' + acceptLang + '\' '
      + '-H \'Upgrade-Insecure-Requests: 1' + '\' '
      + '-H \'User-Agent: ' + ua + '\' '
      + '-H \'Content-Type: application/x-www-form-urlencoded' + '\' '
      + '-H \'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8' + '\' '
      + '-H \'Cache-Control: max-age=0' + '\' '
      + '-H \'Referer: ' + refURL + '\' '
      + '-H \'Connection: keep-alive' + '\' '
      + '--data \'csrfmiddlewaretoken=' + csrfToken + '&sound-url=' + encURL + '\' '
      + '--compressed'
    );
    child = exec(command, function(error, stdout, stderr) {
      if (error !== null) {
        reject();
      }
      var $ = cheerio.load(stdout);
      var $a = $('a[href*=".mp3"]');
      try {
        resolve(entities.decode($a.attr('href')).trim());
      } catch (e) {
        // Sometimes 9soundclouddownloader.com errors out. In that case
        // we'll just skip this one.
        resolve();
      }
    });
  });
}

/**
 * Retrieves the HTML content of a URL.
 *
 * @param {String} url URL of the page
 * @returns {Promise} Content of the page
 */
function getURL(url) {
  return new Promise(function(resolve, reject) {
    request(url, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        resolve(body);
      } else {
        reject(url);
      }
    });
  });
}

/**
 * Set the CSRF token to make 9soundclouddownloader.com requests with.
 *
 * @param {String} csrfToken CSRF token string
 */
function setCSRF(csrfToken) {
  csrf = csrfToken;
}

module.exports = {
  'getURL': getURL,
  'setCSRF': setCSRF,
  'fetchDl': fetchDl,
  'getURLSpoof': getURLSpoof
};
