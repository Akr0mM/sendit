import { Meteor } from "meteor/meteor";
import { check } from "meteor/check";
import { Messages } from "./collections";
import { Threads } from "./collections";

Meteor.methods({
  "messages.insert"(text) {
    check(text, String);

    if (!this.userId) {
      throw new Meteor.Error("Not authorized.");
    }

    // Récupérer l'identifiant du thread
    const threadId = Meteor.user()?.profile?.currentThreadId;

    // Insérer un nouveau document dans la collection "Messages"
    Messages.insert({
      text,
      threadId: threadId,
      authorId: Meteor.userId(),
      authorUsername: Meteor.user()?.username,
      createdAt: new Date(),
    });

    const thread = Threads.findOne({ _id: threadId });
    Threads.update(threadId, { $set: { lastChatAt: new Date() } });
    Threads.update(threadId, { $set: { lastChatText: text } });
  },

  setCurrentThreadId(targetUserId) {
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
        $set: { "profile.currentThreadId": thread._id },
      });
    }
  },

  removeCurrentThreadId() {
    Meteor.users.update(Meteor.userId(), {
      $unset: { "profile.currentThreadId": "" },
    });
  },

  userOnline() {
    Meteor.users.update(Meteor.userId(), {
      $set: { "profile.isOnline": true },
    });
  },

  userOffline() {
    Meteor.users.update(Meteor.userId(), {
      $set: { "profile.isOnline": false },
    });
  },

  initThreads() {
    Meteor.users.find({ _id: { $ne: Meteor.userId() } }).forEach(user => {
      const currentUser = Meteor.userId();
      const targetUserId = user && user._id;

      if ( // si le thread n'existe pas
        !Threads.findOne({
          $or: [
            { usersId: { $all: [currentUser, targetUserId] } },
            { usersId: { $all: [targetUserId, currentUser] } },
          ],
        })
      ) { // en creer un
        const targetUsername = Meteor.users.findOne({
          _id: targetUserId,
        })?.username;
        const currentUserUsername = Meteor.user()?.username;
        Threads.insert({
          usersId: [currentUser, targetUserId],
          usersUsernames: [currentUserUsername, targetUsername],
          lastChatText: "Envoyer votre premier message !",
          lastChatAt: new Date(0),
          lastChatTimeAgo: new Date(0)
        });
      }
    });

    if (!Threads.findOne({ userId: Meteor.userId() })) {
      Threads.insert({
        userId: Meteor.userId(),
        userUsernames: Meteor.user().username,
        lastChatText: "Envoyer votre premier message a vous même !",
        lastChatAt: new Date(0)
      });
    }
  },

  appCreateUser(email, username, password) {
    if (Meteor.users.findOne({ 'emails.address': email }) || Meteor.users.findOne({ username: username })) {
      throw new Meteor.Error('user-already-exists', 'A user with the same email or username already exists.');
    }

    const user = {
      email: email,
      username: username,
      password: password,
      profile: {
        isOnline: true
      }
    };

    const userId = Accounts.createUser(user);
    return userId;
  }
});
