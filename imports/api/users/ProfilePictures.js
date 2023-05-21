// @ts-ignore
import { FilesCollection } from 'meteor/ostrio:files';
import { Meteor } from 'meteor/meteor';

// eslint-disable-next-line import/prefer-default-export
export const ProfilePictures = new FilesCollection({
  collectionName: 'profilePictures',
});

if (Meteor.isServer) {
  Meteor.publish(
    'files.profilePictures.all',
    () => ProfilePictures.find().cursor,
  );
} else {
  // Subscribe to file's collections on Client
  Meteor.subscribe('files.profilePictures.all');
}
