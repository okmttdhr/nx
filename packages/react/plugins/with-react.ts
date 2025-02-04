import type { Configuration } from 'webpack';
import type { WithWebOptions } from '@nrwl/webpack';

const processed = new Set();

interface WithReactOptions extends WithWebOptions {}

export function withReact(pluginOptions: WithReactOptions = {}) {
  return function configure(config: Configuration, _ctx?: any): Configuration {
    const { withWeb } = require('@nrwl/webpack');

    if (processed.has(config)) return config;

    // Apply web config for CSS, JSX, index.html handling, etc.
    config = withWeb(pluginOptions)(config, _ctx);

    config.module.rules.push({
      test: /\.svg$/,
      issuer: /\.(js|ts|md)x?$/,
      use: [
        {
          loader: require.resolve('@svgr/webpack'),
          options: {
            svgo: false,
            titleProp: true,
            ref: true,
          },
        },
        {
          loader: require.resolve('file-loader'),
          options: {
            name: '[name].[hash].[ext]',
          },
        },
      ],
    });

    if (config.mode === 'development' && config['devServer']?.hot) {
      // add `react-refresh/babel` to babel loader plugin
      const babelLoader = config.module.rules.find(
        (rule) =>
          typeof rule !== 'string' &&
          rule.loader?.toString().includes('babel-loader')
      );
      if (babelLoader && typeof babelLoader !== 'string') {
        babelLoader.options['plugins'] = [
          ...(babelLoader.options['plugins'] || []),
          [
            require.resolve('react-refresh/babel'),
            {
              skipEnvCheck: true,
            },
          ],
        ];
      }
      const ReactRefreshPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
      config.plugins.push(new ReactRefreshPlugin());
    }

    // enable webpack node api
    config.node = {
      __dirname: true,
      __filename: true,
    };

    processed.add(config);
    return config;
  };
}
