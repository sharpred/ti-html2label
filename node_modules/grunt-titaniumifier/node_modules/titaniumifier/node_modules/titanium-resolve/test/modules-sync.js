var assert = require('assert');
var resolve = require('../');

var fixtures_dir = __dirname + '/fixtures/node_modules';

// no package.json, load index.js
test('index.js of module dir', function() {
    var path = resolve.sync('module-a', { paths: [ fixtures_dir ], package: { main: 'fixtures' } });
    assert.equal(path, require.resolve('./fixtures/node_modules/module-a/index'));
});

// package.json main field specifies other location
test('alternate main', function() {
    var path = resolve.sync('module-b', { paths: [ fixtures_dir ], package: { main: 'fixtures' } });
    assert.equal(path, require.resolve('./fixtures/node_modules/module-b/main'));
});

// package.json has 'titanium' field which is a string
test('string titanium field as main', function() {
    var path = resolve.sync('module-c', { paths: [ fixtures_dir ], package: { main: 'fixtures' } });
    assert.equal(path, require.resolve('./fixtures/node_modules/module-c/titanium'));
});

// package.json has 'titanium' field which is a string
test('string titanium field as main - require subfile', function() {
    var parent = {
        filename: fixtures_dir + '/module-c/titanium.js',
        paths: [ fixtures_dir + '/module-c/node_modules' ],
        package: { main: './titanium.js' }
    };

    var path = resolve.sync('./bar', parent);
    assert.equal(path, require.resolve('./fixtures/node_modules/module-c/bar'));
});

// package.json has titanium field as object
// one of the keys replaces the main file
// this would be done if the user needed to replace main and some other module
test('object titanium field as main', function() {
    var path = resolve.sync('module-d', { paths: [ fixtures_dir ], package: { main: 'fixtures' } });
    assert.equal(path, require.resolve('./fixtures/node_modules/module-d/titanium'));
});

// package.json has titanium field as object
// one of the keys replaces the main file
// however the main has no prefix and titanium uses ./ prefix for the same file
test('object titanium field as main', function() {
    var path = resolve.sync('module-k', { paths: [ fixtures_dir ], package: { main: 'fixtures' } });
    assert.equal(path, require.resolve('./fixtures/node_modules/module-k/titanium'));
});

// titanium field in package.json maps ./foo.js -> ./titanium.js
// when we resolve ./foo while in module-e, this mapping should take effect
// the result is that ./foo resolves to ./titanium
test('object titanium field replace file', function() {
    var parent = {
        filename: fixtures_dir + '/module-e/main.js',
        package: { main: './main.js' }
    };

    var path = resolve.sync('./foo', parent);
    assert.equal(path, require.resolve('./fixtures/node_modules/module-e/titanium'));
});

// titanium field in package.json maps "module" -> "alternate module"
test('test foobar -> module-b replacement', function() {
    var parent = {
        filename: fixtures_dir + '/module-h/index.js',
        package: { main: './index.js' }
    };

    var path = resolve.sync('foobar', parent);
    assert.equal(path, require.resolve('./fixtures/node_modules/module-b/main'));
});

// same as above but replacing core
test('test core -> module-c replacement', function() {
    var parent = {
        filename: fixtures_dir + '/module-h/index.js',
        package: { main: './index.js' }
    };

    var path = resolve.sync('querystring', parent);
    assert.equal(path, require.resolve('./fixtures/node_modules/module-c/titanium'));
});

// titanium field in package.json maps "module" -> "alternate module"
false && test('test foobar -> module-b replacement with transform', function() {
    var parent = {
        filename: fixtures_dir + '/module-i/index.js',
        package: { main: './index.js' }
    };

    var path = resolve.sync('foobar', parent);
    assert.equal(path, require.resolve('./fixtures/node_modules/module-b/main'));
});

false && test('test foobar -> module-i replacement with transform in replacement', function() {
    var parent = {
        filename: fixtures_dir + '/module-j/index.js',
        package: { main: './index.js' }
    };

    var path = resolve.sync('foobar', parent);
    assert.equal(path, require.resolve('./fixtures/node_modules/module-i/index'));
});

// same as above, but without a paths field in parent
// should still checks paths on the filename of parent
test('object titanium field replace file - no paths', function() {
    var parent = {
        filename: fixtures_dir + '/module-f/lib/main.js',
        package: { main: './lib/main.js' }
    };

    var path = resolve.sync('./foo', parent);
    assert.equal(path, require.resolve('./fixtures/node_modules/module-f/lib/titanium'));
});

test('replace module in titanium field object', function() {
    var parent = {
        filename: fixtures_dir + '/module-g/index.js',
        package: { main: './index.js' }
    };

    var path = resolve.sync('foobar', parent);
    assert.equal(path, require.resolve('./fixtures/node_modules/module-g/foobar-titanium'));
});

test('override engine shim', function() {
    var parent = {
        filename: fixtures_dir + '/override-engine-shim/index.js',
        package: { main: './index.js' },
        modules: { url: "wonderland" }
    };
    var path = resolve.sync('url', parent);
    assert.equal(path, require.resolve('./fixtures/node_modules/override-engine-shim/url-titanium'));
});
