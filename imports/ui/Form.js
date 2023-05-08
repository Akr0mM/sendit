import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { Messages } from '../api/messages/collections';
import '../api/messages/methods';

import './Form.html';

Template.form.events({
    'submit .new-message'(event) {
        // Prevent default browser form submit
        event.preventDefault();

        // Get value from form elements
        const target = event.target;
        const text = target.text.value;

        if (text != '') Meteor.call('messages.insert', text);

        // Clear form
        target.text.value = '';
    },
});
