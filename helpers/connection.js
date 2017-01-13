'use strict';

const debug = require('debug')('http');
const Bluebird = require('bluebird');
const Crawler = require("crawler");
const url = require('url');
const parser = require('./parser');
const pingProxy = require('ping-proxy');

const proxy = ['35.185.8.144',
  '104.199.121.181',
  '37.72.185.43',
  '70.248.28.23',
  '178.161.149.18',
  '104.199.117.203',
  '97.77.104.22',
  '45.76.137.216',
  '196.29.197.12',
  '163.121.188.2',
  '134.17.187.150',
  '185.28.193.95',
  '200.68.27.100',
  '14.177.245.143'
];

const proxyPorts = [
  80,
  80,
  1080,
  800,
  3128,
  80,
  3128,
  3128,
  80,
  8080,
  8080,
  8080,
  3128,
  4008
];

let random, randomPrev;

module.exports.connect = function connect(url) {
  return new Bluebird(function (resolve, reject) {

    random = Math.floor(Math.random() * proxy.length);
    randomPrev = random;

    debug('random', random);

    let c = new Crawler({
      maxConnections: 1,
      rateLimit: 3000,
      retries: 1,
      callback: function (error, res, done) {
        if (error) {
          debug('connectionError', error);
          while (randomPrev == random) {
            random = Math.floor(Math.random() * proxy.length);
            debug('randomeNewCircle', random);
          }
          randomPrev = random;
          debug('try again1');
          c.queue({
            uri: url,
            proxy: 'http://' + proxy[random] + ":" + proxyPorts[random],
          });
        } else {
          let $ = res.$;
          debug('connect result');
          resolve(res.body);
        }
        done();
      }
    });

    c.queue({
      uri: url,
      proxy: 'http://' + proxy[random] + ":" + proxyPorts[random],
    });

  });

};

module.exports.connectPaginator = function connectPaginator(url, count) {
  return new Bluebird(function (resolve, reject) {
    debug('connect fiest time');
    let c = new Crawler({
      maxConnections: 4,
      rateLimit: 3000,
      retries: 1,
      callback: function (error, res, done) {
        if (error) {
          debug('res.options.uri', res.options.uri);
          while (randomPrev == random) {
            random = Math.floor(Math.random() * proxy.length);
            debug('randomeNewCircle2', random);
          }
          randomPrev = random;
          debug('try again3');
          c.queue({
            uri: res.options.uri,
            proxy: 'http://' + proxy[random] + ":" + proxyPorts[random],
            limiter: "key" + proxyPorts[random],
          });
        } else if (res.body != null) {
          debug('god for parsing res');
          parser.getAllLinks(res.body);
        }

        done();
      }
    });


    for (let i = 2; i <= count; i++) {
      while (randomPrev == random) {
        random = Math.floor(Math.random() * proxy.length);
      }
      randomPrev = random;
      debug('random', random);

      c.queue({
        uri: url + i,
        proxy: 'http://' + proxy[random] + ":" + proxyPorts[random],
        limiter: "key" + i,
      });
    }

    c.on('drain', function () {
      debug('drain');
      resolve(true);
    });
  });
};

