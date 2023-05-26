import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import '../api/messages/methods';

import './style/Form.css';
import './Form.html';

Template.form.events({
  'submit .new-message'(event) {
    // Prevent default browser form submit
    event.preventDefault();

    // Get value from form elements
    const { target } = event;
    const text = target.text.value;

    if (text !== '') Meteor.call('messages.insert', text);

    const messageList = document.querySelector('.messages-list');
    setTimeout(() => {
      messageList.scrollTo({
        top: messageList.scrollHeight,
        behavior: 'smooth',
      });
    }, 10);

    // Clear form
    target.text.value = '';
  },
});
