import { initializeDatabase } from './db.js';
import { initializeCarbonCreditSystem, seedAchievements, seedRewards, seedCorporatePartners } from './carbonSchema.js';
import { initializeAdvancedFeatures, seedChallenges } from './advancedSchema.js';
import { seedTestDrivers, seedSampleRides } from './seedTestDrivers.js';

console.log('🔧 Initializing database...\n');

try {
  console.log('📊 Creating core tables...');
  initializeDatabase();
  
  console.log('🌱 Creating carbon credit system...');
  initializeCarbonCreditSystem();
  seedAchievements();
  seedRewards();
  seedCorporatePartners();
  
  console.log('💬 Creating advanced features...');
  initializeAdvancedFeatures();
  seedChallenges();
  
  console.log('👥 Seeding test data for prototype...');
  await seedTestDrivers();
  await seedSampleRides();
  
  console.log('\n✅ Database initialization complete!');
  console.log('📦 Total tables created: 30+');
  console.log('👤 Test drivers created: 5');
  console.log('🚗 Sample rides created: 4');
  console.log('🚀 You can now start the server with: npm start or npm run dev');
} catch (error) {
  console.error('\n❌ Database initialization failed:', error);
  process.exit(1);
}
