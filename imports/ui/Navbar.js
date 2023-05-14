import { Template } from "meteor/templating";
import { Threads } from "../api/messages/collections";
import moment from 'moment';
import 'moment/locale/fr';

moment.updateLocale('fr', {
  relativeTime: {
    future: 'dans %s',
    s: '%d s',
    m: '%d m',
    mm: '%d m',
    h: '%d h',
    hh: '%d h',
    d: '%d j',
    dd: '%d j'
  }
});

import "./Navbar.html";

let selectedChat;

Template.navbar.onCreated(function () {
  this.subscribe("users");
});

Template.navbar.helpers({
  chats() {
    // Créer tous les threads qui n'existent pas déjà
    Meteor.call('initThreads');

    const userId = Meteor.userId();
    const users = Meteor.users.find({ _id: { $ne: Meteor.userId() } }).fetch();
    const threads = [];

    // Trouver tous les threads existants et stocker la date du dernier message et le dernier message pour chaque thread
    Threads.find({ usersId: userId }).forEach((thread) => {
      const otherUserId = thread.usersId.find((id) => id !== userId);
      const lastChatAt = thread?.lastChatAt;
      const lastChatText = thread?.lastChatText;
      threads.push({ userId: otherUserId, lastChatAt, lastChatText });
    });

    // Ajouter les utilisateurs avec lesquels il n'y a pas de threads existants
    users.forEach((user) => {
      const otherUserId = user._id;
      if (!threads.some((thread) => thread.userId === otherUserId)) {
        threads.push({ userId: otherUserId, lastChatAt: new Date(0), lastChatText: "Envoyer votre premier message !" });
      }
    });

    // Trier les threads par date du dernier message et récupérer les utilisateurs correspondants
    const sortedThreads = threads.sort((a, b) => b.lastChatAt - a.lastChatAt);
    const sortedUsers = sortedThreads.map((thread) =>
      Meteor.users.findOne({ _id: thread.userId })
    );

    // Trouver le dernier message du thread et le stocker dans chaque utilisateur
    let userLastChat;
    userLastChat = sortedUsers.map(user => {
      let thread = Threads.findOne({
        $or: [
          { usersId: { $all: [Meteor.userId(), user._id] } },
          { usersId: { $all: [user._id, Meteor.userId()] } },
        ],
      });

      if (thread) {
        const lastChatAt = moment(thread.lastChatAt);
        let lastChatTimeAgo;

        if (moment().diff(lastChatAt, 'seconds') < 10) {
          lastChatTimeAgo = "à l'instant";
        } else if (moment().diff(lastChatAt, 'days') < 7) {
          lastChatTimeAgo = lastChatAt.locale('fr').fromNow(true);
        } else {
          lastChatTimeAgo = lastChatAt.locale('fr').format('L');
        }

        thread.lastChatTimeAgo = lastChatTimeAgo;
      } else {
        thread = {
          usersId: [Meteor.userId(), user._id],
          lastChatText: "Envoyer votre premier message !"
        };
      }

      user.lastChatText = thread.lastChatText;
      user.lastChatTimeAgo = thread.lastChatTimeAgo || "";
      return user;
    });

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
