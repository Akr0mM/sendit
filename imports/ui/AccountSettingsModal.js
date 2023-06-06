import { Template } from 'meteor/templating';
import { ProfilePictures } from '../api/users/ProfilePictures';

import './AccountSettingsModal.html';
import './style/AccountSettingsModal.css';

Template.accountSettingsModal.events({
  'click .close-modal'() {
    document.querySelector('.chat').classList.remove('blur');
    Session.set('showModal', false);
  },

  'click .modify-info-username'() {
    Session.set('modify-username', true);
  },

  'click .modify-info-email'() {
    Session.set('modify-email', true);
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

  currentUserUsername() {
    return Meteor.user()?.username;
  },

  currentUserEmail() {
    return Meteor.user()?.emails[0].address;
  },

  showModifyUsername() {
    return Session.get('modify-username');
  },

  showModifyEmail() {
    return Session.get('modify-email');
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
          // eslint-disable-next-line no-alert
          alert(`Error during upload: ${error}`);
        } else {
          Session.set(
            'previousProfilePicture',
            Meteor.user()?.profile?.pictureId,
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
    if (Session.get('previousProfilePicture')) {
      ProfilePictures.remove({ _id: Meteor.user()?.profile?.pictureId });
      Meteor.users.update(Meteor.userId(), {
        $set: { 'profile.pictureId': Session.get('previousProfilePicture') },
      });
    } else {
      ProfilePictures.remove({ _id: Meteor.user()?.profile?.pictureId });
      Meteor.users.update(Meteor.userId(), {
        $set: { 'profile.pictureId': null },
      });
    }
  },

  'click #done-icon'(event, templateInstance) {
    event.preventDefault();
    ProfilePictures.remove({ _id: Session.get('previousProfilePicture') });

    templateInstance.confirmation.set(false);
  },
});

Template.modifyUsernameModal.helpers({
  currentUserUsername() {
    return Meteor.user()?.username;
  },
});

Template.modifyUsernameModal.events({
  'submit form'(event, templateInstance) {
    event.preventDefault();

    // Récupérer les valeurs des champs de formulaire
    const newUsername = templateInstance.find('#new-username').value.trim();
    const currentPassword = templateInstance
      .find('#current-password')
      .value.trim();

    // Appeler une méthode Meteor pour effectuer le changement de nom d'utilisateur
    Meteor.call('changeUsername', newUsername, currentPassword, error => {
      if (error) {
        // Gérer l'erreur (affichage d'un message d'erreur, etc.)
        console.log('Une erreur s\'est produite :', error.reason);
      } else {
        // Succès du changement de nom d'utilisateur
        console.log('Le nom d\'utilisateur a été modifié avec succès !');
        // Réinitialiser le formulaire (facultatif)
        templateInstance.find('form').reset();
      }
    });
  },

  'click .cancel-btn'(event) {
    event.preventDefault();

    Session.set('modify-username', false);
  },
});
