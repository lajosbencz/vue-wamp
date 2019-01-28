
const rollup = require('rollup');
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
    json(),
  ],
})
  .then(bundle =>
    bundle.write({
      banner,
      file: pkg.module,
      format: 'esm',
      sourcemap: false,
    })
  )
  .catch(console.error)
;
