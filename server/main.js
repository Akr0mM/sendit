import { Meteor } from 'meteor/meteor';
import { Messages } from '../imports/api/messages/collections';
import '../imports/api/messages/methods';
import '/imports/api/messages/publish';
import '/imports/api/users/publish';

Meteor.startup(() => {
    //
 });