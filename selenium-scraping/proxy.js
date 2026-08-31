const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

async function createDriver(proxyServer) {
  const options = new chrome.Options();
  
  // Basic proxy (no auth)
  options.addArguments(`--proxy-server=${proxyServer}`); // e.g. "http://12.34.56.78:8080"

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  return driver;
}