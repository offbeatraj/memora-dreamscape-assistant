
import React from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import PatientManager from '@/components/PatientManager';

const PatientList: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-6 w-6 text-memora-purple" />
              Patient Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PatientManager />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PatientList;
