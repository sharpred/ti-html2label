var assert = require('assert');
var resolve = require('../');

var fixtures_dir = __dirname + '/fixtures/node_modules';

// no package.json, load index.js
test('index.js of module dir', function(done) {
    resolve('module-a', { paths: [ fixtures_dir ], package: { main: 'fixtures' } }, function(err, path, pkg) {
        assert.ifError(err);
        assert.equal(path, require.resolve('./fixtures/node_modules/module-a/index'));
        assert.strictEqual(pkg, undefined);
        done();
    });
});

// package.json main field specifies other location
test('alternate main', function(done) {
    resolve('module-b', { paths: [ fixtures_dir ], package: { main: 'fixtures' } }, function(err, path, pkg) {
        assert.ifError(err);
        assert.equal(path, require.resolve('./fixtures/node_modules/module-b/main'));
        assert.strictEqual(pkg.main, './main.js');
        done();
    });
});

// package.json has 'titanium' field which is a string
test('string titanium field as main', function(done) {
    resolve('module-c', { paths: [ fixtures_dir ], package: { main: 'fixtures' } }, function(err, path, pkg) {
        assert.ifError(err);
        assert.equal(path, require.resolve('./fixtures/node_modules/module-c/titanium'));
        assert.equal(pkg.main, './titanium.js');
        done();
    });
});

// package.json has 'titanium' field which is a string
test('string titanium field as main - require subfile', function(done) {
    var parent = {
        filename: fixtures_dir + '/module-c/titanium.js',
        paths: [ fixtures_dir + '/module-c/node_modules' ],
        package: { main: './titanium.js' }
    };

    resolve('./bar', parent, function(err, path, pkg) {
        assert.ifError(err);
        assert.equal(path, require.resolve('./fixtures/node_modules/module-c/bar'));
        assert.equal(pkg.main, './titanium.js');
        done();
    });
});

// package.json has titanium field as object
// one of the keys replaces the main file
// this would be done if the user needed to replace main and some other module
test('object titanium field as main', function(done) {
    resolve('module-d', { paths: [ fixtures_dir ], package: { main: 'fixtures' } }, function(err, path, pkg) {
        assert.ifError(err);
        assert.equal(path, require.resolve('./fixtures/node_modules/module-d/titanium'));
        assert.equal(pkg.main, './titanium.js');
        done();
    });
});

// package.json has titanium field as object
// one of the keys replaces the main file
// however the main has no prefix and titanium uses ./ prefix for the same file
test('object titanium field as main', function(done) {
    resolve('module-k', { paths: [ fixtures_dir ], package: { main: 'fixtures' } }, function(err, path, pkg) {
        assert.ifError(err);
        assert.equal(path, require.resolve('./fixtures/node_modules/module-k/titanium'));
        assert.equal(pkg.main, './titanium.js');
        done();
    });
});

// titanium field in package.json maps ./foo.js -> ./titanium.js
// when we resolve ./foo while in module-e, this mapping should take effect
// the result is that ./foo resolves to ./titanium
test('object titanium field replace file', function(done) {
    var parent = {
        filename: fixtures_dir + '/module-e/main.js',
        package: { main: './main.js' }
    };

    resolve('./foo', parent, function(err, path, pkg) {
        assert.ifError(err);
        assert.equal(path, require.resolve('./fixtures/node_modules/module-e/titanium'));
        assert.equal(pkg.main, './main.js');
        done();
    });
});

// titanium field in package.json maps "module" -> "alternate module"
test('test foobar -> module-b replacement', function(done) {
    var parent = {
        filename: fixtures_dir + '/module-h/index.js',
        package: { main: './index.js' }
    };

    resolve('foobar', parent, function(err, path, pkg) {
        assert.ifError(err);
        assert.equal(path, require.resolve('./fixtures/node_modules/module-b/main'));
        assert.equal(pkg.main, './main.js');
        done();
    });
});

// same as above but replacing core
test('test core -> module-c replacement', function(done) {
    var parent = {
        filename: fixtures_dir + '/module-h/index.js',
        package: { main: './index.js' }
    };

    resolve('querystring', parent, function(err, path, pkg) {
        assert.ifError(err);
        assert.equal(path, require.resolve('./fixtures/node_modules/module-c/titanium'));
        assert.equal(pkg.main, './titanium.js');
        done();
    });
});

// titanium field in package.json maps "module" -> "alternate module"
false && test('test foobar -> module-b replacement with transform', function(done) {
    var parent = {
        filename: fixtures_dir + '/module-i/index.js',
        package: { main: './index.js' }
    };

    resolve('foobar', parent, function(err, path, pkg) {
        assert.ifError(err);
        assert.equal(path, require.resolve('./fixtures/node_modules/module-b/main'));
        assert.equal(pkg.main, './main.js');
        done();
    });
});

false && test('test foobar -> module-i replacement with transform in replacement', function(done) {
    var parent = {
        filename: fixtures_dir + '/module-j/index.js',
        package: { main: './index.js' }
    };

    resolve('foobar', parent, function(err, path, pkg) {
        assert.ifError(err);
        assert.equal(path, require.resolve('./fixtures/node_modules/module-i/index'));
        assert.equal(pkg.main, './index.js');
        assert.equal(pkg.titanium['foobar'], 'module-b');
        assert.equal(pkg.titaniumify.transform, 'deamdify');
        done();
    });
});

// same as above, but without a paths field in parent
// should still checks paths on the filename of parent
test('object titanium field replace file - no paths', function(done) {
    var parent = {
        filename: fixtures_dir + '/module-f/lib/main.js',
        package: { main: './lib/main.js' }
    };

    resolve('./foo', parent, function(err, path, pkg) {
        assert.ifError(err);
        assert.equal(path, require.resolve('./fixtures/node_modules/module-f/lib/titanium'));
        assert.equal(pkg.main, './lib/main.js');
        done();
    });
});

test('replace module in titanium field object', function(done) {
    var parent = {
        filename: fixtures_dir + '/module-g/index.js',
        package: { main: './index.js' }
    };

    resolve('foobar', parent, function(err, path, pkg) {
        assert.ifError(err);
        assert.equal(path, require.resolve('./fixtures/node_modules/module-g/foobar-titanium'));
        assert.equal(pkg.main, './index.js');
        done();
    });
});

test('override engine shim', function(done) {
    var parent = {
        filename: fixtures_dir + '/override-engine-shim/index.js',
        package: { main: './index.js' },
        modules: { url: "wonderland" }
    };
    resolve('url', parent, function(err, path, pkg) {
        assert.ifError(err);
        assert.equal(path, require.resolve('./fixtures/node_modules/override-engine-shim/url-titanium'));
        done();
    });
});
