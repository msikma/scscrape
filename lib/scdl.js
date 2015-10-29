// Soundcloud Scraper
// Copyright (C) 2015, Michiel Sikma <michiel@sikma.org>

var cheerio = require('cheerio');
var fs = require('fs');
var Entities = require('html-entities').XmlEntities;
var entities = new Entities();
var util = require('util');
var exec = require('child_process').exec;
var getURL = require('./scraper').getURL;

var baseURL = 'http://9soundclouddownloader.com/download-sound-track';
var originURL = 'http://9soundclouddownloader.com';
var refURL = 'http://9soundclouddownloader.com/';
var acceptLang = 'en-US,en;q=0.8,ja;q=0.6,nl;q=0.4,de;q=0.2,es;q=0.2,it;q=0.2,pt;q=0.2';
var ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.80 Safari/537.36';
var csrf = '';
var ga = 'GA1.2.562238575.1444486205';

/**
 * Adds download links for all tracks in `data`.
 * @param {Object} data Playlist information
 */
function addDls(data) {
  return getMiddlewareToken().then(function(csrfToken) {
    var dlPromises = [];
    for (var n = 0; n < data.tracks.length; ++n) {
      dlPromises.push(fetchDl(data.tracks[n].url, csrfToken));
    }
    return Promise.all(dlPromises);
  }).then(function(dlURLs) {
    for (var n = 0; n < dlURLs.length; ++n) {
      data.tracks[n].downloadURL = dlURLs[n];
    }
    return data;
  });
}

/**
 * Returns an MP3 download link from a Soundcloud track URL.
 *
 * @param {String} url Soundcloud track URL
 * @param {String} csrfToken CSRF token
 */
function fetchDl(url, csrfToken) {
  return new Promise(function(resolve, reject) {
    var encURL = entities.encode(url);
    var command = (
      'curl \'' + baseURL + '\' '
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
      resolve(entities.decode($a.attr('href')).trim());
    });
  });
}

/**
 * Retrieves and returns the 9soundclouddownloader.com CSRF middleware token.
 *
 * @returns {String} CSRF middleware token
 */
function getMiddlewareToken() {
  return new Promise(function(resolve, reject) {
    if (csrf !== '') {
      resolve(csrf);
    }
    getScdlHTML().then(function(html) {
      var $ = cheerio.load(html);
      var mwt = $('input[name="csrfmiddlewaretoken"]');
      csrf = entities.decode(mwt.attr('value'));
      resolve(csrf);
    });
  });
}

/**
 * Fetches the 9soundclouddownloader.com homepage.
 *
 * @returns {Promise} 9soundclouddownloader.com homepage HTML
 */
function getScdlHTML() {
  return getURL('http://9soundclouddownloader.com/');
}

module.exports = {
  'getMiddlewareToken': getMiddlewareToken,
  'addDls': addDls
};
