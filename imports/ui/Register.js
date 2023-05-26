// @ts-ignore
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';

import './Register.html';
import './style/Register.css';

Template.register.events({
  'submit .register-form'(event) {
    event.preventDefault();
    const { username } = event.target;
    const { email } = event.target;
    const { password } = event.target;

    const usernameValue = username.value;
    const emailValue = email.value;
    const passwordValue = password.value;

    Meteor.call(
      'appCreateUser',
      emailValue,
      usernameValue,
      passwordValue,
      err => {
        if (err) {
          if (err.error === 'username-already-exists') {
            username.value = '';
            username.placeholder = 'Nom d\'utilisateur déjà pris !';
            username.classList.add('incorrect-input');
            username.addEventListener('input', () => {
              username.classList.remove('incorrect-input');
              username.placeholder = 'Nom d\'utilisateur';
            });
          }

          if (err.error === 'email-already-exists') {
            email.value = '';
            email.placeholder = 'Email déjà pris !';
            email.classList.add('incorrect-input');
            email.addEventListener('input', () => {
              email.classList.remove('incorrect-input');
              email.placeholder = 'Email';
            });
          }

          console.log('appCreateUser', err);
        } else {
          Meteor.loginWithPassword(emailValue, passwordValue, error => {
            if (error) {
              console.log('loginWithPassword', error);
            } else {
              FlowRouter.go('/chat');
            }
          });
        }
      },
    );
  },
});
