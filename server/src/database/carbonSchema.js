import db from './db.js';

export function initializeCarbonCreditSystem() {
  // Carbon Credits table
  db.exec(`
    CREATE TABLE IF NOT EXISTS carbon_credits (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      ride_id TEXT,
      amount REAL NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('earned', 'redeemed', 'purchased', 'bonus')),
      source TEXT NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE SET NULL
    );
  `);

  // Achievements/Badges table
  db.exec(`
    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT NOT NULL,
      icon TEXT,
      category TEXT CHECK(category IN ('rides', 'distance', 'co2', 'social', 'special')),
      requirement_type TEXT NOT NULL,
      requirement_value REAL NOT NULL,
      carbon_credit_reward REAL DEFAULT 0,
      tier TEXT DEFAULT 'bronze' CHECK(tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // User Achievements table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_achievements (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      achievement_id TEXT NOT NULL,
      earned_at TEXT DEFAULT CURRENT_TIMESTAMP,
      progress REAL DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
      UNIQUE(user_id, achievement_id)
    );
  `);

  // Rewards/Offers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS rewards (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT CHECK(category IN ('discount', 'merchandise', 'service', 'donation', 'tree_planting')),
      carbon_credit_cost REAL NOT NULL,
      partner_name TEXT,
      partner_logo TEXT,
      discount_percentage INTEGER,
      discount_amount REAL,
      terms TEXT,
      expiry_date TEXT,
      stock_available INTEGER,
      is_active BOOLEAN DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // User Reward Redemptions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS reward_redemptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      reward_id TEXT NOT NULL,
      carbon_credits_spent REAL NOT NULL,
      redemption_code TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'active', 'used', 'expired')),
      redeemed_at TEXT DEFAULT CURRENT_TIMESTAMP,
      used_at TEXT,
      expires_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (reward_id) REFERENCES rewards(id) ON DELETE CASCADE
    );
  `);

  // Carbon Offset Purchases table
  db.exec(`
    CREATE TABLE IF NOT EXISTS carbon_offsets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      amount_kg REAL NOT NULL,
      price_paid REAL NOT NULL,
      carbon_credits_earned REAL NOT NULL,
      offset_type TEXT CHECK(offset_type IN ('tree_planting', 'renewable_energy', 'carbon_capture', 'mixed')),
      certificate_url TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'verified')),
      purchased_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Tree Planting Initiatives table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tree_plantings (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      trees_planted INTEGER NOT NULL,
      location TEXT,
      coordinates TEXT,
      carbon_offset_kg REAL NOT NULL,
      carbon_credits_earned REAL NOT NULL,
      partner_organization TEXT,
      certificate_url TEXT,
      planted_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // Corporate Partnerships table
  db.exec(`
    CREATE TABLE IF NOT EXISTS corporate_partners (
      id TEXT PRIMARY KEY,
      company_name TEXT UNIQUE NOT NULL,
      logo_url TEXT,
      description TEXT,
      website TEXT,
      contact_email TEXT,
      matching_ratio REAL DEFAULT 1.0,
      total_credits_matched REAL DEFAULT 0,
      is_active BOOLEAN DEFAULT 1,
      joined_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Carbon Credit Leaderboard view
  db.exec(`
    CREATE VIEW IF NOT EXISTS carbon_leaderboard AS
    SELECT 
      u.id,
      u.name,
      u.photo,
      SUM(CASE WHEN cc.type = 'earned' THEN cc.amount ELSE 0 END) as total_earned,
      SUM(CASE WHEN cc.type = 'redeemed' THEN cc.amount ELSE 0 END) as total_redeemed,
      (SUM(CASE WHEN cc.type = 'earned' THEN cc.amount ELSE 0 END) - 
       SUM(CASE WHEN cc.type = 'redeemed' THEN cc.amount ELSE 0 END)) as current_balance,
      COUNT(DISTINCT ua.achievement_id) as achievements_count,
      u.total_rides,
      u.co2_saved
    FROM users u
    LEFT JOIN carbon_credits cc ON u.id = cc.user_id
    LEFT JOIN user_achievements ua ON u.id = ua.user_id
    GROUP BY u.id
    ORDER BY current_balance DESC;
  `);

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_carbon_credits_user ON carbon_credits(user_id);
    CREATE INDEX IF NOT EXISTS idx_carbon_credits_type ON carbon_credits(type);
    CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
    CREATE INDEX IF NOT EXISTS idx_reward_redemptions_user ON reward_redemptions(user_id);
    CREATE INDEX IF NOT EXISTS idx_tree_plantings_user ON tree_plantings(user_id);
  `);

  console.log('✅ Carbon Credit System schema initialized');
}

// Seed initial achievements
export function seedAchievements() {
  const achievements = [
    // Ride count achievements
    { id: 'first_ride', name: 'First Journey', description: 'Complete your first ride', icon: '🚗', category: 'rides', type: 'ride_count', value: 1, reward: 10, tier: 'bronze' },
    { id: 'ride_warrior', name: 'Ride Warrior', description: 'Complete 10 rides', icon: '🏃', category: 'rides', type: 'ride_count', value: 10, reward: 50, tier: 'silver' },
    { id: 'veteran_commuter', name: 'Veteran Commuter', description: 'Complete 50 rides', icon: '🎖️', category: 'rides', type: 'ride_count', value: 50, reward: 200, tier: 'gold' },
    { id: 'legend', name: 'Commute Legend', description: 'Complete 100 rides', icon: '👑', category: 'rides', type: 'ride_count', value: 100, reward: 500, tier: 'platinum' },
    
    // Distance achievements
    { id: 'first_100km', name: '100 KM Club', description: 'Travel 100 km', icon: '🛣️', category: 'distance', type: 'total_distance', value: 100, reward: 25, tier: 'bronze' },
    { id: 'distance_master', name: 'Distance Master', description: 'Travel 1000 km', icon: '🌍', category: 'distance', type: 'total_distance', value: 1000, reward: 150, tier: 'silver' },
    { id: 'globe_trotter', name: 'Globe Trotter', description: 'Travel 5000 km', icon: '✈️', category: 'distance', type: 'total_distance', value: 5000, reward: 500, tier: 'gold' },
    
    // CO2 savings achievements
    { id: 'eco_starter', name: 'Eco Starter', description: 'Save 10 kg CO₂', icon: '🌱', category: 'co2', type: 'co2_saved', value: 10, reward: 20, tier: 'bronze' },
    { id: 'eco_warrior', name: 'Eco Warrior', description: 'Save 100 kg CO₂', icon: '🌿', category: 'co2', type: 'co2_saved', value: 100, reward: 100, tier: 'silver' },
    { id: 'climate_hero', name: 'Climate Hero', description: 'Save 500 kg CO₂', icon: '🌳', category: 'co2', type: 'co2_saved', value: 500, reward: 300, tier: 'gold' },
    { id: 'planet_protector', name: 'Planet Protector', description: 'Save 1000 kg CO₂', icon: '🌎', category: 'co2', type: 'co2_saved', value: 1000, reward: 1000, tier: 'platinum' },
    
    // Social achievements
    { id: 'social_butterfly', name: 'Social Butterfly', description: 'Share 5 rides', icon: '🦋', category: 'social', type: 'rides_shared', value: 5, reward: 30, tier: 'bronze' },
    { id: 'community_builder', name: 'Community Builder', description: 'Help 25 passengers', icon: '🤝', category: 'social', type: 'passengers_helped', value: 25, reward: 100, tier: 'silver' },
    
    // Special achievements
    { id: 'early_bird', name: 'Early Bird', description: 'Complete a ride before 7 AM', icon: '🌅', category: 'special', type: 'early_ride', value: 1, reward: 15, tier: 'bronze' },
    { id: 'night_owl', name: 'Night Owl', description: 'Complete a ride after 10 PM', icon: '🦉', category: 'special', type: 'late_ride', value: 1, reward: 15, tier: 'bronze' },
    { id: 'tree_planter', name: 'Tree Planter', description: 'Plant your first tree', icon: '🌲', category: 'special', type: 'trees_planted', value: 1, reward: 50, tier: 'silver' },
    { id: 'carbon_offset_champion', name: 'Offset Champion', description: 'Purchase carbon offsets', icon: '💚', category: 'special', type: 'offsets_purchased', value: 1, reward: 100, tier: 'gold' },
  ];

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO achievements (id, name, description, icon, category, requirement_type, requirement_value, carbon_credit_reward, tier)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  achievements.forEach(a => {
    stmt.run(a.id, a.name, a.description, a.icon, a.category, a.type, a.value, a.reward, a.tier);
  });

  console.log(`✅ Seeded ${achievements.length} achievements`);
}

// Seed sample rewards
export function seedRewards() {
  const rewards = [
    { id: 'reward_1', title: '10% Off Next Ride', description: 'Get 10% discount on your next ride booking', category: 'discount', cost: 50, partner: 'Eco Commute', discount: 10 },
    { id: 'reward_2', title: '25% Off Next Ride', description: 'Get 25% discount on your next ride booking', category: 'discount', cost: 100, partner: 'Eco Commute', discount: 25 },
    { id: 'reward_3', title: 'Free Ride', description: 'Get one completely free ride (up to $20)', category: 'discount', cost: 200, partner: 'Eco Commute', discount: 100 },
    { id: 'reward_4', title: 'Plant 5 Trees', description: 'Plant 5 trees in your name through our partner organizations', category: 'tree_planting', cost: 150, partner: 'TreeNation' },
    { id: 'reward_5', title: 'Plant 10 Trees', description: 'Plant 10 trees and receive a certificate', category: 'tree_planting', cost: 250, partner: 'TreeNation' },
    { id: 'reward_6', title: 'Eco Commute T-Shirt', description: 'Exclusive Eco Commute branded organic cotton t-shirt', category: 'merchandise', cost: 300, partner: 'Eco Commute', stock: 100 },
    { id: 'reward_7', title: '$10 Coffee Shop Voucher', description: 'Enjoy coffee on us at partner cafes', category: 'service', cost: 80, partner: 'Green Bean Cafe', discount: 10 },
    { id: 'reward_8', title: 'Carbon Offset 100kg', description: 'Offset 100kg of carbon through verified projects', category: 'donation', cost: 120, partner: 'Carbon Trust' },
  ];

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO rewards (id, title, description, category, carbon_credit_cost, partner_name, discount_percentage, stock_available)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  rewards.forEach(r => {
    stmt.run(r.id, r.title, r.description, r.category, r.cost, r.partner, r.discount || null, r.stock || null);
  });

  console.log(`✅ Seeded ${rewards.length} rewards`);
}

// Seed corporate partners
export function seedCorporatePartners() {
  const partners = [
    { id: 'partner_1', name: 'TechCorp Inc', description: 'Leading technology company committed to sustainability', matching: 2.0 },
    { id: 'partner_2', name: 'GreenEnergy Ltd', description: 'Renewable energy provider', matching: 1.5 },
    { id: 'partner_3', name: 'EcoBank', description: 'Sustainable banking solutions', matching: 1.5 },
    { id: 'partner_4', name: 'CleanAir Industries', description: 'Environmental solutions company', matching: 2.5 },
  ];

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO corporate_partners (id, company_name, description, matching_ratio)
    VALUES (?, ?, ?, ?)
  `);

  partners.forEach(p => {
    stmt.run(p.id, p.name, p.description, p.matching);
  });

  console.log(`✅ Seeded ${partners.length} corporate partners`);
}
