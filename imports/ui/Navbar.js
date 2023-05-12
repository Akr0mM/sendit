import { Template } from "meteor/templating";
import { Threads } from "../api/messages/collections";

import "./Navbar.html";

let selectedChat;

Template.navbar.onCreated(function () {
  this.subscribe("users");
});

Template.navbar.helpers({
  chats() {
    const userId = Meteor.userId();
    const users = Meteor.users.find({ _id: { $ne: Meteor.userId() } }).fetch();
    const threads = [];

    // Trouver tous les threads existants et stocker la date du dernier message pour chaque thread
    Threads.find({ usersId: userId }).forEach((thread) => {
      const otherUserId = thread.usersId.find((id) => id !== userId);
      const lastChatAt = thread?.lastChatAt || undefined;
      threads.push({ userId: otherUserId, lastChatAt });
    });

    // Ajouter les utilisateurs avec lesquels il n'y a pas de threads existants
    users.forEach((user) => {
      const otherUserId = user._id;
      if (!threads.some((thread) => thread.userId === otherUserId)) {
        threads.push({ userId: otherUserId, lastChatAt: new Date(0) });
      }
    });

    // Trier les threads par date du dernier message et récupérer les utilisateurs correspondants
    const sortedThreads = threads.sort((a, b) => b.lastChatAt - a.lastChatAt);
    const sortedUsers = sortedThreads.map((thread) =>
      Meteor.users.findOne({ _id: thread.userId })
    );

    // Trouver le dernier message du thread
    let userLastChat = []
    sortedUsers.forEach(user => {
        const thread = Threads.findOne({
            $or: [
              { usersId: { $all: [Meteor.userId(), user._id] } },
              { usersId: { $all: [user._id, Meteor.userId()] } },
            ],
          });

        user.lastChatText = thread?.lastChatText || "Envoyer votre premier message !";
        userLastChat.push(user)
    })

    console.log(userLastChat);

    return userLastChat;
  },
});

Template.navbar.events({
  "click .user-chat"(event) {
    let target = event.target;
    while (!target?.classList?.contains("user-chat")) {
      target = target.parentNode;
    }
    selectedChat?.classList?.remove("selected-chat");
    target.classList.add("selected-chat");
    selectedChat = target;

    Meteor.call("setCurrentThreadId", this._id);
  },
});
