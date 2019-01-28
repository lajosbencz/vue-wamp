
const rollup = require('rollup');
const commonjs = require('rollup-plugin-commonjs');
const resolve = require('rollup-plugin-node-resolve');
const json = require('rollup-plugin-json');

const {banner, pkg} = require('./shared.js');

rollup.rollup({
  input: 'src/index.js',
  external: [
    'autobahn',
    'vue'
  ],
  plugins: [
    resolve({
      jsnext: true,
      main: true,
      browser: false
    }),
    commonjs(),
    json(),
  ],
})
  .then(bundle =>
    bundle.write({
      banner,
      file: pkg.main,
      format: 'cjs',
      sourcemap: false,
    })
  )
  .catch(console.error)
;
