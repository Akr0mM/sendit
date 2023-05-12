import { Meteor } from 'meteor/meteor';
import { Messages } from './collections';
import { Threads } from './collections';

Meteor.publish('messages', function publishMessages() {
  return Messages.find({});
});

Meteor.publish('threads', function publishThreads() {
  return Threads.find({});
});