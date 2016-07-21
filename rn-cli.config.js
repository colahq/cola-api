'use strict';

var Blacklist = require('../../react-native/packager/blacklist.js');
var Path = require('path');

var Disavowed = [
  '/node_modules/react-native/Libraries/Components/ActivityIndicatorIOS/*',
  '/node_modules/react-native/Libraries/Components/DatePicker/*',
  '/node_modules/react-native/Libraries/Components/DatePickerAndroid/*',
  '/node_modules/react-native/Libraries/Components/DrawerAndroid/*',
  '/node_modules/react-native/Libraries/Modal/*',
  '/node_modules/react-native/Libraries/Components/Navigation/*',
  '/node_modules/react-native/Libraries/Picker/PickerIOS.*',
  '/node_modules/react-native/Libraries/Components/ProgressBarAndroid/*',
  '/node_modules/react-native/Libraries/Components/ProgressViewIOS/*',
  '/node_modules/react-native/Libraries/Components/SegmentedControlIOS/*',
  '/node_modules/react-native/Libraries/Components/SliderIOS/*',
  '/node_modules/react-native/Libraries/Components/StatusBar/*',
  '/node_modules/react-native/Libraries/Components/TabBarIOS/*',
  '/node_modules/react-native/Libraries/Components/ToastAndroid/*',
  '/node_modules/react-native/Libraries/Components/ToolbarAndroid/*',
  '/node_modules/react-native/Libraries/Components/ViewPager/*',
  '/node_modules/react-native/Libraries/Components/WebView/*',
  '/node_modules/react-native/Libraries/ActionSheetIOS/*',
  '/node_modules/react-native/Libraries/Utilities/BackAndroid.*',
  '/node_modules/react-native/Libraries/CameraRoll/*',
  '/node_modules/react-native/Libraries/Components/Intent/*',
  '/node_modules/react-native/Libraries/PushNotificationIOS/*',
  '/node_modules/react-native/Libraries/Settings/*',
  '/node_modules/react-native/Libraries/Components/TimePickerAndroid/*',
  '/node_modules/react-native/Libraries/Vibration/*',
  '/node_modules/react-native/Libraries/Components/SwitchAndroid/*',
  '/node_modules/react-native/Libraries/Components/SwitchIOS/*',
  '/node_modules/react-native/Libraries/Components/ScrollView/RecyclerViewBackedScrollView.*',
  '/node_modules/react-native/Libraries/Linking/*'
];

var GetBlacklistRE = function(platform) {
  return Blacklist(platform, Disavowed);
}

var GetProjectRoots = function() {
  return [Path.resolve(__dirname, '..')];
}

var GetAssetRoots = function() {
  return [];
}

var Configuration = {
  getBlacklistRE  : GetBlacklistRE,
  getProjectRoots : GetProjectRoots,
  getAssetRoots   : GetAssetRoots
};

module.exports = Configuration;
