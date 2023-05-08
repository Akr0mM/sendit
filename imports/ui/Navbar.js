import { Template } from 'meteor/templating';

import './Navbar.html';

Template.navbar.onCreated(function () {
    this.subscribe('users');
});

Template.navbar.helpers({
    chats() {
        return Meteor.users.find({ _id: { $ne: Meteor.userId() } });
    },
});

Template.navbar.events({
    'click .user-last-chats'() {
        Meteor.call('setCurrentThreadId', this._id);
    }
});