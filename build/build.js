
const fs = require('fs');
const zlib = require('zlib');
const rollup = require('rollup');
const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const resolve = require('rollup-plugin-node-resolve');
const replace = require('rollup-plugin-replace');
const minify = require('rollup-plugin-babel-minify');
const json = require('rollup-plugin-json');
const pkg = require('../package.json');
const banner = `/*!\n * ${pkg.name} v${pkg.version}\n * ${pkg.homepage}\n * Released under the MIT License.\n */\n`;

function rollupPlugins() {
  return [
    babel({
      exclude: 'node_modules/**'
    }),
    replace({
      __VERSION__: pkg.version
    }),
    resolve({
      jsnext: true,
      main: true,
      browser: true
    }),
    commonjs(),
    minify({
      mangle: { topLevel: true }
    }),
    json()
  ];
}

rollup.rollup({
  external: [
    'autobahn',
    'vue'
  ],
  input: 'src/index.js',
  plugins: rollupPlugins()
})
  .then(bundle => {
    bundle.write({
      name: 'VueWamp',
      file: pkg.browser,
      format: 'umd',
      sourcemap: true,
      sourcemapFile: pkg.browser + '.map'
    });
    return bundle
  })
  .then(bundle => {
    bundle.write({
      file: pkg.main,
      format: 'cjs',
      sourcemap: true,
      sourcemapFile: pkg.main + '.map'
    });
    return bundle
  })
  .then(bundle => {
    bundle.write({
      file: pkg.module,
      format: 'esm',
      sourcemap: true,
      sourcemapFile: pkg.module + '.map'
    });
    return bundle
  })
  .catch(console.error)
;
