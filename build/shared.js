
const pkg = require('../package.json');
const banner = `/*!\n * ${pkg.name} v${pkg.version}\n * ${pkg.homepage}\n * Released under the MIT License.\n */\n`;

module.exports = {
  pkg,
  banner,
};
