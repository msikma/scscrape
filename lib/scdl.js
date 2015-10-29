// Soundcloud Scraper
// Copyright (C) 2015, Michiel Sikma <michiel@sikma.org>

var cheerio = require('cheerio');
var fs = require('fs');
var Entities = require('html-entities').XmlEntities;
var entities = new Entities();
var util = require('util');
var scUtil = require('./scutil');

var csrf = '';

/**
 * Adds download links for all tracks in `data`.
 * @param {Object} data Playlist information
 */
function addDls(data) {
  return getMiddlewareToken().then(function(csrfToken) {
    var dlPromises = [];
    for (var n = 0; n < data.tracks.length; ++n) {
      dlPromises.push(scUtil.fetchDl(data.tracks[n].url, csrfToken, n));
    }
    return Promise.all(dlPromises);
  }).catch(function(error) {
    console.log(error);
    process.exit(1);
  }).then(function(dlURLs) {
    for (var n = 0; n < dlURLs.length; ++n) {
      data.tracks[n].downloadURL = dlURLs[n];
    }
    return data;
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
      scUtil.setCSRF(csrf);
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
  return scUtil.getURL('http://9soundclouddownloader.com/');
}

module.exports = {
  'getMiddlewareToken': getMiddlewareToken,
  'addDls': addDls
};
