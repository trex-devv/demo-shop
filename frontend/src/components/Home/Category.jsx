import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Category = ({ categories }) => {
  if (categories.length === 0) return null;

  return (
    <section className="py-16 border-t border-gray-100">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
          Shop by Category
        </h2>
        <p className="mt-2 text-base text-gray-500">
          Browse the collection we have
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {categories.slice(0, 6).map((cat) => (
          <Link
            key={cat._id}
            to={`/collection/${cat.slug}`}
            className="group relative overflow-hidden rounded-lg bg-gray-100 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1"
          >
            {cat.image ? (
              <div className="aspect-square">
                <img 
                  src={cat.image} 
                  alt={cat.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="aspect-square bg-gray-100 flex items-center justify-center">
                <span className="text-4xl text-gray-400">🎮</span>
              </div>
            )}
            {/* Dark overlay with name */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-4">
              <p className="text-white font-medium text-sm">
                {cat.name}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div className="text-center mt-10">
        <Link 
          to="/collection" 
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition"
        >
          View all categories
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
};

export default Category;