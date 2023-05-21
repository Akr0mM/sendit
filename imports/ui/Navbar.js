import moment from 'moment';
import { Template } from 'meteor/templating';
import { Threads } from '../api/messages/collections';
import 'moment/locale/fr';

import './Navbar.html';
import './style/Navbar.css';

moment.updateLocale('fr', {
  relativeTime: {
    future: 'dans %s',
    s: '%d s',
    m: '%d m',
    mm: '%d m',
    h: '%d h',
    hh: '%d h',
    d: '%d j',
    dd: '%d j',
  },
});

let selectedChat;

Template.navbar.onCreated(function () {
  this.subscribe('users');
});

Template.navbar.onRendered(() => {
  Meteor.call('initThreads');
});

Template.navbar.helpers({
  chats() {
    // Créer tous les threads qui n'existent pas déjà
    Meteor.call('initThreads');

    const userId = Meteor.userId();
    const users = Meteor.users.find({ _id: { $ne: Meteor.userId() } }).fetch();
    const threads = [];

    // Trouver tous les threads existants et stocker la date du dernier message et le dernier message pour chaque thread
    Threads.find({ usersId: userId }).forEach(thread => {
      const otherUserId = thread?.usersId?.find(id => id !== userId);
      const lastChatAt = thread?.lastChatAt || undefined;
      const lastChatText =
        thread?.lastChatText || 'Envoyer votre premier message !';
      threads.push({ userId: otherUserId, lastChatAt, lastChatText });
    });

    // Ajouter les utilisateurs avec lesquels il n'y a pas de threads existants
    users.forEach(user => {
      const otherUserId = user._id;
      if (!threads.some(thread => thread.userId === otherUserId)) {
        threads.push({
          userId: otherUserId,
          lastChatAt: new Date(0),
          lastChatText: 'Envoyer votre premier message !',
        });
      }
    });

    // Trier les threads par date du dernier message et récupérer les utilisateurs correspondants
    const sortedThreads = threads.sort((a, b) => b.lastChatAt - a.lastChatAt);
    const sortedUsers = sortedThreads.map(thread => Meteor.users.findOne({ _id: thread?.userId }),
    );

    // Trouver le dernier message du thread et le stocker dans chaque utilisateur
    let userLastChat = sortedUsers.map(user => {
      if (!user) return;
      let threadId;
      let thread = Threads.findOne({
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
          lastChatTimeAgo = lastChatAt.locale('fr').fromNow(true);
        } else {
          lastChatTimeAgo = lastChatAt.locale('fr').format('L');
        }
        threadId = thread._id;
        thread.lastChatTimeAgo = lastChatTimeAgo;
      } else {
        thread = {
          usersId: [Meteor?.userId(), user?._id],
          lastChatText: 'Envoyer votre premier message !',
        };
      }
      const newUser = {};
      Object.assign(newUser, user);
      newUser.selectThreadId = threadId;
      // @ts-ignore
      newUser.lastChatText = thread?.lastChatText;
      if (
        thread?.lastChatTimeAgo === moment(new Date(0)).locale('fr').format('L')
      ) {
        // @ts-ignore
        newUser.lastChatTimeAgo = '';
        // @ts-ignore
      } else newUser.lastChatTimeAgo = `  •  ${thread?.lastChatTimeAgo}`;

      // eslint-disable-next-line consistent-return
      return newUser;
    });

    userLastChat = userLastChat.filter(element => element !== undefined);
    return userLastChat;
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

Template.logoutButton.events({
  'click .logout-button'(event) {
    event.preventDefault();

    Meteor.logout();
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
});

Template.profileButton.helpers({
  profilePicture() {
    return 'M';
  },
});
