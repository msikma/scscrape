// Soundcloud Scraper
// Copyright (C) 2015, Michiel Sikma <michiel@sikma.org>

var scraper = require('./scraper');
var scdl = require('./scdl');
var path = require('path');
var fs = require('fs');
var exec = require('child_process').exec;
var sanitize = require('sanitize-filename');
var request = require('request');

var targetDir = path.resolve('./downloads/');
var descriptionName = 'info.txt';
var coverName = 'cover$EXT';

/**
 * Sets the download target directory.
 *
 * @param {String} dir Directory to download to
 */
function setTargetDir(dir) {
  targetDir = path.resolve(dir);
}

/**
 * Verifies that our environment is able to create new files locally, and
 * use cURL.
 */
function verifyEnv() {
  return new Promise(function(resolve, reject) {
    // Write and unlink a small file to test if the directory is writable.
    var dest = path.join(targetDir, '.test');
    try {
      fs.writeFileSync(dest, 'test');
      fs.unlinkSync(dest);
    } catch (e) {
      console.log('scscrape.js: Error: can\'t write in target directory (' + targetDir + ').');
      process.exit(2);
    }

    child = exec('curl -V', function(error, stdout, stderr) {
      if (error !== null) {
        console.log('scscrape.js: Error: can\'t run \'curl\'. Is it installed?');
        process.exit(3);
      }
      resolve();
    });
  });
}

/**
 * Downloads a full playlist.
 *
 * @param {String} url Soundcloud playlist URL
 */
function downloadPlaylist(url) {
  // Retrieve playlist info, then begin retrieving their actual download links.
  scraper.scrapeScURL(url).then(function(data) {
    // Add download links to our data.
    return scdl.addDls(data);
  }).catch(function(error) {
    console.log(error);
  }).then(function(data) {
    // Create the directory. If the directory already exists, add (n)
    // to the directory name, n being an incrementing number.
    var dirName = makeTargetDir(data.title);

    // Log some basic information about the playlist we're about to download.
    logPlaylistInfo(data, dirName);

    // Write the description file.
    writeDescription(data.description, dirName);

    // Begin queuing downloads.
    var downloads = [];
    for (var n = 0; n < data.tracks.length; ++n) {
      if (!data.tracks[n].downloadURL) {
        console.log('scscrape.js: Warning: skipping over ' + (n + 1) + '. ' + data.tracks[n].title + ' because of a 9soundclouddownloader.com server error.');
        continue;
      }
      downloads.push(downloadTrack(data.tracks[n], n, dirName));
    }
    // Also queue the cover file.
    downloads.push(downloadCover(data.cover, dirName));

    // Finally, wait for all download promises to resolve.
    console.log('Now downloading...');
    Promise.all(downloads).then(function(files) {
      console.log('Finished downloading all files.');
    }).catch(function(msg) {
      console.log('Error occurred while downloading:');
      console.log(msg);
    });
  });
}

/**
 * Download an MP3 track.
 *
 * @param {Object} track Track information
 * @param {Number} n Track number
 * @param {String} dir Base directory
 */
function downloadTrack(track, n, dir) {
  var ext = path.extname(track.downloadURL.split(/[?#]/)[0]);
  var trackName = sanitize((n + 1) + '. ' + track.artist + ' - ' + track.title + ext);
  return downloadFile(track.downloadURL, path.join(dir, trackName))
}

/**
 * Synchronously write the description file.
 *
 * @param {String} desc Description contents
 * @param {String} dir Base directory
 */
function writeDescription(desc, dir) {
  desc = desc.trim();
  if (desc === '') {
    console.log('scscrape.js: Not saving an ' + descriptionName + ' file since the description is empty.');
    return;
  }
  var descPath = path.join(dir, descriptionName);
  try {
    fs.writeFileSync(descPath, desc);
  } catch (e) {
    console.log('scscrape.js: Error: could not write to target directory (' + descPath + ').');
    process.exit(5);
  }
}

/**
 * Downloads the cover image.
 *
 * @param {String} url Cover image URL
 * @param {String} dir Base directory
 * @returns {Promise} File download that resolves on completion
 */
function downloadCover(url, dir) {
  var ext = path.extname(url);
  var coverFile = coverName.replace(/\$EXT/, ext);
  return downloadFile(url, path.join(dir, coverFile));
}

/**
 * Downloads a file and resolves after the download finishes completely.
 *
 * @param {Object} url Download URL
 * @param {String} dest Destination path
 * @returns {Promise} File download that resolves on completion
 */
function downloadFile(url, dest) {
  return new Promise(function(resolve, reject) {
    var file = fs.createWriteStream(dest);
    var sendReq = request.get(url);

    sendReq.on('response', function(response) {
      if (response.statusCode !== 200) {
        reject('Response status was ' + response.statusCode + ' (' + url + ')');
      }
    });

    sendReq.on('error', function(err) {
      fs.unlink(dest);
      reject(err.message);
    });

    sendReq.pipe(file);

    file.on('finish', function() {
      file.close(resolve);
    });

    file.on('error', function(err) {
      fs.unlink(dest);
      reject(err.message);
    });
  });
}

/**
 * Log information about the playlist data.
 *
 * @param {Object} data Playlist data
 * @param {String} dir Target directory
 */
function logPlaylistInfo(data, dir) {
  console.log('Title: ' + data.title);
  console.log('Author: ' + data.author);
  console.log('URL: ' + data.url);
  console.log('');
  console.log('Tracklist:');
  var n, track;
  for (n = 0; n < data.tracks.length; ++n) {
    track = data.tracks[n];
    console.log(n + 1 + '. ' + track.artist + ' - ' + track.title);
  }
  console.log('');
  console.log('Downloading to: ' + dir);
  console.log('');
}

/**
 * Create the target directory, and return its name.
 *
 * @param {String} title Title of the playlist
 * @returns {String} Full path of the directory we've created
 */
function makeTargetDir(title) {
  var dirName;
  var n = 0;
  while (true) {
    dirName = targetName(title, n);
    try {
      fs.mkdirSync(dirName);
    } catch (e) {
      if (e.code === 'EEXIST') {
        n += 1;
        continue;
      } else {
        throw e;
      }
    }
    break;
  }
  return dirName;
}

/**
 * Returns a target directory name. Adds (n) to the name in case the directory
 * already exists.
 * @param {String} title Title of the playlist
 * @param {Number} attempt Number of attempts
 */
function targetName(title, attempt) {
  var attemptString = attempt != null && attempt > 0
    ? ' (' + attempt + ')'
    : '';
  return path.join(targetDir, sanitize(title + attemptString));
}

module.exports = {
  'setTargetDir': setTargetDir,
  'verifyEnv': verifyEnv,
  'downloadPlaylist': downloadPlaylist
};
