/**
 * Copyright (c) 2015, 2016 Cola, Inc. All rights reserved.
 * All rights reserved.
 *
 * @providesModule Conversation
 * @flow weak
 */

'use strict';

var React = require('react');
var ReactNative = require('react-native');
var {
    NativeModules,
} = ReactNative;
var Participant = require('./Participant.js');
var NativeConversation = NativeModules.Conversation;

/*
**  Because of node-haste usage, it's not possible for this module to require('EventEmitter')
**  directly.  node-haste sees this package as being in node_modules and not in the list for
**  providesModuleNodeModules.  Ideally, react-native would export EventEmitter, so it could
**  be used via that.  Instead, this ends up having to deep "link" to it instead.
*/
var EventEmitter = require('react-native/Libraries/EventEmitter/EventEmitter.js');
var Emitter = new EventEmitter();

/**
 *	Conversation represents a discussion among a number of participants.
 *	@class Conversation
 */
var Conversation = {

	/**
	 *	An array containing the known participants of the conversation. This list does not
	 *	include the `me` participant. Use `addParticipantsListener` to watch for changes of
	 *	participants being added or removed.
	 *	
	 *	This property may not be populated immediately on instantiation.
	 *	@property participants
	 *	@type Array
	 *	@default []
	 */
	participants: ([]: Array<Participant>),
	participantsByIdentifier:{},

	/**
	 *	If the current user is part of the conversation, this Participant will represent
	 *	them. If they are not part of the conversation, the value is `undefined`. Use
	 *	`addParticipantsListener` to watch for changes to this property.
	 *
	 *	This property may not be populated immediately on instantiation.
	 *	@property me
	 *	@type Participant
	 *	@default undefined
	 */
	me: undefined,

	/**
	 *	This method will return a participant given a participant identifier.  If the
	 *	participants are not yet known or the identifier is not found in the list of
	 *	participants, `undefined` will be returned.
	 *	@method	getParticipant
	 *	@param {String} identifier	A participant identifier.
	 *	@return {Participant} A Participant instance if found, otherwise `undefined`.
	 */
	getParticipant: function(identifier) {
		if (identifier && identifier.length) {
			if (this.me && (this.me.identifier === identifier)) {
				return this.me;
			}
			return this.participantsByIdentifier[identifier];
		}
	},

	/**
	 *	This method adds a function which will be executed whenever the list of
	 *	`participants` changes or if `me` changes.
	 *
	 *	More than one listener is supported.  A handler should be removed using
	 *	`removeParticipantsListener` when updates are no longer needed.
	 *	@method addParticipantsListener
	 *	@param {Function} handler	A function which is called whenever `participants` or `me`
	 *														changes.
	 */
  addParticipantsListener: function(handler: Function) {
    return Emitter.addListener('participants', handler);
  },
  
  /**
   *	Removes a function as a listener if it had previously been added using
   *	`addParticipantsListener`.
   *
   *	If `addParticipantsListener` had previously been called, this method should called.
   *	Without calling this method, the handler may be called at an unexpected time, or it
   *	could be leaked memory later.
   *	@method removeParticipantsListener
   *	@param {Function} handler	The listening function which had previously been added as
   *														a listener using `addParticipantsListener`.
   */
  removeParticipantsListener: function(subscription) {
    subscription.remove();
  }
};

NativeConversation.getParticipants((participants) => {
	
	var me;
	var all = [];
	var byIdentifier = {};
	var count = participants.length;
	
	if (0 < count) {
		
		var participant = participants[0];
		if (participant) {
			me = Participant.fromJSON(participant);
			all.push(me);
		}
		
		for (var i = 1; i < count; i++) {
			participant = participants[i];
			var add = Participant.fromJSON(participant)
			all.push(add);
			byIdentifier[add.identifier] = add;
		}
	}
	
	Conversation.me = me;
	Conversation.participants = all;
	Conversation.participantsByIdentifier = byIdentifier;

	Emitter.emit('participants');
});

module.exports = Conversation;
