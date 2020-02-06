const configureAPI = require('./src/server/configure');

module.exports = {
  devServer: {
    port: 3000,
    before: configureAPI,
  },
};
