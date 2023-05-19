import { Template } from "meteor/templating";
import { Accounts } from "meteor/accounts-base";

import "./main.html";
import "../imports/ui/App.js";
import './routes.js';

// Accounts config
Accounts.ui.config({
    passwordSignupFields: "USERNAME_AND_EMAIL",
});
