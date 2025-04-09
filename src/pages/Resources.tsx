
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Book, ExternalLink, BookOpen, Info, Users, Brain, Link as LinkIcon } from "lucide-react";

export default function Resources() {
  const resources = [
    {
      title: "Understanding Alzheimer's Disease",
      description: "Learn about the causes, symptoms, and progression of Alzheimer's disease.",
      icon: <Info className="h-5 w-5" />,
      link: "https://www.alz.org/alzheimers-dementia/what-is-alzheimers",
    },
    {
      title: "Caregiver Resources",
      description: "Practical tips and support for those caring for someone with Alzheimer's.",
      icon: <Users className="h-5 w-5" />,
      link: "https://www.nia.nih.gov/health/alzheimers/caregiving",
    },
    {
      title: "Brain Health",
      description: "Activities and lifestyle changes that may help maintain cognitive function.",
      icon: <Brain className="h-5 w-5" />,
      link: "https://www.nia.nih.gov/health/cognitive-health",
    },
    {
      title: "Research & Clinical Trials",
      description: "Latest research developments and opportunities to participate in studies.",
      icon: <BookOpen className="h-5 w-5" />,
      link: "https://www.alz.org/alzheimers-dementia/research_progress/clinical-trials",
    },
    {
      title: "Support Groups",
      description: "Connect with others who understand what you're going through.",
      icon: <Users className="h-5 w-5" />,
      link: "https://www.alz.org/help-support/community/support-groups",
    },
    {
      title: "Memory Techniques",
      description: "Strategies to help cope with memory challenges.",
      icon: <LinkIcon className="h-5 w-5" />,
      link: "https://www.nia.nih.gov/health/memory-forgetfulness-and-aging-whats-normal-and-whats-not",
    },
  ];

  const articles = [
    {
      title: "Daily Routines for Alzheimer's Patients",
      excerpt: "Establishing consistent daily routines can help reduce anxiety and confusion...",
    },
    {
      title: "Communication Tips for Caregivers",
      excerpt: "Effective communication strategies when interacting with someone with memory loss...",
    },
    {
      title: "Creating a Safe Home Environment",
      excerpt: "Simple modifications to make your home safer for someone with Alzheimer's...",
    },
    {
      title: "Managing Behavioral Changes",
      excerpt: "Understanding and responding to changes in behavior and mood...",
    },
  ];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Book className="h-5 w-5 text-memora-purple" />
            <h1 className="text-2xl font-bold">Alzheimer's Resources</h1>
          </div>
          <p className="text-muted-foreground mb-6">
            Find helpful information, articles, and external resources about Alzheimer's disease.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-md transition-shadow glass-card">
                <CardHeader className="bg-memora-purple/10 pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <span className="bg-memora-purple text-white p-1 rounded">
                      {resource.icon}
                    </span>
                    <span>{resource.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-muted-foreground mb-4">{resource.description}</p>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a href={resource.link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1">
                      Visit Resource
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <h2 className="text-2xl font-bold mt-16 mb-6">Helpful Articles</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {articles.map((article, index) => (
              <Card key={index} className="glass-card hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-2">{article.title}</h3>
                  <p className="text-muted-foreground mb-4">{article.excerpt}</p>
                  <Button variant="link" className="p-0 text-memora-purple">
                    Read full article
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Card className="mt-12 glass-card">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">Emergency Resources</h2>
              <p className="mb-4">
                If you or someone you know is experiencing a medical emergency, 
                please call your local emergency number immediately.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/70 p-4 rounded-lg">
                  <h3 className="font-medium mb-1">Alzheimer's Association Helpline</h3>
                  <p className="text-sm mb-1">24/7 support and information</p>
                  <p className="font-semibold">1-800-272-3900</p>
                </div>
                <div className="bg-white/70 p-4 rounded-lg">
                  <h3 className="font-medium mb-1">Crisis Text Line</h3>
                  <p className="text-sm mb-1">Text HOME to 741741</p>
                  <p className="font-semibold">Available 24/7</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
