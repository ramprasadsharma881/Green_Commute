import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate, Link } from 'react-router-dom';
import { resetPassword } from '@/services/firebaseService';
import { ArrowLeft, Mail, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await resetPassword(email);
            setIsSubmitted(true);
            toast({
                title: 'Email sent! 📧',
                description: 'Check your inbox for password reset instructions.',
            });
        } catch (error) {
            console.error('Reset password error:', error);
            toast({
                title: 'Error',
                description: 'Could not send reset email. Please check the email address.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen gradient-hero">
            <div className="container max-w-md mx-auto px-6 py-8">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/login')}
                    className="mb-6 -ml-2"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Login
                </Button>

                <div className="bg-card rounded-2xl shadow-eco p-8 animate-scale-in">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                            <KeyRound className="w-8 h-8 text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold text-card-foreground">Forgot Password?</h1>
                        <p className="text-sm text-muted-foreground mt-2">
                            {isSubmitted
                                ? "We've sent you an email with instructions."
                                : "Enter your email to reset your password"}
                        </p>
                    </div>

                    {!isSubmitted ? (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-11 gradient-primary hover:opacity-90 transition-opacity"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Sending Link...' : 'Send Reset Link'}
                            </Button>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <div className="p-4 bg-muted/50 rounded-lg text-sm text-center text-muted-foreground">
                                Didn't receive the email? Check your spam folder or try again.
                            </div>
                            <Button
                                onClick={() => setIsSubmitted(false)}
                                variant="outline"
                                className="w-full"
                            >
                                Try another email
                            </Button>
                        </div>
                    )}

                    <p className="text-center text-sm text-muted-foreground mt-6">
                        Remember your password?{' '}
                        <Link to="/login" className="text-primary font-medium hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
