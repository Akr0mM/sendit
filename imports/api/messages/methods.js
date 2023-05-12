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
      const targetUsername = Meteor.users.findOne({
        _id: targetUserId,
      })?.username;
      const currentUserUsername = Meteor.user()?.username;
      Threads.insert({
        usersId: [currentUser, targetUserId],
        usersUsernames: [currentUserUsername, targetUsername],
        createdAt: new Date(),
      });

      const newThread = Threads.findOne({
        $or: [
          { usersId: { $all: [currentUser, targetUserId] } },
          { usersId: { $all: [targetUserId, currentUser] } },
        ],
      });

      Meteor.users.update(currentUser, {
        $set: { "profile.currentThreadId": newThread._id },
      });
    }
    Meteor.users.update(currentUser, {
      $set: { "profile.currentThreadId": thread._id },
    });
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
});
