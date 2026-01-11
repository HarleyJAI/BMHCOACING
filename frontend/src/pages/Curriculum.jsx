import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  Lock,
  Play,
  FileText,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { DashboardLayout } from '../components/Sidebar';
import { Card, CardContent } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { fetchApi } from '../lib/utils';
import { toast } from 'sonner';

export default function Curriculum({ user }) {
  const [modules, setModules] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [modulesData, progressData] = await Promise.all([
        fetchApi('/modules'),
        fetchApi('/progress'),
      ]);
      
      setModules(modulesData);
      
      // Convert progress array to map
      const progressMap = {};
      progressData.progress.forEach(p => {
        progressMap[p.module_id] = p;
      });
      setProgress(progressMap);
    } catch (error) {
      toast.error('Failed to load curriculum');
    } finally {
      setLoading(false);
    }
  };

  // Group modules by week
  const weekGroups = modules.reduce((acc, module) => {
    const week = module.week_number;
    if (!acc[week]) acc[week] = [];
    acc[week].push(module);
    return acc;
  }, {});

  const weekNumbers = Object.keys(weekGroups).map(Number).sort((a, b) => a - b);

  const getWeekProgress = (weekModules) => {
    const completed = weekModules.filter(m => progress[m.module_id]?.completed).length;
    return Math.round((completed / weekModules.length) * 100);
  };

  return (
    <DashboardLayout user={user}>
      <div className="p-8" data-testid="curriculum-page">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-foreground mb-2">
            Course Curriculum
          </h1>
          <p className="text-muted-foreground">
            12 weeks of comprehensive training to launch your GCC medical practice
          </p>
        </div>

        {/* Overall Progress */}
        <Card className="mb-8 bg-primary text-white" data-testid="overall-progress">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-heading font-semibold text-lg mb-1">Your Progress</h3>
                <p className="text-white/70 text-sm">
                  {Object.values(progress).filter(p => p.completed).length} of {modules.length} modules completed
                </p>
              </div>
              <div className="text-4xl font-heading font-bold">
                {modules.length > 0 
                  ? Math.round((Object.values(progress).filter(p => p.completed).length / modules.length) * 100)
                  : 0}%
              </div>
            </div>
            <Progress 
              value={modules.length > 0 
                ? (Object.values(progress).filter(p => p.completed).length / modules.length) * 100
                : 0} 
              className="h-3 bg-white/20"
            />
          </CardContent>
        </Card>

        {/* Curriculum Accordion */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-xl"></div>
            ))}
          </div>
        ) : (
          <Accordion type="multiple" defaultValue={["week-1"]} className="space-y-4">
            {weekNumbers.map((weekNum) => {
              const weekModules = weekGroups[weekNum];
              const weekProgress = getWeekProgress(weekModules);
              const isLocked = !weekModules[0]?.is_published;

              return (
                <AccordionItem 
                  key={weekNum} 
                  value={`week-${weekNum}`}
                  className="border border-border/50 rounded-xl overflow-hidden bg-white"
                  data-testid={`week-${weekNum}`}
                >
                  <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/30">
                    <div className="flex items-center gap-4 w-full">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-heading font-bold text-lg ${
                        isLocked 
                          ? 'bg-muted text-muted-foreground' 
                          : weekProgress === 100 
                            ? 'bg-accent text-white' 
                            : 'bg-primary text-white'
                      }`}>
                        {isLocked ? <Lock className="w-5 h-5" /> : weekNum}
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-heading font-semibold">
                          Week {weekNum}: {weekModules[0]?.title.replace(`Week ${weekNum}: `, '')}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4" />
                            {weekModules.length} module{weekModules.length > 1 ? 's' : ''}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {weekModules.reduce((acc, m) => acc + m.duration_minutes, 0)} min
                          </span>
                        </div>
                      </div>
                      {!isLocked && (
                        <div className="flex items-center gap-3 mr-4">
                          <Progress value={weekProgress} className="w-24 h-2" />
                          <span className="text-sm font-medium w-12">{weekProgress}%</span>
                        </div>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="px-6 pb-4 space-y-3">
                      {weekModules.map((module) => {
                        const moduleProgress = progress[module.module_id];
                        const isCompleted = moduleProgress?.completed;

                        return (
                          <Link 
                            key={module.module_id} 
                            to={module.is_published ? `/module/${module.module_id}` : '#'}
                            className={!module.is_published ? 'pointer-events-none' : ''}
                            data-testid={`module-link-${module.module_id}`}
                          >
                            <div className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
                              module.is_published 
                                ? 'hover:bg-muted/50 cursor-pointer' 
                                : 'opacity-50'
                            }`}>
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                isCompleted 
                                  ? 'bg-accent/10' 
                                  : module.is_published 
                                    ? 'bg-primary/10' 
                                    : 'bg-muted'
                              }`}>
                                {isCompleted ? (
                                  <CheckCircle2 className="w-5 h-5 text-accent" />
                                ) : module.is_published ? (
                                  <Play className="w-5 h-5 text-primary" />
                                ) : (
                                  <Lock className="w-5 h-5 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium truncate">{module.title}</h4>
                                <p className="text-sm text-muted-foreground truncate">
                                  {module.description}
                                </p>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {module.duration_minutes} min
                                </span>
                                {module.resources?.length > 0 && (
                                  <span className="flex items-center gap-1">
                                    <FileText className="w-4 h-4" />
                                    {module.resources.length}
                                  </span>
                                )}
                                {module.is_published && (
                                  <ChevronRight className="w-5 h-5" />
                                )}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>
    </DashboardLayout>
  );
}
