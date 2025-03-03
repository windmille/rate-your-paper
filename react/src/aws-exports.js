const config =  {
    API: {
        GraphQL: {
          endpoint: process.env.REACT_APP_APPSYNC_URL,
          region: 'us-east-1',
          defaultAuthMode: 'apiKey',
          apiKey: process.env.REACT_APP_APPSYNC_API_KEY
        }
    }
};

export default config;
