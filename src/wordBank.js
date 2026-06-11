const unique = (items) => [...new Set(items)];

const makePhrases = (modifiers, nouns, limit = 45) => {
  const words = [];
  modifiers.forEach((modifier) => {
    nouns.forEach((noun) => words.push(`${modifier} ${noun}`));
  });
  return unique(words).slice(0, limit);
};

export const WORD_BANK = {
  'Public Places': makePhrases(
    ['Hidden', 'Abandoned', 'Luxury', 'Crowded', 'Underground', 'Private', 'Old', 'Secret', 'Busy'],
    ['Embassy', 'Courthouse', 'Observatory', 'Auction House', 'Opera House', 'Harbour', 'Lighthouse', 'Train Platform', 'Casino Floor', 'University Library', 'Hotel Lobby', 'Emergency Room']
  ),

  'Hidden Places': makePhrases(
    ['Forgotten', 'Locked', 'Underground', 'Private', 'Restricted', 'Silent', 'Remote', 'Hidden', 'Backroom'],
    ['Bunker', 'Basement', 'Vault', 'Tunnel', 'Warehouse', 'Archive', 'Chapel', 'Wine Cellar', 'Control Room', 'Safe House', 'Rooftop', 'Service Corridor']
  ),

  'Situations': makePhrases(
    ['Awkward', 'Unexpected', 'Last-Minute', 'Secret', 'Messy', 'Suspicious', 'Chaotic', 'Embarrassing', 'Risky'],
    ['First Date', 'Job Interview', 'Family Dinner', 'Power Cut', 'Missed Flight', 'Surprise Party', 'Flat Tyre', 'Wedding Speech', 'Exam Day', 'Group Holiday', 'Late Arrival', 'Double Booking']
  ),

  'Social Drama': makePhrases(
    ['Fake', 'Public', 'Private', 'Messy', 'Silent', 'Unexpected', 'Old', 'Online', 'Drunken'],
    ['Apology', 'Rumour', 'Argument', 'Breakup', 'Confession', 'Group Chat', 'Voice Note', 'Excuse', 'Secret', 'Screenshot', 'Complaint', 'Reunion']
  ),

  'Emotions & Vibes': makePhrases(
    ['Quiet', 'Sudden', 'Deep', 'Fake', 'Hidden', 'Strong', 'Unspoken', 'Public', 'Private'],
    ['Suspicion', 'Relief', 'Jealousy', 'Confidence', 'Embarrassment', 'Nostalgia', 'Panic', 'Awkwardness', 'Temptation', 'Regret', 'Excitement', 'Disappointment']
  ),

  'Actions': makePhrases(
    ['Careful', 'Desperate', 'Secret', 'Public', 'Awkward', 'Confident', 'Risky', 'Silent', 'Last-Minute'],
    ['Negotiating', 'Bluffing', 'Sneaking', 'Celebrating', 'Apologising', 'Investigating', 'Pretending', 'Escaping', 'Overthinking', 'Interrupting', 'Whispering', 'Bargaining']
  ),

  'Mystery Objects': makePhrases(
    ['Hidden', 'Missing', 'Broken', 'Fake', 'Old', 'Burned', 'Locked', 'Golden', 'Suspicious'],
    ['Envelope', 'Receipt', 'Keycard', 'Photograph', 'Box', 'Passport', 'Phone', 'Map', 'Ring', 'USB Stick', 'Briefcase', 'Mask']
  ),

  'Characters': makePhrases(
    ['Nervous', 'Famous', 'Fake', 'Retired', 'Suspicious', 'Rich', 'Lost', 'Silent', 'Angry'],
    ['Detective', 'Bodyguard', 'Celebrity', 'Neighbour', 'Tourist', 'Referee', 'Bouncer', 'Magician', 'Lawyer', 'Journalist', 'Chef', 'Mechanic']
  ),

  'Media & Culture': makePhrases(
    ['Viral', 'Deleted', 'Famous', 'Controversial', 'Unexpected', 'Final', 'Secret', 'Bad', 'Classic'],
    ['Plot Twist', 'Villain Arc', 'Opening Scene', 'Final Episode', 'Soundtrack', 'Spoiler', 'Red Carpet', 'Reality Show', 'Documentary', 'Trailer', 'Oscar Speech', 'Deleted Scene']
  ),

  'Sports & Competition': makePhrases(
    ['Last-Minute', 'Controversial', 'Historic', 'Embarrassing', 'Home', 'Away', 'Secret', 'Intense', 'Unfair'],
    ['Penalty Shootout', 'Derby Day', 'VAR Check', 'Transfer Rumour', 'Underdog Win', 'Team Captain', 'Changing Room', 'Press Conference', 'Injury Time', 'Home Advantage', 'Red Card', 'Comeback']
  ),

  'Food & Drink': makePhrases(
    ['Midnight', 'Burnt', 'Secret', 'Fancy', 'Cheap', 'Spicy', 'Cold', 'Forgotten', 'Shared'],
    ['Snack', 'Toast', 'Recipe', 'Room Service', 'Energy Drink', 'Birthday Cake', 'Leftovers', 'Sauce', 'Buffet', 'Takeaway', 'Coffee Break', 'Picnic Basket']
  ),

  'Travel & Holiday': makePhrases(
    ['Lost', 'Delayed', 'Luxury', 'Wrong', 'Secret', 'Cheap', 'Remote', 'Crowded', 'Rainy'],
    ['Passport Control', 'Luggage', 'Hotel Upgrade', 'Tour Guide', 'City Break', 'Road Trip', 'Flight', 'Beach Resort', 'Ski Lodge', 'Camping Trip', 'Cruise Ship', 'Souvenir Shop']
  ),

  'Technology': makePhrases(
    ['Deleted', 'Private', 'Fake', 'Broken', 'Hidden', 'Suspicious', 'Old', 'Encrypted', 'Leaked'],
    ['Group Chat', 'Voice Note', 'Message', 'Battery', 'Face ID', 'Wi-Fi Password', 'Profile', 'Online Status', 'Screen Recording', 'Browser Tab', 'Video Call', 'Algorithm']
  ),

  'Abstract Concepts': makePhrases(
    ['Lost', 'Fake', 'Hidden', 'Public', 'Fragile', 'Dangerous', 'Sudden', 'Unspoken', 'Powerful'],
    ['Reputation', 'Luck', 'Power', 'Loyalty', 'Betrayal', 'Freedom', 'Justice', 'Chaos', 'Routine', 'Ambition', 'Tradition', 'Risk']
  ),

  'Night Out': makePhrases(
    ['Messy', 'Expensive', 'Secret', 'Awkward', 'Loud', 'Late-Night', 'Unexpected', 'Fake', 'Private'],
    ['Taxi Ride', 'VIP Table', 'Bar Tab', 'Lost Jacket', 'Queue Jump', 'Club Stamp', 'Afterparty', 'Kebab Stop', 'Bathroom Mirror', 'Bouncer Chat', 'Last Round', 'Group Photo']
  ),

  'Work & School': makePhrases(
    ['Late', 'Fake', 'Urgent', 'Private', 'Awkward', 'Secret', 'Stressful', 'Forgotten', 'Unexpected'],
    ['Meeting', 'Deadline', 'Presentation', 'Exam', 'Homework', 'Email', 'Shift', 'Promotion', 'Sick Note', 'Lunch Break', 'Office Rumour', 'Team Project']
  ),

  'Crime & Mystery': makePhrases(
    ['Missing', 'Hidden', 'Fake', 'Cold', 'Secret', 'Suspicious', 'Unmarked', 'Locked', 'Silent'],
    ['Alibi', 'Witness', 'Fingerprint', 'Evidence Bag', 'Security Footage', 'Getaway Car', 'Ransom Note', 'Crime Scene', 'Blackmail', 'Safe Code', 'Disguise', 'Footstep']
  ),

  'Luxury & Money': makePhrases(
    ['Fake', 'Expensive', 'Hidden', 'Private', 'Golden', 'Stolen', 'Designer', 'Exclusive', 'Overpriced'],
    ['Watch', 'Invoice', 'Penthouse', 'Membership', 'Auction Bid', 'Credit Card', 'Diamond Ring', 'Safe Deposit', 'First Class Seat', 'Champagne Bottle', 'Black Card', 'Business Deal']
  ),

  'Nature & Weather': makePhrases(
    ['Heavy', 'Silent', 'Sudden', 'Frozen', 'Wild', 'Hidden', 'Dangerous', 'Beautiful', 'Unusual'],
    ['Storm', 'Fog', 'Forest', 'River', 'Mountain', 'Cave', 'Thunder', 'Heatwave', 'Snowfall', 'Tide', 'Waterfall', 'Desert']
  ),

  'Household': makePhrases(
    ['Broken', 'Hidden', 'Old', 'Noisy', 'Missing', 'Secret', 'Burnt', 'Leaking', 'Forgotten'],
    ['Remote', 'Doorbell', 'Sofa', 'Washing Machine', 'Fridge', 'Curtain', 'Spare Key', 'Mirror', 'Vacuum', 'Oven', 'Lamp', 'Drawer']
  ),

  'Transport': makePhrases(
    ['Late', 'Crowded', 'Broken', 'Luxury', 'Stolen', 'Wrong', 'Night', 'Empty', 'Secret'],
    ['Bus', 'Taxi', 'Train', 'Ferry', 'Plane', 'Metro', 'Motorbike', 'Rental Car', 'Lift', 'Ambulance', 'Police Car', 'Private Jet']
  ),

  'Health & Body': makePhrases(
    ['Fake', 'Sudden', 'Awkward', 'Painful', 'Private', 'Embarrassing', 'Minor', 'Mysterious', 'Serious'],
    ['Cough', 'Scar', 'Allergy', 'Bruise', 'Headache', 'Toothache', 'Checkup', 'Prescription', 'Bandage', 'X-Ray', 'Fever', 'Cramp']
  ),

  'Fantasy & Myth': makePhrases(
    ['Cursed', 'Ancient', 'Hidden', 'Royal', 'Dark', 'Lost', 'Golden', 'Forbidden', 'Haunted'],
    ['Sword', 'Castle', 'Dragon', 'Wizard', 'Potion', 'Crown', 'Forest', 'Prophecy', 'Portal', 'Treasure', 'Ghost', 'Kingdom']
  ),

  'Everyday Problems': makePhrases(
    ['Lost', 'Broken', 'Forgotten', 'Awkward', 'Late', 'Wrong', 'Expensive', 'Annoying', 'Unexpected'],
    ['Charger', 'Password', 'Appointment', 'Delivery', 'Bill', 'Parking Spot', 'Receipt', 'Alarm', 'Reservation', 'Address', 'Umbrella', 'Birthday Gift']
  ),
};

export const CATEGORY_NAMES = Object.keys(WORD_BANK);

export const WORD_COUNT = CATEGORY_NAMES.reduce((total, category) => total + WORD_BANK[category].length, 0);
