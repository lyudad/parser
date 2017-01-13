'use strict';

const debug = require('debug')('http');
const cronJob = require('cron').CronJob;
const parser = require('./helpers/parser');
const connection = require('./helpers/connection');
const Bluebird = require('bluebird');

let random;

const job = new cronJob({
  cronTime: '0 41 * * * *',
  onTick: function () {
    debug('getData');
    parser.start();
    connection.connect('https://www.propertyfinder.com.lb/en/buy/properties-for-sale.html?mkwid=s_dc&pcrid=140762627998&pkw=real%20estate%20brokers%20in%20lebanon&pmt=e&gclid=Cj0KEQiA39_BBRD0w-_rmOrc__8BEiQA-ETxXSoQXrrWKWxSjN9H4RNr9aU7lcEbM0gQHhYLbOCOw-YaAvDl8P8HAQ')
    .then(function (data) {
      debug('finish first page connection');

      if (data != null) {
        parser.getAllLinks(data);
        return parser.countNextLinks(data);
      } else {
        throw 'error';
      }
    })
    .then(function (nextLinks) {
      if (nextLinks != null) {
        connection.connectPaginator('https://www.propertyfinder.com.lb/en/buy/properties-for-sale.html?mkwid=s_dc&pcrid=140762627998&pkw=real%20estate%20brokers%20in%20lebanon&pmt=e&gclid=Cj0KEQiA39_BBRD0w-_rmOrc__8BEiQA-ETxXSoQXrrWKWxSjN9H4RNr9aU7lcEbM0gQHhYLbOCOw-YaAvDl8P8HAQ&page=', 10)//Number(nextLinks) / 25)
        .then(function () {
          debug('finish paginator');
        });
      } else {
        debug('nextLinks is null')
      }
    })
    .catch(function (e) {
      debug(e);
    });

  },
  start: true
});

job.start();
