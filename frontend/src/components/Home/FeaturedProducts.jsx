import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Star, Zap } from "lucide-react";

const FeaturedProducts = ({ products, currency }) => {
  if (!products || products.length === 0) return null;

  const featuredProducts = products.slice(0, 12);

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 sm:mb-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Featured Products
            </h2>
            <p className="text-sm sm:text-base text-gray-500 mt-1">
              Popular in-game items and subscriptions
            </p>
          </div>
          <Link
            to="/collection"
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            View All
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {featuredProducts.map((product) => {
            const hasVariants =
              product.pricingType === "variants" &&
              product.variants?.length > 0;

            // Get display price
            let displayPrice = `${currency}${product.price}`;
            if (hasVariants) {
              const prices = product.variants.map((v) => v.price);
              const min = Math.min(...prices);
              const max = Math.max(...prices);
              displayPrice =
                min === max
                  ? `${currency}${min}`
                  : `${currency}${min} - ${currency}${max}`;
            }

            // Check if product is new or popular
            const isNew =
              product.createdAt &&
              new Date(product.createdAt) >
                new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            const isPopular = product.rating && product.rating >= 4.5;

            return (
              <Link
                key={product._id}
                to={`/product/${product._id}`}
                className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all duration-200"
              >
                {/* Image */}
                <div className="relative aspect-square bg-gray-50 overflow-hidden">
                  {product.images?.[0]?.secure_url ? (
                    <img
                      src={product.images[0].secure_url}
                      alt={product.name}
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
                    {isNew && (
                      <span className="px-2 py-0.5 bg-gray-900 text-white text-[10px] font-medium rounded">
                        NEW
                      </span>
                    )}
                    {isPopular && (
                      <span className="px-2 py-0.5 bg-yellow-500 text-white text-[10px] font-medium rounded">
                        POPULAR
                      </span>
                    )}
                  </div>

                  {hasVariants && (
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-white/90 backdrop-blur-sm text-[10px] font-medium text-gray-700 rounded border border-gray-200">
                      {product.variants.length} variants
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-3 sm:p-4">
                  {/* Game Name */}
                  {product.game && (
                    <p className="text-[10px] sm:text-xs font-medium text-gray-400 uppercase tracking-wider">
                      {product.game}
                    </p>
                  )}

                  {/* Product Name */}
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate mt-0.5">
                    {product.name}
                  </h3>

                  {/* Rating */}
                  {product.rating && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-medium text-gray-700">
                        {product.rating}
                      </span>
                      {product.reviewsCount && (
                        <span className="text-xs text-gray-400">
                          ({product.reviewsCount})
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

        {/* Bottom CTA */}
        <div className="text-center mt-10 sm:mt-12">
          <Link
            to="/collection"
            className="inline-flex items-center gap-2 px-8 py-3 bg-gray-900 text-white font-medium rounded hover:bg-gray-800 transition-colors"
          >
            Browse All Products
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
