const puppeteer = require('puppeteer');
const dodig = require('domain-digger');
const url = require('url');
const geoip = require('geo-from-ip');

let knowIPs = {};
let browser;

async function getTraceRoute(opts) {
  if (browser) {
    await browser.close();
  }
  browser = await puppeteer.launch({headless: true, slowMo: 0, args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox']});
  const page = await browser.newPage();

  const devToolsResponses = new Map();
  // Connect to Chrome DevTools
  const client = await page.target().createCDPSession()
  await client.send("Network.enable");

  client.on('Network.requestWillBeSent', (event) => {
    // console.log(event.requestId, event.initiator);
  })
  client.on("Network.responseReceived", event => {
    devToolsResponses.set(event.requestId, event.response);
  });

  page.on('request', async event => {
    opts.onRequest({url: await event.url(), type: await event.resourceType()})
  })
  client.on("Network.loadingFinished", event => {
    if (!devToolsResponses.has(event.requestId)) {
      return
    }
    const response = devToolsResponses.get(event.requestId);
    if (!response.headers['content-length']) {
      return;
    }
    const encodedBodyLength = event.encodedDataLength //- response.headers['content-length'];
    // console.log(`${encodedBodyLength} bytes for ${response.url}`);
    opts.onRequestEnd({url: response.url, type: response.mimeType, length: encodedBodyLength})
  });

  // Set throttling property
  await client.send('Network.emulateNetworkConditions', {
    'offline': false,
    'downloadThroughput': 2000 * 1024 / 8,
    'uploadThroughput': 2000 * 1024 / 8,
    'latency': 200
  })
  const knownHosts = new Map();
  await Promise.all([
    page.coverage.startJSCoverage({
        reportAnonymousScripts: true
    }),
    // page.coverage.startCSSCoverage()
  ]);
  function getTraceURL(uri) {
    const myURL = url.parse(uri)
    if (knownHosts.has(myURL.hostname)) {
      if (opts.onTrace) {
        opts.onTrace(knownHosts.get(myURL.hostname))
      }
      return;
    }    
    dodig.traceroute(myURL.hostname).then(function(data) {
      const trace = [];
      for (let hop of data) {
        let ip = hop.ipAddress
        if (ip == null) {
          continue
        }
        if (ip[0] == '.') {
          ip = hop.host.substring(1, hop.host.length - 1)
        }
        if (!knowIPs[ip]) {
          try {
            knowIPs[ip] = geoip.allData(ip)
          } catch (error) {
              console.log(error)
          }
        }
        if (knowIPs[ip]) { 
          hop.geoip = knowIPs[ip]
          trace.push(hop)
        }
      }
      knownHosts.set(myURL.hostname, {url: uri, trace});
      if (opts.onTrace) {
        opts.onTrace({url: uri, trace})
      }
    })
  }
  await page.setViewport({ width: 1500, height: 1280});
  await page.setCacheEnabled(false);
  page.on('requestfinished', (e) => {
      getTraceURL(e.url());
  });
  async function capture() {
    try {
      const screen = await page.screenshot({type: 'jpeg', quality: 60, encoding: 'base64'});
      opts.onScreenshot(screen);
      capture();
    } catch (error) {
      console.log(error)
    }
  }
  capture();
  await page.tracing.start();
  // Navigate to page
  await page.goto(opts.url);
  console.log(await page.metrics())
  opts.onProfile(JSON.parse((await page.tracing.stop()).toString('utf8')).traceEvents.filter(action => action.args.data && action.args.data.cpuProfile && action.args.data.cpuProfile.nodes));
  const [jsCoverage] = await Promise.all([
    page.coverage.stopJSCoverage(),
    // page.coverage.stopCSSCoverage(),
  ]);
  
  const coverage = [...jsCoverage];
  opts.onCoverage(coverage)
};

module.exports.getTraceRoute = getTraceRoute;