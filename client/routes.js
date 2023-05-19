import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

FlowRouter.route('/', {
    triggersEnter: [function (context, redirect) {
        if (!Meteor.userId()) {
            redirect('/chat');
        } else {
            redirect('/chat');
        }
    }]
});

FlowRouter.route('/login', {
    action: function () {
        BlazeLayout.render('app', { mainTemplate: 'login' });
    }
});

FlowRouter.route('/register', {
    action: function () {
        BlazeLayout.render('app', { mainTemplate: 'register' });
    }
});

FlowRouter.route('/chat', {
    action: function () {
        if (!Meteor.userId()) return FlowRouter.redirect('/login');
        BlazeLayout.render('app', { mainTemplate: 'chat' });
    }
});
