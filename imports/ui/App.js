import { Template } from "meteor/templating";
import { Threads } from "../api/messages/collections";

import "./App.html";
import "./Chat.js";
import "./Form.js";
import "./Navbar.js";

const IS_LOADING_STRING = "isLoading";

// window.addEventListener('beforeunload', () => {
//     // Appeler la méthode pour supprimer l'identifiant de thread courant
//     Meteor.call('removeCurrentThreadId');
// });

window.addEventListener("load", () => {
  Meteor.call("userOnline");
});

window.addEventListener("beforeunload", () => {
  Meteor.call("userOffline");
});

Template.chat.onCreated(function chatContainerOnCreated() {
  this.state = new ReactiveDict();

  const handlerThreads = Meteor.subscribe("threads");
  const handlerMessages = Meteor.subscribe("messages");
  Tracker.autorun(() => {
    this.state.set(IS_LOADING_STRING, !handlerThreads.ready());
    this.state.set(IS_LOADING_STRING, !handlerMessages.ready());
  });
});

Template.chat.helpers({
  isLoading() {
    const instance = Template.instance();
    return instance.state.get(IS_LOADING_STRING);
  },
});

Template.show.helpers({
  openChat() {
    return Meteor.user()?.profile?.currentThreadId;
  },
});

Template.chatOpen.helpers({
  currentGroupName() {
    let groupName;
    const currentThreadId = Meteor.user()?.profile?.currentThreadId;
    if (!currentThreadId) {
      return ["none"];
    }
    const currentThread = Threads.findOne({ _id: currentThreadId });
    if (!currentThread) {
      return ["none"];
    }

    const usersId = currentThread.usersId;
    if (usersId.length > 2) groupName = currentThread?.groupName;
    else if (usersId.length == 1) {
      console.log("solo conv ?");
    } else
      usersId.forEach((userId) => {
        if (userId !== Meteor.userId())
          groupName = Meteor.users.findOne({ _id: userId })?.username;
      });

    return groupName;
  },
});
