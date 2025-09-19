import { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  User,
} from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { Button } from '../components/ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useToast } from '../hooks/use-toast';
import { Chrome } from 'lucide-react';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuthSuccess = (user: User) => {
    console.log('Authentication successful:', user);
    navigate('/dashboard');
  };

  const handleAuthError = (error: any) => {
    console.error('Authentication error:', error);
    toast({
      title: 'Authentication Failed',
      description: error.message || 'An unknown error occurred.',
      variant: 'destructive',
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    if (isSignUp) {
      if (password !== confirmPassword) {
        toast({
          title: 'Sign Up Error',
          description: 'Passwords do not match.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        handleAuthSuccess(userCredential.user);
      } catch (error) {
        handleAuthError(error);
      }
    } else {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        handleAuthSuccess(userCredential.user);
      } catch (error) {
        handleAuthError(error);
      }
    }
    setIsLoading(false);
  };
  
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      handleAuthSuccess(result.user);
    } catch (error) {
      handleAuthError(error);
    }
    setIsGoogleLoading(false);
  };


  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-radial from-background to-background/90 p-4">
      <Card className="w-full max-w-md bg-card/80 backdrop-blur-sm border-primary/10">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold tracking-tight text-primary">
            {isSignUp ? 'Create an Account' : 'Welcome Back'}
          </CardTitle>
          <CardDescription>
            {isSignUp ? 'Enter your details to get started with SealDeal.ai' : 'Sign in to access your deals dashboard'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              required
              disabled={isLoading || isGoogleLoading}
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
              disabled={isLoading || isGoogleLoading}
            />
            {isSignUp && (
              <Input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading || isGoogleLoading}
              />
            )}
            <Button type="submit" className="w-full" isLoading={isLoading} disabled={isLoading || isGoogleLoading}>
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>
          </form>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-primary/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
           <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} isLoading={isGoogleLoading} disabled={isLoading || isGoogleLoading}>
              <Chrome className="mr-2 h-4 w-4" />
              Google
            </Button>
        </CardContent>
        <CardFooter className="flex justify-center text-sm">
          <p className="text-muted-foreground">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <Button variant="link" onClick={() => setIsSignUp(!isSignUp)} className="ml-1 px-1 font-bold text-primary">
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </Button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

