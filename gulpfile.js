const {
  src,
  dest
} = require('gulp')

const gulpB64 = require('.')

function defaultTask (done) {
  return src('data/**')
  .pipe(gulpB64({
    mode: 'decode'
  }))
  .pipe(dest('data'))
}

exports.default = defaultTask