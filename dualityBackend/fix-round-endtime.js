const mongoose = require('mongoose');

// Hardcoded MongoDB URI - replace with your actual URI
const MONGO_URI = 'mongodb://localhost:27017/coding-contest';

// Connect to MongoDB
mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

const roundSchema = new mongoose.Schema({
    name: String,
    duration: Number,
    status: String,
    startTime: Date,
    endTime: Date,
}, { timestamps: true });

const Round = mongoose.model('Round', roundSchema);

async function fixRoundEndTimes() {
    try {
        // Find all rounds that have startTime and duration but no endTime
        const rounds = await Round.find({
            startTime: { $exists: true, $ne: null },
            duration: { $exists: true, $ne: null },
            $or: [
                { endTime: { $exists: false } },
                { endTime: null }
            ]
        });

        console.log(`Found ${rounds.length} rounds without endTime`);

        for (const round of rounds) {
            // Calculate endTime
            const durationMs = round.duration * 60 * 1000;
            const endTime = new Date(round.startTime.getTime() + durationMs);

            // Update the round
            await Round.updateOne(
                { _id: round._id },
                { $set: { endTime: endTime } }
            );

            console.log(`Fixed round: ${round.name} (${round._id})`);
            console.log(`  Start: ${round.startTime}`);
            console.log(`  Duration: ${round.duration} minutes`);
            console.log(`  End: ${endTime}`);
        }

        console.log('\nAll rounds fixed!');
        process.exit(0);
    } catch (error) {
        console.error('Error fixing rounds:', error);
        process.exit(1);
    }
}

fixRoundEndTimes();
