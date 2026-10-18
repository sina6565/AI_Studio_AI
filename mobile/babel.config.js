module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    // Injects `.env` values at build time so the API base URL is configurable
    // without a native module. Values are exposed through the `@env` module.
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: '.env',
        safe: false,
        allowUndefined: true,
      },
    ],
  ],
};
