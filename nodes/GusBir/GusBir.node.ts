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

const REPORT_TYPES = [
	{ name: 'Natural Person - General Data', value: 'BIR11OsFizycznaDaneOgolne' },
	{ name: 'Natural Person - CEIDG Activity', value: 'BIR11OsFizycznaDzialalnoscCeidg' },
	{ name: 'Natural Person - Agricultural Activity', value: 'BIR11OsFizycznaDzialalnoscRolnicza' },
	{ name: 'Natural Person - Other Activity', value: 'BIR11OsFizycznaDzialalnoscPozostala' },
	{ name: 'Natural Person - PKD Codes', value: 'BIR11OsFizycznaPkd' },
	{ name: 'Natural Person - Local Units (List)', value: 'BIR11OsFizycznaListaJednLokalnych' },
	{ name: 'Local Unit of Natural Person', value: 'BIR11JednLokalnaOsFizycznej' },
	{ name: 'Local Unit of Natural Person - PKD Codes', value: 'BIR11JednLokalnaOsFizycznejPkd' },
	{ name: 'Legal Entity', value: 'BIR11OsPrawna' },
	{ name: 'Legal Entity - PKD Codes', value: 'BIR11OsPrawnaPkd' },
	{ name: 'Legal Entity - Local Units (List)', value: 'BIR11OsPrawnaListaJednLokalnych' },
	{ name: 'Local Unit of Legal Entity', value: 'BIR11JednLokalnaOsPrawnej' },
	{ name: 'Local Unit of Legal Entity - PKD Codes', value: 'BIR11JednLokalnaOsPrawnejPkd' },
	{ name: 'Civil Partnership - Partners', value: 'BIR11OsPrawnaSpCywilnaWspolnicy' },
	{ name: 'Entity Type', value: 'BIR11TypPodmiotu' },
	{ name: 'Public Report - Natural Person', value: 'PublDaneRaportFizycznaOsoba' },
	{ name: 'Public Report - Legal Entity', value: 'PublDaneRaportPrawna' },
	{ name: 'Public Report - CEIDG Activity', value: 'PublDaneRaportDzialalnoscFizycznejCeidg' },
	{ name: 'Public Report - Legal Entity Activity', value: 'PublDaneRaportDzialalnosciPrawnej' },
	{ name: 'Public Report - Entity Type', value: 'PublDaneRaportTypJednostki' },
] as const;

const SUMMARY_REPORT_TYPES = [
	{ name: 'New Legal Entities and Natural Person Activities', value: 'BIR11NowePodmiotyPrawneOrazDzialalnosciOsFizycznych' },
	{ name: 'Updated Legal Entities and Natural Person Activities', value: 'BIR11AktualizowanePodmiotyPrawneOrazDzialalnosciOsFizycznych' },
	{ name: 'Removed Legal Entities and Natural Person Activities', value: 'BIR11SkreslonePodmiotyPrawneOrazDzialalnosciOsFizycznych' },
	{ name: 'New Local Units', value: 'BIR11NoweJednostkiLokalne' },
	{ name: 'Updated Local Units', value: 'BIR11AktualizowaneJednostkiLokalne' },
	{ name: 'Removed Local Units', value: 'BIR11SkresloneJednostkiLokalne' },
] as const;

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

export class GusBir implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'GUS BIR (REGON)',
		name: 'gusBir',
		icon: 'file:gus.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Search Polish REGON business register (GUS BIR)',
		defaults: {
			name: 'GUS BIR',
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
						name: 'Search',
						value: 'search',
						action: 'Search company by NIP REGON or KRS',
						description: 'Find a company in the REGON database',
					},
					{
						name: 'Get Full Report',
						value: 'report',
						action: 'Get full report for a company',
						description: 'Get detailed report for a company by REGON',
					},
					{
						name: 'Get Summary Report',
						value: 'summary',
						action: 'Get summary report of database changes',
						description: 'Get summary of changes in the REGON database',
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
					{ name: 'KRS', value: 'krs' },
				],
				default: 'nip',
				displayOptions: { show: { operation: ['search'] } },
			},
			{
				displayName: 'Identifier',
				name: 'identifier',
				type: 'string',
				default: '',
				required: true,
				description: 'NIP, REGON, or KRS number to search for',
				displayOptions: { show: { operation: ['search'] } },
			},

			// --- Report operation ---
			{
				displayName: 'REGON',
				name: 'regon',
				type: 'string',
				default: '',
				required: true,
				description: '9 or 14-digit REGON number',
				displayOptions: { show: { operation: ['report'] } },
			},
			{
				displayName: 'Report Type',
				name: 'reportType',
				type: 'options',
				options: [...REPORT_TYPES],
				default: 'BIR11OsFizycznaDaneOgolne',
				displayOptions: { show: { operation: ['report'] } },
			},

			// --- Summary report operation ---
			{
				displayName: 'Date',
				name: 'summaryDate',
				type: 'string',
				default: '',
				required: true,
				description: 'Date in YYYY-MM-DD format (not earlier than 7 days ago)',
				displayOptions: { show: { operation: ['summary'] } },
			},
			{
				displayName: 'Summary Report Type',
				name: 'summaryReportType',
				type: 'options',
				options: [...SUMMARY_REPORT_TYPES],
				default: 'BIR11NowePodmiotyPrawneOrazDzialalnosciOsFizycznych',
				displayOptions: { show: { operation: ['summary'] } },
			},

			// --- Options ---
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Normalize Response',
						name: 'normalize',
						type: 'boolean',
						default: true,
						description: 'Whether to normalize response keys (remove prefixes, use camelCase)',
					},
				],
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
				const options = this.getNodeParameter('options', i, {}) as { normalize?: boolean };
				let requestOptions: IHttpRequestOptions;

				if (operation === 'search') {
					const searchBy = this.getNodeParameter('searchBy', i) as string;
					const identifier = this.getNodeParameter('identifier', i) as string;

					requestOptions = {
						method: 'POST' as IHttpRequestMethods,
						url: `${GATEWAY_URL}/api/gus/search`,
						body: {
							searchBy,
							identifier: identifier.trim(),
							normalize: options.normalize !== false,
						},
						json: true,
					};
				} else if (operation === 'report') {
					const regon = this.getNodeParameter('regon', i) as string;
					const reportType = this.getNodeParameter('reportType', i) as string;

					requestOptions = {
						method: 'POST' as IHttpRequestMethods,
						url: `${GATEWAY_URL}/api/gus/report`,
						body: {
							regon: regon.trim(),
							reportType,
							normalize: options.normalize !== false,
						},
						json: true,
					};
				} else if (operation === 'summary') {
					const date = this.getNodeParameter('summaryDate', i) as string;
					const reportType = this.getNodeParameter('summaryReportType', i) as string;

					requestOptions = {
						method: 'POST' as IHttpRequestMethods,
						url: `${GATEWAY_URL}/api/gus/summary`,
						body: {
							date: date.trim(),
							reportType,
							normalize: options.normalize !== false,
						},
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
				if (Array.isArray(data)) {
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
