/**
 * Mobile entry point.
 *
 * React Native registers the root component through AppRegistry. The component
 * name MUST match `name` in app.json because the native Android activity looks
 * it up with `getMainComponentName()`.
 *
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
