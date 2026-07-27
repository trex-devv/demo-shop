const siteConfig = {
  siteName: "XYZ Gaming Store",
  logoText: "XYZ Gaming Store",
  currency: {
    symbol: "Rs.",
    code: "NPR",
  },
  // Gaming store specific
   orderStatuses: [
    "Pending Verification",
    "Payment Verified", 
    "Payment Rejected",
    "Delivered",
    "Invalid Details"
  ],
  pricingTypes: [
    { value: "flat", label: "Flat Price" },
    { value: "variants", label: "Variants (e.g., 100 UC, 500 UC)" }
  ],
};

export default siteConfig;