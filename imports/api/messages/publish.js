import { Meteor } from 'meteor/meteor';
import { Messages, Threads } from './collections';

Meteor.publish('messages', () => Messages.find({}));

Meteor.publish('threads', () => Threads.find({}));
