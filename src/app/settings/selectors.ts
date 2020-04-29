/***********************************************************
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License
 **********************************************************/
import { StateInterface } from '../shared/redux/state';
import { REPOSITORY_LOCATION_TYPE } from '../constants/repositoryLocationTypes';

export const getSettingsVisibleSelector = (state: StateInterface) => {
    return state && state.applicationState && state.applicationState.showSettings;
};

export const getRepositoryLocationSettingsSelector = (state: StateInterface) => {
    return state && state.applicationState && state.applicationState.repositoryLocations && state.applicationState.repositoryLocations.map(item => {
        return {
            repositoryLocationType: item,
            value:
                (item === REPOSITORY_LOCATION_TYPE.Local &&
                    state.applicationState.localFolderSettings &&
                    state.applicationState.localFolderSettings.path) || null
        };
    });
};

export const getLocalFolderPath = (state: StateInterface) => {
    return state && state.applicationState && state.applicationState.localFolderSettings && state.applicationState.localFolderSettings.path;
};
