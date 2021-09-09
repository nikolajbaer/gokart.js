//babel.config.js
module.exports = {
    presets: ['@babel/preset-env'],
    env: {
        test: {
            plugins: ["dynamic-import-node","@babel/plugin-transform-modules-commonjs"]
        }
    }
}
