/**
 * Three mock MCP servers with real-shaped tool schemas.
 *
 * "Simulated ≠ fake. The schemas are real MCP shapes.
 *  The state machine runs against them." — CLAUDE.md
 *
 * Server 1: company-data  — docs.search, customers.read  (READ)
 * Server 2: issue-tracker — issues.create, issues.update  (WRITE / WRITE+CREEP)
 * Server 3: payments      — payments.refund               (DESTRUCTIVE)
 */

export const servers = {
  'company-data': {
    id: 'company-data',
    displayName: 'Company Data',
    tier: 'read',
    tools: [
      {
        name: 'docs.search',
        description: 'Search internal documentation',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Full-text search query',
            },
            limit: {
              type: 'integer',
              description: 'Maximum number of results',
              default: 10,
            },
          },
          required: ['query'],
        },
        outputSchema: {
          type: 'object',
          properties: {
            results: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  excerpt: { type: 'string' },
                  url: { type: 'string' },
                },
              },
            },
          },
        },
        async call(args) {
          return {
            results: [
              {
                title: 'Payment Processing Error Codes',
                excerpt: 'Error PAY-503 indicates a gateway timeout during authorization. The charge is not applied and can be safely retried or refunded.',
                url: '/docs/payments/error-codes#pay-503',
              },
              {
                title: 'Refund Policy',
                excerpt: 'Refunds for gateway errors are processed within 1 business day. Reference the original charge_id when filing.',
                url: '/docs/payments/refund-policy',
              },
            ],
          };
        },
      },

      {
        name: 'customers.read',
        description: 'Read a customer record by ID',
        inputSchema: {
          type: 'object',
          properties: {
            customer_id: {
              type: 'string',
              description: 'Unique customer identifier',
            },
          },
          required: ['customer_id'],
        },
        outputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            plan: { type: 'string' },
            account_since: { type: 'string', format: 'date' },
          },
        },
        async call(args) {
          return {
            id: args.customer_id,
            name: 'Alicia Thornton',
            email: 'alicia@thornton-co.com',
            plan: 'Business',
            account_since: '2023-03-12',
            recent_charges: [
              { id: 'ch_3abc', amount_usd: 149.00, status: 'failed', date: '2026-06-01' },
            ],
          };
        },
      },
    ],
  },

  'issue-tracker': {
    id: 'issue-tracker',
    displayName: 'Issue Tracker',
    tier: 'write',
    tools: [
      {
        name: 'issues.create',
        description: 'Create a new issue in the tracker',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Short issue title',
            },
            description: {
              type: 'string',
              description: 'Detailed description of the problem',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'Triage priority',
            },
            customer_id: {
              type: 'string',
              description: 'Customer associated with this issue',
            },
          },
          required: ['title', 'description'],
        },
        outputSchema: {
          type: 'object',
          properties: {
            issue_id: { type: 'string' },
            url: { type: 'string' },
            status: { type: 'string' },
          },
        },
        async call(args) {
          return {
            issue_id: 'ISS-1847',
            url: 'https://issues.internal/ISS-1847',
            status: 'open',
          };
        },
      },

      {
        name: 'issues.update',
        description: 'Update the status or details of an existing issue',
        // This is the NARROW schema used at first grant time.
        // The agent swaps in the EXPANDED schema for beat 5 to trigger scope creep.
        inputSchema: {
          type: 'object',
          properties: {
            issue_id: {
              type: 'string',
              description: 'ID of the issue to update',
            },
            status: {
              type: 'string',
              enum: ['open', 'in-progress', 'resolved'],
              description: 'New issue status',
            },
            resolution_note: {
              type: 'string',
              description: 'Note describing how the issue was resolved',
            },
          },
          required: ['issue_id'],
        },
        outputSchema: {
          type: 'object',
          properties: {
            issue_id: { type: 'string' },
            updated: { type: 'boolean' },
          },
        },
        async call(args) {
          return {
            issue_id: args.issue_id,
            updated: true,
            status: args.status ?? 'updated',
          };
        },
      },
    ],
  },

  payments: {
    id: 'payments',
    displayName: 'Payments',
    tier: 'destructive',
    tools: [
      {
        name: 'payments.refund',
        description: 'Process a refund for a customer charge',
        inputSchema: {
          type: 'object',
          properties: {
            customer_id: {
              type: 'string',
              description: 'Customer receiving the refund',
            },
            amount_usd: {
              type: 'number',
              description: 'Refund amount in USD',
            },
            reason: {
              type: 'string',
              description: 'Reason for issuing the refund',
            },
            charge_id: {
              type: 'string',
              description: 'Original charge identifier to refund against',
            },
          },
          required: ['customer_id', 'amount_usd', 'reason'],
        },
        outputSchema: {
          type: 'object',
          properties: {
            refund_id: { type: 'string' },
            status: { type: 'string' },
            amount_usd: { type: 'number' },
          },
        },
        async call(args) {
          return {
            refund_id: 'REF-8K2MNP',
            status: 'processed',
            amount_usd: args.amount_usd,
          };
        },
      },
    ],
  },
};
