import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Calculator, 
  MessageCircle, 
  TrendingUp, 
  Clock,
  CheckCircle2,
  ArrowRight,
  Play,
  Trophy,
  Target
} from 'lucide-react';
import { DashboardLayout } from '../components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { fetchApi, formatDate } from '../lib/utils';
import { toast } from 'sonner';

export default function Dashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [progressData, modulesData] = await Promise.all([
        fetchApi('/progress'),
        fetchApi('/modules'),
      ]);
      setStats(progressData.stats);
      setModules(modulesData.slice(0, 4)); // Show first 4 modules
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const completionPercentage = stats?.completion_percentage || 0;

  return (
    <DashboardLayout user={user}>
      <div className="p-8" data-testid="student-dashboard">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-foreground mb-2">
            Welcome back, {user?.name?.split(' ')[0] || 'Student'}!
          </h1>
          <p className="text-muted-foreground">
            Continue your journey to launching a successful GCC medical practice.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="stat-card card-hover" data-testid="stat-progress">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <span className="text-3xl font-heading font-bold text-primary">
                  {completionPercentage}%
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">Course Progress</p>
              <Progress value={completionPercentage} className="h-2" />
            </CardContent>
          </Card>

          <Card className="stat-card card-hover" data-testid="stat-completed">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-accent" />
                </div>
                <span className="text-3xl font-heading font-bold text-accent">
                  {stats?.completed_modules || 0}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Modules Completed</p>
              <p className="text-xs text-muted-foreground mt-1">
                of {stats?.total_modules || 0} total
              </p>
            </CardContent>
          </Card>

          <Card className="stat-card card-hover" data-testid="stat-tools">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                  <Calculator className="w-6 h-6 text-secondary" />
                </div>
                <span className="text-3xl font-heading font-bold text-secondary">2</span>
              </div>
              <p className="text-sm text-muted-foreground">Tools Available</p>
              <p className="text-xs text-muted-foreground mt-1">Market Matrix & Calculator</p>
            </CardContent>
          </Card>

          <Card className="stat-card card-hover" data-testid="stat-support">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-primary" />
                </div>
                <span className="text-3xl font-heading font-bold text-primary">24/7</span>
              </div>
              <p className="text-sm text-muted-foreground">AI Assistant</p>
              <p className="text-xs text-muted-foreground mt-1">Always here to help</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Continue Learning */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl font-semibold">Continue Learning</h2>
              <Link to="/curriculum">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 bg-muted animate-pulse rounded-xl"></div>
                  ))}
                </div>
              ) : (
                modules.map((module) => (
                  <Link 
                    key={module.module_id} 
                    to={`/module/${module.module_id}`}
                    data-testid={`module-card-${module.module_id}`}
                  >
                    <Card className="module-card">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center text-white font-heading font-bold text-xl shrink-0">
                          {module.week_number}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-heading font-semibold truncate">
                            {module.title}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {module.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {module.duration_minutes} min
                            </span>
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              {module.resources?.length || 0} resources
                            </span>
                          </div>
                        </div>
                        <div className="shrink-0">
                          {module.is_published ? (
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                              <Play className="w-5 h-5 text-primary" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                              <Clock className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="border-secondary/30" data-testid="quick-actions">
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-secondary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/tools/market-matrix" className="block">
                  <Button variant="outline" className="w-full justify-start h-auto py-3">
                    <Calculator className="w-4 h-4 mr-3 text-secondary" />
                    <div className="text-left">
                      <div className="font-medium">Market Selection Matrix</div>
                      <div className="text-xs text-muted-foreground">Find your ideal GCC market</div>
                    </div>
                  </Button>
                </Link>
                <Link to="/tools/financial" className="block">
                  <Button variant="outline" className="w-full justify-start h-auto py-3">
                    <TrendingUp className="w-4 h-4 mr-3 text-accent" />
                    <div className="text-left">
                      <div className="font-medium">Financial Calculator</div>
                      <div className="text-xs text-muted-foreground">Plan your practice finances</div>
                    </div>
                  </Button>
                </Link>
                <Link to="/chat" className="block">
                  <Button variant="outline" className="w-full justify-start h-auto py-3">
                    <MessageCircle className="w-4 h-4 mr-3 text-primary" />
                    <div className="text-left">
                      <div className="font-medium">AI Assistant</div>
                      <div className="text-xs text-muted-foreground">Get instant answers</div>
                    </div>
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Milestones */}
            <Card data-testid="milestones">
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-secondary" />
                  Your Milestones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">Account Created</div>
                      <div className="text-xs text-muted-foreground">Welcome to the program!</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      completionPercentage > 0 ? 'bg-accent' : 'bg-muted'
                    }`}>
                      {completionPercentage > 0 ? (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      ) : (
                        <div className="w-3 h-3 rounded-full border-2 border-muted-foreground"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">First Module Completed</div>
                      <div className="text-xs text-muted-foreground">
                        {completionPercentage > 0 ? 'Great start!' : 'Start learning today'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full border-2 border-muted-foreground"></div>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">Market Analysis Complete</div>
                      <div className="text-xs text-muted-foreground">Use the Market Matrix tool</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
