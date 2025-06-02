
import { ArrowRight, Sparkles, Users, Zap, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const handleNewsletterSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast({
        title: "Welcome aboard! 🎉",
        description: "Thank you for joining our community. We'll be in touch soon!",
      });
      setEmail("");
    }
  };

  const features = [
    {
      icon: <Sparkles className="h-8 w-8 text-purple-500" />,
      title: "Beautiful Design",
      description: "Crafted with attention to detail and modern aesthetics"
    },
    {
      icon: <Zap className="h-8 w-8 text-blue-500" />,
      title: "Lightning Fast",
      description: "Optimized for speed and performance across all devices"
    },
    {
      icon: <Users className="h-8 w-8 text-green-500" />,
      title: "Community Driven",
      description: "Built by the community, for the community"
    },
    {
      icon: <Heart className="h-8 w-8 text-red-500" />,
      title: "Made with Love",
      description: "Every pixel is crafted with care and passion"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-blue-400/20 backdrop-blur-3xl"></div>
        <div className="relative container mx-auto px-4 py-24 text-center">
          <div className="animate-fade-in-up">
            <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-6">
              Welcome
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Step into a world of endless possibilities. Your journey to something amazing starts here.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-full transition-all duration-300 transform hover:scale-105">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="px-8 py-3 rounded-full border-2 border-purple-200 hover:border-purple-300 transition-all duration-300">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Why Choose Us?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover what makes our platform special and why thousands of users love what we do.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-3 bg-gray-50 rounded-full w-fit">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl font-semibold text-gray-800">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-gray-600">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 py-20">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Stay in the Loop
          </h3>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Be the first to know about new features, updates, and exclusive content.
          </p>
          
          <form onSubmit={handleNewsletterSignup} className="max-w-md mx-auto flex flex-col sm:flex-row gap-4">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-4 py-3 rounded-full border-0 bg-white/90 backdrop-blur-sm focus:bg-white transition-all duration-300"
              required
            />
            <Button 
              type="submit"
              className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105"
            >
              Subscribe
            </Button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600">
            Made with <Heart className="inline h-4 w-4 text-red-500 mx-1" /> for amazing people like you.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            © 2024 Welcome App. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
