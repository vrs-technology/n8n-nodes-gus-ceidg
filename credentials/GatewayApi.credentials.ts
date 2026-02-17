import type {
	IAuthenticateGeneric,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class GatewayApi implements ICredentialType {
	name = 'gatewayApi';
	displayName = 'Polish API Gateway';
	documentationUrl = 'https://github.com/vrs-technology/n8n-nodes-gus-ceidg';

	properties: INodeProperties[] = [
		{
			displayName: 'Gateway URL',
			name: 'gatewayUrl',
			type: 'string',
			default: 'https://n8n-gw.svirus.ovh',
			required: true,
			description: 'Base URL of the Polish API Gateway',
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description:
				'API key from the gateway portal. Leave empty for free anonymous access (limited to 100 requests/day).',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'X-Api-Key': '={{$credentials.apiKey}}',
			},
		},
	};
}
