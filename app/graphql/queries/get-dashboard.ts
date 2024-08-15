import { gql } from "graphql-request";

export const getDashboardQuery = gql`
  {
    getDashboard {
      summary {
        totalAmountOwed
        numberOfCustomersOwing
        amountReceivedLastThirty
      }
      customersOwing {
        customerCode
        customerName
        amountOwing
      }
      unpaidInvoices {
        invoiceNumber
        dueDate
        status
        customerName
        total
      }
      latestJobs {
        date
        jobName
        customerName
        status
        quantity
        cost
        total
      }
      recentPayments {
        date
        customerName
        amount
      }
    }
  }
`;
