import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';

import './Register.html';
import './style/Register.css';

Template.register.events({
    'submit .register-form': function (event) {
        event.preventDefault();

        var username = event.target.username.value;
        var email = event.target.email.value;
        var password = event.target.password.value;

        Meteor.call('appCreateUser', email, username, password, (err, res) => {
            console.log('createUser', err, res);
            if (!err) {
                Meteor.loginWithPassword(email, password, (err) => {
                    if (err) {
                        console.log('loginWithPassword', err);
                    } else {
                        FlowRouter.go('/chat');
                    }
                });
            }
        });
    }
});