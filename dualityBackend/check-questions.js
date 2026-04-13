require('dotenv').config();
const mongoose = require('mongoose');
const Question = require('./src/models/Question');

async function checkQuestions() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('Connected to MongoDB\n');

        const questions = await Question.find().sort({ title: 1 });

        for (const q of questions) {
            console.log('='.repeat(60));
            console.log(`Title: ${q.title}`);
            console.log(`ID: ${q._id}`);
            console.log(`Difficulty: ${q.difficulty}`);
            console.log('\nExamples:');
            q.examples.forEach((ex, i) => {
                console.log(`  Example ${i + 1}:`);
                console.log(`    Input: ${JSON.stringify(ex.input)}`);
                console.log(`    Output: ${JSON.stringify(ex.output)}`);
            });
            console.log();
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkQuestions();
