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
    const { profile } = Meteor.user();
    const thread = Threads.findOne({
      _id: profile.currentThreadId,
    });
    if (!thread) return [];
    const threadUsersId = thread.usersId;
    const users = threadUsersId.map(userId => {
      const user = Meteor.users.findOne({ _id: userId });
      if (!user) return undefined;
      if (user.profile?.pictureId) {
        user.profilePicture = ProfilePictures.findOne({
          _id: user.profile.pictureId,
        });
      } else if (user?.username) {
        user.firstLetter = user.username?.charAt(0);
      }
      if (profile.favoriteUsers.includes(user._id)) {
        user.isFavorite = 'TRUE';
      } else {
        user.isFavorite = 'FALSE';
      }

      return user;
    });

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
  },

  'click .add-favorite'(event) {
    event.preventDefault();

    if (Meteor.user()?.profile?.favoriteUsers.includes(this._id)) {
      Meteor.call('removeFavoriteUsers', this._id);
    } else {
      Meteor.call('addFavoriteUsers', this._id);
    }
  },
});
