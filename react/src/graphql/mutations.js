/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const addPaperComment = /* GraphQL */ `
  mutation AddPaperComment($doi: ID!, $userName: String, $text: String) {
    addPaperComment(doi: $doi, userName: $userName, text: $text) {
      doi
      timestamp
      text
      userName
      __typename
    }
  }
`;
