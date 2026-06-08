import { init } from './core/state';
import { setupTabs } from './components/tabs';
import {
  setupItemsContainer,
  setupAddItemButton,
  renderItems,
  updateSummary,
} from './components/items';
import { setupQuoteForm } from './views/quote';
import { setupRegisterForm, syncFromQuoteTab } from './views/register';

document.addEventListener('DOMContentLoaded', () => {
  init();

  setupTabs(tab => {
    if (tab === 'register') syncFromQuoteTab();
  });

  setupItemsContainer();
  setupAddItemButton();
  setupQuoteForm();
  setupRegisterForm();

  renderItems();
  updateSummary();
});
