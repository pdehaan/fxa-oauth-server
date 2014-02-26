/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const url = require('url');

const assert = require('insist');

const db = require('../lib/db');
const Server = require('./lib/server');
const uid = require('../lib/uid');

/*global describe,it,before*/
/*jshint camelcase: false*/

describe('/oauth', function() {

  var client;
  before(function(done) {
    db.registerClient({
      name: 'Mocha',
      redirectUri: 'https://example.domain/return?foo=bar',
      whitelisted: true
    }).then(function(c) {
      client = c;
    }).done(done);
  });

  describe('/authorization', function() {

    describe('?client_id', function() {

      it('is required', function(done) {
        Server.get({
          url: '/oauth/authorization?precode=foo'
        }).then(function(res) {
          assert.equal(res.statusCode, 400);
        }).done(done);
      });

      it('succeeds if passed', function(done) {
        Server.get({
          url: '/oauth/authorization?precode=foo&client_id=' + client.uid
        }).then(function(res) {
          assert.equal(res.statusCode, 302);
        }).done(done);
      });

    });

    describe('?precode', function() {

      it('is required', function(done) {
        Server.get({
          url: '/oauth/authorization?client_id=' + client.uid
        }).then(function(res) {
          assert.equal(res.statusCode, 400);
        }).done(done);
      });

      it('succeeds if passed', function(done) {
        Server.get({
          url: '/oauth/authorization?precode=foo&client_id=' + client.uid
        }).then(function(res) {
          assert.equal(res.statusCode, 302);
        }).done(done);
      });

    });

    describe('?redirect_uri', function() {
      it('is optional', function(done) {
        Server.get({
          url: '/oauth/authorization?precode=foo&client_id='
            + client.uid + '&redirect_uri=' + client.redirectUri
        }).then(function(res) {
          assert.equal(res.statusCode, 302);
        }).done(done);
      });

      it('must be same as registered redirect', function(done) {
        Server.get({
          url: '/oauth/authorization?precode=foo&client_id='
            + client.uid + '&redirect_uri=http://derp.herp'
        }).then(function(res) {
          assert.equal(res.statusCode, 400);
        }).done(done);
      });
    });

    describe('?state', function() {
      it('is returned if passed', function(done) {
        Server.get({
          url: '/oauth/authorization?state=1&precode=foo&client_id='
            + client.uid
        }).then(function(res) {
          assert.equal(res.statusCode, 302);
          assert.equal(url.parse(res.headers.location, true).query.state, 1);
        }).done(done);
      });
    });

    describe('?scope', function() {
      it('is optional', function(done) {
        Server.get({
          url: '/oauth/authorization?scope=1&precode=foo&client_id='
            + client.uid
        }).then(function(res) {
          assert.equal(res.statusCode, 302);
        }).done(done);
      });
    });

    describe('response', function() {
      describe('with a whitelisted client', function() {
        it('should redirect to the redirect_uri', function(done) {
          Server.get({
            url: '/oauth/authorization?precode=foo&client_id=' +
              client.uid + '&redirect_uri=' + client.redirectUri
          }).then(function(res) {
            assert.equal(res.statusCode, 302);
            var loc = url.parse(res.headers.location, true);
            var expected = url.parse(client.redirectUri, true);
            assert.equal(loc.protocol, expected.protocol);
            assert.equal(loc.host, expected.host);
            assert.equal(loc.pathname, expected.pathname);
            assert.equal(loc.query.foo, expected.query.foo);
            assert(loc.query.code);
          }).done(done);
        });
      });
    });

  });

  // TODO: needed when we have external clients. whitelisted don't need this
  //describe('/decision');

  describe('/token', function() {

    it('disallows GET', function(done) {
      Server.get('/oauth/token').then(function(res) {
        assert.equal(res.statusCode, 404);
      }).done(done);
    });

    describe('?client_id', function() {
      it('is required', function(done) {
        Server.post({
          url: '/oauth/token',
          payload: {
            client_secret: client.secret,
            code: uid.code()
          }
        }).then(function(res) {
          assert.equal(res.statusCode, 400);
        }).done(done);
      });
    });

    describe('?client_secret', function() {
      it('is required', function(done) {
        Server.post({
          url: '/oauth/token',
          payload: {
            client_id: client.uid,
            code: uid.code()
          }
        }).then(function(res) {
          assert.equal(res.statusCode, 400);
        }).done(done);
      });

      it('must match server-stored secret', function(done) {
        Server.post({
          url: '/oauth/token',
          payload: {
            client_id: client.uid,
            client_secret: uid.secret(),
            code: uid.code()
          }
        }).then(function(res) {
          assert.equal(res.statusCode, 400);
        }).done(done);
      });
    });

    describe('?code', function() {
      it('is required', function(done) {
        Server.post({
          url: '/oauth/token',
          payload: {
            client_id: client.uid,
            client_secret: client.secret
          }
        }).then(function(res) {
          assert.equal(res.statusCode, 400);
        }).done(done);
      });
    });

    describe('response', function() {
      it('should return a correct response', function(done) {
        Server.get({
          url: '/oauth/authorization?precode=foo&client_id=' + client.uid
        }).then(function(res) {
          assert.equal(res.statusCode, 302);
          return Server.post({
            url: '/oauth/token',
            payload: {
              client_id: client.uid,
              client_secret: client.secret,
              code: url.parse(res.headers.location, true).query.code
            }
          });
        }).then(function(res) {
          assert.equal(res.statusCode, 200);
          assert.equal(res.result.token_type, 'bearer');
          assert(res.result.access_token);
          assert.equal(res.result.access_token.length, 64);
          assert.deepEqual(res.result.scopes, []);
        }).done(done);
      });
    });
  });

});
