const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  const q = await mongoose.model('Question', new mongoose.Schema({}, {strict: false})).findOne({title: 'LeetCode Style Two Sum Demo'});
  console.log('EXTENDED:', q);
  
  await mongoose.disconnect();
  
  await mongoose.connect(process.env.MONGODB_PRACTICE_URI);
  const dq = await mongoose.model('DualityQuestion', new mongoose.Schema({}, {strict: false})).findOne({title: 'LeetCode Style Two Sum Demo'});
  console.log('EVALHUB:', dq);
  
  await mongoose.disconnect();
}
test();
