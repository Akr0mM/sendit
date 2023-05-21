import { Accounts } from 'meteor/accounts-base';

import './main.html';
import '../imports/ui/App';
import './routes';

// Accounts config
Accounts.ui.config({
  passwordSignupFields: 'USERNAME_AND_EMAIL',
});
