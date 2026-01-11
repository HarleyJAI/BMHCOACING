import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  Download,
  FileText,
  Play,
  ChevronLeft,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { DashboardLayout } from '../components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { fetchApi } from '../lib/utils';
import { toast } from 'sonner';

export default function ModuleDetail({ user }) {
  const { moduleId } = useParams();
  const [module, setModule] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);

  useEffect(() => {
    loadModule();
  }, [moduleId]);

  const loadModule = async () => {
    try {
      const [moduleData, progressData] = await Promise.all([
        fetchApi(`/modules/${moduleId}`),
        fetchApi('/progress'),
      ]);
      
      setModule(moduleData);
      
      const existingProgress = progressData.progress.find(p => p.module_id === moduleId);
      setProgress(existingProgress);
      setVideoProgress(existingProgress?.video_progress || 0);
    } catch (error) {
      toast.error('Failed to load module');
    } finally {
      setLoading(false);
    }
  };

  const markComplete = async () => {
    try {
      await fetchApi('/progress', {
        method: 'POST',
        body: JSON.stringify({
          module_id: moduleId,
          completed: true,
          video_progress: 100,
        }),
      });
      
      setProgress({ ...progress, completed: true });
      toast.success('Module marked as complete!');
    } catch (error) {
      toast.error('Failed to update progress');
    }
  };

  const updateVideoProgress = async (percent) => {
    setVideoProgress(percent);
    try {
      await fetchApi('/progress', {
        method: 'POST',
        body: JSON.stringify({
          module_id: moduleId,
          completed: percent >= 90,
          video_progress: percent,
        }),
      });
      
      if (percent >= 90 && !progress?.completed) {
        setProgress({ ...progress, completed: true });
        toast.success('Module completed!');
      }
    } catch (error) {
      console.error('Failed to update progress');
    }
  };

  if (loading) {
    return (
      <DashboardLayout user={user}>
        <div className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!module) {
    return (
      <DashboardLayout user={user}>
        <div className="p-8 text-center">
          <p className="text-muted-foreground">Module not found</p>
          <Link to="/curriculum">
            <Button variant="outline" className="mt-4">Back to Curriculum</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <div className="p-8" data-testid="module-detail-page">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link to="/curriculum" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Curriculum
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Module Header */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  Week {module.week_number}
                </span>
                {progress?.completed && (
                  <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Completed
                  </span>
                )}
              </div>
              <h1 className="font-heading text-3xl font-bold text-foreground mb-3" data-testid="module-title">
                {module.title}
              </h1>
              <p className="text-muted-foreground">{module.description}</p>
            </div>

            {/* Video Player */}
            {module.video_url && (
              <Card className="overflow-hidden" data-testid="video-player">
                <div className="aspect-video bg-black relative">
                  <iframe
                    src={module.video_url}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {module.duration_minutes} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Play className="w-4 h-4" />
                        {Math.round(videoProgress)}% watched
                      </span>
                    </div>
                    <Progress value={videoProgress} className="w-32 h-2" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Module Content */}
            {module.content && (
              <Card data-testid="module-content">
                <CardHeader>
                  <CardTitle className="font-heading flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    Lesson Content
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-slate max-w-none">
                    {module.content.split('\n').map((paragraph, idx) => {
                      if (paragraph.startsWith('## ')) {
                        return <h2 key={idx} className="font-heading text-xl font-semibold mt-6 mb-3">{paragraph.replace('## ', '')}</h2>;
                      }
                      if (paragraph.startsWith('### ')) {
                        return <h3 key={idx} className="font-heading text-lg font-semibold mt-4 mb-2">{paragraph.replace('### ', '')}</h3>;
                      }
                      if (paragraph.startsWith('- ')) {
                        return <li key={idx} className="ml-4">{paragraph.replace('- ', '')}</li>;
                      }
                      if (paragraph.startsWith('✅ ') || paragraph.startsWith('- [ ] ')) {
                        return (
                          <div key={idx} className="flex items-start gap-2 py-1">
                            <CheckCircle2 className="w-4 h-4 text-accent mt-1 shrink-0" />
                            <span>{paragraph.replace('✅ ', '').replace('- [ ] ', '')}</span>
                          </div>
                        );
                      }
                      if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                        return <p key={idx} className="font-semibold">{paragraph.replace(/\*\*/g, '')}</p>;
                      }
                      if (paragraph.trim() === '') return <br key={idx} />;
                      return <p key={idx} className="mb-3">{paragraph}</p>;
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress Card */}
            <Card className="border-secondary/30" data-testid="progress-card">
              <CardHeader>
                <CardTitle className="font-heading text-lg">Your Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Video Progress</span>
                  <span className="font-medium">{Math.round(videoProgress)}%</span>
                </div>
                <Progress value={videoProgress} className="h-2" />
                
                {!progress?.completed ? (
                  <Button 
                    onClick={markComplete}
                    className="w-full btn-luxury"
                    data-testid="mark-complete-btn"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Mark as Complete
                  </Button>
                ) : (
                  <div className="text-center py-3 bg-accent/10 rounded-lg">
                    <CheckCircle2 className="w-6 h-6 text-accent mx-auto mb-1" />
                    <p className="text-sm font-medium text-accent">Module Completed!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resources */}
            {module.resources?.length > 0 && (
              <Card data-testid="resources-card">
                <CardHeader>
                  <CardTitle className="font-heading text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Resources
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {module.resources.map((resource, idx) => (
                    <a
                      key={idx}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Download className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{resource.name}</p>
                        <p className="text-xs text-muted-foreground uppercase">{resource.type}</p>
                      </div>
                    </a>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
            <Card data-testid="module-nav">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Button variant="outline" size="sm" disabled>
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <Button variant="outline" size="sm">
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
