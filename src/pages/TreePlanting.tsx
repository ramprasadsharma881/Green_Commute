import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  TreePine,
  MapPin,
  Leaf,
  Award,
  Coins,
  Heart,
  Globe,
  TrendingUp,
} from 'lucide-react';

export default function TreePlanting() {
  const { toast } = useToast();
  const [treesToPlant, setTreesToPlant] = useState(1);
  const [location, setLocation] = useState('');
  const [selectedPartner, setSelectedPartner] = useState('TreeNation');

  const partners = [
    {
      id: 'TreeNation',
      name: 'TreeNation',
      logo: '🌲',
      description: 'Global reforestation network',
      pricePerTree: 1.5,
      co2PerTree: 21,
      creditsPerTree: 2.1,
    },
    {
      id: 'OneTreePlanted',
      name: 'One Tree Planted',
      logo: '🌳',
      description: 'Nonprofit environmental charity',
      pricePerTree: 1,
      co2PerTree: 21,
      creditsPerTree: 2.1,
    },
    {
      id: 'EdenProjects',
      name: 'Eden Reforestation Projects',
      logo: '🌴',
      description: 'Global reforestation',
      pricePerTree: 0.5,
      co2PerTree: 21,
      creditsPerTree: 2.1,
    },
  ];

  const selectedPartnerData = partners.find(p => p.id === selectedPartner) || partners[0];
  const totalCost = treesToPlant * selectedPartnerData.pricePerTree;
  const totalCO2 = treesToPlant * selectedPartnerData.co2PerTree;
  const totalCredits = treesToPlant * selectedPartnerData.creditsPerTree;

  const handlePlantTrees = () => {
    // In production, this would call the API
    toast({
      title: '🌱 Trees planted successfully!',
      description: `You planted ${treesToPlant} trees and earned ${totalCredits.toFixed(1)} carbon credits!`,
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <TreePine className="w-10 h-10 text-green-600" />
          Plant Trees, Save the Planet
        </h1>
        <p className="text-muted-foreground">
          Every tree planted helps combat climate change and earns you carbon credits
        </p>
      </div>

      {/* Impact Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4 text-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <TreePine className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold">156,342</p>
          <p className="text-xs text-muted-foreground">Trees Planted</p>
        </Card>
        
        <Card className="p-4 text-center bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
          <Globe className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold">45</p>
          <p className="text-xs text-muted-foreground">Countries</p>
        </Card>
        
        <Card className="p-4 text-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
          <Leaf className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <p className="text-2xl font-bold">3,283</p>
          <p className="text-xs text-muted-foreground">Tons CO₂ Offset</p>
        </Card>
        
        <Card className="p-4 text-center bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20">
          <Heart className="w-8 h-8 text-orange-600 mx-auto mb-2" />
          <p className="text-2xl font-bold">12,567</p>
          <p className="text-xs text-muted-foreground">Eco Warriors</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Planting Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Partner Selection */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Choose Partner Organization</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {partners.map((partner) => (
                <Card
                  key={partner.id}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedPartner === partner.id
                      ? 'border-2 border-green-600 bg-green-50 dark:bg-green-950/20'
                      : 'hover:border-green-300'
                  }`}
                  onClick={() => setSelectedPartner(partner.id)}
                >
                  <div className="text-4xl mb-2 text-center">{partner.logo}</div>
                  <h4 className="font-semibold text-center mb-1">{partner.name}</h4>
                  <p className="text-xs text-muted-foreground text-center mb-3">
                    {partner.description}
                  </p>
                  <div className="text-center">
                    <Badge className="bg-green-600">₹{partner.pricePerTree}/tree</Badge>
                  </div>
                </Card>
              ))}
            </div>
          </Card>

          {/* Quantity Selection */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">How many trees?</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="trees">Number of Trees</Label>
                <Input
                  id="trees"
                  type="number"
                  min="1"
                  max="1000"
                  value={treesToPlant}
                  onChange={(e) => setTreesToPlant(parseInt(e.target.value) || 1)}
                  className="text-lg font-semibold"
                />
              </div>

              {/* Quick select buttons */}
              <div className="flex gap-2 flex-wrap">
                {[1, 5, 10, 25, 50, 100].map((num) => (
                  <Button
                    key={num}
                    variant={treesToPlant === num ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTreesToPlant(num)}
                  >
                    {num} {num === 1 ? 'tree' : 'trees'}
                  </Button>
                ))}
              </div>

              <div>
                <Label htmlFor="location">Preferred Location (Optional)</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    placeholder="e.g., Amazon Rainforest, Madagascar..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Impact Visualization */}
          <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Your Environmental Impact
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <Leaf className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-green-600">{totalCO2}</p>
                <p className="text-xs text-muted-foreground">kg CO₂/year</p>
              </div>
              <div className="text-center">
                <Award className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-blue-600">{totalCredits.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Carbon Credits</p>
              </div>
              <div className="text-center">
                <TreePine className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-purple-600">{treesToPlant}</p>
                <p className="text-xs text-muted-foreground">Trees Planted</p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
              <p className="text-sm text-center">
                🌍 Equivalent to removing <strong>{(totalCO2 / 4600).toFixed(2)} cars</strong> from the road for a year!
              </p>
            </div>
          </Card>
        </div>

        {/* Summary & Checkout */}
        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-6">
            <h3 className="text-xl font-semibold mb-4">Order Summary</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Partner</span>
                <span className="font-medium">{selectedPartnerData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Trees</span>
                <span className="font-medium">{treesToPlant}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price per tree</span>
                <span className="font-medium">₹{selectedPartnerData.pricePerTree}</span>
              </div>
              {location && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location</span>
                  <span className="font-medium text-sm">{location}</span>
                </div>
              )}
            </div>

            <div className="border-t pt-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-semibold">Total Cost</span>
                <span className="text-2xl font-bold">₹{totalCost.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Coins className="w-4 h-4 text-green-600" />
                <span>Earn {totalCredits.toFixed(1)} carbon credits</span>
              </div>
            </div>

            <Button 
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
              onClick={handlePlantTrees}
            >
              <TreePine className="w-5 h-5 mr-2" />
              Plant {treesToPlant} {treesToPlant === 1 ? 'Tree' : 'Trees'}
            </Button>

            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <p className="text-xs text-center text-muted-foreground">
                ✅ Certificate of Planting included<br />
                ✅ GPS coordinates of your trees<br />
                ✅ Updates on tree growth
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Additional Info */}
      <Card className="mt-8 p-6">
        <h3 className="text-xl font-semibold mb-4">Why Plant Trees?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Leaf className="w-5 h-5 text-green-600" />
              Combat Climate Change
            </h4>
            <p className="text-sm text-muted-foreground">
              Each tree absorbs approximately 21 kg of CO₂ per year, helping to reduce greenhouse gases.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              Restore Ecosystems
            </h4>
            <p className="text-sm text-muted-foreground">
              Trees provide habitats for wildlife, prevent soil erosion, and purify water sources.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-600" />
              Support Communities
            </h4>
            <p className="text-sm text-muted-foreground">
              Tree planting creates jobs and provides resources for local communities worldwide.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
