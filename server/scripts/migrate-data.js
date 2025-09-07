import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from '../config/database.js';
import Exercise from '../models/Exercise.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrateData() {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('📡 Connected to MongoDB');

    // Read the JSON file
    const jsonPath = path.join(__dirname, '../../public/questions.json');
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log('📖 JSON data loaded');

    // Clear existing data
    await Exercise.deleteMany({});
    console.log('🗑️  Cleared existing exercises');

    let totalInserted = 0;

    // Process each category
    for (const [category, exercises] of Object.entries(jsonData)) {
      console.log(`\n📝 Processing ${category} exercises...`);

      for (const exercise of exercises) {
        let exerciseData = {
          category,
          isActive: true
        };

        if (category === 'clozetext') {
          // Handle clozetext format (single question)
          exerciseData = {
            ...exerciseData,
            id: `clozetext-${exercise.id}`,
            question: exercise.question,
            options: exercise.options,
            correct: exercise.correct,
            image: exercise.image
          };
        } else {
          // Handle reading and listening format (multiple questions)
          exerciseData = {
            ...exerciseData,
            id: exercise.id,
            title: exercise.title,
            questions: exercise.questions.map(q => ({
              ...q,
              type: q.type || 'multiple-choice'
            }))
          };

          if (category === 'reading') {
            exerciseData.passage = exercise.passage;
          } else if (category === 'listening') {
            exerciseData.audioUrl = exercise.audioUrl;
            exerciseData.transcript = exercise.transcript;
          }
        }

        try {
          const newExercise = new Exercise(exerciseData);
          await newExercise.save();
          console.log(`✅ Inserted: ${exerciseData.id}`);
          totalInserted++;
        } catch (error) {
          console.error(`❌ Error inserting ${exerciseData.id}:`, error.message);
        }
      }
    }

    console.log(`\n🎉 Migration completed! Total exercises inserted: ${totalInserted}`);
    
    // Display summary
    const summary = await Exercise.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('\n📊 Summary:');
    summary.forEach(item => {
      console.log(`${item._id}: ${item.count} exercises`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateData();
