/**
 * Babel configuration for OptiShare.
 *
 * Adds module-resolver plugin for path alias resolution at runtime,
 * matching the TypeScript path aliases defined in tsconfig.json.
 */
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['.'],
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        alias: {
          '@app': './src/app',
          '@core': './src/core',
          '@features': './src/features',
          '@shared': './src/shared',
        },
      },
    ],
  ],
};
