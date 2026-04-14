const { initDB } = require('./script-db');

async function check() {
    try {
        const { mode, connection, models } = await initDB();
        const Question = models.Question;

        console.log(`Checking questions in [${mode.toUpperCase()}] platform...`);
        const count = await Question.countDocuments();
        console.log(`Total questions found: ${count}`);

        const questions = await Question.find();
        questions.forEach((q, i) => {
            console.log(`${i+1}. ${q.title} (Category: ${q.category}, Difficulty: ${q.difficulty})`);
        });

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        process.exit(0);
    }
}

check();
