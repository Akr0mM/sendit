import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';

import './Register.html';
import './style/Register.css';

Template.register.events({
    'submit .register-form': function (event) {
        event.preventDefault();
        const username = event.target.username;
        const email = event.target.email;
        const password = event.target.password;

        const usernameValue = username.value;
        const emailValue = email.value;
        const passwordValue = password.value;

        Meteor.call('appCreateUser', emailValue, usernameValue, passwordValue, (err) => {
            if (err.error === "username-already-exists") {
                username.value = "";
                username.placeholder = "Nom d'utilisateur déjà pris !";
                username.classList.add('incorrect-input');
                username.addEventListener('input', () => { username.classList.remove('incorrect-input'); username.placeholder = "Nom d'utilisateur"; });
            }

            if (err.error === "email-already-exists") {
                email.value = "";
                email.placeholder = "Email déjà pris !";
                email.classList.add('incorrect-input');
                email.addEventListener('input', () => { email.classList.remove('incorrect-input'); email.placeholder = "Email"; });
            }

            if (!err) {
                Meteor.loginWithPassword(emailValue, passwordValue, (err) => {
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