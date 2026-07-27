import React from "react";
import { Zap, Shield, Gamepad2, Headphones } from "lucide-react";

const WhyChooseUs = () => {
  const features = [
    { 
      icon: Zap, 
      title: "Instant Delivery", 
      desc: "Get your items within minutes" 
    },
    { 
      icon: Shield, 
      title: "Secure Payments", 
      desc: "Verified & safe transactions" 
    },
    { 
      icon: Gamepad2, 
      title: "All Games", 
      desc: "PUBG, Free Fire, MLBB & more" 
    },
    { 
      icon: Headphones, 
      title: "24/7 Support", 
      desc: "We're here to help you" 
    },
  ];

  return (
    <section className="py-12 border-t border-gray-200">
      <h2 className="text-2xl font-semibold text-gray-900 text-center mb-8">
        Why Choose Us
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {features.map((feature) => (
          <div key={feature.title} className="text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <feature.icon className="w-6 h-6 text-gray-700" />
            </div>
            <h4 className="font-medium text-gray-900">{feature.title}</h4>
            <p className="text-sm text-gray-500 mt-1">{feature.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WhyChooseUs;