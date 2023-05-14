import { Meteor } from 'meteor/meteor';
import { Messages } from '../imports/api/messages/collections';
import '../imports/api/messages/methods';
import '/imports/api/messages/publish';
import '/imports/api/users/publish';
import { Accounts } from "meteor/accounts-base";


Meteor.startup(() => {
    //
});
