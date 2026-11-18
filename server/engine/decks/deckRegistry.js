import { getBaseDeck, PROPERTY_SETS } from './baseDeck.js';

export function getDeckForEdition(edition = 'base') {
  switch (edition) {
    case 'harry_potter':
      // Extensible future scope: will load HP custom cards and house rules
      return getBaseDeck();
    case 'no_mercy':
      // Extensible future scope: will load brutal action modifiers
      return getBaseDeck();
    case 'base':
    default:
      return getBaseDeck();
  }
}

export { PROPERTY_SETS };
