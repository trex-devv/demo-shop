// backend/config/categoryFields.js
export const CATEGORY_FIELDS = {
  // Battle Royale Games
  'pubg': {
    categoryId: 'pubg',
    name: 'PUBG Mobile',
    fields: [
      { 
        key: 'uid', 
        label: 'Character UID', 
        type: 'text', 
        required: true, 
        placeholder: 'Enter your PUBG UID',
        validation: { pattern: '^[0-9]{9,10}$', message: 'Enter a valid PUBG UID (9-10 digits)' }
      },
      { 
        key: 'characterName', 
        label: 'Character Name', 
        type: 'text', 
        required: true, 
        placeholder: 'Enter character name' 
      },
      { 
        key: 'server', 
        label: 'Server', 
        type: 'select', 
        required: true, 
        options: ['Asia', 'Europe', 'North America', 'South America', 'Middle East', 'Africa'] 
      }
    ]
  },
  
  'freefire': {
    categoryId: 'freefire',
    name: 'Free Fire',
    fields: [
      { 
        key: 'uid', 
        label: 'Free Fire UID', 
        type: 'text', 
        required: true, 
        placeholder: 'Enter your FF UID',
        validation: { pattern: '^[0-9]{8,12}$', message: 'Enter a valid Free Fire UID (8-12 digits)' }
      },
      { 
        key: 'nickname', 
        label: 'Nickname', 
        type: 'text', 
        required: true, 
        placeholder: 'Enter your nickname' 
      },
      { 
        key: 'server', 
        label: 'Server', 
        type: 'select', 
        required: true, 
        options: ['Asia', 'Europe', 'North America', 'South America'] 
      }
    ]
  },

  'coc': {
    categoryId: 'coc',
    name: 'Clash of Clans',
    fields: [
      { 
        key: 'playerId', 
        label: 'Player ID', 
        type: 'text', 
        required: true, 
        placeholder: 'Enter your player ID (e.g., #ABC123)',
        validation: { pattern: '^#[A-Za-z0-9]{3,10}$', message: 'Enter a valid player ID (e.g., #ABC123)' }
      },
      { 
        key: 'playerName', 
        label: 'In-game Name', 
        type: 'text', 
        required: true, 
        placeholder: 'Enter in-game name' 
      }
    ]
  },

  'mlbb': {
    categoryId: 'mlbb',
    name: 'Mobile Legends',
    fields: [
      { 
        key: 'uid', 
        label: 'MLBB UID', 
        type: 'text', 
        required: true, 
        placeholder: 'Enter your MLBB UID',
        validation: { pattern: '^[0-9]{10,15}$', message: 'Enter a valid MLBB UID (10-15 digits)' }
      },
      { 
        key: 'characterName', 
        label: 'Character Name', 
        type: 'text', 
        required: true, 
        placeholder: 'Enter character name' 
      },
      { 
        key: 'serverId', 
        label: 'Server ID', 
        type: 'text', 
        required: true, 
        placeholder: 'Enter server ID' 
      }
    ]
  },

  'efootball': {
    categoryId: 'efootball',
    name: 'eFootball',
    fields: [
      { 
        key: 'playerId', 
        label: 'Player ID', 
        type: 'text', 
        required: true, 
        placeholder: 'Enter your player ID' 
      },
      { 
        key: 'playerName', 
        label: 'In-game Name', 
        type: 'text', 
        required: true, 
        placeholder: 'Enter in-game name' 
      }
    ]
  },

  'tiktok': {
    categoryId: 'tiktok',
    name: 'TikTok Coins',
    fields: [
      { 
        key: 'username', 
        label: 'TikTok Username', 
        type: 'text', 
        required: true, 
        placeholder: '@username' 
      }
    ]
  },

  'bigo': {
    categoryId: 'bigo',
    name: 'Bigo Live Coins',
    fields: [
      { 
        key: 'username', 
        label: 'Bigo Username', 
        type: 'text', 
        required: true, 
        placeholder: 'Enter Bigo username' 
      },
      { 
        key: 'uid', 
        label: 'Bigo UID', 
        type: 'text', 
        required: true, 
        placeholder: 'Enter your Bigo UID' 
      }
    ]
  },

  'poplive': {
    categoryId: 'poplive',
    name: 'Pop Live Coins',
    fields: [
      { 
        key: 'username', 
        label: 'Pop Live Username', 
        type: 'text', 
        required: true, 
        placeholder: 'Enter Pop Live username' 
      },
      { 
        key: 'uid', 
        label: 'Pop Live UID', 
        type: 'text', 
        required: true, 
        placeholder: 'Enter your Pop Live UID' 
      }
    ]
  },

  'codm': {
    categoryId: 'codm',
    name: 'Call of Duty Mobile',
    fields: [
      { 
        key: 'uid', 
        label: 'UID', 
        type: 'text', 
        required: true, 
        placeholder: 'Enter your UID' 
      },
      { 
        key: 'playerName', 
        label: 'Player Name', 
        type: 'text', 
        required: true, 
        placeholder: 'Enter player name' 
      },
      { 
        key: 'server', 
        label: 'Server', 
        type: 'select', 
        required: true, 
        options: ['Global', 'Garena', 'Tencent', 'Vietnam', 'Korea'] 
      }
    ]
  },

  'genshin': {
    categoryId: 'genshin',
    name: 'Genshin Impact',
    fields: [
      { 
        key: 'uid', 
        label: 'UID', 
        type: 'text', 
        required: true, 
        placeholder: 'Enter your UID' 
      },
      { 
        key: 'server', 
        label: 'Server', 
        type: 'select', 
        required: true, 
        options: ['America', 'Europe', 'Asia', 'TW/HK/MO'] 
      },
      { 
        key: 'characterName', 
        label: 'Character Name (Optional)', 
        type: 'text', 
        required: false, 
        placeholder: 'Enter character name' 
      }
    ]
  },

  'apex': {
    categoryId: 'apex',
    name: 'Apex Legends',
    fields: [
      { 
        key: 'username', 
        label: 'Username', 
        type: 'text', 
        required: true, 
        placeholder: 'Enter your username' 
      },
      { 
        key: 'platform', 
        label: 'Platform', 
        type: 'select', 
        required: true, 
        options: ['PC', 'PlayStation', 'Xbox', 'Switch'] 
      }
    ]
  },

  'netflix': {
    categoryId: 'netflix',
    name: 'Netflix Gift Card',
    fields: [
      { 
        key: 'email', 
        label: 'Email for Delivery', 
        type: 'email', 
        required: true, 
        placeholder: 'Enter email to receive code' 
      }
    ]
  },

  'googleplay': {
    categoryId: 'googleplay',
    name: 'Google Play Gift Card',
    fields: [
      { 
        key: 'email', 
        label: 'Email for Delivery', 
        type: 'email', 
        required: true, 
        placeholder: 'Enter email to receive code' 
      }
    ]
  }
};

// Common fields that appear in ALL categories
export const COMMON_FIELDS = [
  { 
    key: 'contactEmail', 
    label: 'Contact Email', 
    type: 'email', 
    required: true, 
    placeholder: 'Enter your email',
    validation: { pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$', message: 'Please enter a valid email' }
  },
  { 
    key: 'contactPhone', 
    label: 'Contact Phone', 
    type: 'tel', 
    required: true, 
    placeholder: 'Enter phone number' 
  },
  { 
    key: 'specialInstructions', 
    label: 'Special Instructions', 
    type: 'textarea', 
    required: false, 
    placeholder: 'Any special instructions for delivery' 
  }
];