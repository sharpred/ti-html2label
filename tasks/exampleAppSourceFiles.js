module.exports = function (grunt) {
    grunt.registerTask('copyexamplefiles', 'copies required source to the newly created example app', function () {
        var srcFolder = process.cwd() + "/exampleSource/";
        var destFolder = process.cwd() + "/example/";
        var toCopy = [{
            srcpath: srcFolder + "index.js",
            destpath: destFolder + "app/controllers/index.js"
        }, {
            srcpath: srcFolder + "index.tss",
            destpath: destFolder + "app/styles/index.tss"
        }, {
            srcpath: srcFolder + "index.xml",
            destpath: destFolder + "app/views/index.xml"
        }, {
            srcpath: srcFolder + "sample.html",
            destpath: destFolder + "app/assets/sample.html"
        }, {
            srcpath: srcFolder + "whitelist.json",
            destpath: destFolder + "app/assets/whitelist.json"
        }];

        toCopy.forEach(function (file) {
            grunt.file.copy(file.srcpath, file.destpath);
        });

    });
}