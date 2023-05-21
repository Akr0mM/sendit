import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

FlowRouter.route('/', {
  triggersEnter: [
    function (context, redirect) {
      if (!Meteor.userId()) {
        redirect('/chat');
      } else {
        redirect('/chat');
      }
    },
  ],
});

FlowRouter.route('/login', {
  action() {
    BlazeLayout.render('app', { mainTemplate: 'login' });
  },
});

FlowRouter.route('/register', {
  action() {
    BlazeLayout.render('app', { mainTemplate: 'register' });
  },
});

FlowRouter.route('/chat', {
  // eslint-disable-next-line consistent-return
  action() {
    if (!Meteor.userId()) return FlowRouter.redirect('/login');
    BlazeLayout.render('app', { mainTemplate: 'chat' });
  },
});
