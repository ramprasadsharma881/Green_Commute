import db, { addCarbonCredits, getUserCarbonBalance } from '../database/db.js';
import { nanoid } from 'nanoid';
import * as carbonCalc from '../utils/carbonCalculator.js';

// Get user's carbon credit balance and history
export function getUserCarbonCredits(req, res) {
  try {
    const userId = req.user?.id || req.params.userId;
    
    // Get balance
    const balance = getUserCarbonBalance(userId);
    
    // Get history
    const history = db.prepare(`
      SELECT cc.*, r.source, r.destination
      FROM carbon_credits cc
      LEFT JOIN rides r ON cc.ride_id = r.id
      WHERE cc.user_id = ?
      ORDER BY cc.created_at DESC
      LIMIT 50
    `).all(userId);
    
    // Get total earned/redeemed
    const stats = db.prepare(`
      SELECT 
        SUM(CASE WHEN type IN ('earned', 'purchased', 'bonus') THEN amount ELSE 0 END) as total_earned,
        SUM(CASE WHEN type = 'redeemed' THEN amount ELSE 0 END) as total_redeemed
      FROM carbon_credits
      WHERE user_id = ?
    `).get(userId);
    
    // Calculate level
    const level = carbonCalc.calculateLevel(stats?.total_earned || 0);
    
    res.json({
      success: true,
      data: {
        balance,
        totalEarned: stats?.total_earned || 0,
        totalRedeemed: stats?.total_redeemed || 0,
        level,
        history,
      },
    });
  } catch (error) {
    console.error('Get carbon credits error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Get leaderboard
export function getLeaderboard(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const period = req.query.period || 'all'; // all, month, week
    
    let query = `
      SELECT 
        u.id, u.name, u.photo, u.rating,
        SUM(CASE WHEN cc.type IN ('earned', 'purchased', 'bonus') THEN cc.amount ELSE 0 END) as total_earned,
        COUNT(DISTINCT ua.achievement_id) as achievements_count,
        u.total_rides, u.co2_saved
      FROM users u
      LEFT JOIN carbon_credits cc ON u.id = cc.user_id
      LEFT JOIN user_achievements ua ON u.id = ua.user_id
    `;
    
    if (period === 'month') {
      query += ` WHERE cc.created_at >= date('now', '-1 month')`;
    } else if (period === 'week') {
      query += ` WHERE cc.created_at >= date('now', '-7 days')`;
    }
    
    query += `
      GROUP BY u.id
      ORDER BY total_earned DESC
      LIMIT ?
    `;
    
    const leaderboard = db.prepare(query).all(limit);
    
    // Add rank and level
    const enrichedLeaderboard = leaderboard.map((user, index) => ({
      ...user,
      rank: index + 1,
      level: carbonCalc.calculateLevel(user.total_earned),
    }));
    
    res.json({
      success: true,
      data: enrichedLeaderboard,
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Get all achievements
export function getAchievements(req, res) {
  try {
    const userId = req.user?.id;
    
    const achievements = db.prepare('SELECT * FROM achievements ORDER BY tier, requirement_value').all();
    
    if (userId) {
      // Get user's achievements
      const userAchievements = db.prepare('SELECT achievement_id, earned_at, progress FROM user_achievements WHERE user_id = ?').all(userId);
      const userAchMap = {};
      userAchievements.forEach(ua => {
        userAchMap[ua.achievement_id] = { earned_at: ua.earned_at, progress: ua.progress };
      });
      
      // Get user stats
      const user = db.prepare('SELECT total_rides, co2_saved FROM users WHERE id = ?').get(userId);
      const totalDistance = db.prepare('SELECT SUM(distance) as total FROM rides WHERE driver_id = ?').get(userId);
      
      // Enrich with progress
      const enrichedAchievements = achievements.map(ach => {
        const userAch = userAchMap[ach.id];
        let progress = 0;
        let currentValue = 0;
        
        if (ach.requirement_type === 'ride_count') {
          currentValue = user?.total_rides || 0;
        } else if (ach.requirement_type === 'co2_saved') {
          currentValue = user?.co2_saved || 0;
        } else if (ach.requirement_type === 'total_distance') {
          currentValue = totalDistance?.total || 0;
        }
        
        progress = carbonCalc.calculateAchievementProgress(currentValue, ach.requirement_value);
        
        return {
          ...ach,
          unlocked: !!userAch,
          earnedAt: userAch?.earned_at,
          progress,
          currentValue,
        };
      });
      
      res.json({ success: true, data: enrichedAchievements });
    } else {
      res.json({ success: true, data: achievements });
    }
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Get user's achievements
export function getUserAchievements(req, res) {
  try {
    const userId = req.user?.id || req.params.userId;
    
    const achievements = db.prepare(`
      SELECT a.*, ua.earned_at, ua.progress
      FROM user_achievements ua
      JOIN achievements a ON ua.achievement_id = a.id
      WHERE ua.user_id = ?
      ORDER BY ua.earned_at DESC
    `).all(userId);
    
    res.json({
      success: true,
      count: achievements.length,
      data: achievements,
    });
  } catch (error) {
    console.error('Get user achievements error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Get all rewards
export function getRewards(req, res) {
  try {
    const category = req.query.category;
    
    let query = 'SELECT * FROM rewards WHERE is_active = 1';
    const params = [];
    
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY carbon_credit_cost ASC';
    
    const rewards = db.prepare(query).all(...params);
    
    res.json({
      success: true,
      count: rewards.length,
      data: rewards,
    });
  } catch (error) {
    console.error('Get rewards error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Redeem reward
export function redeemReward(req, res) {
  try {
    const { rewardId } = req.body;
    const userId = req.user.id;
    
    // Get reward details
    const reward = db.prepare('SELECT * FROM rewards WHERE id = ? AND is_active = 1').get(rewardId);
    
    if (!reward) {
      return res.status(404).json({ success: false, error: 'Reward not found' });
    }
    
    // Check if enough stock
    if (reward.stock_available !== null && reward.stock_available <= 0) {
      return res.status(400).json({ success: false, error: 'Reward out of stock' });
    }
    
    // Check user balance
    const balance = getUserCarbonBalance(userId);
    
    if (balance < reward.carbon_credit_cost) {
      return res.status(400).json({ 
        success: false, 
        error: 'Insufficient carbon credits',
        required: reward.carbon_credit_cost,
        current: balance,
      });
    }
    
    // Create redemption
    const redemptionId = nanoid();
    const redemptionCode = nanoid(8).toUpperCase();
    const expiresAt = reward.expiry_date || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(); // 90 days
    
    db.prepare(`
      INSERT INTO reward_redemptions (id, user_id, reward_id, carbon_credits_spent, redemption_code, expires_at, status)
      VALUES (?, ?, ?, ?, ?, ?, 'active')
    `).run(redemptionId, userId, rewardId, reward.carbon_credit_cost, redemptionCode, expiresAt);
    
    // Deduct credits
    addCarbonCredits(userId, reward.carbon_credit_cost, 'redeemed', 'reward_redemption', `Redeemed: ${reward.title}`);
    
    // Update stock
    if (reward.stock_available !== null) {
      db.prepare('UPDATE rewards SET stock_available = stock_available - 1 WHERE id = ?').run(rewardId);
    }
    
    res.json({
      success: true,
      message: 'Reward redeemed successfully',
      data: {
        redemptionId,
        redemptionCode,
        expiresAt,
      },
    });
  } catch (error) {
    console.error('Redeem reward error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Get user's reward redemptions
export function getUserRedemptions(req, res) {
  try {
    const userId = req.user.id;
    
    const redemptions = db.prepare(`
      SELECT rr.*, r.title, r.description, r.category, r.partner_name
      FROM reward_redemptions rr
      JOIN rewards r ON rr.reward_id = r.id
      WHERE rr.user_id = ?
      ORDER BY rr.redeemed_at DESC
    `).all(userId);
    
    res.json({
      success: true,
      count: redemptions.length,
      data: redemptions,
    });
  } catch (error) {
    console.error('Get redemptions error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Purchase carbon offset
export function purchaseCarbonOffset(req, res) {
  try {
    const { amountKg, pricePaid, offsetType } = req.body;
    const userId = req.user.id;
    
    // Calculate credits earned
    const creditsEarned = carbonCalc.calculateOffsetCredits(amountKg, pricePaid);
    
    // Create offset record
    const offsetId = nanoid();
    db.prepare(`
      INSERT INTO carbon_offsets (id, user_id, amount_kg, price_paid, carbon_credits_earned, offset_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(offsetId, userId, amountKg, pricePaid, creditsEarned, offsetType);
    
    // Add credits
    addCarbonCredits(userId, creditsEarned, 'purchased', 'carbon_offset', `Purchased ${amountKg}kg carbon offset`);
    
    // Update user CO2 saved
    db.prepare('UPDATE users SET co2_saved = co2_saved + ? WHERE id = ?').run(amountKg, userId);
    
    res.json({
      success: true,
      message: 'Carbon offset purchased successfully',
      data: {
        offsetId,
        creditsEarned,
      },
    });
  } catch (error) {
    console.error('Purchase offset error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Plant trees
export function plantTrees(req, res) {
  try {
    const { treesPlanted, location, partnerOrganization } = req.body;
    const userId = req.user.id;
    
    // Calculate credits and CO2 offset
    const creditsEarned = carbonCalc.calculateTreePlantingCredits(treesPlanted);
    const co2Offset = treesPlanted * 21; // Each tree absorbs 21kg CO2/year
    
    // Create tree planting record
    const plantingId = nanoid();
    db.prepare(`
      INSERT INTO tree_plantings (id, user_id, trees_planted, location, carbon_offset_kg, carbon_credits_earned, partner_organization)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(plantingId, userId, treesPlanted, location, co2Offset, creditsEarned, partnerOrganization || 'TreeNation');
    
    // Add credits
    addCarbonCredits(userId, creditsEarned, 'bonus', 'tree_planting', `Planted ${treesPlanted} trees`);
    
    // Update user CO2 saved
    db.prepare('UPDATE users SET co2_saved = co2_saved + ? WHERE id = ?').run(co2Offset, userId);
    
    res.json({
      success: true,
      message: `Successfully planted ${treesPlanted} trees!`,
      data: {
        plantingId,
        creditsEarned,
        co2Offset,
      },
    });
  } catch (error) {
    console.error('Plant trees error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Get corporate partners
export function getCorporatePartners(req, res) {
  try {
    const partners = db.prepare('SELECT * FROM corporate_partners WHERE is_active = 1 ORDER BY matching_ratio DESC').all();
    
    res.json({
      success: true,
      count: partners.length,
      data: partners,
    });
  } catch (error) {
    console.error('Get partners error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Get user statistics
export function getUserStats(req, res) {
  try {
    const userId = req.user?.id || req.params.userId;
    
    const balance = getUserCarbonBalance(userId);
    
    const stats = db.prepare(`
      SELECT 
        u.total_rides,
        u.co2_saved,
        u.green_score,
        u.rating,
        SUM(CASE WHEN cc.type IN ('earned', 'purchased', 'bonus') THEN cc.amount ELSE 0 END) as total_earned,
        SUM(CASE WHEN cc.type = 'redeemed' THEN cc.amount ELSE 0 END) as total_redeemed,
        COUNT(DISTINCT ua.achievement_id) as achievements_unlocked,
        COUNT(DISTINCT rr.id) as rewards_redeemed,
        SUM(CASE WHEN tp.id IS NOT NULL THEN tp.trees_planted ELSE 0 END) as trees_planted
      FROM users u
      LEFT JOIN carbon_credits cc ON u.id = cc.user_id
      LEFT JOIN user_achievements ua ON u.id = ua.user_id
      LEFT JOIN reward_redemptions rr ON u.id = rr.user_id
      LEFT JOIN tree_plantings tp ON u.id = tp.user_id
      WHERE u.id = ?
      GROUP BY u.id
    `).get(userId);
    
    const level = carbonCalc.calculateLevel(stats?.total_earned || 0);
    
    res.json({
      success: true,
      data: {
        ...stats,
        currentBalance: balance,
        level,
      },
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
