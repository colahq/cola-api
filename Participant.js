/**
 * Copyright (c) 2015, 2016 Cola, Inc. All rights reserved.
 * All rights reserved.
 *
 * @providesModule Participant
 * @flow weak
 */

'use strict';

/**
 *	Participant is a class which represents an individual who is part of a conversation.
 *	@class Participant
 */
class Participant extends Object {
  identifier: string;
  short_name: string;
  long_name: string;
  
  static fromJSON: Function;
  constructor(identifier, short_name, long_name) {
    super();

		/**
		 *	A string representing a unique identifier for this participant.
		 *	@property identifier
		 *	@type String
		 *	@final
		 */
    this.identifier = identifier;
    
		/**
		 *	A string containing the participant's short name.
		 *	@property shortName
		 *	@type String
		 *	@final
		 */
    this.shortName = short_name;
    
		/**
		 *	A string containing the participant's long name.
		 *	@property longName
		 *	@type String
		 *	@final
		 */
    this.longName = long_name;
    
    // These are provided only as a short-term bridge for old implementations
    // and will be removed very soon.
    this.short_name = short_name;
    this.long_name = long_name;

    Object.freeze(this);
  }
}

Participant.fromJSON = function(json) {
	return new Participant(json.identifier, json.short_name, json.long_name);
}

module.exports = Participant;
