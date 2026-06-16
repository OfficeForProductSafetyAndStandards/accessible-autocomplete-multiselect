require('dotenv').config()
require('@babel/register')({
  rootMode: 'upward'
})

const { join } = require('path')
const { cwd } = require('process')
const puppeteer = require('puppeteer')

const {
  PORT = 4567,
  SAUCE_ACCESS_KEY,
  SAUCE_BUILD_NUMBER,
  SAUCE_ENABLED,
  SAUCE_USERNAME
} = process.env

/**
 * Browsers for local tests
 *
 * @type {RemoteCapabilities}
 */
const capabilitiesLocal = [
  {
    browserName: 'chrome',
    'goog:chromeOptions': {
      args: ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage']
      // `binary` is set in onPrepare — puppeteer.executablePath() is async in v23+
    }
  }
]

/**
 * Browsers for Sauce Labs tests
 *
 * @type {RemoteCapabilities}
 */
const capabilitiesSauce = [
  {
    browserName: 'chrome',
    browserVersion: 'latest',
    platformName: 'Windows 10',
    'sauce:options': {
      build: SAUCE_BUILD_NUMBER
    }
  },
  {
    browserName: 'firefox',
    browserVersion: '55',
    platformName: 'Windows 10',
    'sauce:options': {
      build: SAUCE_BUILD_NUMBER
    }
  },
  {
    browserName: 'internet explorer',
    browserVersion: 'latest',
    platformName: 'Windows 10',
    'sauce:options': {
      build: SAUCE_BUILD_NUMBER
    }
  }
]

/**
 * WebdriverIO config
 *
 * @type {Testrunner}
 */
exports.config = {
  // Only set user/key when Sauce Labs is enabled
  ...(SAUCE_ENABLED === 'true' && {
    user: SAUCE_USERNAME,
    key: SAUCE_ACCESS_KEY
  }),

  // Always use WebDriver protocol - more stable and compatible
  automationProtocol: 'webdriver',

  baseUrl: `http://localhost:${PORT}`,

  capabilities: SAUCE_ENABLED === 'true'
    ? capabilitiesSauce
    : capabilitiesLocal,

  framework: 'mocha',
  outputDir: join(cwd(), 'logs'),
  reporters: ['spec'],

  /**
   * Resolve the Chrome binary path before workers start.
   * puppeteer.executablePath() returns a Promise in Puppeteer v23+,
   * and a Promise cannot be structured-cloned into the worker.
   */
  onPrepare: async function (config, capabilities) {
    if (SAUCE_ENABLED === 'true') return
    const executablePath = await puppeteer.executablePath()
    for (const cap of capabilities) {
      if (cap['goog:chromeOptions']) {
        cap['goog:chromeOptions'].binary = executablePath
      }
    }
  },

  services: [
    ['static-server', {
      folders: [
        { mount: '/', path: join(cwd(), 'examples') },
        { mount: '/dist/', path: join(cwd(), 'dist') }
      ],
      port: PORT
    }],

    ...(SAUCE_ENABLED === 'true'
      ? [
          ['sauce', {
            sauceConnect: true
          }]
        ]
      : [])
  ],

  specs: [join(cwd(), 'test/integration/**/*.js')],
  waitforTimeout: 30 * 10000
}

/**
 * @typedef {import('@wdio/types').Options.Testrunner} Testrunner
 * @typedef {import('@wdio/types').Capabilities.RemoteCapabilities} RemoteCapabilities
 * @typedef {import('@wdio/static-server-service').StaticServerOptions} StaticServerOptions
 * @typedef {import('@wdio/sauce-service').SauceServiceConfig} SauceServiceConfig
 */
