'use strict';

const gulp = require("gulp");
const sass = require("gulp-sass");
const rename = require("gulp-rename");

gulp.task("sass", function () {
    return gulp.src("src/scss/*.scss")
        .pipe(sass().on("error", sass.logError))
        .pipe(rename("jquery.ultraselect.css"))
        .pipe(gulp.dest("dist"));
});

gulp.task("default", ["sass"]);
