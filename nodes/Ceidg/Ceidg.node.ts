import type {
	IExecuteFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	INode,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

function handleGatewayError(node: INode, response: Record<string, unknown>, itemIndex: number): never {
	const error = response?.error as Record<string, unknown> | undefined;
	const code = (error?.code as string) || 'UNKNOWN';
	const message = (error?.message as string) || 'Unknown gateway error';

	if (code === 'MONTHLY_LIMIT_EXCEEDED' || code === 'RATE_LIMIT_EXCEEDED') {
		throw new NodeOperationError(node, message, {
			itemIndex,
			description: 'Upgrade your plan or wait for the limit to reset.',
		});
	}

	if (code === 'ANONYMOUS_RATE_LIMIT' || code === 'ANONYMOUS_DAILY_LIMIT') {
		throw new NodeOperationError(node, message, {
			itemIndex,
			description: 'Register for a free API key to get higher limits.',
		});
	}

	throw new NodeOperationError(node, `Gateway error: ${message}`, { itemIndex });
}

export class Ceidg implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'CEIDG',
		name: 'ceidg',
		icon: 'file:ceidg.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Search Polish CEIDG register of sole proprietors and civil partnerships',
		defaults: {
			name: 'CEIDG',
		},
		inputs: ['main'] as NodeConnectionType[],
		outputs: ['main'] as NodeConnectionType[],
		credentials: [
			{
				name: 'gatewayApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Search Businesses',
						value: 'search',
						action: 'Search businesses in CEIDG',
						description: 'Search for sole proprietorships by various criteria',
					},
					{
						name: 'Get Firma by ID',
						value: 'getFirma',
						action: 'Get detailed firma data by CEIDG ID',
						description: 'Fetch full details of a single entry using its CEIDG UUID',
					},
					{
						name: 'Get Changes',
						value: 'getChanges',
						action: 'Get recent changes in CEIDG',
						description: 'Get list of company identifiers with recent changes',
					},
				],
				default: 'search',
			},

			// --- Search operation ---
			{
				displayName: 'Search By',
				name: 'searchBy',
				type: 'options',
				options: [
					{ name: 'NIP', value: 'nip' },
					{ name: 'REGON', value: 'regon' },
					{ name: 'Company Name (Nazwa)', value: 'nazwa' },
				],
				default: 'nip',
				displayOptions: { show: { operation: ['search'] } },
			},
			{
				displayName: 'Search Value',
				name: 'searchValue',
				type: 'string',
				default: '',
				required: true,
				description: 'The value to search for',
				displayOptions: { show: { operation: ['search'] } },
			},
			{
				displayName: 'Filters',
				name: 'filters',
				type: 'collection',
				placeholder: 'Add Filter',
				default: {},
				displayOptions: { show: { operation: ['search'] } },
				options: [
					{
						displayName: 'Status',
						name: 'status',
						type: 'options',
						options: [
							{ name: 'All', value: '' },
							{ name: 'Active', value: 'AKTYWNY' },
							{ name: 'Suspended', value: 'ZAWIESZONY' },
							{ name: 'Removed', value: 'WYKRESLONY' },
							{ name: 'Pending Start', value: 'OCZEKUJE_NA_ROZPOCZECIE_DZIALANOSCI' },
							{ name: 'Company Form Only', value: 'WYLACZNIE_W_FORMIE_SPOLKI' },
						],
						default: '',
					},
					{
						displayName: 'City (Miasto)',
						name: 'miasto',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Province (Województwo)',
						name: 'wojewodztwo',
						type: 'string',
						default: '',
					},
					{
						displayName: 'PKD Code',
						name: 'pkd',
						type: 'string',
						default: '',
						description: 'Polish Classification of Activities code',
					},
					{
						displayName: 'Limit',
						name: 'limit',
						type: 'number',
						default: 25,
						description: 'Max number of results to return',
						typeOptions: { minValue: 1, maxValue: 100 },
					},
					{
						displayName: 'Page',
						name: 'page',
						type: 'number',
						default: 1,
						description: 'Page number for pagination (starting from 1)',
						typeOptions: { minValue: 1 },
					},
				],
			},

			// --- Get Firma by ID operation ---
			{
				displayName: 'CEIDG ID',
				name: 'firmaId',
				type: 'string',
				default: '',
				required: true,
				description: 'The UUID of the firma from CEIDG (e.g. from search results field "id")',
				displayOptions: { show: { operation: ['getFirma'] } },
			},

			// --- Get Changes operation ---
			{
				displayName: 'Date From',
				name: 'changeDateFrom',
				type: 'string',
				default: '',
				required: true,
				description: 'Start date for changes (YYYY-MM-DD)',
				displayOptions: { show: { operation: ['getChanges'] } },
			},
			{
				displayName: 'Date To',
				name: 'changeDateTo',
				type: 'string',
				default: '',
				description: 'End date for changes (YYYY-MM-DD)',
				displayOptions: { show: { operation: ['getChanges'] } },
			},
			{
				displayName: 'Limit',
				name: 'changeLimit',
				type: 'number',
				default: 25,
				description: 'Max number of results',
				displayOptions: { show: { operation: ['getChanges'] } },
				typeOptions: { minValue: 1, maxValue: 100 },
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = await this.getCredentials('gatewayApi');
		const GATEWAY_URL = (credentials.gatewayUrl as string).replace(/\/$/, '');

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;
				let requestOptions: IHttpRequestOptions;

				if (operation === 'search') {
					const searchBy = this.getNodeParameter('searchBy', i) as string;
					const searchValue = this.getNodeParameter('searchValue', i) as string;
					const filters = this.getNodeParameter('filters', i, {}) as Record<string, string | number>;

					const qs: Record<string, string | number> = {
						searchBy,
						value: searchValue.trim(),
					};
					if (filters.status) qs.status = filters.status;
					if (filters.miasto) qs.miasto = filters.miasto;
					if (filters.wojewodztwo) qs.wojewodztwo = filters.wojewodztwo;
					if (filters.pkd) qs.pkd = filters.pkd;
					if (filters.limit) qs.limit = filters.limit;
					if (filters.page) qs.page = filters.page;

					requestOptions = {
						method: 'GET' as IHttpRequestMethods,
						url: `${GATEWAY_URL}/api/ceidg/search`,
						qs,
						json: true,
					};
				} else if (operation === 'getFirma') {
					const firmaId = this.getNodeParameter('firmaId', i) as string;

					requestOptions = {
						method: 'GET' as IHttpRequestMethods,
						url: `${GATEWAY_URL}/api/ceidg/firma/${encodeURIComponent(firmaId.trim())}`,
						json: true,
					};
				} else if (operation === 'getChanges') {
					const dateFrom = this.getNodeParameter('changeDateFrom', i) as string;
					const dateTo = this.getNodeParameter('changeDateTo', i) as string;
					const limit = this.getNodeParameter('changeLimit', i) as number;

					const qs: Record<string, string | number> = {
						dateFrom: dateFrom.trim(),
					};
					if (dateTo) qs.dateTo = dateTo.trim();
					if (limit) qs.limit = limit;

					requestOptions = {
						method: 'GET' as IHttpRequestMethods,
						url: `${GATEWAY_URL}/api/ceidg/changes`,
						qs,
						json: true,
					};
				} else {
					throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, {
						itemIndex: i,
					});
				}

				const response = await this.helpers.httpRequestWithAuthentication.call(
					this,
					'gatewayApi',
					requestOptions,
				);

				if (!response.success) {
					handleGatewayError(this.getNode(), response, i);
				}

				const data = response.data;
				if (data?.firmy && Array.isArray(data.firmy)) {
					for (const firma of data.firmy) {
						returnData.push({ json: firma, pairedItem: { item: i } });
					}
				} else if (Array.isArray(data)) {
					for (const item of data) {
						returnData.push({ json: item, pairedItem: { item: i } });
					}
				} else if (data) {
					returnData.push({ json: data, pairedItem: { item: i } });
				} else {
					returnData.push({ json: { message: 'No results found' }, pairedItem: { item: i } });
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
