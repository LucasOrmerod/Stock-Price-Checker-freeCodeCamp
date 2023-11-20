'use strict';

const fetch = require("node-fetch");
const mongoose = require("mongoose");
const crypto = require("crypto");

// Hashing function
function hash(input) {
  const hash = crypto.createHash("sha-256");
  hash.update(input);
  return hash.digest("hex");
};

// Database logic
const database = process.env['DB'];

mongoose.connect(database);

const stockSchema = new mongoose.Schema({
  symbol: { type: String, required: true },
  likes: {
    type: [String],
    validate: {
      validator: function(arr) {
        return arr.length == new Set(arr).size;
      },
      message: "Array must contain only unique strings."
    }
  }
});

const StockModel = mongoose.model("Stock", stockSchema);

// Function that saves a new stock in the database
async function addStock(stockName, addLike, ip) {
  let returnValue = false;
  let newStock;
  if (addLike) {
    newStock = new StockModel({
      symbol: stockName,
      likes: [hash(ip)] // Include the IP if addLike is true
    });
  } else {
    newStock = new StockModel({
      symbol: stockName,
      likes: [] // Do not include the IP if addLike is false
    });
  };

  await newStock.save()
    .then((saved) => {
      returnValue = saved.likes.length; // Return the number of likes
    })
    .catch((err) => {
      console.error(err);
      // returnValue remains false if there was an error
    });
  return returnValue;
};

// Function that looks for a symbol, does not add like, and returns the number of likes
async function findStock(stockName) {
  let returnValue = false;
  await StockModel.findOne({ symbol: stockName })
    .then((found) => {
      // Return the number of likes if the stock is in the database, else return false
      if (found) {
        returnValue = found.likes.length; // Return the number of likes
      };
      // returnValue remains false if the stock was not in the database
    })
    .catch((err) => {
      console.error(err);
      // returnValue remains false if there was an error
    });
  return returnValue;
};

// Function that looks for a symbol, adds like, and returns the new number of likes
async function findStockAndAddLike(stockName, ip) {
  let returnValue = false;
  await StockModel.findOneAndUpdate({ symbol: stockName }, { $addToSet: { likes: hash(ip) } })
    .then((updated) => {
      // Return the number of likes if the stock is in the database, else return false
      if (updated) {
        returnValue = updated.likes.length; // Return the old number of likes (new like will be added later)
      };
      // returnValue remains false if the database was not updated
    })
    .catch((err) => {
      console.error(err);
      // returnValue remains false if there was an error
    });
  return returnValue;
};

// Function to get results from the API
async function sendAPIRequest(stockName) {
  const res = await fetch(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stockName}/quote`);

  const { symbol, latestPrice } = await res.json();

  return {
    stock: symbol,
    price: latestPrice
  };
};

async function getStockData(stock, like, ip) {
  let stockData = await sendAPIRequest(stock); // Get the data from the API
  stockData.likes = 0;

  let result = "";
  if (like) {
    result = await findStockAndAddLike(stock, ip);
  } else {
    result = await findStock(stock);
  };

  // Add the stock to the database if needed
  if (Number.isInteger(result)) { // Will be an integer if it can access the likes property
    like ? stockData.likes = await findStock(stock) : null; // Confirm the number of likes if needed
    return stockData;
  } else {
    addStock(stock, like, ip);
    like ? stockData.likes = await findStock(stock) : null; // Confirm the number of likes if needed
    return stockData;
  };
};

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(async function (req, res){
      let { stock, like } = req.query // Get the data from the query
      typeof like === "undefined" ? like = false : null;
      like = JSON.parse(like);

      let stock1;
      let stock2;

      if (Array.isArray(stock)) {
        // Use 2 stocks if stock is an array
        stock1 = await getStockData(stock[0], like, req.ip);
        stock2 = await getStockData(stock[1], like, req.ip);

        const avgLikes = (stock1.likes + stock2.likes) / 2;

        let stock1Difference = avgLikes - stock1.likes;
        let stock2Difference = avgLikes - stock2.likes;

        delete stock1.likes;
        delete stock2.likes;

        stock1.rel_likes = stock1Difference;
        stock2.rel_likes = stock2Difference;

        return res.json({ "stockData": [stock1, stock2] });
      } else {
        return res.json({ "stockData": await getStockData(stock, like, req.ip) });
      }
    });
};
