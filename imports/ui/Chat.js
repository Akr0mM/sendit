import { Template } from 'meteor/templating';
import { Messages } from '../api/messages/collections';

import './Chat.html';

Template.chatMessages.helpers({
    messages() {
        const currentThreadId = Meteor.user()?.profile?.currentThreadId;
        if (!currentThreadId) return [];
        return Messages.find({ threadId: currentThreadId }, { sort: { createdAt: 1 } });
    },
});

Template.message.helpers({
    senderTagNeeded() {
        const currentThreadId = this.threadId;
        const messagesInThread = Messages.find({ threadId: currentThreadId }, { sort: { createdAt: 1 } }).fetch();
        let messages = [];
        messagesInThread.forEach(message => { messages.push(message.text); });
        const index = messages.indexOf(this.text);

        if (index === 0) return true;
        if (messagesInThread[index - 1].authorUsername === messagesInThread[index].authorUsername) return false;
        else return true;
    },

    getAuthorUsername() {
        if (this.authorUsername === Meteor.user().username) return 'Moi';
        else return this.authorUsername;
    }
});