import type {
	IAuthenticateGeneric,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class GatewayApi implements ICredentialType {
	name = 'gatewayApi';
	displayName = 'Polish API Gateway';
	documentationUrl = 'https://github.com/user/n8n-nodes-gus-ceidg';

	properties: INodeProperties[] = [
		{
			displayName: 'Gateway URL',
			name: 'gatewayUrl',
			type: 'string',
			default: 'http://localhost:3100',
			description: 'URL of the API gateway',
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
