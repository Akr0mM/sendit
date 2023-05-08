import { Meteor } from 'meteor/meteor';

Meteor.publish('users', function () {
  return Meteor.users.find({}, { projection: { username: 1, profile: 1 } });
});
