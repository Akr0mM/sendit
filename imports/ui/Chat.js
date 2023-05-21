import { Template } from 'meteor/templating';
import moment from 'moment';
import { Messages } from '../api/messages/collections';

import './Chat.html';

Template.chatMessages.helpers({
  messagesGroups() {
    const userId = Meteor.userId();
    const currentThreadId = Meteor.user()?.profile?.currentThreadId;
    if (!currentThreadId) return [];

    const messages = Messages.find(
      { threadId: currentThreadId },
      { sort: { createdAt: 1 } },
    ).fetch();
    const messagesGroups = [];

    const months = [
      'JANVIER',
      'FEVRIER',
      'MARS',
      'AVRIL',
      'MAI',
      'JUIN',
      'JUILLET',
      'AOUT',
      'SEPTEMBRE',
      'OCTOBRE',
      'NOVEMBRE',
      'DECEMBRE',
    ];
    let currentGroup = null;
    let previousGroupLastMessage = null;

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const previousMessage = i > 0 ? messages[i - 1] : null;

      if (
        !previousMessage ||
        message.authorId !== previousMessage.authorId ||
        message.createdAt - previousMessage.createdAt > 60 * 60 * 1000
      ) {
        currentGroup = {
          authorUsername:
            message.authorId === userId ? 'Moi' : message.authorUsername,
          authorId: message.authorId,
          isMyMessage: message.authorId === userId,
          firstMessageTime: message.createdAt,
          messages: [{ text: message.text, date: message.createdAt }],
          showTimestamp: null,
          timestamp: undefined,
          lastMessage: previousGroupLastMessage,
        };
        messagesGroups.push(currentGroup);
      } else {
        currentGroup.messages.push({
          text: message.text,
          date: message.createdAt,
        });
      }

      previousGroupLastMessage = message;

      if (!currentGroup.showTimestamp && currentGroup.lastMessage) {
        const lastGroupMessageDate = moment(currentGroup.lastMessage.createdAt);
        const currentGroupDate = moment(currentGroup.firstMessageTime);

        const diffInDays = currentGroupDate.diff(lastGroupMessageDate, 'days');
        const diffInHours = currentGroupDate.diff(
          lastGroupMessageDate,
          'hours',
        );

        if (diffInDays > 0) {
          currentGroup.showTimestamp = true;
          const day = moment(currentGroupDate).get('date');
          const monthIndex = moment(currentGroupDate).get('month');
          const month = months[monthIndex];
          currentGroup.timestamp = `${day} ${month}`;
        } else if (diffInHours > 0) {
          currentGroup.showTimestamp = true;
          const hour = moment(currentGroupDate).get('hour');
          let minute = moment(currentGroupDate).get('minute');
          if (minute < 10) minute = `0${minute}`;
          currentGroup.timestamp = `${hour}:${minute}`;
        } else {
          currentGroup.showTimestamp = false;
          currentGroup.timestamp = null;
        }
      } else if (!currentGroup.lastMessage) {
        // first message of conversation
        const currentGroupDate = moment(currentGroup.firstMessageTime);
        currentGroup.showTimestamp = true;
        const day = moment(currentGroupDate).get('date');
        const monthIndex = moment(currentGroupDate).get('month');
        const month = months[monthIndex];
        currentGroup.timestamp = `${day} ${month}`;
      }
    }

    return messagesGroups;
  },

  groupName() {
    return 'Test';
  },
});

Template.messageGroup.onRendered(() => {
  const messageList = document.querySelector('.messages-list');
  messageList.scrollTo({ top: messageList.scrollHeight });
});
