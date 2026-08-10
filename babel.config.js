/**
 * Babel config
 *
 * @type {import('@babel/core').ConfigFunction}
 */
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
        bugfixes: true,
        corejs: '3.33',
        shippedProposals: true,
        useBuiltIns: 'usage'
      }
    ]
  ],

  plugins: [
    ['@babel/plugin-transform-react-jsx', { pragma: 'h' }]
  ],

  env: {
    test: {
      plugins: ['istanbul']
    }
  }
}
