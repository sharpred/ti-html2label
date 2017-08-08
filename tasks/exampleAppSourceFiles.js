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
        }];

        toCopy.forEach(function (file) {
            grunt.log.ok(file.srcpath);
            grunt.log.ok(file.destpath);
            grunt.file.copy(file.srcpath, file.destpath);
        });

    });
}