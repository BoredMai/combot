var gulp = require('gulp');
var del = require('del');
// var concat = require('gulp-concat');
var ts = require('gulp-typescript');
var nodemon = require('gulp-nodemon');

gulp.task('clean', function() {
    return del.sync('combot.js');
})
gulp.task('build', function() {
    return gulp.src('src/**/*.ts')
               .pipe(ts({ out: 'combot.js' }))
               .pipe(gulp.dest('./'));
});

gulp.task('watch', ['clean', 'build'], function() {
    gulp.watch('src/**/*.ts', ['build']);
    nodemon({ script: 'combot.js' })
})