const configureAPI = require('./src/server/configure');

module.exports = {
  devServer: {
    before: configureAPI,
  },
};
