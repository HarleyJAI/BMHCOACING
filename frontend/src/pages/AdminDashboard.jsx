import { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  Activity,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { DashboardLayout } from '../components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { fetchApi, formatNumber } from '../lib/utils';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['hsl(224, 64%, 33%)', 'hsl(32, 95%, 44%)', 'hsl(175, 84%, 32%)', 'hsl(220, 70%, 50%)'];

export default function AdminDashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await fetchApi('/admin/stats');
      setStats(data);
    } catch (error) {
      toast.error('Failed to load admin stats');
    } finally {
      setLoading(false);
    }
  };

  const engagementData = [
    { name: 'Week 1', completions: 45 },
    { name: 'Week 2', completions: 38 },
    { name: 'Week 3', completions: 32 },
    { name: 'Week 4', completions: 28 },
    { name: 'Week 5', completions: 22 },
    { name: 'Week 6', completions: 18 },
  ];

  const roleDistribution = stats ? [
    { name: 'Students', value: stats.users.students },
    { name: 'Instructors', value: stats.users.total - stats.users.students - 1 },
    { name: 'Admins', value: 1 },
  ] : [];

  return (
    <DashboardLayout user={user}>
      <div className="p-8" data-testid="admin-dashboard">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-foreground mb-2">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Overview of platform performance and engagement
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="stat-card card-hover" data-testid="stat-users">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Users</p>
                  <p className="text-3xl font-heading font-bold">
                    {loading ? '...' : formatNumber(stats?.users.total || 0)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3 text-sm text-accent">
                <ArrowUp className="w-4 h-4" />
                <span>12% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card card-hover" data-testid="stat-students">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Active Students</p>
                  <p className="text-3xl font-heading font-bold">
                    {loading ? '...' : formatNumber(stats?.users.students || 0)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-accent" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3 text-sm text-accent">
                <ArrowUp className="w-4 h-4" />
                <span>8% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card card-hover" data-testid="stat-modules">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Published Modules</p>
                  <p className="text-3xl font-heading font-bold">
                    {loading ? '...' : stats?.content.published_modules || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-secondary" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                of {stats?.content.total_modules || 0} total
              </p>
            </CardContent>
          </Card>

          <Card className="stat-card card-hover" data-testid="stat-completions">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Module Completions</p>
                  <p className="text-3xl font-heading font-bold">
                    {loading ? '...' : formatNumber(stats?.engagement.total_completions || 0)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                {stats?.engagement.unique_completers || 0} unique learners
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Engagement Chart */}
          <Card data-testid="engagement-chart">
            <CardHeader>
              <CardTitle className="font-heading">Module Completion by Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={engagementData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="completions" fill="hsl(224, 64%, 33%)" radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* User Distribution */}
          <Card data-testid="distribution-chart">
            <CardHeader>
              <CardTitle className="font-heading">User Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roleDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {roleDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
