import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Star, Clock } from "lucide-react";

const FeaturedSubscriptions = ({ subscriptions, currency }) => {
  if (!subscriptions || subscriptions.length === 0) return null;

  // Filter active and popular subscriptions, or just show first 8
  const featuredSubscriptions = subscriptions
    .filter(sub => sub.isActive !== false)
    .slice(0, 8);

  // Get duration label from variants
  const getDurationLabel = (subscription) => {
    if (subscription.variants && subscription.variants.length > 0) {
      const durations = subscription.variants.map(v => v.durationLabel || v.label);
      if (durations.length === 1) {
        return durations[0];
      }
      return `${durations.length} Plans`;
    }
    return subscription.duration || "Flexible";
  };

  // Get display price
  const getDisplayPrice = (subscription) => {
    if (subscription.variants && subscription.variants.length > 0) {
      const prices = subscription.variants.map(v => v.price);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      if (min === max) {
        return `${currency}${min}`;
      }
      return `${currency}${min} - ${currency}${max}`;
    }
    return `${currency}${subscription.price || 0}`;
  };

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 sm:mb-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Popular Subscriptions
            </h2>
            <p className="text-sm sm:text-base text-gray-500 mt-1">
              Premium gaming and entertainment subscriptions
            </p>
          </div>
          <Link 
            to="/collection/subscriptions" 
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            View All
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
          {featuredSubscriptions.map((subscription) => {
            const displayPrice = getDisplayPrice(subscription);
            const durationLabel = getDurationLabel(subscription);
            const hasVariants = subscription.variants && subscription.variants.length > 1;

            return (
              <Link
                key={subscription._id}
                to={`/subscription/${subscription._id}`}
                className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all duration-200"
              >
                {/* Image */}
                <div className="relative aspect-square bg-gray-50 overflow-hidden">
                  {subscription.images?.[0]?.secure_url ? (
                    <img
                      src={subscription.images[0].secure_url}
                      alt={subscription.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
                      No image
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {subscription.isPopular && (
                      <span className="px-2 py-0.5 bg-black text-white text-[10px] font-semibold rounded">
                        POPULAR
                      </span>
                    )}
                  </div>

                  {/* Duration */}
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-white/90 backdrop-blur-sm text-[10px] font-medium text-gray-700 rounded border border-gray-200 flex items-center gap-1">
                    {durationLabel}
                  </div>
                </div>

                {/* Content */}
                <div className="p-3 sm:p-4">
                  {/* Provider */}
                  {subscription.provider && (
                    <p className="text-[10px] sm:text-xs font-medium text-gray-400 uppercase tracking-wider truncate">
                      {subscription.provider}
                    </p>
                  )}

                  {/* Name */}
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate mt-0.5">
                    {subscription.name}
                  </h3>

                  {/* Features */}
                  {subscription.features && subscription.features.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {subscription.features.slice(0, 2).map((feature, idx) => (
                        <span 
                          key={idx} 
                          className="text-[9px] sm:text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded"
                        >
                          {feature}
                        </span>
                      ))}
                      {subscription.features.length > 2 && (
                        <span className="text-[9px] sm:text-[10px] text-gray-400">
                          +{subscription.features.length - 2}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Price */}
                  <p className="text-base sm:text-lg font-bold text-gray-900 mt-1.5">
                    {displayPrice}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* CTA */}
        {subscriptions.length > 8 && (
          <div className="text-center mt-10 sm:mt-12">
            <Link
              to="/collection/subscriptions"
              className="inline-flex items-center gap-2 px-8 py-3 bg-gray-900 text-white font-medium rounded hover:bg-gray-800 transition-colors"
            >
              Browse All Subscriptions
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedSubscriptions;