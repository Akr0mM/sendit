// @ts-ignore
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import { Threads } from '../api/messages/collections';

import './App.html';
import './style/App.css';
import './Chat';
import './Form';
import './Navbar';
import './AccountSettingsModal';

import './Login';
import './Register';

const IS_LOADING_STRING = 'isLoading';

window.addEventListener('load', () => {
  Meteor.call('userOnline');
});

window.addEventListener('beforeunload', () => {
  Meteor.call('userOffline');
});

Template.chatMessages.onCreated(function chatContainerOnCreated() {
  this.state = new ReactiveDict();

  const handlerThreads = Meteor.subscribe('threads');
  const handlerMessages = Meteor.subscribe('messages');
  Tracker.autorun(() => {
    this.state.set(IS_LOADING_STRING, !handlerThreads.ready());
    this.state.set(IS_LOADING_STRING, !handlerMessages.ready());
  });
});

Template.chatMessages.helpers({
  isLoading() {
    const instance = Template.instance();
    return instance?.state.get(IS_LOADING_STRING);
  },
});

Template.chat.onCreated(() => {
  Accounts.onLogout(() => {
    FlowRouter.go('/login');
  });
});

Template.chat.helpers({
  openChat() {
    return Meteor.user()?.profile?.currentThreadId;
  },

  showModal() {
    // document.querySelector('.chat').classList.add('blur');
    // return true;

    if (Session.get('showModal')) {
      document.querySelector('.chat').classList.add('blur');
      return true;
    } else return false;
  },
});

Template.chatOpen.helpers({
  groupNames() {
    // return [{ username: 'Alex' }, { username: 'Bot' }, { username: 'Maxime' }, { username: 'Test' }];
    return [
      { username: 'Alondmessagemaisboncpasgrave' },
      { username: 'Bonjourlamiffvousallerbien?' },
      { username: 'Maximeleplusbeaugossedetoutlestempscuynedinguerie' },
      { username: 'Teslaoupasjveuxfaireuntestdelongétudeletsgoo' },
    ];
  },
});
