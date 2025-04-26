import { useAuth } from '@/hooks/useAuth';
import ScanCTA from '@/components/ScanCTA';

// UI Components
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { ArrowRight, BarChart2, Shield, Zap } from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-background to-muted py-20">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Advanced Website Scanner <span className="text-primary">Powered by AI</span>
              </h1>
              
              <p className="text-xl text-muted-foreground">
                Analyze websites, detect optimization opportunities, and track performance against competitors with our intelligent scanner.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg">
                  <Link href="/scan-wizard">
                    Start Scanning
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                
                <Button variant="outline" asChild size="lg">
                  <Link href="/scans">
                    View Past Scans
                  </Link>
                </Button>
              </div>
            </div>
            
            <div className="mt-8 lg:mt-0">
              <ScanCTA />
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Powerful Scanning Features</h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              Our advanced scanner provides comprehensive insights to help you optimize your web presence
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card rounded-lg p-6 shadow-sm border">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Performance Analysis</h3>
              <p className="text-muted-foreground">
                Get detailed insights on page loading speed, resource usage, and user experience factors.
              </p>
            </div>
            
            <div className="bg-card rounded-lg p-6 shadow-sm border">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Security Assessment</h3>
              <p className="text-muted-foreground">
                Identify potential vulnerabilities, outdated dependencies, and security best practices.
              </p>
            </div>
            
            <div className="bg-card rounded-lg p-6 shadow-sm border">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <BarChart2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Competitor Insights</h3>
              <p className="text-muted-foreground">
                Compare your site against competitors with side-by-side metrics and opportunity analysis.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-muted">
        <div className="container max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to analyze your website?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Get started with a free scan and discover how to optimize your web presence
          </p>
          
          <Button asChild size="lg">
            <Link href="/scan-wizard">
              Start Scanning Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}