// @ts-nocheck
// @ts-ignore
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import { ProfilePictures } from '../api/users/ProfilePictures';
import { Threads } from '../api/messages/collections';

import './App.html';
import './style/App.css';
import './Chat';
import './Form';
import './Navbar';
import './AccountSettingsModal';

import './Login';
import './Register';

const IS_LOADING_STRING = 'isLoading';

window.addEventListener('load', () => {
  if (window.location.pathname === '/chat') {
    Meteor.call('userOnline', true);
  }
});

window.addEventListener('beforeunload', () => {
  Meteor.call('userOnline', false);
});

Template.chatMessages.onCreated(function chatContainerOnCreated() {
  this.state = new ReactiveDict();

  const handlerThreads = Meteor.subscribe('threads');
  const handlerMessages = Meteor.subscribe('messages');
  Tracker.autorun(() => {
    this.state.set(IS_LOADING_STRING, !handlerThreads.ready());
    this.state.set(IS_LOADING_STRING, !handlerMessages.ready());
  });
});

Template.chatMessages.helpers({
  isLoading() {
    const instance = Template.instance();
    return instance?.state.get(IS_LOADING_STRING);
  },
});

Template.chat.onCreated(() => {
  Accounts.onLogout(() => {
    FlowRouter.go('/login');
  });
});

Template.chat.helpers({
  openChat() {
    return Meteor.user()?.profile?.currentThreadId;
  },

  showModal() {
    // document.querySelector('.chat').classList.add('blur');
    // return true;

    if (Session.get('showModal')) {
      document.querySelector('.chat').classList.add('blur');
      return true;
    } else return false;
  },
});

Template.chatOpen.helpers({
  groupNames() {
    const thread = Threads.findOne({
      _id: Meteor.user().profile.currentThreadId,
    });
    if (!thread) return;
    const threadUsersId = thread.usersId;
    // const index = threadUsersId.indexOf(Meteor.userId());
    // // eslint-disable-next-line no-unused-vars
    // const splice = threadUsersId.splice(index, 1);
    const users = threadUsersId.map(userId => {
      const User = Meteor.users.findOne({ _id: userId });
      const user = {};
      Object.assign(user, User);
      user.profilePictureId = user?.profile?.pictureId;
      if (user.profilePictureId) {
        user.profilePicture = ProfilePictures.findOne({
          _id: user.profilePictureId,
        });
      } else if (user && user.username) {
        user.firstLetter = user.username.charAt(0);
      }
      return user;
    });

    // eslint-disable-next-line consistent-return
    return users;
  },
});

Template.groupName.onRendered(() => {
  const names = document.querySelector('.group-names');
  names.addEventListener(
    'wheel',
    event => {
      // @ts-ignore
      const delta = event.deltaY;
      names.scrollLeft += delta / 5;
    },
    { passive: true },
  );
});

Template.groupName.events({
  'click .group-user-container'(event, templateInstance) {
    event.preventDefault();
    templateInstance.$('.profile-dropdown-menu').toggle();
    console.log(this);
  },
});
