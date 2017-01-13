'use strict';

const debug = require('debug')('http');
const cheerio = require('cheerio');
const amqp = require('amqplib/callback_api');
const Propertyfinder = require('./../models/propertyfinder');

let amqpConn = null;

module.exports.start = function start() {
  amqp.connect('amqp://localhost', function (err, conn) {
    if (err) {
      console.error("[AMQP]", err.message);
      return setTimeout(start, 1000);
    }
    conn.on("error", function (err) {
      if (err.message !== "Connection closing") {
        console.error("[AMQP] conn error", err.message);
      }
    });
    conn.on("close", function () {
      console.error("[AMQP] reconnecting");
      return setTimeout(start, 1000);
    });
    console.log("[AMQP] connected");
    amqpConn = conn;
  });
}

module.exports.getAllLinks = function getAllLinks(text) {

  let $ = cheerio.load(text);

  amqpConn.createChannel(function (err, ch) {
    if (err) {
      debug('err', err);
      return;
    }
    let q = 'links';

    ch.assertQueue(q, {durable: false});
    debug('links');
    $('.listing-content h2').each(function (index) {
      let href = $(this).find('a').attr('href');
      ch.sendToQueue(q, new Buffer(href));
    });
  });


};

module.exports.countNextLinks = function countNextLinks(text) {
  let $ = cheerio.load(text);
  let pages = $('.list-count').text().match(/\d+\,\d+/);

  if (pages != null) {
    return pages[0].replace(",", "");
  }
  return null;

};

module.exports.getAllInformations = function getAllInformations(text) {
  let $ = cheerio.load(text);
  let data = {};

  data.page_id = $('#content div:nth-child(1)').attr('data-userbox-id');
  data.city = $('#breadcrumbs span:nth-child(3) a').text();
  data.type = $('.fixed-table tr:nth-child(2) td:nth-child(2)').text();
  data.price = $('.fixed-table tr:nth-child(1) td:nth-child(2)').text();
  data.price_sqm = $('.fixed-table tr:nth-child(7) td:nth-child(2)').text();
  data.size = $('.fixed-table tr:nth-child(6) td:nth-child(2)').text();
  data.bedrooms = $('.fixed-table tr:nth-child(4) td:nth-child(2)').text();
  data.bathrooms = $('.fixed-table tr:nth-child(5) td:nth-child(2)').text();
  data.country = $('#breadcrumbs span:nth-child(2) a').text();

  console.log('parser');

  Propertyfinder.findOne({page_id: data.page_id}, function (err, pageData) {
    console.log('pageData', pageData);
    if (pageData == null) {
      let newPropertyfinder = Propertyfinder(data);
      newPropertyfinder.save();
    }
    return true;
  });
};

