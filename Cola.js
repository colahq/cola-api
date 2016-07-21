/**
 * Copyright (c) 2015, 2016 Cola, Inc. All rights reserved.
 * All rights reserved.
 *
 * @providesModule Cola
 * @flow
 */

'use strict';

var Bubble = require('./Bubble.js');
var Conversation = require('./Conversation.js');
var PrivacyAccess = require('./PrivacyAccess.js');

/**
 *	Cola is the set of all API available for use in creating bubbles for the Cola
 *	Messaging Platform.
 *	@module Cola
 *	@example
 *		var {Bubble, Conversation} = require('Cola');
 */
var Cola = {
  
  Bubble      : Bubble,
  
  Conversation: Conversation,
  
  PrivacyAccess: PrivacyAccess
};

module.exports = Cola;
