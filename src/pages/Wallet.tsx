import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Wallet as WalletIcon,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  PiggyBank,
  TrendingUp,
  Calendar,
  Filter,
  Download,
  Plus,
} from 'lucide-react';
import { getTransactionsByUser, getUserBalance, createTransaction, AppTransaction } from '@/services/firebaseService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';


const Wallet = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<AppTransaction[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'credit' | 'debit'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingMoney, setIsAddingMoney] = useState(false);
  const [addMoneyAmount, setAddMoneyAmount] = useState('50');
  const [showAddMoneyDialog, setShowAddMoneyDialog] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    loadWalletData();
  }, [user, navigate]);

  const loadWalletData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Load transactions from Firebase
      const userTransactions = await getTransactionsByUser(user.id);

      // If no transactions exist, create a welcome bonus
      if (userTransactions.length === 0) {
        await createTransaction({
          userId: user.id,
          type: 'credit',
          amount: 250.0,
          description: 'Welcome bonus',
        });
        // Reload transactions and balance
        const newTransactions = await getTransactionsByUser(user.id);
        setTransactions(newTransactions);
        const newBalance = await getUserBalance(user.id);
        setBalance(newBalance);
      } else {
        setTransactions(userTransactions);
        // Recalculate balance from all transactions
        const userBalance = await getUserBalance(user.id);
        setBalance(userBalance);
      }
      
      console.log('✅ Loaded wallet data from Firebase');
    } catch (error) {
      console.error('Error loading wallet data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMoney = async () => {
    if (!user) return;

    const amount = parseFloat(addMoneyAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount greater than 0',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsAddingMoney(true);

      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Add money to wallet
      await createTransaction({
        userId: user.id,
        type: 'credit',
        amount: amount,
        description: 'Money added to wallet',
      });

      // Reload wallet data
      await loadWalletData();

      toast({
        title: 'Money Added Successfully! 💰',
        description: `₹${amount.toFixed(2)} has been added to your wallet`,
      });

      setShowAddMoneyDialog(false);
      setAddMoneyAmount('50');
    } catch (error) {
      console.error('Error adding money:', error);
      toast({
        title: 'Error',
        description: 'Failed to add money. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAddingMoney(false);
    }
  };

  const filteredTransactions = transactions.filter((txn) =>
    filterType === 'all' ? true : txn.type === filterType
  );

  const formatDate = (dateTime: any) => {
    const date = dateTime?.toDate ? dateTime.toDate() : new Date(dateTime);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const totalEarnings = transactions
    .filter((t) => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSpent = transactions
    .filter((t) => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);

  const savings = balance - totalSpent;

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading wallet...</p>
        </div>
      </div>
    );
  }

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
            <WalletIcon className="w-8 h-8" />
            <h1 className="text-2xl font-bold">Wallet</h1>
          </div>
          <p className="text-white/80 text-sm">Manage your balance and transactions</p>
        </div>
      </header>

      <div className="container max-w-2xl mx-auto px-6 -mt-16">
        {/* Balance Card */}
        <Card className="p-6 mb-6 shadow-eco bg-gradient-to-br from-primary/10 to-primary/5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Available Balance</p>
              <p className="text-4xl font-bold text-primary">₹{balance.toFixed(2)}</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <WalletIcon className="w-8 h-8 text-primary" />
            </div>
          </div>

          <div className="flex gap-3">
            <Dialog open={showAddMoneyDialog} onOpenChange={setShowAddMoneyDialog}>
              <DialogTrigger asChild>
                <Button className="flex-1 gradient-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Money
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Money to Wallet</DialogTitle>
                  <DialogDescription>
                    Enter the amount you want to add to your wallet.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (₹)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Enter amount"
                      value={addMoneyAmount}
                      onChange={(e) => setAddMoneyAmount(e.target.value)}
                      min="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select defaultValue="upi">
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="card">Credit/Debit Card</SelectItem>
                        <SelectItem value="bank">Bank Account</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    className="w-full gradient-primary" 
                    onClick={handleAddMoney}
                    disabled={isAddingMoney}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    {isAddingMoney ? 'Processing...' : 'Add Money'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Withdraw
            </Button>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="p-4 text-center">
            <ArrowDownRight className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground mb-1">Total Spent</p>
            <p className="text-lg font-bold text-card-foreground">
              ₹{totalSpent.toFixed(2)}
            </p>
          </Card>

          <Card className="p-4 text-center">
            <ArrowUpRight className="w-5 h-5 text-green-500 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground mb-1">Total Earned</p>
            <p className="text-lg font-bold text-card-foreground">
              ₹{totalEarnings.toFixed(2)}
            </p>
          </Card>

          <Card className="p-4 text-center">
            <PiggyBank className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground mb-1">Savings</p>
            <p className="text-lg font-bold text-card-foreground">
              ₹{Math.max(0, savings).toFixed(2)}
            </p>
          </Card>
        </div>

        {/* Savings Comparison */}
        <Card className="p-6 mb-6 gradient-card">
          <div className="flex items-center space-x-3 mb-3">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Your Savings vs Solo Driving</h3>
          </div>
          <p className="text-2xl font-bold text-primary mb-2">
            ₹{((totalSpent * 0.6).toFixed(2))}
          </p>
          <p className="text-sm text-muted-foreground">
            You've saved approximately 60% compared to driving alone!
          </p>
        </Card>

        {/* Transactions */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Transaction History</h3>
            <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="credit">Received</SelectItem>
                <SelectItem value="debit">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8">
                <WalletIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No transactions found</p>
              </div>
            ) : (
              filteredTransactions.map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between py-3 border-b border-border last:border-0"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        txn.type === 'credit'
                          ? 'bg-green-500/10'
                          : 'bg-red-500/10'
                      }`}
                    >
                      {txn.type === 'credit' ? (
                        <ArrowDownRight className="w-5 h-5 text-green-500" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-card-foreground text-sm">
                        {txn.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(txn.createdAt)}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`font-bold ${
                      txn.type === 'credit' ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {txn.type === 'credit' ? '+' : '-'}₹{txn.amount.toFixed(2)}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Payment Methods */}
        <Card className="p-6 mb-6">
          <h3 className="font-semibold text-foreground mb-4">Saved Payment Methods</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-card-foreground text-sm">•••• 4242</p>
                  <p className="text-xs text-muted-foreground">Expires 12/25</p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                Edit
              </Button>
            </div>

            <Button variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Payment Method
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Wallet;
