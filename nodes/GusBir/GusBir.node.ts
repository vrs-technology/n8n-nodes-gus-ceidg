import type {
	IExecuteFunctions,
	IHttpRequestMethods,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IRequestOptions,
	NodeConnectionType,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

const REPORT_TYPES = [
	{ name: 'Osoba fizyczna - dane ogólne', value: 'BIR11OsFizycznaDaneOgolne' },
	{ name: 'Osoba fizyczna - działalność CEIDG', value: 'BIR11OsFizycznaDzialalnoscCeidg' },
	{ name: 'Osoba fizyczna - działalność rolnicza', value: 'BIR11OsFizycznaDzialalnoscRolnicza' },
	{ name: 'Osoba fizyczna - działalność pozostała', value: 'BIR11OsFizycznaDzialalnoscPozostala' },
	{ name: 'Osoba fizyczna - PKD', value: 'BIR11OsFizycznaPkd' },
	{ name: 'Osoba fizyczna - jednostki lokalne (lista)', value: 'BIR11OsFizycznaListaJednLokalnych' },
	{ name: 'Jednostka lokalna os. fizycznej', value: 'BIR11JednLokalnaOsFizycznej' },
	{ name: 'Jednostka lokalna os. fizycznej - PKD', value: 'BIR11JednLokalnaOsFizycznejPkd' },
	{ name: 'Osoba prawna', value: 'BIR11OsPrawna' },
	{ name: 'Osoba prawna - PKD', value: 'BIR11OsPrawnaPkd' },
	{ name: 'Osoba prawna - jednostki lokalne (lista)', value: 'BIR11OsPrawnaListaJednLokalnych' },
	{ name: 'Jednostka lokalna os. prawnej', value: 'BIR11JednLokalnaOsPrawnej' },
	{ name: 'Jednostka lokalna os. prawnej - PKD', value: 'BIR11JednLokalnaOsPrawnejPkd' },
	{ name: 'Spółka cywilna - wspólnicy', value: 'BIR11OsPrawnaSpCywilnaWspolnicy' },
	{ name: 'Typ podmiotu', value: 'BIR11TypPodmiotu' },
	{ name: 'Raport publiczny - osoba fizyczna', value: 'PublDaneRaportFizycznaOsoba' },
	{ name: 'Raport publiczny - os. prawna', value: 'PublDaneRaportPrawna' },
	{ name: 'Raport publiczny - działalność CEIDG', value: 'PublDaneRaportDzialalnoscFizycznejCeidg' },
	{ name: 'Raport publiczny - działalności os. prawnej', value: 'PublDaneRaportDzialalnosciPrawnej' },
	{ name: 'Raport publiczny - typ jednostki', value: 'PublDaneRaportTypJednostki' },
] as const;

const SUMMARY_REPORT_TYPES = [
	{ name: 'Nowe podmioty prawne i działalności os. fizycznych', value: 'BIR11NowePodmiotyPrawneOrazDzialalnosciOsFizycznych' },
	{ name: 'Zaktualizowane podmioty prawne i działalności os. fizycznych', value: 'BIR11AktualizowanePodmiotyPrawneOrazDzialalnosciOsFizycznych' },
	{ name: 'Skreślone podmioty prawne i działalności os. fizycznych', value: 'BIR11SkreslonePodmiotyPrawneOrazDzialalnosciOsFizycznych' },
	{ name: 'Nowe jednostki lokalne', value: 'BIR11NoweJednostkiLokalne' },
	{ name: 'Zaktualizowane jednostki lokalne', value: 'BIR11AktualizowaneJednostkiLokalne' },
	{ name: 'Skreślone jednostki lokalne', value: 'BIR11SkresloneJednostkiLokalne' },
] as const;

function handleGatewayError(node: any, response: any, itemIndex: number): never {
	const error = response?.error;
	const code = error?.code || 'UNKNOWN';
	const message = error?.message || 'Unknown gateway error';

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
		const gatewayUrl = (credentials.gatewayUrl as string).replace(/\/$/, '');

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;
				const options = this.getNodeParameter('options', i, {}) as { normalize?: boolean };
				let requestOptions: IRequestOptions;

				if (operation === 'search') {
					const searchBy = this.getNodeParameter('searchBy', i) as string;
					const identifier = this.getNodeParameter('identifier', i) as string;

					requestOptions = {
						method: 'POST' as IHttpRequestMethods,
						uri: `${gatewayUrl}/api/gus/search`,
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
						uri: `${gatewayUrl}/api/gus/report`,
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
						uri: `${gatewayUrl}/api/gus/summary`,
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

				const response = await this.helpers.requestWithAuthentication.call(
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
