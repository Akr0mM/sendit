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

  const self = this;

  $(document).on('click', event => {
    const dropdown = self.$('.add-group-dropdown');
    const btn = self.$('.add-group-btn');
    if (dropdown.is(':visible')) {
      if (
        !dropdown.is(event.target) &&
        !btn.is(event.target) &&
        dropdown.has(event.target).length === 0
      ) {
        dropdown.hide();
      }
    }
  });
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
      let otherUserId;
      let lastChatAt;
      if (thread.usersId.length === 2) {
        otherUserId = thread.usersId?.find(id => id !== userId);
        lastChatAt = thread?.lastChatAt;
      } else {
        otherUserId = thread.usersId.map(id => {
          if (id !== userId) return id;
          else return null;
        });
        otherUserId.unshift(thread._id);
        lastChatAt = thread?.lastChatAt;
      }
      threads.push({ userId: otherUserId, lastChatAt });
    });

    // Trier les threads par date du dernier message et récupérer les utilisateurs correspondants
    const sortedThreads = threads.sort((a, b) => b.lastChatAt - a.lastChatAt);
    const sortedUsers = sortedThreads.map(thread => {
      const users = Array.isArray(thread.userId) ?
        thread.userId.map((id, index) => (index === 0 ? id : Meteor.users.findOne({ _id: id })),
        ) :
        Meteor.users.findOne({ _id: thread.userId });
      return users;
    });

    // Trouver le dernier message du thread et le stocker dans chaque utilisateur
    let usersLastChat = sortedUsers.map(user => {
      if (!user) return;
      let threadId;
      let thread;
      if (Array.isArray(user)) {
        thread = Threads.findOne({ _id: user[0] });
        user.splice(0, 1);
      } else {
        thread = Threads.findOne({
          $or: [
            { usersId: { $all: [Meteor.userId(), user._id] } },
            { usersId: { $all: [user._id, Meteor.userId()] } },
          ],
        });
      }

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
          } else if (moment().diff(lastChatAt, 'days') !== 0) {
            lastChatTimeAgo = `${moment()
              .diff(lastChatAt, 'days')
              .toString()}j`;
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

      const nbUser = {};
      if (thread.name) {
        const users = user.filter(element => element !== undefined);
        nbUser.selectThreadId = threadId;
        nbUser.username = thread.name;
        nbUser.firstLetter = nbUser.username.charAt(0);
        nbUser.profilePictureId = thread.profilePictureId;
        if (nbUser.profilePictureId) {
          nbUser.profilePicture = ProfilePictures.findOne({
            _id: nbUser.profilePictureId,
          });
        }
        if (
          thread?.lastChatTimeAgo ===
          moment(new Date(0)).locale('fr').format('L')
        ) {
          // @ts-ignore
          nbUser.lastChatTimeAgo = '';
          // @ts-ignore
        } else nbUser.lastChatTimeAgo = `  •  ${thread?.lastChatTimeAgo}`;

        if (thread?.lastChatText) {
          nbUser.lastChatText = thread?.lastChatText;
        } else {
          nbUser.lastChatText = 'Envoyer votre premier message !';
          nbUser.lastChatTimeAgo = '';
        }

        let isOnline = false;
        let isAway = false;

        for (let i = 0; i < users.length; i++) {
          const { status } = users[i].profile;

          if (status.isOnline && !status.isInvisible && !status.isAway) {
            isOnline = true;
            break;
          } else if (status.isAway && !status.isInvisible && status.isOnline) {
            isAway = true;
          }
        }

        let statusIcon = '';

        if (isOnline) {
          statusIcon = `<div class="status-icon-background" style="width: 18px; left: 39px; top: -17px;"><div class="status-icon-online" style="width: 12px;"></div></div>`;
        } else if (isAway) {
          statusIcon = `<div class="status-icon-background" style="width: 18px; left: 39px; top: -17px;"><div class="status-icon-away" style="width: 12px;"></div></div>`;
        } else {
          statusIcon = `<div class="status-icon-background" style="width: 18px; left: 39px; top: -17px;"><div class="status-icon-invisible" style="width: 12px;"><div style="width: 6px;"></div></div></div>`;
        }

        nbUser.statusIcon = statusIcon;
      } else {
        Object.assign(nbUser, user);
        nbUser.profilePictureId = Meteor.users.findOne({
          _id: nbUser._id,
        }).profile?.pictureId;
        if (nbUser.profilePictureId) {
          nbUser.profilePicture = ProfilePictures.findOne({
            _id: nbUser.profilePictureId,
          });
        }
        if (nbUser && nbUser.username) {
          nbUser.firstLetter = nbUser.username.charAt(0);
        } else {
          nbUser.firstLetter = '';
        }
        nbUser.selectThreadId = threadId;
        if (
          thread?.lastChatTimeAgo ===
          moment(new Date(0)).locale('fr').format('L')
        ) {
          // @ts-ignore
          nbUser.lastChatTimeAgo = '';
          // @ts-ignore
        } else nbUser.lastChatTimeAgo = `  •  ${thread?.lastChatTimeAgo}`;

        if (thread?.lastChatText) {
          nbUser.lastChatText = thread?.lastChatText;
        } else {
          nbUser.lastChatText = 'Envoyer votre premier message !';
          nbUser.lastChatTimeAgo = '';
        }

        // status of the user
        if (
          !nbUser?.profile?.status?.isOnline ||
          nbUser?.profile?.status?.isInvisible
        ) {
          nbUser.statusIcon = `<div class="status-icon-background" style="width: 18px; left: 39px; top: -17px;"><div class="status-icon-invisible" style="width: 12px;"><div style="width: 6px;"></div></div>`;
        } else if (nbUser?.profile?.status?.isAway) {
          nbUser.statusIcon = `<div class="status-icon-background" style="width: 18px; left: 39px; top: -17px;"><div class="status-icon-away" style="width: 12px;"</div></div>`;
        } else if (nbUser?.profile?.status?.isOnline) {
          nbUser.statusIcon = `<div class="status-icon-background" style="width: 18px; left: 39px; top: -17px;"><div class="status-icon-online" style="width: 12px;"></div></div>`;
        } else nbUser.statusIcon = '';
      }

      // eslint-disable-next-line consistent-return
      return nbUser;
    });

    usersLastChat = usersLastChat.filter(element => element !== undefined);
    return usersLastChat;
  },
});

Template.chatWithUsers.onCreated(function () {
  this.isHover = new ReactiveVar(false);
  this.editDropdown = new ReactiveVar(false);
  this.btn1 = new ReactiveVar(undefined);
  this.btn2 = new ReactiveVar(undefined);

  this.handleMouseOver = function setHoverTrue() {
    this.isHover.set(true);
    this.btn1.set($('.edit-navbar'));
    this.btn2.set($('.edit-navbar-icon'));
  };

  this.handleMouseOut = function setHoverFalse() {
    if (!this.editDropdown.get()) {
      console.log('editDropdown false');
      this.isHover.set(false);
    }
  };

  $(document).on('click', event => {
    const dropdown = $('.edit-dropdown');
    const btn1 = this.btn1.get();
    const btn2 = this.btn2.get();
    if (this.editDropdown.get()) {
      console.log('dropdown ', this.editDropdown.get());
      if (
        !dropdown.is(event.target) &&
        !btn1.is(event.target) &&
        !btn2.is(event.target) &&
        dropdown.has(event.target).length === 0
      ) {
        dropdown.hide();
        this.isHover.set(false);
        this.editDropdown.set(false);
      }
    }
  });
});

Template.chatWithUsers.helpers({
  isHover() {
    const template = Template.instance();
    return template.isHover.get();
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
    if (
      target?.classList.contains('edit-navbar') ||
      target?.classList.contains('edit-navbar-icon')
    ) return;
    while (!target?.classList.contains('user-chat')) {
      target = target.parentNode;
    }
    selectedChat?.classList.remove('selected-chat');
    target?.classList.add('selected-chat');
    selectedChat = target;

    Meteor.call('setCurrentThreadId', this.selectThreadId);
  },

  'click .add-group-btn'(event, templateInstance) {
    templateInstance.$('.add-group-dropdown').toggle();
  },
});

Template.chatWithUsers.events({
  'mouseover .user-chat'(event, templateInstance) {
    templateInstance.handleMouseOver();
  },

  'mouseout .user-chat'(event, templateInstance) {
    templateInstance.handleMouseOut();
  },

  'click .edit-navbar-icon'(event, templateInstance) {
    const dropdown = Template.instance().editDropdown;
    dropdown.set(!dropdown.get());
    console.log(templateInstance.$('.edit-dropdown'));
    templateInstance.$('.edit-dropdown').toggle();
  },
});

Template.chatWithUsers.helpers({
  isSelect(threadId) {
    if (threadId === Meteor.user().profile?.currentThreadId) return true;
    else return false;
  },
});

Template.profileButton.events({
  'click .btn-profile'(event, templateInstance) {
    templateInstance.$('.dropdown-menu').toggle();
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

Template.addGroupDropdown.helpers({
  favs() {
    const hasFavorites = Meteor.user().profile.favoriteUsers.length;

    const favs = Meteor.user().profile.favoriteUsers;
    const users = favs.map(userId => {
      const user = Meteor.users.findOne({ _id: userId });
      if (!user) return {};
      user.profilePicture = ProfilePictures.findOne({
        _id: user.profile.pictureId,
      });
      user.firstLetter = user.username.charAt(0);
      return user;
    });

    const showExpand = users.length > 4;
    const firstUsers = users.slice(0, 4);
    const restOfUsers = users.splice(4);

    return {
      hasFavorites,
      firstUsers,
      showExpand,
      restOfUsers,
      isExpanded: Session.get('expandFavorites'),
    };
  },

  recents() {
    return {
      hasRecents: true,
    };
  },
});

Template.addGroupDropdown.events({
  'click .favorite-user'(event, templateInstance) {
    const checkbox = templateInstance
      .$(event.currentTarget)
      .find('input[type="checkbox"]');
    checkbox.prop('checked', !checkbox.prop('checked'));
  },

  'click .expand-favorites'() {
    Session.set('expandFavorites', !Session.get('expandFavorites'));
  },

  'click .add-group-create'() {
    const checkboxs = document.querySelectorAll('input[type=checkbox]');
    const checked = [].filter.call(checkboxs, checkbox => checkbox.checked);
    const users = checked.map(input => Meteor.users.findOne({ _id: input.id }));
    users.push(Meteor.user());
    // @ts-ignore
    const groupName = document.querySelector('.group-name-input').value;
    if (groupName === '') return;
    Meteor.call('createGroup', users, groupName);
  },
});
