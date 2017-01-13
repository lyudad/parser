const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// create a schema
const personSchema = new Schema({
  page_id: {type: String, required: true},
  city: String,
  type: String,
  price: String,
  price_sqm: String,
  area: String,
  bedrooms: String,
  bathrooms: String,
  country: String
});

module.exports = mongoose.model('Propertyfinder', personSchema);
