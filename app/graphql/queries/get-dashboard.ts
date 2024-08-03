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
      latestJobs {
        date
        jobName
        customerName
        status
        quantity
        cost
        total
      }
    }
  }
`;
