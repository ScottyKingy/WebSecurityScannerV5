import { useState } from 'react';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// UI Components
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

// Form validation schema
const urlSchema = z.object({
  url: z
    .string()
    .min(1, 'URL is required')
    .refine(
      (url) => url.includes('http') && url.includes('.'),
      'Please enter a full domain URL (e.g., https://example.com)'
    ),
});

type UrlFormValues = z.infer<typeof urlSchema>;

export default function ScanCTA() {
  const [, navigate] = useLocation();
  
  // Form setup
  const form = useForm<UrlFormValues>({
    resolver: zodResolver(urlSchema),
    defaultValues: {
      url: '',
    },
  });
  
  // Form submission
  const onSubmit = (data: UrlFormValues) => {
    navigate(`/scan-wizard?url=${encodeURIComponent(data.url)}`);
    
    // Optionally, you can track this CTA usage
    try {
      // Store last used domain in localStorage
      localStorage.setItem('lastScanTarget', data.url);
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  };
  
  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle>Website AI Scanner</CardTitle>
        <CardDescription>
          Scan any website for insights and optimization opportunities
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input 
                          placeholder="https://example.com" 
                          {...field} 
                        />
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon" 
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                              >
                                <HelpCircle className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Enter a complete URL including http:// or https:// prefix
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      
                      <Button type="submit">
                        Start Free AI Scan
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                  <FormDescription>
                    Enter any website URL to analyze its performance and SEO
                  </FormDescription>
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}