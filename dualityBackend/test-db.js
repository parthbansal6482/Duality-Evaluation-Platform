const mongoose = require('mongoose');
require('dotenv').config({path: '.env'});
async function run() {
  await mongoose.connect(process.env.MONGODB_PRACTICE_URI);
  const Model = mongoose.model('DualityQuestion', new mongoose.Schema({}, {strict: false}));
  const doc = await Model.findOne({title: 'LeetCode Style Two Sum Demo'});
  console.log(JSON.stringify(doc, null, 2));
  process.exit(0);
}
run();
