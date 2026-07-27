import React from "react";
import siteConfig from "../../config/site.config";

const About = () => {
  const { about } = siteConfig;

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            {about.heading}
          </h1>
          {about.subheading && (
            <p className="text-xl text-gray-600 max-w-2xl leading-relaxed">
              {about.subheading}
            </p>
          )}
          <div className="w-20 h-1 bg-gray-900 mt-6"></div>
        </div>

        {/* About Text */}
        <div className="space-y-6 text-gray-700 leading-relaxed text-lg mb-16">
          {about.paragraphs.map((para, i) => (
            <p key={i} className="first:mt-0">
              {para}
            </p>
          ))}
        </div>

        {/* What We Offer */}
        {about.services && about.services.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-semibold text-gray-900 mb-8">
              What We Offer
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {about.services.map((service, index) => (
                <div 
                  key={index} 
                  className="group p-6 bg-gray-50 border border-gray-200 rounded-lg hover:border-gray-400 hover:bg-gray-100 transition-all duration-200"
                >
                  <div className="text-base font-medium text-gray-900 group-hover:text-gray-700 transition-colors">
                    {service.name}
                  </div>
                  <div className="text-sm text-gray-600 mt-2 leading-relaxed">
                    {service.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Why Choose Us */}
        {about.features && about.features.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-semibold text-gray-900 mb-8">
              Why Choose Us
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {about.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
                      <svg 
                        className="w-4 h-4 text-white" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth="2.5" 
                          d="M5 13l4 4L19 7" 
                        />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <div className="text-base font-medium text-gray-900">
                      {feature.title}
                    </div>
                    <div className="text-sm text-gray-600 mt-1 leading-relaxed">
                      {feature.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mission */}
        {about.missionTitle && about.missionText && (
          <div className="mb-16">
            <div className="bg-gray-900 p-8 sm:p-10 rounded-lg">
              <h3 className="text-2xl font-semibold text-white mb-3">
                {about.missionTitle}
              </h3>
              <p className="text-gray-300 text-lg leading-relaxed max-w-3xl">
                {about.missionText}
              </p>
            </div>
          </div>
        )}

        {/* CTA */}
        {about.cta && (
          <div className="text-center pt-4">
            <a
              href={about.cta.link}
              className="inline-block px-10 py-4 bg-gray-900 text-white text-base font-medium hover:bg-gray-800 transition-colors rounded-lg"
            >
              {about.cta.text}
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default About;