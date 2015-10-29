// Soundcloud Scraper
// Copyright (C) 2015, Michiel Sikma <michiel@sikma.org>

var cheerio = require('cheerio');
var fs = require('fs');
var url = require('url');
var request = require('request');
var Entities = require('html-entities').XmlEntities;
var entities = new Entities();

/**
 * Scrapes a Soundcloud URL by downloading the page and then retrieving
 * all the necessary information.
 *
 * @param {String} url URL of the Soundcloud page
 * @returns {Object} Object containing all relevant info
 */
function scrapeScURL(url) {
  return new Promise(function(resolve, reject) {
    getURL(url).then(function(html) {
      var plHTML = getPlaylistHTML(html);
      if (plHTML.html() === '') {
        console.log((
          'scscrape.js: Error: could not extract information from '
          + 'the Soundcloud URL.'
        ));
        process.exit(1);
      }
      resolve(extractInfo(plHTML, url));
    });
  });
}

/**
 * Retrieves the HTML content of a URL.
 *
 * @param {String} url URL of the Soundcloud page
 * @returns {String} Content of the page
 */
function getURL(url) {
  return new Promise(function(resolve, reject) {
    request(url, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        resolve(body);
      } else {
        reject(error);
      }
    });
  });
}

/**
 * Extracts the playlist information from a Soundcloud page.
 *
 * @param {String} htmlDocument HTML content of the page
 */
function getPlaylistHTML(htmlDocument) {
  var $ = cheerio.load(htmlDocument);
  // Soundcloud keeps its actual HTML data in a <noscript> tag and loads
  // it dynamically using JS. We need to find the correct <noscript> tag
  // and parse its contents.
  var $list = $('noscript');
  var playlistHTML = '';
  $list.each(function(i, el) {
    var html = $(el).html();
    if (html.indexOf('MusicPlaylist') > -1) {
      playlistHTML = html;
    }
  });
  return cheerio.load(playlistHTML);
}

/**
 * Extracts the actual data from the playlist HTML. The HTML must be a
 * Cheerio-parsed object.
 *
 * @param {*} $ Cheerio object of the playlist HTML from getPlaylistHTML()
 * @param {String} baseURL Base URL from which to determine new URLs
 */
function extractInfo($, baseURL) {
  var data = {
    'title': '',
    'description': '',
    'author': '',
    'url': '',
    'cover': '',
    'tracks': []
  };

  // Extract all tracks.
  var $tracks = $('article[itemprop="track"]');
  $tracks.each(function(n, el) {
    var $track = $(el);
    var $url = $('h2[itemprop="name"] a[itemprop="url"]', $track);
    var href = url.resolve(baseURL, $url.attr('href'));
    var time = new Date(Date.parse(entities.decode($('time', $track).text())));
    var $artist = $('h2[itemprop="name"] a:not([itemprop])', $track);
    var trackData = {
      'title': entities.decode($url.text()),
      'artist': entities.decode($artist.text()),
      'url': href,
      'time': time,
      'year': time.getFullYear()
    };
    data.tracks.push(trackData);
  });

  // Extract the title and playlist author.
  var title = $('h1[itemprop="name"] a[itemprop="url"]').text();
  var author = $('h1[itemprop="name"] a:not([itemprop])').text();
  data.title = entities.decode(title);
  data.author = entities.decode(author);
  data.url = baseURL;

  var description = $('meta[itemprop="description"]').attr('content');
  data.description = entities.decode(description);

  // Extract the cover image.
  data.cover = entities.decode($('img[itemprop="image"]').attr('src'));
  return data;
}

module.exports = {
  'scrapeScURL': scrapeScURL,
  'getURL': getURL
};
