import { Meteor } from 'meteor/meteor';
import { Messages } from './collections';

Meteor.publish('messages', function publishMessages() {
  return Messages.find({});
});