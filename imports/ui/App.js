// @ts-ignore
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import { Threads } from '../api/messages/collections';
import { ProfilePictures } from '../api/users/ProfilePictures';

import './App.html';
import './style/App.css';
import './Chat';
import './Form';
import './Navbar';

import './Login';
import './Register';

const IS_LOADING_STRING = 'isLoading';

window.addEventListener('load', () => {
  Meteor.call('userOnline');
});

window.addEventListener('beforeunload', () => {
  Meteor.call('userOffline');
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
  currentGroupName() {
    let groupName;
    const currentThreadId = Meteor.user()?.profile?.currentThreadId;
    if (!currentThreadId) {
      return ['none'];
    }
    const currentThread = Threads.findOne({ _id: currentThreadId });
    if (!currentThread) {
      return ['none'];
    }

    const { usersId } = currentThread;
    if (usersId.length > 2) groupName = currentThread?.groupName;
    else if (usersId.length === 1) {
      console.log('solo conv ?');
    } else {
      usersId.forEach(userId => {
        if (userId !== Meteor.userId()) {
          groupName = Meteor.users.findOne({ _id: userId })?.username;
        }
      });
    }

    return groupName;
  },
});

Template.accountSettingsModal.events({
  'click .close-modal'() {
    document.querySelector('.chat').classList.remove('blur');
    Session.set('showModal', false);
  },
});

Template.accountSettingsModal.helpers({
  currentProfilePicture() {
    return Meteor.user()?.profile?.pictureId;
  },

  profilePicture() {
    const profilePictureId = Meteor.user()?.profile?.pictureId;
    const profilePicture = ProfilePictures.findOne({ _id: profilePictureId });
    return profilePicture;
  },

  firstLetter() {
    const user = Meteor.user();
    if (user && user.username) {
      return user.username.charAt(0);
    }
    return '';
  },
});

Template.uploadForm.onCreated(function () {
  this.currentUpload = new ReactiveVar(false);
  this.confirmation = new ReactiveVar(false);
});

Template.uploadForm.helpers({
  currentUpload() {
    // @ts-ignore
    return Template.instance()?.currentUpload.get();
  },

  confirmation() {
    // @ts-ignore
    return Template.instance()?.confirmation.get();
  },
});

Template.uploadForm.events({
  'change #fileInput'(event, templateInstance) {
    event.preventDefault();
    if (event.currentTarget.files && event.currentTarget.files[0]) {
      const upload = ProfilePictures.insert(
        {
          file: event.currentTarget.files[0],
          chunkSize: 'dynamic',
        },
        false,
      );

      upload.on('start', function () {
        templateInstance.currentUpload.set(this);
      });

      upload.on('end', (error, fileObj) => {
        if (error) {
          alert(`Error during upload: ${error}`);
        } else {
          Session.set(
            'previousProfilePicture',
            Meteor.user().profile.pictureId,
          );
          Meteor.users.update(Meteor.userId(), {
            $set: { 'profile.pictureId': fileObj._id },
          });

          templateInstance.confirmation.set(true);
        }
        templateInstance.currentUpload.set(false);
      });

      upload.start();
    }
  },

  'click #close-icon'(event, templateInstance) {
    event.preventDefault();

    templateInstance.confirmation.set(false);
    Meteor.users.update(Meteor.userId(), {
      $set: { 'profile.pictureId': Session.get('previousProfilePicture') },
    });
  },

  'click #done-icon'(event, templateInstance) {
    event.preventDefault();

    templateInstance.confirmation.set(false);
  },
});
