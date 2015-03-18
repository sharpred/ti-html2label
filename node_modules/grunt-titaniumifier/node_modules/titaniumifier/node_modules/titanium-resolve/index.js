// builtin
var fs = require('fs');
var path = require('path');

// vendor
var resv = require('resolve');

var has = Object.prototype.hasOwnProperty;

// given a path, create an array of node_module paths for it
// borrowed from substack/resolve
function nodeModulesPaths (start, cb) {
    var splitRe = process.platform === 'win32' ? /[\/\\]/ : /\/+/;
    var parts = start.split(splitRe);

    var dirs = [];
    for (var i = parts.length - 1; i >= 0; i--) {
        if (parts[i] === 'node_modules') continue;
        var dir = path.join.apply(
            path, parts.slice(0, i + 1).concat(["node_modules"])
        );
        if (!parts[0].match(/([A-Za-z]:)/)) {
            dir = '/' + dir;
        }
        dirs.push(dir);
    }
    return dirs;
}

function find_shims_in_package(pkgJson, cur_path, shims) {
    try {
        var info = JSON.parse(pkgJson);
    }
    catch (err) {
        err.message = pkgJson + ' : ' + err.message
        throw err;
    }

    // no replacements, skip shims
    if (!info.titanium && !info.browser) {
        return;
    }

    // if titanium field is a string
    // then it just replaces the main entry point
    if (typeof info.titanium === 'string') {
        var key = path.resolve(cur_path, info.main || 'index.js');
        shims[key] = path.resolve(cur_path, info.titanium);
        return;
    }
    // if there’s no titanium field, and browser field is a string
    // then it just replaces the main entry point
    else if (!info.titanium && (typeof info.browser === 'string')) {
        var key = path.resolve(cur_path, info.main || 'index.js');
        shims[key] = path.resolve(cur_path, info.browser);
        return;
    }

    var obj = {};

    if (info.titanium) {
        Object.keys(info.titanium).forEach(function (key) {
            obj[key] = true;
        });
    }

    if (info.browser && (typeof info.browser !== 'string')) {
        Object.keys(info.browser).forEach(function (key) {
            obj[key] = true;
        });
    }

    // http://nodejs.org/api/modules.html#modules_loading_from_node_modules_folders
    Object.keys(obj).forEach(function(key) {
        var val =
            (info.titanium && has.call(info.titanium, key)) ?
                info.titanium[key] :
            (info.browser && has.call(info.browser, key)) ?
                info.browser[key] :
            undefined;

        if (val === false) {
            return shims[key] = __dirname + '/empty.js';
        }

        // if target is a relative path, then resolve
        // otherwise we assume target is a module
        if (val[0] === '.') {
            val = path.resolve(cur_path, val);
        }

        // if does not begin with / ../ or ./ then it is a module
        if (key[0] !== '/' && key[0] !== '.') {
            return shims[key] = val;
        }

        key = path.resolve(cur_path, key);
        shims[key] = val;
    });
}

// paths is mutated
// load shims from first package.json file found
function load_shims(paths, cb) {
    // identify if our file should be replaced per the browser field
    // original filename|id -> replacement
    var shims = {};

    (function next() {
        var cur_path = paths.shift();
        if (!cur_path) {
            return cb(null, shims);
        }

        var pkg_path = path.join(cur_path, 'package.json');

        fs.readFile(pkg_path, 'utf8', function(err, data) {
            if (err) {
                // ignore paths we can't open
                // avoids an exists check
                if (err.code === 'ENOENT') {
                    return next();
                }

                return cb(err);
            }
            try {
                find_shims_in_package(data, cur_path, shims);
                return cb(null, shims);
            }
            catch (err) {
                return cb(err);
            }
        });
    })();
};

// paths is mutated
// synchronously load shims from first package.json file found
function load_shims_sync(paths) {
    // identify if our file should be replaced per the browser field
    // original filename|id -> replacement
    var shims = {};
    var cur_path;

    while (cur_path = paths.shift()) {
        var pkg_path = path.join(cur_path, 'package.json');

        try {
            var data = fs.readFileSync(pkg_path, 'utf8');
            find_shims_in_package(data, cur_path, shims);
            return shims;
        }
        catch (err) {
            // ignore paths we can't open
            // avoids an exists check
            if (err.code === 'ENOENT') {
                continue;
            }

            throw err;
        }
    }
    return shims;
}

function build_resolve_opts(opts, base) {
    return {
        paths: opts.paths,
        extensions: opts.extensions,
        basedir: base,
        package: opts.package,
        packageFilter: function (info, pkgdir) {
            if (opts.packageFilter) info = opts.packageFilter(info, pkgdir);

            // no browser field, keep info unchanged
            if (!info.titanium && !info.browser) {
                return info;
            }

            // replace main
            if (typeof info.titanium === 'string') {
                info.main = info.titanium;
                return info;
            }
            else if (!info.titanium && (typeof info.browser === 'string')) {
                info.main = info.browser;
                return info;
            }

            info.main =
                (info.titanium && (info.titanium[info.main || './index.js'])) ||
                (info.titanium && (info.titanium['./' + info.main || './index.js'])) ||
                (info.browser && (info.browser[info.main || './index.js'])) ||
                (info.browser && (info.browser['./' + info.main || './index.js'])) ||
                info.main;

            return info;
        }
    };
}

function resolve(id, opts, cb) {

    // opts.filename
    // opts.paths
    // opts.modules
    // opts.packageFilter

    opts = opts || {};

    var base = path.dirname(opts.filename);
    var paths = nodeModulesPaths(base);

    if (opts.paths) {
        paths.push.apply(paths, opts.paths);
    }

    paths = paths.map(function(p) {
        return path.dirname(p);
    });

    // we must always load shims because the browser field could shim out a module
    load_shims(paths, function(err, shims) {
        if (err) {
            return cb(err);
        }

        if (has.call(shims, id)) {
            // if the shim was is an absolute path, it was fully resolved
            if (shims[id][0] === '/') {
                return cb(null, shims[id], opts.package);
            }

            // module -> alt-module shims
            id = shims[id];
        }

        var modules = opts.modules || {};
        var shim_path = has.call(modules, id) ? modules[id] : undefined;
        if (shim_path) {
            return cb(null, shim_path);
        }

        // our browser field resolver
        // if browser field is an object tho?
        var full = resv(id, build_resolve_opts(opts, base), function(err, full, pkg) {
            if (err) {
                return cb(err);
            }

            var resolved = (shims) ? shims[full] || full : full;
            cb(null, resolved, pkg);
        });
    });
};

resolve.sync = function (id, opts) {

    // opts.filename
    // opts.paths
    // opts.modules
    // opts.packageFilter

    opts = opts || {};

    var base = path.dirname(opts.filename);
    var paths = nodeModulesPaths(base);

    if (opts.paths) {
        paths.push.apply(paths, opts.paths);
    }

    paths = paths.map(function(p) {
        return path.dirname(p);
    });

    // we must always load shims because the browser field could shim out a module
    var shims = load_shims_sync(paths);

    if (has.call(shims, id)) {
        // if the shim was is an absolute path, it was fully resolved
        if (shims[id][0] === '/') {
            return shims[id];
        }

        // module -> alt-module shims
        id = shims[id];
    }

    var modules = opts.modules || {};
    var shim_path = has.call(modules, id) ? modules[id] : undefined;
    if (shim_path) {
        return shim_path;
    }

    // our browser field resolver
    // if browser field is an object tho?
    var full = resv.sync(id, build_resolve_opts(opts, base));

    return (shims) ? shims[full] || full : full;
};

module.exports = resolve;
