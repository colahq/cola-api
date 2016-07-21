/**
 * Copyright (c) 2016 Cola, Inc. All rights reserved.
 * All rights reserved.
 *
 * @providesModule PrivacyAccess
 */

'use strict';

var React = require('react');
var ReactNative = require('react-native');
var { NativeModules } = ReactNative;
var NativePrivacyAccess = NativeModules.PrivacyAccess;

/*
**  Because of node-haste usage, it's not possible for this module to require('BatchedBridge')
**  directly.  node-haste sees this package as being in node_modules and not in the list for
**  providesModuleNodeModules.  Ideally, react-native would export BatchedBridge, so it could
**  be used via that.  Instead, this ends up having to deep "link" to it instead.
*/
var BatchedBridge = require('react-native/Libraries/BatchedBridge/BatchedBridge.js');

/*
**  Because of node-haste usage, it's not possible for this module to require('EventEmitter')
**  directly.  node-haste sees this package as being in node_modules and not in the list for
**  providesModuleNodeModules.  Ideally, react-native would export EventEmitter, so it could
**  be used via that.  Instead, this ends up having to deep "link" to it instead.
*/
var EventEmitter = require('react-native/Libraries/EventEmitter/EventEmitter.js');
var Emitter = new EventEmitter();

var PrivacyAccess = {
  PRIVACY_SETTING_UNKNOWN    : NativePrivacyAccess.PRIVACY_SETTING_UNKNOWN,
  PRIVACY_SETTING_AUTHORIZED : NativePrivacyAccess.PRIVACY_SETTING_AUTHORIZED,
  PRIVACY_SETTING_DENIED     : NativePrivacyAccess.PRIVACY_SETTING_DENIED,
  PRIVACY_SETTING_RESTRICTED : NativePrivacyAccess.PRIVACY_SETTING_RESTRICTED
};
  
var SavedSettings = {};
  
PrivacyAccess._update = function(saved) {
  SavedSettings = saved;
	Emitter.emit('PrivacyAccess');
}
  
PrivacyAccess.getServiceSetting = function(service) {
  return (SavedSettings[service] || PrivacyAccess.PRIVACY_SETTING_UNKNOWN);
}
  
PrivacyAccess.requestAccessToService = function(service, callback) {
  NativePrivacyAccess.requestAccessToService(service, function(service, setting) {
    SavedSettings[service] = setting;
    callback(service, setting);
  });
}

PrivacyAccess.addPrivacyAccessListener = function(handler: Function) {
  return Emitter.addListener('PrivacyAccess', handler);
}
  
PrivacyAccess.removePrivacyAccessListener = function(subscription) {
  subscription.remove();
}

BatchedBridge.registerCallableModule('PrivacyAccess', PrivacyAccess);

module.exports = PrivacyAccess;
