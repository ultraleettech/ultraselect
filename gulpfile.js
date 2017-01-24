'use strict';

const gulp = require("gulp");
const sass = require("gulp-sass");
const rename = require("gulp-rename");
const autoprefixer = require("gulp-autoprefixer");

gulp.task("sass", function () {
    return gulp.src("src/scss/*.scss")
        .pipe(sass().on("error", sass.logError))
        .pipe(autoprefixer({
            browsers: ['> .1%'],
            cascade: false
        }))
        .pipe(rename("jquery.ultraselect.css"))
        .pipe(gulp.dest("dist"));
});

gulp.task("watch", function () {
    setTimeout(function () {
        gulp.watch("src/scss/*.scss", ["sass"])
    }, 300);
});

gulp.task("default", ["sass"]);
