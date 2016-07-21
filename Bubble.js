/**
 * Copyright (c) 2015, 2016 Cola, Inc. All rights reserved.
 * All rights reserved.
 *
 * @providesModule Bubble
 * @flow weak
 */


'use strict';

var React = require('react');
var ReactNative = require('react-native');
var {
    AppRegistry,
    DeviceEventEmitter,
    NativeModules,
    requireNativeComponent,
    StyleSheet,
    View
} = ReactNative;
var NativeBubble = NativeModules.Bubble;
var Conversation = require('./Conversation.js');
var Participant = require('./Participant.js');

/*
**  Because of node-haste usage, it's not possible for this module to require('NativeMethodsMixin')
**  directly.  node-haste sees this package as being in node_modules and not in the list for
**  providesModuleNodeModules.  Ideally, react-native would export NativeMethodsMixin, so it could
**  be used via that.  Instead, this ends up having to deep "link" to it instead.
*/
var NativeMethodsMixin = require('react/lib/NativeMethodsMixin.js');

var REGISTRY_KEY = NativeBubble.REGISTRY_KEY;

var BUBBLE_INITIAL_PAYLOAD = NativeBubble.BUBBLE_INITIAL_PAYLOAD;

var BUBBLE_MODE = NativeBubble.BUBBLE_MODE;
var BUBBLE_SETUP_MODE = NativeBubble.BUBBLE_SETUP_MODE;
var BUBBLE_OUTGOING_MODE = NativeBubble.BUBBLE_OUTGOING_MODE;
var BUBBLE_INCOMING_MODE = NativeBubble.BUBBLE_INCOMING_MODE;
var BUBBLE_FULL_OUTGOING_MODE = NativeBubble.BUBBLE_FULL_OUTGOING_MODE;
var BUBBLE_FULL_INCOMING_MODE = NativeBubble.BUBBLE_FULL_INCOMING_MODE;
var Colors = NativeBubble.Colors;
var Configuration = NativeBubble.Config;
var Secrets = NativeBubble.Secrets;

const TAP_DISTANCE_SLOP :number = 25;
const TAP_MAXIMUM_TIME :number = 300;

type NativeEventType = {
    timestamp: number,
    locationX: number,
    locationY: number
};

/**
 *	Bubble is a class which provides the base services for creating Cola bubbles.
 *	@class Bubble
 *	@static
 */
var Bubble = {

  setSendEnabled: function(enabled) {
    NativeBubble.setSendEnabled(enabled);
  },
  
  sendMinorNotificationText: function(text) {
    NativeBubble.sendMinorNotificationText(text);
  },
  
  sendMajorNotificationText: function(text) {
    NativeBubble.sendMajorNotificationText(text);
  },
  
  setPreferredSize: function(width, height) {
    NativeBubble.setPreferredSize({width:width, height:height});
  }
};

Bubble.createBubble = function(BubbleComponent) {

  var result = React.createClass({
    tracking: (null: ?NativeEventType),
    participantListener: (null: ?EmitterSubscription),
    listener: (null: ?EmitterSubscription),
    setupCompleteListener: (null: ?EmitterSubscription),

    mixins: [NativeMethodsMixin],
     
    getStyle: function(mode :String) {

      var style;
      switch (mode) {
        case BUBBLE_SETUP_MODE:
        case BUBBLE_FULL_OUTGOING_MODE:
        case BUBBLE_FULL_INCOMING_MODE:
          style = {flex:1, flexDirection:'column', alignItems:'stretch', flexWrap:'nowrap', justifyContent:'flex-start', backgroundColor:Colors.BodyBackground};
          break;
        case BUBBLE_OUTGOING_MODE:
          style = {flex:1, flexDirection:'column', alignItems:'stretch', flexWrap:'nowrap', justifyContent:'flex-start', backgroundColor:Colors.OutgoingBackground};
          break;
        case BUBBLE_INCOMING_MODE:
          style = {flex:1, flexDirection:'column', alignItems:'stretch', flexWrap:'nowrap', justifyContent:'flex-start', backgroundColor:Colors.IncomingBackground};
          break;
      }
      
      return style;
    },
    
    getInitialState: function() {
      var properties = this.props;
      var mode = properties[BUBBLE_MODE];
      return {style      : this.getStyle(mode),
              sender     : (Conversation.getParticipant(properties.sid) || new Participant(properties.sid, "Unknown", "", "Unknown")),
              bubbleMode : mode,
              initial    : properties[BUBBLE_INITIAL_PAYLOAD]};
    },
    
    componentDidMount: function () {
    	
      if (!this.state.sender && Conversation.getParticipant(this.props.sid)) {
      	this.participantsChanged();
      }
    	
      this.participantListener = Conversation.addParticipantsListener(this.participantsChanged);
			
      this.listener = DeviceEventEmitter.addListener('BubbleModeChanged', (function(mode) {
      	var state = this.state;
      	state[BUBBLE_MODE] = mode;
      	state.style = this.getStyle(mode);
      	this.setState(state);
      }).bind(this));
      
      this.setupCompleteListener = DeviceEventEmitter.addListener('BubbleSetupComplete', (function() {
        if (this.refs.bubble && this.refs.bubble.bubbleSetupDidComplete) {
          this.refs.bubble.bubbleSetupDidComplete(this.onSetupComplete);
        }
        else {
          this.onSetupComplete();
        }
      }).bind(this));
    },
    
    componentWillUnmount: function () {
			Conversation.removeParticipantsListener(this.participantListener);
			this.listener.remove();
			this.setupCompleteListener.remove();
    },
    
    participantsChanged      : function () {
    	var sender = Conversation.getParticipant(this.props.sid);
    	if (sender !== this.state.sender) {
    		var state = this.state;
    		state.sender = sender;
      	this.setState(state);
      }
    },

    statics: {
      setSendEnabled: function(enabled) {
        Bubble.setSendEnabled(enabled);
      },
      sendMinorNotificationText: function(text) {
        Bubble.sendMinorNotificationText(text);
      },
      sendMajorNotificationText: function(text) {
        Bubble.sendMajorNotificationText(text);
      },
      setPreferredSize: function(width, height) {
        Bubble.setPreferredSize(width, height);
      }
    },
    
    handleOnLayout: function(evt) {
    
      var mode = this.state[BUBBLE_MODE];
      
      // If this is one of the bubble modes, set the preferred size based
      // upon the measured size.
      if ((BUBBLE_OUTGOING_MODE === mode) || (BUBBLE_INCOMING_MODE === mode)) {
        this.measure((ox, oy, width, height, px, py) => {
          NativeBubble.setPreferredSize({width:width, height:height});
        });
      }
    },
    
    onSetupComplete: function(initial) {
      NativeBubble.setupComplete(initial || {});
    },
    
    _onStartShouldSetResponder: function(evt) {
      var result = false;
      var mode = this.state[BUBBLE_MODE];
      if (((mode === BUBBLE_INCOMING_MODE) || (mode === BUBBLE_OUTGOING_MODE)) &&
          evt.nativeEvent && evt.nativeEvent.touches && (1 == evt.nativeEvent.touches.length)) {
        this.tracking = evt.nativeEvent.touches[0];
        result = true;
      }
      return result;
    },
    
    _onResponderReject: function(evt) {
      this.tracking = null;
    },
    
    _onResponderRelease: function(evt) {
      if (this.tracking &&
          evt.nativeEvent && evt.nativeEvent.touches && (0 == evt.nativeEvent.touches.length) &&
          evt.nativeEvent.changedTouches && (1 == evt.nativeEvent.changedTouches.length))
      {
        if (((evt.nativeEvent.changedTouches[0].timestamp - this.tracking.timestamp) <= TAP_MAXIMUM_TIME) &&
            (Math.abs(evt.nativeEvent.changedTouches[0].locationX - this.tracking.locationX) <= TAP_DISTANCE_SLOP) &&
            (Math.abs(evt.nativeEvent.changedTouches[0].locationY - this.tracking.locationY) <= TAP_DISTANCE_SLOP))
        {
          NativeBubble.presentFullScreen();
        }
        this.tracking = null;
      }
    },
    
    _onResponderMove: function(evt) {
      if (this.tracking &&
          ((evt.nativeEvent && evt.nativeEvent.touches && (1 < evt.nativeEvent.touches.length)) ||
          (evt.nativeEvent.changedTouches && (1 < evt.nativeEvent.changedTouches.length))))
      {
        this.tracking = null;
      }
    },
    
    _onResponderTerminationRequest: function(evt) {
      this.tracking = null;
      return true;
    },
    
    _onResponderTerminate: function(evt) {
      this.tracking = null;
    },
    
    render() {
      var result;
      var mode = this.state[BUBBLE_MODE];
      switch (mode) {
        case BUBBLE_INCOMING_MODE:
        case BUBBLE_OUTGOING_MODE:
          result = (
            <View style={this.state.style}
                  onStartShouldSetResponder={this._onStartShouldSetResponder}
                  onResponderReject={this._onResponderReject}
                  onResponderRelease={this._onResponderRelease}
                  onResponderMove={this._onResponderMove}
                  onResponderTerminationRequest={this._onResponderTerminationRequest}
                  onResponderTerminate={this._onResponderTerminate}>
              <BubbleComponent ref='bubble' bubbleMode={mode} sender={this.state.sender} initial={this.state.initial} />
            </View>);
          break;
        default:
          result = (
            <View style={this.state.style}>
              <BubbleComponent ref='bubble' bubbleMode={mode} sender={this.state.sender} initial={this.state.initial} />
            </View>);
          break;
      }
      return result;
    }
  });

  AppRegistry.registerComponent(REGISTRY_KEY, () => result);
  
  return result;
}

/**
 * 	Creates a registered Cola bubble from the provided specification.
 *	@method createBubbleClass
 *	@for Bubble
 *	@static
 *	@param {Object}	specification
 *					Bubble class specification to be used as the base component for the bubble.  This
 *					specification should follow the `React.createClass`
 *				  [guidelines](http://facebook.github.io/react/docs/top-level-api.html#react.createclass).
 *	@return {ReactClass}
 *					A registered Cola bubble.
 *	@example
 *					var myBubble = Bubble.createBubbleClass({
 *							render: function() {
 *								return (<Text>This is my bubble.</Text>);
 *							}
 *					});
 */
Bubble.createBubbleClass = function(specification) {
  return Bubble.createBubble(React.createClass(specification));
}

// **FIXME** Bridge for rename until all implementations have moved over.
Bubble.createBubbleRootClass = Bubble.createBubbleClass;

Bubble.BUBBLE_INITIAL_PAYLOAD = BUBBLE_INITIAL_PAYLOAD;

/**
 *	The property used to indicate the current mode of the bubble for `render()`.
 *	@property {String} BUBBLE_MODE
 *	@for Bubble
 *	@static
 *	@final
 */
Bubble.BUBBLE_MODE = BUBBLE_MODE;

/**
 * 	The property value for `bubbleMode` when the bubble is in the setup phase.
 *	@property {String} BUBBLE_SETUP_MODE
 *	@for Bubble
 *	@static
 *	@final
 */
Bubble.BUBBLE_SETUP_MODE = BUBBLE_SETUP_MODE;

/**
 * 	The property value for `bubbleMode` when the bubble is being displayed as an outgoing bubble.
 *	@property {String} BUBBLE_OUTGOING_MODE
 *	@for Bubble
 *	@static
 *	@final
 */
Bubble.BUBBLE_OUTGOING_MODE = BUBBLE_OUTGOING_MODE;
Bubble.BUBBLE_FULL_OUTGOING_MODE = BUBBLE_FULL_OUTGOING_MODE;

/**
 * 	The property value for `bubbleMode` when the bubble is being displayed as an incoming bubble.
 *	@property {String} BUBBLE_INCOMING_MODE
 *	@for Bubble
 *	@static
 *	@final
 */
Bubble.BUBBLE_INCOMING_MODE = BUBBLE_INCOMING_MODE;
Bubble.BUBBLE_FULL_INCOMING_MODE = BUBBLE_FULL_INCOMING_MODE;

Bubble.Colors = Object.freeze(Colors);

// These are for future use; they will each hold a propertyBag of bubble-specific
//  A) configuration values
//  B) secret values (like API_KEYs, etc.)
// ... both of which are provided by the Cola server, based on the bubble manifest identifier and version.
Bubble.Configuration = Object.freeze(Configuration);
Bubble.Secrets = Object.freeze(Secrets);

/**
 * 	This function takes one argument which is your bubble.  It will return a StyleSheet with
 *  several predefined styles.  These styles can be used individually or in combination
 *  with other styles in order to produce a common look and feel based upon the bubble's
 *  mode.  
 *	@method createStyleSheet
 *	@for Bubble
 *	@static
 *	@param {Bubble}	bubble
 *					Bubble class as returned by `createBubbleClass`.
 *	@return {StyleSheet}
 *					A StyleSheet instance as documented on the React documentation site. The
 *          styles in the style sheet are:
 *          + background
 *            This is a default background style for containers.  It can be combined with other styles as well.
 *          + text
 *            This is a default base text style.
 *          + link
 *            This is similar to the text style, but it’s intended for tappable links.
 *          + heading
 *            This is a default text style for text which is displayed as a heading.  This should be combined with the “text” or “link” style.
 *          + body
 *            This is a default text style for body text.  This should be combined with the “text” or “link” style.
 *          + alert
 *            This is a default text style for alert text.  This should be combined with the “text” or “link” style.
 *          + instructional
 *            This is a default text style for instructional text.  This should be combined with the “text” or “link” style.
 *          + notification
 *            This is a default text style for notification text.  This should be combined with the “text” or “link” style.
 */
Bubble.createStyleSheet = function(mode) {
  var styles = {
    background    : { /* Filled later. */ },
    text          : { /* Filled later. */ },
    link          : { /* Filled later. */ },
    heading       : {fontSize: 18},
    body          : {fontSize: 18},
    alert         : {fontSize: 12},
    instructional : {fontSize: 12},
    notification  : {fontSize: 9},
  };
  
  // **FIXME** link is missing underlining.
  
  switch (mode) {
    case BUBBLE_SETUP_MODE:
    case BUBBLE_FULL_OUTGOING_MODE:
    case BUBBLE_FULL_INCOMING_MODE:
      styles.background = {backgroundColor:Colors.BodyBackground};
      styles.text = {backgroundColor:Colors.Clear, color:Colors.BodyForeground};
      styles.link = {backgroundColor:Colors.Clear, color:Colors.BodyForeground};
      break;
    case BUBBLE_OUTGOING_MODE:
      styles.background = {backgroundColor:Colors.OutgoingBackground};
      styles.text = {backgroundColor:Colors.Clear, color:Colors.OutgoingText};
      styles.link = {backgroundColor:Colors.Clear, color:Colors.OutgoingText}; // FIXME
      break;
    case BUBBLE_INCOMING_MODE:
      styles.background = {backgroundColor:Colors.IncomingBackground};
      styles.text = {backgroundColor:Colors.Clear, color:Colors.IncomingText};
      styles.link = {backgroundColor:Colors.Clear, color:Colors.IncomingText}; // FIXME
      break;
  }
  
  return StyleSheet.create(styles);
}

// **FIXME** Hack to make the locale available.
Bubble.locale = NativeBubble.locale;

module.exports = Bubble;
