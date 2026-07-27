const siteName = "XYZ Gaming Store";
const siteEmail = "example@gmail.com";
const sitePhone = "+984 780 0000";
const siteAddress = "Kathmandu Nepal";

const siteConfig = {
  siteName: siteName,
  tagline: "Instant in-game top-ups",
  metaDescription: "Buy PUBG Mobile UC, Free Fire Diamonds and other in-game top-ups online.",

  logoText: "XYZ Gaming", // Changed to match site name

  // Currency shown next to prices
  currency: {
    symbol: "Rs.",
    code: "NPR",
  },

  contact: {
    email: siteEmail,
    phone: sitePhone,
    address: siteAddress,
  },
  
  social: [
    {
      platform: "facebook",
      url: "https://facebook.com"
    },
    {
      platform: "instagram",
      url: "https://instagram.com"
    },
    {
      platform: "tiktok",
      url: "https://tiktok.com/"
    },
    {
      platform: "Whatsapp",
      url: "https://whatsapp.com/"
    },
  ],

  navbar: {
    menuItems: [
      { label: "Top-Up", path: "/topup"},
      { label: "Collection", path: "/collection" },
      { label: "Subscriptions", path: "/subscriptions" },
      { label: "About", path: "/about" },
      { label: "Contact", path: "/contact" }
    ]
  },

  footer: {
    companyLinks: ["Home", "About Us", "Contact", "Privacy Policy"],
    copyrightText: `© ${new Date().getFullYear()} ${siteName}. All rights reserved.`,
  },

  about: {
    heading: "About Us",
    subheading: "Your trusted source for in-game items, subscriptions, and gaming essentials.",
    paragraphs: [
      "We're a dedicated gaming marketplace connecting players with the items they need to level up their experience. From rare in-game cosmetics to premium subscriptions, we make it easy to enhance your gaming journey.",
      "Founded by gamers, for gamers, we understand the importance of fast, secure, and reliable transactions. Our platform ensures you get what you pay for, every time, with zero hassle.",
      "Whether you're looking for top-up services, exclusive items, or game passes, we've got you covered. Join thousands of satisfied gamers who trust us for their gaming needs."
    ],
    
    services: [
      {
        name: "In-Game Items",
        description: "UC, Diamonds, Crystals, and other in-game currencies"
      },
      {
        name: "Game Subscriptions",
        description: "Premium passes, memberships, and battle passes"
      },
      {
        name: "App Subscriptions",
        description: "Netflix, Amazon Prime, Disney+, and more"
      },
      {
        name: "Gift Cards",
        description: "Digital gift cards for gaming platforms and apps"
      },
      {
        name: "Top-Up Services",
        description: "Instant in-game currency and wallet top-ups"
      },
      {
        name: "24/7 Support",
        description: "Round-the-clock assistance for all your needs"
      }
    ],
    
    features: [
      {
        title: "Instant Delivery",
        description: "Get your items within minutes of purchase"
      },
      {
        title: "Secure Transactions",
        description: "Safe and secure payment processing"
      },
      {
        title: "Best Prices",
        description: "Competitive pricing for all your gaming needs"
      },
      {
        title: "Trusted Platform",
        description: "Serving thousands of satisfied customers"
      }
    ],
    
    missionTitle: "Our Mission",
    missionText: "To make gaming and digital entertainment more accessible by providing a seamless platform where users can easily purchase in-game items, subscriptions, and digital services.",
    
    cta: {
      text: "Browse Our Collection",
      link: "/collection"
    }
  },

  termsPrivacy: {
    lastUpdated: "July 20, 2024",
    effectiveDate: "July 1, 2024",
    
    terms: [
      `Welcome to ${siteName}. By using our services, you agree to comply with and be bound by the following terms and conditions. Please read these terms carefully before using our platform.`,
      
      `${siteName} is an online platform that facilitates the purchase of in-game items, currencies, subscriptions, gift cards, and digital services. We are an independent service provider and are not affiliated with, endorsed by, or sponsored by any game publisher, developer, or application provider.`,
      
      "All purchases made on our platform are final and non-refundable. Refunds are only provided in certain cases such as undelivered items or invalid details provided, subject to verification. Refunds are not provided for change of mind, wrong order placed, or after delivery has been completed.",
      
      "Refund requests are processed within 48 hours of approval. Refund method may vary depending on the payment method used. We reserve the right to determine the appropriate refund method.",
      
      "You are responsible for providing accurate gaming IDs, server information, and account details for delivery. If incorrect information is provided, you may raise an issue, and we will attempt to reinitiate the process. However, if we cannot contact you or the information provided is incorrect, no refund will be provided.",
      
      "In case of delivery failure, you can raise an issue, and the order will be retried or refunded after verification. We strive to deliver all items within 24 hours of order confirmation.",
      
      "If an item is out of stock, you will not be able to add it to your cart or place an order. We maintain real-time inventory to prevent out-of-stock orders.",
      
      "Users are responsible for maintaining the security of their account and for all activities that occur under their account. We are not liable for any unauthorized access to your account.",
      
      `We reserve the right to modify, suspend, or discontinue our services at any time without prior notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuation of our services.`,
      
      "All in-game items, currencies, and virtual goods are provided 'as is' without any warranties. We do not guarantee that items will be available, compatible, or functional with all games or applications.",
      
      "Users must be at least 13 years old to use our services. Users under 18 must have parental consent to make purchases. By using our services, you confirm that you meet these age requirements.",
      
      "Users must comply with all applicable laws and regulations when using our services. The following activities are strictly prohibited: fraud, improper activities, unauthorized reselling, submitting fake orders, or any attempt to exploit our platform.",
      
      "If a user repeatedly submits fake orders or engages in fraudulent activities, their account will be deactivated/blocked. Users can appeal the deactivation via email or social media. Unblocking is not guaranteed and is at our sole discretion.",
      
      "Users may not resell items purchased from our platform without explicit written permission. Unauthorized reselling will result in account termination and legal action.",
      
      "We do not offer discounts or promotional pricing unless explicitly advertised on our platform. All prices are subject to change without prior notice.",
      
      "We comply with game publishers' Terms of Service to the best of our ability. However, we are not responsible for any actions taken by game publishers against users, including account bans or suspensions.",
      
      "All digital products including in-game currencies (UC, Diamonds, Crystals, etc.), coins, and subscriptions have no real-world monetary value and cannot be exchanged for cash.",
      
      `We provide services for various games including Free Fire, PUBG, Call of Duty, Mobile Legends: Bang Bang, and other applications including TikTok coins, Netflix, Amazon Prime, Disney+, and other digital services.`
    ],
    
    privacy: [
      `${siteName} is committed to protecting your privacy and personal information. This privacy policy explains how we collect, use, and safeguard your data when you use our services.`,
      
      "We collect personal information such as your name, email address, phone number when you create an account, make a purchase, or contact us for support. We also collect gaming IDs and server information necessary for delivery.",
      
      "We use your information to process transactions, deliver purchased items, provide customer support, improve our services, and maintain records for accounting and legal purposes.",
      
      "We do not sell, trade, or share your personal information with any third parties for their marketing purposes. Your data is only used for the purpose of delivering our services to you.",
      
      "We implement robust security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction.",
      
      "We do not use cookies or similar tracking technologies for analytics or marketing purposes. We respect your privacy and limit data collection to what is strictly necessary for service delivery.",
      
      "We store your personal data for a period of up to 1 year after your last interaction with our platform. After this period, data may be deleted or anonymized.",
      
      "You have the right to request access to your personal data, request correction of inaccurate information, or request deletion of your data (subject to legal and accounting requirements). You may also withdraw consent for data processing at any time.",
      
      "Please note that data export is not currently available. If you require a copy of your data, you may contact us, and we will provide it in a reasonable format.",
      
      `We do not directly store payment information. When you make a purchase, you choose a payment method (eSewa, Khalti, FonePay, Mobile Banking, etc.), scan the QR code, make the payment, upload the receipt, and place your order. Payment is processed through third-party payment providers, and we do not have access to your payment credentials.`
    ],
    
    dataCollection: [
      {
        title: "Account Information",
        description: `We collect your name, email address (${siteEmail}), and phone number (${sitePhone}) when you create an account or make a purchase.`
      },
      {
        title: "Gaming/App Details",
        description: "We collect gaming IDs, usernames, server information, and account details necessary to deliver purchased items."
      },
      {
        title: "Transaction History",
        description: "We maintain records of all purchases, payments, and deliveries for customer support and accounting purposes."
      },
      {
        title: "Communication Data",
        description: "We store correspondence between you and our support team to provide better assistance and improve our services."
      }
    ],
    
    cookies: [
      `${siteName} does not use cookies for analytics or marketing purposes.`,
      "We only use essential cookies necessary for the basic functioning of our platform, such as maintaining your login session and cart.",
      "You do not need to accept any cookies to use our platform, and we respect your privacy preferences."
    ],
    
    yourRights: [
      "Access your personal data and receive a copy",
      "Request correction of inaccurate or incomplete data",
      "Request deletion of your data (subject to legal requirements)",
      "Withdraw consent for data processing at any time",
      "Object to processing of your data for any purpose"
    ],
    
    deliveryPolicy: [
      "We aim to deliver all items within 24 hours of order confirmation.",
      "If delivery fails due to incorrect information provided by the user, the user may raise an issue. We will attempt to reinitiate the process, but if we cannot contact the user, no refund will be provided.",
      "If delivery fails due to our error, we will retry delivery or issue a refund after verification.",
      "Users are responsible for providing accurate gaming IDs, server information, and account details.",
      `In case of any issues with delivery, users can contact our support team at ${siteEmail} or via social media.`,
      "We recommend double-checking all details before completing your purchase to avoid delivery delays."
    ],
    
    disclaimer: [
      `${siteName} is an independent platform and is not affiliated with, endorsed by, or sponsored by any game publishers, developers, or application providers. All game titles, logos, and content are property of their respective owners.`,
      "All in-game items, currencies, and virtual goods are provided for entertainment purposes only. These items have no real-world monetary value and cannot be exchanged for cash.",
      "We comply with game publishers' Terms of Service. However, users are solely responsible for any consequences resulting from the use of our services.",
      "Prices are subject to change without notice. We reserve the right to adjust prices based on market conditions, game updates, or availability.",
      `We provide services for various games including Free Fire, PUBG, Call of Duty, Mobile Legends: Bang Bang, and other applications including TikTok coins, Netflix, Amazon Prime, Disney+, and other digital services.`
    ],
    
    privacyContact: `If you have any questions about our privacy policy or how we handle your data, please contact us at ${siteEmail} or through our contact form.`
  }
};

export default siteConfig;