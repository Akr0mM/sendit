import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';

import './Login.html';
import './style/Login.css';

Template.login.events({
    'submit form': function (event, template) {
        event.preventDefault();
        const emailOrUsername = template.find('#emailOrUsername').value;
        const password = template.find('#password').value;

        let loginSelector;
        if (emailOrUsername.includes('@')) {
            // L'entrée contient un '@', il s'agit donc d'un email
            loginSelector = { email: emailOrUsername };
        } else {
            // L'entrée ne contient pas de '@', il s'agit donc d'un nom d'utilisateur
            loginSelector = { username: emailOrUsername };
        }

        Meteor.loginWithPassword(loginSelector, password, function (error) {
            if (error) {
                console.log(error.reason);
            } else {
                // Redirection vers la page chat après la connexion réussie
                FlowRouter.go('/chat');
            }
        });
    }
});