import { Template } from "meteor/templating";
import { Accounts } from "meteor/accounts-base";
import { Meteor } from "meteor/meteor";

import "./main.html";
import "../imports/ui/App.js";

// Accounts config
Accounts.ui.config({
    passwordSignupFields: "USERNAME_AND_EMAIL",
});
