const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

let firstLikes = 0;

suite('Functional Tests', function() {

  test("Viewing one stock", function(done) {
    chai.request(server)
      .keepOpen()
      .get("/api/stock-prices/")
      .query({ stock: "GOOG" })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.typeOf(res.body.stockData, "object");
        assert.equal(res.body.stockData.stock, "GOOG");
        assert.typeOf(res.body.stockData.stock, "string");
        assert.typeOf(res.body.stockData.price, "number");
        assert.typeOf(res.body.stockData.likes, "number");
        done();
      });
  });

  test("Viewing one stock and liking it", function(done) {
    chai.request(server)
      .keepOpen()
      .get("/api/stock-prices/")
      .query({ stock: "GOOG", like: true })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.typeOf(res.body.stockData, "object");
        assert.equal(res.body.stockData.stock, "GOOG");
        assert.typeOf(res.body.stockData.stock, "string");
        assert.typeOf(res.body.stockData.price, "number");
        assert.typeOf(res.body.stockData.likes, "number");
        firstLikes = res.body.stockData.likes;
        done();
      });
  });

  test("Viewing the same stock and liking it again", function(done) {
    chai.request(server)
      .keepOpen()
      .get("/api/stock-prices/")
      .query({ stock: "GOOG", like: true })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.typeOf(res.body.stockData, "object");
        assert.equal(res.body.stockData.stock, "GOOG");
        assert.typeOf(res.body.stockData.stock, "string");
        assert.typeOf(res.body.stockData.price, "number");
        assert.typeOf(res.body.stockData.likes, "number");
        assert.equal(res.body.stockData.likes, firstLikes);
        done();
      });
  });

  test("Viewing two stocks", function(done) {
    chai.request(server)
      .keepOpen()
      .get("/api/stock-prices/")
      .query({ stock: ["GOOG", "MSFT"] })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.typeOf(res.body.stockData, "array");
        assert.typeOf(res.body.stockData[0], "object",);
        assert.typeOf(res.body.stockData[1], "object");
        assert.equal(res.body.stockData[0].stock, "GOOG");
        assert.typeOf(res.body.stockData[0].stock, "string");
        assert.equal(res.body.stockData[1].stock, "MSFT");
        assert.typeOf(res.body.stockData[1].stock, "string");
        assert.typeOf(res.body.stockData[0].price, "number");
        assert.typeOf(res.body.stockData[1].price, "number");
        assert.typeOf(res.body.stockData[0].rel_likes, "number");
        assert.typeOf(res.body.stockData[1].rel_likes, "number");
        done();
      });
  });

    test("Viewing two stocks and liking them", function(done) {
      chai.request(server)
        .keepOpen()
        .get("/api/stock-prices/")
        .query({ stock: ["GOOG", "MSFT"], like: true })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.typeOf(res.body.stockData, "array");
          assert.typeOf(res.body.stockData[0], "object",);
          assert.typeOf(res.body.stockData[1], "object");
          assert.equal(res.body.stockData[0].stock, "GOOG");
          assert.typeOf(res.body.stockData[0].stock, "string");
          assert.equal(res.body.stockData[1].stock, "MSFT");
          assert.typeOf(res.body.stockData[1].stock, "string");
          assert.typeOf(res.body.stockData[0].price, "number");
          assert.typeOf(res.body.stockData[1].price, "number");
          assert.typeOf(res.body.stockData[0].rel_likes, "number");
          assert.typeOf(res.body.stockData[1].rel_likes, "number");
          done();
        });
    });

});
