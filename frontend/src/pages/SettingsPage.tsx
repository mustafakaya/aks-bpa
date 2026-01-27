import { useQuery } from '@tanstack/react-query'
import { Card, Button, Input, Spinner, Field } from '@fluentui/react-components'
import { Checkmark24Regular, Dismiss24Regular } from '@fluentui/react-icons'
import { getAuthStatus, validateCredentials } from '../services/api'
import { useState } from 'react'

export default function SettingsPage() {
  const [validating, setValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<{
    valid: boolean
    message: string
  } | null>(null)

  const { data: authStatus, isLoading } = useQuery({
    queryKey: ['authStatus'],
    queryFn: getAuthStatus,
  })

  const handleValidate = async () => {
    setValidating(true)
    setValidationResult(null)
    try {
      const result = await validateCredentials()
      setValidationResult(result)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Validation failed'
      setValidationResult({ valid: false, message: errorMessage })
    } finally {
      setValidating(false)
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-500 mt-1">Configure authentication and application settings</p>
      </div>

      {/* Azure Authentication */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Azure Authentication</h2>
        {isLoading ? (
          <Spinner />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div
                className={`w-3 h-3 rounded-full ${
                  authStatus?.authenticated ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <div>
                <p className="font-medium">
                  {authStatus?.authenticated ? 'Connected' : 'Not Connected'}
                </p>
                <p className="text-sm text-gray-500">
                  Auth Type: {authStatus?.auth_type || 'None'}
                </p>
                {authStatus?.tenant_id && (
                  <p className="text-sm text-gray-500">Tenant: {authStatus.tenant_id}</p>
                )}
              </div>
            </div>

            <div>
              <Button
                appearance="primary"
                onClick={handleValidate}
                disabled={validating}
              >
                {validating ? <Spinner size="tiny" /> : 'Validate Credentials'}
              </Button>
            </div>

            {validationResult && (
              <div
                className={`p-4 rounded-lg flex items-center gap-2 ${
                  validationResult.valid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}
              >
                {validationResult.valid ? (
                  <Checkmark24Regular />
                ) : (
                  <Dismiss24Regular />
                )}
                <span>{validationResult.message}</span>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Environment Variables */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Environment Configuration</h2>
        <p className="text-sm text-gray-600 mb-4">
          Configure the following environment variables for Azure authentication. You can set
          these in a <code className="bg-gray-100 px-1 rounded">.env</code> file in the backend
          directory.
        </p>
        <div className="space-y-4">
          <Field label="AZURE_TENANT_ID">
            <Input
              placeholder="Your Azure Tenant ID"
              disabled
              value={authStatus?.tenant_id || ''}
            />
          </Field>
          <Field label="AZURE_CLIENT_ID">
            <Input placeholder="Your Azure App Registration Client ID" disabled />
          </Field>
          <Field label="AZURE_CLIENT_SECRET">
            <Input placeholder="Your Azure App Registration Client Secret" type="password" disabled />
          </Field>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          Note: If no credentials are configured, the application will use DefaultAzureCredential
          which supports Azure CLI, managed identity, and other authentication methods.
        </p>
      </Card>

      {/* About */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">About AKS BPA</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            <strong>Version:</strong> 2.0.0
          </p>
          <p>
            <strong>Description:</strong> AKS Best Practices Assessment is a standalone tool for
            evaluating Azure Kubernetes Service clusters against the Azure Well-Architected
            Framework.
          </p>
          <p className="mt-4">
            <strong>References:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <a
                href="https://learn.microsoft.com/en-us/azure/well-architected/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Azure Well-Architected Framework
              </a>
            </li>
            <li>
              <a
                href="https://azure.github.io/Azure-Proactive-Resiliency-Library-v2/welcome/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Azure Proactive Resiliency Library (APRL)
              </a>
            </li>
            <li>
              <a
                href="https://learn.microsoft.com/en-us/azure/aks/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Azure Kubernetes Service Documentation
              </a>
            </li>
          </ul>
        </div>
      </Card>
    </div>
  )
}
