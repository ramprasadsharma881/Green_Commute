import db from './db.js';

export function initializeAdvancedFeatures() {
  // Chat messages table
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      recipient_id TEXT NOT NULL,
      message TEXT NOT NULL,
      message_type TEXT DEFAULT 'text' CHECK(message_type IN ('text', 'location', 'quick_message', 'system')),
      is_read BOOLEAN DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Conversations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      ride_id TEXT,
      participant1_id TEXT NOT NULL,
      participant2_id TEXT NOT NULL,
      last_message TEXT,
      last_message_at TEXT DEFAULT CURRENT_TIMESTAMP,
      unread_count_p1 INTEGER DEFAULT 0,
      unread_count_p2 INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE SET NULL,
      FOREIGN KEY (participant1_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (participant2_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Push notification subscriptions
  db.exec(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      is_active BOOLEAN DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Notification preferences
  db.exec(`
    CREATE TABLE IF NOT EXISTS notification_preferences (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      booking_confirmed BOOLEAN DEFAULT 1,
      driver_arrived BOOLEAN DEFAULT 1,
      ride_starting BOOLEAN DEFAULT 1,
      location_updates BOOLEAN DEFAULT 1,
      payment_received BOOLEAN DEFAULT 1,
      new_matches BOOLEAN DEFAULT 1,
      chat_messages BOOLEAN DEFAULT 1,
      promotions BOOLEAN DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Notification log
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      data TEXT,
      is_read BOOLEAN DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Ratings and reviews
  db.exec(`
    CREATE TABLE IF NOT EXISTS ratings (
      id TEXT PRIMARY KEY,
      ride_id TEXT NOT NULL,
      reviewer_id TEXT NOT NULL,
      reviewee_id TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      review_text TEXT,
      review_type TEXT NOT NULL CHECK(review_type IN ('driver_to_passenger', 'passenger_to_driver')),
      is_anonymous BOOLEAN DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE,
      FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(ride_id, reviewer_id, reviewee_id)
    );
  `);

  // Safety reports
  db.exec(`
    CREATE TABLE IF NOT EXISTS safety_reports (
      id TEXT PRIMARY KEY,
      ride_id TEXT,
      reporter_id TEXT NOT NULL,
      reported_user_id TEXT NOT NULL,
      report_type TEXT NOT NULL CHECK(report_type IN ('safety', 'harassment', 'no_show', 'other')),
      description TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'under_review', 'resolved', 'dismissed')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE SET NULL,
      FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Favorite routes
  db.exec(`
    CREATE TABLE IF NOT EXISTS favorite_routes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      source TEXT NOT NULL,
      destination TEXT NOT NULL,
      waypoints TEXT,
      preferences TEXT,
      use_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Recurring rides
  db.exec(`
    CREATE TABLE IF NOT EXISTS recurring_rides (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      route_id TEXT,
      source TEXT NOT NULL,
      destination TEXT NOT NULL,
      recurrence_pattern TEXT NOT NULL CHECK(recurrence_pattern IN ('daily', 'weekdays', 'weekends', 'weekly', 'custom')),
      days_of_week TEXT,
      time TEXT NOT NULL,
      available_seats INTEGER,
      price_per_seat REAL,
      vehicle_model TEXT,
      vehicle_color TEXT,
      is_active BOOLEAN DEFAULT 1,
      start_date TEXT DEFAULT CURRENT_TIMESTAMP,
      end_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (route_id) REFERENCES favorite_routes(id) ON DELETE SET NULL
    );
  `);

  // Referrals
  db.exec(`
    CREATE TABLE IF NOT EXISTS referrals (
      id TEXT PRIMARY KEY,
      referrer_id TEXT NOT NULL,
      referred_user_id TEXT,
      referral_code TEXT UNIQUE NOT NULL,
      referred_email TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'expired')),
      reward_earned REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT,
      FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (referred_user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // Social shares
  db.exec(`
    CREATE TABLE IF NOT EXISTS social_shares (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      ride_id TEXT,
      platform TEXT NOT NULL CHECK(platform IN ('facebook', 'twitter', 'linkedin', 'whatsapp', 'instagram')),
      share_type TEXT NOT NULL CHECK(share_type IN ('ride', 'achievement', 'impact', 'referral')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE SET NULL
    );
  `);

  // Community challenges
  db.exec(`
    CREATE TABLE IF NOT EXISTS challenges (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      challenge_type TEXT NOT NULL CHECK(challenge_type IN ('rides', 'distance', 'co2', 'social')),
      target_value REAL NOT NULL,
      reward_credits REAL DEFAULT 0,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      is_active BOOLEAN DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // User challenge progress
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_challenges (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      challenge_id TEXT NOT NULL,
      progress REAL DEFAULT 0,
      is_completed BOOLEAN DEFAULT 0,
      completed_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,
      UNIQUE(user_id, challenge_id)
    );
  `);

  // Friend connections
  db.exec(`
    CREATE TABLE IF NOT EXISTS friendships (
      id TEXT PRIMARY KEY,
      user1_id TEXT NOT NULL,
      user2_id TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'blocked')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user1_id, user2_id)
    );
  `);

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations(participant1_id, participant2_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_ratings_reviewee ON ratings(reviewee_id);
    CREATE INDEX IF NOT EXISTS idx_favorite_routes_user ON favorite_routes(user_id);
    CREATE INDEX IF NOT EXISTS idx_recurring_rides_user ON recurring_rides(user_id);
    CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
    CREATE INDEX IF NOT EXISTS idx_challenges_active ON challenges(is_active);
  `);

  console.log('✅ Advanced features schema initialized');
}

// Seed sample challenges
export function seedChallenges() {
  const challenges = [
    {
      id: 'challenge_1',
      title: 'November Green Commute',
      description: 'Complete 20 rides this month',
      type: 'rides',
      target: 20,
      reward: 200,
      start: '2025-11-01',
      end: '2025-11-30',
    },
    {
      id: 'challenge_2',
      title: 'Carbon Crusher',
      description: 'Save 50 kg of CO₂ this month',
      type: 'co2',
      target: 50,
      reward: 150,
      start: '2025-11-01',
      end: '2025-11-30',
    },
    {
      id: 'challenge_3',
      title: 'Distance Champion',
      description: 'Travel 500 km carpooling',
      type: 'distance',
      target: 500,
      reward: 250,
      start: '2025-11-01',
      end: '2025-11-30',
    },
    {
      id: 'challenge_4',
      title: 'Social Butterfly',
      description: 'Share 3 rides on social media',
      type: 'social',
      target: 3,
      reward: 100,
      start: '2025-11-01',
      end: '2025-11-30',
    },
  ];

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO challenges (id, title, description, challenge_type, target_value, reward_credits, start_date, end_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  challenges.forEach(c => {
    stmt.run(c.id, c.title, c.description, c.type, c.target, c.reward, c.start, c.end);
  });

  console.log(`✅ Seeded ${challenges.length} challenges`);
}
