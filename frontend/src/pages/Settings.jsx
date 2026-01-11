import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Separator } from '../components/ui/separator';
import { toast } from 'sonner';
import { User, Mail, Shield, Bell, LogOut } from 'lucide-react';
import { fetchApi } from '../lib/utils';

export default function Settings({ user }) {
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [notifications, setNotifications] = useState({
    email_updates: true,
    progress_reminders: true,
    new_content: true,
  });

  const handleSaveProfile = () => {
    toast.success('Profile updated successfully');
  };

  const handleSaveNotifications = () => {
    toast.success('Notification preferences saved');
  };

  return (
    <DashboardLayout user={user}>
      <div className="p-8 max-w-3xl" data-testid="settings-page">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-foreground mb-2">
            Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your account and preferences
          </p>
        </div>

        <div className="space-y-6">
          {/* Profile Section */}
          <Card data-testid="profile-section">
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6">
                {user?.picture ? (
                  <img 
                    src={user.picture} 
                    alt={user.name} 
                    className="w-20 h-20 rounded-full"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-heading font-bold text-primary">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                )}
                <div>
                  <Button variant="outline" size="sm">
                    Change Photo
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG or GIF. Max 2MB.
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    data-testid="name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    disabled
                    data-testid="email-input"
                  />
                </div>
              </div>

              <Button onClick={handleSaveProfile} className="btn-primary-pill" data-testid="save-profile-btn">
                Save Changes
              </Button>
            </CardContent>
          </Card>

          {/* Notifications Section */}
          <Card data-testid="notifications-section">
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Updates</p>
                  <p className="text-sm text-muted-foreground">
                    Receive emails about course updates and announcements
                  </p>
                </div>
                <Switch
                  checked={notifications.email_updates}
                  onCheckedChange={(checked) => 
                    setNotifications({ ...notifications, email_updates: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Progress Reminders</p>
                  <p className="text-sm text-muted-foreground">
                    Get reminders to continue your learning
                  </p>
                </div>
                <Switch
                  checked={notifications.progress_reminders}
                  onCheckedChange={(checked) => 
                    setNotifications({ ...notifications, progress_reminders: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">New Content Alerts</p>
                  <p className="text-sm text-muted-foreground">
                    Be notified when new modules are available
                  </p>
                </div>
                <Switch
                  checked={notifications.new_content}
                  onCheckedChange={(checked) => 
                    setNotifications({ ...notifications, new_content: checked })
                  }
                />
              </div>

              <Button onClick={handleSaveNotifications} variant="outline">
                Save Preferences
              </Button>
            </CardContent>
          </Card>

          {/* Account Section */}
          <Card data-testid="account-section">
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">Account Type</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {user?.role || 'Student'}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium capitalize">
                  {user?.role || 'Student'}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">Member Since</p>
                  <p className="text-sm text-muted-foreground">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out of All Devices
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
