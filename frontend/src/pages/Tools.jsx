import { Link } from 'react-router-dom';
import { Calculator, TrendingUp, Map, BarChart3, ArrowRight } from 'lucide-react';
import { DashboardLayout } from '../components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';

const tools = [
  {
    id: 'market-matrix',
    title: 'GCC Market Selection Matrix',
    description: 'Evaluate and compare all 6 GCC countries based on 15+ criteria. Get a personalized recommendation for where to launch your practice.',
    icon: Map,
    color: 'primary',
    features: [
      'Capital requirements analysis',
      'Regulatory complexity scoring',
      'Market size & competition data',
      'Golden Visa eligibility',
      'Timeline to revenue estimation',
    ],
    href: '/tools/market-matrix',
  },
  {
    id: 'financial',
    title: 'Financial Calculator',
    description: 'Build comprehensive financial projections for your GCC medical practice. Calculate startup costs, operating expenses, and ROI.',
    icon: TrendingUp,
    color: 'accent',
    features: [
      'Startup capital estimation',
      'Monthly expense breakdown',
      'Break-even analysis',
      '3-year revenue projections',
      'Tax savings calculator',
    ],
    href: '/tools/financial',
  },
];

export default function Tools({ user }) {
  return (
    <DashboardLayout user={user}>
      <div className="p-8" data-testid="tools-page">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-foreground mb-2">
            Interactive Tools
          </h1>
          <p className="text-muted-foreground">
            Powerful calculators to help you make data-driven decisions for your GCC practice
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {tools.map((tool) => (
            <Card key={tool.id} className="card-hover border-border/50 group" data-testid={`tool-card-${tool.id}`}>
              <CardHeader>
                <div className={`w-14 h-14 rounded-xl bg-${tool.color}/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <tool.icon className={`w-7 h-7 text-${tool.color}`} />
                </div>
                <CardTitle className="font-heading text-xl">{tool.title}</CardTitle>
                <CardDescription className="text-base">{tool.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {tool.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-secondary"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link to={tool.href}>
                  <Button className="w-full btn-primary-pill group">
                    Launch Tool
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Coming Soon */}
        <div className="mt-12">
          <h2 className="font-heading text-xl font-semibold mb-4">Coming Soon</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="bg-muted/50 border-dashed">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                  <BarChart3 className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="font-heading font-medium mb-1">Licensing Timeline</h3>
                <p className="text-sm text-muted-foreground">Gantt-style regulatory roadmap</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50 border-dashed">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                  <Calculator className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="font-heading font-medium mb-1">Staffing Planner</h3>
                <p className="text-sm text-muted-foreground">Build your team structure</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50 border-dashed">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="font-heading font-medium mb-1">Valuation Model</h3>
                <p className="text-sm text-muted-foreground">Practice exit scenarios</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
