export interface CarbonCredit {
  id: string;
  userId: string;
  rideId?: string;
  amount: number;
  type: 'earned' | 'redeemed' | 'purchased' | 'bonus';
  source: string;
  description?: string;
  createdAt: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'rides' | 'distance' | 'co2' | 'social' | 'special';
  requirementType: string;
  requirementValue: number;
  carbonCreditReward: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  unlocked?: boolean;
  earnedAt?: string;
  progress?: number;
  currentValue?: number;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  category: 'discount' | 'merchandise' | 'service' | 'donation' | 'tree_planting';
  carbonCreditCost: number;
  partnerName?: string;
  partnerLogo?: string;
  discountPercentage?: number;
  discountAmount?: number;
  terms?: string;
  expiryDate?: string;
  stockAvailable?: number;
  isActive: boolean;
}

export interface RewardRedemption {
  id: string;
  userId: string;
  rewardId: string;
  carbonCreditsSpent: number;
  redemptionCode?: string;
  status: 'pending' | 'active' | 'used' | 'expired';
  redeemedAt: string;
  usedAt?: string;
  expiresAt?: string;
  reward?: Reward;
}

export interface CarbonOffset {
  id: string;
  userId: string;
  amountKg: number;
  pricePaid: number;
  carbonCreditsEarned: number;
  offsetType: 'tree_planting' | 'renewable_energy' | 'carbon_capture' | 'mixed';
  certificateUrl?: string;
  status: 'pending' | 'completed' | 'verified';
  purchasedAt: string;
}

export interface TreePlanting {
  id: string;
  userId?: string;
  treesPlanted: number;
  location?: string;
  carbonOffsetKg: number;
  carbonCreditsEarned: number;
  partnerOrganization?: string;
  certificateUrl?: string;
  plantedAt: string;
}

export interface CorporatePartner {
  id: string;
  companyName: string;
  logoUrl?: string;
  description?: string;
  website?: string;
  matchingRatio: number;
  totalCreditsMatched: number;
  isActive: boolean;
}

export interface UserLevel {
  level: number;
  name: string;
  next: number | null;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  photo?: string;
  rating: number;
  totalEarned: number;
  achievementsCount: number;
  totalRides: number;
  co2Saved: number;
  rank: number;
  level: UserLevel;
}

export interface CarbonStats {
  balance: number;
  totalEarned: number;
  totalRedeemed: number;
  level: UserLevel;
  totalRides: number;
  co2Saved: number;
  achievementsUnlocked: number;
  rewardsRedeemed: number;
  treesPlanted: number;
}
