// @ts-nocheck
import { Meteor } from 'meteor/meteor';

Meteor.publish('users', () => Meteor.users.find({}, { projection: { username: 1, profile: 1 } }),
);
