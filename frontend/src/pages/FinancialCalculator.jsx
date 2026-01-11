import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  TrendingUp, 
  DollarSign, 
  Users,
  Building2,
  PieChart,
  Download,
  CheckCircle2
} from 'lucide-react';
import { DashboardLayout } from '../components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Slider } from '../components/ui/slider';
import { fetchApi, formatCurrency, formatNumber, GCC_FLAGS } from '../lib/utils';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

const practiceTypes = [
  { value: 'mobile', label: 'Mobile Healthcare' },
  { value: 'clinic', label: 'Small Clinic' },
  { value: 'multi_specialty', label: 'Multi-Specialty Center' },
  { value: 'surgery_center', label: 'Surgery Center' },
];

const countries = [
  { value: 'uae', label: 'United Arab Emirates', flag: '🇦🇪' },
  { value: 'saudi', label: 'Saudi Arabia', flag: '🇸🇦' },
  { value: 'qatar', label: 'Qatar', flag: '🇶🇦' },
  { value: 'bahrain', label: 'Bahrain', flag: '🇧🇭' },
  { value: 'kuwait', label: 'Kuwait', flag: '🇰🇼' },
  { value: 'oman', label: 'Oman', flag: '🇴🇲' },
];

export default function FinancialCalculator({ user }) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [inputs, setInputs] = useState({
    practice_type: 'clinic',
    country: 'uae',
    staff_count: 5,
    monthly_patients: 200,
    average_revenue_per_visit: 200,
  });

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const response = await fetchApi('/tools/financial-calculator', {
        method: 'POST',
        body: JSON.stringify(inputs),
      });
      setResults(response);
    } catch (error) {
      toast.error('Failed to calculate financials');
    } finally {
      setLoading(false);
    }
  };

  const selectedCountry = countries.find(c => c.value === inputs.country);

  return (
    <DashboardLayout user={user}>
      <div className="p-8" data-testid="financial-calculator-page">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link to="/tools" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tools
          </Link>
        </div>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center">
            <TrendingUp className="w-7 h-7 text-accent" />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">
              Financial Calculator
            </h1>
            <p className="text-muted-foreground">
              Project startup costs, expenses, and revenue for your GCC practice
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Input Form */}
          <Card className="lg:col-span-1" data-testid="input-form">
            <CardHeader>
              <CardTitle className="font-heading">Practice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Target Country</Label>
                <Select value={inputs.country} onValueChange={(v) => setInputs({ ...inputs, country: v })}>
                  <SelectTrigger data-testid="country-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.value} value={country.value}>
                        <span className="flex items-center gap-2">
                          <span>{country.flag}</span>
                          {country.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Practice Type</Label>
                <Select value={inputs.practice_type} onValueChange={(v) => setInputs({ ...inputs, practice_type: v })}>
                  <SelectTrigger data-testid="practice-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {practiceTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label>Staff Count</Label>
                  <span className="font-heading font-bold text-primary">{inputs.staff_count}</span>
                </div>
                <Slider
                  value={[inputs.staff_count]}
                  onValueChange={([v]) => setInputs({ ...inputs, staff_count: v })}
                  min={1}
                  max={50}
                  step={1}
                  data-testid="staff-slider"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label>Monthly Patients</Label>
                  <span className="font-heading font-bold text-primary">{formatNumber(inputs.monthly_patients)}</span>
                </div>
                <Slider
                  value={[inputs.monthly_patients]}
                  onValueChange={([v]) => setInputs({ ...inputs, monthly_patients: v })}
                  min={50}
                  max={1000}
                  step={10}
                  data-testid="patients-slider"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label>Avg Revenue per Visit</Label>
                  <span className="font-heading font-bold text-primary">{formatCurrency(inputs.average_revenue_per_visit)}</span>
                </div>
                <Slider
                  value={[inputs.average_revenue_per_visit]}
                  onValueChange={([v]) => setInputs({ ...inputs, average_revenue_per_visit: v })}
                  min={50}
                  max={1000}
                  step={10}
                  data-testid="revenue-slider"
                />
              </div>

              <Button 
                onClick={handleCalculate}
                className="w-full btn-luxury"
                disabled={loading}
                data-testid="calculate-btn"
              >
                {loading ? 'Calculating...' : 'Calculate Projections'}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="lg:col-span-2 space-y-6">
            {results ? (
              <>
                {/* Key Metrics */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="key-metrics">
                  <Card className="bg-primary text-white">
                    <CardContent className="p-4">
                      <DollarSign className="w-8 h-8 mb-2 opacity-80" />
                      <div className="text-2xl font-heading font-bold">
                        {formatCurrency(results.startup_costs.total)}
                      </div>
                      <div className="text-sm text-white/70">Startup Capital</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-accent text-white">
                    <CardContent className="p-4">
                      <TrendingUp className="w-8 h-8 mb-2 opacity-80" />
                      <div className="text-2xl font-heading font-bold">
                        {formatCurrency(results.monthly_revenue)}
                      </div>
                      <div className="text-sm text-white/70">Monthly Revenue</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-secondary text-white">
                    <CardContent className="p-4">
                      <PieChart className="w-8 h-8 mb-2 opacity-80" />
                      <div className="text-2xl font-heading font-bold">
                        {results.profit_margin}%
                      </div>
                      <div className="text-sm text-white/70">Profit Margin</div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-accent">
                    <CardContent className="p-4">
                      <CheckCircle2 className="w-8 h-8 mb-2 text-accent" />
                      <div className="text-2xl font-heading font-bold text-accent">
                        {results.break_even_months ? `${results.break_even_months} mo` : 'N/A'}
                      </div>
                      <div className="text-sm text-muted-foreground">Break-even</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts Row */}
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Startup Costs Breakdown */}
                  <Card data-testid="startup-costs-chart">
                    <CardHeader>
                      <CardTitle className="font-heading text-lg">Startup Costs Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={[
                              { name: 'Licensing', value: results.startup_costs.licensing_fees },
                              { name: 'Facility', value: results.startup_costs.facility_setup },
                              { name: 'Equipment', value: results.startup_costs.equipment },
                              { name: 'Inventory', value: results.startup_costs.initial_inventory },
                              { name: 'Working Cap', value: results.startup_costs.working_capital },
                              { name: 'Legal', value: results.startup_costs.legal_professional },
                            ]}
                            layout="vertical"
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
                            <YAxis type="category" dataKey="name" width={80} />
                            <Tooltip formatter={(v) => formatCurrency(v)} />
                            <Bar dataKey="value" fill="hsl(224, 64%, 33%)" radius={4} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Monthly Expenses */}
                  <Card data-testid="monthly-expenses-chart">
                    <CardHeader>
                      <CardTitle className="font-heading text-lg">Monthly Expenses</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={[
                              { name: 'Staff', value: results.monthly_expenses.staff },
                              { name: 'Rent', value: results.monthly_expenses.rent },
                              { name: 'Utilities', value: results.monthly_expenses.utilities },
                              { name: 'Supplies', value: results.monthly_expenses.supplies },
                              { name: 'Marketing', value: results.monthly_expenses.marketing },
                              { name: 'Misc', value: results.monthly_expenses.miscellaneous },
                            ]}
                            layout="vertical"
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
                            <YAxis type="category" dataKey="name" width={80} />
                            <Tooltip formatter={(v) => formatCurrency(v)} />
                            <Bar dataKey="value" fill="hsl(175, 84%, 32%)" radius={4} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 3-Year Projections */}
                <Card data-testid="projections-chart">
                  <CardHeader>
                    <CardTitle className="font-heading text-lg">3-Year Revenue & Profit Projections</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={results.projections}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="year" tickFormatter={(v) => `Year ${v}`} />
                          <YAxis tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
                          <Tooltip formatter={(v) => formatCurrency(v)} />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke="hsl(224, 64%, 33%)" 
                            strokeWidth={3}
                            name="Revenue"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="profit" 
                            stroke="hsl(175, 84%, 32%)" 
                            strokeWidth={3}
                            name="Profit"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Tax Advantage */}
                <Card className="border-secondary/30 bg-secondary/5" data-testid="tax-advantage">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center">
                        <DollarSign className="w-7 h-7 text-secondary" />
                      </div>
                      <div>
                        <h3 className="font-heading text-xl font-bold">Tax Advantage</h3>
                        <p className="text-muted-foreground">
                          Operating in {selectedCountry?.label} with {results.tax_advantage.gcc_tax_rate}% corporate tax 
                          vs. {results.tax_advantage.us_equivalent_tax_rate}% in the US
                        </p>
                      </div>
                      <div className="ml-auto text-right">
                        <div className="text-3xl font-heading font-bold text-secondary">
                          {formatCurrency(results.tax_advantage.annual_tax_savings)}
                        </div>
                        <div className="text-sm text-muted-foreground">Annual Tax Savings</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setResults(null)}>
                    Reset Calculator
                  </Button>
                  <Button className="btn-primary-pill">
                    <Download className="w-4 h-4 mr-2" />
                    Download Financial Model
                  </Button>
                </div>
              </>
            ) : (
              <Card className="h-full flex items-center justify-center min-h-[400px]">
                <CardContent className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold mb-2">
                    Ready to crunch the numbers?
                  </h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    Enter your practice details on the left to generate comprehensive 
                    financial projections for your GCC medical practice.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
