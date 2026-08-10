/**
 * Babel config
 *
 * @type {import('@babel/core').ConfigFunction}
 */
const isProduction = process.env.NODE_ENV === 'production'

module.exports = {
  assumptions: {
    constantReexports: true,
    ignoreFunctionLength: true,
    ignoreToPrimitiveHint: true,
    iterableIsArray: true,
    mutableTemplateObject: true,
    noClassCalls: true,
    noDocumentAll: true,
    objectRestNoSymbols: true,
    privateFieldsAsProperties: true,
    setClassMethods: true,
    setComputedProperties: true,
    setPublicClassFields: true,
    setSpreadProperties: true,
    skipForOfIteratorClosing: true,
    superIsCallableConstructor: true
  },

  presets: [
    [
      '@babel/preset-env',
      {
        shippedProposals: true
      }
    ]
  ],

  plugins: [
    ...(isProduction
      ? [['babel-plugin-polyfill-corejs3', { method: 'usage-global', version: '3.33' }]]
      : []),
    ['@babel/plugin-transform-react-jsx', { runtime: 'classic', pragma: 'h' }]
  ],

  env: {
    test: {
      plugins: ['istanbul']
    }
  }
}
