const rollup = require('rollup');
const babel = require('rollup-plugin-babel');
const resolve = require('rollup-plugin-node-resolve');
const minify = require('rollup-plugin-babel-minify');
const json = require('rollup-plugin-json');

const {banner, pkg} = require('./shared.js');

rollup.rollup({
  input: 'src/index.js',
  external: [
    'autobahn',
    'vue'
  ],
  plugins: [
    babel({
      exclude: 'node_modules/**'
    }),
    resolve({
      jsnext: false,
      main: false,
      browser: true
    }),
    minify({
      banner,
      bannerNewLine: true,
      comments: false,
      mangle: { topLevel: true }
    }),
    json(),
  ],
})
  .then(bundle => {
    bundle.write({
      name: 'VueWamp',
      globals: {
        'autobahn': 'autobahn',
        'vue': 'Vue',
      },
      file: pkg.browser,
      format: 'umd',
      sourcemap: true,
      sourcemapFile: pkg.browser + '.map'
    });
    return bundle
  })
  .catch(console.error)
;
