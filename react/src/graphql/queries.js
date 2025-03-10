/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const queryPaperComments = /* GraphQL */ `
  query QueryPaperComments($doi: ID!) {
    queryPaperComments(doi: $doi) {
      doi
      timestamp
      text
      userName
      __typename
    }
  }
`;
export const queryMostRecentPaperCommentsResolver = /* GraphQL */ `
  query QueryMostRecentPaperCommentsResolver {
    queryMostRecentPaperCommentsResolver {
      doi
      timestamp
      text
      userName
      __typename
    }
  }
`;
