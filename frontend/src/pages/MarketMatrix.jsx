import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight, 
  Map, 
  CheckCircle2, 
  Star,
  Shield,
  Globe2,
  Clock,
  DollarSign,
  TrendingUp,
  Download
} from 'lucide-react';
import { DashboardLayout } from '../components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Slider } from '../components/ui/slider';
import { Checkbox } from '../components/ui/checkbox';
import { Progress } from '../components/ui/progress';
import { fetchApi, formatCurrency, GCC_FLAGS } from '../lib/utils';
import { toast } from 'sonner';

const specialties = [
  'General Practice',
  'Family Medicine',
  'Internal Medicine',
  'Pediatrics',
  'Dermatology',
  'Orthopedics',
  'Cardiology',
  'Oncology',
  'Aesthetics',
  'Dentistry',
  'Other',
];

const practiceTypes = [
  { value: 'mobile', label: 'Mobile Healthcare', description: 'Home visits, corporate wellness' },
  { value: 'clinic', label: 'Small Clinic', description: 'Single location, focused specialty' },
  { value: 'multi_specialty', label: 'Multi-Specialty Center', description: 'Multiple services under one roof' },
  { value: 'surgery_center', label: 'Surgery Center', description: 'Ambulatory surgical facility' },
];

const languages = ['English', 'Arabic', 'Hindi', 'Urdu', 'French', 'Tagalog'];

export default function MarketMatrix({ user }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [inputs, setInputs] = useState({
    specialty: '',
    capital_available: 300000,
    timeline_months: 12,
    risk_tolerance: 'medium',
    language_skills: ['English'],
    practice_type: 'clinic',
  });

  const handleLanguageToggle = (lang) => {
    setInputs(prev => ({
      ...prev,
      language_skills: prev.language_skills.includes(lang)
        ? prev.language_skills.filter(l => l !== lang)
        : [...prev.language_skills, lang],
    }));
  };

  const handleAnalyze = async () => {
    if (!inputs.specialty) {
      toast.error('Please select a specialty');
      return;
    }

    setLoading(true);
    try {
      const response = await fetchApi('/tools/market-matrix', {
        method: 'POST',
        body: JSON.stringify(inputs),
      });
      setResults(response);
      setStep(3);
    } catch (error) {
      toast.error('Failed to analyze markets');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout user={user}>
      <div className="p-8" data-testid="market-matrix-page">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link to="/tools" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tools
          </Link>
        </div>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
            <Map className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">
              GCC Market Selection Matrix
            </h1>
            <p className="text-muted-foreground">
              Find your ideal market based on your profile and preferences
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-4 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm ${
                step >= s ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
              }`}>
                {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
              </div>
              <span className={step >= s ? 'text-foreground' : 'text-muted-foreground'}>
                {s === 1 ? 'Your Profile' : s === 2 ? 'Preferences' : 'Results'}
              </span>
              {s < 3 && <div className="w-12 h-0.5 bg-muted mx-2"></div>}
            </div>
          ))}
        </div>

        {/* Step 1: Profile */}
        {step === 1 && (
          <Card className="max-w-2xl" data-testid="step-1">
            <CardHeader>
              <CardTitle className="font-heading">Tell us about yourself</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Medical Specialty</Label>
                <Select value={inputs.specialty} onValueChange={(v) => setInputs({ ...inputs, specialty: v })}>
                  <SelectTrigger data-testid="specialty-select">
                    <SelectValue placeholder="Select your specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    {specialties.map((spec) => (
                      <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Practice Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  {practiceTypes.map((type) => (
                    <div
                      key={type.value}
                      onClick={() => setInputs({ ...inputs, practice_type: type.value })}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        inputs.practice_type === type.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      data-testid={`practice-type-${type.value}`}
                    >
                      <div className="font-medium">{type.label}</div>
                      <div className="text-sm text-muted-foreground">{type.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Languages You Speak</Label>
                <div className="flex flex-wrap gap-2">
                  {languages.map((lang) => (
                    <div
                      key={lang}
                      onClick={() => handleLanguageToggle(lang)}
                      className={`px-3 py-1.5 rounded-full text-sm cursor-pointer transition-all ${
                        inputs.language_skills.includes(lang)
                          ? 'bg-primary text-white'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {lang}
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={() => setStep(2)} className="w-full btn-primary-pill" data-testid="next-step-btn">
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Preferences */}
        {step === 2 && (
          <Card className="max-w-2xl" data-testid="step-2">
            <CardHeader>
              <CardTitle className="font-heading">Your preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label>Available Capital</Label>
                  <span className="font-heading font-bold text-primary">
                    {formatCurrency(inputs.capital_available)}
                  </span>
                </div>
                <Slider
                  value={[inputs.capital_available]}
                  onValueChange={([v]) => setInputs({ ...inputs, capital_available: v })}
                  min={50000}
                  max={5000000}
                  step={50000}
                  className="py-2"
                  data-testid="capital-slider"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>$50K</span>
                  <span>$5M</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label>Timeline to Launch</Label>
                  <span className="font-heading font-bold text-primary">
                    {inputs.timeline_months} months
                  </span>
                </div>
                <Slider
                  value={[inputs.timeline_months]}
                  onValueChange={([v]) => setInputs({ ...inputs, timeline_months: v })}
                  min={3}
                  max={24}
                  step={1}
                  className="py-2"
                  data-testid="timeline-slider"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>3 months</span>
                  <span>24 months</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Risk Tolerance</Label>
                <div className="grid grid-cols-3 gap-3">
                  {['low', 'medium', 'high'].map((risk) => (
                    <div
                      key={risk}
                      onClick={() => setInputs({ ...inputs, risk_tolerance: risk })}
                      className={`p-3 rounded-xl border-2 cursor-pointer text-center transition-all ${
                        inputs.risk_tolerance === risk
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      data-testid={`risk-${risk}`}
                    >
                      <div className="font-medium capitalize">{risk}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button 
                  onClick={handleAnalyze} 
                  className="flex-1 btn-luxury"
                  disabled={loading}
                  data-testid="analyze-btn"
                >
                  {loading ? 'Analyzing...' : 'Analyze Markets'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Results */}
        {step === 3 && results && (
          <div className="space-y-6" data-testid="step-3">
            {/* Recommendation */}
            {results.recommendation && (
              <Card className="border-secondary bg-secondary/5" data-testid="recommendation">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="w-5 h-5 text-secondary fill-secondary" />
                    <span className="font-heading font-semibold text-secondary">Top Recommendation</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">{GCC_FLAGS[results.recommendation.country_code]}</span>
                    <div>
                      <h3 className="font-heading text-2xl font-bold">{results.recommendation.country_name}</h3>
                      <p className="text-muted-foreground">
                        Score: {results.recommendation.total_score}/100 • 
                        Capital: {formatCurrency(results.recommendation.capital_required)} • 
                        Timeline: {results.recommendation.timeline_months} months
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* All Results */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.results.map((country, idx) => (
                <Card 
                  key={country.country_code} 
                  className={`card-hover ${idx === 0 ? 'border-secondary/50' : ''}`}
                  data-testid={`country-${country.country_code}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">{GCC_FLAGS[country.country_code]}</span>
                      <div>
                        <h4 className="font-heading font-semibold">{country.country_name}</h4>
                        <p className="text-sm text-muted-foreground">#{idx + 1} Match</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Match Score</span>
                        <span className="font-medium">{country.total_score}/100</span>
                      </div>
                      <Progress value={country.total_score} className="h-2" />
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span>Capital: {formatCurrency(country.capital_required)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>Timeline: {country.timeline_months} months</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                        <span>Profit Margin: {Math.round(country.profit_margin * 100)}%</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {country.benefits.tax_free && (
                        <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs">Tax Free</span>
                      )}
                      {country.benefits.golden_visa && (
                        <span className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-xs">Golden Visa</span>
                      )}
                      {country.benefits.medical_tourism && (
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">Medical Tourism</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => { setStep(1); setResults(null); }}>
                Start Over
              </Button>
              <Button className="btn-primary-pill">
                <Download className="w-4 h-4 mr-2" />
                Download Report
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
