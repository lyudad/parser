'use strict';

const connection = require('./helpers/connection');
const parser = require('./helpers/parser');
const amqp = require('amqplib/callback_api');
const debug = require('debug')('http');

let url;

let mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/apartment_db', {
  server: {
    socketOptions: {
      socketTimeoutMS: 0,
      connectTimeoutMS: 0
    }
  }
});

amqp.connect('amqp://localhost', function (err, conn) {
  if (conn != undefined) {
    conn.createChannel(function (err, ch) {
      let q = 'links';

      ch.prefetch(1);
      ch.assertQueue(q, {durable: false});

      debug(" [*] Waiting for messages in %s. To exit press CTRL+C", q);
      ch.consume(q, function (msg) {
        console.log(" [x] Received %s", msg.content.toString());
        url = msg.content.toString();

        connection.connect('https://www.propertyfinder.com.lb' + url)
        .then(function (data) {
          debug('in 1');

          if (data != null) {
            return parser.getAllInformations(data);
          } else {
            throw msg;
          }
        })
        .then(function () {
          debug('finish');
          ch.ack(msg);
        })
        .catch(function (msg) {
          debug('error');
          ch.reject(msg, true);
        });

      }, {noAck: false});
    });
  }
});