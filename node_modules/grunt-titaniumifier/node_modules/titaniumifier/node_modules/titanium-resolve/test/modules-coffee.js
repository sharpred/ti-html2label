var assert = require('assert');
var resolve = require('../');

var fixtures_dir = __dirname + '/fixtures-coffee/node_modules';

// no package.json, load index.js
test('index.js of module dir', function(done) {
    var parent = {
        paths: [ fixtures_dir ],
        extensions: ['.js', '.coffee']
    };
    resolve('module-a', parent, function(err, path) {
        assert.ifError(err);
        assert.equal(path, require.resolve('./fixtures-coffee/node_modules/module-a/index.coffee'));
        done();
    });
});

// package.json main field specifies other location
test('alternate main', function(done) {
    var parent = {
        paths: [ fixtures_dir ],
        extensions: ['.js', '.coffee']
    };
    resolve('module-b', parent, function(err, path) {
        assert.ifError(err);
        assert.equal(path, require.resolve('./fixtures-coffee/node_modules/module-b/main.coffee'));
        done();
    }, {extensions: ['.js', '.coffee']});
});

// package.json has 'titanium' field which is a string
test('string titanium field as main', function(done) {
    var parent = {
        paths: [ fixtures_dir ],
        extensions: ['.js', '.coffee']
    };
    resolve('module-c', parent, function(err, path) {
        assert.ifError(err);
        assert.equal(path, require.resolve('./fixtures-coffee/node_modules/module-c/titanium.coffee'));
        done();
    }, {extensions: ['.js', '.coffee']});
});

// package.json has 'titanium' field which is a string
test('string titanium field as main - require subfile', function(done) {
    var parent = {
        filename: fixtures_dir + '/module-c/titanium.js',
        paths: [ fixtures_dir + '/module-c/node_modules' ],
        extensions: ['.js', '.coffee']
    };

    resolve('./bar', parent, function(err, path) {
        assert.ifError(err);
        assert.equal(path, require.resolve('./fixtures-coffee/node_modules/module-c/bar.coffee'));
        done();
    });
});

// package.json has titanium field as object
// one of the keys replaces the main file
// this would be done if the user needed to replace main and some other module
test('object titanium field as main', function(done) {
    var parent = {
        paths: [ fixtures_dir ],
        extensions: ['.js', '.coffee']
    };
    resolve('module-d', parent, function(err, path) {
        assert.ifError(err);
        assert.equal(path, require.resolve('./fixtures-coffee/node_modules/module-d/titanium.coffee'));
        done();
    });
});

// titanium field in package.json maps ./foo.js -> ./titanium.js
// when we resolve ./foo while in module-e, this mapping should take effect
// the result is that ./foo resolves to ./titanium
test('object titanium field replace file', function(done) {
    var parent = {
        filename: fixtures_dir + '/module-e/main.coffee',
        extensions: ['.js', '.coffee']
    };

    resolve('./foo', parent, function(err, path) {
        assert.ifError(err);
        assert.equal(path, require.resolve('./fixtures-coffee/node_modules/module-e/titanium.coffee'));
        done();
    });
});

// same as above, but without a paths field in parent
// should still checks paths on the filename of parent
test('object titanium field replace file - no paths', function(done) {
    var parent = {
        filename: fixtures_dir + '/module-f/lib/main.coffee',
        extensions: ['.js', '.coffee']
    };

    resolve('./foo', parent, function(err, path) {
        assert.ifError(err);
        assert.equal(path, require.resolve('./fixtures-coffee/node_modules/module-f/lib/titanium.coffee'));
        done();
    });
});

test('replace module in titanium field object', function(done) {
    var parent = {
        filename: fixtures_dir + '/module-g/index.js',
        extensions: ['.js', '.coffee']
    };

    resolve('foobar', parent, function(err, path) {
        assert.ifError(err);
        assert.equal(path, require.resolve('./fixtures-coffee/node_modules/module-g/foobar-titanium.coffee'));
        done();
    });
});
