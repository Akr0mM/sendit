import moment from 'moment';
import { Template } from 'meteor/templating';
import { Threads } from '../api/messages/collections';
import { ProfilePictures } from '../api/users/ProfilePictures';
import 'moment/locale/fr';

import './Navbar.html';
import './style/Navbar.css';

moment.updateLocale('fr', {
  relativeTime: { s: '%ds', m: '%dm' },
});

const months = [
  'janv.',
  'fevr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'aout',
  'sept.',
  'oct.',
  'nov.',
  'dec.',
];

let selectedChat;

Template.navbar.onCreated(function () {
  this.subscribe('users');
});

Template.navbar.onRendered(() => {
  Meteor.call('initThreads');
  setInterval(() => {
    Meteor.call('updateNavbarTimestamps');
  }, 25000);
});

Template.navbar.helpers({
  chats() {
    // eslint-disable-next-line no-unused-vars
    const updateTimestamps = Threads.findOne({ name: 'UPDATE' });
    const userId = Meteor.userId();
    const threads = [];

    // Trouver tous les threads existants et stocker la date du dernier message et le dernier message pour chaque thread
    Threads.find({ usersId: userId }).forEach(thread => {
      const otherUserId = thread?.usersId?.find(id => id !== userId);
      const lastChatAt = thread?.lastChatAt || undefined;
      threads.push({ userId: otherUserId, lastChatAt });
    });

    // Trier les threads par date du dernier message et récupérer les utilisateurs correspondants
    const sortedThreads = threads.sort((a, b) => b.lastChatAt - a.lastChatAt);
    const sortedUsers = sortedThreads.map(thread => Meteor.users.findOne({ _id: thread?.userId }),
    );

    // Trouver le dernier message du thread et le stocker dans chaque utilisateur
    let usersLastChat = sortedUsers.map(user => {
      if (!user) return;
      let threadId;
      const thread = Threads.findOne({
        $or: [
          { usersId: { $all: [Meteor.userId(), user?._id] } },
          { usersId: { $all: [user?._id, Meteor.userId()] } },
        ],
      });

      if (thread) {
        const lastChatAt = moment(thread?.lastChatAt);
        let lastChatTimeAgo;

        if (moment().diff(lastChatAt, 'seconds') < 10) {
          lastChatTimeAgo = 'à l\'instant';
        } else if (moment().diff(lastChatAt, 'days') < 7) {
          if (
            moment().diff(lastChatAt, 'days') === 0 &&
            moment().diff(lastChatAt, 'hours') > 0
          ) {
            lastChatTimeAgo = `${moment()
              .diff(lastChatAt, 'hours')
              .toString()}h`;
          } else if (moment().diff(lastChatAt, 'minutes') === 0) {
            lastChatTimeAgo = lastChatAt.locale('fr').fromNow(true);
          } else {
            lastChatTimeAgo = `${moment()
              .diff(lastChatAt, 'minutes')
              .toString()}m`;
          }
        } else if (moment().diff(lastChatAt, 'years') === 0) {
          const day = lastChatAt.get('date');
          const monthIndex = lastChatAt.get('month');
          const month = months[monthIndex];
          lastChatTimeAgo = `${day} ${month}`;
        } else if (moment().diff(lastChatAt, 'years') === 1) lastChatTimeAgo = `il y a 1 an`;
        else {
          lastChatTimeAgo = `il y a ${moment().diff(lastChatAt, 'years')} ans`;
        }
        threadId = thread._id;
        thread.lastChatTimeAgo = lastChatTimeAgo;
      } else {
        throw new Meteor.Error(
          'Thread not founded',
          'thread is undefined : l. 106',
        );
      }
      const newUser = {};
      Object.assign(newUser, user);
      newUser.profilePictureId = Meteor.users.findOne({
        _id: newUser._id,
      }).profile?.pictureId;
      if (newUser.profilePictureId) {
        newUser.profilePicture = ProfilePictures.findOne({
          _id: newUser.profilePictureId,
        });
      }
      if (newUser && newUser.username) {
        newUser.firstLetter = newUser.username.charAt(0);
      } else {
        newUser.firstLetter = '';
      }
      newUser.selectThreadId = threadId;
      if (
        thread?.lastChatTimeAgo === moment(new Date(0)).locale('fr').format('L')
      ) {
        // @ts-ignore
        newUser.lastChatTimeAgo = '';
        // @ts-ignore
      } else newUser.lastChatTimeAgo = `  •  ${thread?.lastChatTimeAgo}`;

      if (thread?.lastChatText) {
        newUser.lastChatText = thread?.lastChatText;
      } else {
        newUser.lastChatText = 'Envoyer votre premier message !';
        newUser.lastChatTimeAgo = '';
      }

      // status of the user
      if (
        !newUser?.profile?.status?.isOnline ||
        newUser?.profile?.status?.isInvisible
      ) {
        newUser.statusIcon = `<div class="status-icon-background" style="width: 18px; left: 39px; top: -17px;"><div class="status-icon-invisible" style="width: 12px;"><div style="width: 6px;"></div></div>`;
      } else if (newUser?.profile?.status?.isAway) {
        newUser.statusIcon = `<div class="status-icon-background" style="width: 18px; left: 39px; top: -17px;"><div class="status-icon-away" style="width: 12px;"</div></div>`;
      } else if (newUser?.profile?.status?.isOnline) {
        newUser.statusIcon = `<div class="status-icon-background" style="width: 18px; left: 39px; top: -17px;"><div class="status-icon-online" style="width: 12px;"></div></div>`;
      } else newUser.statusIcon = '';

      // eslint-disable-next-line consistent-return
      return newUser;
    });

    usersLastChat = usersLastChat.filter(element => element !== undefined);
    return usersLastChat;
  },
});

Template.chatWithUsers.helpers({
  isSelect(threadId) {
    if (threadId === Meteor.user().profile?.currentThreadId) return true;
    else return false;
  },
});

Template.navbar.events({
  'click .user-chat'(event) {
    let { target } = event;
    while (!target?.classList?.contains('user-chat')) {
      target = target.parentNode;
    }
    selectedChat?.classList?.remove('selected-chat');
    target.classList.add('selected-chat');
    selectedChat = target;

    Meteor.call('setCurrentThreadId', this._id);
  },
});

Template.profileButton.events({
  'click .btn-profile'(event, templateInstance) {
    templateInstance.$('.dropdown-menu').toggle(); // Afficher ou masquer le menu déroulant
  },

  'click .account-settings'(event, templateInstance) {
    templateInstance.$('.dropdown-menu').toggle();
    Session.set('showModal', true);
  },

  'click .logout-button'(event) {
    event.preventDefault();

    Meteor.call('userOnline', false);

    Meteor.logout();
  },

  'click .status-settings'(event) {
    event.preventDefault();

    const currentUser = Meteor.user();
    const currentStatus = currentUser?.profile?.status;

    if (currentStatus.isInvisible) {
      Meteor.call('userAway', false);
      Meteor.call('userInvisible', false);
    } else if (currentStatus.isAway) {
      Meteor.call('userAway', false);
      Meteor.call('userInvisible', true);
    } else {
      Meteor.call('userAway', true);
      Meteor.call('userInvisible', false);
    }
  },
});

Template.profileButton.helpers({
  currentProfilePicture() {
    return Meteor.user()?.profile?.pictureId;
  },

  profilePicture() {
    const currentUser = Meteor.user();
    const profilePictureId = currentUser?.profile?.pictureId;
    const profilePicture = ProfilePictures.findOne({ _id: profilePictureId });
    return profilePicture;
  },

  ppStatus() {
    const currentUser = Meteor.user();
    if (!currentUser?.profile?.status?.isOnline) {
      return '';
    } else if (currentUser?.profile?.status?.isInvisible) {
      return `<div class="status-icon-background" style="width: 18px; left: 34px; top: -16px;"><div class="status-icon-invisible" style="width: 12px;"><div style="width: 6px;"></div></div>`;
    } else if (currentUser?.profile?.status?.isAway) {
      return `<div class="status-icon-background" style="width: 18px; left: 34px; top: -16px;"><div class="status-icon-away" style="width: 12px;"></div></div>`;
    } else if (currentUser?.profile?.status?.isOnline) {
      return `<div class="status-icon-background" style="width: 18px; left: 34px; top: -16px;"><div class="status-icon-online" style="width: 12px;"></div></div>`;
    } else return '';
  },

  firstLetter() {
    const user = Meteor.user();
    if (user && user.username) {
      return user.username.charAt(0);
    }
    return '';
  },

  currentStatus() {
    const currentUser = Meteor.user();
    if (currentUser?.profile?.status?.isInvisible) return 'Statut &nbsp;: &nbsp;Invisible';
    else if (currentUser?.profile?.status?.isAway) return 'Statut &nbsp;: &nbsp;Absent';
    else return 'Statut &nbsp;: &nbsp;En ligne';
  },
});
