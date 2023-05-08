import { Template } from 'meteor/templating';
import { Threads } from '../api/messages/collections';

import './App.html';
import './Chat.js';
import './Form.js';
import './Navbar.js';

const IS_LOADING_STRING = "isLoading";

window.addEventListener('beforeunload', function (event) {
    // Appeler la méthode pour supprimer l'identifiant de thread courant
    Meteor.call('removeCurrentThreadId');
});

Template.chat.onCreated(function chatContainerOnCreated() {
    this.state = new ReactiveDict();

    const handler = Meteor.subscribe('messages');
    Tracker.autorun(() => {
        this.state.set(IS_LOADING_STRING, !handler.ready());
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
    }
});

Template.chatContainerOpen.helpers({
    currentChatUsers() {
        const currentThreadId = Meteor.user()?.profile?.currentThreadId;
        console.log('currentThreadId:', currentThreadId);
        if (!currentThreadId) {
            console.log('currentThreadId is undefined');
            return ['none'];
        }

        const currentThread = Threads.findOne({ _id: currentThreadId });
        console.log('currentThread:', currentThread);
        if (!currentThread) {
            console.log(`currentThread with id ${currentThreadId} not found`);
            return ['none'];
        };

        console.log(currentThread);
        const users = currentThread.usersUsernames;
        console.log(users + ' on thread: ' + currentThreadId);
        return users;
    }
});