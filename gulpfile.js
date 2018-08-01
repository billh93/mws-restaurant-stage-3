var gulp = require('gulp');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var browserSync = require('browser-sync').create();
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var babel = require('gulp-babel');
var sourcemaps = require('gulp-sourcemaps');
var useref = require('gulp-useref');
var gulpif = require('gulp-if');
var compress = require('compression');
var connect = require('gulp-connect');
var modRewrite = require('connect-modrewrite');
var open = require('gulp-open');

gulp.task('default',['copy-html', 'copy-images', 'sw'], function(){
  console.log('Done!');
});

// gulp.task('run',['default', 'browserSync'], function(){
//   console.log('Starting the app');
// });

//gulp.task('watch', ['browserSync', 'styles', 'copy-html', 'sw', 'scripts'], function(){
gulp.task('watch', ['browserSync', 'styles', 'copy-html', 'sw'], function(){
  gulp.watch('src/sass/**/*.scss', ['styles']);
  gulp.watch('*.html', ['copy-html']);
  gulp.watch('*.html', browserSync.reload);
  gulp.watch('src/js/**/*.js', browserSync.reload);
});

gulp.task('dist', [
  'copy-html',
  'copy-images',
  'styles',
  'scripts-dist'
]);

gulp.task('scripts', function(){
  gulp.src('src/js/**/*.js')
      // .pipe(babel({
      //   presets: ['env']
      // }))
      //.pipe(concat('all.js'))
      .pipe(gulp.dest('dist/js'));
});

// gulp.task('scripts-dist', function(){
//   gulp.src('src/js/**/*.js')
//       .pipe(sourcemaps.init())
//       .pipe(babel({
//         presets: ['env']
//       }))
//       //.pipe(concat('all.js'))
//       .pipe(uglify().on('error', e => console.log(e)))
//       .pipe(sourcemaps.write())
//       .pipe(gulp.dest('dist/js'));
// });

gulp.task('sw', function(){
  gulp.src('./sw.js')
      // .pipe(babel({
      //   presets: ['env']
      // }))
      .pipe(gulp.dest('./dist'))
});

gulp.task('copy-html', ['scripts', 'styles'], function(){
  gulp.src(['./*.html', 'manifest.json'])
      .pipe(useref())
      // .pipe(gulpif('*.js', babel({ // added later
      //   presets: ['env']
      // })))
      // .pipe(gulpif('*.js', uglify())) //minify js - added later
      .pipe(gulp.dest('./dist'))
});

gulp.task('copy-images', function(){
  gulp.src('src/img/**/*')
      .pipe(gulp.dest('dist/img'));
});

gulp.task('styles', function(){
  gulp.src('src/sass/**/*.scss')
      .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
      .pipe(autoprefixer({
        browsers: ['last 2 versions']
      }))
      .pipe(concat('combined.css'))
      .pipe(gulp.dest('./dist/css'))
      // .pipe(browserSync.reload({
      //   stream: true
      // }))
      ;
});

gulp.task('browserSync', function(){
  browserSync.init({
    port: 8000,
    server: {
      baseDir: "./dist"
    },
    middleware: [compress()]
    // https: {
    //   key: fs.readFileSync("ssl/filename.key", "utf8"),
    //   cert: fs.readFileSync("ssl/filename.crt", "utf8")
    //   //passphrase: 'password'
    // },
    //httpModule: 'http2',
    // https: {
    //   key: "ssl/privkey.pem",
    //   cert: "ssl/cacert.crt",
    //   passphrase: 'vatasoiu'
    // }
  });
});

gulp.task('run', ['default', 'connect-https'], function() {
  console.log('Starting the app');
  connect.server({
    root: 'dist',
    name: 'HTTP',
    port: 80,
    https: false,
    debug: false,
    middleware: function(connect, options) {   
      return [
        modRewrite([
          '/* https://localhost:443/ [L,R=301]'
        ])
      ];
    }
  });
  gulp.src(__filename)
  .pipe(open({uri: 'https://localhost'}));
});

gulp.task('connect-https', function() {
  connect.server({
    root: 'dist',
    name: 'HTTPS',
    port: 443,
    https: true
  });
});