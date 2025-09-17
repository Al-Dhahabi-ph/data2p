import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Palette, Lock, Image, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SystemSettings = () => {
  const [logoUrl, setLogoUrl] = useState('https://firebasestorage.googleapis.com/v0/b/movie-and-series-b78d0.appspot.com/o/files%2FIMG_20250915_023025.png?alt=media&token=fa4e5540-463f-41c3-85c0-2831bd8258c6');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const { toast } = useToast();

  const VERIFICATION_CODE = '0852741369';

  // Brand colors (restricted)
  const brandColors = [
    { name: 'Primary Blue', value: '#1E94D4', description: 'Main brand color' },
    { name: 'Dark Blue', value: '#153864', description: 'Secondary brand color' },
    { name: 'Light Gray', value: '#FBFBFB', description: 'Background color' }
  ];

  const handleLogoUpdate = () => {
    if (verificationCode !== VERIFICATION_CODE) {
      toast({
        title: "خطأ",
        description: "رمز التحقق غير صحيح",
        variant: "destructive",
      });
      return;
    }

    // Update logo URL in local storage or global state
    localStorage.setItem('data2p-logo-url', logoUrl);
    
    toast({
      title: "نجح",
      description: "تم تحديث الشعار بنجاح",
    });
    setVerificationCode('');
    
    // Reload page to show new logo
    window.location.reload();
  };

  const handlePasswordUpdate = () => {
    if (verificationCode !== VERIFICATION_CODE) {
      toast({
        title: "خطأ",
        description: "رمز التحقق غير صحيح",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "خطأ",
        description: "كلمات المرور غير متطابقة",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "خطأ",
        description: "يجب أن تكون كلمة المرور 8 أحرف على الأقل",
        variant: "destructive",
      });
      return;
    }

    // Update password in localStorage and update AdminPage component
    localStorage.setItem('data2p-admin-password', newPassword);
    
    toast({
      title: "نجح",
      description: "تم تحديث كلمة المرور بنجاح",
    });
    setNewPassword('');
    setConfirmPassword('');
    setVerificationCode('');
  };

  return (
    <div className="space-y-6">
      {/* Brand Colors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Palette className="w-5 h-5" />
            <span>Brand Colors</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {brandColors.map((color, index) => (
              <div key={index} className="text-center space-y-2">
                <div 
                  className="w-full h-20 rounded-lg border-2 border-border"
                  style={{ backgroundColor: color.value }}
                />
                <div>
                  <p className="font-medium text-foreground">{color.name}</p>
                  <p className="text-sm text-muted-foreground">{color.value}</p>
                  <p className="text-xs text-muted-foreground">{color.description}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            These are the official Data2P brand colors and cannot be changed to maintain brand consistency.
          </p>
        </CardContent>
      </Card>

      <Separator />

      {/* Logo Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Image className="w-5 h-5" />
            <span>Logo Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="logo-url">Logo URL</Label>
            <Input
              id="logo-url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="Enter logo URL"
            />
          </div>

          <div>
            <Label htmlFor="verification-logo">Verification Code</Label>
            <Input
              id="verification-logo"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Enter verification code to change logo"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <img 
              src={logoUrl} 
              alt="Current Logo" 
              className="h-12 w-auto border border-border rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
            <Button 
              onClick={handleLogoUpdate}
              disabled={!verificationCode}
            >
              Update Logo
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Password Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lock className="w-5 h-5" />
            <span>Admin Password</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
          </div>
          
          <div>
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>

          <div>
            <Label htmlFor="verification-password">Verification Code</Label>
            <Input
              id="verification-password"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Enter verification code to change password"
            />
          </div>
          
          <Button 
            onClick={handlePasswordUpdate}
            disabled={!newPassword || !confirmPassword || !verificationCode}
          >
            Update Password
          </Button>
          
          <p className="text-sm text-muted-foreground">
            Current password: PharmaX@2025! (for reference only)
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemSettings;