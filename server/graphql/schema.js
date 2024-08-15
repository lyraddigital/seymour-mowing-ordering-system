const { buildSchema } = require("graphql");

const schema = buildSchema(`
    type DashboardSummary {
       totalAmountOwed: Float!
       numberOfCustomersOwing: Int!
       amountReceivedLastThirty: Float!
    }

    type DashboardCustomer {       
       customerCode: String!
       customerName: String!
       amountOwing: Float!
    }

    type DashboardUnpaidInvoice {
        invoiceNumber: String!
        dueDate: String!
        status: String!
        customerName: String!
        total: Float!
    }

    type DashboardJob {
        date: String!
        jobName: String!
        customerName: String!
        status: String!
        quantity: Int
        cost: Float
        total: Float
    }

    type DashboardRecentPayment {
        date: String!
        customerName: String!
        amount: Float!
    }

    type Dashboard {
        summary: DashboardSummary!
        customersOwing: [DashboardCustomer!]!
        unpaidInvoices: [DashboardUnpaidInvoice!]!
        latestJobs: [DashboardJob!]!
        recentPayments: [DashboardRecentPayment!]!
    }

    type Query {
      getDashboard: Dashboard
    }
`);

module.exports = schema;
