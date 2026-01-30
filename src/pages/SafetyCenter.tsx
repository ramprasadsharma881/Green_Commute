import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Shield,
  CheckCircle,
  AlertCircle,
  Upload,
  Phone,
  User,
  FileText,
  Lock,
  Bell,
  MapPin,
  Camera,
  UserCheck,
} from 'lucide-react';
import SOSDashboard from '@/components/SOSDashboard';
import { storage } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

interface VerificationStatus {
  idVerified: boolean;
  phoneVerified: boolean;
  emailVerified: boolean;
  backgroundCheck: boolean;
  idImageUrl?: string;
  backgroundImageUrl?: string;
}

const SafetyCenter = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({
    idVerified: false,
    phoneVerified: true, // Auto-verified on signup
    emailVerified: true, // Auto-verified on signup
    backgroundCheck: false,
    idImageUrl: undefined,
    backgroundImageUrl: undefined,
  });
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    relationship: '',
  });
  const [isUploading, setIsUploading] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    // Load emergency contacts
    const contacts = storage.get<EmergencyContact[]>(`safety:${user.id}:contacts`) || [];
    setEmergencyContacts(contacts);

    // Load verification status
    const status = storage.get<VerificationStatus>(`safety:${user.id}:verification`) || {
      idVerified: false,
      phoneVerified: true,
      emailVerified: true,
      backgroundCheck: false,
      idImageUrl: undefined,
      backgroundImageUrl: undefined,
    };
    setVerificationStatus(status);
  }, [user, navigate]);

  const handleAddContact = () => {
    if (!user || !newContact.name || !newContact.phone) {
      toast({
        title: 'Missing information',
        description: 'Please fill all fields',
        variant: 'destructive',
      });
      return;
    }

    const contact: EmergencyContact = {
      id: `contact-${Date.now()}`,
      ...newContact,
    };

    const updatedContacts = [...emergencyContacts, contact];
    setEmergencyContacts(updatedContacts);
    storage.set(`safety:${user.id}:contacts`, updatedContacts);

    setNewContact({ name: '', phone: '', relationship: '' });

    toast({
      title: 'Contact added! ✓',
      description: 'Emergency contact saved successfully',
    });
  };

  const handleDeleteContact = (id: string) => {
    if (!user) return;
    const updatedContacts = emergencyContacts.filter((c) => c.id !== id);
    setEmergencyContacts(updatedContacts);
    storage.set(`safety:${user.id}:contacts`, updatedContacts);

    toast({
      title: 'Contact removed',
      description: 'Emergency contact deleted',
    });
  };

  const handleVerificationUpload = (type: string, file?: File) => {
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please select an image to upload',
        variant: 'destructive',
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file (JPG, PNG, etc.)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(type);

    // Convert file to base64 for local storage (in production, upload to cloud)
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      
      // Simulate upload delay
      setTimeout(() => {
        const updated = { ...verificationStatus };
        if (type === 'id') {
          updated.idVerified = true;
          updated.idImageUrl = base64String;
        }
        if (type === 'background') {
          updated.backgroundCheck = true;
          updated.backgroundImageUrl = base64String;
        }

        setVerificationStatus(updated);
        if (user) {
          storage.set(`safety:${user.id}:verification`, updated);
        }

        setIsUploading(null);

        toast({
          title: 'Document uploaded! ✅',
          description: 'Your verification has been processed successfully',
        });
      }, 1500);
    };
    reader.readAsDataURL(file);
  };

  // Handle file input change
  const handleFileChange = (type: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleVerificationUpload(type, file);
    }
  };

  const calculateSafetyScore = () => {
    let score = 0;
    if (verificationStatus.emailVerified) score += 20;
    if (verificationStatus.phoneVerified) score += 20;
    if (verificationStatus.idVerified) score += 30;
    if (verificationStatus.backgroundCheck) score += 30;
    return score;
  };

  const safetyScore = calculateSafetyScore();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="gradient-primary text-white p-6 pb-24">
        <div className="container max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="text-white hover:bg-white/10 mb-4 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center space-x-3 mb-6">
            <Shield className="w-8 h-8" />
            <h1 className="text-2xl font-bold">Safety Center</h1>
          </div>
          <p className="text-white/80 text-sm">
            Your safety is our priority
          </p>
        </div>
      </header>

      <div className="container max-w-2xl mx-auto px-6 -mt-16">
        {/* Safety Score Card */}
        <Card className="p-6 mb-6 shadow-eco bg-gradient-to-br from-primary/5 to-primary/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Safety Score</p>
              <p className="text-4xl font-bold text-primary">{safetyScore}%</p>
              <p className="text-sm text-muted-foreground mt-1">
                {safetyScore === 100 ? 'Fully Verified' : 'Complete verification to reach 100%'}
              </p>
            </div>
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-10 h-10 text-primary" />
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="sos" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="sos">
              <AlertCircle className="w-4 h-4 mr-2" />
              SOS
            </TabsTrigger>
            <TabsTrigger value="verification">
              <UserCheck className="w-4 h-4 mr-2" />
              Verify
            </TabsTrigger>
            <TabsTrigger value="contacts">
              <Phone className="w-4 h-4 mr-2" />
              Contacts
            </TabsTrigger>
            <TabsTrigger value="safety">
              <Shield className="w-4 h-4 mr-2" />
              Safety
            </TabsTrigger>
          </TabsList>

          {/* SOS Tab */}
          <TabsContent value="sos">
            <SOSDashboard />
          </TabsContent>

          {/* Verification Tab */}
          <TabsContent value="verification" className="space-y-4">
            <Card className="p-5">
              <h3 className="font-semibold text-foreground mb-4">Verification Status</h3>

              {/* Email Verification */}
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    verificationStatus.emailVerified ? 'bg-green-500/10' : 'bg-muted'
                  }`}>
                    {verificationStatus.emailVerified ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-card-foreground">Email Address</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                {verificationStatus.emailVerified && (
                  <Badge className="bg-green-500">Verified</Badge>
                )}
              </div>

              {/* Phone Verification */}
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    verificationStatus.phoneVerified ? 'bg-green-500/10' : 'bg-muted'
                  }`}>
                    {verificationStatus.phoneVerified ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-card-foreground">Phone Number</p>
                    <p className="text-xs text-muted-foreground">{user.phone || 'Not provided'}</p>
                  </div>
                </div>
                {verificationStatus.phoneVerified && (
                  <Badge className="bg-green-500">Verified</Badge>
                )}
              </div>

              {/* ID Verification */}
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    verificationStatus.idVerified ? 'bg-green-500/10' : 'bg-muted'
                  }`}>
                    {verificationStatus.idVerified ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Camera className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-card-foreground">College ID</p>
                    <p className="text-xs text-muted-foreground">
                      {verificationStatus.idVerified ? 'ID verified' : 'Upload your College ID'}
                    </p>
                  </div>
                </div>
                {verificationStatus.idVerified ? (
                  <div className="flex items-center gap-2">
                    {verificationStatus.idImageUrl && (
                      <img 
                        src={verificationStatus.idImageUrl} 
                        alt="ID Preview" 
                        className="w-10 h-10 rounded object-cover border"
                      />
                    )}
                    <Badge className="bg-green-500">Verified</Badge>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange('id')}
                      disabled={isUploading === 'id'}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isUploading === 'id'}
                      asChild
                    >
                      <span>
                        {isUploading === 'id' ? (
                          <>
                            <div className="w-4 h-4 mr-1 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Camera className="w-4 h-4 mr-1" />
                            Upload ID
                          </>
                        )}
                      </span>
                    </Button>
                  </label>
                )}
              </div>

              {/* Background Check */}
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    verificationStatus.backgroundCheck ? 'bg-green-500/10' : 'bg-muted'
                  }`}>
                    {verificationStatus.backgroundCheck ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <FileText className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-card-foreground">Background Check</p>
                    <p className="text-xs text-muted-foreground">
                      {verificationStatus.backgroundCheck ? 'Check completed' : 'Upload document for verification'}
                    </p>
                  </div>
                </div>
                {verificationStatus.backgroundCheck ? (
                  <div className="flex items-center gap-2">
                    {verificationStatus.backgroundImageUrl && (
                      <img 
                        src={verificationStatus.backgroundImageUrl} 
                        alt="Background Doc Preview" 
                        className="w-10 h-10 rounded object-cover border"
                      />
                    )}
                    <Badge className="bg-green-500">Verified</Badge>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange('background')}
                      disabled={isUploading === 'background'}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isUploading === 'background'}
                      asChild
                    >
                      <span>
                        {isUploading === 'background' ? (
                          <>
                            <div className="w-4 h-4 mr-1 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-1" />
                            Upload
                          </>
                        )}
                      </span>
                    </Button>
                  </label>
                )}
              </div>
            </Card>

            {/* Verification Benefits */}
            <Card className="p-5 gradient-card">
              <h3 className="font-semibold text-foreground mb-3 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-primary" />
                Verification Benefits
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5" />
                  <span>Build trust with other users</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5" />
                  <span>Access to verified-only rides</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5" />
                  <span>Higher booking priority</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5" />
                  <span>Enhanced safety for everyone</span>
                </li>
              </ul>
            </Card>
          </TabsContent>

          {/* Emergency Contacts Tab */}
          <TabsContent value="contacts" className="space-y-4">
            {/* Add Contact Form */}
            <Card className="p-5">
              <h3 className="font-semibold text-foreground mb-4">Add Emergency Contact</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter contact name"
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="+1 234 567 8900"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="relationship">Relationship</Label>
                  <Input
                    id="relationship"
                    placeholder="e.g., Family, Friend"
                    value={newContact.relationship}
                    onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                  />
                </div>
                <Button onClick={handleAddContact} className="w-full gradient-primary">
                  Add Contact
                </Button>
              </div>
            </Card>

            {/* Contacts List */}
            {emergencyContacts.length > 0 ? (
              emergencyContacts.map((contact) => (
                <Card key={contact.id} className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-card-foreground">{contact.name}</p>
                        <p className="text-sm text-muted-foreground">{contact.phone}</p>
                        <p className="text-xs text-muted-foreground">{contact.relationship}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteContact(contact.id)}
                      className="text-destructive"
                    >
                      Remove
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-12 text-center">
                <Phone className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2 text-foreground">
                  No emergency contacts
                </h3>
                <p className="text-muted-foreground text-sm">
                  Add contacts who can be notified in case of emergency
                </p>
              </Card>
            )}
          </TabsContent>

          {/* Safety Guidelines Tab */}
          <TabsContent value="safety" className="space-y-4">
            <Card className="p-5">
              <h3 className="font-semibold text-foreground mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-primary" />
                Safety Guidelines
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-card-foreground mb-2 flex items-center">
                    <Bell className="w-4 h-4 mr-2" />
                    Before Your Ride
                  </h4>
                  <ul className="space-y-1 text-sm text-muted-foreground ml-6">
                    <li>• Verify driver details before booking</li>
                    <li>• Check driver ratings and reviews</li>
                    <li>• Share trip details with emergency contacts</li>
                    <li>• Meet at well-lit, public locations</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-card-foreground mb-2 flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    During Your Ride
                  </h4>
                  <ul className="space-y-1 text-sm text-muted-foreground ml-6">
                    <li>• Keep live tracking enabled</li>
                    <li>• Trust your instincts</li>
                    <li>• Don't share personal information</li>
                    <li>• Use in-app chat for communication</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-card-foreground mb-2 flex items-center">
                    <Lock className="w-4 h-4 mr-2" />
                    Emergency Procedures
                  </h4>
                  <ul className="space-y-1 text-sm text-muted-foreground ml-6">
                    <li>• Use SOS button in tracking screen</li>
                    <li>• Call emergency services immediately</li>
                    <li>• Report incidents immediately</li>
                    <li>• Contact GreenCommute support</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Emergency Numbers */}
            <Card className="p-5 border-2 border-red-200 bg-red-50 dark:bg-red-950/20">
              <h3 className="font-semibold text-red-700 dark:text-red-400 mb-4 flex items-center">
                <Phone className="w-5 h-5 mr-2" />
                Emergency Numbers (India)
              </h3>
              <div className="space-y-3">
                {/* Police */}
                <a href="tel:100" className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Police</p>
                      <p className="text-xs text-muted-foreground">Emergency assistance</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">100</p>
                  </div>
                </a>

                {/* Ambulance */}
                <a href="tel:108" className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Ambulance</p>
                      <p className="text-xs text-muted-foreground">Medical emergency</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-red-600">108</p>
                  </div>
                </a>

                {/* Fire Brigade */}
                <a href="tel:101" className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Fire Brigade</p>
                      <p className="text-xs text-muted-foreground">Fire emergency</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-600">101</p>
                  </div>
                </a>

                {/* Women Helpline */}
                <a href="tel:1091" className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Women Helpline</p>
                      <p className="text-xs text-muted-foreground">24x7 support</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-pink-600">1091</p>
                  </div>
                </a>

                {/* National Emergency */}
                <a href="tel:112" className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                      <Phone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">National Emergency</p>
                      <p className="text-xs text-muted-foreground">All emergencies</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-600">112</p>
                  </div>
                </a>

                {/* Child Helpline */}
                <a href="tel:1098" className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Child Helpline</p>
                      <p className="text-xs text-muted-foreground">Child safety</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">1098</p>
                  </div>
                </a>
              </div>
              <p className="text-xs text-red-600 dark:text-red-500 mt-4 text-center">
                Tap any number to call directly
              </p>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-24 flex flex-col">
                <AlertCircle className="w-8 h-8 mb-2 text-destructive" />
                <span className="text-sm font-medium">Report Issue</span>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col">
                <Phone className="w-8 h-8 mb-2 text-primary" />
                <span className="text-sm font-medium">Support</span>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SafetyCenter;
