'use strict';

const fs = require('fs');
const babel = require('rollup-plugin-babel');
const { name, version } = require('./package.json');

const banner = `/*
 * engine262 ${version}
 *
 * ${fs.readFileSync('./LICENSE', 'utf8').trim().split('\n').join('\n * ')}
 */
`;

module.exports = () => ({
  external: ['acorn', 'nearley'],
  input: './src/api.mjs',
  plugins: [
    babel({
      exclude: 'node_modules/**',
      plugins: [
        '@babel/plugin-syntax-bigint',
        './transform.js',
      ],
    }),
  ],
  output: [
    {
      file: 'dist/engine262.js',
      format: 'umd',
      sourcemap: true,
      name,
      banner,
    },
    {
      file: 'dist/engine262.mjs',
      format: 'es',
      sourcemap: true,
      banner,
    },
  ],
  onwarn(warning, warn) {
    if (warning.code === 'CIRCULAR_DEPENDENCY') {
      // Squelch.
      return;
    }
    warn(warning);
  },
});
