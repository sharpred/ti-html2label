module.exports = function (grunt) {
    grunt.registerTask('copyexamplefiles', 'copies required source to the newly created example app', function () {
        var srcFolder = process.cwd() + "/exampleSource/";
        var destFolder = process.cwd() + "/example/";
        [{
            srcpath: srcFolder + "index.js",
            destpath: destFolder + "app/controllers/index.js"
        }, {
            srcpath: srcFolder + "index.tss",
            destpath: "app/styles/index.tss"
        }, {
            srcpath: srcFolder + "index.xml",
            destpath: "app/views/index.xml"
        }].forEach(function (file) {
            grunt.file.copy(file.srcpath, file.destpath);
        });
    });
}