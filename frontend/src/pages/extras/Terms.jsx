import React from "react";
import siteConfig from "../../config/site.config";

const TermsPrivacy = () => {
  const { termsPrivacy } = siteConfig;

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Terms & Privacy
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl leading-relaxed">
            Learn about our terms of service and how we handle your privacy.
          </p>
          <div className="w-20 h-1 bg-gray-900 mt-6"></div>
          <p className="text-sm text-gray-400 mt-4">
            Last Updated: {termsPrivacy.lastUpdated || "January 1, 2024"}
          </p>
        </div>

        <div className="space-y-12">
          {/* Terms of Service */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Terms of Service
            </h2>
            <div className="space-y-6 text-gray-700 leading-relaxed">
              {termsPrivacy.terms?.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </section>

          {/* Privacy Policy */}
          <section className="border-t border-gray-200 pt-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Privacy Policy
            </h2>
            <div className="space-y-6 text-gray-700 leading-relaxed">
              {termsPrivacy.privacy?.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </section>

          {/* Data Collection */}
          {termsPrivacy.dataCollection && (
            <section className="border-t border-gray-200 pt-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Data Collection & Usage
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {termsPrivacy.dataCollection.map((item, index) => (
                  <div key={index} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Cookies */}
          {termsPrivacy.cookies && (
            <section className="border-t border-gray-200 pt-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Cookies
              </h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                {termsPrivacy.cookies.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </section>
          )}

          {/* Your Rights */}
          {termsPrivacy.yourRights && (
            <section className="border-t border-gray-200 pt-10">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Your Rights
              </h2>
              <ul className="space-y-3 text-gray-700">
                {termsPrivacy.yourRights.map((right, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-gray-900 mt-1">•</span>
                    <span>{right}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Contact for Privacy */}
          {termsPrivacy.privacyContact && (
            <section className="border-t border-gray-200 pt-10">
              <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Privacy Questions?
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {termsPrivacy.privacyContact}
                </p>
              </div>
            </section>
          )}

          {/* Effective Date */}
          <div className="border-t border-gray-200 pt-10">
            <p className="text-sm text-gray-400">
              This policy is effective as of {termsPrivacy.effectiveDate || "January 1, 2024"}.
              We reserve the right to update this policy at any time. Please check back regularly for changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPrivacy;