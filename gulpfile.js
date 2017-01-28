'use strict';

const gulp = require("gulp");
const sass = require("gulp-sass");
const rename = require("gulp-rename");
const autoprefixer = require("gulp-autoprefixer");
const eslint = require("gulp-eslint");
const uglify = require("gulp-uglify");
const cssnano = require("gulp-cssnano");

gulp.task("lint", function () {
    return gulp.src(["src/js/*.js"])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task("js", ["lint"], function () {
    return gulp.src(["src/js/ultraselect.js"])
        .pipe(rename("jquery.ultraselect.js"))
        //.pipe(gulp.dest("dist"))
        //.pipe(rename({suffix: '.min'}))
        //.pipe(uglify())
        .pipe(gulp.dest("dist"));
});

gulp.task("sass", function () {
    return gulp.src("src/scss/*.scss")
        .pipe(sass().on("error", sass.logError))
        .pipe(autoprefixer({
            browsers: ['> .1%'],
            cascade: false
        }))
        .pipe(rename("jquery.ultraselect.css"))
        //.pipe(gulp.dest("dist"))
        //.pipe(rename({suffix: '.min'}))
        //.pipe(cssnano())
        .pipe(gulp.dest('dist'));
});

// TODO: minification as a separate task

gulp.task("watch", function () {
    gulp.watch("src/scss/*.scss", function() {
        setTimeout(function() {
            gulp.start("sass");
        }, 300);
    });
    gulp.watch("src/js/*.js", function() {
        setTimeout(function() {
            gulp.start("js");
        }, 300);
    });
});

gulp.task("default", ["sass", "js"]);
