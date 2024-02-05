### Description

This GitHub Action automates the process of exporting artifacts from Camunda 8 Optimize using the Camunda 8 Optimize API.
Designed to streamline workflows, this action facilitates the seamless transfer of dashboards and reports from Camunda Optimize.
### Usage

To use this action in your workflow, follow these steps:

**Set Up Camunda API Access:**

Ensure you have correct credentials to authorize the [Camunda Optimize API](https://docs.camunda.io/optimize/apis-tools/optimize-api/optimize-api-authentication/)

You can simply refer to this GitHub action in any GitHub workflow.:

```yaml
 - name: Import Optimize Artifacts 
        uses: apendo-c8/import-optimize-artifacts@v1
        with:
          optimize_api_url: 'URL to Optimize API'
          collection_id: 'Camunda 8 Optimize collection id'
          connection_type: 'Select "cloud" for cloud-based services or "self-managed" for local, self-hosted connections'
          source: 'Path to Optimize artifacts source'
          client_id: 'Optimize API client id'
          client_secret: 'Optimize API client secret'
          audience: 'Optimize API client audience'
          auth_server_url: 'Optimize API authentication server URL'
