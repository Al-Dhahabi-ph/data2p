import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, LogOut } from 'lucide-react';
import AdminDashboard from '@/components/admin/AdminDashboard';

const ADMIN_PASSWORD = 'PharmaX@2025!';

const AdminPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for custom password in localStorage
    const customPassword = localStorage.getItem('data2p-admin-password') || ADMIN_PASSWORD;
    
    if (password === customPassword) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
    setError('');
  };

  if (!isAuthenticated) {
    return (
      <Layout title="Admin Access">
        <div className="max-w-md mx-auto mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-center justify-center">
                <Lock className="w-5 h-5" />
                <span>Admin Login</span>
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="mt-1"
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full">
                  Login
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const rightAction = (
    <Button 
      variant="ghost" 
      size="icon"
      onClick={handleLogout}
      className="hover:bg-destructive/10 text-destructive"
    >
      <LogOut className="w-5 h-5" />
    </Button>
  );

  return (
    <Layout title="Admin Dashboard" rightAction={rightAction}>
      <AdminDashboard />
    </Layout>
  );
};

export default AdminPage;