/**
 * Carbon Credit Calculation Engine
 * Converts CO2 savings and activities into carbon credits
 */

// Conversion rates
const RATES = {
  CO2_TO_CREDITS: 0.1, // 1kg CO2 saved = 0.1 credits
  DISTANCE_BONUS: 0.01, // Per km traveled
  PASSENGER_MULTIPLIER: 1.2, // 20% bonus per passenger
  EARLY_BIRD_BONUS: 5, // Before 7 AM
  NIGHT_OWL_BONUS: 5, // After 10 PM
  WEEKEND_BONUS: 10, // Weekend rides
  FIRST_RIDE_BONUS: 50,
  STREAK_BONUS_PER_DAY: 2, // Daily streak bonus
};

/**
 * Calculate carbon credits earned from a completed ride
 */
export function calculateRideCredits(ride, passengers = 0) {
  let credits = 0;
  
  // Base credits from CO2 savings
  if (ride.co2_saved) {
    credits += ride.co2_saved * RATES.CO2_TO_CREDITS;
  }
  
  // Distance bonus
  if (ride.distance) {
    credits += ride.distance * RATES.DISTANCE_BONUS;
  }
  
  // Passenger multiplier (more passengers = more credits)
  if (passengers > 0) {
    credits *= (1 + (passengers * 0.1)); // 10% per passenger
  }
  
  // Time-based bonuses
  const rideTime = new Date(ride.dateTime);
  const hour = rideTime.getHours();
  const day = rideTime.getDay();
  
  // Early bird bonus (before 7 AM)
  if (hour < 7) {
    credits += RATES.EARLY_BIRD_BONUS;
  }
  
  // Night owl bonus (after 10 PM)
  if (hour >= 22) {
    credits += RATES.NIGHT_OWL_BONUS;
  }
  
  // Weekend bonus
  if (day === 0 || day === 6) {
    credits += RATES.WEEKEND_BONUS;
  }
  
  return Math.round(credits * 10) / 10; // Round to 1 decimal
}

/**
 * Calculate streak bonus
 */
export function calculateStreakBonus(streakDays) {
  return streakDays * RATES.STREAK_BONUS_PER_DAY;
}

/**
 * Calculate tree planting credits
 */
export function calculateTreePlantingCredits(treesPlanted) {
  // Each tree absorbs ~21 kg CO2 per year
  const co2PerTree = 21;
  const credits = treesPlanted * co2PerTree * RATES.CO2_TO_CREDITS;
  return Math.round(credits * 10) / 10;
}

/**
 * Calculate carbon offset purchase credits
 */
export function calculateOffsetCredits(co2OffsetKg, pricePaid) {
  // Base credits from offset amount
  let credits = co2OffsetKg * RATES.CO2_TO_CREDITS;
  
  // Bonus for purchasing offsets (50% bonus)
  credits *= 1.5;
  
  return Math.round(credits * 10) / 10;
}

/**
 * Calculate corporate matching credits
 */
export function calculateMatchedCredits(baseCredits, matchingRatio) {
  return Math.round(baseCredits * matchingRatio * 10) / 10;
}

/**
 * Calculate level from total credits earned
 */
export function calculateLevel(totalCredits) {
  if (totalCredits < 100) return { level: 1, name: 'Beginner', next: 100 };
  if (totalCredits < 500) return { level: 2, name: 'Eco Explorer', next: 500 };
  if (totalCredits < 1000) return { level: 3, name: 'Green Commuter', next: 1000 };
  if (totalCredits < 2500) return { level: 4, name: 'Eco Warrior', next: 2500 };
  if (totalCredits < 5000) return { level: 5, name: 'Climate Champion', next: 5000 };
  if (totalCredits < 10000) return { level: 6, name: 'Planet Guardian', next: 10000 };
  return { level: 7, name: 'Sustainability Legend', next: null };
}

/**
 * Get credit multiplier based on user level
 */
export function getLevelMultiplier(level) {
  const multipliers = {
    1: 1.0,
    2: 1.1,
    3: 1.2,
    4: 1.3,
    5: 1.5,
    6: 1.75,
    7: 2.0,
  };
  return multipliers[level] || 1.0;
}

/**
 * Calculate achievement progress
 */
export function calculateAchievementProgress(userStats, requirement) {
  const progress = (userStats / requirement) * 100;
  return Math.min(progress, 100);
}

/**
 * Check if achievement is unlocked
 */
export function isAchievementUnlocked(userStats, requirement) {
  return userStats >= requirement;
}

/**
 * Calculate referral bonus
 */
export function calculateReferralBonus(referredUserRides) {
  // Get 10% of credits earned by referred user
  return Math.round(referredUserRides * 0.1 * 10) / 10;
}
