import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  CheckCircle2, 
  Globe2, 
  DollarSign, 
  Shield, 
  TrendingUp,
  Play,
  Star,
  Users,
  Building2,
  Stethoscope,
  MapPin,
  ChevronRight
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

const stats = [
  { value: '$200B+', label: 'GCC Healthcare Market' },
  { value: '60-80%', label: 'Achievable Profit Margins' },
  { value: '0%', label: 'Corporate Tax (UAE Free Zones)' },
  { value: '3-6mo', label: 'UAE Licensing Timeline' },
];

const benefits = [
  {
    icon: DollarSign,
    title: 'Higher Profit Margins',
    description: 'Achieve 60-80% margins vs. 35-45% in the US. Premium pricing, lower overhead.',
  },
  {
    icon: Shield,
    title: 'Tax Optimization',
    description: 'Zero corporate tax in UAE free zones. Save $100K+ annually in taxes.',
  },
  {
    icon: Globe2,
    title: 'Golden Visa Access',
    description: 'Healthcare professionals qualify for 10-year residency visas in UAE.',
  },
  {
    icon: TrendingUp,
    title: 'Market Growth',
    description: '8-12% annual growth. Vision 2030 driving $64B in Saudi healthcare investment.',
  },
];

const curriculum = [
  { week: 1, title: 'Market Analysis & Self-Assessment', status: 'available' },
  { week: 2, title: 'Entity Formation & Legal Structures', status: 'available' },
  { week: 3, title: 'Licensing & Regulatory Requirements', status: 'available' },
  { week: 4, title: 'Financial Planning & Modeling', status: 'locked' },
  { week: 5, title: 'Facility Design & Setup', status: 'locked' },
  { week: 6, title: 'Equipment & Technology', status: 'locked' },
];

const testimonials = [
  {
    name: 'Dr. Sarah Mitchell',
    role: 'Family Medicine, Dubai',
    image: 'https://images.pexels.com/photos/5452228/pexels-photo-5452228.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
    quote: 'Within 8 months of completing the course, I launched my clinic in Dubai Healthcare City. My margins are 2x what I was making in Texas.',
  },
  {
    name: 'Dr. Michael Chen',
    role: 'Orthopedic Surgery, Riyadh',
    image: 'https://images.pexels.com/photos/8376277/pexels-photo-8376277.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
    quote: 'The regulatory roadmap alone saved me 6 months of trial and error. Vision 2030 is creating incredible opportunities.',
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const [showVideo, setShowVideo] = useState(false);

  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-background" data-testid="landing-page">
      {/* Hero Section */}
      <section className="relative hero-gradient text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 pattern-mashrabiya opacity-30"></div>
        
        {/* Navigation */}
        <nav className="relative z-10 container-main py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <span className="font-heading font-bold text-xl">GCC Medical Launch</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-white/80 hover:text-white transition-colors" data-testid="login-link">
                Sign In
              </Link>
              <Button 
                onClick={handleGoogleLogin}
                className="btn-luxury"
                data-testid="get-started-btn"
              >
                Get Started
              </Button>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 container-main py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm mb-6">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                <span className="text-sm">12-Week Comprehensive Program</span>
              </div>
              
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Launch Your Medical Practice in the 
                <span className="text-secondary"> Middle East</span>
              </h1>
              
              <p className="text-lg text-white/80 mb-8 max-w-xl">
                Transform your healthcare expertise into a thriving GCC practice. 
                Master licensing, regulations, and operations in UAE, Saudi Arabia, 
                Qatar, and beyond.
              </p>

              <div className="flex flex-wrap gap-4 mb-12">
                <Button 
                  onClick={handleGoogleLogin}
                  size="lg"
                  className="btn-luxury text-lg h-14 px-8"
                  data-testid="hero-cta-btn"
                >
                  Start Your Journey
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-14 px-8"
                  onClick={() => setShowVideo(true)}
                  data-testid="watch-video-btn"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Watch Overview
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center gap-6 text-sm text-white/60">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-secondary" />
                  <span>Expert-Led Curriculum</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-secondary" />
                  <span>Lifetime Access</span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 animate-slide-up delay-200">
              {stats.map((stat, index) => (
                <div 
                  key={stat.label}
                  className="glass p-6 rounded-2xl text-center hover:scale-105 transition-transform"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="text-3xl lg:text-4xl font-heading font-bold text-primary mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(48 20% 98%)"/>
          </svg>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 pattern-geo" data-testid="benefits-section">
        <div className="container-main">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Why Launch in the GCC?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The Gulf region offers unparalleled opportunities for healthcare entrepreneurs
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <Card 
                key={benefit.title}
                className="card-hover border-border/50 group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-secondary/20 transition-colors">
                    <benefit.icon className="w-6 h-6 text-primary group-hover:text-secondary transition-colors" />
                  </div>
                  <h3 className="font-heading font-semibold text-lg mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground text-sm">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Curriculum Preview */}
      <section className="py-24 bg-muted/30" data-testid="curriculum-section">
        <div className="container-main">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-heading text-3xl lg:text-4xl font-bold text-foreground mb-4">
                12-Week Comprehensive Curriculum
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                From market analysis to launch day, every step of your GCC practice journey is covered.
              </p>

              <div className="space-y-3">
                {curriculum.map((item) => (
                  <div 
                    key={item.week}
                    className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${
                      item.status === 'available' 
                        ? 'bg-white border border-border/50 hover:border-secondary/30' 
                        : 'bg-muted/50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-heading font-bold ${
                      item.status === 'available' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                    }`}>
                      {item.week}
                    </div>
                    <span className={item.status === 'locked' ? 'text-muted-foreground' : ''}>
                      {item.title}
                    </span>
                    {item.status === 'available' && (
                      <CheckCircle2 className="w-5 h-5 text-accent ml-auto" />
                    )}
                  </div>
                ))}
              </div>

              <Button 
                className="mt-8 btn-primary-pill"
                onClick={handleGoogleLogin}
                data-testid="view-full-curriculum-btn"
              >
                View Full Curriculum
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {/* Image */}
            <div className="relative">
              <img 
                src="https://images.pexels.com/photos/3848412/pexels-photo-3848412.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Dubai Skyline"
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <div className="font-heading font-bold text-2xl">6</div>
                    <div className="text-sm text-muted-foreground">GCC Countries Covered</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24" data-testid="testimonials-section">
        <div className="container-main">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Success Stories
            </h2>
            <p className="text-lg text-muted-foreground">
              Healthcare professionals who transformed their careers
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={testimonial.name} className="card-hover">
                <CardContent className="p-8">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-secondary text-secondary" />
                    ))}
                  </div>
                  <p className="text-lg mb-6 italic">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-4">
                    <img 
                      src={testimonial.image} 
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-heading font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 hero-gradient text-white relative overflow-hidden" data-testid="cta-section">
        <div className="absolute inset-0 pattern-mashrabiya opacity-20"></div>
        <div className="container-main relative z-10 text-center">
          <h2 className="font-heading text-3xl lg:text-4xl font-bold mb-6">
            Ready to Launch Your GCC Practice?
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Join healthcare professionals who are building profitable practices 
            in the world's fastest-growing healthcare market.
          </p>
          <Button 
            size="lg"
            className="btn-luxury text-lg h-14 px-10"
            onClick={handleGoogleLogin}
            data-testid="final-cta-btn"
          >
            Start Your Journey Today
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-white py-12">
        <div className="container-main">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <span className="font-heading font-bold">GCC Medical Launch Academy</span>
            </div>
            <div className="text-white/60 text-sm">
              © 2025 GCC Medical Launch. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
