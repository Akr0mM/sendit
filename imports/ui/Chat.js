import { Template } from 'meteor/templating';
import { Messages } from '../api/messages/collections';

import './Chat.html';

Template.chat.helpers({
    messages() {
        const currentThreadId = Meteor.user()?.profile?.currentThreadId;
        if (!currentThreadId) return [];
        return Messages.find({ threadId: currentThreadId }, { sort: { createdAt: 1 } });
    },
});

Template.message.helpers({
    senderTagNeeded() {
        const currentThreadId = Meteor.user()?.profile?.currentThreadId;
        const messagesInThread = Messages.find({ threadId: currentThreadId }, { sort: { createdAt: 1 } }).fetch();
        return true;
    }
});