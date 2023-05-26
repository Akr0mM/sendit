import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { check } from 'meteor/check';
import { Messages, Threads } from './collections';

function isValidUsername(username) {
  if (username) {
    return true;
  } else {
    return false;
  }
}

Meteor.methods({
  'messages.insert'(text) {
    check(text, String);

    if (!this.userId) {
      throw new Meteor.Error('Not authorized.');
    }

    // Récupérer l'identifiant du thread
    const threadId = Meteor.user()?.profile?.currentThreadId;

    // Insérer un nouveau document dans la collection "Messages"
    Messages.insert({
      text,
      threadId,
      authorId: Meteor.userId(),
      authorUsername: Meteor.user()?.username,
      createdAt: new Date(),
    });

    Threads.update(threadId, { $set: { lastChatAt: new Date() } });
    Threads.update(threadId, { $set: { lastChatText: text } });
  },

  setCurrentThreadId(targetUserId) {
    check(targetUserId, String);

    const currentUser = Meteor.userId();
    const thread = Threads.findOne({
      $or: [
        { usersId: { $all: [currentUser, targetUserId] } },
        { usersId: { $all: [targetUserId, currentUser] } },
      ],
    });

    if (!thread) {
      console.log('error: thread not found methods.js');
    } else {
      Meteor.users.update(currentUser, {
        $set: { 'profile.currentThreadId': thread._id },
      });
    }
  },

  userOnline() {
    Meteor.users.update(Meteor.userId(), {
      $set: { 'profile.isOnline': true },
    });
  },

  userOffline() {
    Meteor.users.update(Meteor.userId(), {
      $set: { 'profile.isOnline': false },
    });
  },

  initThreads() {
    Meteor.users.find({ _id: { $ne: Meteor.userId() } }).forEach(user => {
      const currentUser = Meteor.userId();
      const targetUserId = user && user._id;

      if (
        // si le thread n'existe pas
        !Threads.findOne({
          $or: [
            { usersId: { $all: [currentUser, targetUserId] } },
            { usersId: { $all: [targetUserId, currentUser] } },
          ],
        })
      ) {
        // en creer un
        const targetUsername = Meteor.users.findOne({
          _id: targetUserId,
        })?.username;
        const currentUserUsername = Meteor.user()?.username;
        Threads.insert({
          usersId: [currentUser, targetUserId],
          usersUsernames: [currentUserUsername, targetUsername],
          lastChatText: 'Envoyer votre premier message !',
          lastChatAt: new Date(0),
          lastChatTimeAgo: new Date(0),
        });
      }
    });
  },

  appCreateUser(email, username, password) {
    check(email, String);
    check(username, String);
    check(password, String);

    if (Meteor.users.findOne({ username })) {
      throw new Meteor.Error(
        'username-already-exists',
        'A user with the same email already exists',
      );
    }

    if (Meteor.users.findOne({ 'emails.address': email })) {
      throw new Meteor.Error(
        'email-already-exists',
        'A user with the same username already exists',
      );
    }

    const user = {
      email,
      username,
      password,
      profile: {
        isOnline: true,
        currentThreadId: null,
        pictureId: null,
      },
    };

    const userId = Accounts.createUser(user);
    return userId;
  },

  changeUsername(newUsername, currentPassword) {
    check(newUsername, String);
    check(currentPassword, String);

    // Vérifier si le nouveau nom d'utilisateur est valide (ajoutez vos propres validations ici)
    if (!isValidUsername(newUsername)) {
      throw new Meteor.Error(
        'invalid-username',
        'Le nom d\'utilisateur est invalide.',
      );
    }

    // Vérifier si le mot de passe actuel est correct
    const user = Meteor.user();
    const passwordCorrect = Accounts._checkPassword(user, currentPassword);
    if (!passwordCorrect) {
      throw new Meteor.Error(
        'incorrect-password',
        'Le mot de passe actuel est incorrect.',
      );
    }

    // Effectuer le changement de nom d'utilisateur
    try {
      Accounts.setUsername(Meteor.userId(), newUsername);
      // Vous pouvez également mettre à jour d'autres champs de l'utilisateur si nécessaire
    } catch (error) {
      throw new Meteor.Error(
        'username-update-failed',
        'Échec de la mise à jour du nom d\'utilisateur.',
      );
    }
  },
});
