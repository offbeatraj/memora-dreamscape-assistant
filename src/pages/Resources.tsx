
import React from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import QuestionGenerator from '@/components/QuestionGenerator';

const Resources: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-memora-purple" />
                Alzheimer's Resources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Find helpful resources and information about Alzheimer's disease.
              </p>
              {/* Add links or sections for resources */}
              <ul className="space-y-2">
                <li>
                  <a 
                    href="https://www.alz.org/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-memora-purple hover:underline"
                  >
                    Alzheimer's Association
                  </a>
                </li>
                <li>
                  <a 
                    href="https://www.nia.nih.gov/health/alzheimers-disease-resources-patients-and-caregivers" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-memora-purple hover:underline"
                  >
                    NIH Alzheimer's Resources
                  </a>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-memora-purple" />
                Question Generator
              </CardTitle>
            </CardHeader>
            <CardContent>
              <QuestionGenerator />
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Resources;
