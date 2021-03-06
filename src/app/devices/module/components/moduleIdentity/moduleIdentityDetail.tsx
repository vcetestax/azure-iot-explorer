/***********************************************************
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License
 **********************************************************/
import * as React from 'react';
import { RouteComponentProps, Route } from 'react-router-dom';
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { Label } from 'office-ui-fabric-react/lib/Label';
import { Dialog, DialogFooter, DialogType } from 'office-ui-fabric-react/lib/Dialog';
import { PrimaryButton, DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { ResourceKeys } from '../../../../../localization/resourceKeys';
import { LocalizationContextConsumer, LocalizationContextInterface } from '../../../../shared/contexts/localizationContext';
import { getDeviceIdFromQueryString, getModuleIdentityIdFromQueryString } from '../../../../shared/utils/queryStringHelper';
import { REFRESH, REMOVE, NAVIGATE_BACK } from '../../../../constants/iconNames';
import { ROUTE_PARTS, ROUTE_PARAMS } from '../../../../constants/routes';
import { SAS_EXPIRES_MINUTES } from '../../../../constants/devices';
import { GetModuleIdentityActionParameters, DeleteModuleIdentityActionParameters } from '../../actions';
import { SynchronizationStatus } from '../../../../api/models/synchronizationStatus';
import { ModuleIdentity } from '../../../../api/models/moduleIdentity';
import { DeviceAuthenticationType } from '../../../../api/models/deviceAuthenticationType';
import MaskedCopyableTextFieldContainer from '../../../../shared/components/maskedCopyableTextFieldContainer';
import MultiLineShimmer from '../../../../shared/components/multiLineShimmer';
import SasTokenGenerationView from '../../../shared/components/sasTokenGenerationView';
import { ModuleIdentityDetailHeaderContainer } from './moduleIdentityDetailHeaderView';
import '../../../../css/_deviceDetail.scss';
import '../../../../css/_moduleIdentityDetail.scss';

export interface ModuleIdentityDetailDataProps {
    currentHostName: string;
    moduleIdentity: ModuleIdentity;
    moduleIdentitySyncStatus: SynchronizationStatus;
    moduleListSyncStatus: SynchronizationStatus;
}

export interface ModuleIdentityDetailDispatchProps {
    getModuleIdentity: (params: GetModuleIdentityActionParameters) => void;
    deleteModuleIdentity: (params: DeleteModuleIdentityActionParameters) => void;
}

export interface ModuleIdentityDetailState {
    showDeleteConfirmation: boolean;
    sasTokenExpiration: number;
    sasTokenConnectionString: string;
    sasTokenSelectedKey: string;
}

export type ModuleIdentityDetailProps = ModuleIdentityDetailDataProps & ModuleIdentityDetailDispatchProps;
export default class ModuleIdentityDetailComponent
    extends React.Component<ModuleIdentityDetailProps & RouteComponentProps, ModuleIdentityDetailState> {

    constructor(props: ModuleIdentityDetailProps & RouteComponentProps) {
        super(props);

        this.state = {
            sasTokenConnectionString: '',
            sasTokenExpiration: SAS_EXPIRES_MINUTES,
            sasTokenSelectedKey: '',
            showDeleteConfirmation: false
        };
    }

    public render(): JSX.Element {
        return (
            <LocalizationContextConsumer>
                {(context: LocalizationContextInterface) => (
                    <>
                        {this.showCommandBar(context)}
                        <Route component={ModuleIdentityDetailHeaderContainer} />
                        <div className="module-identity-detail">
                            {this.showModuleId(context)}
                            {this.props.moduleIdentitySyncStatus === SynchronizationStatus.working ?
                                <MultiLineShimmer/> :
                                this.showModuleIdentity(context)
                            }
                            {this.state.showDeleteConfirmation && this.deleteConfirmationDialog(context)}
                        </div>
                    </>
            )}
            </LocalizationContextConsumer>
        );
    }

    public componentDidMount() {
        this.retrieveData();
    }

    public componentDidUpdate(oldProps: ModuleIdentityDetailDataProps & RouteComponentProps) {
        if (getModuleIdentityIdFromQueryString(oldProps) !== getModuleIdentityIdFromQueryString(this.props)) {
            this.retrieveData();
        }
        if (this.props.moduleListSyncStatus === SynchronizationStatus.deleted) {
            this.navigateToModuleList();
        }
    }

    private readonly retrieveData = () => {
        const deviceId = getDeviceIdFromQueryString(this.props);
        const moduleId = getModuleIdentityIdFromQueryString(this.props);
        this.props.getModuleIdentity({
            deviceId,
            moduleId
        });
    }

    private readonly delete = () => {
        const deviceId = getDeviceIdFromQueryString(this.props);
        const moduleId = getModuleIdentityIdFromQueryString(this.props);
        this.props.deleteModuleIdentity({
            deviceId,
            moduleId
        });
        this.closeDeleteDialog();
    }

    private readonly showCommandBar = (context: LocalizationContextInterface) => {
        return (
            <CommandBar
                className="command"
                items={[
                    {
                        ariaLabel: context.t(ResourceKeys.moduleIdentity.detail.command.refresh),
                        disabled: this.props.moduleIdentitySyncStatus === SynchronizationStatus.working,
                        iconProps: {iconName: REFRESH},
                        key: REFRESH,
                        name: context.t(ResourceKeys.moduleIdentity.detail.command.refresh),
                        onClick: this.retrieveData
                    },
                    {
                        ariaLabel: context.t(ResourceKeys.moduleIdentity.detail.command.delete),
                        disabled: this.props.moduleIdentitySyncStatus === SynchronizationStatus.working,
                        iconProps: {iconName: REMOVE},
                        key: REMOVE,
                        name: context.t(ResourceKeys.moduleIdentity.detail.command.delete),
                        onClick: this.deleteConfirmation
                    }
                ]}
                farItems={[
                    {
                        ariaLabel: context.t(ResourceKeys.moduleIdentity.detail.command.back),
                        iconProps: {iconName: NAVIGATE_BACK},
                        key: NAVIGATE_BACK,
                        name: context.t(ResourceKeys.moduleIdentity.detail.command.back),
                        onClick: this.navigateToModuleList
                    }
                ]}
            />
        );
    }

    private readonly showModuleId = (context: LocalizationContextInterface) => {
        return (
            <MaskedCopyableTextFieldContainer
                ariaLabel={context.t(ResourceKeys.moduleIdentity.moduleId)}
                label={context.t(ResourceKeys.moduleIdentity.moduleId)}
                value={getModuleIdentityIdFromQueryString(this.props)}
                allowMask={false}
                readOnly={true}
                labelCallout={context.t(ResourceKeys.moduleIdentity.moduleIdTooltip)}
            />
        );
    }

    // tslint:disable-next-line:cyclomatic-complexity
    private readonly showModuleIdentity = (context: LocalizationContextInterface) => {
        const authType = (this.props.moduleIdentity && this.props.moduleIdentity.authentication && this.props.moduleIdentity.authentication.type || DeviceAuthenticationType.None).toLowerCase();

        switch (authType) {
            case DeviceAuthenticationType.SymmetricKey.toLowerCase():
                return this.renderSymmetricKeySection(context);
            case DeviceAuthenticationType.CACertificate.toLowerCase():
                return this.renderCaSection(context);
            case DeviceAuthenticationType.SelfSigned.toLowerCase():
                return this.renderSelfSignedSection(context);
            default:
                return (<></>);
        }
    }

    private readonly renderSymmetricKeySection = (context: LocalizationContextInterface) => {
        return (
            <>
                <MaskedCopyableTextFieldContainer
                    ariaLabel={context.t(ResourceKeys.moduleIdentity.authenticationType.symmetricKey.primaryKey)}
                    label={context.t(ResourceKeys.moduleIdentity.authenticationType.symmetricKey.primaryKey)}
                    value={this.props.moduleIdentity.authentication.symmetricKey.primaryKey}
                    allowMask={true}
                    readOnly={true}
                    labelCallout={context.t(ResourceKeys.moduleIdentity.authenticationType.symmetricKey.primaryKeyTooltip)}
                />

                <MaskedCopyableTextFieldContainer
                    ariaLabel={context.t(ResourceKeys.moduleIdentity.authenticationType.symmetricKey.secondaryKey)}
                    label={context.t(ResourceKeys.moduleIdentity.authenticationType.symmetricKey.secondaryKey)}
                    value={this.props.moduleIdentity.authentication.symmetricKey.secondaryKey}
                    allowMask={true}
                    readOnly={true}
                    labelCallout={context.t(ResourceKeys.moduleIdentity.authenticationType.symmetricKey.secondaryKeyTooltip)}
                />

                <MaskedCopyableTextFieldContainer
                    ariaLabel={context.t(ResourceKeys.moduleIdentity.authenticationType.symmetricKey.primaryConnectionString)}
                    label={context.t(ResourceKeys.moduleIdentity.authenticationType.symmetricKey.primaryConnectionString)}
                    value={this.generateConnectionString(this.props.moduleIdentity.authentication.symmetricKey.primaryKey)}
                    allowMask={true}
                    readOnly={true}
                />

                <MaskedCopyableTextFieldContainer
                    ariaLabel={context.t(ResourceKeys.moduleIdentity.authenticationType.symmetricKey.secondaryConnectionString)}
                    label={context.t(ResourceKeys.moduleIdentity.authenticationType.symmetricKey.secondaryConnectionString)}
                    value={this.generateConnectionString(this.props.moduleIdentity.authentication.symmetricKey.secondaryKey)}
                    allowMask={true}
                    readOnly={true}
                />

                {this.renderSasTokenSection()}
            </>
        );
    }

    private readonly renderCaSection = (context: LocalizationContextInterface) => {
        return (
            <>
                <Label>{context.t(ResourceKeys.moduleIdentity.authenticationType.ca.text)}</Label>
            </>
        );
    }

    private readonly renderSelfSignedSection = (context: LocalizationContextInterface) => {
        return (
            <>
                <Label>{context.t(ResourceKeys.moduleIdentity.authenticationType.selfSigned.text)}</Label>
                <MaskedCopyableTextFieldContainer
                    ariaLabel={context.t(ResourceKeys.moduleIdentity.authenticationType.selfSigned.primaryThumbprint)}
                    label={context.t(ResourceKeys.moduleIdentity.authenticationType.selfSigned.primaryThumbprint)}
                    value={this.props.moduleIdentity.authentication.x509Thumbprint.primaryThumbprint}
                    allowMask={true}
                    readOnly={true}
                    labelCallout={context.t(ResourceKeys.moduleIdentity.authenticationType.selfSigned.primaryThumbprintTooltip)}
                />
                <MaskedCopyableTextFieldContainer
                    ariaLabel={context.t(ResourceKeys.moduleIdentity.authenticationType.selfSigned.secondaryThumbprint)}
                    label={context.t(ResourceKeys.moduleIdentity.authenticationType.selfSigned.secondaryThumbprint)}
                    value={this.props.moduleIdentity.authentication.x509Thumbprint.secondaryThumbprint}
                    allowMask={true}
                    readOnly={true}
                    labelCallout={context.t(ResourceKeys.moduleIdentity.authenticationType.selfSigned.secondaryThumbprintTooltip)}
                />
            </>
        );
    }

    private readonly renderSasTokenSection = () => {
        const { moduleIdentity, currentHostName } = this.props;
        return (
            <SasTokenGenerationView
                activeAzureResourceHostName={currentHostName}
                moduleIdentity={moduleIdentity}
            />
        );
    }

    private readonly navigateToModuleList = () => {
        const path = this.props.match.url.replace(/\/moduleIdentity\/moduleDetail\/.*/, `/${ROUTE_PARTS.MODULE_IDENTITY}`);
        const deviceId = getDeviceIdFromQueryString(this.props);
        this.props.history.push(`${path}/?${ROUTE_PARAMS.DEVICE_ID}=${encodeURIComponent(deviceId)}`);
    }

    private readonly generateConnectionString = (key: string): string => {
        const deviceId = getDeviceIdFromQueryString(this.props);
        const moduleId = getModuleIdentityIdFromQueryString(this.props);
        const hostName = this.props.currentHostName;
        return `HostName=${hostName};DeviceId=${deviceId};ModuleId=${moduleId};SharedAccessKey=${key}`;
    }

    private readonly deleteConfirmationDialog = (context: LocalizationContextInterface) => {
        return (
            <div role="dialog">
                <Dialog
                    hidden={!this.state.showDeleteConfirmation}
                    onDismiss={this.closeDeleteDialog}
                    dialogContentProps={{
                        title: context.t(ResourceKeys.moduleIdentity.detail.deleteConfirmation),
                        type: DialogType.close,
                    }}
                    modalProps={{
                        isBlocking: true,
                    }}
                >
                    <DialogFooter>
                        <PrimaryButton onClick={this.delete} text={context.t(ResourceKeys.deviceLists.commands.delete.confirmationDialog.confirm)} />
                        <DefaultButton onClick={this.closeDeleteDialog} text={context.t(ResourceKeys.deviceLists.commands.delete.confirmationDialog.cancel)} />
                    </DialogFooter>
                </Dialog>
            </div>
        );
    }

    private readonly deleteConfirmation = () => {
        this.setState({
            showDeleteConfirmation: true
        });
    }

    private readonly closeDeleteDialog = () => {
        this.setState({
            showDeleteConfirmation: false
        });
    }
}
