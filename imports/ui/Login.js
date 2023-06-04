// @ts-ignore
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';

import './Login.html';
import './style/Login.css';

Template.login.events({
  'submit form'(event) {
    event.preventDefault();
    const { emailOrUsername } = event.target;
    const { password } = event.target;

    const emailOrUsernameValue = emailOrUsername.value;
    const passwordValue = password.value;

    let loginSelector;
    if (emailOrUsernameValue.includes('@')) {
      // L'entrée contient un '@', il s'agit donc d'un email
      loginSelector = { email: emailOrUsernameValue };
    } else {
      // L'entrée ne contient pas de '@', il s'agit donc d'un nom d'utilisateur
      loginSelector = { username: emailOrUsernameValue };
    }

    Meteor.loginWithPassword(loginSelector, passwordValue, error => {
      if (error) {
        if (error.reason === 'User not found') {
          emailOrUsername.value = '';
          emailOrUsername.placeholder = 'Email ou Nom d\'utilisateur incorrect';
          emailOrUsername.classList.add('incorrect-input');
          emailOrUsername.addEventListener('input', () => {
            emailOrUsername.classList.remove('incorrect-input');
            emailOrUsername.placeholder = 'Email ou Nom d\'utilisateur';
          });
        } else if (error.reason === 'Incorrect password') {
          password.value = '';
          password.placeholder = 'Mot de passe incorrect';
          password.classList.add('incorrect-input');
          password.addEventListener('input', () => {
            password.classList.remove('incorrect-input');
            password.placeholder = 'Mot de passe';
          });
        }
      } else {
        // Redirection vers la page chat après la connexion réussie
        FlowRouter.go('/chat');
        Meteor.call('userOnline', true);
      }
    });
  },
});
