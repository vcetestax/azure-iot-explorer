/***********************************************************
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License
 **********************************************************/
import { combineReducers } from 'redux';
import applicationStateReducer from '../../settings/reducers';
import azureResourceReducer from '../../azureResource/reducer';
import connectionStringsStateReducer from '../../connectionStrings/reducer';
import deviceListStateReducer from '../../devices/deviceList/reducer';
import deviceContentStateReducer from '../../devices/deviceContent/reducer';
import iotHubStateReducer from '../../iotHub/reducer';
import notificationsStateReducer from '../../notifications/reducer';
import moduleStateReducer from '../../devices/module/reducer';

const reducer = combineReducers({
    applicationState: applicationStateReducer,
    azureResourceState: azureResourceReducer,
    connectionStringsState: connectionStringsStateReducer,
    deviceContentState: deviceContentStateReducer,
    deviceListState: deviceListStateReducer,
    iotHubState: iotHubStateReducer,
    moduleState: moduleStateReducer,
    notificationsState: notificationsStateReducer
});

export default reducer;
