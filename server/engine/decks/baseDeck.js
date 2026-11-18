// Official 106-card Monopoly Deal Base Deck Definition

export const PROPERTY_SETS = {
  brown: { name: 'Brown', size: 2, rents: [1, 2], hex: '#8B4513' },
  dark_blue: { name: 'Dark Blue', size: 2, rents: [3, 8], hex: '#0038A8' },
  green: { name: 'Green', size: 3, rents: [2, 4, 7], hex: '#00873E' },
  light_blue: { name: 'Light Blue', size: 3, rents: [1, 2, 3], hex: '#87CEEB' },
  orange: { name: 'Orange', size: 3, rents: [1, 3, 5], hex: '#FF7F00' },
  pink: { name: 'Pink', size: 3, rents: [1, 2, 4], hex: '#D10069' },
  railroad: { name: 'Railroad', size: 4, rents: [1, 2, 3, 4], hex: '#333333' },
  red: { name: 'Red', size: 3, rents: [2, 3, 6], hex: '#D91023' },
  utility: { name: 'Utility', size: 2, rents: [1, 2], hex: '#A4C639' },
  yellow: { name: 'Yellow', size: 3, rents: [2, 4, 6], hex: '#FBD000' }
};

export function getBaseDeck() {
  const cards = [];
  let count = 0;
  const nextId = (prefix) => `${prefix}_${++count}`;

  // 1. MONEY CARDS (20 cards)
  const addMoney = (val, copies) => {
    for (let i = 0; i < copies; i++) {
      cards.push({
        id: nextId(`m_${val}`),
        name: `$${val}M Money`,
        type: 'money',
        value: val,
        image: `/cards/money/money_${val}m.png`,
        description: `Deposit $${val}M into your bank.`
      });
    }
  };
  addMoney(10, 1);
  addMoney(5, 2);
  addMoney(4, 3);
  addMoney(3, 3);
  addMoney(2, 5);
  addMoney(1, 6);

  // 2. ACTION CARDS (34 cards)
  const addAction = (key, name, val, copies, desc) => {
    for (let i = 0; i < copies; i++) {
      cards.push({
        id: nextId(`act_${key}`),
        actionType: key,
        name,
        type: 'action',
        value: val,
        image: `/cards/actions/${key}.png`,
        description: desc
      });
    }
  };
  addAction('deal_breaker', 'Deal Breaker', 5, 2, 'Steal a completed set of properties from any player, including any buildings.');
  addAction('just_say_no', 'Just Say No', 4, 3, 'Cancel any action played against you at any time.');
  addAction('sly_deal', 'Sly Deal', 3, 3, 'Steal a single property from any player (cannot be part of a full set).');
  addAction('forced_deal', 'Forced Deal', 3, 3, 'Swap one of your properties with another player (neither can be part of a full set).');
  addAction('debt_collector', 'Debt Collector', 3, 3, 'Force any one player to pay you $5M.');
  addAction('its_my_birthday', "It's My Birthday", 2, 3, 'All players must pay you $2M as a birthday gift.');
  addAction('pass_go', 'Pass Go', 1, 10, 'Draw 2 extra cards from the draw pile.');
  addAction('house', 'House', 3, 3, 'Add to any completed set (except Railroad or Utility) to add $3M to rent.');
  addAction('hotel', 'Hotel', 4, 2, 'Add to any completed set that already has a House to add $4M to rent.');
  addAction('double_the_rent', 'Double The Rent', 1, 2, 'Play with a rent card to double the rent value.');

  // 3. STANDARD PROPERTIES (28 cards)
  const addProp = (color, name, val) => {
    cards.push({
      id: nextId(`prop_${color}`),
      name,
      type: 'property',
      color,
      value: val,
      maxSetSize: PROPERTY_SETS[color].size,
      rents: PROPERTY_SETS[color].rents,
      image: `/cards/properties/${color}_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.png`,
      description: `${PROPERTY_SETS[color].name} Property (${PROPERTY_SETS[color].size} cards for full set).`
    });
  };

  addProp('brown', 'Mediterranean Avenue', 1);
  addProp('brown', 'Baltic Avenue', 1);

  addProp('dark_blue', 'Boardwalk', 4);
  addProp('dark_blue', 'Park Place', 4);

  addProp('green', 'North Carolina Avenue', 4);
  addProp('green', 'Pacific Avenue', 4);
  addProp('green', 'Pennsylvania Avenue', 4);

  addProp('light_blue', 'Connecticut Avenue', 1);
  addProp('light_blue', 'Oriental Avenue', 1);
  addProp('light_blue', 'Vermont Avenue', 1);

  addProp('orange', 'New York Avenue', 2);
  addProp('orange', 'St. James Place', 2);
  addProp('orange', 'Tennessee Avenue', 2);

  addProp('pink', 'St. Charles Place', 2);
  addProp('pink', 'States Avenue', 2);
  addProp('pink', 'Virginia Avenue', 2);

  addProp('railroad', 'Short Line', 2);
  addProp('railroad', 'B. & O. Railroad', 2);
  addProp('railroad', 'Reading Railroad', 2);
  addProp('railroad', 'Pennsylvania Railroad', 2);

  addProp('red', 'Kentucky Avenue', 3);
  addProp('red', 'Indiana Avenue', 3);
  addProp('red', 'Illinois Avenue', 3);

  addProp('utility', 'Electric Company', 2);
  addProp('utility', 'Water Works', 2);

  addProp('yellow', 'Ventnor Avenue', 3);
  addProp('yellow', 'Atlantic Avenue', 3);
  addProp('yellow', 'Marvin Gardens', 3);

  // 4. PROPERTY WILDCARDS (11 cards)
  const addWildcard = (colors, name, val, copies, key) => {
    for (let i = 0; i < copies; i++) {
      cards.push({
        id: nextId(`wild_${key}`),
        name,
        type: 'wildcard',
        colors,
        currentColor: colors.length > 2 ? null : colors[0],
        value: val,
        image: `/cards/wildcards/${key}.png`,
        description: colors.length > 2 
          ? 'Multi-color property wildcard. Can be used as any property color.'
          : `Dual-color wildcard: Can switch between ${PROPERTY_SETS[colors[0]].name} and ${PROPERTY_SETS[colors[1]].name}.`
      });
    }
  };
  addWildcard(Object.keys(PROPERTY_SETS), 'Multi-Color Wildcard', 0, 2, 'multi_wildcard');
  addWildcard(['dark_blue', 'green'], 'Dark Blue & Green Wildcard', 4, 1, 'dark_blue_green');
  addWildcard(['green', 'railroad'], 'Green & Railroad Wildcard', 4, 1, 'green_railroad');
  addWildcard(['light_blue', 'brown'], 'Light Blue & Brown Wildcard', 1, 1, 'light_blue_brown');
  addWildcard(['light_blue', 'railroad'], 'Light Blue & Railroad Wildcard', 4, 1, 'light_blue_railroad');
  addWildcard(['pink', 'orange'], 'Pink & Orange Wildcard', 2, 2, 'pink_orange');
  addWildcard(['red', 'yellow'], 'Red & Yellow Wildcard', 3, 2, 'red_yellow');
  addWildcard(['utility', 'railroad'], 'Utility & Railroad Wildcard', 2, 1, 'utility_railroad');

  // 5. RENT CARDS (13 cards)
  const addRent = (colors, name, val, copies, key) => {
    for (let i = 0; i < copies; i++) {
      cards.push({
        id: nextId(`rent_${key}`),
        name,
        type: 'rent',
        colors,
        isWildRent: colors.length > 2,
        value: val,
        image: `/cards/rent/${key}.png`,
        description: colors.length > 2
          ? 'Wild Rent: Force any single player to pay rent on any property you own.'
          : `Rent for ${PROPERTY_SETS[colors[0]].name} or ${PROPERTY_SETS[colors[1]].name}. All players pay.`
      });
    }
  };
  addRent(['dark_blue', 'green'], 'Dark Blue & Green Rent', 1, 2, 'dark_blue_green_rent');
  addRent(['red', 'yellow'], 'Red & Yellow Rent', 1, 2, 'red_yellow_rent');
  addRent(['pink', 'orange'], 'Pink & Orange Rent', 1, 2, 'pink_orange_rent');
  addRent(['light_blue', 'brown'], 'Light Blue & Brown Rent', 1, 2, 'light_blue_brown_rent');
  addRent(['railroad', 'utility'], 'Railroad & Utility Rent', 1, 2, 'railroad_utility_rent');
  addRent(Object.keys(PROPERTY_SETS), 'Wild Rent', 3, 3, 'wild_rent');

  return cards;
}
