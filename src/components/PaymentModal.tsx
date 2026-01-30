import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  CreditCard,
  Smartphone,
  Wallet,
  Building,
  Check,
  Shield,
  Lock,
  QrCode,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  rideDetails: {
    from: string;
    to: string;
    date: string;
  };
  onPaymentSuccess: () => void;
}

const PaymentModal = ({ isOpen, onClose, amount, rideDetails, onPaymentSuccess }: PaymentModalProps) => {
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [processing, setProcessing] = useState(false);

  // Card payment state
  const [cardDetails, setCardDetails] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
  });

  // UPI state
  const [upiId, setUpiId] = useState('');
  const [selectedUpiApp, setSelectedUpiApp] = useState('');

  const handlePayment = async () => {
    setProcessing(true);

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    toast({
      title: 'Payment Successful! 🎉',
      description: `₹${amount} paid successfully. Your ride is confirmed!`,
    });

    setProcessing(false);
    onPaymentSuccess();
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.substring(0, 19); // 16 digits + 3 spaces
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Complete Payment</DialogTitle>
          <div className="bg-primary/10 p-4 rounded-lg mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Amount to Pay</span>
              <span className="text-3xl font-bold text-primary">₹{amount}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {rideDetails.from} → {rideDetails.to} • {rideDetails.date}
            </div>
          </div>
        </DialogHeader>

        <Tabs value={paymentMethod} onValueChange={setPaymentMethod} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="card" className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Card</span>
            </TabsTrigger>
            <TabsTrigger value="upi" className="flex items-center space-x-2">
              <Smartphone className="w-4 h-4" />
              <span className="hidden sm:inline">UPI</span>
            </TabsTrigger>
            <TabsTrigger value="wallet" className="flex items-center space-x-2">
              <Wallet className="w-4 h-4" />
              <span className="hidden sm:inline">Wallet</span>
            </TabsTrigger>
            <TabsTrigger value="netbanking" className="flex items-center space-x-2">
              <Building className="w-4 h-4" />
              <span className="hidden sm:inline">Bank</span>
            </TabsTrigger>
          </TabsList>

          {/* Credit/Debit Card */}
          <TabsContent value="card" className="space-y-4 mt-6">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
              <Shield className="w-4 h-4 text-green-500" />
              <span>Secured by 256-bit SSL encryption</span>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <div className="relative">
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={cardDetails.number}
                    onChange={(e) =>
                      setCardDetails({
                        ...cardDetails,
                        number: formatCardNumber(e.target.value),
                      })
                    }
                    maxLength={19}
                  />
                  <div className="absolute right-3 top-3 flex space-x-1">
                    <div className="w-8 h-5 bg-blue-500 rounded opacity-70"></div>
                    <div className="w-8 h-5 bg-red-500 rounded opacity-70"></div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardName">Cardholder Name</Label>
                <Input
                  id="cardName"
                  placeholder="JOHN DOE"
                  value={cardDetails.name}
                  onChange={(e) =>
                    setCardDetails({
                      ...cardDetails,
                      name: e.target.value.toUpperCase(),
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry">Expiry Date</Label>
                  <Input
                    id="expiry"
                    placeholder="MM/YY"
                    value={cardDetails.expiry}
                    onChange={(e) =>
                      setCardDetails({
                        ...cardDetails,
                        expiry: formatExpiry(e.target.value),
                      })
                    }
                    maxLength={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    type="password"
                    placeholder="123"
                    value={cardDetails.cvv}
                    onChange={(e) =>
                      setCardDetails({
                        ...cardDetails,
                        cvv: e.target.value.replace(/\D/g, '').substring(0, 3),
                      })
                    }
                    maxLength={3}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* UPI */}
          <TabsContent value="upi" className="space-y-4 mt-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-3">Choose UPI App</h3>
                <RadioGroup value={selectedUpiApp} onValueChange={setSelectedUpiApp}>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:border-primary">
                      <RadioGroupItem value="paytm" id="paytm" />
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                          P
                        </div>
                        <span className="font-medium">Paytm</span>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:border-primary">
                      <RadioGroupItem value="phonepe" id="phonepe" />
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                          PP
                        </div>
                        <span className="font-medium">PhonePe</span>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:border-primary">
                      <RadioGroupItem value="gpay" id="gpay" />
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                          G
                        </div>
                        <span className="font-medium">Google Pay</span>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:border-primary">
                      <RadioGroupItem value="bhim" id="bhim" />
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                          B
                        </div>
                        <span className="font-medium">BHIM UPI</span>
                      </div>
                    </label>
                  </div>
                </RadioGroup>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="upiId">Enter UPI ID</Label>
                <Input
                  id="upiId"
                  placeholder="yourname@paytm"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter your UPI ID (e.g., 9876543210@paytm, name@oksbi)
                </p>
              </div>

              <div className="bg-muted p-6 rounded-lg text-center">
                <QrCode className="w-24 h-24 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium mb-1">Scan QR Code</p>
                <p className="text-xs text-muted-foreground">
                  Open any UPI app and scan to pay
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Wallets */}
          <TabsContent value="wallet" className="space-y-4 mt-6">
            <div>
              <h3 className="font-semibold mb-3">Select Wallet</h3>
              <RadioGroup>
                <label className="flex items-center justify-between border rounded-lg p-4 cursor-pointer hover:border-primary mb-3">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="greencommute" id="greencommute" />
                    <div className="flex items-center space-x-2">
                      <Wallet className="w-6 h-6 text-primary" />
                      <div>
                        <p className="font-medium">GreenCommute Wallet</p>
                        <p className="text-xs text-muted-foreground">Balance: ₹250</p>
                      </div>
                    </div>
                  </div>
                  <Check className="w-5 h-5 text-primary" />
                </label>

                <label className="flex items-center justify-between border rounded-lg p-4 cursor-pointer hover:border-primary mb-3">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="paytm-wallet" id="paytm-wallet" />
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center text-white font-bold text-xs">
                        P
                      </div>
                      <div>
                        <p className="font-medium">Paytm Wallet</p>
                        <p className="text-xs text-muted-foreground">Link & Pay</p>
                      </div>
                    </div>
                  </div>
                </label>

                <label className="flex items-center justify-between border rounded-lg p-4 cursor-pointer hover:border-primary mb-3">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="phonepe-wallet" id="phonepe-wallet" />
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-purple-600 rounded flex items-center justify-center text-white font-bold text-xs">
                        PP
                      </div>
                      <div>
                        <p className="font-medium">PhonePe Wallet</p>
                        <p className="text-xs text-muted-foreground">Link & Pay</p>
                      </div>
                    </div>
                  </div>
                </label>

                <label className="flex items-center justify-between border rounded-lg p-4 cursor-pointer hover:border-primary">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="amazon-pay" id="amazon-pay" />
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-orange-400 rounded flex items-center justify-center text-white font-bold text-xs">
                        A
                      </div>
                      <div>
                        <p className="font-medium">Amazon Pay</p>
                        <p className="text-xs text-muted-foreground">Link & Pay</p>
                      </div>
                    </div>
                  </div>
                </label>
              </RadioGroup>
            </div>
          </TabsContent>

          {/* Net Banking */}
          <TabsContent value="netbanking" className="space-y-4 mt-6">
            <div>
              <h3 className="font-semibold mb-3">Select Your Bank</h3>
              <div className="space-y-2">
                <RadioGroup>
                  {[
                    'State Bank of India',
                    'HDFC Bank',
                    'ICICI Bank',
                    'Axis Bank',
                    'Punjab National Bank',
                    'Bank of Baroda',
                    'Canara Bank',
                    'Other Banks',
                  ].map((bank) => (
                    <label
                      key={bank}
                      className="flex items-center space-x-3 border rounded-lg p-3 cursor-pointer hover:border-primary"
                    >
                      <RadioGroupItem value={bank.toLowerCase().replace(/\s/g, '-')} id={bank} />
                      <div className="flex items-center space-x-3">
                        <Building className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium text-sm">{bank}</span>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Payment Button */}
        <div className="space-y-4 mt-6">
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Lock className="w-4 h-4" />
            <span>Your payment information is secure and encrypted</span>
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={processing}
              className="flex-1 gradient-primary"
            >
              {processing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Processing...
                </>
              ) : (
                <>Pay ₹{amount}</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
