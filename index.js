'use strict';

const path = require('path');
const Stream = require('stream');
const through = require('through2').obj;
const Vinyl = require('vinyl');
const PluginError = require('plugin-error');

const Base64Encode = require('./lib/encode');
const Base64Decode = require('./lib/decode');

const PLUGIN_NAME = 'gulp-b64';

function plugin(options) {

  let mode = (options && options.mode) || 'encode';
  let ext = (options && options.ext) || 'b64';
  let encoding = options && (options.inputEncoding || options.outputEncoding)
  let cwd = path.resolve(process.cwd());
  let Operation = null;
  let extRegEx = new RegExp(`\.${ext}$`)

  if (mode === 'encode') {
    Operation = Base64Encode;
  } else if (mode === 'decode') {
    Operation = Base64Decode;
  } else {
    throw new PluginError(PLUGIN_NAME, 'Invalid mode');
  }

  function transform(file, enc, next) {
    if (file.isNull()) {
      this.push(file);
      return next();
    }

    let chunks = [];
    let filePath = path.resolve(cwd, file.relative);
    let stream = null;
    let newFilePath = null;

    if (file.isBuffer()) {
      stream = new Stream.PassThrough();
      stream.end(file.contents);
    } else if (file.isStream()) {
      stream = file;
    }

    if (mode === 'encode' && !extRegEx.test(filePath)) {
      newFilePath = `${filePath}.${ext}`
    } else if (mode === 'decode' && extRegEx.test(filePath)) {
      newFilePath = filePath.replace(extRegEx, '')
    } else {
      this.push(file);
      return next();
    }

    let save = () => {
      this.push(new Vinyl({
        cwd,
        path: newFilePath,
        contents: Buffer.concat(chunks)
      }));
      next();
    }

    let read = (chunk) => {
      chunks.push(Buffer.from(chunk, encoding || enc));
    }

    stream.pipe(new Operation(options))
      .on('data', read)
      .on('end', save);
  }

  return through(transform);
}

module.exports = plugin;
